"""
Visits API endpoints for web dashboard
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List, Optional
from datetime import datetime, date
from app.database import get_db
from app.dependencies import get_current_worker
from app.models.worker import Worker
from app.models.visit import Visit
from app.models.beneficiary import Beneficiary


router = APIRouter(prefix="/api/v1/visits", tags=["visits"])


@router.get("")
async def get_visits(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    worker_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_worker: Worker = Depends(get_current_worker),
    db: Session = Depends(get_db)
):
    """
    Get paginated list of visits with filtering
    
    Requirements: 22
    
    Args:
        page: Page number (1-indexed)
        page_size: Number of items per page
        search: Search by MCTS_ID
        worker_id: Filter by ASHA worker ID
        start_date: Filter by start date
        end_date: Filter by end date
        current_worker: Authenticated worker from JWT token
        db: Database session
        
    Returns:
        Paginated response with visits
    """
    # Build query
    query = db.query(Visit).filter(Visit.is_synced == True)
    
    # Apply filters
    if search:
        # Search by MCTS_ID - join with beneficiaries
        query = query.join(Beneficiary, Visit.beneficiary_id == Beneficiary.id)
        query = query.filter(Beneficiary.mcts_id.ilike(f"%{search}%"))
    
    if worker_id:
        query = query.filter(Visit.assigned_asha_id == worker_id)
    
    if start_date:
        query = query.filter(Visit.visit_date_time >= datetime.combine(start_date, datetime.min.time()))
    
    if end_date:
        query = query.filter(Visit.visit_date_time <= datetime.combine(end_date, datetime.max.time()))
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * page_size
    visits = query.order_by(Visit.visit_date_time.desc()).offset(offset).limit(page_size).all()
    
    # Format response with joined data
    items = []
    for visit in visits:
        beneficiary = db.query(Beneficiary).filter(Beneficiary.id == visit.beneficiary_id).first()
        worker = db.query(Worker).filter(Worker.id == visit.assigned_asha_id).first()
        
        items.append({
            "id": visit.id,
            "visit_type": visit.visit_type,
            "visit_date_time": visit.visit_date_time.isoformat(),
            "day_number": visit.day_number,
            "is_synced": visit.is_synced,
            "assigned_asha_id": visit.assigned_asha_id,
            "beneficiary_id": visit.beneficiary_id,
            "template_id": visit.template_id,
            "visit_data": visit.visit_data,
            "meta_data": visit.meta_data,
            "synced_at": visit.synced_at.isoformat() if visit.synced_at else None,
            "created_at": visit.created_at.isoformat(),
            "updated_at": visit.updated_at.isoformat(),
            "beneficiary_name": f"{beneficiary.first_name} {beneficiary.last_name}" if beneficiary else "Unknown",
            "beneficiary_mcts_id": beneficiary.mcts_id if beneficiary else None,
            "worker_name": f"{worker.first_name} {worker.last_name}" if worker else "Unknown",
        })
    
    return {
        "items": items,
        "total_count": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


@router.get("/{visit_id}")
async def get_visit(
    visit_id: int,
    current_worker: Worker = Depends(get_current_worker),
    db: Session = Depends(get_db)
):
    """
    Get detailed visit information
    
    Requirements: 22
    
    Args:
        visit_id: Visit ID
        current_worker: Authenticated worker from JWT token
        db: Database session
        
    Returns:
        Visit details with beneficiary and worker information
    """
    visit = db.query(Visit).filter(Visit.id == visit_id).first()
    
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    
    beneficiary = db.query(Beneficiary).filter(Beneficiary.id == visit.beneficiary_id).first()
    worker = db.query(Worker).filter(Worker.id == visit.assigned_asha_id).first()
    
    return {
        "id": visit.id,
        "visit_type": visit.visit_type,
        "visit_date_time": visit.visit_date_time.isoformat(),
        "day_number": visit.day_number,
        "is_synced": visit.is_synced,
        "assigned_asha_id": visit.assigned_asha_id,
        "beneficiary_id": visit.beneficiary_id,
        "template_id": visit.template_id,
        "visit_data": visit.visit_data,
        "meta_data": visit.meta_data,
        "synced_at": visit.synced_at.isoformat() if visit.synced_at else None,
        "created_at": visit.created_at.isoformat(),
        "updated_at": visit.updated_at.isoformat(),
        "beneficiary": {
            "id": beneficiary.id,
            "first_name": beneficiary.first_name,
            "last_name": beneficiary.last_name,
            "mcts_id": beneficiary.mcts_id,
        } if beneficiary else None,
        "worker": {
            "id": worker.id,
            "first_name": worker.first_name,
            "last_name": worker.last_name,
            "worker_id": worker.worker_id,
        } if worker else None,
    }
