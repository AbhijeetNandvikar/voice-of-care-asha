#!/bin/bash

# Test sync for AW000001 (Meera Patil) - Worker ID: 31
# Beneficiary: Baby More (Child) - ID: 16
# Template: HBNC v2.0 - ID: 5
# Using actual audio file from test_file folder
# This will upload the audio to S3 and start transcription

echo "Testing sync with audio file..."
echo "Worker: AW000001 (Meera Patil) - ID: 31"
echo "Beneficiary: Baby More (Child) - ID: 16"
echo "Template: HBNC v2.0 - ID: 5"
echo "Audio file: test_file/ttsmaker-file-2026-3-6-1-20-45.m4a"
echo ""

curl -X 'POST' \
  'https://bharatcred.com/api/v1/sync/visits' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzMSIsImV4cCI6MTc3Mjk3MzE3NH0.hAWCTC1knaGf14KEcY5wYPkq2MuvHNuP2Q7nS3Tm7oY' \
  -H 'Content-Type: multipart/form-data' \
  -F 'visits_json=[
    {
      "local_id": 1001,
      "visit_type": "hbnc",
      "visit_date_time": "2026-03-07T10:30:00Z",
      "day_number": 1,
      "assigned_asha_id": 31,
      "beneficiary_id": 16,
      "template_id": 5,
      "visit_data": {
        "answers": [
          {
            "question_id": "hbnc_q1",
            "answer": null,
            "audio_s3_key": "audio/worker_31/visit_1001/hbnc_q1.m4a",
            "recorded_at": "2026-03-07T10:31:00Z"
          }
        ]
      },
      "meta_data": {
        "app_version": "1.0.0",
        "device_model": "Test Device",
        "sync_attempt": 1
      }
    }
  ]' \
  -F 'files=@../test_file/ttsmaker-file-2026-3-6-1-20-45.m4a;filename=1001_hbnc_q1.m4a;type=audio/m4a'

echo ""
echo ""
echo "Check S3 bucket for: audio/worker_31/visit_1001/hbnc_q1.m4a"
