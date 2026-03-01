"""
Worker model for ASHA workers, medical officers, and other healthcare workers
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from datetime import datetime
from app.models.base import Base


class Worker(Base):
    """Worker model representing healthcare workers in the system"""
    
    __tablename__ = "workers"
    
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    phone_number = Column(String, nullable=False)
    aadhar_id = Column(String, unique=True)
    email = Column(String, unique=True)
    address = Column(Text)
    worker_type = Column(String, nullable=False)  # asha_worker, medical_officer, anm, aaw
    worker_id = Column(String(8), unique=True, nullable=False, index=True)
    password_hash = Column(Text, nullable=False)
    mpin_hash = Column(Text)
    collection_center_id = Column(Integer, ForeignKey("collection_centers.id"))
    profile_photo_url = Column(Text)
    meta_data = Column(JSON, default={})
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
