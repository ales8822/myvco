# backend\app\routers\staff.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from ..database import get_db
from ..models import Staff, Company
from .. import schemas

router = APIRouter(prefix="/staff", tags=["staff"])


@router.post("/companies/{company_id}/staff", response_model=schemas.Staff)
def hire_staff(
    company_id: int,
    staff: schemas.StaffCreate,
    db: Session = Depends(get_db)
):
    """Hire a new staff member (Persona only)"""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Create staff without LLM fields
    staff_data = staff.model_dump()
    db_staff = Staff(**staff_data, company_id=company_id)
    
    db.add(db_staff)
    db.commit()
    db.refresh(db_staff)
    return db_staff


@router.get("/companies/{company_id}/staff", response_model=List[schemas.Staff])
def list_company_staff(company_id: int, is_active: bool = True, db: Session = Depends(get_db)):
    return db.query(Staff).filter(
        Staff.company_id == company_id,
        Staff.is_active == is_active
    ).all()


@router.get("/{staff_id}", response_model=schemas.Staff)
def get_staff(staff_id: int, db: Session = Depends(get_db)):
    staff = db.query(Staff).filter(Staff.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    return staff


@router.put("/{staff_id}", response_model=schemas.Staff)
def update_staff(
    staff_id: int,
    staff_update: schemas.StaffUpdate,
    db: Session = Depends(get_db)
):
    staff = db.query(Staff).filter(Staff.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    
    update_data = staff_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(staff, field, value)
    
    db.commit()
    db.refresh(staff)
    return staff


@router.delete("/{staff_id}")
def remove_staff(staff_id: int, reason: Optional[str] = None, db: Session = Depends(get_db)):
    staff = db.query(Staff).filter(Staff.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    
    # Soft delete
    staff.is_active = False
    staff.fired_at = datetime.utcnow()
    staff.fired_reason = reason
    
    db.commit()
    return {"message": "Staff member fired successfully"}

@router.post("/{staff_id}/restore", response_model=schemas.Staff)
def restore_staff(staff_id: int, restore_data: Optional[schemas.StaffRestore] = None, db: Session = Depends(get_db)):
    """Restore a fired staff member"""
    staff = db.query(Staff).filter(Staff.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    
    if staff.is_active:
        raise HTTPException(status_code=400, detail="Staff member is already active")
    
    # Restore
    staff.is_active = True
    staff.fired_at = None
    staff.fired_reason = None

    if restore_data:
        if restore_data.company_id is not None:
            staff.company_id = restore_data.company_id
        if restore_data.department_id is not None:
            staff.department_id = restore_data.department_id
    
    db.commit()
    db.refresh(staff)
    return staff
