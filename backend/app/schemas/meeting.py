from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ParticipantConfig(BaseModel):
    staff_id: int
    llm_provider: str = "gemini"
    llm_model: Optional[str] = None

class MeetingCreate(BaseModel):
    title: str
    meeting_type: str = "general"
    participants: List[ParticipantConfig] = []
    template_id: Optional[int] = None

class MeetingParticipantInfo(BaseModel):
    staff_id: int
    staff_name: str
    staff_role: str
    department_id: Optional[int] = None
    department_name: Optional[str] = None
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
    target_path: Optional[str] = None

class UpdateMessageRequest(BaseModel):
    content: str

class SendMessageToAllRequest(BaseModel):
    content: str
    sender_name: str = "User"
    image_data: Optional[str] = None

class UpdateMeetingStatusRequest(BaseModel):
    status: str
    summary_llm_provider: Optional[str] = "gemini"
    summary_llm_model: Optional[str] = None
