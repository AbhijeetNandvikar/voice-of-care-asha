# Mobile Initialization Endpoint Implementation

## Overview
Implemented the mobile initialization endpoint as specified in task 4 of the Voice of Care (ASHA) implementation plan.

## Endpoint Details

### Route
`GET /api/v1/mobile/init`

### Authentication
- Requires JWT Bearer token in Authorization header
- Uses `get_current_worker` dependency for authentication
- Only accessible to ASHA workers (worker_type = "asha_worker")

### Response Structure
```json
{
  "worker": {
    "id": 1,
    "first_name": "string",
    "last_name": "string",
    "phone_number": "string",
    "email": "string",
    "address": "string",
    "worker_type": "asha_worker",
    "worker_id": "12345678",
    "collection_center_id": 1,
    "profile_photo_url": "string",
    "meta_data": {}
  },
  "beneficiaries": [
    {
      "id": 1,
      "first_name": "string",
      "last_name": "string",
      "phone_number": "string",
      "aadhar_id": "string",
      "email": "string",
      "address": "string",
      "age": 1,
      "weight": 3.5,
      "mcts_id": "MCTS001",
      "beneficiary_type": "child",
      "assigned_asha_id": 1,
      "meta_data": {}
    }
  ],
  "templates": [
    {
      "id": 1,
      "template_type": "hbnc",
      "name": "HBNC Visit Template",
      "questions": [...],
      "meta_data": {}
    }
  ]
}
```

## Implementation Details

### Files Created/Modified

1. **backend/app/routers/mobile.py** (NEW)
   - Created new router for mobile endpoints
   - Implemented `/init` endpoint with JWT authentication
   - Filters beneficiaries by assigned_asha_id
   - Queries HBNC templates only (v1 scope)

2. **backend/app/routers/__init__.py** (MODIFIED)
   - Added mobile_router export

3. **backend/app/main.py** (MODIFIED)
   - Registered mobile_router with FastAPI app

4. **backend/tests/test_mobile_init.py** (NEW)
   - Comprehensive test suite with 8 test cases
   - Tests success scenarios, edge cases, and error conditions

5. **backend/test_mobile_init_manual.py** (NEW)
   - Manual test script for integration testing
   - Demonstrates complete login + init flow

## Requirements Satisfied

✅ **Requirement 3: Offline Data Initialization**
- Endpoint returns worker profile for authenticated ASHA worker
- Returns only beneficiaries assigned to the authenticated worker (assigned_asha_id filter)
- Returns all HBNC visit templates for offline storage
- JSON structure matches specification: {worker, beneficiaries, templates}

## Security Features

1. **JWT Authentication**: Endpoint requires valid JWT token
2. **Authorization**: Only ASHA workers can access (403 for other worker types)
3. **Data Isolation**: Workers only see their assigned beneficiaries
4. **No Password Exposure**: Worker profile excludes password_hash and mpin_hash

## Test Coverage

### Test Cases Implemented

1. ✅ `test_mobile_init_success` - Happy path with beneficiaries and templates
2. ✅ `test_mobile_init_no_beneficiaries` - Worker with no assigned beneficiaries
3. ✅ `test_mobile_init_no_templates` - System with no HBNC templates
4. ✅ `test_mobile_init_unauthorized` - Request without authentication
5. ✅ `test_mobile_init_invalid_token` - Request with invalid JWT token
6. ✅ `test_mobile_init_non_asha_worker` - Medical officer attempting access
7. ✅ `test_mobile_init_filters_other_workers_beneficiaries` - Data isolation verification

## Usage Example

```python
import requests

# 1. Login to get JWT token
login_response = requests.post(
    "http://localhost:8000/api/v1/auth/login",
    json={"worker_id": "12345678", "password": "password123"}
)
token = login_response.json()["access_token"]

# 2. Call mobile init endpoint
init_response = requests.get(
    "http://localhost:8000/api/v1/mobile/init",
    headers={"Authorization": f"Bearer {token}"}
)

# 3. Use data for offline storage
data = init_response.json()
worker = data["worker"]
beneficiaries = data["beneficiaries"]
templates = data["templates"]
```

## Next Steps

The mobile app can now:
1. Authenticate the ASHA worker
2. Call this endpoint after first login
3. Store worker profile, beneficiaries, and templates in SQLite
4. Work fully offline using the seeded data

## Related Tasks

- ✅ Task 3.2: Authentication endpoints (prerequisite)
- ⏳ Task 37: Mobile initialization flow (uses this endpoint)
- ⏳ Task 33: SQLite database setup (consumes this data)
