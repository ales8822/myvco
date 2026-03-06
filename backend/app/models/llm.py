from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from ..database import Base

class LlmModelLimit(Base):
    __tablename__ = "llm_model_limits"

    id = Column(Integer, primary_key=True, index=True)
    provider = Column(String(50), index=True, nullable=False)
    model_name = Column(String(100), index=True, nullable=False)
    max_tokens = Column(Integer, nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
