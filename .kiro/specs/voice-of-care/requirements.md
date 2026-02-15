# Requirements Document: Voice of Care

## Introduction

Voice of Care is an offline-first mobile application system designed to transform how ASHA (Accredited Social Health Activist) workers in rural India document patient visits. The system reduces documentation time from 2-3 hours to 15 minutes by enabling voice-based field notes that are automatically converted into government-compliant reports using AI. The solution addresses critical challenges of poor connectivity, entry-level devices, and multilingual usage while accelerating payment cycles from 60-90 days to 7-14 days.

## Glossary

- **ASHA_Worker**: Accredited Social Health Activist - community health workers in rural India who conduct patient visits and submit reports for government compensation
- **Mobile_App**: React Native + Expo offline-first application used by ASHA workers to record patient visit data
- **Backend_System**: FastAPI + PostgreSQL server that processes audio, extracts data, and generates reports
- **Dashboard**: React + Vite web interface for viewing visits and exporting reports
- **Patient_Visit**: A single interaction between an ASHA worker and a patient, documented through 5 guided questions
- **Voice_Recording**: Audio captured during a patient visit using push-to-talk interface
- **Guided_Question**: One of 5 standardized questions asked during each patient visit
- **Offline_Storage**: Local data persistence using AsyncStorage on the mobile device
- **Sync_Operation**: Process of uploading locally stored visit data to the backend when connectivity is available
- **Transcription**: Conversion of audio recordings to text using Google Speech-to-Text API
- **Data_Extraction**: AI-powered process using Gemini 2.0 Flash to extract structured health data from transcriptions
- **Government_Report**: Formatted document compliant with government standards (JSY, TB DOTS formats)
- **Visit_Data**: Structured information extracted from a patient visit including BP, temperature, vaccinations, etc.

## Requirements

### Requirement 1: Voice Recording Interface

**User Story:** As an ASHA worker, I want to record voice notes for each guided question during a patient visit, so that I can capture information quickly without typing.

#### Acceptance Criteria

1. WHEN an ASHA worker presses the record button, THE Mobile_App SHALL begin capturing audio
2. WHEN an ASHA worker releases the record button, THE Mobile_App SHALL stop capturing audio and save the recording
3. THE Mobile_App SHALL display 5 guided questions sequentially for each patient visit
4. WHEN a recording is completed for a question, THE Mobile_App SHALL advance to the next guided question
5. THE Mobile_App SHALL store each voice recording locally using Offline_Storage immediately after capture
6. WHEN audio capture fails, THE Mobile_App SHALL display an error message and allow retry

### Requirement 2: Offline Data Persistence

**User Story:** As an ASHA worker with limited connectivity, I want all my visit data stored locally on my device, so that I can continue working without internet access.

#### Acceptance Criteria

1. THE Mobile_App SHALL persist all voice recordings to Offline_Storage without requiring network connectivity
2. THE Mobile_App SHALL persist all visit metadata (patient ID, timestamp, question responses) to Offline_Storage
3. WHEN the Mobile_App is closed and reopened, THE Mobile_App SHALL restore all locally stored visit data
4. WHEN storage space is insufficient, THE Mobile_App SHALL notify the user and prevent new recordings
5. THE Mobile_App SHALL maintain data integrity for all stored visits until successful sync

### Requirement 3: Data Synchronization

**User Story:** As an ASHA worker, I want my locally stored visits to automatically upload when I have internet connectivity, so that my reports reach the government system without manual intervention.

#### Acceptance Criteria

1. WHEN network connectivity becomes available, THE Mobile_App SHALL initiate a Sync_Operation for all unsynced visits
2. WHEN a Sync_Operation completes successfully, THE Mobile_App SHALL mark the visit as synced and retain local copy
3. IF a Sync_Operation fails, THEN THE Mobile_App SHALL retry with exponential backoff up to 3 attempts
4. THE Mobile_App SHALL display sync status (pending, in-progress, completed, failed) for each visit
5. WHEN multiple visits are pending sync, THE Mobile_App SHALL upload them in chronological order
6. THE Mobile_App SHALL allow manual sync trigger through a refresh action

