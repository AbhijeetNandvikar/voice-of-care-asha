# Implementation Plan: Voice of Care (ASHA)

## Overview

This implementation plan breaks down the Voice of Care (ASHA) system into a 7-day development timeline. The system consists of three integrated components: a FastAPI backend, a React web dashboard, and an Expo React Native mobile app. The plan follows an incremental approach where each day builds on previous work, with checkpoints to ensure quality and integration.

The implementation prioritizes core functionality for HBNC visits, offline-first mobile architecture, AWS service integration (S3, Transcribe, Bedrock), and government-compliant report generation. All tasks reference specific requirements from the requirements document for traceability.

## Tasks

### Day 1: Backend Foundation

- [x] 1. Set up monorepo structure and backend project
  - Create root directory with backend/, web/, and mobile/ folders
  - Initialize backend/ with Python virtual environment and FastAPI project
  - Create requirements.txt with FastAPI, SQLAlchemy, Alembic, psycopg2, python-jose, passlib, bcrypt, boto3, openpyxl, python-multipart, pydantic, pydantic-settings, uvicorn
  - Set up .env file structure for environment variables (DATABASE_URL, JWT_SECRET, AWS credentials)
  - Create backend/app/ directory with __init__.py, main.py, config.py
  - _Requirements: 27, 28_

- [x] 2. Configure PostgreSQL and initialize database models
  - [x] 2.1 Create SQLAlchemy models for all entities
    - Create backend/app/models/ directory with __init__.py
    - Implement Worker model with fields: id, first_name, last_name, phone_number, aadhar_id, email, address, worker_type, worker_id, password_hash, mpin_hash, collection_center_id, profile_photo_url, meta_data (JSONB), created_at, updated_at
    - Implement Beneficiary model with fields: id, first_name, last_name, phone_number, aadhar_id, email, address, age, weight, mcts_id, beneficiary_type, assigned_asha_id (FK), meta_data (JSONB), created_at, updated_at
    - Implement Visit model with fields: id, visit_type, visit_date_time, day_number, is_synced, assigned_asha_id (FK), beneficiary_id (FK), template_id (FK), visit_data (JSONB), meta_data (JSONB), synced_at, created_at, updated_at
    - Implement VisitTemplate model with fields: id, template_type, name, questions (JSONB), meta_data (JSONB), created_at
    - Implement SyncLog model with fields: id, visit_id (FK), worker_id (FK), collection_center_id (FK), date_time, status, error_message, meta_data (JSONB)
    - Implement CollectionCenter model with fields: id, name, address, meta_data (JSONB), created_at
    - _Requirements: 27_

  - [x] 2.2 Set up Alembic for database migrations
    - Initialize Alembic with `alembic init alembic`
    - Configure alembic.ini with DATABASE_URL from environment
    - Create initial migration with all models
    - _Requirements: 27_


- [x] 3. Implement authentication service and endpoints
  - [x] 3.1 Create authentication service
    - Create backend/app/services/ directory with __init__.py
    - Implement AuthService class with methods: authenticate_worker(), setup_mpin(), verify_mpin(), create_access_token(), verify_token()
    - Use bcrypt for password hashing (cost factor 12) and MPIN hashing (cost factor 10)
    - Use python-jose for JWT token generation with 24-hour expiration
    - _Requirements: 1, 2, 28_

  - [x] 3.2 Create authentication endpoints
    - Create backend/app/routers/ directory with __init__.py
    - Implement POST /api/v1/auth/login endpoint accepting worker_id and password, returning JWT token and worker profile
    - Implement POST /api/v1/auth/mpin/setup endpoint accepting mpin, storing bcrypt hash
    - Implement POST /api/v1/auth/mpin/verify endpoint accepting worker_id and mpin, returning JWT token
    - Create JWT authentication dependency for protected routes
    - _Requirements: 1, 2, 28_

  - [x] 3.3 Write unit tests for authentication
    - Test valid login credentials
    - Test invalid login credentials
    - Test MPIN setup and verification
    - Test JWT token generation and validation
    - Test token expiration
    - _Requirements: 1, 2_

- [x] 4. Implement mobile initialization endpoint
  - Create GET /api/v1/mobile/init endpoint that returns worker profile, assigned beneficiaries, and visit templates
  - Query beneficiaries where assigned_asha_id matches authenticated worker
  - Query all templates for HBNC visit type
  - Return JSON with structure: {worker: {...}, beneficiaries: [...], templates: [...]}
  - _Requirements: 3_

- [x] 5. Checkpoint - Test backend foundation
  - Run Alembic migrations to create database schema
  - Test authentication endpoints with Postman or curl
  - Verify JWT token generation and validation
  - Verify mobile init endpoint returns correct data
  - Ensure all tests pass, ask the user if questions arise

### Day 2: Backend CRUD + AWS Integration

- [ ] 6. Implement Workers CRUD API
  - Create POST /api/v1/workers endpoint to create worker with auto-generated 8-digit worker_id
  - Create GET /api/v1/workers endpoint with pagination (default 20 items per page)
  - Create GET /api/v1/workers/{id} endpoint to retrieve single worker
  - Create PUT /api/v1/workers/{id} endpoint to update worker
  - Implement search by name or worker_id query parameter
  - Hash password with bcrypt before storing
  - _Requirements: 20, 27, 28_

