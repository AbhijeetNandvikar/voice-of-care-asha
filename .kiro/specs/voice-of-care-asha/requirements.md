# Requirements Document: Voice of Care (ASHA)

## Introduction

Voice of Care (ASHA) is a healthcare technology solution designed to address the critical challenge of manual paperwork burden on ASHA (Accredited Social Health Activist) workers in rural India. The system replaces traditional paper-based health visit registers with an offline-first mobile application that captures voice and structured data during field visits, synchronizes with a cloud backend, and uses AI to generate government-compliant reports.

The solution aims to reduce payment delays for ASHA workers from 2-3 months to near real-time by streamlining data collection, synchronization, and report generation processes. This v1 implementation focuses exclusively on HBNC (Home-Based Newborn Care) visits, supporting English and Hindi languages on Android devices.

## Problem Statement

ASHA workers in rural India conduct critical health visits for newborns, pregnant women, and postnatal mothers. Currently, they must manually record visit details in paper registers, which are then manually transcribed by medical officers for government reporting. This process:

- Creates a 2-3 month delay in payment processing for ASHA workers
- Introduces transcription errors and data loss
- Requires significant administrative overhead
- Lacks real-time visibility into field activities
- Makes data analysis and reporting extremely difficult

## Solution Overview

The Voice of Care system provides:

1. **Mobile Application**: Offline-first React Native app for ASHA workers to record visits using voice and structured inputs
2. **Backend API**: FastAPI-based cloud service for data synchronization, storage, and AI processing
3. **Web Dashboard**: React.js admin interface for medical officers to monitor activities and generate reports
4. **AI Integration**: AWS Transcribe for speech-to-text and AWS Bedrock (Claude) for intelligent report generation

## Glossary

- **ASHA_Worker**: Accredited Social Health Activist, a community health worker in rural India
- **Medical_Officer**: Healthcare administrator responsible for monitoring ASHA activities and generating reports
- **Beneficiary**: Individual receiving healthcare services (newborn, mother, or child)
- **HBNC**: Home-Based Newborn Care program with visits on days 1, 3, 7, 14, and 28 after birth
- **MCTS_ID**: Mother Child Tracking System identifier, unique ID for beneficiaries
- **Visit**: A recorded healthcare interaction between ASHA worker and beneficiary
- **Sync**: Process of uploading offline visit data from mobile device to cloud backend
- **Template**: Structured questionnaire defining questions for a specific visit type
- **Mobile_App**: Expo React Native application running on ASHA worker's Android device
- **Backend_API**: FastAPI server hosted on AWS EC2
- **Web_Dashboard**: React.js admin interface for medical officers
- **SQLite_DB**: Local database on mobile device for offline data storage
- **PostgreSQL_DB**: Cloud database for persistent storage of synced data
- **S3_Bucket**: AWS storage for audio files and generated reports
- **JWT_Token**: JSON Web Token for authentication
- **MPIN**: 4-digit Mobile Personal Identification Number for quick authentication


## Requirements

### Requirement 1: ASHA Worker Authentication

**User Story:** As an ASHA worker, I want to securely authenticate using my worker ID and password, so that I can access the mobile application and my assigned beneficiaries.

#### Acceptance Criteria

1. WHEN an ASHA worker enters a valid 8-digit worker_id and password THEN THE Mobile_App SHALL authenticate the worker and return a JWT_Token
2. WHEN an ASHA worker enters invalid credentials THEN THE Mobile_App SHALL display an error message and prevent access
3. WHEN a first-time ASHA worker successfully logs in THEN THE Mobile_App SHALL prompt for MPIN setup
4. WHEN an ASHA worker with existing MPIN logs in THEN THE Mobile_App SHALL prompt for MPIN verification instead of password
5. WHEN authentication succeeds THEN THE Mobile_App SHALL store the JWT_Token securely in device encrypted storage
6. WHEN the JWT_Token expires THEN THE Mobile_App SHALL prompt the worker to re-authenticate

### Requirement 2: MPIN Management

**User Story:** As an ASHA worker, I want to set up a 4-digit MPIN after first login, so that I can quickly access the app without entering my full password on subsequent uses.

#### Acceptance Criteria

1. WHEN an ASHA worker completes first login THEN THE Mobile_App SHALL prompt for 4-digit MPIN setup
2. WHEN setting up MPIN THEN THE Mobile_App SHALL require confirmation by entering the MPIN twice
3. WHEN the two MPIN entries do not match THEN THE Mobile_App SHALL display an error and request re-entry
4. WHEN MPIN setup completes successfully THEN THE Backend_API SHALL store the bcrypt-hashed MPIN
5. WHEN an ASHA worker with existing MPIN opens the app THEN THE Mobile_App SHALL prompt for MPIN entry instead of full login
6. WHEN MPIN verification succeeds THEN THE Backend_API SHALL return a valid JWT_Token
7. WHEN MPIN verification fails after 3 attempts THEN THE Mobile_App SHALL require full password login

### Requirement 3: Offline Data Initialization

**User Story:** As an ASHA worker, I want my assigned beneficiaries and visit templates downloaded to my device after first login, so that I can work offline in areas with poor connectivity.

#### Acceptance Criteria

1. WHEN an ASHA worker completes first login and MPIN setup THEN THE Mobile_App SHALL request initialization data from Backend_API
2. WHEN initialization data is received THEN THE Mobile_App SHALL seed the SQLite_DB with worker profile, assigned beneficiaries, and visit templates
3. WHEN seeding SQLite_DB THEN THE Mobile_App SHALL maintain referential integrity between workers, beneficiaries, and templates
4. WHEN initialization fails due to network error THEN THE Mobile_App SHALL display an error and provide a retry option
5. WHEN initialization completes successfully THEN THE Mobile_App SHALL navigate to the dashboard screen


### Requirement 4: Beneficiary Verification

**User Story:** As an ASHA worker, I want to verify a beneficiary's MCTS ID before starting a visit, so that I ensure I'm recording data for the correct person.

#### Acceptance Criteria

1. WHEN an ASHA worker enters an MCTS_ID THEN THE Mobile_App SHALL query the SQLite_DB for a matching beneficiary
2. WHEN a matching beneficiary is found THEN THE Mobile_App SHALL display the beneficiary's name and details for confirmation
3. WHEN no matching beneficiary is found THEN THE Mobile_App SHALL display an error message suggesting sync or contacting admin
4. WHEN the ASHA worker confirms the beneficiary THEN THE Mobile_App SHALL proceed to visit day selection
5. WHEN the beneficiary is not assigned to the current ASHA worker THEN THE Mobile_App SHALL prevent visit creation and display an authorization error

