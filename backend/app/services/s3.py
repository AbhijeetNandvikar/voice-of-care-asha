"""
AWS S3 Service for Voice of Care
Handles file uploads, presigned URL generation, and file deletion
"""

import boto3
from botocore.exceptions import ClientError, BotoCoreError
from typing import Optional
import logging
from app.config import settings

logger = logging.getLogger(__name__)


class S3Service:
    """Service for AWS S3 operations"""
    
    def __init__(self):
        """Initialize S3 client with credentials from settings"""
        try:
            self.s3_client = boto3.client(
                's3',
                region_name=settings.AWS_REGION
            )
            self.audio_bucket = settings.AWS_S3_BUCKET_AUDIO
            self.reports_bucket = settings.AWS_S3_BUCKET_REPORTS
            logger.info(f"S3 client initialized for region {settings.AWS_REGION}")
        except Exception as e:
            logger.error(f"Failed to initialize S3 client: {str(e)}")
            raise
    
    def upload_file(
        self, 
        file_content: bytes, 
        bucket: str, 
        key: str,
        content_type: Optional[str] = None
    ) -> str:
        """
        Upload a file to S3 bucket
        
        Args:
            file_content: File content as bytes
            bucket: S3 bucket name
            key: S3 object key (path)
            content_type: Optional MIME type for the file
            
        Returns:
            S3 URI of the uploaded file (s3://bucket/key)
            
        Raises:
            ClientError: If upload fails
        """
        try:
            extra_args = {}
            if content_type:
                extra_args['ContentType'] = content_type
            
            self.s3_client.put_object(
                Bucket=bucket,
                Key=key,
                Body=file_content,
                **extra_args
            )
            
            s3_uri = f"s3://{bucket}/{key}"
            logger.info(f"Successfully uploaded file to {s3_uri}")
            return s3_uri
            
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', 'Unknown')
            logger.error(f"S3 upload failed for {key}: {error_code} - {str(e)}")
            raise
        except BotoCoreError as e:
            logger.error(f"BotoCore error during upload: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error during S3 upload: {str(e)}")
            raise
    
    def generate_presigned_url(
        self, 
        bucket: str, 
        key: str, 
        expiration: int = 900
    ) -> str:
        """
        Generate a presigned URL for downloading a file from S3
        
        Args:
            bucket: S3 bucket name
            key: S3 object key (path)
            expiration: URL expiration time in seconds (default: 900 = 15 minutes)
            
        Returns:
            Presigned URL string
            
        Raises:
            ClientError: If URL generation fails
        """
        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': bucket,
                    'Key': key
                },
                ExpiresIn=expiration
            )
            
            logger.info(f"Generated presigned URL for {key} (expires in {expiration}s)")
            return url
            
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', 'Unknown')
            logger.error(f"Failed to generate presigned URL for {key}: {error_code} - {str(e)}")
            raise
        except BotoCoreError as e:
            logger.error(f"BotoCore error during presigned URL generation: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error generating presigned URL: {str(e)}")
            raise
    
    def delete_file(self, bucket: str, key: str) -> bool:
        """
        Delete a file from S3 bucket
        
        Args:
            bucket: S3 bucket name
            key: S3 object key (path)
            
        Returns:
            True if deletion was successful, False otherwise
            
        Raises:
            ClientError: If deletion fails
        """
        try:
            self.s3_client.delete_object(
                Bucket=bucket,
                Key=key
            )
            
            logger.info(f"Successfully deleted file: s3://{bucket}/{key}")
            return True
            
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', 'Unknown')
            logger.error(f"S3 deletion failed for {key}: {error_code} - {str(e)}")
            raise
        except BotoCoreError as e:
            logger.error(f"BotoCore error during deletion: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error during S3 deletion: {str(e)}")
            raise
    
    def check_bucket_exists(self, bucket: str) -> bool:
        """
        Check if an S3 bucket exists and is accessible
        
        Args:
            bucket: S3 bucket name
            
        Returns:
            True if bucket exists and is accessible, False otherwise
        """
        try:
            self.s3_client.head_bucket(Bucket=bucket)
            logger.info(f"Bucket {bucket} exists and is accessible")
            return True
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', 'Unknown')
            if error_code == '404':
                logger.warning(f"Bucket {bucket} does not exist")
            elif error_code == '403':
                logger.warning(f"Access denied to bucket {bucket}")
            else:
                logger.error(f"Error checking bucket {bucket}: {error_code}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error checking bucket {bucket}: {str(e)}")
            return False


# Global S3 service instance
s3_service = S3Service()
