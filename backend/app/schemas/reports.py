"""
Pydantic schemas for report generation
"""

from pydantic import BaseModel, Field, field_validator
from datetime import date
from typing import Optional


class ReportGenerateRequest(BaseModel):
    """Schema for report generation request"""
    visit_type: str = Field(..., description="Type of visit: hbnc, anc, pnc")
    start_date: date = Field(..., description="Start date for report period")
    end_date: date = Field(..., description="End date for report period")
    worker_id: Optional[str] = Field(None, description="Optional worker ID (e.g., AW000001) to filter by specific ASHA worker")
    
    @field_validator('visit_type')
    @classmethod
    def validate_visit_type(cls, v: str) -> str:
        """Validate visit_type is one of allowed values"""
        allowed_types = ['hbnc', 'anc', 'pnc']
        if v not in allowed_types:
            raise ValueError(f"visit_type must be one of: {', '.join(allowed_types)}")
        return v
    
    @field_validator('end_date')
    @classmethod
    def validate_date_range(cls, v: date, info) -> date:
        """Validate end_date is after start_date"""
        if 'start_date' in info.data and v < info.data['start_date']:
            raise ValueError("end_date must be after or equal to start_date")
        return v


class ReportGenerateResponse(BaseModel):
    """Schema for report generation response"""
    report_id: str = Field(..., description="Unique report identifier")
    download_url: str = Field(..., description="Presigned URL for downloading the report")
    expires_at: str = Field(..., description="ISO timestamp when the download URL expires")
    message: str = Field(default="Report generated successfully", description="Success message")
