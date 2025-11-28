# backend\app\routers\departments.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Department, Company, Staff
from .. import schemas

router = APIRouter(prefix="/departments", tags=["departments"])


@router.post("/companies/{company_id}/departments", response_model=schemas.Department)
def create_department(
    company_id: int,
    department: schemas.DepartmentCreate,
    db: Session = Depends(get_db)
):
    """Create a new department in a company"""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    db_department = Department(**department.model_dump(), company_id=company_id)
    db.add(db_department)
    db.commit()
    db.refresh(db_department)
    return db_department


@router.get("/companies/{company_id}/departments", response_model=List[schemas.Department])
def list_company_departments(company_id: int, db: Session = Depends(get_db)):
    """List all departments in a company"""
    return db.query(Department).filter(Department.company_id == company_id).all()


@router.get("/{department_id}", response_model=schemas.Department)
def get_department(department_id: int, db: Session = Depends(get_db)):
    """Get department by ID"""
    department = db.query(Department).filter(Department.id == department_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    return department


@router.get("/{department_id}/staff", response_model=List[schemas.Staff])
def get_department_staff(department_id: int, db: Session = Depends(get_db)):
    """Get all staff in a department"""
    department = db.query(Department).filter(Department.id == department_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    
    staff_list = db.query(Staff).filter(
        Staff.department_id == department_id,
        Staff.is_active == True
    ).all()
    
    # Add department_name to each staff member
    result = []
    for staff_member in staff_list:
        staff_dict = {
            "id": staff_member.id,
            "company_id": staff_member.company_id,
            "department_id": staff_member.department_id,
            "department_name": department.name,
            "name": staff_member.name,
            "role": staff_member.role,
            "personality": staff_member.personality,
            "expertise": staff_member.expertise,
            "system_prompt": staff_member.system_prompt,
            "is_active": staff_member.is_active,
            "fired_at": staff_member.fired_at,
            "fired_reason": staff_member.fired_reason,
            "created_at": staff_member.created_at
        }
        result.append(schemas.Staff(**staff_dict))
    
    return result


@router.put("/{department_id}", response_model=schemas.Department)
def update_department(
    department_id: int,
    department_update: schemas.DepartmentUpdate,
    db: Session = Depends(get_db)
):
    """Update department"""
    department = db.query(Department).filter(Department.id == department_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    
    update_data = department_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(department, field, value)
    
    db.commit()
    db.refresh(department)
    return department


@router.delete("/{department_id}")
def delete_department(department_id: int, db: Session = Depends(get_db)):
    """Delete department"""
    department = db.query(Department).filter(Department.id == department_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    
    # Check if department has staff
    staff_count = db.query(Staff).filter(Staff.department_id == department_id).count()
    if staff_count > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete department with {staff_count} staff members. Please reassign or remove staff first."
        )
    
    db.delete(department)
    db.commit()
    return {"message": "Department deleted successfully"}
