"""
Dashboard router for statistics and analytics endpoints
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta, UTC
from typing import List
from app.database import get_db
from app.dependencies import get_current_worker
from app.models.worker import Worker
from app.models.beneficiary import Beneficiary
from app.models.visit import Visit
from app.models.sync_log import SyncLog
from pydantic import BaseModel


router = APIRouter(
    prefix="/api/v1/dashboard",
    tags=["dashboard"]
)


class DashboardStats(BaseModel):
    """Dashboard statistics response model"""
    total_workers: int
    total_beneficiaries: int
    total_visits: int
    pending_syncs: int


class VisitByDate(BaseModel):
    """Visit count by date response model"""
    date: str
    count: int


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_worker: Worker = Depends(get_current_worker)
):
    """
    Get dashboard statistics including total workers, beneficiaries, visits, and pending syncs
    
    Requirements: 24
    """
    # Count total workers
    total_workers = db.query(func.count(Worker.id)).scalar()
    
    # Count total beneficiaries
    total_beneficiaries = db.query(func.count(Beneficiary.id)).scalar()
    
    # Count total visits
    total_visits = db.query(func.count(Visit.id)).scalar()
    
    # Count pending syncs (visits with is_synced = false)
    pending_syncs = db.query(func.count(Visit.id)).filter(Visit.is_synced == False).scalar()
    
    return DashboardStats(
        total_workers=total_workers,
        total_beneficiaries=total_beneficiaries,
        total_visits=total_visits,
        pending_syncs=pending_syncs
    )


@router.get("/visits-by-date", response_model=List[VisitByDate])
async def get_visits_by_date(
    db: Session = Depends(get_db),
    current_worker: Worker = Depends(get_current_worker)
):
    """
    Get visit counts by date for the last 30 days
    
    Requirements: 24
    """
    # Calculate date 30 days ago
    thirty_days_ago = datetime.now(UTC) - timedelta(days=30)
    
    # Query visits grouped by date
    results = db.query(
        func.date(Visit.visit_date_time).label('date'),
        func.count(Visit.id).label('count')
    ).filter(
        Visit.visit_date_time >= thirty_days_ago
    ).group_by(
        func.date(Visit.visit_date_time)
    ).order_by(
        func.date(Visit.visit_date_time)
    ).all()
    
    # Convert to response model
    visits_by_date = [
        VisitByDate(
            date=result.date.isoformat(),
            count=result.count
        )
        for result in results
    ]
    
    return visits_by_date
