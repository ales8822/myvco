# backend\app\models\library.py
from sqlalchemy import Column, Integer, String, Text, Boolean
from ..database import Base

class LibraryItem(Base):
    """LibraryItem model - represents a reusable knowledge module"""
    __tablename__ = "library_items"
    
    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    description = Column(Text)
    is_global = Column(Boolean, default=True)
