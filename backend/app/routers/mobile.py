"""
Mobile API endpoints for ASHA worker mobile application
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database import get_db
from app.dependencies import get_current_worker
from app.models.worker import Worker
from app.models.beneficiary import Beneficiary
from app.models.visit_template import VisitTemplate


router = APIRouter(prefix="/api/v1/mobile", tags=["mobile"])


@router.get("/init")
async def mobile_init(
    current_worker: Worker = Depends(get_current_worker),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Mobile initialization endpoint
    
    Returns worker profile, assigned beneficiaries, and visit templates
    for offline storage on mobile device after first login.
    
    Requirements: 3
    
    Args:
        current_worker: Authenticated worker from JWT token
        db: Database session
        
    Returns:
        JSON with structure: {worker: {...}, beneficiaries: [...], templates: [...]}
        
    Raises:
        HTTPException: If worker is not an ASHA worker
    """
    # Verify worker is an ASHA worker
    if current_worker.worker_type != "asha_worker":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only ASHA workers can initialize mobile app"
        )
    
    # Query beneficiaries assigned to this ASHA worker
    beneficiaries = db.query(Beneficiary).filter(
        Beneficiary.assigned_asha_id == current_worker.id
    ).all()
    
    # Query all HBNC templates (v1 only supports HBNC)
    templates = db.query(VisitTemplate).filter(
        VisitTemplate.template_type == "hbnc"
    ).all()
    
    # Format worker profile
    worker_data = {
        "id": current_worker.id,
        "first_name": current_worker.first_name,
        "last_name": current_worker.last_name,
        "phone_number": current_worker.phone_number,
        "email": current_worker.email,
        "address": current_worker.address,
        "worker_type": current_worker.worker_type,
        "worker_id": current_worker.worker_id,
        "collection_center_id": current_worker.collection_center_id,
        "profile_photo_url": current_worker.profile_photo_url,
        "meta_data": current_worker.meta_data
    }
    
    # Format beneficiaries
    beneficiaries_data = [
        {
            "id": b.id,
            "first_name": b.first_name,
            "last_name": b.last_name,
            "phone_number": b.phone_number,
            "aadhar_id": b.aadhar_id,
            "email": b.email,
            "address": b.address,
            "age": b.age,
            "weight": float(b.weight) if b.weight else None,
            "mcts_id": b.mcts_id,
            "beneficiary_type": b.beneficiary_type,
            "assigned_asha_id": b.assigned_asha_id,
            "meta_data": b.meta_data
        }
        for b in beneficiaries
    ]
    
    # Format templates
    templates_data = [
        {
            "id": t.id,
            "template_type": t.template_type,
            "name": t.name,
            "questions": t.questions,
            "meta_data": t.meta_data
        }
        for t in templates
    ]
    
    return {
        "worker": worker_data,
        "beneficiaries": beneficiaries_data,
        "templates": templates_data
    }
