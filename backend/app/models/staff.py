from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class Staff(Base):
    """Staff model - represents an AI agent with a role in the company"""
    __tablename__ = "staff"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(String(100), nullable=False)
    personality = Column(Text)
    expertise = Column(JSON)  # List of expertise areas
    system_prompt = Column(Text)
    
    # LLM Configuration
    llm_provider = Column(String(50), default="gemini")  # gemini or ollama
    llm_model = Column(String(100))  # Model name
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    company = relationship("Company", back_populates="staff")
    meeting_participations = relationship("MeetingParticipant", back_populates="staff", cascade="all, delete-orphan")
