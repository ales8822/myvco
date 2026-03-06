# backend\app\routers\meetings.py
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from pathlib import Path
import os
import base64
from ..schemas import meeting as schemas
from ..schemas.image import MeetingImageCreate
from ..schemas.action_item import ActionItem as ActionItemSchema, ActionItemCreate
from ..database import get_db, SessionLocal
from ..models import Company, Staff, Meeting, MeetingParticipant, MeetingMessage, MeetingImage, ActionItem, Department, CompanyAsset, MeetingTemplate
from ..services.llm_service import llm_service
from ..services.memory_service import memory_service
from ..services.mention_parser import mention_parser
import asyncio
import queue
import threading
import autogen
from ..services.autogen_service import autogen_service
from services.tools.registry import register_filesystem_tools

router = APIRouter(prefix="/meetings", tags=["meetings"])

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads", "meeting_images")


# Global dictionary to manage stop signals
autonomous_stop_events = {}

@router.post("/{meeting_id}/autonomous/stop")
def stop_autonomous_session(meeting_id: int):
    if meeting_id in autonomous_stop_events:
        autonomous_stop_events[meeting_id].set()
        return {"message": "Stop signal sent"}
    return {"message": "No active session found", "status": "ignored"}

def link_mentioned_assets(db: Session, meeting_id: int, company_id: int, text: str):
    """
    Check for company asset mentions in text and create MeetingImage records if they don't exist.
    This allows "discussed" assets to appear in the meeting images panel.
    """
    mentions = mention_parser.parse_mentions(text)
    for mention in mentions:
        if not mention.startswith('img'):
            # Check if it's a company asset
            asset = db.query(CompanyAsset).filter(
                CompanyAsset.company_id == company_id,
                CompanyAsset.asset_name == mention
            ).first()
            
            if asset:
                # Check if already linked (by path)
                existing = db.query(MeetingImage).filter(
                    MeetingImage.meeting_id == meeting_id,
                    MeetingImage.image_path == asset.file_path
                ).first()
                
                if not existing:
                    # Link it
                    count = db.query(MeetingImage).filter(MeetingImage.meeting_id == meeting_id).count()
                    new_image = MeetingImage(
                        meeting_id=meeting_id,
                        image_path=asset.file_path,
                        display_order=count + 1,
                        image_metadata=asset.display_name
                    )
                    db.add(new_image)
                    db.commit()

