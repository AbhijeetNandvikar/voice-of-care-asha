"""
Sync Service for Voice of Care
Handles visit synchronization from mobile devices to backend
"""

import copy
import logging
from typing import List, Dict, Optional, Tuple
from datetime import datetime, UTC
from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.models.visit import Visit
from app.models.sync_log import SyncLog
from app.services.s3 import s3_service
from app.services.transcribe_service import transcribe_service
from app.config import settings

logger = logging.getLogger(__name__)


class SyncService:
    """Service for processing visit synchronization from mobile devices"""
    
    def __init__(self):
        """Initialize sync service"""
        self.s3_service = s3_service
        self.transcribe_service = transcribe_service
    
    async def process_visit_sync(
        self,
        visits_data: List[Dict],
        audio_files: Dict[str, UploadFile],
        worker_id: int,
        db: Session
    ) -> Tuple[List[int], List[Dict]]:
        """
        Process visit synchronization from mobile device
        
        Args:
            visits_data: List of visit dictionaries from mobile device
            audio_files: Dictionary mapping audio keys to UploadFile objects
            worker_id: ID of the worker performing the sync
            db: Database session
            
        Returns:
            Tuple of (synced_visit_ids, failed_visits)
            - synced_visit_ids: List of successfully synced visit IDs
            - failed_visits: List of dicts with local_id and error_message
        """
        synced_visit_ids = []
        failed_visits = []
        
        logger.info(
            f"Starting sync for worker {worker_id}: "
            f"{len(visits_data)} visits, {len(audio_files)} audio files"
        )
        
        for visit_data in visits_data:
            local_id = visit_data.get('local_id')
            
            try:
                # Process single visit
                visit_id = await self._process_single_visit(
                    visit_data=visit_data,
                    audio_files=audio_files,
                    worker_id=worker_id,
                    db=db
                )
                
                synced_visit_ids.append(visit_id)
                
                logger.info(f"Successfully synced visit (local_id: {local_id}, server_id: {visit_id})")
                
            except Exception as e:
                error_message = str(e)
                logger.error(f"Failed to sync visit (local_id: {local_id}): {error_message}")
                
                failed_visits.append({
                    'local_id': local_id,
                    'error_message': error_message
                })
        
        # Create a single sync log for the entire sync operation
        if len(synced_visit_ids) > 0:
            # Create successful sync log with visit count
            self._create_sync_log(
                visit_id=synced_visit_ids[0] if len(synced_visit_ids) == 1 else None,
                worker_id=worker_id,
                status='completed',
                db=db,
                visit_count=len(synced_visit_ids)
            )
        
        if len(failed_visits) > 0:
            # Create failed sync log with error details
            error_messages = [f"Visit {v['local_id']}: {v['error_message']}" for v in failed_visits]
            self._create_sync_log(
                visit_id=None,
                worker_id=worker_id,
                status='failed',
                error_message="; ".join(error_messages),
                db=db,
                visit_count=len(failed_visits)
            )
        
        # Commit all changes
        db.commit()
        
        logger.info(
            f"Sync completed for worker {worker_id}: "
            f"{len(synced_visit_ids)} succeeded, {len(failed_visits)} failed"
        )
        
        return synced_visit_ids, failed_visits

    
    async def _process_single_visit(
        self,
        visit_data: Dict,
        audio_files: Dict[str, UploadFile],
        worker_id: int,
        db: Session
    ) -> int:
        """
        Process a single visit synchronization
        
        Args:
            visit_data: Visit data dictionary from mobile device
            audio_files: Dictionary mapping audio keys to UploadFile objects
            worker_id: ID of the worker performing the sync
            db: Database session
            
        Returns:
            ID of the created visit record
            
        Raises:
            ValueError: If validation fails
            Exception: If processing fails
        """
        # Validate required fields
        self._validate_visit_data(visit_data)
        
        # Process audio files and update visit_data with S3 keys
        visit_data_copy = visit_data.copy()
        await self._process_audio_files(
            visit_data=visit_data_copy,
            audio_files=audio_files,
            worker_id=worker_id
        )
        
        # Create visit record in database
        visit = Visit(
            visit_type=visit_data_copy['visit_type'],
            visit_date_time=datetime.fromisoformat(visit_data_copy['visit_date_time'].replace('Z', '+00:00')),
            day_number=visit_data_copy.get('day_number'),
            is_synced=True,
            assigned_asha_id=visit_data_copy['assigned_asha_id'],
            beneficiary_id=visit_data_copy['beneficiary_id'],
            template_id=visit_data_copy['template_id'],
            visit_data=visit_data_copy['visit_data'],
            meta_data=visit_data_copy.get('meta_data', {}),
            synced_at=datetime.now(UTC)
        )
        
        db.add(visit)
        db.flush()  # Get the visit ID without committing
        
        return visit.id
    
    def _validate_visit_data(self, visit_data: Dict) -> None:
        """
        Validate visit data structure
        
        Args:
            visit_data: Visit data dictionary to validate
            
        Raises:
            ValueError: If validation fails
        """
        required_fields = [
            'visit_type',
            'visit_date_time',
            'assigned_asha_id',
            'beneficiary_id',
            'template_id',
            'visit_data'
        ]
        
        for field in required_fields:
            if field not in visit_data:
                raise ValueError(f"Missing required field: {field}")
        
        # Validate visit_type
        valid_visit_types = ['hbnc', 'anc', 'pnc']
        if visit_data['visit_type'] not in valid_visit_types:
            raise ValueError(
                f"Invalid visit_type: {visit_data['visit_type']}. "
                f"Must be one of: {', '.join(valid_visit_types)}"
            )
        
        # Validate visit_data structure
        if not isinstance(visit_data['visit_data'], dict):
            raise ValueError("visit_data must be a dictionary")
        
        if 'answers' not in visit_data['visit_data']:
            raise ValueError("visit_data must contain 'answers' array")
        
        if not isinstance(visit_data['visit_data']['answers'], list):
            raise ValueError("visit_data.answers must be an array")
        
        if len(visit_data['visit_data']['answers']) == 0:
            raise ValueError("visit_data.answers cannot be empty")
    
    async def _process_audio_files(
        self,
        visit_data: Dict,
        audio_files: Dict[str, UploadFile],
        worker_id: int
    ) -> None:
        """
        Process audio files: upload to S3 and start transcription jobs
        
        Args:
            visit_data: Visit data dictionary (will be modified in place)
            audio_files: Dictionary mapping audio keys to UploadFile objects
            worker_id: ID of the worker performing the sync
            
        Raises:
            Exception: If audio processing fails
        """
        answers = visit_data['visit_data']['answers']
        
        for answer in answers:
            # Check if this answer has an audio file
            audio_path = answer.get('audio_path')
            if not audio_path:
                continue
            
            question_id = answer.get('question_id')
            if not question_id:
                logger.warning(f"Answer missing question_id, skipping audio processing")
                continue
            
            # Find the corresponding audio file in the uploaded files
            # The mobile app should send files with keys like: audio_{local_visit_id}_{question_id}
            # or we can use a simpler key pattern
            audio_key = self._find_audio_file_key(audio_files, question_id)
            
            if not audio_key:
                logger.warning(
                    f"Audio file not found for question {question_id}, "
                    f"expected in uploaded files"
                )
                continue
            
            audio_file = audio_files[audio_key]
            
            try:
                # Generate S3 key pattern: audio/{worker_id}/{visit_id}/{question_id}.m4a
                # Note: We don't have visit_id yet, so we'll use a temporary pattern
                # and update it after the visit is created
                local_visit_id = visit_data.get('local_id', 'unknown')
                s3_key = f"audio/worker_{worker_id}/visit_{local_visit_id}/{question_id}.m4a"
                
                # Read file content
                file_content = await audio_file.read()
                
                # Upload to S3
                s3_uri = self.s3_service.upload_file(
                    file_content=file_content,
                    bucket=settings.AWS_S3_BUCKET_AUDIO,
                    key=s3_key,
                    content_type='audio/mp4'
                )
                
                # Update answer with S3 key
                answer['audio_s3_key'] = s3_key
                
                # Remove local audio_path since it's now in S3
                if 'audio_path' in answer:
                    del answer['audio_path']
                
                # Start transcription job (async, don't wait for completion)
                try:
                    job_name = self.transcribe_service.generate_job_name(
                        visit_id=local_visit_id,
                        question_id=question_id
                    )
                    
                    # Determine language code (default to Hindi)
                    language_code = "hi-IN"  # TODO: Get from worker preferences
                    
                    self.transcribe_service.start_transcription_job(
                        job_name=job_name,
                        s3_uri=s3_uri,
                        language_code=language_code
                    )

                    # Store job name so we can poll for results later
                    answer['transcription_job_name'] = job_name
                    answer['transcription_language'] = language_code

                    logger.info(f"Started transcription job {job_name} for {s3_key}")
                    
                except Exception as transcribe_error:
                    # Log error but don't fail the sync
                    logger.error(
                        f"Failed to start transcription for {s3_key}: {transcribe_error}"
                    )
                
                # Reset file pointer for potential reuse
                await audio_file.seek(0)
                
            except Exception as e:
                logger.error(f"Failed to process audio file for question {question_id}: {e}")
                # Don't fail the entire sync for audio processing errors
                # Just log and continue
    
    def poll_pending_transcriptions(
        self, db: Session, visit_ids: Optional[List[int]] = None
    ) -> Dict[str, int]:
        """
        Poll pending transcription jobs and write results back to the database.

        For each completed job the transcript is stored in the answer as
        'transcript_hi' (or 'transcript_en' for English) and
        'transcription_job_name' is removed so the answer won't be polled again.

        Args:
            db: Database session
            visit_ids: If provided, only poll these specific visit IDs.
                       If None, scans all synced visits (fallback / manual use).

        Returns:
            Dict with counts: {updated, still_pending, failed}
        """
        counts = {"updated": 0, "still_pending": 0, "failed": 0}

        query = db.query(Visit).filter(Visit.is_synced == True)
        if visit_ids:
            query = query.filter(Visit.id.in_(visit_ids))
        visits = query.all()

        for visit in visits:
            if not visit.visit_data or 'answers' not in visit.visit_data:
                continue

            answers = visit.visit_data['answers']
            visit_dirty = False

            for answer in answers:
                job_name = answer.get('transcription_job_name')
                if not job_name:
                    continue

                try:
                    transcript_text = self.transcribe_service.get_transcription_result(job_name)

                    if transcript_text is None:
                        # Job still running or failed — leave job_name in place
                        counts["still_pending"] += 1
                        continue

                    # Store transcript keyed by language
                    language = answer.get('transcription_language', 'hi-IN')
                    if language.startswith('en'):
                        answer['transcript_en'] = transcript_text
                    else:
                        answer['transcript_hi'] = transcript_text

                    # Remove tracking fields — job is done
                    answer.pop('transcription_job_name', None)
                    answer.pop('transcription_language', None)

                    visit_dirty = True
                    counts["updated"] += 1
                    logger.info(
                        f"Stored transcript for visit {visit.id}, "
                        f"question {answer.get('question_id')} (job: {job_name})"
                    )

                except RuntimeError as e:
                    # Job permanently failed — remove job name so we stop polling it
                    logger.error(
                        f"Transcription job permanently failed for visit {visit.id}, "
                        f"question {answer.get('question_id')}: {e}"
                    )
                    answer['transcription_failed'] = str(e)
                    answer.pop('transcription_job_name', None)
                    answer.pop('transcription_language', None)
                    visit_dirty = True
                    counts["failed"] += 1

                except Exception as e:
                    logger.error(
                        f"Error polling transcription job '{job_name}' "
                        f"for visit {visit.id}: {e}"
                    )
                    counts["failed"] += 1

            if visit_dirty:
                # SQLAlchemy won't detect in-place JSON mutations automatically
                visit.visit_data = copy.deepcopy(visit.visit_data)

        db.commit()
        logger.info(f"Transcription poll complete: {counts}")
        return counts

    def _find_audio_file_key(
        self,
        audio_files: Dict[str, UploadFile],
        question_id: str
    ) -> Optional[str]:
        """
        Find the audio file key for a given question ID
        
        Args:
            audio_files: Dictionary mapping audio keys to UploadFile objects
            question_id: Question ID to search for
            
        Returns:
            Audio file key if found, None otherwise
        """
        # Try exact match first
        if question_id in audio_files:
            return question_id
        
        # Try with common prefixes
        for key in audio_files.keys():
            if question_id in key:
                return key
        
        return None
    
    def _create_sync_log(
        self,
        worker_id: int,
        status: str,
        db: Session,
        visit_id: Optional[int] = None,
        error_message: Optional[str] = None,
        visit_count: int = 1
    ) -> None:
        """
        Create a sync log entry
        
        Args:
            worker_id: ID of the worker performing the sync
            status: Sync status (completed, incomplete, failed)
            db: Database session
            visit_id: Optional visit ID if sync was successful
            error_message: Optional error message if sync failed
            visit_count: Number of visits in this sync operation (default 1)
        """
        sync_log = SyncLog(
            visit_id=visit_id,
            worker_id=worker_id,
            collection_center_id=None,  # TODO: Get from worker record
            date_time=datetime.now(UTC),
            status=status,
            error_message=error_message,
            meta_data={'visit_count': visit_count}
        )
        
        db.add(sync_log)


# Global sync service instance
sync_service = SyncService()