### Requirement 5: HBNC Visit Day Selection

**User Story:** As an ASHA worker, I want to select which HBNC day (1, 3, 7, 14, or 28) I am conducting, so that the system loads the appropriate questions for that visit.

#### Acceptance Criteria

1. WHEN an ASHA worker verifies a beneficiary for HBNC visit THEN THE Mobile_App SHALL display day options: 1, 3, 7, 14, and 28
2. WHEN displaying day options THEN THE Mobile_App SHALL highlight previously completed days in green based on SQLite_DB records
3. WHEN an ASHA worker selects a previously completed day THEN THE Mobile_App SHALL display a warning about revisiting
4. WHEN an ASHA worker confirms day selection THEN THE Mobile_App SHALL load the corresponding visit template from SQLite_DB
5. WHEN the template is loaded THEN THE Mobile_App SHALL navigate to the data collection screen with the first question

### Requirement 6: Question Display and Navigation

**User Story:** As an ASHA worker, I want to see questions one at a time with clear navigation, so that I can focus on each question without being overwhelmed.

#### Acceptance Criteria

1. WHEN the data collection screen loads THEN THE Mobile_App SHALL display the first question from the template
2. WHEN displaying a question THEN THE Mobile_App SHALL show a progress indicator (e.g., "Question 3 of 15")
3. WHEN displaying a question THEN THE Mobile_App SHALL show the question text in the selected language (English or Hindi)
4. WHEN displaying a question THEN THE Mobile_App SHALL provide a play button to read the question aloud using text-to-speech
5. WHEN an ASHA worker navigates to the next question THEN THE Mobile_App SHALL save the current answer to SQLite_DB immediately
6. WHEN an ASHA worker swipes left or right THEN THE Mobile_App SHALL navigate to the previous or next question
7. WHEN an ASHA worker taps a hamburger menu icon THEN THE Mobile_App SHALL display a slide-up list of all questions for direct navigation


### Requirement 7: Answer Recording - Yes/No Questions

**User Story:** As an ASHA worker, I want to answer yes/no questions with simple toggle buttons, so that I can quickly record binary responses.

#### Acceptance Criteria

1. WHEN a question has input_type "yes_no" THEN THE Mobile_App SHALL display Yes and No toggle buttons
2. WHEN an ASHA worker taps Yes or No THEN THE Mobile_App SHALL record the answer with the current timestamp
3. WHEN an answer is recorded THEN THE Mobile_App SHALL persist it to SQLite_DB immediately
4. WHEN an ASHA worker changes their answer THEN THE Mobile_App SHALL update the SQLite_DB record with the new value
5. WHEN a yes/no question is marked as required and unanswered THEN THE Mobile_App SHALL prevent navigation to the next question

### Requirement 8: Answer Recording - Numeric Questions

**User Story:** As an ASHA worker, I want to enter numeric values for measurement questions, so that I can record quantitative data like weight or temperature.

#### Acceptance Criteria

1. WHEN a question has input_type "number" THEN THE Mobile_App SHALL display a numeric keyboard input field
2. WHEN an ASHA worker enters a numeric value THEN THE Mobile_App SHALL validate it as a valid number
3. WHEN an invalid value is entered THEN THE Mobile_App SHALL display an error message and prevent saving
4. WHEN a valid numeric answer is entered THEN THE Mobile_App SHALL persist it to SQLite_DB with timestamp
5. WHEN a numeric question is marked as required and unanswered THEN THE Mobile_App SHALL prevent navigation to the next question

### Requirement 9: Answer Recording - Voice Responses

**User Story:** As an ASHA worker, I want to record voice answers for open-ended questions, so that I can capture detailed information without typing.

#### Acceptance Criteria

1. WHEN a question has input_type "voice" THEN THE Mobile_App SHALL display a "Hold to Record" button
2. WHEN an ASHA worker presses and holds the record button THEN THE Mobile_App SHALL start audio recording using the device microphone
3. WHEN an ASHA worker releases the record button THEN THE Mobile_App SHALL stop recording and save the audio file to local storage
4. WHEN an audio file is saved THEN THE Mobile_App SHALL store it at path: {documentDirectory}/audio/visit_{visitId}/q_{questionId}.m4a
5. WHEN recording completes THEN THE Mobile_App SHALL display a playback control to review the recording
6. WHEN an ASHA worker taps re-record THEN THE Mobile_App SHALL delete the previous recording and allow a new recording
7. WHEN a voice recording exceeds 60 seconds THEN THE Mobile_App SHALL automatically stop recording
8. WHEN microphone permission is denied THEN THE Mobile_App SHALL display an error and provide a link to device settings
9. WHEN a voice answer is recorded THEN THE Mobile_App SHALL persist the audio file path to SQLite_DB with timestamp


### Requirement 10: Action and Suggestion Display

**User Story:** As an ASHA worker, I want to see relevant actions or suggestions after answering certain questions, so that I know what steps to take based on the response.

#### Acceptance Criteria

1. WHEN a question has an action_en or action_hi field THEN THE Mobile_App SHALL display the action text below the answer section
2. WHEN displaying action text THEN THE Mobile_App SHALL show it in the selected language (English or Hindi)
3. WHEN the action indicates urgent referral THEN THE Mobile_App SHALL highlight it with a warning color
4. WHEN an ASHA worker acknowledges the action THEN THE Mobile_App SHALL allow navigation to the next question

### Requirement 11: Visit History Display

**User Story:** As an ASHA worker, I want to see the previous answer for each question from past visits, so that I can track changes and provide better care.

#### Acceptance Criteria

1. WHEN displaying a question THEN THE Mobile_App SHALL query SQLite_DB for previous answers to the same question for the current beneficiary
2. WHEN a previous answer exists THEN THE Mobile_App SHALL display it in a history card above the current question
3. WHEN no previous answer exists THEN THE Mobile_App SHALL not display a history card
4. WHEN displaying history THEN THE Mobile_App SHALL show the answer value and the date it was recorded

### Requirement 12: Visit Summary and Completion

**User Story:** As an ASHA worker, I want to review all my answers before completing a visit, so that I can verify accuracy and make corrections if needed.

#### Acceptance Criteria

