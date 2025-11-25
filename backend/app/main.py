from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import init_db
from .routers import (
    companies_router,
    staff_router,
    meetings_router,
    knowledge_router,
    llm_router
)

# Create FastAPI app
app = FastAPI(
    title="MyVCO API",
    description="My Virtual Company - AI-powered virtual company management",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(companies_router)
app.include_router(staff_router)
app.include_router(meetings_router)
app.include_router(knowledge_router)
app.include_router(llm_router)


@app.on_event("startup")
def startup_event():
    """Initialize database on startup"""
    init_db()


@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message": "Welcome to MyVCO API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}
