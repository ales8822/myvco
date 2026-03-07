# backend\app\models\staff.py
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, JSON, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from typing import Optional, List
from ..database import Base

class Staff(Base):
    """Staff model - represents AI personas"""
    __tablename__ = "staff"
    
    id = Column(Integer, primary_key=True, index=True)
    # Removing company_id for many-to-many 
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    name = Column(String, index=True)
    role = Column(String)
    personality = Column(Text)
    expertise = Column(JSON)
    system_prompt = Column(Text)
    knowledge_base = Column(Text, nullable=True)  # New field
    is_active = Column(Boolean, default=True, nullable=False)  # Soft delete flag
    fired_at = Column(DateTime, nullable=True)  # When staff was fired
    fired_reason = Column(Text, nullable=True)  # Reason for firing
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    companies = relationship("Company", secondary="company_staff", back_populates="staff")
    department = relationship("Department", back_populates="staff")
    meeting_participations = relationship("MeetingParticipant", back_populates="staff")
