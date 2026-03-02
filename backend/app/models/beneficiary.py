"""
Beneficiary model for individuals receiving healthcare services
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Numeric, JSON
from datetime import datetime, UTC
from app.models.base import Base


class Beneficiary(Base):
    """Beneficiary model representing individuals receiving healthcare services"""
    
    __tablename__ = "beneficiaries"
    
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    phone_number = Column(String)
    aadhar_id = Column(String)
    email = Column(String)
    address = Column(Text)
    age = Column(Integer)
    weight = Column(Numeric(5, 2))
    mcts_id = Column(String, unique=True, index=True)
    beneficiary_type = Column(String, nullable=False)  # individual, child, mother_child
    assigned_asha_id = Column(Integer, ForeignKey("workers.id"))
    meta_data = Column(JSON, default={})
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC), nullable=False)
