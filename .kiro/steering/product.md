---
inclusion: always
---

# Product Overview

Voice of Care (ASHA) is a healthcare technology solution that eliminates the manual paperwork burden on ASHA (Accredited Social Health Activist) workers in rural India, enabling faster payment processing and better health outcome tracking.

## Problem

ASHA workers face:
- 2–3 month payment delays caused by manual paperwork and bureaucratic bottlenecks
- Transcription errors and data loss when recording health visits on paper
- Significant administrative overhead that reduces time available for actual healthcare

## Solution

An offline-first mobile application that:
- Captures voice and structured data during health visits in the field (no connectivity required)
- Synchronizes with a cloud backend automatically when online
- Uses AI to generate government-compliant reports, removing manual paperwork entirely

## Core Components

1. **Mobile App**: Offline-first React Native app for ASHA workers to record visits and sync data
2. **Backend API**: FastAPI service handling data sync, AI processing, and report generation
3. **Web Dashboard**: Admin interface for medical officers to monitor ASHA activities and review reports
4. **AI Integration**: AWS Transcribe (speech-to-text) + AWS Bedrock Claude (automated report generation)

## Target Users

- **Primary — ASHA Workers**: Conduct home-based health visits in rural areas; low digital literacy; need simple, Hindi-first UI; authenticate via 4-digit MPIN (not passwords)
- **Secondary — Medical Officers**: Review field activities, approve reports, monitor area-wide health data via web dashboard

## Key Visit Types

- **HBNC (Home-Based Newborn Care)**: Structured visits for newborns and mothers, captured via the mobile app with voice + yes/no + numeric inputs
- Other visit templates can be configured in the `visit_templates` table

## Beneficiary Types

- Pregnant women
- Newborns and infants
- Children under 5

## Payment & Reporting Workflow

1. ASHA worker records visits offline on the mobile app
2. Data syncs to backend when connectivity is available
3. AI generates government-compliant reports from visit data
4. Medical officers review and approve reports via web dashboard
5. Approved reports feed into payment processing, reducing delays from months to days

## Government Compliance

Reports must conform to official ASHA program formats as defined by India's Ministry of Health. The AI report generation (AWS Bedrock Claude) is prompted to produce output matching these official templates.

## Language Support

- **English**: Web dashboard and backend admin interfaces
- **Hindi**: Mobile app primary language for ASHA workers; i18next used for translations