@router.post("/companies/{company_id}/meetings", response_model=schemas.Meeting)
def create_meeting(company_id: int, meeting: schemas.MeetingCreate, db: Session = Depends(get_db)):
    """Create a new meeting with dynamic LLM configuration per participant"""
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
    
    # Add participants with their specific LLM config
    for participant_config in meeting.participants:
        staff = db.query(Staff).filter(Staff.id == participant_config.staff_id).first()
        if staff:
            participant = MeetingParticipant(
                meeting_id=db_meeting.id,
                staff_id=participant_config.staff_id,
                llm_provider=participant_config.llm_provider,
                llm_model=participant_config.llm_model
            )
            db.add(participant)
    
    db.commit()
    
    # Construct response with participant details
    participants_data = []
    participants = db.query(MeetingParticipant).filter(MeetingParticipant.meeting_id == db_meeting.id).all()
    
    for participant in participants:
        staff = db.query(Staff).filter(Staff.id == participant.staff_id).first()
        if staff:
            participants_data.append(schemas.MeetingParticipantInfo(
                staff_id=staff.id,
                staff_name=staff.name,
                staff_role=staff.role,
                llm_provider=participant.llm_provider,
                llm_model=participant.llm_model,
                joined_at=participant.joined_at
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
                    staff_id=staff.id,
                    staff_name=staff.name,
                    staff_role=staff.role,
                    llm_provider=participant.llm_provider,
                    llm_model=participant.llm_model,
                    joined_at=participant.joined_at
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
                staff_id=staff.id,
                staff_name=staff.name,
                staff_role=staff.role,
                llm_provider=participant.llm_provider,
                llm_model=participant.llm_model,
                joined_at=participant.joined_at
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
async def send_message(
    meeting_id: int, 
    message: schemas.SendMessageRequest, 
    staff_id: int, 
    save_user_message: bool = True, # <--- Added flag
    db: Session = Depends(get_db)
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting or meeting.status != "active":
        raise HTTPException(status_code=400, detail="Meeting not active")
    
    participant = db.query(MeetingParticipant).filter(
        MeetingParticipant.meeting_id == meeting_id,
        MeetingParticipant.staff_id == staff_id
    ).first()
    
    if not participant:
        raise HTTPException(status_code=404, detail="Staff member is not a participant in this meeting")
        
    staff = participant.staff
    
    # Extract primitives before entering async generator
    p_llm_provider = participant.llm_provider
    p_llm_model = participant.llm_model
    
    # Only save the user message if requested (prevents duplicates in Ask All)
    if save_user_message:
        user_message = MeetingMessage(
            meeting_id=meeting_id, sender_type="user", sender_name=message.sender_name, content=message.content
        )
        db.add(user_message)
        db.commit()
    
    # Link mentioned company assets to meeting images
    link_mentioned_assets(db, meeting_id, meeting.company_id, message.content)
    
    meeting_context = memory_service.get_meeting_context(db, meeting_id)
    knowledge_context = memory_service.get_company_knowledge_context(db, meeting.company_id)
    
    # Parse @mentions from message content to get image paths
    image_paths, missing_mentions = mention_parser.resolve_all_mentions(
        message.content, meeting_id, meeting.company_id, db
    )
    
    # Warn if any mentions were not found
    if missing_mentions:
        print(f"WARNING: Missing mentions in message: {missing_mentions}")

    company = db.query(Company).filter(Company.id == meeting.company_id).first()
    
    system_prompt = llm_service.build_system_prompt(
        staff_name=staff.name,
        role=staff.role,
        personality=staff.personality,
        expertise=staff.expertise,
        company_context=knowledge_context,
        meeting_context=meeting_context,
        company_name=company.name if company else "MyVCO",
        company_description=company.description if company else "",
        db=db
    )
    
    # Apply explicit overrides if provided
    if message.custom_system_prompt is not None:
        system_prompt = message.custom_system_prompt
    
    final_prompt = message.custom_user_content if message.custom_user_content is not None else message.content
    
    async def generate_response():
        response_parts = []
        async for chunk in llm_service.generate_stream(
            prompt=final_prompt, 
            system_prompt=system_prompt, 
            provider=p_llm_provider, 
            model=p_llm_model,       
            image_paths=image_paths
        ):
            response_parts.append(chunk)
            yield chunk
        
        full_response = "".join(response_parts)
        
        from ..database import SessionLocal
        with SessionLocal() as new_db:
            staff_message = MeetingMessage(
                meeting_id=meeting_id, staff_id=staff_id, sender_type="staff",
                sender_name=staff.name, content=full_response
            )
            new_db.add(staff_message)
            new_db.commit()
    
    return StreamingResponse(generate_response(), media_type="text/plain")

@router.post("/{meeting_id}/messages/preview")
async def preview_prompt(
    meeting_id: int, 
    message: schemas.SendMessageRequest, 
    staff_id: int, 
    db: Session = Depends(get_db)
):
    """Generate the system prompt and user message preview without sending them to the LLM"""
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting or meeting.status != "active":
        raise HTTPException(status_code=400, detail="Meeting not active")
    
    participant = db.query(MeetingParticipant).filter(
        MeetingParticipant.meeting_id == meeting_id,
        MeetingParticipant.staff_id == staff_id
    ).first()
    
    if not participant:
        raise HTTPException(status_code=404, detail="Staff member is not a participant in this meeting")
        
    staff = participant.staff
    
    meeting_context = memory_service.get_meeting_context(db, meeting_id)
    knowledge_context = memory_service.get_company_knowledge_context(db, meeting.company_id)
    company = db.query(Company).filter(Company.id == meeting.company_id).first()
    
    system_prompt = llm_service.build_system_prompt(
        staff_name=staff.name,
        role=staff.role,
        personality=staff.personality,
        expertise=staff.expertise,
        company_context=knowledge_context,
        meeting_context=meeting_context,
        company_name=company.name if company else "MyVCO",
        company_description=company.description if company else "",
        db=db
    )
    
    # 3. Handle mentions (images and assets) for Token Estimation & UI Thumbnail delivery
    image_paths, missing_mentions = mention_parser.resolve_all_mentions(
        text=message.content,
        meeting_id=meeting_id,
        company_id=meeting.company_id,
        db=db
    )
    
    # Convert absolute paths to relative web URLs for frontend rendering
    image_urls = []
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    for path in image_paths:
        try:
            # We want to format string: C:/path/to/backend/uploads/... -> /uploads/...
            rel_path = os.path.relpath(path, base_dir)
            # Normalize to forward slashes for web usage
            rel_path = rel_path.replace("\\", "/")
            if not rel_path.startswith("/"):
                rel_path = "/" + rel_path
            image_urls.append(rel_path)
        except Exception as e:
            print(f"Warning: Could not resolve relative URL for {path}: {e}")
    
    provider = participant.llm_provider
    model_name = participant.llm_model or ("gemini-2.0-flash" if provider == "gemini" else "llama3")
    max_tokens = await llm_service.get_max_tokens(provider, model_name, db)
    
    return {
        "system_prompt": system_prompt,
        "user_content": message.content,
        "llm_provider": provider,
        "llm_model": model_name,
        "max_tokens": max_tokens,
        "image_urls": image_urls
    }

@router.put("/messages/{message_id}", response_model=schemas.MeetingMessage)
def update_message(
    message_id: int,
    message_update: schemas.UpdateMessageRequest,
    db: Session = Depends(get_db)
):
    """Update a message content"""
    message = db.query(MeetingMessage).filter(MeetingMessage.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    message.content = message_update.content
    db.commit()
    db.refresh(message)
    return message

@router.post("/messages/{message_id}/resend")
async def resend_message(
    message_id: int,
    staff_id: int,
    db: Session = Depends(get_db)
):
    """Resend a message - deletes all subsequent messages and regenerates response"""
    # Get the message to resend
    message = db.query(MeetingMessage).filter(MeetingMessage.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    if message.sender_type != "user":
        raise HTTPException(status_code=400, detail="Can only resend user messages")
    
    meeting_id = message.meeting_id
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting or meeting.status != "active":
        raise HTTPException(status_code=400, detail="Meeting not active")
    
    # Delete all messages created after this message
    db.query(MeetingMessage).filter(
        MeetingMessage.meeting_id == meeting_id,
        MeetingMessage.created_at > message.created_at
    ).delete()
    db.commit()
    
    # Get participant info
    participant = db.query(MeetingParticipant).filter(
        MeetingParticipant.meeting_id == meeting_id,
        MeetingParticipant.staff_id == staff_id
    ).first()
    
    if not participant:
        raise HTTPException(status_code=404, detail="Staff member is not a participant in this meeting")
    
    staff = participant.staff
    p_llm_provider = participant.llm_provider
    p_llm_model = participant.llm_model
    
    # Link mentioned company assets
    link_mentioned_assets(db, meeting_id, meeting.company_id, message.content)
    
    # Get context
    meeting_context = memory_service.get_meeting_context(db, meeting_id)
    knowledge_context = memory_service.get_company_knowledge_context(db, meeting.company_id)
    
    # Parse mentions
    image_paths, missing_mentions = mention_parser.resolve_all_mentions(
        message.content, meeting_id, meeting.company_id, db
    )
    
    if missing_mentions:
        print(f"WARNING: Missing mentions in resend: {missing_mentions}")
    
    company = db.query(Company).filter(Company.id == meeting.company_id).first()
    
    system_prompt = llm_service.build_system_prompt(
        staff_name=staff.name,
        role=staff.role,
        personality=staff.personality,
        expertise=staff.expertise,
        company_context=knowledge_context,
        meeting_context=meeting_context,
        company_name=company.name if company else "MyVCO",
        company_description=company.description if company else "",
        db=db
    )
    
    # No custom overrides implemented in resend for now (can be passed via schema if updated, but keeping it simple)
    # If we wanted to allow overrides in resend, we'd add custom_system_prompt as query param or body. We will leave it standard.

    async def generate_response():
        response_parts = []
        async for chunk in llm_service.generate_stream(
            prompt=message.content,
            system_prompt=system_prompt,
            provider=p_llm_provider,
            model=p_llm_model,
            image_paths=image_paths
        ):
            response_parts.append(chunk)
            yield chunk
        
        full_response = "".join(response_parts)
        
        from ..database import SessionLocal
        with SessionLocal() as new_db:
            staff_message = MeetingMessage(
                meeting_id=meeting_id, staff_id=staff_id, sender_type="staff",
                sender_name=staff.name, content=full_response
            )
            new_db.add(staff_message)
            new_db.commit()
    
    return StreamingResponse(generate_response(), media_type="text/plain")

@router.put("/{meeting_id}/status")
async def update_meeting_status(
    meeting_id: int, 
    status_update: schemas.UpdateMeetingStatusRequest, 
    db: Session = Depends(get_db)
):
    """Update meeting status (end meeting) and generate summary with specific LLM"""
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    meeting.status = status_update.status
    
    if status_update.status == "ended":
        meeting.ended_at = datetime.utcnow()
        
        summary = await memory_service.generate_meeting_summary(
            db, 
            meeting_id, 
            llm_service,
            provider=status_update.summary_llm_provider,
            model=status_update.summary_llm_model
        )
        meeting.summary = summary
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
    
    # Link mentioned company assets to meeting images
    link_mentioned_assets(db, meeting_id, company_id, message.content)
    
    participants_query = db.query(MeetingParticipant).filter(MeetingParticipant.meeting_id == meeting_id).all()
    
    # Eager load participant data to avoid detached session errors during streaming
    participants_data = []
    for p in participants_query:
        if p.staff:
            participants_data.append({
                'staff_id': p.staff.id,
                'name': p.staff.name,
                'role': p.staff.role,
                'personality': p.staff.personality,
                'expertise': p.staff.expertise,
                'system_prompt': p.staff.system_prompt,
                'llm_provider': p.llm_provider,
                'llm_model': p.llm_model
            })
            
    meeting_context = memory_service.get_meeting_context(db, meeting_id)
    knowledge_context = memory_service.get_company_knowledge_context(db, company_id)
    
    # Parse @mentions from message content to get image paths
    image_paths, missing_mentions = mention_parser.resolve_all_mentions(
        message.content, meeting_id, company_id, db
    )
    
    # Warn if any mentions were not found
    if missing_mentions:
        print(f"WARNING: Missing mentions in ask_all: {missing_mentions}")
    
    company = db.query(Company).filter(Company.id == meeting.company_id).first()
    company_name = company.name if company else "MyVCO"
    company_desc = company.description if company else ""

    async def generate_all_responses():
        from ..database import SessionLocal
        
        for p_data in participants_data:
            system_prompt = llm_service.build_system_prompt(
                staff_name=p_data['name'], 
                role=p_data['role'], 
                personality=p_data['personality'],
                expertise=p_data['expertise'], 
                company_context=knowledge_context,
                meeting_context=meeting_context,
                company_name=company_name,
                company_description=company_desc,
                system_prompt=p_data['system_prompt'], 
                db=db
            )
            
            # Allow overrides
            if message.custom_system_prompt is not None:
                system_prompt = message.custom_system_prompt
                
            final_prompt = message.custom_user_content if message.custom_user_content is not None else message.content
            
            # Send the staff delimiter first
            yield f"---STAFF:{p_data['name']}---\n"
            
            response_parts = []
            
            # FIX: Explicitly iterate over the inner generator and yield its chunks
            async for chunk in llm_service.generate_stream(
                prompt=final_prompt, 
                system_prompt=system_prompt, 
                provider=p_data['llm_provider'],
                model=p_data['llm_model'],
                image_paths=image_paths
            ):
                response_parts.append(chunk)
                yield chunk
            
            # Save the complete response to the database
            full_response = "".join(response_parts)
            
            # Use a new session for saving since the main one is closed/unsafe in async generator
            with SessionLocal() as new_db:
                staff_message = MeetingMessage(
                    meeting_id=meeting_id, staff_id=p_data['staff_id'], sender_type="staff",
                    sender_name=p_data['name'], content=full_response
                )
                new_db.add(staff_message)
                new_db.commit()
    
    return StreamingResponse(generate_all_responses(), media_type="text/plain")

@router.post("/{meeting_id}/upload-image")
async def upload_meeting_image(meeting_id: int, image: MeetingImageCreate, db: Session = Depends(get_db)):
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
        
        # Auto-assign display_order based on existing images count
        existing_images_count = db.query(MeetingImage).filter(MeetingImage.meeting_id == meeting_id).count()
        display_order = existing_images_count + 1
        
        with open(abs_image_path, "wb") as f:
            f.write(image_data)
            f.flush()
            os.fsync(f.fileno()) 
        
        relative_path = f"uploads/meeting_images/{image_filename}"
        
        db_image = MeetingImage(
            meeting_id=meeting_id,
            image_path=relative_path,
            display_order=display_order,
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
    images = db.query(MeetingImage).filter(MeetingImage.meeting_id == meeting_id).order_by(MeetingImage.display_order).all()
    return [{
        "id": img.id,
        "image_url": f"/{img.image_path.replace(os.sep, '/')}",
        "description": img.image_metadata,
        "display_order": img.display_order,
        "created_at": img.created_at
    } for img in images]

@router.get("/{meeting_id}/action-items", response_model=List[ActionItemSchema])
def get_action_items(meeting_id: int, db: Session = Depends(get_db)):
    return db.query(ActionItem).filter(ActionItem.meeting_id == meeting_id).all()

@router.post("/{meeting_id}/action-items", response_model=ActionItemSchema)
def create_action_item(meeting_id: int, action_item: ActionItemCreate, db: Session = Depends(get_db)):
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
    # Implementation skipped for brevity
    pass

@router.delete("/{meeting_id}")
def delete_meeting(meeting_id: int, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    images = db.query(MeetingImage).filter(MeetingImage.meeting_id == meeting_id).all()
    for img in images:
        if img.image_path:
            try:
                filename = os.path.basename(img.image_path)
                file_path = os.path.join(UPLOADS_DIR, filename)
                if os.path.exists(file_path): os.remove(file_path)
            except: pass

    db.query(MeetingImage).filter(MeetingImage.meeting_id == meeting_id).delete()
    db.delete(meeting)
    db.commit()
    return {"message": "Meeting deleted successfully"}

@router.post("/{meeting_id}/autonomous")
async def start_autonomous_session(
    meeting_id: int, 
    request: schemas.SendMessageRequest, 
    db: Session = Depends(get_db)
):
    """
    Starts an autonomous AutoGen loop.
    """
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting or meeting.status != "active":
        raise HTTPException(status_code=400, detail="Meeting not active")

    # Create Stop Event
    stop_event = threading.Event()
    autonomous_stop_events[meeting_id] = stop_event

    msg_queue = queue.Queue()
    
    participants = db.query(MeetingParticipant).filter(MeetingParticipant.meeting_id == meeting_id).all()
    if len(participants) < 1:
        raise HTTPException(status_code=400, detail="Need at least 1 participant")

    # Context
    company_id = meeting.company_id
    knowledge_context = memory_service.get_company_knowledge_context(db, company_id)
    image_context = memory_service.get_current_meeting_image(db, meeting_id)

    agent_list = []
    agent_map = {} 

    user_proxy = autogen_service.create_user_proxy()
    
    for p in participants:
        staff = p.staff
        system_prompt = llm_service.build_system_prompt(
            staff_name=staff.name,
            role=staff.role,
            personality=staff.personality,
            expertise=staff.expertise,
            company_context=knowledge_context,
            meeting_context=image_context,
            system_prompt=staff.system_prompt,
            db=db
        )
        
        agent = autogen_service.create_agent(
            staff_name=staff.name,
            system_prompt=system_prompt,
            provider=p.llm_provider,
            model=p.llm_model
        )
        
        # Hook to check stop signal on every reply
        def check_stop(recipient, messages, sender, config):
            if stop_event.is_set():
                return True, "TERMINATE" # Force termination
            return False, None
            
        agent.register_reply([autogen.Agent, None], check_stop, position=0)

        agent_list.append(agent)
        agent_map[agent.name] = staff.id

    # Register Tools if Path provided
    if request.target_path:
        if os.path.exists(request.target_path):
            print(f"DEBUG: Registering Tools for {request.target_path}")
            register_filesystem_tools(user_proxy, agent_list, request.target_path)
            tool_msg = "\n\n[SYSTEM]: You have FILE SYSTEM ACCESS. Use tools 'list_files', 'read_file', 'write_file'. Always list/read before writing."
            for ag in agent_list:
                ag.update_system_message(ag.system_message + tool_msg)
        else:
            msg_queue.put({"type": "agent", "sender": "System", "content": f"Warning: Path {request.target_path} not found."})

    # Message Capture
    class SpyList(list):
        def append(self, item):
            super().append(item)
            if isinstance(item, dict):
                sender = item.get("name", "Unknown")
                content = item.get("content", "")
                if sender != user_proxy.name and content and content.strip() and content != "TERMINATE":
                    msg_queue.put({"sender": sender, "content": content, "type": "agent"})

    # Run Loop
    def run_autogen_loop():
        try:
            # 1-on-1 Mode
            if len(agent_list) == 1:
                print("DEBUG: Starting 1-on-1 Chat")
                user_proxy.initiate_chat(
                    agent_list[0],
                    message=request.content
                )
            # Group Mode
            else:
                print("DEBUG: Starting Group Chat")
                groupchat = autogen.GroupChat(
                    agents=[user_proxy] + agent_list, 
                    messages=SpyList(),
                    max_round=12
                )
                # Determine Manager LLM (Prefer Gemini, fallback Ollama)
                from ..config import settings
                if settings.gemini_api_key:
                     mgr_config = autogen_service._get_llm_config("gemini", "gemini-2.0-flash")
                elif settings.ollama_base_url:
                     def_model = participants[0].llm_model or "llama3"
                     mgr_config = autogen_service._get_llm_config("ollama", def_model)
                
                manager = autogen.GroupChatManager(groupchat=groupchat, llm_config=mgr_config)
                user_proxy.initiate_chat(manager, message=request.content)

        except Exception as e:
            print(f"AutoGen Error: {e}")
            msg_queue.put({"type": "error", "content": str(e)})
        finally:
            msg_queue.put({"type": "done"})
            if meeting_id in autonomous_stop_events:
                del autonomous_stop_events[meeting_id]

    thread = threading.Thread(target=run_autogen_loop)
    thread.start()

    # Streamer
    async def response_generator():
        # Save trigger
        from ..database import SessionLocal
        with SessionLocal() as local_db:
            user_msg = MeetingMessage(
                meeting_id=meeting_id, sender_type="user", sender_name="User (Autonomous)", content=request.content
            )
            local_db.add(user_msg)
            local_db.commit()

        while True:
            try:
                data = await asyncio.to_thread(msg_queue.get)
                if data["type"] == "done": break
                if data["type"] == "error": 
                    yield f"ERROR: {data['content']}\n"
                    break
                
                if data["type"] == "agent":
                    sender = data["sender"]
                    if "chat_manager" in sender: continue
                    
                    yield f"---STAFF:{sender}---\n{data['content']}\n"
                    
                    # Save
                    staff_id = agent_map.get(sender)
                    if staff_id:
                        with SessionLocal() as local_db:
                             db_msg = MeetingMessage(
                                meeting_id=meeting_id, staff_id=staff_id, 
                                sender_type="staff", sender_name=sender, content=data['content']
                             )
                             local_db.add(db_msg)
                             local_db.commit()
            except Exception as e:
                break

    return StreamingResponse(response_generator(), media_type="text/plain")