1. WHEN an ASHA worker answers the last question THEN THE Mobile_App SHALL navigate to the summary screen
2. WHEN the summary screen loads THEN THE Mobile_App SHALL display all questions and their recorded answers
3. WHEN an ASHA worker taps any answer in the summary THEN THE Mobile_App SHALL navigate back to that question for editing
4. WHEN an ASHA worker taps "Save to Device" THEN THE Mobile_App SHALL create a visit record in SQLite_DB with is_synced = false
5. WHEN a visit is saved THEN THE Mobile_App SHALL display a banner reminding the worker to sync when internet is available
6. WHEN a visit is saved successfully THEN THE Mobile_App SHALL navigate back to the dashboard


### Requirement 13: Data Synchronization

**User Story:** As an ASHA worker, I want to sync my offline visit data to the cloud when I have internet connectivity, so that medical officers can access the data and I can receive timely payment.

#### Acceptance Criteria

1. WHEN an ASHA worker taps "Sync All Pending" THEN THE Mobile_App SHALL query SQLite_DB for all visits where is_synced = false
2. WHEN pending visits are found THEN THE Mobile_App SHALL build a multipart form with visit JSON data and associated audio files
3. WHEN the sync request is sent THEN THE Backend_API SHALL receive the multipart data and process each visit
4. WHEN the Backend_API processes visits THEN THE Backend_API SHALL upload audio files to S3_Bucket with keys: audio/{worker_id}/{visit_id}/{question_id}.m4a
5. WHEN audio files are uploaded THEN THE Backend_API SHALL start AWS Transcribe jobs for each audio file
6. WHEN visits are saved to PostgreSQL_DB THEN THE Backend_API SHALL set is_synced = true and create sync_log records
7. WHEN sync completes successfully THEN THE Backend_API SHALL return synced visit IDs to the Mobile_App
8. WHEN the Mobile_App receives success response THEN THE Mobile_App SHALL update SQLite_DB records to set is_synced = true
9. WHEN sync fails due to network error THEN THE Mobile_App SHALL display an error message and keep visits marked as unsynced
10. WHEN partial sync occurs (some visits succeed, some fail) THEN THE Mobile_App SHALL update only successful visits and report failures

### Requirement 14: Pending Sync Visibility

**User Story:** As an ASHA worker, I want to see how many visits are pending sync, so that I know when I need to find internet connectivity.

#### Acceptance Criteria

1. WHEN the dashboard loads THEN THE Mobile_App SHALL query SQLite_DB for count of visits where is_synced = false
2. WHEN pending visits exist THEN THE Mobile_App SHALL display a prominent badge or notification with the count
3. WHEN the ASHA worker taps the pending sync notification THEN THE Mobile_App SHALL navigate to the Past Visits screen
4. WHEN the Past Visits screen loads THEN THE Mobile_App SHALL display a "Sync All Pending" button if unsynced visits exist

### Requirement 15: Past Visits Viewing and Filtering

**User Story:** As an ASHA worker, I want to view my past visits with filtering options, so that I can review my work and track beneficiary progress.

#### Acceptance Criteria

1. WHEN an ASHA worker navigates to Past Visits screen THEN THE Mobile_App SHALL query SQLite_DB for all visits ordered by date descending
2. WHEN displaying visits THEN THE Mobile_App SHALL show beneficiary name, visit type, day number, date, and sync status badge
3. WHEN an ASHA worker taps a filter chip (Last Week, Last Month) THEN THE Mobile_App SHALL filter visits by the selected date range
4. WHEN an ASHA worker enters an MCTS_ID in the filter THEN THE Mobile_App SHALL filter visits for that specific beneficiary
5. WHEN an ASHA worker taps a visit row THEN THE Mobile_App SHALL display detailed visit information including all answers


### Requirement 16: Language Selection

**User Story:** As an ASHA worker, I want to switch between English and Hindi languages, so that I can use the app in my preferred language.

#### Acceptance Criteria

1. WHEN an ASHA worker navigates to the Profile screen THEN THE Mobile_App SHALL display a language toggle with English and Hindi options
2. WHEN an ASHA worker selects a language THEN THE Mobile_App SHALL update all UI text to the selected language
3. WHEN language is changed THEN THE Mobile_App SHALL persist the preference to device storage
4. WHEN displaying questions THEN THE Mobile_App SHALL show question_en or question_hi based on selected language
5. WHEN displaying actions THEN THE Mobile_App SHALL show action_en or action_hi based on selected language
6. WHEN the app restarts THEN THE Mobile_App SHALL load the previously selected language preference

### Requirement 17: Worker Profile Display

**User Story:** As an ASHA worker, I want to view my profile information and earnings, so that I can verify my details and track my compensation.

#### Acceptance Criteria

1. WHEN an ASHA worker navigates to the Profile screen THEN THE Mobile_App SHALL display worker name, worker_id, email, phone, address, and profile photo
2. WHEN the device is online THEN THE Mobile_App SHALL fetch current earnings data from Backend_API
3. WHEN earnings data is received THEN THE Mobile_App SHALL display "Earnings This Month" and "Total Earnings"
4. WHEN the device is offline THEN THE Mobile_App SHALL display cached earnings data with a "Last updated" timestamp
5. WHEN profile photo is available THEN THE Mobile_App SHALL display it from the profile_photo_url

### Requirement 18: Dashboard Today's Schedule

**User Story:** As an ASHA worker, I want to see my assigned beneficiaries and their visit status on the dashboard, so that I can plan my day effectively.

#### Acceptance Criteria

1. WHEN the dashboard loads THEN THE Mobile_App SHALL query SQLite_DB for all beneficiaries assigned to the current worker
2. WHEN displaying beneficiaries THEN THE Mobile_App SHALL show their name and visit status (Pending or Completed) for today
3. WHEN determining visit status THEN THE Mobile_App SHALL check SQLite_DB for visit records with today's date
4. WHEN a beneficiary has a completed visit today THEN THE Mobile_App SHALL display a green "Completed" chip
5. WHEN a beneficiary has no visit today THEN THE Mobile_App SHALL display an orange "Pending" chip


### Requirement 19: Medical Officer Authentication

**User Story:** As a medical officer, I want to log in to the web dashboard using my credentials, so that I can monitor ASHA activities and generate reports.

#### Acceptance Criteria

1. WHEN a medical officer enters worker_id and password on the login page THEN THE Web_Dashboard SHALL send credentials to Backend_API for authentication
2. WHEN credentials are valid and worker_type is "medical_officer" THEN THE Backend_API SHALL return a JWT_Token
3. WHEN authentication succeeds THEN THE Web_Dashboard SHALL store the JWT_Token in browser localStorage
4. WHEN authentication fails THEN THE Web_Dashboard SHALL display an error message
5. WHEN a non-medical officer attempts to log in THEN THE Backend_API SHALL reject the request with an authorization error

