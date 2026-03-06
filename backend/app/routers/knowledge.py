# backend\app\routers\knowledge.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import io
from pypdf import PdfReader
from ..database import get_db
from ..models import Knowledge, Company
from .. import schemas

router = APIRouter(prefix="/knowledge", tags=["knowledge"])


@router.post("/companies/{company_id}/knowledge", response_model=schemas.Knowledge)
async def add_knowledge(
    company_id: int,
    title: str = Form(...),
    content: Optional[str] = Form(None),
    source: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """Add knowledge entry (Supports Manual Text OR PDF File)"""
    
    # Verify company exists
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    final_content = content or ""
    
    # Process PDF if uploaded
    if file:
        if file.filename.endswith('.pdf'):
            try:
                # Read PDF content
                pdf_bytes = await file.read()
                reader = PdfReader(io.BytesIO(pdf_bytes))
                
                extracted_text = ""
                for page in reader.pages:
                    extracted_text += page.extract_text() + "\n"
                
                # Append extracted text to content
                if final_content:
                    final_content += "\n\n--- Extracted from PDF ---\n\n"
                final_content += extracted_text
                
                # Auto-set source if missing
                if not source:
                    source = file.filename
                    
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to parse PDF: {str(e)}")
        else:
            raise HTTPException(status_code=400, detail="Only PDF files are supported.")
            
    if not final_content.strip():
        raise HTTPException(status_code=400, detail="Content is required (enter text or upload a PDF).")

    db_knowledge = Knowledge(
        company_id=company_id,
        title=title,
        content=final_content,
        source=source
    )
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