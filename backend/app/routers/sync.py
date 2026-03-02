"""
Sync API endpoints for data synchronization from mobile devices
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import json
import logging

from app.database import get_db
from app.dependencies import get_current_worker
from app.models.worker import Worker
from app.services.sync_service import sync_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/sync", tags=["sync"])


@router.post("/visits")
async def sync_visits(
    visits_json: str = Form(...),
    current_worker: Worker = Depends(get_current_worker),
    db: Session = Depends(get_db),
    files: List[UploadFile] = File(default=[])
) -> Dict[str, Any]:
    """
    Sync visits from mobile device to backend
    
    Accepts multipart form data with:
    - visits_json: JSON string containing array of visit objects
    - files: Audio files for voice answers
    
    Requirements: 13
    
    Args:
        visits_json: JSON string with visit data array
        current_worker: Authenticated worker from JWT token
        db: Database session
        files: List of uploaded audio files
        
    Returns:
        JSON with structure: {
            success: bool,
            synced_visit_ids: List[int],
            failed_visits: List[Dict],
            message: str
        }
        
    Raises:
        HTTPException: If validation fails or processing errors occur
    """
    try:
        # Parse visits JSON
        try:
            visits_data = json.loads(visits_json)
        except json.JSONDecodeError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid JSON in visits_json: {str(e)}"
            )
        
        if not isinstance(visits_data, list):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="visits_json must be an array"
            )
        
        if len(visits_data) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="visits_json cannot be empty"
            )
        
        # Verify worker is an ASHA worker
        if current_worker.worker_type != "asha_worker":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only ASHA workers can sync visits"
            )
        
        # Build audio files dictionary
        # Files should be named with a key that can be matched to question IDs
        audio_files = {}
        for file in files:
            # Use filename as key (mobile app should name files appropriately)
            # e.g., "audio_123_hbnc_q1.m4a" or just "hbnc_q1"
            filename = file.filename
            if filename:
                # Extract a simple key from filename
                # Remove extension and common prefixes
                key = filename.replace('.m4a', '').replace('.mp4', '').replace('audio_', '')
                audio_files[key] = file
        
        logger.info(
            f"Sync request from worker {current_worker.id}: "
            f"{len(visits_data)} visits, {len(audio_files)} audio files"
        )
        
        # Process sync
        synced_visit_ids, failed_visits = await sync_service.process_visit_sync(
            visits_data=visits_data,
            audio_files=audio_files,
            worker_id=current_worker.id,
            db=db
        )
        
        # Build response
        success = len(failed_visits) == 0
        message = f"Successfully synced {len(synced_visit_ids)} visits"
        
        if len(failed_visits) > 0:
            message += f", {len(failed_visits)} visits failed"
        
        return {
            "success": success,
            "synced_visit_ids": synced_visit_ids,
            "failed_visits": failed_visits,
            "message": message
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Unexpected error during sync: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Sync processing failed: {str(e)}"
        )