- [ ] 7. Implement Beneficiaries CRUD API
  - Create POST /api/v1/beneficiaries endpoint to create beneficiary with MCTS ID uniqueness validation
  - Create GET /api/v1/beneficiaries endpoint with pagination and filtering by beneficiary_type
  - Create GET /api/v1/beneficiaries/{id} endpoint to retrieve single beneficiary
  - Create PUT /api/v1/beneficiaries/{id} endpoint to update beneficiary
  - Implement search by MCTS ID or name query parameter
  - _Requirements: 21, 27_

- [ ] 8. Implement Templates API and seed HBNC template
  - [ ] 8.1 Create templates endpoints
    - Create POST /api/v1/templates endpoint to create template
    - Create GET /api/v1/templates endpoint to list templates
    - Create GET /api/v1/templates/{id} endpoint to retrieve single template
    - Validate template_type is one of: hbnc, anc, pnc
    - Validate questions array structure with required fields
    - _Requirements: 34_

  - [ ] 8.2 Create HBNC template seed script
    - Create backend/scripts/seed_hbnc_template.py
    - Define HBNC questions with English and Hindi translations
    - Include questions for: breathing, feeding, temperature, umbilical cord, jaundice, weight
    - Set appropriate input_type (yes_no, number, voice) for each question
    - Include action_en and action_hi for critical questions
    - _Requirements: 5, 34_


- [ ] 9. Implement AWS S3 service
  - Create backend/app/services/s3_service.py
  - Implement S3Service class with methods: upload_file(), generate_presigned_url(), delete_file()
  - Configure boto3 client with AWS credentials from environment
  - Create two S3 buckets: voice-of-care-audio and voice-of-care-exports (or use existing)
  - Set buckets to private with no public access
  - Implement error handling for S3 operations
  - _Requirements: 13, 28_

- [ ] 10. Implement AWS Transcribe service
  - Create backend/app/services/transcribe_service.py
  - Implement TranscribeService class with methods: start_transcription_job(), get_transcription_result()
  - Configure boto3 client for AWS Transcribe
  - Support language codes: hi-IN (Hindi) and en-IN (English)
  - Generate unique job names using timestamp and visit ID
  - _Requirements: 26_

- [ ] 11. Implement visits sync endpoint
  - [ ] 11.1 Create sync service
    - Create backend/app/services/sync_service.py
    - Implement SyncService class with method: process_visit_sync()
    - Accept multipart form data with visits_json and audio files
    - Parse visits JSON array and validate each visit
    - Upload audio files to S3 with key pattern: audio/{worker_id}/{visit_id}/{question_id}.m4a
    - Start transcription jobs for each audio file
    - Save visit records to PostgreSQL with is_synced = true
    - Create sync_log entries with status 'completed' or 'failed'
    - Handle partial failures gracefully
    - _Requirements: 13, 26, 33_

  - [ ] 11.2 Create sync endpoint
    - Create POST /api/v1/sync/visits endpoint accepting multipart form data
    - Extract visits_json and audio files from form data
    - Call SyncService.process_visit_sync()
    - Return response with synced_visit_ids and failed_visits
    - Set timeout to 300 seconds (5 minutes)
    - _Requirements: 13_

  - [ ]* 11.3 Write property test for sync idempotency
    - **Property P7: Sync Idempotency**
    - **Validates: Requirements 13**
    - Test that syncing the same visit multiple times produces the same result
    - Verify no duplicate sync_log entries with status 'completed'

- [ ] 12. Implement sync logs endpoint
  - Create GET /api/v1/sync-logs endpoint with pagination
  - Support filtering by status (completed, incomplete, failed)
  - Support filtering by date range
  - Include worker name and visit count in response
  - Order by date_time descending
  - _Requirements: 23, 33_

- [ ] 13. Checkpoint - Test backend CRUD and AWS integration
  - Test all CRUD endpoints with Postman
  - Test S3 file upload and presigned URL generation
  - Test sync endpoint with sample multipart data
  - Verify transcription jobs are created in AWS Transcribe
  - Ensure all tests pass, ask the user if questions arise

### Day 3: Backend Reports + Web Shell

- [ ] 14. Implement AWS Bedrock service
  - Create backend/app/services/bedrock_service.py
  - Implement BedrockService class with methods: invoke_claude(), format_hbnc_report_prompt()
  - Configure boto3 client for AWS Bedrock with model: anthropic.claude-3-5-sonnet-20241022-v2:0
  - Implement prompt formatting to structure visit data for Claude
  - Parse Claude's JSON response
  - Implement error handling and timeout (60 seconds)
  - _Requirements: 25_