### Requirement 20: Worker Management

**User Story:** As a medical officer, I want to view, add, and manage worker records, so that I can onboard new ASHA workers and maintain accurate records.

#### Acceptance Criteria

1. WHEN a medical officer navigates to the Workers page THEN THE Web_Dashboard SHALL fetch and display a paginated list of workers from Backend_API
2. WHEN displaying workers THEN THE Web_Dashboard SHALL show name, worker_id, worker_type, phone, and collection center
3. WHEN a medical officer clicks "Add Worker" THEN THE Web_Dashboard SHALL display a form with fields: first_name, last_name, phone, email, aadhar_id, address, worker_type, collection_center_id, password
4. WHEN the add worker form is submitted THEN THE Backend_API SHALL generate an 8-digit worker_id and create the worker record
5. WHEN a worker is created successfully THEN THE Backend_API SHALL hash the password using bcrypt before storing
6. WHEN a medical officer clicks a worker row THEN THE Web_Dashboard SHALL display detailed worker information in a modal
7. WHEN a medical officer searches for a worker THEN THE Web_Dashboard SHALL filter the list based on name or worker_id

### Requirement 21: Beneficiary Management

**User Story:** As a medical officer, I want to view, add, and manage beneficiary records, so that ASHA workers have accurate beneficiary data for their visits.

#### Acceptance Criteria

1. WHEN a medical officer navigates to the Beneficiaries page THEN THE Web_Dashboard SHALL fetch and display a paginated list of beneficiaries from Backend_API
2. WHEN displaying beneficiaries THEN THE Web_Dashboard SHALL show name, MCTS_ID, beneficiary_type, assigned ASHA worker, and age
3. WHEN a medical officer clicks "Add Beneficiary" THEN THE Web_Dashboard SHALL display a form with fields: first_name, last_name, mcts_id, phone, aadhar_id, address, age, weight, beneficiary_type, assigned_asha_id
4. WHEN the add beneficiary form is submitted THEN THE Backend_API SHALL validate MCTS_ID uniqueness and create the record
5. WHEN a medical officer clicks a beneficiary row THEN THE Web_Dashboard SHALL display detailed beneficiary information in a modal
6. WHEN a medical officer filters by beneficiary_type THEN THE Web_Dashboard SHALL display only beneficiaries matching the selected type


### Requirement 22: Visit Monitoring

**User Story:** As a medical officer, I want to view all synced visits with filtering and search capabilities, so that I can monitor ASHA worker activities and beneficiary care.

#### Acceptance Criteria

1. WHEN a medical officer navigates to the Visits page THEN THE Web_Dashboard SHALL fetch and display a paginated list of visits from Backend_API
2. WHEN displaying visits THEN THE Web_Dashboard SHALL show beneficiary name, ASHA worker name, visit type, day number, visit date, and sync status
3. WHEN a medical officer clicks a visit row THEN THE Web_Dashboard SHALL display detailed visit information including all questions and answers
4. WHEN displaying visit details THEN THE Web_Dashboard SHALL render the visit_data JSON in a readable format with question text and answer values
5. WHEN an answer includes an audio recording THEN THE Web_Dashboard SHALL display the transcript if available
6. WHEN a medical officer filters by date range THEN THE Web_Dashboard SHALL display only visits within the selected dates
7. WHEN a medical officer filters by worker THEN THE Web_Dashboard SHALL display only visits conducted by the selected ASHA worker
8. WHEN a medical officer searches by MCTS_ID THEN THE Web_Dashboard SHALL display visits for the matching beneficiary

### Requirement 23: Sync Log Monitoring

**User Story:** As a medical officer, I want to view sync logs with status information, so that I can troubleshoot sync issues and monitor data flow.

#### Acceptance Criteria

1. WHEN a medical officer navigates to the Sync Logs page THEN THE Web_Dashboard SHALL fetch and display sync_log records from Backend_API
2. WHEN displaying sync logs THEN THE Web_Dashboard SHALL show worker name, visit count, date_time, status, and error_message if applicable
3. WHEN displaying status THEN THE Web_Dashboard SHALL use color-coded badges: green for "completed", yellow for "incomplete", red for "failed"
4. WHEN a medical officer filters by status THEN THE Web_Dashboard SHALL display only logs matching the selected status
5. WHEN a medical officer filters by date range THEN THE Web_Dashboard SHALL display only logs within the selected dates

### Requirement 24: Dashboard Statistics

**User Story:** As a medical officer, I want to see key statistics and visualizations on the dashboard, so that I can quickly understand system usage and activity levels.

#### Acceptance Criteria

1. WHEN a medical officer navigates to the Dashboard page THEN THE Web_Dashboard SHALL display four stat cards: Total Workers, Total Beneficiaries, Total Visits, Pending Syncs
2. WHEN displaying statistics THEN THE Backend_API SHALL query PostgreSQL_DB for current counts
3. WHEN the dashboard loads THEN THE Web_Dashboard SHALL display a bar chart showing visit counts by date for the last 30 days
4. WHEN displaying the visits chart THEN THE Web_Dashboard SHALL use Recharts library with date on X-axis and visit count on Y-axis
5. WHEN a medical officer clicks a stat card THEN THE Web_Dashboard SHALL navigate to the corresponding detail page


### Requirement 25: AI-Powered Report Generation

**User Story:** As a medical officer, I want to generate government-compliant Excel reports using AI, so that I can submit accurate reports without manual data entry.

#### Acceptance Criteria

1. WHEN a medical officer navigates to the Data Export page THEN THE Web_Dashboard SHALL display a form with fields: visit_type, start_date, end_date, worker_id (optional)
2. WHEN a medical officer submits the report generation form THEN THE Backend_API SHALL query PostgreSQL_DB for visits matching the criteria
3. WHEN visits are retrieved THEN THE Backend_API SHALL format the data into a structured prompt for AWS Bedrock Claude
4. WHEN invoking Claude THEN THE Backend_API SHALL request a JSON response with report data in government register format
5. WHEN Claude returns the JSON response THEN THE Backend_API SHALL parse it and build an Excel workbook using openpyxl
6. WHEN the Excel file is created THEN THE Backend_API SHALL upload it to S3_Bucket with key: reports/{filename}.xlsx
7. WHEN the report is uploaded THEN THE Backend_API SHALL generate a presigned download URL with 15-minute expiration
8. WHEN the presigned URL is returned THEN THE Web_Dashboard SHALL display a "Download Report" button
9. WHEN a medical officer clicks "Download Report" THEN THE Web_Dashboard SHALL open the presigned URL in a new tab
10. WHEN no visits match the criteria THEN THE Backend_API SHALL return an error message indicating no data found

