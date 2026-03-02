"""
Sync Logs API endpoints for monitoring data synchronization operations
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import Optional
from datetime import datetime
import math

from app.database import get_db
from app.dependencies import get_current_worker
from app.models.worker import Worker
from app.models.sync_log import SyncLog
from app.schemas.sync_logs import SyncLogResponse, SyncLogListResponse

router = APIRouter(prefix="/api/v1/sync-logs", tags=["sync-logs"])


@router.get("", response_model=SyncLogListResponse)
def get_sync_logs(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    status: Optional[str] = Query(None, description="Filter by status: completed, incomplete, failed"),
    start_date: Optional[datetime] = Query(None, description="Filter by start date (inclusive)"),
    end_date: Optional[datetime] = Query(None, description="Filter by end date (inclusive)"),
    current_worker: Worker = Depends(get_current_worker),
    db: Session = Depends(get_db)
) -> SyncLogListResponse:
    """
    Get paginated list of sync logs with filtering
    
    Requirements: 23, 33
    
    Args:
        page: Page number (1-indexed)
        page_size: Number of items per page (default 20, max 100)
        status: Optional filter by status (completed, incomplete, failed)
        start_date: Optional filter by start date
        end_date: Optional filter by end date
        current_worker: Authenticated worker from JWT token
        db: Database session
        
    Returns:
        Paginated list of sync logs with worker names and visit counts
        
    Raises:
        HTTPException: If validation fails
    """
    # Build base query with worker join for name
    query = db.query(
        SyncLog,
        Worker.first_name,
        Worker.last_name
    ).join(
        Worker, SyncLog.worker_id == Worker.id
    )
    
    # Apply status filter
    if status:
        # Validate status value
        valid_statuses = ["completed", "incomplete", "failed"]
        if status not in valid_statuses:
            from fastapi import HTTPException, status as http_status
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
            )
        query = query.filter(SyncLog.status == status)
    
    # Apply date range filters
    if start_date:
        query = query.filter(SyncLog.date_time >= start_date)
    
    if end_date:
        query = query.filter(SyncLog.date_time <= end_date)
    
    # Get total count before pagination
    total = query.count()
    
    # Calculate total pages
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    
    # Apply ordering (most recent first)
    query = query.order_by(desc(SyncLog.date_time))
    
    # Apply pagination
    offset = (page - 1) * page_size
    results = query.offset(offset).limit(page_size).all()
    
    # Build response items
    items = []
    for sync_log, first_name, last_name in results:
        # Build worker name
        worker_name = f"{first_name} {last_name}"
        
        # Get visit count from meta_data or default to 1
        visit_count = sync_log.meta_data.get("visit_count", 1) if sync_log.meta_data else 1
        
        items.append(
            SyncLogResponse(
                id=sync_log.id,
                visit_id=sync_log.visit_id,
                worker_id=sync_log.worker_id,
                worker_name=worker_name,
                collection_center_id=sync_log.collection_center_id,
                date_time=sync_log.date_time,
                status=sync_log.status,
                error_message=sync_log.error_message,
                visit_count=visit_count,
                meta_data=sync_log.meta_data or {}
            )
        )
    
    return SyncLogListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )
