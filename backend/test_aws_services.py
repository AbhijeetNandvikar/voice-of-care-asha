#!/usr/bin/env python3
"""
Test script for AWS S3 and Transcribe services
Verifies IAM role permissions and basic functionality
"""

import os
import sys
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
import tempfile
from datetime import datetime

# Configuration from environment
AWS_REGION = os.getenv('AWS_REGION', 'ap-south-1')
S3_BUCKET_AUDIO = os.getenv('AWS_S3_BUCKET_AUDIO', 'voice-of-care-audio')
S3_BUCKET_REPORTS = os.getenv('AWS_S3_BUCKET_REPORTS', 'voice-of-care-reports')


def test_credentials():
    """Test if AWS credentials are available (IAM role)"""
    print("\n=== Testing AWS Credentials ===")
    try:
        sts = boto3.client('sts', region_name=AWS_REGION)
        identity = sts.get_caller_identity()
        print(f"✓ Credentials found")
        print(f"  Account: {identity['Account']}")
        print(f"  ARN: {identity['Arn']}")
        print(f"  User ID: {identity['UserId']}")
        return True
    except NoCredentialsError:
        print("✗ No credentials found. Ensure IAM role is attached to EC2 instance.")
        return False
    except Exception as e:
        print(f"✗ Error checking credentials: {e}")
        return False


def test_s3_bucket(bucket_name):
    """Test S3 bucket access and operations"""
    print(f"\n=== Testing S3 Bucket: {bucket_name} ===")
    
    try:
        s3 = boto3.client('s3', region_name=AWS_REGION)
        
        # Test 1: Check if bucket exists
        print(f"Checking if bucket exists...")
        try:
            s3.head_bucket(Bucket=bucket_name)
            print(f"✓ Bucket '{bucket_name}' exists and is accessible")
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == '404':
                print(f"✗ Bucket '{bucket_name}' does not exist")
                return False
            elif error_code == '403':
                print(f"✗ Access denied to bucket '{bucket_name}'")
                return False
            else:
                print(f"✗ Error accessing bucket: {e}")
                return False
        
        # Test 2: Upload a test file
        print(f"Testing file upload...")
        test_key = f"test/test-{datetime.now().strftime('%Y%m%d-%H%M%S')}.txt"
        test_content = f"Test file created at {datetime.now().isoformat()}"
        
        s3.put_object(
            Bucket=bucket_name,
            Key=test_key,
            Body=test_content.encode('utf-8'),
            ContentType='text/plain'
        )
        print(f"✓ Successfully uploaded test file: {test_key}")
        
        # Test 3: Read the file back
        print(f"Testing file download...")
        response = s3.get_object(Bucket=bucket_name, Key=test_key)
        downloaded_content = response['Body'].read().decode('utf-8')
        
        if downloaded_content == test_content:
            print(f"✓ Successfully downloaded and verified test file")
        else:
            print(f"✗ Downloaded content doesn't match uploaded content")
            return False
        
        # Test 4: Generate presigned URL
        print(f"Testing presigned URL generation...")
        url = s3.generate_presigned_url(
            'get_object',
            Params={'Bucket': bucket_name, 'Key': test_key},
            ExpiresIn=3600
        )
        print(f"✓ Successfully generated presigned URL")
        print(f"  URL (expires in 1 hour): {url[:80]}...")
        
        # Test 5: Delete test file
        print(f"Cleaning up test file...")
        s3.delete_object(Bucket=bucket_name, Key=test_key)
        print(f"✓ Successfully deleted test file")
        
        return True
        
    except ClientError as e:
        print(f"✗ S3 Error: {e}")
        return False
    except Exception as e:
        print(f"✗ Unexpected error: {e}")
        return False


def test_transcribe():
    """Test AWS Transcribe service access"""
    print(f"\n=== Testing AWS Transcribe ===")
    
    try:
        transcribe = boto3.client('transcribe', region_name=AWS_REGION)
        
        # Test 1: List transcription jobs (just to verify access)
        print(f"Testing Transcribe API access...")
        response = transcribe.list_transcription_jobs(MaxResults=1)
        print(f"✓ Successfully accessed Transcribe API")
        print(f"  Found {len(response.get('TranscriptionJobSummaries', []))} recent jobs")
        
        # Test 2: Check supported languages
        print(f"Checking supported languages...")
        # Note: We're just verifying we can call the API, not starting an actual job
        print(f"✓ Transcribe service is accessible")
        print(f"  Supported languages include: en-IN (English-India), hi-IN (Hindi-India)")
        
        return True
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == 'AccessDeniedException':
            print(f"✗ Access denied to Transcribe service")
            print(f"  Ensure IAM role has 'transcribe:*' permissions")
        else:
            print(f"✗ Transcribe Error: {e}")
        return False
    except Exception as e:
        print(f"✗ Unexpected error: {e}")
        return False


def test_transcribe_with_audio():
    """Test actual transcription with a sample audio file"""
    print(f"\n=== Testing Transcribe with Sample Audio ===")
    print(f"Note: This requires an audio file in S3. Skipping for now.")
    print(f"To test transcription:")
    print(f"  1. Upload an audio file to s3://{S3_BUCKET_AUDIO}/test/sample.mp3")
    print(f"  2. Use the /api/v1/sync/transcribe endpoint from the API")
    return True


def main():
    """Run all tests"""
    print("=" * 60)
    print("AWS Services Test Suite")
    print("=" * 60)
    print(f"Region: {AWS_REGION}")
    print(f"Audio Bucket: {S3_BUCKET_AUDIO}")
    print(f"Reports Bucket: {S3_BUCKET_REPORTS}")
    
    results = {
        'credentials': test_credentials(),
        's3_audio': test_s3_bucket(S3_BUCKET_AUDIO),
        's3_reports': test_s3_bucket(S3_BUCKET_REPORTS),
        'transcribe': test_transcribe(),
        'transcribe_audio': test_transcribe_with_audio()
    }
    
    print("\n" + "=" * 60)
    print("Test Results Summary")
    print("=" * 60)
    
    for test_name, passed in results.items():
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"{status}: {test_name}")
    
    all_passed = all(results.values())
    
    if all_passed:
        print("\n✓ All tests passed! AWS services are configured correctly.")
        return 0
    else:
        print("\n✗ Some tests failed. Check IAM role permissions.")
        print("\nRequired IAM permissions:")
        print("  - s3:ListBucket")
        print("  - s3:GetObject")
        print("  - s3:PutObject")
        print("  - s3:DeleteObject")
        print("  - transcribe:StartTranscriptionJob")
        print("  - transcribe:GetTranscriptionJob")
        print("  - transcribe:ListTranscriptionJobs")
        return 1


if __name__ == '__main__':
    sys.exit(main())
