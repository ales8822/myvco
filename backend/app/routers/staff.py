# backend\app\routers\staff.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from ..database import get_db
from ..models import Staff, Company
from .. import schemas

router = APIRouter(prefix="/staff", tags=["staff"])


@router.post("/", response_model=schemas.Staff)
def create_global_staff(
    staff_in: schemas.StaffCreate,
    db: Session = Depends(get_db)
):
    """Create a new staff member in the global pool"""
    staff_data = staff_in.model_dump()
    db_staff = Staff(**staff_data)
    db.add(db_staff)
    db.commit()
    db.refresh(db_staff)
    return db_staff


@router.get("/global", response_model=List[schemas.Staff])
def list_global_staff(db: Session = Depends(get_db)):
    """List all active staff members in the system."""
    return db.query(Staff).filter(Staff.is_active == True).all()


@router.post("/{staff_id}/hire/{company_id}", response_model=schemas.Staff)
def assign_staff_to_company(staff_id: int, company_id: int, db: Session = Depends(get_db)):
    """Assign a global staff member to a company"""
    staff = db.query(Staff).filter(Staff.id == staff_id).first()
    company = db.query(Company).filter(Company.id == company_id).first()
    if not staff or not company:
        raise HTTPException(status_code=404, detail="Staff or Company not found")
    
    if company not in staff.companies:
        staff.companies.append(company)
        db.commit()
        db.refresh(staff)
    return staff


@router.post("/{staff_id}/fire", response_model=schemas.Staff)
def unassign_staff_from_company(staff_id: int, company_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Unassign staff from a specific company (return to global pool if no companies left)"""
    staff = db.query(Staff).filter(Staff.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    
    if company_id:
        company = db.query(Company).filter(Company.id == company_id).first()
        if company and company in staff.companies:
            staff.companies.remove(company)
            # Also clear department if it was part of that company
            # (In M2M, department management might need more updates, 
            # but for now we'll just clear it to be safe)
            staff.department_id = None
    else:
        # Unassign from all companies
        staff.companies = []
        staff.department_id = None
        
    db.commit()
    db.refresh(staff)
    return staff


@router.post("/companies/{company_id}/staff", response_model=schemas.Staff)
def hire_staff_legacy(
    company_id: int,
    staff_in: schemas.StaffCreate,
    db: Session = Depends(get_db)
):
    """Hire a new staff member directly to a company (Legacy/Convenience)"""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Create staff
    staff_data = staff_in.model_dump()
    db_staff = Staff(**staff_data)
    db_staff.companies.append(company)
    
    db.add(db_staff)
    db.commit()
    db.refresh(db_staff)
    return db_staff


@router.get("/companies/{company_id}/staff", response_model=List[schemas.Staff])
def list_company_staff(company_id: int, is_active: bool = True, db: Session = Depends(get_db)):
    """List all staff members assigned to a specific company"""
    return db.query(Staff).join(Staff.companies).filter(
        Company.id == company_id,
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
    
    # Full deletion from system (soft delete)
    staff.is_active = False
    staff.fired_at = datetime.utcnow()
    staff.fired_reason = reason
    # Removed from all companies automatically? 
    # Usually better to keep historical associations or clear them depending on business logic.
    # For now, let's keep them so they show up in 'fired' list for that company if needed.
    
    db.commit()
    return {"message": "Staff member removed from system successfully"}


@router.post("/{staff_id}/restore", response_model=schemas.Staff)
def restore_staff(staff_id: int, restore_data: Optional[schemas.StaffRestore] = None, db: Session = Depends(get_db)):
    """Restore a deleted staff member"""
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
            company = db.query(Company).filter(Company.id == restore_data.company_id).first()
            if company and company not in staff.companies:
                staff.companies.append(company)
        if restore_data.department_id is not None:
            staff.department_id = restore_data.department_id
    
    db.commit()
    db.refresh(staff)
    return staff
