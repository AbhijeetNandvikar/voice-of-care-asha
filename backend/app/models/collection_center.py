"""
Collection Center model
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from datetime import datetime, UTC
from app.models.base import Base


class CollectionCenter(Base):
    """Collection Center model for healthcare facilities"""
    
    __tablename__ = "collection_centers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    address = Column(Text)
    meta_data = Column(JSON, default={})
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
