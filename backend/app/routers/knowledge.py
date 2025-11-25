from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Knowledge, Company
from .. import schemas

router = APIRouter(prefix="/knowledge", tags=["knowledge"])


@router.post("/companies/{company_id}/knowledge", response_model=schemas.Knowledge)
def add_knowledge(
    company_id: int,
    knowledge: schemas.KnowledgeCreate,
    db: Session = Depends(get_db)
):
    """Add knowledge entry to company knowledge base"""
    # Verify company exists
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    db_knowledge = Knowledge(**knowledge.model_dump(), company_id=company_id)
    db.add(db_knowledge)
    db.commit()
    db.refresh(db_knowledge)
    return db_knowledge


@router.get("/companies/{company_id}/knowledge", response_model=List[schemas.Knowledge])
def list_company_knowledge(company_id: int, db: Session = Depends(get_db)):
    """List all knowledge entries for a company"""
    return db.query(Knowledge).filter(Knowledge.company_id == company_id).all()


@router.delete("/{knowledge_id}")
def delete_knowledge(knowledge_id: int, db: Session = Depends(get_db)):
    """Delete knowledge entry"""
    knowledge = db.query(Knowledge).filter(Knowledge.id == knowledge_id).first()
    if not knowledge:
        raise HTTPException(status_code=404, detail="Knowledge entry not found")
    
    db.delete(knowledge)
    db.commit()
    return {"message": "Knowledge entry deleted successfully"}
