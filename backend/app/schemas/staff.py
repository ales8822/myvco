from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class StaffBase(BaseModel):
    name: str
    role: str
    personality: Optional[str] = None
    expertise: Optional[List[str]] = None
    system_prompt: Optional[str] = None

class StaffCreate(StaffBase):
    department_id: Optional[int] = None

class StaffUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    personality: Optional[str] = None
    expertise: Optional[List[str]] = None
    system_prompt: Optional[str] = None
    department_id: Optional[int] = None

class CompanyShort(BaseModel):
    id: int
    name: str
    class Config:
        from_attributes = True

class Staff(StaffBase):
    id: int
    companies: List[CompanyShort] = []
    department_id: Optional[int] = None
    department_name: Optional[str] = None
    is_active: bool = True
    fired_at: Optional[datetime] = None
    fired_reason: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class StaffRestore(BaseModel):
    company_id: Optional[int] = None
    department_id: Optional[int] = None
