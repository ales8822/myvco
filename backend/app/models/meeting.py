# backend\app\models\meeting.py
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class Meeting(Base):
    """Meeting model - represents a meeting session"""
    __tablename__ = "meetings"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    title = Column(String(255), nullable=False)
    meeting_type = Column(String(50), default="general")
    status = Column(String(20), default="active")
    summary = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime)
    
    # Relationships
    company = relationship("Company", back_populates="meetings")
    participants = relationship("MeetingParticipant", back_populates="meeting", cascade="all, delete-orphan")
    messages = relationship("MeetingMessage", back_populates="meeting", cascade="all, delete-orphan")
    images = relationship("MeetingImage", back_populates="meeting", cascade="all, delete-orphan")
    action_items = relationship("ActionItem", back_populates="meeting", cascade="all, delete-orphan")


class MeetingParticipant(Base):
    """MeetingParticipant model - links staff to meetings with specific LLM config"""
    __tablename__ = "meeting_participants"
    
    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id"), nullable=False)
    staff_id = Column(Integer, ForeignKey("staff.id"), nullable=False)
    
    # Dynamic LLM Configuration for this specific meeting
    llm_provider = Column(String(50), default="gemini")
    llm_model = Column(String(100), nullable=True)
    
    joined_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    meeting = relationship("Meeting", back_populates="participants")
    staff = relationship("Staff", back_populates="meeting_participations")


class MeetingMessage(Base):
    """MeetingMessage model - stores conversation messages"""
    __tablename__ = "meeting_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id"), nullable=False)
    staff_id = Column(Integer, ForeignKey("staff.id"), nullable=True)
    sender_type = Column(String(20), nullable=False)
    sender_name = Column(String(255))
    content = Column(Text, nullable=False)
    image_url = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    meeting = relationship("Meeting", back_populates="messages")


class MeetingImage(Base):
    """MeetingImage model - stores images uploaded in meetings"""
    __tablename__ = "meeting_images"
    
    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id"), nullable=False)
    message_id = Column(Integer, ForeignKey("meeting_messages.id"), nullable=True)
    image_path = Column(String(500), nullable=False)
    analysis = Column(Text)
    image_metadata = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    meeting = relationship("Meeting", back_populates="images")


class ActionItem(Base):
    """ActionItem model - tracks action items from meetings"""
    __tablename__ = "action_items"
    
    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id"), nullable=False)
    description = Column(Text, nullable=False)
    assigned_to = Column(String(255))
    status = Column(String(20), default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    
    meeting = relationship("Meeting", back_populates="action_items")


class MeetingTemplate(Base):
    """MeetingTemplate model - predefined meeting templates"""
    __tablename__ = "meeting_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    meeting_type = Column(String(50), nullable=False)
    system_prompt_additions = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
