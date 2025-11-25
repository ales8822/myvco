from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from pathlib import Path
import os
import base64
from .. import schemas
from ..database import get_db
from ..models import Company, Staff, Meeting, MeetingParticipant, MeetingMessage, MeetingImage, ActionItem
from ..services.llm_service import llm_service
from ..services.memory_service import memory_service

router = APIRouter(prefix="/meetings", tags=["meetings"])

# Robust absolute path calculation
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads", "meeting_images")

@router.post("/companies/{company_id}/meetings", response_model=schemas.Meeting)
def create_meeting(company_id: int, meeting: schemas.MeetingCreate, db: Session = Depends(get_db)):
    """Create a new meeting"""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    db_meeting = Meeting(
        company_id=company_id,
        title=meeting.title,
        meeting_type=meeting.meeting_type
    )
    db.add(db_meeting)
    db.commit()
    db.refresh(db_meeting)
    
    for staff_id in meeting.participant_ids:
        staff = db.query(Staff).filter(Staff.id == staff_id).first()
        if staff:
            participant = MeetingParticipant(meeting_id=db_meeting.id, staff_id=staff_id)
            db.add(participant)
    
    db.commit()
    
    participants_data = []
    participants = db.query(MeetingParticipant).filter(MeetingParticipant.meeting_id == db_meeting.id).all()
    for participant in participants:
        staff = db.query(Staff).filter(Staff.id == participant.staff_id).first()
        if staff:
            participants_data.append(schemas.MeetingParticipantInfo(
                staff_id=staff.id, staff_name=staff.name, staff_role=staff.role, joined_at=participant.joined_at
            ))
            
    return {
        "id": db_meeting.id,
        "company_id": db_meeting.company_id,
        "title": db_meeting.title,
        "meeting_type": db_meeting.meeting_type,
        "status": db_meeting.status,
        "summary": db_meeting.summary,
        "created_at": db_meeting.created_at,
        "ended_at": db_meeting.ended_at,
        "participants": participants_data
    }

@router.get("/companies/{company_id}/meetings", response_model=List[schemas.Meeting])
def list_company_meetings(company_id: int, db: Session = Depends(get_db)):
    meetings = db.query(Meeting).filter(Meeting.company_id == company_id).all()
    result = []
    for meeting in meetings:
        participants_data = []
        participants = db.query(MeetingParticipant).filter(MeetingParticipant.meeting_id == meeting.id).all()
        for participant in participants:
            staff = db.query(Staff).filter(Staff.id == participant.staff_id).first()
            if staff:
                participants_data.append(schemas.MeetingParticipantInfo(
                    staff_id=staff.id, staff_name=staff.name, staff_role=staff.role, joined_at=participant.joined_at
                ))
        
        result.append({
            "id": meeting.id,
            "company_id": meeting.company_id,
            "title": meeting.title,
            "meeting_type": meeting.meeting_type,
            "status": meeting.status,
            "summary": meeting.summary,
            "created_at": meeting.created_at,
            "ended_at": meeting.ended_at,
            "participants": participants_data
        })
    return result

