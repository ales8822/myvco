from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic import BaseModel
from ..config import settings as app_settings

router = APIRouter(prefix="/settings", tags=["settings"])

# Robustly find .env file
BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_PATH = BASE_DIR / ".env"

def _write_env(key: str, value: str):
    """Write a single key=value pair to the .env file."""
    lines = []
    if ENV_PATH.exists():
        with open(ENV_PATH, "r", encoding="utf-8") as f:
            lines = f.readlines()
    
    key_found = False
    new_lines = []
    
    for line in lines:
        if line.strip().startswith(f"{key}="):
            new_lines.append(f"{key}={value}\n")
            key_found = True
        else:
            new_lines.append(line)
            
    if not key_found:
        if lines and not lines[-1].endswith('\n'):
            new_lines.append('\n')
        new_lines.append(f"{key}={value}\n")
        
    with open(ENV_PATH, "w", encoding="utf-8") as f:
        f.writelines(new_lines)
    
    os.environ[key] = value

@router.get("/", response_model=dict)
def get_settings():
    return {
        "gemini_api_key": app_settings.gemini_api_key,
        # Return the active configuration, not just the env var
        "runpod_url": app_settings.ollama_base_url, 
    }

class SettingsUpdate(BaseModel):
    gemini_api_key: str | None = None
    runpod_url: str | None = None

@router.post("/", response_model=dict)
def update_settings(payload: SettingsUpdate):
    try:
        if payload.gemini_api_key is not None:
            # Update .env
            _write_env("GEMINI_API_KEY", payload.gemini_api_key)
            # Update Runtime Config
            app_settings.gemini_api_key = payload.gemini_api_key
            import google.generativeai as genai
            genai.configure(api_key=payload.gemini_api_key)
        
        if payload.runpod_url is not None:
            # Clean url
            clean_url = payload.runpod_url.rstrip("/")
            
            # Update .env (Save as OLLAMA_BASE_URL because that is what config.py reads on restart)
            _write_env("OLLAMA_BASE_URL", clean_url)
            
            # Update Runtime Config
            app_settings.ollama_base_url = clean_url
            
        return {
            "gemini_api_key": app_settings.gemini_api_key,
            "runpod_url": app_settings.ollama_base_url,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save settings: {str(e)}")