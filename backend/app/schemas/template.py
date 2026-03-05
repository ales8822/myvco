from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class MeetingTemplateCreate(BaseModel):
    name: str
    description: str
    meeting_type: str
    system_prompt_additions: Optional[str] = None

class MeetingTemplate(BaseModel):
    id: int
    name: str
    description: str
    meeting_type: str
    system_prompt_additions: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True
