# backend\app\models\company.py
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class Company(Base):
    """Company model - represents a virtual company"""
    __tablename__ = "companies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    industry = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    departments = relationship("Department", back_populates="company", cascade="all, delete-orphan")
    staff = relationship("Staff", back_populates="company", cascade="all, delete-orphan")
    meetings = relationship("Meeting", back_populates="company", cascade="all, delete-orphan")
    knowledge = relationship("Knowledge", back_populates="company", cascade="all, delete-orphan")