- [ ] 15. Implement Excel report generation
  - [ ] 15.1 Create report service
    - Create backend/app/services/report_service.py
    - Implement ReportService class with methods: generate_report(), query_visits(), build_excel(), upload_report_to_s3()
    - Query visits from PostgreSQL based on filters (visit_type, start_date, end_date, worker_id)
    - Format visit data for Claude prompt
    - Invoke BedrockService to get report JSON
    - Use openpyxl to build Excel workbook with headers and data rows
    - Apply header styling (bold, background color)
    - Include summary row with total visit count
    - _Requirements: 25, 32_

  - [ ] 15.2 Create reports endpoint
    - Create POST /api/v1/reports/generate endpoint accepting filters
    - Call ReportService.generate_report()
    - Upload Excel file to S3 exports bucket
    - Generate presigned download URL with 15-minute expiration
    - Return response with report_id, download_url, and expires_at
    - _Requirements: 25_

  - [ ]* 15.3 Write unit tests for report generation
    - Test query_visits with various filters
    - Test Excel generation with sample data
    - Test error handling when no visits found
    - Test Claude API failure handling


- [ ] 16. Initialize React web application
  - Create web/ directory and initialize Vite React TypeScript project
  - Install dependencies: react, react-dom, react-router-dom, axios, recharts
  - Include UX4G Design System from CDN (version 2.0.8) in index.html
  - Create web/src/ structure with components/, pages/, services/, types/, utils/
  - Set up axios instance with base URL and JWT token interceptor
  - _Requirements: 35_

- [ ] 17. Implement web authentication and routing
  - [ ] 17.1 Create authentication service
    - Create web/src/services/authService.ts
    - Implement login(), logout(), getToken(), isAuthenticated() functions
    - Store JWT token in localStorage
    - _Requirements: 19, 28_

  - [ ] 17.2 Set up routing with protected routes
    - Create web/src/App.tsx with React Router
    - Implement ProtectedRoute component that checks authentication
    - Define routes: /login, /signup, /dashboard, /workers, /beneficiaries, /visits, /sync-logs, /data-export, /profile
    - Redirect unauthenticated users to /login
    - _Requirements: 19_

  - [ ] 17.3 Create sidebar layout
    - Create web/src/components/Layout.tsx with sidebar navigation
    - Use UX4G sidebar component styling
    - Include navigation links for all main pages
    - Display logged-in user name in header
    - Include logout button
    - _Requirements: 35_

- [ ] 18. Create login and signup pages
  - [ ] 18.1 Create login page
    - Create web/src/pages/Login.tsx
    - Use UX4G form components for worker_id and password inputs
    - Call authService.login() on form submission
    - Display error messages for invalid credentials
    - Redirect to dashboard on successful login
    - _Requirements: 19_

  - [ ] 18.2 Create signup page (placeholder)
    - Create web/src/pages/Signup.tsx with basic form structure
    - Note: Full signup flow is out of scope for v1, workers are created by medical officers
    - _Requirements: 20_

- [ ] 19. Checkpoint - Test web shell and authentication
  - Run web app with `npm run dev`
  - Test login with valid and invalid credentials
  - Verify JWT token is stored in localStorage
  - Verify protected routes redirect to login when unauthenticated
  - Verify sidebar navigation works
  - Ensure all tests pass, ask the user if questions arise

### Day 4: Web Dashboard and Data Management

- [ ] 20. Implement dashboard page with statistics
  - [ ] 20.1 Create dashboard API endpoints
    - Create GET /api/v1/dashboard/stats endpoint returning total workers, beneficiaries, visits, and pending syncs
    - Create GET /api/v1/dashboard/visits-by-date endpoint returning visit counts for last 30 days
    - _Requirements: 24_

  - [ ] 20.2 Create dashboard page
    - Create web/src/pages/Dashboard.tsx
    - Display four stat cards using UX4G card components
    - Fetch stats from dashboard API
    - Display bar chart using Recharts showing visits by date
    - Make stat cards clickable to navigate to detail pages
    - _Requirements: 24_

- [ ] 21. Create reusable DataTable component
  - Create web/src/components/DataTable.tsx
  - Accept props: columns, data, totalCount, currentPage, pageSize, onPageChange, onSearch, onFilter, onExport, onRowClick, loading
  - Use UX4G table styling
  - Implement pagination controls
  - Implement search input with debouncing (300ms)
  - Implement filter dropdowns
  - Implement export button
  - Emit row click events
  - _Requirements: 20, 21, 22, 23_

- [ ] 22. Create reusable DetailModal component
  - Create web/src/components/DetailModal.tsx
  - Accept props: title, fields, isOpen, onClose
  - Use UX4G modal component
  - Display field-value pairs with appropriate formatting
  - Support rendering types: text, date, json, badge, audio
  - Implement JSON pretty-printing for visit_data
  - _Requirements: 20, 21, 22_

- [ ] 23. Implement Workers page
  - [ ] 23.1 Create workers page
    - Create web/src/pages/Workers.tsx
    - Use DataTable component to display workers
    - Fetch workers from GET /api/v1/workers endpoint
    - Display columns: name, worker_id, worker_type, phone, collection center
    - Implement search by name or worker_id
    - Implement "Add Worker" button opening a form modal
    - _Requirements: 20_

  - [ ] 23.2 Create add worker form
    - Create web/src/components/AddWorkerForm.tsx
    - Use UX4G form components
    - Include fields: first_name, last_name, phone, email, aadhar_id, address, worker_type, collection_center_id, password
    - Validate required fields
    - Call POST /api/v1/workers on submission
    - Display success message and refresh table
    - _Requirements: 20, 27_

  - [ ] 23.3 Implement worker detail modal
    - Display worker details when row is clicked
    - Use DetailModal component
    - Show all worker fields including meta_data
    - _Requirements: 20_


