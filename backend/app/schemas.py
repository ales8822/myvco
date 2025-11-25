from pydantic import BaseModel
from typing import Optional, List
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
    llm_provider: str = "gemini"
    llm_model: Optional[str] = None


class StaffCreate(StaffBase):
    pass


class StaffUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    personality: Optional[str] = None
    expertise: Optional[List[str]] = None
    system_prompt: Optional[str] = None
    llm_provider: Optional[str] = None
    llm_model: Optional[str] = None


class Staff(StaffBase):
    id: int
    company_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# Meeting Schemas
class MeetingCreate(BaseModel):
    title: str
    meeting_type: str = "general"
    participant_ids: List[int] = []  # Staff IDs
    template_id: Optional[int] = None  # Optional template


class MeetingParticipantInfo(BaseModel):
    """Participant information for meeting"""
    staff_id: int
    staff_name: str
    staff_role: str
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
    image_url: Optional[str] = None  # For image attachments
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
    participants: List[MeetingParticipantInfo] = []  # FIX: Include participants
    
    class Config:
        from_attributes = True


class SendMessageRequest(BaseModel):
    content: str
    sender_name: str = "User"
    image_data: Optional[str] = None  # Base64 encoded image


class SendMessageToAllRequest(BaseModel):
    """Request to get responses from all participants"""
    content: str
    sender_name: str = "User"
    image_data: Optional[str] = None


class UpdateMeetingStatusRequest(BaseModel):
    status: str  # "active" or "ended"


# Image Schemas
class MeetingImageCreate(BaseModel):
    image_data: str  # Base64 encoded
    description: Optional[str] = None


class MeetingImage(BaseModel):
    id: int
    meeting_id: int
    message_id: Optional[int]
    image_path: str
    image_url: str
    analysis: Optional[str]  # AI analysis of the image
    image_metadata: Optional[dict] = None  # Renamed from metadata
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
    status: str  # "pending", "completed"
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
