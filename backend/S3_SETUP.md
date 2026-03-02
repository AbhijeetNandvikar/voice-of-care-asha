# AWS S3 Setup Guide

## Overview

The Voice of Care system uses two S3 buckets for storage:
1. **voice-of-care-audio**: Stores audio recordings from ASHA worker visits
2. **voice-of-care-reports**: Stores generated Excel reports for medical officers

## Bucket Configuration

### Creating Buckets

You can create the buckets using AWS CLI or AWS Console:

```bash
# Create audio bucket
aws s3 mb s3://voice-of-care-audio --region ap-south-1

# Create reports bucket
aws s3 mb s3://voice-of-care-reports --region ap-south-1
```

### Security Settings

Both buckets should be configured with:
- **Block all public access**: Enabled
- **Bucket versioning**: Enabled (recommended)
- **Server-side encryption**: AES-256 or KMS

```bash
# Block public access
aws s3api put-public-access-block \
    --bucket voice-of-care-audio \
    --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

aws s3api put-public-access-block \
    --bucket voice-of-care-reports \
    --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Enable versioning
aws s3api put-bucket-versioning \
    --bucket voice-of-care-audio \
    --versioning-configuration Status=Enabled

aws s3api put-bucket-versioning \
    --bucket voice-of-care-reports \
    --versioning-configuration Status=Enabled
```

### Lifecycle Policies (Optional)

For cost optimization, you can archive old audio files to Glacier:

```json
{
  "Rules": [
    {
      "Id": "ArchiveOldAudio",
      "Status": "Enabled",
      "Transitions": [
        {
          "Days": 90,
          "StorageClass": "GLACIER"
        }
      ]
    }
  ]
}
```

Apply the policy:
```bash
aws s3api put-bucket-lifecycle-configuration \
    --bucket voice-of-care-audio \
    --lifecycle-configuration file://lifecycle-policy.json
```

## IAM Permissions

The EC2 instance or IAM user needs the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::voice-of-care-audio/*",
        "arn:aws:s3:::voice-of-care-reports/*",
        "arn:aws:s3:::voice-of-care-audio",
        "arn:aws:s3:::voice-of-care-reports"
      ]
    }
  ]
}
```

## Environment Variables

Update your `.env` file with the bucket names:

```env
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=ap-south-1
AWS_S3_BUCKET_AUDIO=voice-of-care-audio
AWS_S3_BUCKET_REPORTS=voice-of-care-reports
```

## S3 Service Usage

The S3 service is available as a singleton instance:

```python
from app.services.s3 import s3_service

# Upload a file
s3_uri = s3_service.upload_file(
    file_content=audio_bytes,
    bucket=s3_service.audio_bucket,
    key="audio/worker_123/visit_456/q1.m4a",
    content_type="audio/mp4"
)

# Generate presigned URL (15 minutes expiry)
download_url = s3_service.generate_presigned_url(
    bucket=s3_service.reports_bucket,
    key="reports/hbnc_report_2026_03.xlsx",
    expiration=900
)

# Delete a file
success = s3_service.delete_file(
    bucket=s3_service.audio_bucket,
    key="audio/worker_123/visit_456/q1.m4a"
)

# Check if bucket exists
exists = s3_service.check_bucket_exists(s3_service.audio_bucket)
```

## Key Naming Conventions

### Audio Files
Pattern: `audio/{worker_id}/{visit_id}/{question_id}.m4a`

Example: `audio/12345678/1001/hbnc_q1.m4a`

### Report Files
Pattern: `reports/{report_type}_{timestamp}.xlsx`

Example: `reports/hbnc_report_20260301_143022.xlsx`

## Troubleshooting

### Access Denied Errors
- Verify IAM permissions are correctly configured
- Check that bucket names in `.env` match actual bucket names
- Ensure AWS credentials are valid and not expired

### Bucket Not Found
- Verify buckets exist in the correct region
- Check bucket names for typos
- Ensure region in `.env` matches bucket region

### Upload Failures
- Check file size limits (S3 supports up to 5TB per object)
- Verify network connectivity to AWS
- Check CloudWatch logs for detailed error messages
