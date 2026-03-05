from pydantic import BaseModel
from typing import Optional, List

class OllamaModelsResponse(BaseModel):
    models: List[str]
    base_url: Optional[str]
    
class LLMProvidersResponse(BaseModel):
    providers: List[str]
    default_provider: str
    gemini_available: bool
    ollama_available: bool
    ollama_models: List[str]
