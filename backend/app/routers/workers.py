"""
Workers CRUD API endpoints for managing healthcare workers
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from app.database import get_db
from app.dependencies import get_current_worker
from app.models.worker import Worker
from app.schemas.workers import (
    WorkerCreate,
    WorkerUpdate,
    WorkerResponse,
    WorkerListResponse
)
from app.services.auth_service import AuthService
import random


router = APIRouter(prefix="/api/v1/workers", tags=["Workers"])


def generate_worker_id(db: Session) -> str:
    """
    Generate a unique 8-digit worker ID
    
    Args:
        db: Database session
        
    Returns:
        8-digit worker ID as string
    """
    while True:
        # Generate random 8-digit number
        worker_id = str(random.randint(10000000, 99999999))
        
        # Check if it already exists
        existing = db.query(Worker).filter(Worker.worker_id == worker_id).first()
        if not existing:
            return worker_id


@router.post("", response_model=WorkerResponse, status_code=status.HTTP_201_CREATED)
async def create_worker(
    worker_data: WorkerCreate,
    db: Session = Depends(get_db),
    current_worker: Worker = Depends(get_current_worker)
):
    """
    Create a new worker with auto-generated 8-digit worker_id
    
    Requires authentication. Password is hashed with bcrypt before storing.
    """
    # Generate unique worker_id
    worker_id = generate_worker_id(db)
    
    # Hash password
    password_hash = AuthService.hash_password(worker_data.password)
    
    # Create worker instance
    new_worker = Worker(
        first_name=worker_data.first_name,
        last_name=worker_data.last_name,
        phone_number=worker_data.phone_number,
        aadhar_id=worker_data.aadhar_id,
        email=worker_data.email,
        address=worker_data.address,
        worker_type=worker_data.worker_type,
        worker_id=worker_id,
        password_hash=password_hash,
        collection_center_id=worker_data.collection_center_id,
        profile_photo_url=worker_data.profile_photo_url,
        meta_data=worker_data.meta_data or {}
    )
    
    try:
        db.add(new_worker)
        db.commit()
        db.refresh(new_worker)
        return new_worker
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create worker: {str(e)}"
        )


@router.get("", response_model=WorkerListResponse)
async def list_workers(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search by name or worker_id"),
    db: Session = Depends(get_db),
    current_worker: Worker = Depends(get_current_worker)
):
    """
    Get paginated list of workers with optional search
    
    Supports search by name (first_name or last_name) or worker_id.
    Default pagination: 20 items per page.
    """
    # Build base query
    query = db.query(Worker)
    
    # Apply search filter if provided
    if search:
        search_filter = or_(
            Worker.first_name.ilike(f"%{search}%"),
            Worker.last_name.ilike(f"%{search}%"),
            Worker.worker_id.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    # Get total count
    total_count = query.count()
    
    # Apply pagination
    offset = (page - 1) * page_size
    workers = query.offset(offset).limit(page_size).all()
    
    # Calculate pagination metadata
    total_pages = (total_count + page_size - 1) // page_size
    
    return WorkerListResponse(
        workers=workers,
        total_count=total_count,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/{worker_id}", response_model=WorkerResponse)
async def get_worker(
    worker_id: int,
    db: Session = Depends(get_db),
    current_worker: Worker = Depends(get_current_worker)
):
    """
    Get a single worker by ID
    
    Returns complete worker information including metadata.
    """
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    
    if not worker:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Worker with id {worker_id} not found"
        )
    
    return worker


@router.put("/{worker_id}", response_model=WorkerResponse)
async def update_worker(
    worker_id: int,
    worker_data: WorkerUpdate,
    db: Session = Depends(get_db),
    current_worker: Worker = Depends(get_current_worker)
):
    """
    Update an existing worker
    
    Only provided fields will be updated. Password is hashed if provided.
    """
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    
    if not worker:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Worker with id {worker_id} not found"
        )
    
    # Update fields if provided
    update_data = worker_data.model_dump(exclude_unset=True)
    
    # Hash password if provided
    if "password" in update_data and update_data["password"]:
        update_data["password_hash"] = AuthService.hash_password(update_data.pop("password"))
    
    # Update worker attributes
    for field, value in update_data.items():
        setattr(worker, field, value)
    
    try:
        db.commit()
        db.refresh(worker)
        return worker
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update worker: {str(e)}"
        )
