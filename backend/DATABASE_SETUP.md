# Database Setup Guide

This guide explains how to set up and manage the PostgreSQL database for Voice of Care (ASHA).

## Prerequisites

- PostgreSQL 15 installed and running
- Python virtual environment activated
- Environment variables configured in `.env` file

## Initial Setup

### 1. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE voice_of_care;

# Create user (optional)
CREATE USER voice_of_care_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE voice_of_care TO voice_of_care_user;

# Exit psql
\q
```

### 2. Configure Environment

Update your `.env` file with the correct database URL:

```
DATABASE_URL=postgresql://voice_of_care_user:your_password@localhost:5432/voice_of_care
```

### 3. Run Migrations

```bash
# Activate virtual environment
source venv/bin/activate

# Run migrations to create all tables
alembic upgrade head
```

## Database Models

The following tables are created by the initial migration:

### collection_centers
- Healthcare facility information
- Fields: id, name, address, meta_data, created_at

### workers
- ASHA workers, medical officers, and other healthcare workers
- Fields: id, first_name, last_name, phone_number, aadhar_id, email, address, worker_type, worker_id, password_hash, mpin_hash, collection_center_id, profile_photo_url, meta_data, created_at, updated_at

### beneficiaries
- Individuals receiving healthcare services
- Fields: id, first_name, last_name, phone_number, aadhar_id, email, address, age, weight, mcts_id, beneficiary_type, assigned_asha_id, meta_data, created_at, updated_at

### visit_templates
- Structured questionnaires for different visit types
- Fields: id, template_type, name, questions (JSON), meta_data, created_at

### visits
- Healthcare visit records
- Fields: id, visit_type, visit_date_time, day_number, is_synced, assigned_asha_id, beneficiary_id, template_id, visit_data (JSON), meta_data, synced_at, created_at, updated_at

### sync_logs
- Data synchronization operation tracking
- Fields: id, visit_id, worker_id, collection_center_id, date_time, status, error_message, meta_data

## Migration Commands

### Create a new migration
```bash
alembic revision --autogenerate -m "Description of changes"
```

### Apply migrations
```bash
# Upgrade to latest version
alembic upgrade head

# Upgrade to specific version
alembic upgrade <revision_id>
```

### Rollback migrations
```bash
# Downgrade one version
alembic downgrade -1

# Downgrade to specific version
alembic downgrade <revision_id>

# Downgrade all
alembic downgrade base
```

### View migration history
```bash
# Show current version
alembic current

# Show migration history
alembic history

# Show pending migrations
alembic heads
```

## Validation Rules

### Worker Model
- worker_id: exactly 8 digits, unique
- worker_type: one of [asha_worker, medical_officer, anm, aaw]
- phone_number: 10 digits (Indian mobile format)
- aadhar_id: 12 digits (if provided)
- mpin: exactly 4 digits (hashed)

### Beneficiary Model
- mcts_id: unique, non-empty for HBNC beneficiaries
- beneficiary_type: one of [individual, child, mother_child]
- assigned_asha_id: must reference valid ASHA worker

### Visit Model
- visit_type: one of [hbnc, anc, pnc]
- day_number: one of [1, 3, 7, 14, 28] for HBNC visits
- visit_data: JSON with answers array
- assigned_asha_id: must reference ASHA worker
- beneficiary_id: must reference valid beneficiary
- template_id: must match visit_type

### Sync Log Model
- status: one of [completed, incomplete, failed]
- error_message: required when status is 'failed'

## JSON Field Structures

### visit_data (Visit model)
```json
{
  "answers": [
    {
      "question_id": "hbnc_q1",
      "answer": "yes",
      "audio_s3_key": "audio/worker_1/visit_123/q1.m4a",
      "transcript_en": "yes the baby is breathing fine",
      "transcript_hi": null,
      "recorded_at": "2026-03-01T10:30:00Z"
    }
  ]
}
```

### questions (VisitTemplate model)
```json
[
  {
    "id": "hbnc_q1",
    "order": 1,
    "input_type": "yes_no",
    "question_en": "Is the baby breathing normally?",
    "question_hi": "क्या बच्चा सामान्य रूप से सांस ले रहा है?",
    "action_en": "If no, refer to nearest health facility immediately.",
    "action_hi": "यदि नहीं, तुरंत निकटतम अस्पताल जाएं।",
    "is_required": true
  }
]
```

## Troubleshooting

### Connection refused error
- Ensure PostgreSQL is running: `sudo service postgresql status`
- Check DATABASE_URL in .env file
- Verify PostgreSQL is listening on correct port: `sudo netstat -plunt | grep postgres`

### Migration conflicts
- Check current version: `alembic current`
- View migration history: `alembic history`
- If needed, manually resolve conflicts in migration files

### Permission errors
- Ensure database user has correct privileges
- Grant privileges: `GRANT ALL PRIVILEGES ON DATABASE voice_of_care TO voice_of_care_user;`

## Performance Optimization

### Indexes
The migration creates indexes on frequently queried columns:
- workers.worker_id
- beneficiaries.mcts_id
- visits.visit_type, visit_date_time, is_synced
- visit_templates.template_type
- sync_logs.date_time

### Connection Pooling
SQLAlchemy connection pool settings (in database.py):
- pool_size: 5 connections
- max_overflow: 10 additional connections
- pool_pre_ping: True (validates connections before use)

## Backup and Restore

### Backup database
```bash
pg_dump -U voice_of_care_user voice_of_care > backup.sql
```

### Restore database
```bash
psql -U voice_of_care_user voice_of_care < backup.sql
```

## Security Considerations

- All passwords are hashed using bcrypt
- MPINs are hashed using bcrypt
- JWT tokens stored securely on client side
- Database credentials in environment variables only
- Use SSL/TLS for production database connections
