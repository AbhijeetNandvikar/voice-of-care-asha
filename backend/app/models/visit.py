"""
Visit model for healthcare visit records
"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, JSON
from datetime import datetime
from app.models.base import Base


class Visit(Base):
    """Visit model representing healthcare visit records"""
    
    __tablename__ = "visits"
    
    id = Column(Integer, primary_key=True, index=True)
    visit_type = Column(String, nullable=False, index=True)  # hbnc, anc, pnc
    visit_date_time = Column(DateTime, nullable=False, index=True)
    day_number = Column(Integer)  # HBNC: 1, 3, 7, 14, 28
    is_synced = Column(Boolean, default=False, nullable=False, index=True)
    assigned_asha_id = Column(Integer, ForeignKey("workers.id"), nullable=False)
    beneficiary_id = Column(Integer, ForeignKey("beneficiaries.id"), nullable=False)
    template_id = Column(Integer, ForeignKey("visit_templates.id"), nullable=False)
    visit_data = Column(JSON, nullable=False)
    meta_data = Column(JSON, default={})
    synced_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