### Requirement 26: Audio Transcription

**User Story:** As a system, I want to automatically transcribe voice recordings to text, so that medical officers can review answers without listening to audio files.

#### Acceptance Criteria

1. WHEN audio files are uploaded during sync THEN THE Backend_API SHALL start AWS Transcribe jobs for each audio file
2. WHEN starting transcription jobs THEN THE Backend_API SHALL specify the language code (hi-IN or en-IN) based on the worker's language preference
3. WHEN transcription jobs complete THEN AWS Transcribe SHALL send a webhook notification to Backend_API
4. WHEN the webhook is received THEN THE Backend_API SHALL retrieve the transcript text from AWS Transcribe
5. WHEN the transcript is retrieved THEN THE Backend_API SHALL update the visit_data JSONB field with transcript_en or transcript_hi
6. WHEN transcription fails THEN THE Backend_API SHALL log the error but not block the sync process

### Requirement 27: Data Validation and Integrity

**User Story:** As a system, I want to validate all data inputs and maintain referential integrity, so that the database remains consistent and reliable.

#### Acceptance Criteria

1. WHEN creating a worker THEN THE Backend_API SHALL validate that worker_id is exactly 8 digits and unique
2. WHEN creating a beneficiary THEN THE Backend_API SHALL validate that mcts_id is unique and non-empty
3. WHEN creating a visit THEN THE Backend_API SHALL validate that beneficiary_id references an existing beneficiary
4. WHEN creating a visit THEN THE Backend_API SHALL validate that assigned_asha_id references a worker with worker_type "asha_worker"
5. WHEN creating a visit THEN THE Backend_API SHALL validate that template_id references an existing template matching the visit_type
6. WHEN saving visit_data THEN THE Backend_API SHALL validate that all required questions have answers
7. WHEN a validation error occurs THEN THE Backend_API SHALL return a 400 status code with a descriptive error message


### Requirement 28: Security and Authentication

**User Story:** As a system administrator, I want all API endpoints secured with JWT authentication and proper authorization, so that only authorized users can access sensitive data.

#### Acceptance Criteria

1. WHEN a request is made to a protected endpoint THEN THE Backend_API SHALL verify the JWT_Token in the Authorization header
2. WHEN the JWT_Token is missing or invalid THEN THE Backend_API SHALL return a 401 Unauthorized error
3. WHEN the JWT_Token is expired THEN THE Backend_API SHALL return a 401 Unauthorized error with message "Token expired"
4. WHEN storing passwords THEN THE Backend_API SHALL hash them using bcrypt with cost factor 12
5. WHEN storing MPINs THEN THE Backend_API SHALL hash them using bcrypt with cost factor 10
6. WHEN an ASHA worker requests beneficiary data THEN THE Backend_API SHALL return only beneficiaries assigned to that worker
7. WHEN a medical officer requests data THEN THE Backend_API SHALL return data for all workers in their collection center
8. WHEN uploading files to S3_Bucket THEN THE Backend_API SHALL use private bucket settings with no public access

### Requirement 29: Performance and Scalability

**User Story:** As a system administrator, I want the system to handle concurrent users efficiently, so that performance remains acceptable as usage grows.

#### Acceptance Criteria

1. WHEN multiple sync requests arrive simultaneously THEN THE Backend_API SHALL process them concurrently using async request handling
2. WHEN querying large datasets THEN THE Backend_API SHALL implement pagination with default page size of 20 items
3. WHEN querying visits by date range THEN THE PostgreSQL_DB SHALL use indexes on visit_date_time for fast retrieval
4. WHEN querying beneficiaries by MCTS_ID THEN THE PostgreSQL_DB SHALL use a unique index for O(1) lookup
5. WHEN the Mobile_App queries SQLite_DB THEN THE SQLite_DB SHALL use indexes on mcts_id, is_synced, and beneficiary_id
6. WHEN audio files exceed 5MB THEN THE Backend_API SHALL use S3 multipart upload
7. WHEN generating reports THEN THE Backend_API SHALL implement a timeout of 60 seconds for Claude API calls

### Requirement 30: Error Handling and Recovery

**User Story:** As a user, I want clear error messages and graceful degradation when errors occur, so that I understand what went wrong and how to recover.

#### Acceptance Criteria

1. WHEN a network error occurs during sync THEN THE Mobile_App SHALL display a user-friendly message and keep visits marked as unsynced
2. WHEN microphone permission is denied THEN THE Mobile_App SHALL display a message with instructions to enable it in device settings
3. WHEN AWS Bedrock rate limit is exceeded THEN THE Backend_API SHALL return a 503 error with message "Report generation service temporarily busy"
4. WHEN a database constraint violation occurs THEN THE Backend_API SHALL return a 400 error with a descriptive message
5. WHEN an audio file is corrupted during sync THEN THE Backend_API SHALL skip the file, log the error, and continue processing other files
6. WHEN a transcription job fails THEN THE Backend_API SHALL log the error but not block the sync process
7. WHEN the Mobile_App loses connection mid-sync THEN THE Mobile_App SHALL mark only successfully synced visits as synced


### Requirement 31: Offline-First Architecture

**User Story:** As an ASHA worker, I want the mobile app to work fully offline, so that I can conduct visits in areas with no internet connectivity.

#### Acceptance Criteria

1. WHEN the Mobile_App is offline THEN THE Mobile_App SHALL allow full visit recording functionality using SQLite_DB
2. WHEN the Mobile_App is offline THEN THE Mobile_App SHALL store all visit data and audio files locally
3. WHEN the Mobile_App is offline THEN THE Mobile_App SHALL display beneficiary data from SQLite_DB
4. WHEN the Mobile_App is offline THEN THE Mobile_App SHALL display templates from SQLite_DB
5. WHEN the Mobile_App is offline THEN THE Mobile_App SHALL disable sync functionality and display an offline indicator
6. WHEN the Mobile_App regains connectivity THEN THE Mobile_App SHALL enable sync functionality and display an online indicator
7. WHEN the Mobile_App is offline THEN THE Mobile_App SHALL cache the last fetched earnings data for display in the profile

### Requirement 32: Data Export Formats

