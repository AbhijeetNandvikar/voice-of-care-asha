"""
Pydantic schemas for workers endpoints
"""

from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime


class WorkerCreate(BaseModel):
    """Schema for creating a new worker"""
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    phone_number: str = Field(..., pattern=r"^\d{10}$", description="10-digit phone number")
    aadhar_id: Optional[str] = Field(None, pattern=r"^\d{12}$", description="12-digit Aadhar ID")
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    worker_type: str = Field(..., pattern="^(asha_worker|medical_officer|anm|aaw)$")
    password: str = Field(..., min_length=8, description="Password (min 8 characters)")
    collection_center_id: Optional[int] = None
    profile_photo_url: Optional[str] = None
    meta_data: Optional[Dict[str, Any]] = None


class WorkerUpdate(BaseModel):
    """Schema for updating an existing worker"""
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone_number: Optional[str] = Field(None, pattern=r"^\d{10}$")
    aadhar_id: Optional[str] = Field(None, pattern=r"^\d{12}$")
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    worker_type: Optional[str] = Field(None, pattern="^(asha_worker|medical_officer|anm|aaw)$")
    password: Optional[str] = Field(None, min_length=8)
    collection_center_id: Optional[int] = None
    profile_photo_url: Optional[str] = None
    meta_data: Optional[Dict[str, Any]] = None


class WorkerResponse(BaseModel):
    """Schema for worker response"""
    id: int
    first_name: str
    last_name: str
    phone_number: str
    aadhar_id: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    worker_type: str
    worker_id: str
    collection_center_id: Optional[int] = None
    profile_photo_url: Optional[str] = None
    meta_data: Dict[str, Any]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class WorkerListResponse(BaseModel):
    """Schema for paginated worker list response"""
    workers: List[WorkerResponse]
    total_count: int
    page: int
    page_size: int
    total_pages: int
