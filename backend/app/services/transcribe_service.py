"""
AWS Transcribe Service for Voice of Care
Handles audio transcription using AWS Transcribe
"""

import boto3
import json
from botocore.exceptions import ClientError, BotoCoreError
from typing import Optional
import logging
from datetime import datetime
from app.config import settings

logger = logging.getLogger(__name__)


class TranscribeService:
    """Service for AWS Transcribe operations"""
    
    def __init__(self):
        """Initialize Transcribe client with credentials from settings"""
        try:
            # Build client config - use IAM role if credentials not provided
            client_config = {'region_name': settings.AWS_REGION}
            
            # Only add credentials if explicitly provided (otherwise use IAM role)
            if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
                client_config['aws_access_key_id'] = settings.AWS_ACCESS_KEY_ID
                client_config['aws_secret_access_key'] = settings.AWS_SECRET_ACCESS_KEY
                logger.info("Using explicit AWS credentials for Transcribe")
            else:
                logger.info("Using IAM role for Transcribe authentication")
            
            self.transcribe_client = boto3.client('transcribe', **client_config)
            self.s3_client = boto3.client('s3', **client_config)
            
            logger.info(f"Transcribe client initialized for region {settings.AWS_REGION}")
        except Exception as e:
            logger.error(f"Failed to initialize Transcribe client: {str(e)}")
            raise
    
    def start_transcription_job(
        self,
        job_name: str,
        s3_uri: str,
        language_code: str = "hi-IN"
    ) -> str:
        """
        Start an AWS Transcribe job for an audio file
        
        Args:
            job_name: Unique name for the transcription job
            s3_uri: S3 URI of the audio file (s3://bucket/key)
            language_code: Language code for transcription (hi-IN for Hindi, en-IN for English)
            
        Returns:
            Job name of the started transcription job
            
        Raises:
            ClientError: If job creation fails
            ValueError: If language_code is not supported
        """
        # Validate language code
        supported_languages = ["hi-IN", "en-IN"]
        if language_code not in supported_languages:
            raise ValueError(
                f"Unsupported language code: {language_code}. "
                f"Supported languages: {', '.join(supported_languages)}"
            )
        
        try:
            response = self.transcribe_client.start_transcription_job(
                TranscriptionJobName=job_name,
                Media={
                    'MediaFileUri': s3_uri
                },
                MediaFormat='mp4',  # m4a files use mp4 container format
                LanguageCode=language_code,
                OutputBucketName=settings.AWS_S3_BUCKET_AUDIO,
                Settings={
                    'ShowSpeakerLabels': False
                }
            )
            
            job_status = response['TranscriptionJob']['TranscriptionJobStatus']
            logger.info(
                f"Started transcription job '{job_name}' for {s3_uri} "
                f"with language {language_code}. Status: {job_status}"
            )
            
            return job_name
            
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', 'Unknown')
            
            # Handle duplicate job name gracefully
            if error_code == 'ConflictException':
                logger.warning(f"Transcription job '{job_name}' already exists")
                return job_name
            
            logger.error(
                f"Failed to start transcription job '{job_name}': "
                f"{error_code} - {str(e)}"
            )
            raise
            
        except BotoCoreError as e:
            logger.error(f"BotoCore error during transcription job start: {str(e)}")
            raise
            
        except Exception as e:
            logger.error(f"Unexpected error starting transcription job: {str(e)}")
            raise
    
    def get_transcription_result(self, job_name: str) -> Optional[str]:
        """
        Get the transcription result for a completed job
        
        Args:
            job_name: Name of the transcription job
            
        Returns:
            Transcribed text if job is completed, None if job is still in progress or failed
            
        Raises:
            ClientError: If retrieving job status fails
        """
        try:
            response = self.transcribe_client.get_transcription_job(
                TranscriptionJobName=job_name
            )
            
            job = response['TranscriptionJob']
            status = job['TranscriptionJobStatus']
            
            if status == 'COMPLETED':
                # Download transcript JSON from S3.
                # AWS Transcribe stores the output as {job_name}.json in OutputBucketName.
                transcript_s3_key = f"{job_name}.json"
                s3_response = self.s3_client.get_object(
                    Bucket=settings.AWS_S3_BUCKET_AUDIO,
                    Key=transcript_s3_key
                )
                transcript_data = json.loads(s3_response['Body'].read().decode('utf-8'))
                transcript_text = transcript_data['results']['transcripts'][0]['transcript']

                logger.info(f"Retrieved transcript for job '{job_name}'")
                return transcript_text
                
            elif status == 'FAILED':
                failure_reason = job.get('FailureReason', 'Unknown reason')
                logger.error(
                    f"Transcription job '{job_name}' failed: {failure_reason}"
                )
                return None
                
            else:
                # Job is still in progress (IN_PROGRESS or QUEUED)
                logger.info(f"Transcription job '{job_name}' status: {status}")
                return None
                
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', 'Unknown')
            
            # Handle job not found gracefully
            if error_code == 'BadRequestException':
                logger.warning(f"Transcription job '{job_name}' not found")
                return None
            
            logger.error(
                f"Failed to get transcription job '{job_name}': "
                f"{error_code} - {str(e)}"
            )
            raise
            
        except BotoCoreError as e:
            logger.error(f"BotoCore error retrieving transcription result: {str(e)}")
            raise
            
        except Exception as e:
            logger.error(f"Unexpected error retrieving transcription result: {str(e)}")
            raise
    
    def delete_transcription_job(self, job_name: str) -> bool:
        """
        Delete a transcription job (cleanup)
        
        Args:
            job_name: Name of the transcription job to delete
            
        Returns:
            True if deletion was successful, False otherwise
        """
        try:
            self.transcribe_client.delete_transcription_job(
                TranscriptionJobName=job_name
            )
            
            logger.info(f"Deleted transcription job '{job_name}'")
            return True
            
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', 'Unknown')
            logger.error(
                f"Failed to delete transcription job '{job_name}': "
                f"{error_code} - {str(e)}"
            )
            return False
            
        except Exception as e:
            logger.error(f"Unexpected error deleting transcription job: {str(e)}")
            return False
    
    @staticmethod
    def generate_job_name(visit_id: int, question_id: str) -> str:
        """
        Generate a unique job name for a transcription job
        
        Args:
            visit_id: ID of the visit
            question_id: ID of the question
            
        Returns:
            Unique job name in format: transcribe_visit_{visit_id}_q_{question_id}_{timestamp}
        """
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S_%f")
        job_name = f"transcribe_visit_{visit_id}_q_{question_id}_{timestamp}"
        
        # AWS Transcribe job names must be alphanumeric, hyphens, and underscores only
        # and max 200 characters
        job_name = job_name.replace("-", "_")[:200]
        
        return job_name


# Global Transcribe service instance
transcribe_service = TranscribeService()
