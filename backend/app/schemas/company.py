from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CompanyBase(BaseModel):
    name: str
    description: Optional[str] = None
    industry: Optional[str] = None

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    industry: Optional[str] = None
    is_archived: Optional[bool] = None

class Company(CompanyBase):
    id: int
    created_at: datetime
    is_archived: bool = False
    
    class Config:
        from_attributes = True
