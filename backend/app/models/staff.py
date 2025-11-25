from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base

class Staff(Base):
    """Staff model - represents AI personas"""
    __tablename__ = "staff"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(String(255), nullable=False)
    personality = Column(Text)
    expertise = Column(JSON)  # Changed from Text to JSON to automatically handle lists
    system_prompt = Column(Text)  # Base system prompt for this persona
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    company = relationship("Company", back_populates="staff")
    meeting_participations = relationship("MeetingParticipant", back_populates="staff", cascade="all, delete-orphan")