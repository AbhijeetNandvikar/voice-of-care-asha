"""
Pydantic schemas for beneficiaries endpoints
"""

from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal


class BeneficiaryCreate(BaseModel):
    """Schema for creating a new beneficiary"""
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    phone_number: Optional[str] = Field(None, pattern=r"^\d{10}$", description="10-digit phone number")
    aadhar_id: Optional[str] = Field(None, pattern=r"^\d{12}$", description="12-digit Aadhar ID")
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    age: Optional[int] = Field(None, ge=0, description="Age in years")
    weight: Optional[Decimal] = Field(None, ge=0, description="Weight in kg")
    mcts_id: str = Field(..., min_length=1, description="Mother Child Tracking System ID")
    beneficiary_type: str = Field(..., pattern="^(individual|child|mother_child)$")
    assigned_asha_id: Optional[int] = Field(None, description="ID of assigned ASHA worker")
    meta_data: Optional[Dict[str, Any]] = None


class BeneficiaryUpdate(BaseModel):
    """Schema for updating an existing beneficiary"""
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone_number: Optional[str] = Field(None, pattern=r"^\d{10}$")
    aadhar_id: Optional[str] = Field(None, pattern=r"^\d{12}$")
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    age: Optional[int] = Field(None, ge=0)
    weight: Optional[Decimal] = Field(None, ge=0)
    mcts_id: Optional[str] = Field(None, min_length=1)
    beneficiary_type: Optional[str] = Field(None, pattern="^(individual|child|mother_child)$")
    assigned_asha_id: Optional[int] = None
    meta_data: Optional[Dict[str, Any]] = None


class BeneficiaryResponse(BaseModel):
    """Schema for beneficiary response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    first_name: str
    last_name: str
    phone_number: Optional[str] = None
    aadhar_id: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    age: Optional[int] = None
    weight: Optional[Decimal] = None
    mcts_id: str
    beneficiary_type: str
    assigned_asha_id: Optional[int] = None
    meta_data: Dict[str, Any]
    created_at: datetime
    updated_at: datetime


class BeneficiaryListResponse(BaseModel):
    """Schema for paginated beneficiary list response"""
    beneficiaries: List[BeneficiaryResponse]
    total_count: int
    page: int
    page_size: int
    total_pages: int
