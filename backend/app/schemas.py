from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime


# Company Schemas
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


class Company(CompanyBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# Staff Schemas
class StaffBase(BaseModel):
    name: str
    role: str
    personality: Optional[str] = None
    expertise: Optional[List[str]] = None
    system_prompt: Optional[str] = None
    # Removed LLM fields from here


class StaffCreate(StaffBase):
    pass


class StaffUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    personality: Optional[str] = None
    expertise: Optional[List[str]] = None
    system_prompt: Optional[str] = None


class Staff(StaffBase):
    id: int
    company_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# Meeting Schemas
class ParticipantConfig(BaseModel):
    """Configuration for a participant in a specific meeting"""
    staff_id: int
    llm_provider: str = "gemini"
    llm_model: Optional[str] = None

class MeetingCreate(BaseModel):
    title: str
    meeting_type: str = "general"
    participants: List[ParticipantConfig] = []  # Changed from list of IDs to config objects
    template_id: Optional[int] = None


class MeetingParticipantInfo(BaseModel):
    """Participant information for meeting response"""
    staff_id: int
    staff_name: str
    staff_role: str
    llm_provider: str
    llm_model: Optional[str]
    joined_at: datetime
    
    class Config:
        from_attributes = True


class MeetingMessage(BaseModel):
    id: int
    meeting_id: int
    staff_id: Optional[int]
    sender_type: str
    sender_name: str
    content: str
    image_url: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class Meeting(BaseModel):
    id: int
    company_id: int
    title: str
    meeting_type: str
    status: str
    summary: Optional[str]
    created_at: datetime
    ended_at: Optional[datetime]
    participants: List[MeetingParticipantInfo] = []
    
    class Config:
        from_attributes = True


class SendMessageRequest(BaseModel):
    content: str
    sender_name: str = "User"
    image_data: Optional[str] = None


class SendMessageToAllRequest(BaseModel):
    content: str
    sender_name: str = "User"
    image_data: Optional[str] = None


class UpdateMeetingStatusRequest(BaseModel):
    status: str


# Image Schemas
class MeetingImageCreate(BaseModel):
    image_data: str
    description: Optional[str] = None


class MeetingImage(BaseModel):
    id: int
    meeting_id: int
    message_id: Optional[int]
    image_path: str
    image_url: str
    analysis: Optional[str]
    image_metadata: Optional[dict] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


# Action Item Schemas
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


# Knowledge Schemas
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


# LLM Schemas
class OllamaModelsResponse(BaseModel):
    models: List[str]
    base_url: Optional[str]


class LLMProvidersResponse(BaseModel):
    providers: List[str]
    default_provider: str
    gemini_available: bool
    ollama_available: bool
    ollama_models: List[str]


# Template Schemas
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