**User Story:** As a medical officer, I want to export data in Excel format compatible with government systems, so that I can submit reports to health authorities.

#### Acceptance Criteria

1. WHEN generating an HBNC report THEN THE Backend_API SHALL create an Excel file with columns: S.No, Beneficiary Name, MCTS ID, ASHA Worker, Visit Date, Day, and answer columns for each question
2. WHEN creating the Excel file THEN THE Backend_API SHALL use openpyxl library to ensure compatibility with Microsoft Excel and LibreOffice
3. WHEN formatting the Excel file THEN THE Backend_API SHALL apply header row styling with bold text and background color
4. WHEN the Excel file is generated THEN THE Backend_API SHALL include a summary row with total visit count
5. WHEN the report includes transcripts THEN THE Backend_API SHALL include them in a "Remarks" column

### Requirement 33: Audit Trail and Logging

**User Story:** As a system administrator, I want comprehensive logging of all sync operations and data modifications, so that I can troubleshoot issues and maintain accountability.

#### Acceptance Criteria

1. WHEN a sync operation completes THEN THE Backend_API SHALL create a sync_log record with worker_id, visit_id, status, and timestamp
2. WHEN a sync operation fails THEN THE Backend_API SHALL create a sync_log record with status "failed" and error_message
3. WHEN a worker is created or modified THEN THE Backend_API SHALL update the updated_at timestamp
4. WHEN a beneficiary is created or modified THEN THE Backend_API SHALL update the updated_at timestamp
5. WHEN a visit is created THEN THE Backend_API SHALL record the created_at timestamp
6. WHEN a visit is synced THEN THE Backend_API SHALL record the synced_at timestamp


### Requirement 34: Template Management

**User Story:** As a system administrator, I want to manage visit templates with questions in multiple languages, so that ASHA workers have structured questionnaires for different visit types.

#### Acceptance Criteria

1. WHEN a template is created THEN THE Backend_API SHALL validate that template_type is one of: hbnc, anc, pnc
2. WHEN a template is created THEN THE Backend_API SHALL validate that questions array is non-empty
3. WHEN a template question is defined THEN THE Backend_API SHALL require both question_en and question_hi fields
4. WHEN a template question is defined THEN THE Backend_API SHALL validate that input_type is one of: yes_no, number, voice
5. WHEN a template is retrieved THEN THE Backend_API SHALL return the complete questions array with all language variants
6. WHEN templates are synced to mobile THEN THE Mobile_App SHALL store them in SQLite_DB for offline access

### Requirement 35: UX4G Design System Compliance

**User Story:** As a government stakeholder, I want the web dashboard to follow UX4G design standards, so that it maintains consistency with other government digital services.

#### Acceptance Criteria

1. WHEN the Web_Dashboard loads THEN THE Web_Dashboard SHALL include UX4G CSS and JavaScript from CDN version 2.0.8
2. WHEN displaying forms THEN THE Web_Dashboard SHALL use UX4G form components and validation styles
3. WHEN displaying tables THEN THE Web_Dashboard SHALL use UX4G table styling with proper spacing and borders
4. WHEN displaying buttons THEN THE Web_Dashboard SHALL use UX4G button classes with appropriate colors for primary, secondary, and danger actions
5. WHEN displaying modals THEN THE Web_Dashboard SHALL use UX4G modal components with proper overlay and animation
6. WHEN displaying status badges THEN THE Web_Dashboard SHALL use UX4G badge components with semantic colors

## Non-Functional Requirements

### NFR 1: Usability

**Requirement:** THE Mobile_App SHALL be usable by ASHA workers with basic smartphone literacy and minimal training.

**Acceptance Criteria:**
1. All primary workflows (login, visit recording, sync) SHALL be completable in 5 or fewer screen transitions
2. All buttons and interactive elements SHALL have a minimum touch target size of 44x44 pixels
3. All text SHALL be readable with minimum font size of 14px
4. All critical actions SHALL have confirmation dialogs to prevent accidental data loss
5. All error messages SHALL be in plain language without technical jargon

### NFR 2: Reliability

**Requirement:** THE system SHALL maintain data integrity and prevent data loss under normal operating conditions.

**Acceptance Criteria:**
1. THE Mobile_App SHALL persist answers to SQLite_DB immediately after each question is answered
2. THE Mobile_App SHALL not lose data if the app crashes or device restarts
3. THE Backend_API SHALL use database transactions to ensure atomic operations
4. THE Backend_API SHALL implement retry logic with exponential backoff for AWS service calls
5. THE system SHALL maintain 99% uptime during business hours (9 AM - 6 PM IST)


### NFR 3: Performance

**Requirement:** THE system SHALL provide responsive user experience with acceptable latency for all operations.

**Acceptance Criteria:**
1. THE Mobile_App SHALL load the dashboard screen within 2 seconds of authentication
2. THE Mobile_App SHALL save answers to SQLite_DB within 100 milliseconds
3. THE Mobile_App SHALL navigate between questions within 200 milliseconds
4. THE Backend_API SHALL respond to authentication requests within 500 milliseconds
5. THE Backend_API SHALL respond to sync requests within 30 seconds for up to 50 visits
6. THE Web_Dashboard SHALL load paginated data within 1 second
7. THE Backend_API SHALL generate reports within 60 seconds for up to 1000 visits

### NFR 4: Scalability

**Requirement:** THE system SHALL support the expected user load and data volume for the pilot deployment.

**Acceptance Criteria:**
1. THE system SHALL support up to 100 concurrent ASHA workers
2. THE system SHALL support up to 10 concurrent medical officers on the web dashboard
3. THE PostgreSQL_DB SHALL handle up to 10,000 visits per month
4. THE S3_Bucket SHALL store up to 100,000 audio files (approximately 50GB)
5. THE Backend_API SHALL handle up to 50 concurrent sync requests

### NFR 5: Security

**Requirement:** THE system SHALL protect sensitive health data and comply with data protection best practices.

**Acceptance Criteria:**
1. ALL API communication SHALL use HTTPS/TLS encryption
2. ALL passwords SHALL be hashed using bcrypt with minimum cost factor of 10
3. ALL JWT tokens SHALL expire within 24 hours
4. ALL S3 buckets SHALL be private with no public access
5. ALL audio files SHALL be encrypted at rest using AES-256
6. THE Backend_API SHALL implement rate limiting of 100 requests per minute per IP
7. THE Mobile_App SHALL store JWT tokens in encrypted device storage (expo-secure-store)

### NFR 6: Maintainability