- [ ] 24. Implement Beneficiaries page
  - [ ] 24.1 Create beneficiaries page
    - Create web/src/pages/Beneficiaries.tsx
    - Use DataTable component to display beneficiaries
    - Fetch beneficiaries from GET /api/v1/beneficiaries endpoint
    - Display columns: name, MCTS_ID, beneficiary_type, assigned ASHA worker, age
    - Implement search by MCTS_ID or name
    - Implement filter by beneficiary_type
    - Implement "Add Beneficiary" button opening a form modal
    - _Requirements: 21_

  - [ ] 24.2 Create add beneficiary form
    - Create web/src/components/AddBeneficiaryForm.tsx
    - Use UX4G form components
    - Include fields: first_name, last_name, mcts_id, phone, aadhar_id, address, age, weight, beneficiary_type, assigned_asha_id
    - Validate MCTS_ID uniqueness
    - Call POST /api/v1/beneficiaries on submission
    - Display success message and refresh table
    - _Requirements: 21, 27_

  - [ ] 24.3 Implement beneficiary detail modal
    - Display beneficiary details when row is clicked
    - Use DetailModal component
    - Show all beneficiary fields including meta_data
    - _Requirements: 21_

- [ ] 25. Checkpoint - Test web dashboard and data management
  - Test dashboard stats display correctly
  - Test visits chart renders with sample data
  - Test workers page with add, search, and detail view
  - Test beneficiaries page with add, search, filter, and detail view
  - Verify UX4G styling is applied correctly
  - Ensure all tests pass, ask the user if questions arise

### Day 5: Web Completion + Mobile Auth

- [ ] 26. Implement Visits page
  - [ ] 26.1 Create visits page
    - Create web/src/pages/Visits.tsx
    - Use DataTable component to display visits
    - Fetch visits from GET /api/v1/visits endpoint (create if not exists)
    - Display columns: beneficiary name, ASHA worker name, visit type, day number, visit date, sync status
    - Implement filter by date range
    - Implement filter by worker
    - Implement search by MCTS_ID
    - _Requirements: 22_

  - [ ] 26.2 Create visit detail modal
    - Create web/src/components/VisitDetailModal.tsx
    - Display visit header: beneficiary, worker, date, type, day
    - Parse and display visit_data JSON with questions and answers
    - Display transcripts if available
    - Use UX4G badge for sync status
    - _Requirements: 22_

- [ ] 27. Implement Sync Logs page
  - Create web/src/pages/SyncLogs.tsx
  - Use DataTable component to display sync logs
  - Fetch sync logs from GET /api/v1/sync-logs endpoint
  - Display columns: worker name, visit count, date_time, status, error_message
  - Use color-coded badges: green (completed), yellow (incomplete), red (failed)
  - Implement filter by status
  - Implement filter by date range
  - _Requirements: 23_

- [ ] 28. Implement Data Export page
  - Create web/src/pages/DataExport.tsx
  - Create form with fields: visit_type, start_date, end_date, worker_id (optional dropdown)
  - Use UX4G form components and date pickers
  - Call POST /api/v1/reports/generate on form submission
  - Display loading spinner during report generation
  - Display "Download Report" button with presigned URL when ready
  - Display expiration time (15 minutes)
  - Handle error when no visits found
  - _Requirements: 25, 32_

- [ ] 29. Implement Profile page
  - Create web/src/pages/Profile.tsx
  - Display logged-in user's profile information
  - Show name, worker_id, email, phone, address, profile photo
  - Display placeholder for earnings (future enhancement)
  - Use UX4G card components for layout
  - _Requirements: 17_

- [ ] 30. Create ChatDrawer placeholder
  - Create web/src/components/ChatDrawer.tsx
  - Create a collapsible drawer component using UX4G
  - Display "Coming Soon" message
  - Note: RAG-based chat is out of scope for v1
  - Add toggle button in layout header

- [ ] 31. Checkpoint - Test complete web application
  - Test all pages render correctly
  - Test visits page with filters and detail view
  - Test sync logs page with status filters
  - Test data export with report generation and download
  - Test profile page displays user information
  - Ensure all tests pass, ask the user if questions arise


- [ ] 32. Initialize Expo React Native mobile application
  - Create mobile/ directory and initialize Expo TypeScript project with `npx create-expo-app`
  - Install dependencies: expo-av, expo-sqlite, expo-secure-store, expo-speech, @react-navigation/native, @react-navigation/stack, @react-navigation/bottom-tabs, zustand, axios, react-i18next, i18next
  - Create mobile/src/ structure with components/, screens/, services/, store/, types/, utils/, locales/
  - Configure TypeScript with strict mode
  - _Requirements: 31_

