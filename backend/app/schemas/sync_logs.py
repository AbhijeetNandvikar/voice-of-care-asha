"""
Pydantic schemas for sync log request/response validation
"""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Dict, Any


class SyncLogResponse(BaseModel):
    """Response schema for a single sync log entry"""
    
    id: int
    visit_id: Optional[int] = None
    worker_id: int
    worker_name: str = Field(..., description="Full name of the worker")
    collection_center_id: Optional[int] = None
    date_time: datetime
    status: str = Field(..., description="Status: completed, incomplete, failed")
    error_message: Optional[str] = None
    visit_count: int = Field(default=1, description="Number of visits in this sync operation")
    meta_data: Dict[str, Any] = Field(default_factory=dict)
    
    class Config:
        from_attributes = True


class SyncLogListResponse(BaseModel):
    """Response schema for paginated sync log list"""
    
    items: List[SyncLogResponse]
    total_count: int
    page: int
    page_size: int
    total_pages: int
