# Product Overview

Voice of Care (ASHA) is a healthcare technology solution addressing the manual paperwork burden on ASHA workers in rural India.

## Problem
ASHA workers face 2-3 month payment delays due to manual paperwork, transcription errors, data loss, and significant administrative overhead.

## Solution
Offline-first mobile application that:
- Captures voice and structured data during health visits
- Synchronizes with cloud backend when online
- Uses AI (AWS Bedrock Claude) to generate government-compliant reports
- Provides web dashboard for medical officers

## Core Components
1. **Mobile App**: Expo React Native (Android) - offline-first visit recording
2. **Backend API**: FastAPI - data sync and AI processing
3. **Web Dashboard**: React.js - monitoring and reporting

## Target Users
- **ASHA Workers**: Record visits using mobile app with voice input
- **Medical Officers**: Monitor activities and generate reports via web dashboard

## Key Features (v1)
- ASHA worker authentication with MPIN
- Offline visit recording (HBNC visits only in v1)
- Voice, numeric, and yes/no question types
- Data synchronization when online
- Audio transcription (AWS Transcribe)
- AI-powered report generation
- English and Hindi language support

## Out of Scope (v1)
- ANC/PNC visit types (future)
- iOS support (Android only)
- Biometric authentication
- Push notifications
- Real-time sync
- Compensation payment processing
