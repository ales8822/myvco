from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ActionItemCreate(BaseModel):
    description: str
    assigned_to: Optional[str] = None

class ActionItem(BaseModel):
    id: int
    meeting_id: int
    description: str
    assigned_to: Optional[str]
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True
