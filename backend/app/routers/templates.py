"""
Templates API router
Handles visit template management endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.dependencies import get_current_worker
from app.models.visit_template import VisitTemplate
from app.models.worker import Worker
from app.schemas.templates import (
    TemplateCreate,
    TemplateResponse,
    TemplateListResponse
)

router = APIRouter(
    prefix="/api/v1/templates",
    tags=["templates"]
)


@router.post("", response_model=TemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_template(
    template_data: TemplateCreate,
    db: Session = Depends(get_db),
    current_user: Worker = Depends(get_current_worker)
):
    """
    Create a new visit template
    
    Requirements: 34
    """
    # Convert questions to JSON-serializable format
    questions_json = [q.model_dump() for q in template_data.questions]
    
    # Create template
    template = VisitTemplate(
        template_type=template_data.template_type,
        name=template_data.name,
        questions=questions_json,
        meta_data=template_data.meta_data
    )
    
    db.add(template)
    db.commit()
    db.refresh(template)
    
    return template


@router.get("", response_model=TemplateListResponse)
async def list_templates(
    template_type: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    current_user: Worker = Depends(get_current_worker)
):
    """
    List all templates with optional filtering by template_type
    
    Requirements: 34
    """
    # Validate page parameters
    if page < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Page must be >= 1"
        )
    if page_size < 1 or page_size > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Page size must be between 1 and 100"
        )
    
    # Build query
    query = db.query(VisitTemplate)
    
    # Apply filter if template_type provided
    if template_type:
        allowed_types = ['hbnc', 'anc', 'pnc']
        if template_type not in allowed_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"template_type must be one of: {', '.join(allowed_types)}"
            )
        query = query.filter(VisitTemplate.template_type == template_type)
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * page_size
    templates = query.order_by(VisitTemplate.created_at.desc()).offset(offset).limit(page_size).all()
    
    # Calculate total pages
    total_pages = (total + page_size - 1) // page_size
    
    return TemplateListResponse(
        items=templates,
        total_count=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/{template_id}", response_model=TemplateResponse)
async def get_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: Worker = Depends(get_current_worker)
):
    """
    Retrieve a single template by ID
    
    Requirements: 34
    """
    template = db.query(VisitTemplate).filter(VisitTemplate.id == template_id).first()
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template with id {template_id} not found"
        )
    
    return template