### Requirement 4: Backend Audio Processing

**User Story:** As the system, I want to transcribe voice recordings and extract structured health data, so that visit information can be converted into government reports.

#### Acceptance Criteria

1. WHEN the Backend_System receives a voice recording, THE Backend_System SHALL transcribe it using Google Speech-to-Text API
2. WHEN transcription completes, THE Backend_System SHALL extract structured Visit_Data using Gemini 2.0 Flash
3. THE Backend_System SHALL extract blood pressure readings from transcriptions when mentioned
4. THE Backend_System SHALL extract temperature readings from transcriptions when mentioned
5. THE Backend_System SHALL extract vaccination information from transcriptions when mentioned
6. THE Backend_System SHALL store transcriptions and extracted Visit_Data in PostgreSQL database
7. IF transcription fails, THEN THE Backend_System SHALL log the error and mark the visit as requiring manual review

### Requirement 5: Multilingual Support

**User Story:** As an ASHA worker who speaks Hindi and English, I want the system to understand my mixed-language voice notes, so that I can communicate naturally.

#### Acceptance Criteria

1. THE Backend_System SHALL configure Google Speech-to-Text to recognize Hindi language audio
2. THE Backend_System SHALL configure Google Speech-to-Text to recognize English language audio
3. THE Backend_System SHALL process audio containing mixed Hindi and English speech
4. WHEN language detection confidence is low, THE Backend_System SHALL flag the transcription for review

### Requirement 6: Government Report Generation

**User Story:** As a Block Medical Officer, I want patient visit data formatted into government-compliant reports, so that ASHA workers can receive timely compensation.

#### Acceptance Criteria

1. WHEN Visit_Data is extracted, THE Backend_System SHALL generate a Government_Report in CSV format
2. THE Backend_System SHALL include all required fields for government submission in generated reports
3. THE Backend_System SHALL format dates according to government standards (DD/MM/YYYY)
4. THE Backend_System SHALL validate that all mandatory fields are present before report generation
5. IF mandatory fields are missing, THEN THE Backend_System SHALL mark the report as incomplete

### Requirement 7: Dashboard Visit Viewing

**User Story:** As a Block Medical Officer, I want to view all patient visits in a web dashboard, so that I can monitor ASHA worker activities and verify data quality.

#### Acceptance Criteria

1. THE Dashboard SHALL display a list of all patient visits with timestamp, ASHA worker name, and sync status
2. WHEN a user clicks on a visit, THE Dashboard SHALL display the full Visit_Data including all extracted fields
3. THE Dashboard SHALL provide audio playback capability for each voice recording
4. THE Dashboard SHALL display transcriptions alongside extracted Visit_Data
5. THE Dashboard SHALL allow filtering visits by date range
6. THE Dashboard SHALL allow filtering visits by ASHA worker
7. THE Dashboard SHALL allow filtering visits by sync status

### Requirement 8: Data Export Functionality

**User Story:** As a Health Department administrator, I want to export visit data to CSV format, so that I can process reports for government submission and payment processing.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a CSV export button for filtered visit data
2. WHEN the export button is clicked, THE Dashboard SHALL generate a CSV file containing all visible visits
3. THE Dashboard SHALL include all Visit_Data fields in the CSV export (patient ID, BP, temperature, vaccinations, timestamp)
4. THE Dashboard SHALL format the CSV file with proper headers and comma-separated values
5. THE Dashboard SHALL trigger a file download when CSV generation completes
6. WHEN no visits match the current filters, THE Dashboard SHALL display a message indicating no data to export

### Requirement 9: Authentication and Authorization

**User Story:** As a system administrator, I want secure authentication for ASHA workers and dashboard users, so that patient data remains confidential and access is controlled.

#### Acceptance Criteria

1. THE Mobile_App SHALL require ASHA workers to authenticate before accessing visit recording features
2. THE Backend_System SHALL validate authentication credentials against stored user records
3. THE Dashboard SHALL require users to authenticate before accessing visit data
4. WHEN authentication fails, THE Backend_System SHALL return an error and deny access
5. THE Backend_System SHALL associate each uploaded visit with the authenticated ASHA worker's user ID
6. THE Backend_System SHALL maintain session tokens with 24-hour expiration