@router.get("/{meeting_id}", response_model=schemas.Meeting)
def get_meeting(meeting_id: int, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    participants_data = []
    participants = db.query(MeetingParticipant).filter(MeetingParticipant.meeting_id == meeting_id).all()
    for participant in participants:
        staff = db.query(Staff).filter(Staff.id == participant.staff_id).first()
        if staff:
            participants_data.append(schemas.MeetingParticipantInfo(
                staff_id=staff.id, staff_name=staff.name, staff_role=staff.role, joined_at=participant.joined_at
            ))
            
    return {
        "id": meeting.id,
        "company_id": meeting.company_id,
        "title": meeting.title,
        "meeting_type": meeting.meeting_type,
        "status": meeting.status,
        "summary": meeting.summary,
        "created_at": meeting.created_at,
        "ended_at": meeting.ended_at,
        "participants": participants_data
    }

@router.get("/{meeting_id}/messages", response_model=List[schemas.MeetingMessage])
def get_meeting_messages(meeting_id: int, db: Session = Depends(get_db)):
    return db.query(MeetingMessage).filter(MeetingMessage.meeting_id == meeting_id).order_by(MeetingMessage.created_at).all()

@router.post("/{meeting_id}/messages")
async def send_message(meeting_id: int, message: schemas.SendMessageRequest, staff_id: int, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting or meeting.status != "active":
        raise HTTPException(status_code=400, detail="Meeting not active")
    
    staff = db.query(Staff).filter(Staff.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    
    user_message = MeetingMessage(
        meeting_id=meeting_id, sender_type="user", sender_name=message.sender_name, content=message.content
    )
    db.add(user_message)
    db.commit()
    
    meeting_context = memory_service.get_meeting_context(db, meeting_id)
    knowledge_context = memory_service.get_company_knowledge_context(db, meeting.company_id)
    image_context = memory_service.get_current_meeting_image(db, meeting_id)
    image_path = memory_service.get_current_image_path(db, meeting_id)

    company = db.query(Company).filter(Company.id == meeting.company_id).first()
    
    system_prompt = llm_service.build_system_prompt(
        staff_name=staff.name,
        role=staff.role,
        personality=staff.personality,
        expertise=staff.expertise,
        company_context=knowledge_context,
        meeting_context=meeting_context + image_context,
        company_name=company.name if company else "MyVCO",
        company_description=company.description if company else ""
    )
    
    async def generate_response():
        response_parts = []
        async for chunk in llm_service.generate_stream(
            prompt=message.content, system_prompt=system_prompt, provider=staff.llm_provider,
            model=staff.llm_model, image_path=image_path
        ):
            response_parts.append(chunk)
            yield chunk
        
        full_response = "".join(response_parts)
        staff_message = MeetingMessage(
            meeting_id=meeting_id, staff_id=staff_id, sender_type="staff",
            sender_name=staff.name, content=full_response
        )
        db.add(staff_message)
        db.commit()
    
    return StreamingResponse(generate_response(), media_type="text/plain")

@router.put("/{meeting_id}/status")
async def update_meeting_status(meeting_id: int, status_update: schemas.UpdateMeetingStatusRequest, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    meeting.status = status_update.status
    if status_update.status == "ended":
        meeting.ended_at = datetime.utcnow()
        meeting.summary = await memory_service.generate_meeting_summary(db, meeting_id, llm_service)
        await extract_action_items(db, meeting_id, llm_service)
    
    db.commit()
    db.refresh(meeting)
    return meeting

@router.post("/{meeting_id}/ask-all")
async def ask_all_participants(meeting_id: int, message: schemas.SendMessageToAllRequest, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting or meeting.status != "active":
        raise HTTPException(status_code=400, detail="Meeting not active")
    
    company_id = meeting.company_id
    user_message = MeetingMessage(
        meeting_id=meeting_id, sender_type="user", sender_name=message.sender_name, content=message.content
    )
    db.add(user_message)
    db.commit()
    
    participants = db.query(MeetingParticipant).filter(MeetingParticipant.meeting_id == meeting_id).all()
    
    async def generate_all_responses():
        for participant in participants:
            staff = db.query(Staff).filter(Staff.id == participant.staff_id).first()
            if not staff: continue
            
            meeting_context = memory_service.get_meeting_context(db, meeting_id)
            knowledge_context = memory_service.get_company_knowledge_context(db, company_id)
            image_context = memory_service.get_current_meeting_image(db, meeting_id)
            image_path = memory_service.get_current_image_path(db, meeting_id)
            
            system_prompt = llm_service.build_system_prompt(
                staff_name=staff.name, role=staff.role, personality=staff.personality,
                expertise=staff.expertise, company_context=knowledge_context,
                meeting_context=meeting_context + image_context
            )
            
            yield f"\n\n---STAFF:{staff.name}---\n"
            
            response_parts = []
            async for chunk in llm_service.generate_stream(
                prompt=message.content, system_prompt=system_prompt, provider=staff.llm_provider,
                model=staff.llm_model, image_path=image_path
            ):
                response_parts.append(chunk)
                yield chunk
            
            full_response = "".join(response_parts)
            staff_message = MeetingMessage(
                meeting_id=meeting_id, staff_id=staff.id, sender_type="staff",
                sender_name=staff.name, content=full_response
            )
            db.add(staff_message)
            db.commit()
    
    return StreamingResponse(generate_all_responses(), media_type="text/plain")

@router.post("/{meeting_id}/upload-image")
async def upload_meeting_image(meeting_id: int, image: schemas.MeetingImageCreate, db: Session = Depends(get_db)):
    """Upload image with strict absolute paths and flushing"""
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    if not os.path.exists(UPLOADS_DIR):
        os.makedirs(UPLOADS_DIR)
    
    try:
        if "," in image.image_data:
            header, encoded = image.image_data.split(",", 1)
        else:
            encoded = image.image_data

        image_data = base64.b64decode(encoded)
        image_filename = f"meeting_{meeting_id}_{datetime.utcnow().timestamp()}.png"
        
        abs_image_path = os.path.join(UPLOADS_DIR, image_filename)
        
        with open(abs_image_path, "wb") as f:
            f.write(image_data)
            f.flush()
            os.fsync(f.fileno()) 
        
        relative_path = f"uploads/meeting_images/{image_filename}"
        
        db_image = MeetingImage(
            meeting_id=meeting_id,
            image_path=relative_path,
            analysis=None,
            image_metadata=image.description
        )
        db.add(db_image)
        db.commit()
        db.refresh(db_image)
        
        return {
            "id": db_image.id,
            "image_url": f"/uploads/meeting_images/{image_filename}",
            "description": image.description
        }
    except Exception as e:
        print(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

@router.get("/{meeting_id}/images")
def get_meeting_images(meeting_id: int, db: Session = Depends(get_db)):
    images = db.query(MeetingImage).filter(MeetingImage.meeting_id == meeting_id).all()
    return [{
        "id": img.id,
        "image_url": f"/{img.image_path.replace(os.sep, '/')}",
        "description": img.image_metadata,
        "created_at": img.created_at
    } for img in images]

@router.get("/{meeting_id}/action-items", response_model=List[schemas.ActionItem])
def get_action_items(meeting_id: int, db: Session = Depends(get_db)):
    return db.query(ActionItem).filter(ActionItem.meeting_id == meeting_id).all()

@router.post("/{meeting_id}/action-items", response_model=schemas.ActionItem)
def create_action_item(meeting_id: int, action_item: schemas.ActionItemCreate, db: Session = Depends(get_db)):
    db_item = ActionItem(meeting_id=meeting_id, description=action_item.description, assigned_to=action_item.assigned_to)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.put("/action-items/{item_id}/complete")
def complete_action_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(ActionItem).filter(ActionItem.id == item_id).first()
    if not item: raise HTTPException(status_code=404, detail="Action item not found")
    item.status = "completed"
    item.completed_at = datetime.utcnow()
    db.commit()
    return item

async def extract_action_items(db: Session, meeting_id: int, llm_service):
    # Implementation skipped for brevity (unchanged)
    pass

@router.delete("/{meeting_id}")
def delete_meeting(meeting_id: int, db: Session = Depends(get_db)):
    """Delete a meeting and all associated data, including image files"""
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    # 1. Clean up image files from disk
    images = db.query(MeetingImage).filter(MeetingImage.meeting_id == meeting_id).all()
    
    for img in images:
        if img.image_path:
            try:
                # Construct absolute path using consistent logic
                filename = os.path.basename(img.image_path)
                file_path = os.path.join(UPLOADS_DIR, filename)
                
                if os.path.exists(file_path):
                    os.remove(file_path)
                    print(f"DEBUG: Deleted image file: {file_path}")
                else:
                    print(f"DEBUG: File not found during deletion: {file_path}")
            except Exception as e:
                print(f"Error deleting file for image {img.id}: {e}")

    # 2. Delete image records manually (safety in case of no cascade)
    db.query(MeetingImage).filter(MeetingImage.meeting_id == meeting_id).delete()
    
    # 3. Delete the meeting (will cascade to messages/participants typically)
    db.delete(meeting)
    db.commit()
    
    return {"message": "Meeting and associated files deleted successfully"}