- [ ] 33. Set up SQLite database for offline storage
  - [ ] 33.1 Create database schema
    - Create mobile/src/services/database.ts
    - Define SQLite schema for tables: workers, beneficiaries, templates, visits
    - Implement initialize() function to create tables with foreign key constraints
    - Create indexes on mcts_id, is_synced, beneficiary_id for performance
    - _Requirements: 3, 31_

  - [ ] 33.2 Implement database service
    - Implement DatabaseService class with methods: seedFromServer(), getWorker(), getBeneficiaries(), getBeneficiaryByMCTS(), getTemplate(), createVisit(), getVisits(), updateVisitSyncStatus(), getPendingVisits()
    - Use expo-sqlite for database operations
    - Handle JSON serialization for JSONB-like fields
    - _Requirements: 3, 31_

  - [ ]* 33.3 Write property test for database integrity
    - **Property P3: Beneficiary Assignment**
    - **Validates: Requirements 4, 27**
    - Test that all visits have valid beneficiary_id and assigned_asha_id
    - Test that beneficiary's assigned_asha_id matches visit's assigned_asha_id

- [ ] 34. Implement mobile authentication service
  - Create mobile/src/services/authService.ts
  - Implement functions: login(), setupMPIN(), verifyMPIN(), logout(), getStoredToken()
  - Use expo-secure-store to store JWT token securely
  - Use axios for API calls to backend
  - _Requirements: 1, 2, 28_

- [ ] 35. Create login screen
  - Create mobile/src/screens/LoginScreen.tsx
  - Create form with worker_id and password inputs
  - Call authService.login() on form submission
  - Display error messages for invalid credentials
  - Navigate to MPIN setup on first login
  - Navigate to MPIN verification on subsequent logins
  - Use React Native TextInput and Button components
  - _Requirements: 1_

- [ ] 36. Create MPIN setup and verification screens
  - [ ] 36.1 Create MPIN setup screen
    - Create mobile/src/screens/MPINSetupScreen.tsx
    - Display 4-digit PIN input with confirmation
    - Validate both entries match
    - Call authService.setupMPIN() on submission
    - Navigate to initialization flow on success
    - _Requirements: 2_

  - [ ] 36.2 Create MPIN verification screen
    - Create mobile/src/screens/MPINVerifyScreen.tsx
    - Display 4-digit PIN input
    - Call authService.verifyMPIN() on submission
    - Track failed attempts (max 3)
    - Navigate to full login after 3 failed attempts
    - Navigate to dashboard on success
    - _Requirements: 2_

- [ ] 37. Implement first-login initialization flow
  - [ ] 37.1 Create initialization service
    - Create mobile/src/services/initService.ts
    - Implement fetchInitData() function calling GET /api/v1/mobile/init
    - Implement seedDatabase() function to populate SQLite with worker, beneficiaries, and templates
    - _Requirements: 3_

  - [ ] 37.2 Create initialization screen
    - Create mobile/src/screens/InitializationScreen.tsx
    - Display loading spinner and progress message
    - Call initService.fetchInitData() and seedDatabase()
    - Handle network errors with retry option
    - Navigate to dashboard on success
    - _Requirements: 3_

- [ ] 38. Checkpoint - Test mobile authentication flow
  - Test login with valid and invalid credentials
  - Test MPIN setup with matching and non-matching entries
  - Test MPIN verification with correct and incorrect PINs
  - Test initialization flow downloads and seeds data
  - Verify JWT token is stored in secure storage
  - Ensure all tests pass, ask the user if questions arise

### Day 6: Mobile Core Flows

- [ ] 39. Set up navigation structure
  - Create mobile/src/navigation/AppNavigator.tsx
  - Implement stack navigator for auth screens (Login, MPIN Setup, MPIN Verify, Initialization)
  - Implement bottom tab navigator for main screens (Dashboard, New Visit, Past Visits, Profile)
  - Implement stack navigator for visit flow (Visit Type, MCTS Verify, Day Select, Data Collection, Summary)
  - Use @react-navigation/native and @react-navigation/bottom-tabs
  - _Requirements: 4, 5, 6_


- [ ] 40. Create dashboard screen
  - Create mobile/src/screens/DashboardScreen.tsx
  - Display welcome message with worker name
  - Query SQLite for pending sync count and display badge
  - Display "Today's Schedule" section with assigned beneficiaries
  - Query SQLite for today's completed visits to show status (Pending/Completed)
  - Display "Start New Visit" button navigating to visit type selection
  - Display "Sync All Pending" button if unsynced visits exist
  - _Requirements: 14, 18_

- [ ] 41. Implement visit flow screens
  - [ ] 41.1 Create visit type selection screen
    - Create mobile/src/screens/VisitTypeScreen.tsx
    - Display buttons for visit types: HBNC, ANC (disabled), PNC (disabled)
    - Note: Only HBNC is supported in v1
    - Navigate to MCTS verification on HBNC selection
    - _Requirements: 4_

  - [ ] 41.2 Create MCTS verification screen
    - Create mobile/src/screens/MCTSVerifyScreen.tsx
    - Display MCTS ID input field
    - Call databaseService.getBeneficiaryByMCTS() on submission
    - Display beneficiary name and details for confirmation
    - Display error if beneficiary not found or not assigned to current worker
    - Navigate to day selection on confirmation
    - _Requirements: 4_

  - [ ] 41.3 Create day selection screen
    - Create mobile/src/screens/DaySelectScreen.tsx
    - Display day options: 1, 3, 7, 14, 28 for HBNC
    - Query SQLite for previously completed days and highlight in green
    - Display warning modal if revisiting a completed day
    - Load template from SQLite on day selection
    - Navigate to data collection screen with first question
    - _Requirements: 5_

