from pydantic import BaseModel
from typing import Optional
from datetime import datetime

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

class CompanyAssetCreate(BaseModel):
    asset_name: str
    display_name: Optional[str] = None
    description: Optional[str] = None
    asset_type: str = "image"

class CompanyAsset(BaseModel):
    id: int
    company_id: int
    asset_name: str
    display_name: str
    description: Optional[str]
    file_path: str
    asset_type: str
    file_size: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
