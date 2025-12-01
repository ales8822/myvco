# backend\app\models\__init__.py
from .company import Company
from .department import Department
from .staff import Staff
from .meeting import Meeting, MeetingParticipant, MeetingMessage, MeetingImage, ActionItem, MeetingTemplate
from .knowledge import Knowledge
from .company_asset import CompanyAsset
from .library import LibraryItem

__all__ = [
    "Company",
    "Department",
    "Staff", 
    "Meeting",
    "MeetingParticipant",
    "MeetingMessage",
    "MeetingImage",
    "ActionItem",
    "MeetingTemplate",
    "Knowledge",
    "CompanyAsset",
    "LibraryItem"
]