**Requirement:** THE system SHALL be maintainable by developers with standard web and mobile development skills.

**Acceptance Criteria:**
1. ALL code SHALL follow consistent style guidelines (ESLint for TypeScript, Black for Python)
2. ALL API endpoints SHALL be documented with OpenAPI/Swagger
3. ALL database schema changes SHALL use Alembic migrations
4. ALL components SHALL have clear separation of concerns (presentation, business logic, data access)
5. ALL environment-specific configuration SHALL use environment variables


### NFR 7: Compatibility

**Requirement:** THE system SHALL be compatible with the target deployment environment and devices.

**Acceptance Criteria:**
1. THE Mobile_App SHALL run on Android devices with version 8.0 (API level 26) or higher
2. THE Mobile_App SHALL support screen sizes from 5 inches to 7 inches
3. THE Web_Dashboard SHALL be compatible with Chrome 90+, Firefox 88+, Safari 14+, and Edge 90+
4. THE Web_Dashboard SHALL be responsive and usable on desktop screens (1280x720 minimum)
5. THE Backend_API SHALL run on Ubuntu 22.04 LTS
6. THE system SHALL use PostgreSQL 15 or higher

### NFR 8: Localization

**Requirement:** THE system SHALL support English and Hindi languages for all user-facing content.

**Acceptance Criteria:**
1. THE Mobile_App SHALL display all UI text in English or Hindi based on user preference
2. THE Mobile_App SHALL display all questions in English or Hindi based on user preference
3. THE Mobile_App SHALL use text-to-speech in the selected language
4. THE Web_Dashboard SHALL display all UI text in English (Hindi support is future enhancement)
5. ALL error messages SHALL be available in both English and Hindi for mobile app

### NFR 9: Data Retention

**Requirement:** THE system SHALL retain data according to government healthcare record retention policies.

**Acceptance Criteria:**
1. THE PostgreSQL_DB SHALL retain all visit records indefinitely
2. THE S3_Bucket SHALL retain audio files for at least 90 days
3. THE S3_Bucket SHALL archive audio files to Glacier storage after 90 days
4. THE PostgreSQL_DB SHALL retain sync_log records for at least 1 year
5. THE system SHALL provide data export functionality for archival purposes

### NFR 10: Disaster Recovery

**Requirement:** THE system SHALL have backup and recovery mechanisms to prevent data loss.

**Acceptance Criteria:**
1. THE PostgreSQL_DB SHALL be backed up daily with automated snapshots
2. THE S3_Bucket SHALL have versioning enabled to prevent accidental deletion
3. THE system SHALL support restoration from backup within 4 hours
4. THE Mobile_App SHALL retain unsynced data until successful sync confirmation
5. THE Backend_API SHALL log all critical errors to CloudWatch for monitoring


## Constraints

### Technical Constraints

1. **Platform Limitation**: v1 implementation supports Android only; iOS support requires future development
2. **Visit Type Limitation**: v1 implementation supports HBNC visits only; ANC and PNC visit types are out of scope
3. **Language Limitation**: v1 implementation supports English and Hindi only; additional languages require template updates
4. **AWS Region**: All AWS services must be deployed in the same region (ap-south-1 Mumbai) for latency optimization
5. **Database**: PostgreSQL must be version 15 or higher for JSONB performance features
6. **Mobile Framework**: Expo managed workflow limits access to certain native modules; custom native code requires ejecting

### Business Constraints

1. **Budget**: AWS costs must remain under $200/month for pilot deployment (100 ASHA workers)
2. **Timeline**: v1 implementation must be completed within 7 days for hackathon submission
3. **Team Size**: Development team consists of 1-2 developers
4. **Training**: ASHA workers must be able to use the app with maximum 2 hours of training
5. **Connectivity**: System must function in areas with intermittent or no internet connectivity
6. **Government Compliance**: Reports must match existing government HBNC register format exactly

### Regulatory Constraints

1. **Data Privacy**: System must comply with Indian data protection regulations
2. **Health Data**: Audio recordings containing health information must be encrypted at rest
3. **Audit Trail**: All data modifications must be logged for compliance audits
4. **Access Control**: ASHA workers must only access their assigned beneficiaries
5. **Data Retention**: Health records must be retained for minimum 5 years per government policy

## Assumptions

### Technical Assumptions

1. ASHA workers have Android smartphones with minimum Android 8.0 (API level 26)
2. ASHA workers have access to WiFi or mobile data at least once per day for syncing
3. AWS Bedrock Claude 3.5 Sonnet model is available in ap-south-1 region
4. AWS Transcribe supports hi-IN (Hindi) and en-IN (English) language codes
5. EC2 t3.small instance (2 vCPU, 2GB RAM) is sufficient for pilot deployment
6. Medical officers have desktop or laptop computers with modern web browsers
7. Collection centers have stable internet connectivity for web dashboard access

### Business Assumptions

1. ASHA workers are willing to adopt mobile technology for visit recording
2. Medical officers prefer Excel reports over other formats
3. Government HBNC register format will not change during pilot period
4. ASHA workers conduct an average of 5 visits per day
5. Each visit generates approximately 5 audio recordings of 30 seconds each
6. Payment processing integration will be handled in a future phase
7. HBNC question list will be provided by domain experts before implementation


### Data Assumptions

1. Each beneficiary has a unique MCTS ID assigned by the government system
2. ASHA workers are pre-assigned to specific beneficiaries in the system
3. Visit templates are created and validated by healthcare domain experts
4. Audio quality is sufficient for transcription with standard smartphone microphones
5. Beneficiary data is relatively static and does not change frequently
6. Worker assignments do not change frequently during the pilot period

### User Assumptions

1. ASHA workers have basic smartphone literacy (can navigate apps, tap buttons)
2. ASHA workers can read and understand questions in either English or Hindi
3. Medical officers have basic computer literacy and can use web applications
4. ASHA workers understand the importance of syncing data regularly
5. Medical officers will review generated reports for accuracy before submission
6. Users will report bugs and issues through designated support channels

## Success Metrics

### Primary Success Metrics

1. **Payment Delay Reduction**: Reduce payment processing time from 2-3 months to less than 1 week
   - Measurement: Average time from visit completion to payment approval
   - Target: 90% of payments processed within 7 days

2. **Data Accuracy**: Improve data accuracy compared to manual paper registers
   - Measurement: Error rate in submitted reports (missing fields, incorrect values)
   - Target: Less than 2% error rate (compared to estimated 15-20% with manual entry)

