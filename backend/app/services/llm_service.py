import google.generativeai as genai
import httpx
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
        temperature: float = 0.7
    ) -> AsyncGenerator[str, None]:
        """
        Generate streaming response from LLM
        
        Args:
            prompt: User message
            system_prompt: System instructions (role, personality, context)
            provider: "gemini" or "ollama"
            model: Model name (uses default if not specified)
            temperature: Sampling temperature
        """
        if provider == "gemini":
            async for chunk in self._generate_gemini_stream(prompt, system_prompt, model, temperature):
                yield chunk
        elif provider == "ollama":
            async for chunk in self._generate_ollama_stream(prompt, system_prompt, model, temperature):
                yield chunk
        else:
            yield f"Error: Unknown provider '{provider}'"
    
    async def _generate_gemini_stream(
        self,
        prompt: str,
        system_prompt: str,
        model: Optional[str] = None,
        temperature: float = 0.7
    ) -> AsyncGenerator[str, None]:
        """Generate streaming response from Gemini"""
        try:
            model_name = model or settings.default_model
            
            # Create Gemini model
            gemini_model = genai.GenerativeModel(
                model_name=model_name,
                system_instruction=system_prompt
            )
            
            # Generate streaming response
            response = await gemini_model.generate_content_async(
                prompt,
                generation_config=genai.GenerationConfig(
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
        temperature: float = 0.7
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
                
                async with client.stream(
                    "POST",
                    f"{self.ollama_base_url}/api/generate",
                    json=payload
                ) as response:
                    async for line in response.aiter_lines():
                        if line:
                            import json
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
        personality: Optional[str],
        expertise: Optional[List[str]],
        company_context: Optional[str] = None,
        meeting_context: Optional[str] = None
    ) -> str:
        """Build comprehensive system prompt for staff member"""
        
        prompt_parts = [
            f"You are {staff_name}, a {role} at the company.",
        ]
        
        if personality:
            prompt_parts.append(f"\nPersonality: {personality}")
        
        if expertise:
            expertise_str = ", ".join(expertise)
            prompt_parts.append(f"\nExpertise: {expertise_str}")
        
        if company_context:
            prompt_parts.append(f"\n\nCompany Context:\n{company_context}")
        
        if meeting_context:
            prompt_parts.append(f"\n\nMeeting Context:\n{meeting_context}")
        
        prompt_parts.append(
            "\n\nRespond naturally as this character. Stay in character and provide helpful, "
            "relevant responses based on your role and expertise. Be concise but informative."
        )
        
        return "".join(prompt_parts)


# Singleton instance
llm_service = LLMService()
