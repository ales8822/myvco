import google.generativeai as genai
import httpx
import json
import traceback
import os
import re
import base64
from typing import AsyncGenerator, Optional, List, Dict, Any
from sqlalchemy.orm import Session
from ..config import settings

class LLMService:
    """Service for LLM interactions with Gemini and Ollama support"""
    
    def __init__(self):
        # Configure Gemini initial load
        if settings.gemini_api_key:
            genai.configure(api_key=settings.gemini_api_key)
    
    async def get_ollama_models(self) -> List[str]:
        """Fetch available models from Ollama RunPod instance"""
        print(f"DEBUG: Checking Ollama connection at: {settings.ollama_base_url}")
        
        if not settings.ollama_base_url:
            print("DEBUG: Ollama URL is missing/empty.")
            return []
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                target_url = f"{settings.ollama_base_url}/api/tags"
                print(f"DEBUG: Sending GET request to: {target_url}")
                
                response = await client.get(target_url)
                print(f"DEBUG: Ollama Response Status: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    models = [model["name"] for model in data.get("models", [])]
                    print(f"DEBUG: Found models: {models}")
                    return models
                else:
                    print(f"DEBUG: Failed to get models. Response text: {response.text}")
                    return []
        except Exception as e:
            print(f"ERROR: Exception fetching Ollama models: {e}")
            return []
        
        return []

    async def get_max_tokens(self, provider: str, model_name: str, db: Session) -> int:
        from ..models import LlmModelLimit
        # Check cache
        cached = db.query(LlmModelLimit).filter(
            LlmModelLimit.provider == provider,
            LlmModelLimit.model_name == model_name
        ).first()
        if cached:
            return cached.max_tokens

        # Fallback default
        limit = 8192 
        
        if provider == "gemini":
            try:
                # gemini models need models/ prefix sometimes, but let's try direct first
                model_path = model_name if model_name.startswith("models/") else f"models/{model_name}"
                model_info = genai.get_model(model_path)
                if hasattr(model_info, 'input_token_limit'):
                    limit = model_info.input_token_limit
            except Exception as e:
                print(f"Error fetching gemini model limit for {model_name}: {e}")
                # Defaults based on model names
                if "flash" in model_name or "pro" in model_name:
                    limit = 1048576
                else:
                    limit = 32768
        
        elif provider == "ollama":
            if settings.ollama_base_url:
                try:
                    async with httpx.AsyncClient(timeout=10.0) as client:
                        resp = await client.post(f"{settings.ollama_base_url}/api/show", json={"model": model_name})
                        if resp.status_code == 200:
                            data = resp.json()
                            model_info = data.get("model_info", {})
                            for key, val in model_info.items():
                                if "context_length" in key:
                                    limit = int(val)
                                    break
                except Exception as e:
                    print(f"Error fetching ollama model limit for {model_name}: {e}")

        try:
            new_limit = LlmModelLimit(provider=provider, model_name=model_name, max_tokens=limit)
            db.add(new_limit)
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"Error caching model limit: {e}")
            
        return limit
    
    async def generate_stream(
        self,
        prompt: str,
        system_prompt: str,
        provider: str = "gemini",
        model: Optional[str] = None,
        temperature: float = 0.7,
        image_paths: List[str] = []
    ) -> AsyncGenerator[str, None]:
        if provider == "gemini":
            async for chunk in self._generate_gemini_stream(prompt, system_prompt, model, temperature, image_paths):
                yield chunk
        elif provider == "ollama":
            async for chunk in self._generate_ollama_stream(prompt, system_prompt, model, temperature, image_paths):
                yield chunk
        else:
            yield f"Error: Unknown provider '{provider}'"
    
    async def _generate_gemini_stream(
        self,
        prompt: str,
        system_prompt: str,
        model: Optional[str] = None,
        temperature: float = 0.7,
        image_paths: List[str] = []
    ) -> AsyncGenerator[str, None]:
        """Generate streaming response from Gemini"""
        try:
            model_name = model or settings.default_model
            gemini_model = genai.GenerativeModel(model_name=model_name)
            
            full_prompt = f"{system_prompt}\n\nUser: {prompt}"
            content = []
            
            if image_paths:
                import PIL.Image
                for img_path in image_paths:
                    try:
                        with open(img_path, 'rb') as f:
                            img = PIL.Image.open(f)
                            img.load()
                            content.append(img)
                    except Exception as e:
                        yield f"[SYSTEM ERROR: Could not load image {img_path}: {str(e)}]\n"
                
                content.append(full_prompt)
            else:
                content = [full_prompt]
            
            response = await gemini_model.generate_content_async(
                content,
                generation_config=genai.types.GenerationConfig(temperature=temperature),
                stream=True
            )
            
            async for chunk in response:
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            yield f"Error generating Gemini response: {str(e)}"

    async def _generate_ollama_stream(
        self,
        prompt: str,
        system_prompt: str,
        model: Optional[str] = None,
        temperature: float = 0.7,
        image_paths: List[str] = []
    ) -> AsyncGenerator[str, None]:
        """Generate streaming response from Ollama"""
        if not settings.ollama_base_url:
            yield "Error: Ollama base URL not configured"
            return
        
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                payload = {
                    "model": model or "llama2",
                    "prompt": prompt,
                    "system": system_prompt,
                    "stream": True,
                    "options": {"temperature": temperature}
                }

                if image_paths:
                    encoded_images = []
                    for img_path in image_paths:
                        try:
                            print(f"DEBUG: Encoding image for Ollama from: {img_path}")
                            with open(img_path, "rb") as image_file:
                                encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
                                encoded_images.append(encoded_string)
                        except Exception as e:
                            print(f"Error encoding image {img_path} for Ollama: {e}")
                            yield f"[SYSTEM ERROR: Failed to load image {img_path} for Ollama: {str(e)}]\n"
                    
                    if encoded_images:
                        payload["images"] = encoded_images
                
                target_url = f"{settings.ollama_base_url}/api/generate"
                print(f"DEBUG: Connecting to Ollama at {target_url} with model {payload['model']}")

                async with client.stream("POST", target_url, json=payload) as response:
                    if response.status_code != 200:
                        error_content = await response.read()
                        error_msg = f"Ollama HTTP Error {response.status_code}: {error_content.decode('utf-8')}"
                        print(f"ERROR: {error_msg}")
                        yield error_msg
                        return

                    async for line in response.aiter_lines():
                        if line:
                            try:
                                data = json.loads(line)
                                if "error" in data:
                                    error_msg = f"Ollama API Error: {data['error']}"
                                    print(f"ERROR: {error_msg}")
                                    yield error_msg
                                    return
                                if "response" in data:
                                    yield data["response"]
                            except json.JSONDecodeError:
                                continue
                                
        except Exception as e:
            print("ERROR: Exception in _generate_ollama_stream:")
            traceback.print_exc()
            yield f"Error generating Ollama response: {repr(e)}"

    def resolve_dependencies(self, text: str, db: Session) -> str:
        """
        Replace @tag_name with content from LibraryItem table.
        """
        if not text or not db:
            return text
            
        matches = re.findall(r'@(\w+)', text)
        
        if not matches:
            return text
            
        from ..models import LibraryItem
        
        resolved_text = text
        for slug in matches:
            item = db.query(LibraryItem).filter(LibraryItem.slug == slug).first()
            if item:
                pattern = f"@{slug}\\b"
                resolved_text = re.sub(pattern, f"\\n[Start of {item.name}]\\n{item.content}\\n[End of {item.name}]\\n", resolved_text)
        
        return resolved_text

    def build_system_prompt(
        self, 
        staff_name, 
        role, 
        personality, 
        expertise, 
        company_context, 
        meeting_context, 
        company_name="MyVCO", 
        company_description="", 
        system_prompt="", # NEW: Added personal instructions param
        knowledge_base="", # NEW: Added knowledge base param
        db: Session = None,
        context_settings: Optional[Dict[str, bool]] = None
    ):
        """
        Builds a system prompt from various context pieces.
        If context_settings is provided, it filters which blocks are included.
        Returns the final prompt string.
        """
        blocks = self.build_structured_prompt_blocks(
            staff_name=staff_name,
            role=role,
            personality=personality,
            expertise=expertise,
            company_context=company_context,
            meeting_context=meeting_context,
            company_name=company_name,
            company_description=company_description,
            system_prompt=system_prompt,
            knowledge_base=knowledge_base,
            db=db,
            context_settings=context_settings
        )
        
        enabled_parts = [b["content"] for b in blocks if b["enabled"]]
        enabled_parts.append("\\nRespond naturally as this character.")
        return "\\n".join(enabled_parts)

    def build_structured_prompt_blocks(
        self,
        staff_name,
        role,
        personality,
        expertise,
        company_context,
        meeting_context,
        company_name="MyVCO",
        company_description="",
        system_prompt="",
        knowledge_base="", # NEW
        db: Session = None,
        context_settings: Optional[Dict[str, bool]] = None
    ) -> List[Dict[str, Any]]:
        # Resolve dependencies in personality, expertise, personal instructions, and knowledge base
        if db:
            if personality:
                personality = self.resolve_dependencies(personality, db)
            
            if system_prompt:
                system_prompt = self.resolve_dependencies(system_prompt, db)

            if knowledge_base:
                knowledge_base = self.resolve_dependencies(knowledge_base, db)
            
            if isinstance(expertise, list):
                expertise_str = ", ".join(expertise)
                expertise_str = self.resolve_dependencies(expertise_str, db)
            else:
                expertise_str = self.resolve_dependencies(str(expertise or ""), db)
        else:
            expertise_str = ", ".join(expertise) if isinstance(expertise, list) else str(expertise or "")

        settings = context_settings or {
            "personality": True,
            "expertise": True,
            "company_context": True,
            "meeting_context": True,
            "personal_instructions": True,
            "knowledge_base": True
        }

        blocks = [
            {
                "id": "personality",
                "label": "Staff Personality",
                "content": f"You are {staff_name}, a {role} at {company_name}.\n{company_description}\nYour Personality: {personality}" if personality else f"You are {staff_name}, a {role} at {company_name}.\n{company_description}",
                "enabled": settings.get("personality", True)
            },
            {
                "id": "expertise",
                "label": "Staff Expertise",
                "content": f"Your Expertise: {expertise_str}",
                "enabled": settings.get("expertise", True)
            },
            {
                "id": "knowledge_base",
                "label": "Agent Knowledge Base",
                "content": f"Agent Knowledge Base:\n{knowledge_base}",
                "enabled": settings.get("knowledge_base", True) and bool(knowledge_base)
            },
            {
                "id": "personal_instructions",
                "label": "Personal Instructions",
                "content": f"Personal Instructions:\n{system_prompt}",
                "enabled": settings.get("personal_instructions", True) and bool(system_prompt)
            },
            {
                "id": "company_context",
                "label": "Company Knowledge",
                "content": f"Company Knowledge:\n{company_context}" if company_context else "Company Knowledge:\nNo specific context available.",
                "enabled": settings.get("company_context", True)
            },
            {
                "id": "meeting_context",
                "label": "Meeting Context",
                "content": f"Meeting Context:\n{meeting_context}" if meeting_context else "Meeting Context:\nNo previous context.",
                "enabled": settings.get("meeting_context", True)
            }
        ]
        return blocks
    
    async def analyze_image(self, image_path, context=None):
        try:
            import PIL.Image
            img = PIL.Image.open(image_path)
            model = genai.GenerativeModel('gemini-2.0-flash')
            prompt = f"Analyze this image. Context: {context}" if context else "Analyze this image in detail."
            response = await model.generate_content_async([prompt, img])
            return response.text
        except Exception as e:
            return f"Error analyzing image: {str(e)}"

llm_service = LLMService()