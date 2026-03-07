# Product Overview

Voice of Care (ASHA) is a healthcare technology solution addressing the manual paperwork burden on ASHA workers in rural India.

## Problem
ASHA workers face 2-3 month payment delays due to manual paperwork, transcription errors, data loss, and significant administrative overhead.

## Solution
An offline-first mobile application that:
- Captures voice and structured data during health visits
- Synchronizes with cloud backend when online
- Uses AI to generate government-compliant reports automatically

## Core Components
1. **Mobile App**: Offline-first React Native app for ASHA workers to record visits
2. **Backend API**: FastAPI service for data sync and AI processing
3. **Web Dashboard**: Admin interface for medical officers to monitor activities
4. **AI Integration**: AWS Transcribe (speech-to-text) + AWS Bedrock Claude (report generation)

## Key Features
- ASHA worker authentication with MPIN
- Offline visit recording (HBNC visits)
- Voice, numeric, and yes/no question types
- Data synchronization when online
- Audio transcription and AI-powered report generation
- English and Hindi language support

## Target Users
- **Primary**: ASHA workers in rural India conducting health visits
- **Secondary**: Medical officers monitoring field activities and reviewing reports
