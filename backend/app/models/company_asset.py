# backend\app\models\company_asset.py
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class CompanyAsset(Base):
    """CompanyAsset model - stores company-wide reusable assets (images, files, etc.)"""
    __tablename__ = "company_assets"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    asset_name = Column(String(50), nullable=False, index=True)  # e.g., "logo", "product_diagram"
    display_name = Column(String(255), nullable=False)  # Human-readable name
    file_path = Column(String(500), nullable=False)
    asset_type = Column(String(20), default="image")  # image, pdf, document
    description = Column(Text)
    file_size = Column(Integer)  # Size in bytes
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company", back_populates="assets")