### Requirement 10: Guided Question Flow

**User Story:** As an ASHA worker, I want clear guidance on what questions to ask during each visit, so that I collect consistent and complete information.

#### Acceptance Criteria

1. THE Mobile_App SHALL display the first guided question when a new visit is started
2. THE Mobile_App SHALL display exactly 5 guided questions per patient visit
3. WHEN a voice recording is completed, THE Mobile_App SHALL automatically advance to the next question
4. THE Mobile_App SHALL display progress indication showing current question number (e.g., "Question 2 of 5")
5. THE Mobile_App SHALL allow navigation back to previous questions to re-record answers
6. WHEN all 5 questions are answered, THE Mobile_App SHALL mark the visit as complete and ready for sync

### Requirement 11: Error Handling and Recovery

**User Story:** As an ASHA worker using an entry-level device, I want the app to handle errors gracefully, so that I don't lose my work when problems occur.

#### Acceptance Criteria

1. WHEN the Mobile_App crashes during recording, THE Mobile_App SHALL preserve all previously saved recordings
2. WHEN storage write fails, THE Mobile_App SHALL notify the user and prevent data loss
3. WHEN network request fails during sync, THE Mobile_App SHALL retain the visit data locally and allow retry
4. THE Mobile_App SHALL log errors locally for debugging purposes
5. WHEN the Backend_System encounters processing errors, THE Backend_System SHALL preserve the original audio file for manual review

### Requirement 12: Performance on Entry-Level Devices

**User Story:** As an ASHA worker with a ₹5,000-8,000 Android phone with 2GB RAM, I want the app to run smoothly, so that I can complete my work efficiently.

#### Acceptance Criteria

1. THE Mobile_App SHALL launch within 3 seconds on devices with 2GB RAM
2. THE Mobile_App SHALL record audio without lag or dropped frames on entry-level devices
3. THE Mobile_App SHALL store recordings using compressed audio format to minimize storage usage
4. THE Mobile_App SHALL limit memory usage to under 150MB during normal operation
5. WHEN multiple visits are stored locally, THE Mobile_App SHALL maintain responsive UI performance

### Requirement 13: Visit Metadata Capture

**User Story:** As an ASHA worker, I want to record basic patient information at the start of each visit, so that visits can be properly identified and tracked.

#### Acceptance Criteria

1. WHEN starting a new visit, THE Mobile_App SHALL prompt for patient identifier
2. THE Mobile_App SHALL automatically capture visit timestamp when recording begins
3. THE Mobile_App SHALL associate the authenticated ASHA worker's ID with each visit
4. THE Mobile_App SHALL store all visit metadata alongside voice recordings in Offline_Storage
5. WHEN syncing, THE Mobile_App SHALL upload visit metadata along with audio files

### Requirement 14: Audio Quality and Format

**User Story:** As the system, I want voice recordings captured in a format optimized for transcription accuracy and storage efficiency, so that processing succeeds and storage costs remain low.

#### Acceptance Criteria

1. THE Mobile_App SHALL record audio at 16kHz sample rate for optimal speech recognition
2. THE Mobile_App SHALL use compressed audio format (AAC or Opus) to minimize file size
3. THE Mobile_App SHALL ensure audio recordings are mono channel
4. WHEN ambient noise is high, THE Mobile_App SHALL apply noise reduction if device supports it
5. THE Mobile_App SHALL validate audio file integrity before marking recording as complete

### Requirement 15: Dashboard Performance and Scalability

**User Story:** As a Block Medical Officer viewing thousands of visits, I want the dashboard to load quickly and remain responsive, so that I can efficiently review data.

#### Acceptance Criteria

1. THE Dashboard SHALL implement pagination to display 50 visits per page
2. WHEN loading a page of visits, THE Dashboard SHALL complete the request within 2 seconds
3. THE Dashboard SHALL lazy-load audio files only when playback is requested
4. THE Dashboard SHALL cache filter results to improve subsequent query performance
5. WHEN applying filters, THE Dashboard SHALL update results within 1 second
