from sqlalchemy.orm import Session
from typing import List, Optional
from ..models import Meeting, MeetingMessage, Knowledge


class MemoryService:
    """Service for managing meeting memory and context"""
    
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
    
    def get_previous_meetings_summary(self, db: Session, company_id: int, limit: int = 3) -> str:
        """Get summaries from previous meetings"""
        meetings = db.query(Meeting)\
            .filter(
                Meeting.company_id == company_id,
                Meeting.status == "ended",
                Meeting.summary.isnot(None)
            )\
            .order_by(Meeting.ended_at.desc())\
            .limit(limit)\
            .all()
        
        if not meetings:
            return ""
        
        context_parts = ["Previous Meeting Summaries:"]
        for meeting in meetings:
            context_parts.append(f"- {meeting.title}: {meeting.summary}")
        
        return "\n".join(context_parts)
    
    async def generate_meeting_summary(
        self,
        db: Session,
        meeting_id: int,
        llm_service
    ) -> str:
        """Generate a summary of the meeting using LLM"""
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
        
        # Generate summary using LLM
        system_prompt = (
            "You are a professional meeting summarizer. Create a concise summary of the meeting "
            "highlighting key points, decisions made, and action items."
        )
        
        prompt = f"Please summarize this meeting:\n\n{conversation}"
        
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
