# backend\app\services\__init__.py
# Import services for easy access
from .llm_service import llm_service, LLMService
from .memory_service import memory_service, MemoryService

__all__ = [
    "llm_service",
    "LLMService",
    "memory_service",
    "MemoryService"
]

