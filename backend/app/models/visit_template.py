"""
Visit Template model for structured questionnaires
"""

from sqlalchemy import Column, Integer, String, DateTime, JSON
from datetime import datetime, UTC
from app.models.base import Base


class VisitTemplate(Base):
    """Visit Template model defining structured questionnaires for different visit types"""
    
    __tablename__ = "visit_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    template_type = Column(String, nullable=False, index=True)  # hbnc, anc, pnc
    name = Column(String, nullable=False)
    questions = Column(JSON, nullable=False)
    meta_data = Column(JSON, default={})
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
