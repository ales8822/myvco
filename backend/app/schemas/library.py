from pydantic import BaseModel
from typing import Optional

class LibraryItemBase(BaseModel):
    slug: str
    name: str
    content: str
    description: Optional[str] = None
    category: str = "manifesto"
    is_global: bool = True

class LibraryItemCreate(LibraryItemBase):
    pass

class LibraryItemUpdate(BaseModel):
    slug: Optional[str] = None
    name: Optional[str] = None
    content: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    is_global: Optional[bool] = None

class LibraryItem(LibraryItemBase):
    id: int
    
    class Config:
        from_attributes = True
