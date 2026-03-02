"""
Sync Log model for tracking data synchronization operations
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from datetime import datetime, UTC
from app.models.base import Base


class SyncLog(Base):
    """Sync Log model for tracking data synchronization operations"""
    
    __tablename__ = "sync_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    visit_id = Column(Integer, ForeignKey("visits.id"))
    worker_id = Column(Integer, ForeignKey("workers.id"), nullable=False)
    collection_center_id = Column(Integer, ForeignKey("collection_centers.id"))
    date_time = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False, index=True)
    status = Column(String, nullable=False)  # completed, incomplete, failed
    error_message = Column(Text)
    meta_data = Column(JSON, default={})
