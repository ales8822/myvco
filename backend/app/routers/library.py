# backend\app\routers\library.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import LibraryItem
from .. import schemas

router = APIRouter(prefix="/library", tags=["library"])

@router.get("/", response_model=List[schemas.LibraryItem])
def list_library_items(db: Session = Depends(get_db)):
    """List all available prototype modules"""
    return db.query(LibraryItem).all()

@router.post("/", response_model=schemas.LibraryItem)
def create_library_item(item: schemas.LibraryItemCreate, db: Session = Depends(get_db)):
    """Create a new module"""
    # Check if slug exists
    if db.query(LibraryItem).filter(LibraryItem.slug == item.slug).first():
        raise HTTPException(status_code=400, detail="Slug already exists")
    
    db_item = LibraryItem(
        slug=item.slug,
        name=item.name,
        content=item.content,
        description=item.description,
        is_global=item.is_global
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.get("/{slug}", response_model=schemas.LibraryItem)
def get_library_item(slug: str, db: Session = Depends(get_db)):
    """Fetch a specific module by slug"""
    item = db.query(LibraryItem).filter(LibraryItem.slug == slug).first()
    if not item:
        raise HTTPException(status_code=404, detail="Library item not found")
    return item

@router.put("/{id}", response_model=schemas.LibraryItem)
def update_library_item(id: int, item_update: schemas.LibraryItemUpdate, db: Session = Depends(get_db)):
    """Update content"""
    db_item = db.query(LibraryItem).filter(LibraryItem.id == id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Library item not found")
    
    # Check slug uniqueness if changing slug
    if item_update.slug and item_update.slug != db_item.slug:
        if db.query(LibraryItem).filter(LibraryItem.slug == item_update.slug).first():
            raise HTTPException(status_code=400, detail="Slug already exists")
    
    update_data = item_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_item, key, value)
    
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.delete("/{id}")
def delete_library_item(id: int, db: Session = Depends(get_db)):
    """Remove module"""
    db_item = db.query(LibraryItem).filter(LibraryItem.id == id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Library item not found")
    
    db.delete(db_item)
    db.commit()
    return {"message": "Library item deleted successfully"}
