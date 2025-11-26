# backend\app\services\llm_service.py
import google.generativeai as genai
import httpx
import json
import os
import base64
from typing import AsyncGenerator, Optional, List, Dict
from ..config import settings


class LLMService:
    """Service for LLM interactions with Gemini and Ollama support"""
    
    def __init__(self):
        # Configure Gemini
        if settings.gemini_api_key:
            genai.configure(api_key=settings.gemini_api_key)
        
        self.ollama_base_url = settings.ollama_base_url
    
    async def get_ollama_models(self) -> List[str]:
        """Fetch available models from Ollama RunPod instance"""
        if not self.ollama_base_url:
            return []
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{self.ollama_base_url}/api/tags")
                if response.status_code == 200:
                    data = response.json()
                    return [model["name"] for model in data.get("models", [])]
        except Exception as e:
            print(f"Error fetching Ollama models: {e}")
            return []
        
        return []
    
    async def generate_stream(
        self,
        prompt: str,
        system_prompt: str,
        provider: str = "gemini",
        model: Optional[str] = None,
        temperature: float = 0.7,
        image_path: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """
        Generate streaming response from LLM
        
        Args:
            prompt: User message
            system_prompt: System instructions (role, personality, context)
            provider: "gemini" or "ollama"
            model: Model name (uses default if not specified)
            temperature: Sampling temperature
            image_path: Optional path to image for vision analysis
        """
        if provider == "gemini":
            async for chunk in self._generate_gemini_stream(prompt, system_prompt, model, temperature, image_path):
                yield chunk
        elif provider == "ollama":
            # FIX: Pass image_path to Ollama
            async for chunk in self._generate_ollama_stream(prompt, system_prompt, model, temperature, image_path):
                yield chunk
        else:
            yield f"Error: Unknown provider '{provider}'"
    
    async def _generate_gemini_stream(
        self,
        prompt: str,
        system_prompt: str,
        model: Optional[str] = None,
        temperature: float = 0.7,
        image_path: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """Generate streaming response from Gemini"""
        try:
            model_name = model or settings.default_model
            
            # Create Gemini model
            gemini_model = genai.GenerativeModel(
                model_name=model_name
            )
            
            # Prepend system prompt to user prompt
            full_prompt = f"{system_prompt}\n\nUser: {prompt}"
            
            content = []
            
            # Add image if provided
            if image_path:
                try:
                    import PIL.Image
                    print(f"DEBUG: Loading image for Gemini from: {image_path}")
                    
                    # Open file explicitly to ensure access before passing to PIL
                    with open(image_path, 'rb') as f:
                        img = PIL.Image.open(f)
                        img.load()
                        content.append(img)
                        content.append(full_prompt)
                except Exception as e:
                    error_msg = f"[SYSTEM ERROR: Could not load image file. The AI will not be able to see it. Reason: {str(e)}]"
                    print(error_msg)
                    yield error_msg + "\n"
                    content = [f"{full_prompt}\n\n[SYSTEM: The user attempted to attach an image, but it failed to load on the server.]"]
            else:
                content = [full_prompt]
            
            # Generate streaming response
            response = await gemini_model.generate_content_async(
                content,
                generation_config=genai.types.GenerationConfig(
                    temperature=temperature,
                ),
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
        image_path: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """Generate streaming response from Ollama"""
        if not self.ollama_base_url:
            yield "Error: Ollama base URL not configured"
            return
        
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                payload = {
                    "model": model or "llama2",
                    "prompt": prompt,
                    "system": system_prompt,
                    "stream": True,
                    "options": {
                        "temperature": temperature
                    }
                }

                # FIX: Encode image for Ollama if present
                if image_path:
                    try:
                        print(f"DEBUG: Encoding image for Ollama from: {image_path}")
                        with open(image_path, "rb") as image_file:
                            encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
                        payload["images"] = [encoded_string]
                    except Exception as e:
                        print(f"Error encoding image for Ollama: {e}")
                        yield f"[SYSTEM ERROR: Failed to load image for Ollama: {str(e)}]\n"
                
                async with client.stream(
                    "POST",
                    f"{self.ollama_base_url}/api/generate",
                    json=payload
                ) as response:
                    async for line in response.aiter_lines():
                        if line:
                            try:
                                data = json.loads(line)
                                if "response" in data:
                                    yield data["response"]
                            except json.JSONDecodeError:
                                continue
                                
        except Exception as e:
            yield f"Error generating Ollama response: {str(e)}"

    def build_system_prompt(
        self,
        staff_name: str,
        role: str,
        personality: str,
        expertise: str,
        company_context: str,
        meeting_context: str,
        company_name: str = "MyVCO",
        company_description: str = ""
    ) -> str:
        """Build the system prompt for the AI staff member"""
        prompt_parts = [
            f"You are {staff_name}, a {role} at {company_name}.",
            f"{company_description}\n" if company_description else "",
            f"Your Personality: {personality}",
            f"Your Expertise: {expertise}\n",
            "Company Knowledge:",
            f"{company_context}\n" if company_context else "No specific context available.\n",
            "Meeting Context:",
            f"{meeting_context}\n" if meeting_context else "No previous context.\n",
        ]

        prompt_parts.append(
            "\nRespond naturally as this character. Stay in character and provide helpful, "
            "relevant responses based on your role and expertise. Be concise but informative."
        )
        
        return "\n".join(prompt_parts)
    
    async def analyze_image(
        self,
        image_path: str,
        context: Optional[str] = None
    ) -> str:
        """
        Analyze an image using Gemini Vision
        
        Args:
            image_path: Path to the image file
            context: Optional context about the image
        
        Returns:
            AI analysis of the image
        """
        try:
            import PIL.Image
            
            # Load image
            img = PIL.Image.open(image_path)
            
            # Create vision model
            model = genai.GenerativeModel('gemini-2.0-flash')
            
            # Build prompt
            if context:
                prompt = f"Analyze this image. Context: {context}\n\nProvide a detailed analysis including:\n- Subject matter and composition\n- Style and technique\n- Colors and mood\n- Notable features\n- Artistic merit or significance"
            else:
                prompt = "Analyze this image in detail. Describe what you see, the style, composition, colors, and any notable features."
            
            # Generate analysis
            response = await model.generate_content_async([prompt, img])
            
            return response.text
            
        except Exception as e:
            return f"Error analyzing image: {str(e)}"


# Singleton instance
llm_service = LLMService()
