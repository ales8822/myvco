from sqlalchemy import Table, Column, Integer, ForeignKey
from ..database import Base

company_staff = Table(
    "company_staff",
    Base.metadata,
    Column("company_id", Integer, ForeignKey("companies.id"), primary_key=True),
    Column("staff_id", Integer, ForeignKey("staff.id"), primary_key=True)
)