- [ ] 42. Implement data collection screen
  - [ ] 42.1 Create data collection screen structure
    - Create mobile/src/screens/DataCollectionScreen.tsx
    - Display progress indicator (e.g., "Question 3 of 15")
    - Display question text in selected language (English or Hindi)
    - Display play button for text-to-speech
    - Display answer input based on question type (yes/no, number, voice)
    - Display action/suggestion card if applicable
    - Display previous answer history card if available
    - Implement swipe gestures for navigation (left/right)
    - Implement hamburger menu for question list navigation
    - _Requirements: 6, 7, 8, 9, 10, 11_

  - [ ] 42.2 Implement text-to-speech functionality
    - Use expo-speech to read question text aloud
    - Support both English and Hindi languages
    - Display play/pause button
    - _Requirements: 6_

  - [ ] 42.3 Implement yes/no answer input
    - Display Yes and No toggle buttons for yes_no questions
    - Save answer to SQLite immediately on selection
    - Allow changing answer
    - Prevent navigation if required question is unanswered
    - _Requirements: 7_

  - [ ] 42.4 Implement numeric answer input
    - Display numeric keyboard input for number questions
    - Validate input is a valid number
    - Save answer to SQLite immediately on entry
    - Display error for invalid input
    - Prevent navigation if required question is unanswered
    - _Requirements: 8_

  - [ ] 42.5 Implement voice recording
    - Display "Hold to Record" button for voice questions
    - Use expo-av to record audio on press and hold
    - Stop recording on release
    - Save audio file to local storage: {documentDirectory}/audio/visit_{visitId}/q_{questionId}.m4a
    - Display playback control to review recording
    - Implement re-record functionality
    - Auto-stop recording after 60 seconds
    - Handle microphone permission denial with error message and settings link
    - Save audio file path to SQLite immediately
    - _Requirements: 9_

  - [ ]* 42.6 Write property test for answer persistence
    - **Property P4: Template Question Completeness**
    - **Validates: Requirements 6, 7, 8, 9, 27**
    - Test that all required questions have corresponding answers in visit_data
    - Test that answers are persisted immediately to SQLite

- [ ] 43. Create visit summary screen
  - Create mobile/src/screens/SummaryScreen.tsx
  - Display all questions and their recorded answers
  - Allow tapping any answer to navigate back to that question for editing
  - Display "Save to Device" button
  - Call databaseService.createVisit() with is_synced = false on save
  - Display banner reminding worker to sync when internet is available
  - Navigate back to dashboard on successful save
  - _Requirements: 12_

- [ ] 44. Implement past visits screen
  - Create mobile/src/screens/PastVisitsScreen.tsx
  - Query SQLite for all visits ordered by date descending
  - Display list with beneficiary name, visit type, day number, date, and sync status badge
  - Implement filter chips: Last Week, Last Month
  - Implement MCTS ID filter input
  - Display "Sync All Pending" button if unsynced visits exist
  - Navigate to visit detail on row tap
  - _Requirements: 15_


- [ ] 45. Create profile screen
  - Create mobile/src/screens/ProfileScreen.tsx
  - Display worker profile: name, worker_id, email, phone, address, profile photo
  - Display language toggle for English/Hindi selection
  - Persist language preference to AsyncStorage
  - Display earnings section (fetch from API when online, show cached data when offline)
  - Display "Last updated" timestamp for cached data
  - Display logout button
  - _Requirements: 16, 17_

- [ ] 46. Set up internationalization (i18n)
  - Create mobile/src/locales/en.json with English translations
  - Create mobile/src/locales/hi.json with Hindi translations
  - Configure react-i18next with language detection and fallback
  - Translate all UI text (buttons, labels, error messages)
  - Use i18n.t() for all user-facing strings
  - _Requirements: 16_

- [ ] 47. Checkpoint - Test mobile core flows
  - Test complete visit recording flow from start to summary
  - Test all question types (yes/no, number, voice)
  - Test text-to-speech functionality
  - Test audio recording and playback
  - Test visit saving to SQLite
  - Test past visits display and filtering
  - Test language switching
  - Ensure all tests pass, ask the user if questions arise

### Day 7: Integration, Sync, and Deployment

