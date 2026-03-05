from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class KnowledgeBase(BaseModel):
    title: str
    content: str
    source: Optional[str] = None

class KnowledgeCreate(KnowledgeBase):
    pass

class Knowledge(KnowledgeBase):
    id: int
    company_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True
