# backend\app\models\__init__.py
# Import all models for easy access
from .company import Company
from .staff import Staff
from .meeting import Meeting, MeetingParticipant, MeetingMessage, MeetingImage, ActionItem, MeetingTemplate
from .knowledge import Knowledge

__all__ = [
    "Company",
    "Staff",
    "Meeting",
    "MeetingParticipant",
    "MeetingMessage",
    "MeetingImage",
    "ActionItem",
    "MeetingTemplate",
    "Knowledge"
]

