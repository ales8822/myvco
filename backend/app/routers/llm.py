from fastapi import APIRouter
from ..services import llm_service
from ..config import settings
from .. import schemas

router = APIRouter(prefix="/llm", tags=["llm"])


@router.get("/providers", response_model=schemas.LLMProvidersResponse)
async def get_llm_providers():
    """Get available LLM providers and models"""
    ollama_models = await llm_service.get_ollama_models()
    
    return {
        "providers": ["gemini", "ollama"],
        "default_provider": settings.default_llm_provider,
        "gemini_available": bool(settings.gemini_api_key),
        "ollama_available": bool(settings.ollama_base_url),
        "ollama_models": ollama_models
    }


@router.get("/ollama/models", response_model=schemas.OllamaModelsResponse)
async def get_ollama_models():
    """Fetch available Ollama models from RunPod"""
    models = await llm_service.get_ollama_models()
    return {
        "models": models,
        "base_url": settings.ollama_base_url
    }
