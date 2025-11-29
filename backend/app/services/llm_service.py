import google.generativeai as genai
import httpx
import json
import traceback
import os
import base64
from typing import AsyncGenerator, Optional, List, Dict
from ..config import settings

class LLMService:
    """Service for LLM interactions with Gemini and Ollama support"""
    
    def __init__(self):
        # Configure Gemini initial load
        if settings.gemini_api_key:
            genai.configure(api_key=settings.gemini_api_key)
    
    async def get_ollama_models(self) -> List[str]:
        """Fetch available models from Ollama RunPod instance"""
        # Debug: Print what URL we are trying to use
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
            
            # Load all images if provided
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
            # Increase timeout for cold starts (e.g. model loading)
            async with httpx.AsyncClient(timeout=120.0) as client:
                payload = {
                    "model": model or "llama2",
                    "prompt": prompt,
                    "system": system_prompt,
                    "stream": True,
                    "options": {"temperature": temperature}
                }

                # Encode all images if provided
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
                    
                    # Check for HTTP errors (e.g., 404 Model Not Found, 500 Internal Error)
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
            # Log full traceback to backend terminal for easier debugging
            print("ERROR: Exception in _generate_ollama_stream:")
            traceback.print_exc()
            # Return detailed error to UI
            yield f"Error generating Ollama response: {repr(e)}"

    def build_system_prompt(self, staff_name, role, personality, expertise, company_context, meeting_context, company_name="MyVCO", company_description=""):
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
        prompt_parts.append("\nRespond naturally as this character.")
        return "\n".join(prompt_parts)
    
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