- [ ] 48. Implement mobile sync service
  - [ ] 48.1 Create sync service
    - Create mobile/src/services/syncService.ts
    - Implement SyncService class with methods: syncAllPending(), syncVisit(), getPendingSyncCount(), getLastSyncTime()
    - Query SQLite for visits where is_synced = false
    - Build multipart FormData with visits JSON and audio files
    - Upload to POST /api/v1/sync/visits endpoint
    - Update SQLite records to is_synced = true on success
    - Handle partial sync failures
    - Return SyncResult with success count, failed count, and errors
    - _Requirements: 13, 30_

  - [ ] 48.2 Integrate sync into dashboard and past visits
    - Add "Sync All Pending" button handler in DashboardScreen
    - Add "Sync All Pending" button handler in PastVisitsScreen
    - Display loading spinner during sync
    - Display success/error toast messages
    - Update pending sync count badge after sync
    - _Requirements: 13, 14_

  - [ ]* 48.3 Write property test for sync consistency
    - **Property P1: Visit Data Integrity**
    - **Validates: Requirements 13, 33**
    - Test that all synced visits have corresponding sync_log entries
    - Test that is_synced flag is updated correctly

  - [ ]* 48.4 Write property test for audio file consistency
    - **Property P2: Audio File Consistency**
    - **Validates: Requirements 9, 13**
    - Test that all audio_s3_key references in visit_data correspond to uploaded S3 files
    - Test that local audio files exist before sync

- [ ] 49. Implement network connectivity detection
  - Create mobile/src/utils/networkUtils.ts
  - Use NetInfo from @react-native-community/netinfo to detect connectivity
  - Display online/offline indicator in app header
  - Enable/disable sync functionality based on connectivity
  - _Requirements: 31_

- [ ] 50. Create Zustand store for global state
  - Create mobile/src/store/appStore.ts
  - Define state: currentUser, pendingSyncCount, isOnline, selectedLanguage
  - Define actions: setCurrentUser(), setPendingSyncCount(), setIsOnline(), setSelectedLanguage()
  - Use store in screens for shared state
  - _Requirements: 1, 14, 16, 31_

- [ ] 51. End-to-end testing
  - [ ] 51.1 Test complete mobile workflow
    - Test login → MPIN setup → initialization → dashboard
    - Test new visit → MCTS verify → day select → data collection → summary → save
    - Test sync → verify data in backend PostgreSQL
    - Test past visits display with synced status
    - _Requirements: All mobile requirements_

  - [ ] 51.2 Test complete web workflow
    - Test login → dashboard → view workers/beneficiaries/visits
    - Test add worker and add beneficiary
    - Test generate report → download Excel
    - Test sync logs display
    - _Requirements: All web requirements_

  - [ ] 51.3 Test AWS integrations
    - Verify audio files uploaded to S3
    - Verify transcription jobs created in AWS Transcribe
    - Verify Claude report generation via Bedrock
    - Verify presigned URLs work for downloads
    - _Requirements: 13, 25, 26_

