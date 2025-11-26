# backend\app\routers\__init__.py
# Import routers for easy access
from .companies import router as companies_router
from .staff import router as staff_router
from .meetings import router as meetings_router
from .knowledge import router as knowledge_router
from .llm import router as llm_router

__all__ = [
    "companies_router",
    "staff_router",
    "meetings_router",
    "knowledge_router",
    "llm_router"
]

