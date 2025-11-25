from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from ..database import get_db
from ..models import Meeting, MeetingParticipant, MeetingMessage, Company, Staff
from ..services import llm_service, memory_service
from .. import schemas

router = APIRouter(prefix="/meetings", tags=["meetings"])


@router.post("/companies/{company_id}/meetings", response_model=schemas.Meeting)
def create_meeting(
    company_id: int,
    meeting: schemas.MeetingCreate,
    db: Session = Depends(get_db)
):
    """Create a new meeting"""
    # Verify company exists
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Create meeting
    db_meeting = Meeting(
        company_id=company_id,
        title=meeting.title,
        meeting_type=meeting.meeting_type
    )
    db.add(db_meeting)
    db.commit()
    db.refresh(db_meeting)
    
    # Add participants
    for staff_id in meeting.participant_ids:
        staff = db.query(Staff).filter(Staff.id == staff_id).first()
        if staff:
            participant = MeetingParticipant(
                meeting_id=db_meeting.id,
                staff_id=staff_id
            )
            db.add(participant)
    
    db.commit()
    return db_meeting


@router.get("/companies/{company_id}/meetings", response_model=List[schemas.Meeting])
def list_company_meetings(company_id: int, db: Session = Depends(get_db)):
    """List all meetings for a company"""
    return db.query(Meeting).filter(Meeting.company_id == company_id).all()


@router.get("/{meeting_id}", response_model=schemas.Meeting)
def get_meeting(meeting_id: int, db: Session = Depends(get_db)):
    """Get meeting by ID"""
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting


@router.get("/{meeting_id}/messages", response_model=List[schemas.MeetingMessage])
def get_meeting_messages(meeting_id: int, db: Session = Depends(get_db)):
    """Get all messages for a meeting"""
    return db.query(MeetingMessage)\
        .filter(MeetingMessage.meeting_id == meeting_id)\
        .order_by(MeetingMessage.created_at)\
        .all()


@router.post("/{meeting_id}/messages")
async def send_message(
    meeting_id: int,
    message: schemas.SendMessageRequest,
    staff_id: int,  # Which staff member should respond
    db: Session = Depends(get_db)
):
    """Send a message and get streaming response from staff member"""
    # Verify meeting exists and is active
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    if meeting.status != "active":
        raise HTTPException(status_code=400, detail="Meeting is not active")
    
    # Verify staff member
    staff = db.query(Staff).filter(Staff.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    
    # Save user message
    user_message = MeetingMessage(
        meeting_id=meeting_id,
        sender_type="user",
        sender_name=message.sender_name,
        content=message.content
    )
    db.add(user_message)
    db.commit()
    
    # Build context
    meeting_context = memory_service.get_meeting_context(db, meeting_id)
    knowledge_context = memory_service.get_company_knowledge_context(db, meeting.company_id)
    
    # Build system prompt
    system_prompt = llm_service.build_system_prompt(
        staff_name=staff.name,
        role=staff.role,
        personality=staff.personality,
        expertise=staff.expertise,
        company_context=knowledge_context,
        meeting_context=meeting_context
    )
    
    # Stream response
    async def generate_response():
        response_parts = []
        
        async for chunk in llm_service.generate_stream(
            prompt=message.content,
            system_prompt=system_prompt,
            provider=staff.llm_provider,
            model=staff.llm_model
        ):
            response_parts.append(chunk)
            yield chunk
        
        # Save staff response
        full_response = "".join(response_parts)
        staff_message = MeetingMessage(
            meeting_id=meeting_id,
            staff_id=staff_id,
            sender_type="staff",
            sender_name=staff.name,
            content=full_response
        )
        db.add(staff_message)
        db.commit()
    
    return StreamingResponse(generate_response(), media_type="text/plain")


@router.put("/{meeting_id}/status")
async def update_meeting_status(
    meeting_id: int,
    status_update: schemas.UpdateMeetingStatusRequest,
    db: Session = Depends(get_db)
):
    """Update meeting status (end meeting)"""
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    meeting.status = status_update.status
    
    if status_update.status == "ended":
        meeting.ended_at = datetime.utcnow()
        # Generate summary
        summary = await memory_service.generate_meeting_summary(db, meeting_id, llm_service)
        meeting.summary = summary
    
    db.commit()
    db.refresh(meeting)
    return meeting
