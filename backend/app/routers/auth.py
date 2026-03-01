"""
Authentication endpoints for worker login, MPIN setup, and MPIN verification
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.auth_service import AuthService
from app.dependencies import get_current_worker
from app.schemas.auth import (
    LoginRequest,
    MPINSetupRequest,
    MPINVerifyRequest,
    TokenResponse,
    WorkerProfile
)
from app.models.worker import Worker


router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
async def login(
    request: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Authenticate worker using worker_id and password
    
    Returns JWT token and worker profile on success
    """
    worker = AuthService.authenticate_worker(db, request.worker_id, request.password)
    
    if not worker:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid worker_id or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create JWT token with worker ID as subject
    access_token = AuthService.create_access_token(data={"sub": str(worker.id)})
    
    # Build worker profile
    worker_profile = WorkerProfile.model_validate(worker)
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        worker=worker_profile
    )


@router.post("/mpin/setup")
async def setup_mpin(
    request: MPINSetupRequest,
    current_worker: Worker = Depends(get_current_worker),
    db: Session = Depends(get_db)
):
    """
    Set up 4-digit MPIN for authenticated worker
    
    Requires valid JWT token in Authorization header
    """
    success = AuthService.setup_mpin(db, current_worker.id, request.mpin)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to set up MPIN"
        )
    
    return {
        "message": "MPIN setup successful",
        "worker_id": current_worker.worker_id
    }


@router.post("/mpin/verify", response_model=TokenResponse)
async def verify_mpin(
    request: MPINVerifyRequest,
    db: Session = Depends(get_db)
):
    """
    Authenticate worker using worker_id and MPIN
    
    Returns JWT token and worker profile on success
    """
    worker = AuthService.verify_mpin_auth(db, request.worker_id, request.mpin)
    
    if not worker:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid worker_id or MPIN",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create JWT token with worker ID as subject
    access_token = AuthService.create_access_token(data={"sub": str(worker.id)})
    
    # Build worker profile
    worker_profile = WorkerProfile.model_validate(worker)
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        worker=worker_profile
    )
