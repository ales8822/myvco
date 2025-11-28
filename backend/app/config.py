# backend\app\config.py
from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List


class Settings(BaseSettings):
    """Application configuration settings"""
    
    # Database
    database_url: str = "sqlite:///./myvco.db"
    
    # CORS - will be parsed from comma-separated string
    cors_origins: str = "http://localhost:5173,http://localhost:3000"
    
    # LLM Configuration
    gemini_api_key: str = ""
    ollama_base_url: str = ""
    default_llm_provider: str = "gemini"
    default_model: str = "gemini-2.0-flash"
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"
    
    def get_cors_origins(self) -> List[str]:
        """Parse CORS origins from comma-separated string"""
        return [origin.strip() for origin in self.cors_origins.split(",")]


settings = Settings()

