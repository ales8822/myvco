from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import os
import shutil
from .. import schemas
from ..database import get_db
from ..models import Company, CompanyAsset

router = APIRouter(prefix="/companies/{company_id}/assets", tags=["assets"])

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ASSETS_DIR = os.path.join(BASE_DIR, "uploads", "company_assets")

@router.post("/", response_model=schemas.CompanyAsset)
async def create_company_asset(
    company_id: int,
    asset_name: str = Form(...),
    display_name: str = Form(None),
    description: str = Form(None),
    asset_type: str = Form("image"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    # Validate asset name format (snake_case)
    import re
    if not re.match(r'^[a-z0-9_]+$', asset_name):
        raise HTTPException(status_code=400, detail="Asset name must be snake_case (lowercase letters, numbers, underscores only)")

    # Check uniqueness
    existing = db.query(CompanyAsset).filter(
        CompanyAsset.company_id == company_id,
        CompanyAsset.asset_name == asset_name
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Asset name '@{asset_name}' already exists")

    # Create directory
    company_assets_dir = os.path.join(ASSETS_DIR, str(company_id))
    os.makedirs(company_assets_dir, exist_ok=True)

    # Save file
    file_ext = os.path.splitext(file.filename)[1]
    filename = f"{asset_name}{file_ext}"
    file_path = os.path.join(company_assets_dir, filename)
    relative_path = f"uploads/company_assets/{company_id}/{filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    file_size = os.path.getsize(file_path)

    db_asset = CompanyAsset(
        company_id=company_id,
        asset_name=asset_name,
        display_name=display_name or asset_name,
        description=description,
        file_path=relative_path,
        asset_type=asset_type,
        file_size=file_size
    )
    db.add(db_asset)
    db.commit()
    db.refresh(db_asset)
    
    return db_asset

@router.get("/", response_model=List[schemas.CompanyAsset])
def list_company_assets(company_id: int, db: Session = Depends(get_db)):
    return db.query(CompanyAsset).filter(CompanyAsset.company_id == company_id).all()

@router.get("/{asset_id}", response_model=schemas.CompanyAsset)
def get_company_asset(company_id: int, asset_id: int, db: Session = Depends(get_db)):
    asset = db.query(CompanyAsset).filter(
        CompanyAsset.id == asset_id,
        CompanyAsset.company_id == company_id
    ).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset

@router.delete("/{asset_id}")
def delete_company_asset(company_id: int, asset_id: int, db: Session = Depends(get_db)):
    asset = db.query(CompanyAsset).filter(
        CompanyAsset.id == asset_id,
        CompanyAsset.company_id == company_id
    ).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    # Delete file
    full_path = os.path.join(BASE_DIR, asset.file_path)
    if os.path.exists(full_path):
        try:
            os.remove(full_path)
        except Exception as e:
            print(f"Error deleting file {full_path}: {e}")

    db.delete(asset)
    db.commit()
    return {"message": "Asset deleted successfully"}
