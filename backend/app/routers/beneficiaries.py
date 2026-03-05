"""
Beneficiaries CRUD API endpoints for managing healthcare beneficiaries
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from app.database import get_db
from app.dependencies import get_current_worker
from app.models.beneficiary import Beneficiary
from app.models.worker import Worker
from app.schemas.beneficiaries import (
    BeneficiaryCreate,
    BeneficiaryUpdate,
    BeneficiaryResponse,
    BeneficiaryListResponse
)


router = APIRouter(prefix="/api/v1/beneficiaries", tags=["Beneficiaries"])


@router.post("", response_model=BeneficiaryResponse, status_code=status.HTTP_201_CREATED)
async def create_beneficiary(
    beneficiary_data: BeneficiaryCreate,
    db: Session = Depends(get_db),
    current_worker: Worker = Depends(get_current_worker)
):
    """
    Create a new beneficiary with MCTS ID uniqueness validation
    
    Requires authentication. MCTS ID must be unique across all beneficiaries.
    If assigned_asha_id is provided, validates that the worker exists and is an ASHA worker.
    """
    # Check if MCTS ID already exists
    existing = db.query(Beneficiary).filter(Beneficiary.mcts_id == beneficiary_data.mcts_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Beneficiary with MCTS ID {beneficiary_data.mcts_id} already exists"
        )
    
    # Validate assigned ASHA worker if provided
    if beneficiary_data.assigned_asha_id:
        asha_worker = db.query(Worker).filter(
            Worker.id == beneficiary_data.assigned_asha_id,
            Worker.worker_type == "asha_worker"
        ).first()
        
        if not asha_worker:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Worker with id {beneficiary_data.assigned_asha_id} not found or is not an ASHA worker"
            )
    
    # Create beneficiary instance
    new_beneficiary = Beneficiary(
        first_name=beneficiary_data.first_name,
        last_name=beneficiary_data.last_name,
        phone_number=beneficiary_data.phone_number,
        aadhar_id=beneficiary_data.aadhar_id,
        email=beneficiary_data.email,
        address=beneficiary_data.address,
        age=beneficiary_data.age,
        weight=beneficiary_data.weight,
        mcts_id=beneficiary_data.mcts_id,
        beneficiary_type=beneficiary_data.beneficiary_type,
        assigned_asha_id=beneficiary_data.assigned_asha_id,
        meta_data=beneficiary_data.meta_data or {}
    )
    
    try:
        db.add(new_beneficiary)
        db.commit()
        db.refresh(new_beneficiary)
        return new_beneficiary
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database integrity error: {str(e)}"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create beneficiary: {str(e)}"
        )


@router.get("", response_model=BeneficiaryListResponse)
async def list_beneficiaries(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search by MCTS ID or name"),
    beneficiary_type: Optional[str] = Query(None, description="Filter by beneficiary type"),
    db: Session = Depends(get_db),
    current_worker: Worker = Depends(get_current_worker)
):
    """
    Get paginated list of beneficiaries with optional search and filtering
    
    Supports:
    - Search by MCTS ID, first_name, or last_name
    - Filter by beneficiary_type (individual, child, mother_child)
    - Default pagination: 20 items per page
    """
    # Build base query
    query = db.query(Beneficiary)
    
    # Apply beneficiary_type filter if provided
    if beneficiary_type:
        if beneficiary_type not in ["individual", "child", "mother_child"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid beneficiary_type. Must be one of: individual, child, mother_child"
            )
        query = query.filter(Beneficiary.beneficiary_type == beneficiary_type)
    
    # Apply search filter if provided
    if search:
        search_filter = or_(
            Beneficiary.first_name.ilike(f"%{search}%"),
            Beneficiary.last_name.ilike(f"%{search}%"),
            Beneficiary.mcts_id.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    # Get total count
    total_count = query.count()
    
    # Apply pagination
    offset = (page - 1) * page_size
    beneficiaries = query.offset(offset).limit(page_size).all()
    
    # Calculate pagination metadata
    total_pages = (total_count + page_size - 1) // page_size
    
    return BeneficiaryListResponse(
        items=beneficiaries,
        total_count=total_count,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/{beneficiary_id}", response_model=BeneficiaryResponse)
async def get_beneficiary(
    beneficiary_id: int,
    db: Session = Depends(get_db),
    current_worker: Worker = Depends(get_current_worker)
):
    """
    Get a single beneficiary by ID
    
    Returns complete beneficiary information including metadata.
    """
    beneficiary = db.query(Beneficiary).filter(Beneficiary.id == beneficiary_id).first()
    
    if not beneficiary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Beneficiary with id {beneficiary_id} not found"
        )
    
    return beneficiary


@router.put("/{beneficiary_id}", response_model=BeneficiaryResponse)
async def update_beneficiary(
    beneficiary_id: int,
    beneficiary_data: BeneficiaryUpdate,
    db: Session = Depends(get_db),
    current_worker: Worker = Depends(get_current_worker)
):
    """
    Update an existing beneficiary
    
    Only provided fields will be updated. MCTS ID uniqueness is validated if changed.
    If assigned_asha_id is updated, validates that the worker exists and is an ASHA worker.
    """
    beneficiary = db.query(Beneficiary).filter(Beneficiary.id == beneficiary_id).first()
    
    if not beneficiary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Beneficiary with id {beneficiary_id} not found"
        )
    
    # Get update data
    update_data = beneficiary_data.model_dump(exclude_unset=True)
    
    # Check MCTS ID uniqueness if being updated
    if "mcts_id" in update_data and update_data["mcts_id"] != beneficiary.mcts_id:
        existing = db.query(Beneficiary).filter(
            Beneficiary.mcts_id == update_data["mcts_id"]
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Beneficiary with MCTS ID {update_data['mcts_id']} already exists"
            )
    
    # Validate assigned ASHA worker if being updated
    if "assigned_asha_id" in update_data and update_data["assigned_asha_id"]:
        asha_worker = db.query(Worker).filter(
            Worker.id == update_data["assigned_asha_id"],
            Worker.worker_type == "asha_worker"
        ).first()
        
        if not asha_worker:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Worker with id {update_data['assigned_asha_id']} not found or is not an ASHA worker"
            )
    
    # Update beneficiary attributes
    for field, value in update_data.items():
        setattr(beneficiary, field, value)
    
    try:
        db.commit()
        db.refresh(beneficiary)
        return beneficiary
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database integrity error: {str(e)}"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update beneficiary: {str(e)}"
        )
