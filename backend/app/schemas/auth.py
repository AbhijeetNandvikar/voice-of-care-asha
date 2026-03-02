"""
Pydantic schemas for authentication endpoints
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime


class LoginRequest(BaseModel):
    """Request schema for worker login"""
    worker_id: str = Field(..., min_length=8, max_length=8, description="8-digit worker ID")
    password: str = Field(..., min_length=8, description="Worker password")


class MPINSetupRequest(BaseModel):
    """Request schema for MPIN setup"""
    mpin: str = Field(..., min_length=4, max_length=4, pattern="^[0-9]{4}$", description="4-digit MPIN")


class MPINVerifyRequest(BaseModel):
    """Request schema for MPIN verification"""
    worker_id: str = Field(..., min_length=8, max_length=8, description="8-digit worker ID")
    mpin: str = Field(..., min_length=4, max_length=4, pattern="^[0-9]{4}$", description="4-digit MPIN")


class WorkerProfile(BaseModel):
    """Worker profile information returned in authentication responses"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    first_name: str
    last_name: str
    worker_id: str
    worker_type: str
    phone_number: str
    email: Optional[str] = None
    address: Optional[str] = None
    profile_photo_url: Optional[str] = None
    collection_center_id: Optional[int] = None
    created_at: datetime


class TokenResponse(BaseModel):
    """Response schema for authentication endpoints"""
    access_token: str
    token_type: str = "bearer"
    worker: WorkerProfile