3. **ASHA Worker Adoption**: Achieve high adoption rate among ASHA workers
   - Measurement: Percentage of ASHA workers actively using the app
   - Target: 80% of trained ASHA workers using app for all visits within 1 month

4. **Visit Recording Completion**: Ensure visits are fully recorded with all required data
   - Measurement: Percentage of visits with all required questions answered
   - Target: 95% of visits have complete data

### Secondary Success Metrics

5. **Sync Success Rate**: Maintain high reliability of data synchronization
   - Measurement: Percentage of sync attempts that succeed
   - Target: 98% sync success rate

6. **App Performance**: Provide responsive user experience
   - Measurement: Average time to complete a visit recording
   - Target: Less than 10 minutes per visit (compared to 15-20 minutes with paper)

7. **Report Generation Time**: Reduce time to generate reports
   - Measurement: Time from request to downloadable report
   - Target: Less than 2 minutes for monthly reports (compared to 2-3 days manual)

8. **User Satisfaction**: Achieve positive user feedback
   - Measurement: User satisfaction survey score (1-5 scale)
   - Target: Average score of 4.0 or higher from ASHA workers and medical officers


### Operational Success Metrics

9. **System Uptime**: Maintain high availability
   - Measurement: Percentage of time system is available during business hours
   - Target: 99% uptime during 9 AM - 6 PM IST

10. **Data Loss Prevention**: Prevent data loss during sync and storage
    - Measurement: Number of visits lost due to system errors
    - Target: Zero data loss incidents

11. **Audio Transcription Accuracy**: Achieve acceptable transcription quality
    - Measurement: Manual review of sample transcripts for accuracy
    - Target: 80% transcription accuracy for clear audio recordings

12. **Cost Efficiency**: Maintain AWS costs within budget
    - Measurement: Monthly AWS bill
    - Target: Less than $200/month for 100 ASHA workers

### Long-term Success Metrics (Post-Pilot)

13. **Scalability**: Successfully scale to larger deployments
    - Measurement: System performance with increased user load
    - Target: Support 1000+ ASHA workers with minimal infrastructure changes

14. **Feature Adoption**: Expand to additional visit types
    - Measurement: Percentage of ANC and PNC visits recorded in system
    - Target: 70% of all visit types (HBNC, ANC, PNC) recorded within 6 months of feature launch

15. **Government Integration**: Integrate with existing government systems
    - Measurement: Successful data exchange with MCTS and other government databases
    - Target: Automated data sync with government systems within 12 months

## Out of Scope (Future Enhancements)

The following features are explicitly out of scope for v1 but may be considered for future releases:

1. **iOS Support**: Native iOS app for ASHA workers with iPhones
2. **ANC/PNC Visit Types**: Support for Antenatal Care and Postnatal Care visits
3. **Biometric Authentication**: Fingerprint or face recognition for mobile app login
4. **Push Notifications**: Real-time notifications for pending visits, sync reminders, or system updates
5. **Offline Report Generation**: Generate reports on mobile device without backend
6. **Real-time Sync**: WebSocket-based real-time data synchronization
7. **Chatbot Interface**: RAG-based conversational interface for querying visit data
8. **Payment Processing**: Automated compensation calculation and payment integration
9. **Multi-language Support**: Additional languages beyond English and Hindi
10. **Advanced Analytics**: Predictive analytics, trend analysis, and data visualization dashboards
11. **Conflict Resolution**: Handling simultaneous edits to the same beneficiary data
12. **Bulk Import**: CSV/Excel import for beneficiary and worker data
13. **Mobile Dashboard**: Analytics and statistics on mobile app
14. **Offline Maps**: Integration with maps for beneficiary location tracking
15. **Photo Capture**: Ability to attach photos to visit records

## Dependencies and Risks

### Critical Dependencies

1. **HBNC Question List**: Domain experts must provide complete HBNC question list with English and Hindi translations before Day 2 of implementation
2. **AWS Account Access**: AWS account with appropriate permissions for EC2, S3, Bedrock, and Transcribe must be available by Day 1
3. **Sample Data**: Sample beneficiary and worker data needed for testing and demo by Day 3
4. **UX4G Design System**: UX4G CDN must remain accessible and stable throughout development
5. **Domain Expert Review**: Healthcare domain expert must review and approve templates and report formats

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| AWS Bedrock quota limits | High | Medium | Request quota increase early; implement fallback to manual report generation |
| Transcription accuracy for Hindi | Medium | High | Use placeholder questions in English for demo; improve with better audio quality guidelines |
| Expo build failures | High | Low | Test EAS build early; have fallback to Expo Go for demo |
| SQLite performance with large datasets | Medium | Low | Implement pagination and data archival; test with realistic data volumes |
| Network instability during sync | Medium | High | Implement robust retry logic; provide clear sync status feedback |

### Business Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| ASHA worker resistance to technology | High | Medium | Provide hands-on training; emphasize payment delay reduction benefit |
| Incomplete HBNC question list | High | Medium | Use placeholder questions for demo; work with domain experts to finalize |
| Government report format changes | Medium | Low | Design flexible report generation; make format configurable |
| Budget overrun for AWS costs | Medium | Low | Monitor costs daily; implement S3 lifecycle policies; optimize Bedrock usage |
| Timeline delays | High | Medium | Prioritize core features; defer nice-to-have features to v2 |

## Acceptance Criteria for v1 Release

The v1 release is considered complete and ready for pilot deployment when:

1. ✅ ASHA workers can log in, set MPIN, and access the mobile app
2. ✅ ASHA workers can record complete HBNC visits offline with all question types (yes/no, number, voice)
3. ✅ ASHA workers can sync visits to the backend when online
4. ✅ Medical officers can log in to the web dashboard
5. ✅ Medical officers can view workers, beneficiaries, visits, and sync logs
6. ✅ Medical officers can generate AI-powered Excel reports for HBNC visits
7. ✅ Audio recordings are uploaded to S3 and transcription jobs are initiated
8. ✅ All API endpoints are secured with JWT authentication
9. ✅ The system is deployed on AWS EC2 with Docker
10. ✅ The web dashboard uses UX4G design system
11. ✅ The mobile app supports English and Hindi languages
12. ✅ All critical bugs are resolved (P0 and P1 severity)
13. ✅ Basic user documentation is available for ASHA workers and medical officers
14. ✅ The system passes end-to-end testing of complete workflows

---

**Document Version:** 1.0  
**Last Updated:** 2026-03-01  
**Status:** Draft - Pending Review
