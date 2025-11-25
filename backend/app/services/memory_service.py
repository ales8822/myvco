import os
from pathlib import Path
from sqlalchemy.orm import Session
from typing import List, Optional
from ..models import Meeting, MeetingMessage, Knowledge


class MemoryService:
    """Service for managing meeting memory and context"""
    
    # Calculate absolute path to backend root
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    
    def get_meeting_context(self, db: Session, meeting_id: int, limit: int = 10) -> str:
        """Get recent meeting messages as context"""
        messages = db.query(MeetingMessage)\
            .filter(MeetingMessage.meeting_id == meeting_id)\
            .order_by(MeetingMessage.created_at.desc())\
            .limit(limit)\
            .all()
        
        if not messages:
            return "This is the start of the meeting."
        
        # Reverse to chronological order
        messages = reversed(messages)
        
        context_parts = ["Recent conversation:"]
        for msg in messages:
            context_parts.append(f"{msg.sender_name}: {msg.content}")
        
        return "\n".join(context_parts)
    
    def get_company_knowledge_context(self, db: Session, company_id: int, limit: int = 5) -> str:
        """Get company knowledge base as context"""
        knowledge_entries = db.query(Knowledge)\
            .filter(Knowledge.company_id == company_id)\
            .order_by(Knowledge.created_at.desc())\
            .limit(limit)\
            .all()
        
        if not knowledge_entries:
            return ""
        
        context_parts = ["Company Knowledge Base:"]
        for entry in knowledge_entries:
            context_parts.append(f"- {entry.title}: {entry.content[:200]}...")
        
        return "\n".join(context_parts)
    
    def get_current_meeting_image(self, db: Session, meeting_id: int) -> str:
        """Get current image context for AI to be aware of"""
        from ..models import MeetingImage
        
        # Get the most recent image for this meeting
        current_image = db.query(MeetingImage)\
            .filter(MeetingImage.meeting_id == meeting_id)\
            .order_by(MeetingImage.created_at.desc())\
            .first()
        
        if not current_image:
            return ""
        
        # Build image context for AI
        image_context = "\n\nCURRENT IMAGE IN DISCUSSION:\n"
        image_context += f"An image has been uploaded to the meeting chat.\n"
        
        if current_image.image_metadata:
            image_context += f"User provided description: {current_image.image_metadata}\n"
        
        image_context += "The image file has been provided to you. Please analyze it visually and answer any questions about it."
        
        return image_context

    def get_current_image_path(self, db: Session, meeting_id: int) -> Optional[str]:
        """Get the absolute file path with robust fallback"""
        from ..models import MeetingImage
        current_image = db.query(MeetingImage).filter(MeetingImage.meeting_id == meeting_id)\
            .order_by(MeetingImage.created_at.desc()).first()
            
        if current_image and current_image.image_path:
            raw_path = current_image.image_path.replace("\\", "/") # Normalize to forward slash
            if raw_path.startswith("/"): raw_path = raw_path[1:]
            
            # Strategy 1: Relative to BASE_DIR (Standard)
            path_1 = os.path.join(self.BASE_DIR, raw_path)
            if os.path.exists(path_1): return path_1
            
            # Strategy 2: Relative to CWD (If running from different folder)
            path_2 = os.path.abspath(raw_path)
            if os.path.exists(path_2): return path_2
            
            # Strategy 3: Just the filename in uploads/meeting_images
            filename = os.path.basename(raw_path)
            path_3 = os.path.join(self.BASE_DIR, "uploads", "meeting_images", filename)
            if os.path.exists(path_3): return path_3
            
            print(f"DEBUG: Could not find image. Checked: \n1: {path_1}\n2: {path_2}\n3: {path_3}")
                
        return None
    
    async def generate_meeting_summary(
        self,
        db: Session,
        meeting_id: int,
        llm_service
    ) -> str:
        """Generate a summary of the meeting using LLM"""
        from ..models import MeetingImage
        
        messages = db.query(MeetingMessage)\
            .filter(MeetingMessage.meeting_id == meeting_id)\
            .order_by(MeetingMessage.created_at)\
            .all()
        
        if not messages:
            return "No discussion took place."
        
        # Build conversation transcript
        transcript = []
        for msg in messages:
            transcript.append(f"{msg.sender_name}: {msg.content}")
        
        conversation = "\n".join(transcript)
        
        # Get images discussed
        images = db.query(MeetingImage)\
            .filter(MeetingImage.meeting_id == meeting_id)\
            .all()
        
        images_context = ""
        if images:
            images_context = "\n\nImages discussed in this meeting:\n"
            for img in images:
                desc = img.image_metadata or "No description"
                images_context += f"- {desc}\n"
        
        # Generate summary using LLM
        system_prompt = (
            "You are a professional meeting summarizer. Create a concise summary of the meeting "
            "highlighting key points, decisions made, and action items. "
            "If images were discussed, mention them in the summary."
        )
        
        prompt = f"Please summarize this meeting:\n\n{conversation}{images_context}"
        
        summary_parts = []
        async for chunk in llm_service.generate_stream(
            prompt=prompt,
            system_prompt=system_prompt,
            provider="gemini"
        ):
            summary_parts.append(chunk)
        
        return "".join(summary_parts)


# Singleton instance
memory_service = MemoryService()