"""
Sync API endpoints for data synchronization from mobile devices
"""

import asyncio
import logging
import json
from typing import List, Dict, Any

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.database import get_db, SessionLocal
from app.dependencies import get_current_worker
from app.models.worker import Worker
from app.services.sync_service import sync_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/sync", tags=["sync"])

# How long to wait between poll attempts (seconds) and max attempts
_POLL_INTERVAL = 30
_POLL_MAX_ATTEMPTS = 10  # 10 × 30s = 5 min max wait per sync batch


async def _poll_transcriptions_for_batch(visit_ids: List[int]) -> None:
    """
    Background task: retry-poll transcription jobs for a specific set of visits.
    Runs after the sync response has been returned to the mobile client.
    Stops early once all jobs in the batch are resolved.
    """
    for attempt in range(1, _POLL_MAX_ATTEMPTS + 1):
        await asyncio.sleep(_POLL_INTERVAL)

        db = SessionLocal()
        try:
            counts = sync_service.poll_pending_transcriptions(db=db, visit_ids=visit_ids)
            logger.info(
                f"Transcription poll attempt {attempt}/{_POLL_MAX_ATTEMPTS} "
                f"for visits {visit_ids}: {counts}"
            )
            if counts["still_pending"] == 0:
                break
        except Exception as e:
            logger.error(f"Error in background transcription poll: {e}", exc_info=True)
        finally:
            db.close()


@router.post("/visits")
async def sync_visits(
    background_tasks: BackgroundTasks,
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

        # After the response is sent, poll until transcription jobs for this
        # batch complete and write results back to the DB.
        if synced_visit_ids:
            background_tasks.add_task(_poll_transcriptions_for_batch, synced_visit_ids)

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


@router.post("/transcriptions/poll")
async def poll_transcriptions(
    current_worker: Worker = Depends(get_current_worker),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Manually poll all pending AWS Transcribe jobs and write completed transcripts
    back to the database. Useful for dev/testing or recovering missed jobs.

    Returns:
        {updated, still_pending, failed} counts
    """
    if current_worker.worker_type not in ("supervisor", "admin", "asha_worker"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to poll transcriptions"
        )

    try:
        counts = sync_service.poll_pending_transcriptions(db=db)
        return {
            "success": True,
            "updated": counts["updated"],
            "still_pending": counts["still_pending"],
            "failed": counts["failed"],
            "message": (
                f"Transcription poll complete: {counts['updated']} updated, "
                f"{counts['still_pending']} still pending, {counts['failed']} failed"
            )
        }
    except Exception as e:
        logger.error(f"Error during transcription poll: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Transcription polling failed: {str(e)}"
        )