- [x] 52. Set up Docker configuration
  - [x] 52.1 Create Docker files
    - Create backend/Dockerfile for FastAPI application
    - Create backend/.dockerignore to exclude unnecessary files
    - Create web/Dockerfile for React dashboard (multi-stage build)
    - Create web/.dockerignore to exclude node_modules and build artifacts
    - _Requirements: 29_

  - [x] 52.2 Create docker-compose configuration
    - Create docker-compose.yml with services: postgres, backend, nginx
    - Configure PostgreSQL 15 with health checks and persistent volume
    - Configure backend with environment variables and volume mounts
    - Configure nginx reverse proxy with proper routing
    - Create .env.example template for environment variables
    - _Requirements: 28, 29_

  - [x] 52.3 Configure nginx reverse proxy
    - Create nginx/nginx.conf with reverse proxy rules
    - Route /api/* to FastAPI backend with 5-minute timeout for sync/reports
    - Serve web dashboard static files with SPA routing
    - Configure gzip compression and static asset caching
    - Add health check endpoint
    - Include commented HTTPS configuration for production
    - _Requirements: 28_

  - [x] 52.4 Create Docker setup documentation
    - Create DOCKER_SETUP.md with comprehensive setup guide
    - Document quick start, service descriptions, and common commands
    - Include development workflow and production deployment steps
    - Add troubleshooting section and security best practices
    - Document backup/restore procedures
    - _Requirements: NFR6_

  - [ ] 52.5 Test Docker setup locally
    - Copy .env.example to .env and configure with test values
    - Run `docker-compose build` to build all images
    - Run `docker-compose up -d` to start all services
    - Verify PostgreSQL is accessible and healthy
    - Verify backend API is accessible at http://localhost/api/v1
    - Verify migrations run successfully on backend startup
    - Test API endpoints with curl or Postman
    - _Requirements: 29_

  - [ ] 52.6 Deploy to EC2
    - Launch EC2 t3.small instance with Ubuntu 22.04
    - Configure security groups (ports 80, 443, 22)
    - Install Docker and docker-compose on EC2
    - Clone repository to EC2 instance
    - Copy .env file with production configuration
    - Run docker-compose up -d to start services
    - Verify backend API is accessible via public IP
    - Verify web dashboard is accessible via public IP
    - Configure domain name (optional)
    - _Requirements: 29_


- [ ] 53. Build and deploy web application
  - [ ] 53.1 Build web application
    - Navigate to web/ directory
    - Run `npm install` to install dependencies
    - Run `npm run build` to create production build
    - Verify build output in web/dist/ directory
    - _Requirements: 35_

  - [ ] 53.2 Deploy with Docker
    - Ensure web/dist/ is built before running docker-compose
    - Nginx container will serve static files from web/dist/
    - Verify web dashboard is accessible at http://localhost
    - Test SPA routing (refresh on any route should work)
    - Verify API calls from web dashboard work correctly
    - _Requirements: 35_

- [ ] 54. Configure AWS services
  - [ ] 54.1 Set up S3 buckets
    - Create voice-of-care-audio bucket with private access
    - Create voice-of-care-exports bucket with private access
    - Configure lifecycle policy to archive audio files to Glacier after 90 days
    - Enable versioning on both buckets
    - _Requirements: 28_

  - [ ] 54.2 Configure IAM permissions
    - Create IAM role for EC2 instance
    - Attach policies for S3 (read/write), Transcribe (start jobs, get results), Bedrock (invoke model)
    - Attach instance profile to EC2 instance
    - _Requirements: 28_

  - [ ] 54.3 Test AWS service access
    - Test S3 upload from backend
    - Test Transcribe job creation
    - Test Bedrock Claude invocation
    - Verify IAM permissions are correct
    - _Requirements: 13, 25, 26_

- [ ] 55. Create seed data for demo
  - [ ] 55.1 Create seed script for workers and beneficiaries
    - Create backend/scripts/seed_demo_data.py
    - Create 5 sample ASHA workers with credentials
    - Create 20 sample beneficiaries assigned to workers
    - Create 1 medical officer account
    - Run seed script on deployed database
    - _Requirements: 20, 21_

  - [ ] 55.2 Seed HBNC template
    - Run backend/scripts/seed_hbnc_template.py on deployed database
    - Verify template is accessible via API
    - _Requirements: 34_

- [ ] 56. Prepare demo walkthrough
  - [ ] 56.1 Create demo script
    - Document step-by-step demo flow
    - Mobile: Login → MPIN setup → Initialize → Record visit → Sync
    - Web: Login → View dashboard → View visits → Generate report
    - Prepare sample MCTS IDs and credentials
    - _Requirements: All_

  - [ ] 56.2 Test demo flow
    - Run through complete demo script
    - Verify all features work end-to-end
    - Take screenshots for documentation
    - _Requirements: All_

- [ ] 57. Bug fixes and polish
  - [ ] 57.1 Fix critical bugs (P0/P1)
    - Review and fix any blocking issues
    - Test error handling scenarios
    - Verify data validation works correctly
    - _Requirements: 27, 30_

  - [ ] 57.2 UI/UX polish
    - Verify UX4G styling is consistent on web
    - Verify mobile UI is responsive on different screen sizes
    - Add loading states and error messages
    - Improve form validation feedback
    - _Requirements: 35, NFR1_

  - [ ] 57.3 Performance optimization
    - Add database indexes if missing
    - Optimize API queries with pagination
    - Test sync performance with multiple visits
    - Verify mobile app performance on low-end devices
    - _Requirements: 29, NFR3_

- [ ] 58. Create basic documentation
  - Create README.md with setup instructions
  - Document API endpoints (or generate Swagger docs)
  - Create user guide for ASHA workers (basic)
  - Create user guide for medical officers (basic)
  - Document environment variables and configuration
  - _Requirements: NFR6_

- [ ] 59. Final checkpoint - Complete system verification
  - Verify all acceptance criteria from requirements document
  - Test complete workflows on deployed system
  - Verify AWS costs are within budget
  - Verify all critical features work correctly
  - Prepare for hackathon submission
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability (e.g., _Requirements: 1, 2_)
- Checkpoints ensure incremental validation and provide opportunities to address issues early
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The 7-day timeline is aggressive; prioritize core functionality over polish if time is limited
- AWS Bedrock and Transcribe may have quota limits; request increases early if needed
- Mobile app testing should be done on physical Android devices or emulators with API level 26+
- Web dashboard should be tested on Chrome, Firefox, and Safari for compatibility

## Implementation Order Rationale

The task order follows a logical progression:

1. **Days 1-2**: Backend foundation with authentication, CRUD, and AWS integration provides the API layer needed by both web and mobile
2. **Day 3**: Backend reports and web shell enables parallel development of web and mobile
3. **Day 4**: Web dashboard and data management provides admin functionality for managing workers and beneficiaries
4. **Day 5**: Web completion and mobile auth enables testing of complete web app while starting mobile development
5. **Day 6**: Mobile core flows implements the primary ASHA worker functionality
6. **Day 7**: Integration, sync, and deployment brings all components together and prepares for demo

This approach minimizes dependencies and allows for early testing of each component.

## Success Criteria

The implementation is considered complete when:

- ✅ All non-optional tasks are completed
- ✅ ASHA workers can record HBNC visits offline and sync to backend
- ✅ Medical officers can view data and generate AI-powered reports
- ✅ System is deployed on AWS EC2 and accessible via public URL
- ✅ Demo walkthrough can be completed successfully
- ✅ All critical bugs (P0/P1) are resolved
- ✅ Basic documentation is available

