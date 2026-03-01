# Voice of Care (ASHA) — Complete Architecture & Implementation Plan

**Prepared:** 2026-03-01
**Hackathon Deadline:** < 1 week
**Team:** 1–2 developers
**Type:** AWS Hackathon — Healthcare AI for Rural India

---

## Context

ASHA workers in rural India are overburdened with manual paperwork for reporting health visits, causing payment delays of 2–3 months. This project replaces the paper register with an offline-first mobile app (React Native / Expo) that captures voice + structured data during field visits, syncs to a FastAPI backend on AWS, uses Claude (Bedrock) to generate government-compliant reports, and provides a web dashboard (React.js) for medical officers to monitor and export data.

---

## Scope Decisions (v1 — Hackathon)

### IN SCOPE
- HBNC visit type only (ANC/PNC — future)
- English + Hindi only
- Android only (Expo managed)
- MPIN auth on mobile (biometric — future)
- Excel/CSV export via Claude
- AWS: EC2, S3, RDS (PostgreSQL on EC2), Bedrock, Transcribe
- Web dashboard: all core screens
- Chatbot: planned, NOT implemented

### OUT OF SCOPE (future)
- ANC / PNC visit flows
- iOS support
- Biometric authentication
- Push notifications
- Compensation payment processing
- Real-time sync / WebSocket
- Web chatbot implementation
- Conflict resolution for simultaneous syncs

---

## Monorepo Structure

```
voice-of-care-asha/
├── backend/                  # FastAPI server
│   ├── app/
│   │   ├── api/              # Route handlers
│   │   │   └── v1/
│   │   │       ├── auth.py
│   │   │       ├── workers.py
│   │   │       ├── beneficiaries.py
│   │   │       ├── visits.py
│   │   │       ├── templates.py
│   │   │       ├── sync.py
│   │   │       └── reports.py
│   │   ├── core/
│   │   │   ├── config.py     # env-based settings
│   │   │   ├── security.py   # JWT, password hashing
│   │   │   └── database.py   # SQLAlchemy engine
│   │   ├── models/           # SQLAlchemy ORM models
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   ├── services/
│   │   │   ├── s3.py         # S3 upload/presigned URLs
│   │   │   ├── transcribe.py # AWS Transcribe jobs
│   │   │   ├── bedrock.py    # Claude report generation
│   │   │   └── export.py     # openpyxl Excel builder
│   │   └── main.py
│   ├── alembic/              # DB migrations
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── requirements.txt
│   └── .env.example
│
├── app/                      # Expo React Native (Android)
│   ├── src/
│   │   ├── navigation/       # React Navigation stacks
│   │   ├── screens/
│   │   │   ├── auth/         # Login, MPIN
│   │   │   ├── dashboard/    # Dashboard, PastVisits, Profile
│   │   │   └── visit/        # VisitType, MCTSVerify, DaySelect, DataCollection, Summary
│   │   ├── components/       # Shared UI components
│   │   ├── store/            # Zustand state management
│   │   ├── db/               # SQLite schema + queries (expo-sqlite)
│   │   ├── services/
│   │   │   ├── api.ts        # Axios API client
│   │   │   ├── audio.ts      # expo-av recording helpers
│   │   │   └── sync.ts       # Sync orchestration
│   │   ├── i18n/
│   │   │   ├── en.json
│   │   │   └── hi.json
│   │   └── utils/
│   ├── assets/
│   └── app.json
│
└── web/                      # React.js Admin Dashboard
    ├── src/
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Signup.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Workers.jsx
    │   │   ├── Beneficiaries.jsx
    │   │   ├── Visits.jsx
    │   │   ├── SyncLogs.jsx
    │   │   ├── DataExport.jsx
    │   │   └── Profile.jsx
    │   ├── components/
    │   │   ├── Sidebar.jsx
    │   │   ├── DataTable.jsx     # Reusable paginated table
    │   │   ├── DetailModal.jsx   # Reusable detail drawer
    │   │   ├── VisitsChart.jsx   # Recharts bar chart
    │   │   └── ChatDrawer.jsx    # Placeholder (UI only)
    │   ├── api/
    │   │   └── client.js         # Axios instance
    │   └── App.jsx
    ├── public/
    └── package.json
```

---

## Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Mobile | Expo (React Native) | Fastest setup, built-in AV/SQLite APIs |
| Web | React.js + Vite | Fast, simple |
| Backend | FastAPI (Python 3.11) | Async, auto-docs, fast to build |
| Database | PostgreSQL 15 (on EC2) | Relational, reliable |
| ORM | SQLAlchemy + Alembic | Migrations + typed models |
| Auth | JWT (python-jose) + bcrypt | Simple, stateless |
| Mobile State | Zustand | Lightweight, no boilerplate |
| Mobile DB | expo-sqlite | Offline-first local storage |
| Audio | expo-av | Recording + playback |
| TTS | expo-speech | On-device, free |
| i18n | react-i18next | EN + HI locale files |
| Styling (Web) | UX4G Design System (CDN) | Required by project spec |
| Styling (App) | Custom styles following UX4G palette | Consistent look |
| Charts | Recharts | Simple, React-native |
| Excel Export | openpyxl | Server-side Excel generation |
| Storage | AWS S3 | Audio files + generated exports |
| STT | AWS Transcribe | On sync: hi-IN + en-IN |
| AI Reports | AWS Bedrock (claude-3-5-sonnet) | Report generation |
| Compute | AWS EC2 (t3.small) | Docker-hosted backend |
| Container | Docker + docker-compose | Simple single-server deploy |
| Reverse Proxy | Nginx (in compose) | Routes traffic |

---

## Database Schema (PostgreSQL)

### `collection_centers`
```sql
id              SERIAL PRIMARY KEY
name            VARCHAR NOT NULL
address         TEXT
meta_data       JSONB DEFAULT '{}'
created_at      TIMESTAMP DEFAULT now()
```

### `workers`
```sql
id                  SERIAL PRIMARY KEY
first_name          VARCHAR NOT NULL
last_name           VARCHAR NOT NULL
phone_number        VARCHAR NOT NULL
aadhar_id           VARCHAR UNIQUE
email               VARCHAR UNIQUE
address             TEXT
worker_type         VARCHAR NOT NULL  -- 'asha_worker','medical_officer','anm','aaw'
worker_id           VARCHAR(8) UNIQUE NOT NULL  -- 8-digit system-generated ID
password_hash       TEXT NOT NULL
mpin_hash           TEXT                         -- set after first login
collection_center_id INTEGER REFERENCES collection_centers(id)
profile_photo_url   TEXT
meta_data           JSONB DEFAULT '{}'
created_at          TIMESTAMP DEFAULT now()
updated_at          TIMESTAMP DEFAULT now()
```

### `beneficiaries`
```sql
id              SERIAL PRIMARY KEY
first_name      VARCHAR NOT NULL
last_name       VARCHAR NOT NULL
phone_number    VARCHAR
aadhar_id       VARCHAR
email           VARCHAR
address         TEXT
age             INTEGER
weight          NUMERIC(5,2)
mcts_id         VARCHAR UNIQUE     -- Mother Child Tracking System ID
beneficiary_type VARCHAR NOT NULL  -- 'individual','child','mother_child'
assigned_asha_id INTEGER REFERENCES workers(id)
meta_data       JSONB DEFAULT '{}'
created_at      TIMESTAMP DEFAULT now()
updated_at      TIMESTAMP DEFAULT now()
```

### `visit_templates`
```sql
id              SERIAL PRIMARY KEY
template_type   VARCHAR NOT NULL   -- 'hbnc','anc','pnc'
name            VARCHAR NOT NULL
questions       JSONB NOT NULL     -- embedded question list (see below)
meta_data       JSONB DEFAULT '{}'
created_at      TIMESTAMP DEFAULT now()
```

**Question schema inside `questions` JSONB array:**
```json
{
  "id": "hbnc_q1",
  "order": 1,
  "input_type": "yes_no_voice",
  "question_en": "Is the baby breathing normally?",
  "question_hi": "क्या बच्चा सामान्य रूप से सांस ले रहा है?",
  "action_en": "If no, refer to nearest health facility immediately.",
  "action_hi": "यदि नहीं, तुरंत निकटतम अस्पताल जाएं।",
  "is_required": true
}
```
> **Note:** The actual HBNC question list must be provided by the team before implementation of the mobile data collection screen and template seeding.

**`input_type` values:** `yes_no`, `yes_no_voice`, `number`, `text_voice`  // need to update this, we can just keep `yes_no`, `number` and `voice` type 

### `visits`
```sql
id                  SERIAL PRIMARY KEY
visit_type          VARCHAR NOT NULL       -- 'hbnc','anc','pnc'
visit_date_time     TIMESTAMP NOT NULL
day_number          INTEGER                -- HBNC: 1,3,7,14,28
is_synced           BOOLEAN DEFAULT FALSE
assigned_asha_id    INTEGER REFERENCES workers(id)
beneficiary_id      INTEGER REFERENCES beneficiaries(id)
template_id         INTEGER REFERENCES visit_templates(id)
visit_data          JSONB NOT NULL         -- question answers, audio S3 keys, transcripts
meta_data           JSONB DEFAULT '{}'
synced_at           TIMESTAMP
created_at          TIMESTAMP DEFAULT now()
updated_at          TIMESTAMP DEFAULT now()
```

**`visit_data` JSONB structure:**
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

### `sync_logs`
```sql
id                      SERIAL PRIMARY KEY
visit_id                INTEGER REFERENCES visits(id)
worker_id               INTEGER REFERENCES workers(id)
collection_center_id    INTEGER REFERENCES collection_centers(id)
date_time               TIMESTAMP DEFAULT now()
status                  VARCHAR NOT NULL  -- 'completed','incomplete','failed'
error_message           TEXT
meta_data               JSONB DEFAULT '{}'
```

### `compensations`
```sql
id                      SERIAL PRIMARY KEY
status                  VARCHAR NOT NULL   -- 'pending','approved','paid','rejected'
amount                  NUMERIC(10,2)
worker_id               INTEGER REFERENCES workers(id)
collection_center_id    INTEGER REFERENCES collection_centers(id)
visit_id                INTEGER REFERENCES visits(id)
approved_by_worker_id   INTEGER REFERENCES workers(id)
meta_data               JSONB DEFAULT '{}'
created_at              TIMESTAMP DEFAULT now()
updated_at              TIMESTAMP DEFAULT now()
```

---

## Backend API Design

**Base URL:** `https://<ec2-ip>/api/v1`
**Auth:** Bearer JWT in `Authorization` header (all endpoints except login/signup)

### Auth (`/auth`) 
IMPORTANT: Make sure you add CRUD API for all the endpoints. DELETE API is missing for all the below endpoints. add it at the time of implementation.

| Method | Path | Description |
|---|---|---|
| POST | `/auth/login` | Login with `worker_id` + `password` → JWT |
| POST | `/auth/mpin/setup` | Set 4-digit MPIN (requires JWT, first login) |
| POST | `/auth/mpin/verify` | Verify MPIN → short-lived JWT |

### Workers (`/workers`)
| Method | Path | Description |
|---|---|---|
| GET | `/workers` | List workers (paginated, filterable) |
| POST | `/workers` | Create worker (generates 8-digit worker_id) |
| GET | `/workers/me` | Get authenticated worker profile |
| GET | `/workers/:id` | Get worker by ID |
| PUT | `/workers/:id` | Update worker |

### Beneficiaries (`/beneficiaries`)
| Method | Path | Description |
|---|---|---|
| GET | `/beneficiaries` | List beneficiaries (paginated) |
| POST | `/beneficiaries` | Create beneficiary |
| GET | `/beneficiaries/:id` | Get beneficiary |
| GET | `/beneficiaries/mcts/:mcts_id` | Verify + fetch by MCTS ID |

### Templates (`/templates`)
| Method | Path | Description |
|---|---|---|
| GET | `/templates` | Get all templates |
| GET | `/templates/:type` | Get template by type (hbnc/anc/pnc) |
| GET | `/templates/:id` | Get specific template |


### Mobile Init (`/mobile`)
| Method | Path | Description |
|---|---|---|
| GET | `/mobile/init` | Returns worker's beneficiaries + all templates for SQLite seeding |

### Sync (`/sync`)
| Method | Path | Description |
|---|---|---|
| POST | `/sync/visits` | Bulk sync visits from device. Accepts multipart: visit JSON array + audio files |
| GET | `/sync/logs` | List sync logs |

**Sync flow (server side):**
1. Receive visit payload + audio files
2. Upload audio files to S3: `audio/{worker_id}/{visit_id}/{question_id}.m4a`
3. For each audio file, start AWS Transcribe job (async, hi-IN)
4. Save visits to DB with `is_synced = true`, S3 keys in `visit_data`
5. Create `sync_log` record with `status = 'completed'`
6. Return success response (transcription finishes in background, webhook updates transcript in DB)

> **Simplification:** Transcription runs async. For demo, transcripts may not be immediately visible — this is acceptable.

### Reports (`/reports`)
| Method | Path | Description |
|---|---|---|
| POST | `/reports/generate` | Generate Excel report for date range / worker / visit type |
| GET | `/reports/:id/download` | Download generated report (presigned S3 URL) |

**Claude (Bedrock) report generation prompt pattern:**
```
Given the following visit data JSON for ASHA worker [name] covering [date range],
generate a structured summary in the format of an HBNC government register.
Output as JSON with the following columns: [columns list].
```
→ Parse Claude's JSON output → Build Excel with openpyxl → Upload to S3 → Return presigned URL

---

## Mobile App (Expo) — Screen-by-Screen

### Navigation Structure
```
Root Stack
├── AuthStack (shown when no JWT stored)
│   ├── LoginScreen          -- worker_id + password
│   └── MPINScreen           -- set MPIN (first login) or enter MPIN (subsequent)
└── MainTabs (shown when authenticated)
    ├── Tab: Dashboard
    │   └── DashboardScreen
    │       └── VisitStack (modal stack)
    │           ├── VisitTypeScreen       -- select HBNC (only option for v1)
    │           ├── MCTSVerifyScreen      -- enter & verify MCTS ID (local SQLite lookup)
    │           ├── DaySelectScreen       -- HBNC day selector (1,3,7,14,28)
    │           ├── DataCollectionScreen  -- Q&A + voice recording
    │           └── SummaryScreen         -- review + sync reminder
    ├── Tab: Past Visits
    │   └── PastVisitsScreen             -- list + filters + Sync CTA
    └── Tab: Profile
        └── ProfileScreen                -- info + earnings + language toggle
```

### Screen Details

**LoginScreen**
- Fields: Worker ID (numeric), Password (masked)
- On success: Store JWT in SecureStore. Check if MPIN set → route to MPINScreen(mode=setup) or MPINScreen(mode=enter)
- On first login: After MPIN setup → trigger `/mobile/init` → seed SQLite

**MPINScreen (mode: setup)**
- 4-digit PIN entry → confirm PIN → POST `/auth/mpin/setup` → navigate to MainTabs

**MPINScreen (mode: enter)**
- 4-digit PIN entry → POST `/auth/mpin/verify` → navigate to MainTabs

**DashboardScreen**
- Header: "Good morning, [first_name]"
- "Today's Schedule" section: list of assigned beneficiaries with visit status chips (Pending / Completed)
  - Data comes from local SQLite (beneficiaries assigned to this worker + visit records for today)
- Large CTA button: **"Start Visit"** → navigate to VisitTypeScreen

**VisitTypeScreen**
- Radio card list: HBNC (enabled), ANC (disabled/coming soon), PNC (disabled/coming soon)
- Next button → MCTSVerifyScreen

**MCTSVerifyScreen**
- Text input: Enter MCTS ID
- Lookup against local SQLite `beneficiaries` table
- If found: show beneficiary name + confirm → navigate to DaySelectScreen
- If not found: show error "Beneficiary not found. Please sync or contact admin."

**DaySelectScreen**
- Header: beneficiary name
- Day selector: chips for Day 1, Day 3, Day 7, Day 14, Day 28
- Completed days highlighted in green (check local SQLite visits)
- Already completed days show a "revisit" warning
- Tap a day → navigate to DataCollectionScreen

**DataCollectionScreen** (core screen)
- Top: Progress bar (question X of N)
- History Card: previous answer for this question (from SQLite, past visits for this beneficiary)
- Question Card:
  - Question text (in selected language)
  - Play button → expo-speech reads the question aloud
- Answer Section (conditional on `input_type`):
  - `yes_no`: Yes / No toggle buttons
  - `number`: Numeric input
  - `voice`: push-to-talk
- Voice Recording UI:
  - "Hold to Record" button → expo-av startRecording
  - Release → stopRecording → show audio playback bar
  - Re-record button to redo
  - File saved to Expo FileSystem: `{FileSystem.documentDirectory}audio/visit_{localId}/q_{questionId}.m4a`
- Action/Suggestion Card: displayed below answer (from question's `action_en/hi` field)
- Navigation: Left/Right swipe OR hamburger icon → slide-up question list
- Persist each answer to SQLite immediately on navigation
- Last question → "Finish" button → navigate to SummaryScreen

**SummaryScreen**
- Review list: each question with the recorded answer
- Tap any answer → go back to that question (editable)
- "Save to Device" button → mark visit as complete in SQLite with `is_synced = false`
- Banner: "Remember to sync your data when you have internet"
- Navigate back to Dashboard

**PastVisitsScreen**
- List of all visits from SQLite, ordered by date desc
- Filter chips: Last Week, Last Month, By MCTS ID (text input)
- Each row: beneficiary name, visit type, day, date, sync status badge
- "Sync All Pending" CTA button → trigger sync service

**ProfileScreen**
- Card 1: Name, ASHA ID, Email, Phone, Address, Profile Photo
- Card 2: "Earnings This Month" / "Total Earnings" (from `/workers/me` API when online)
- Language Toggle: English | हिंदी — saves to AsyncStorage, triggers i18n language change

### Local SQLite Schema (expo-sqlite)

```sql
-- Seeded on first login from /mobile/init
CREATE TABLE IF NOT EXISTS workers (
  id INTEGER PRIMARY KEY,
  first_name TEXT, last_name TEXT,
  worker_id TEXT, phone_number TEXT,
  collection_center_id INTEGER, meta_data TEXT
);

CREATE TABLE IF NOT EXISTS beneficiaries (
  id INTEGER PRIMARY KEY,
  first_name TEXT, last_name TEXT,
  mcts_id TEXT UNIQUE, phone_number TEXT,
  beneficiary_type TEXT, assigned_asha_id INTEGER,
  meta_data TEXT
);

CREATE TABLE IF NOT EXISTS templates (
  id INTEGER PRIMARY KEY,
  template_type TEXT,
  name TEXT,
  questions TEXT  -- JSON stringified array
);

CREATE TABLE IF NOT EXISTS visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  server_id INTEGER,               -- null until synced
  visit_type TEXT,
  day_number INTEGER,
  visit_date_time TEXT,
  beneficiary_id INTEGER,
  template_id INTEGER,
  assigned_asha_id INTEGER,
  visit_data TEXT,                 -- JSON stringified answers + local audio paths
  is_synced INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
```

### Sync Service Logic (app/src/services/sync.ts)

```
syncAllPending():
1. Query SQLite: SELECT * FROM visits WHERE is_synced = 0
2. For each visit:
   a. Parse visit_data JSON
   b. Collect audio file paths from answers
3. Build multipart FormData:
   - visits_json: JSON.stringify(visits array)
   - audio files: each attached with key = "audio_{visitId}_{questionId}"
4. POST /sync/visits with FormData
5. On 200 response:
   - UPDATE visits SET is_synced = 1, server_id = <returned_id> WHERE id IN (...)
6. On error:
   - Show error banner: "Sync failed. Check connection or contact admin."
```

### i18n Setup

- `i18n/en.json` and `i18n/hi.json` contain all UI string keys
- Questions are stored bilingually in the template JSONB — app reads `question_en` or `question_hi` based on `i18n.language`
- Language preference persisted in AsyncStorage
- Switching language updates i18n runtime, re-renders all screens

---

## Web App (React.js) — Screen-by-Screen

**Styling:** UX4G Design System loaded via CDN in `index.html`:
```html
<link rel="stylesheet" href="https://cdn.ux4g.gov.in/UX4G@2.0.8/css/ux4g-min.css">
<script src="https://cdn.ux4g.gov.in/UX4G@2.0.8/js/ux4g.min.js"></script>
```

### Layout

- **Left sidebar** (fixed, collapsible): App logo + nav links
  - Dashboard
  - Workers (Onboarding + List)
  - Beneficiaries (Onboarding + List)
  - Visits
  - Sync Logs
  - Data Export
  - Profile
- **Top bar**: Breadcrumb, user name, logout
- **Main content area**: Page content
- **Floating chat button** (bottom-right): Opens `ChatDrawer` (placeholder only in v1)

### Pages

**Login (`/login`):** Worker ID + Password fields. JWT stored in localStorage.

**Signup (`/signup`):** Full form: first_name, last_name, address, email, phone, aadhar_id, worker_type (dropdown), collection_center_id (dropdown), profile_photo (upload), password, confirm_password. On submit → POST `/workers` → redirect to login with success message.

**Dashboard (`/`):**
- Stats row: Total Workers, Total Beneficiaries, Total Visits, Pending Syncs (4 stat cards)
- Visits Chart: Bar chart (X: date, Y: visit count) using Recharts — fetched from visits API
- Workers Table: paginated list, search, filter by worker_type, "Export" button, row click → DetailModal
- Beneficiaries Table: paginated list, search, filter by type, "Export" button, row click → DetailModal
- Visits Table: paginated list, search, filter by date/worker/type, "Export" button, row click → DetailModal

**Workers (`/workers`):** Full-page paginated table + "Add Worker" button opens slide-in form panel (same fields as signup).

**Beneficiaries (`/beneficiaries`):** Full-page paginated table + "Add Beneficiary" form panel.

**Visits (`/visits`):** Full-page table. Row click → DetailModal showing all `visit_data` answers rendered in a readable format (question text + answer + transcript if available).

**Sync Logs (`/sync-logs`):** Table of sync_log records with status badges, timestamps, worker name.

**Data Export (`/export`):**
- Form: Select visit type, date range, worker (optional)
- "Generate Report" button → POST `/reports/generate` → poll for completion → "Download Excel" button
- Report generated by Claude (Bedrock) on backend

**Profile (`/profile`):** Read-only worker profile card. "Change Password" (future).

### Reusable `DataTable` Component
Props: `columns`, `data`, `pagination`, `onSearch`, `onFilter`, `onExport`, `onRowClick`
Used across Workers, Beneficiaries, Visits, Sync Logs pages.

### `DetailModal` Component
Props: `title`, `fields` (label+value pairs), `isOpen`, `onClose`
Renders a centered modal with scrollable key-value list.

### `ChatDrawer` Component (v1: Placeholder)
Renders a right-side drawer with "Coming Soon" message and input box (disabled).
Full RAG-based chatbot planned for v2 using Bedrock Knowledge Bases.

---

## AWS Infrastructure

### Architecture Diagram
```
Internet
    │
    ▼
[EC2 t3.small — Ubuntu 22.04]
    │
    ├── Nginx (port 80/443)
    │       ├── /api/*  → FastAPI (port 8000, Docker)
    │       └── /*      → Serve React web build (static)
    │
    ├── PostgreSQL (Docker, port 5432, internal only)
    │
    └── IAM Instance Role
            ├── s3:PutObject, s3:GetObject, s3:DeleteObject
            ├── transcribe:StartTranscriptionJob, transcribe:GetTranscriptionJob
            └── bedrock:InvokeModel

[S3 Buckets]
    ├── voc-audio/          -- audio recordings (private)
    └── voc-exports/        -- generated Excel reports (private, presigned URLs)

[AWS Transcribe]  ←── triggered by /sync endpoint
[AWS Bedrock]     ←── triggered by /reports/generate endpoint
```

### docker-compose.yml (backend/)
```yaml
version: '3.8'
services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    restart: always

  app:
    build: .
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@db:5432/${DB_NAME}
      JWT_SECRET: ${JWT_SECRET}
      AWS_REGION: ${AWS_REGION}
      S3_AUDIO_BUCKET: ${S3_AUDIO_BUCKET}
      S3_EXPORTS_BUCKET: ${S3_EXPORTS_BUCKET}
      BEDROCK_MODEL_ID: anthropic.claude-3-5-sonnet-20241022-v2:0
    depends_on:
      - db
    ports:
      - "8000:8000"
    restart: always

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
      - ../web/dist:/usr/share/nginx/html   # served as static
    depends_on:
      - app
    restart: always

volumes:
  pgdata:
```

### EC2 Setup (one-time)
```bash
# On EC2 Ubuntu 22.04
sudo apt update && sudo apt install -y docker.io docker-compose git
sudo systemctl enable docker
git clone <repo> && cd voice-of-care-asha/backend
cp .env.example .env  # fill in values
docker-compose up -d
```

### IAM Instance Profile Policy (minimal)
```json
{
  "Effect": "Allow",
  "Action": [
    "s3:PutObject","s3:GetObject","s3:DeleteObject",
    "transcribe:StartTranscriptionJob","transcribe:GetTranscriptionJob",
    "bedrock:InvokeModel"
  ],
  "Resource": "*"
}
```

---

## Key Data Flows

### Flow 1: First Login (Mobile)
```
ASHA enters worker_id + password
    → POST /auth/login → JWT stored in SecureStore
    → MPIN setup screen → POST /auth/mpin/setup
    → GET /mobile/init → {beneficiaries[], templates[]}
    → Seed SQLite tables
    → Navigate to Dashboard
```

### Flow 2: HBNC Visit (Offline)
```
Dashboard → Start Visit
    → Select HBNC
    → Enter MCTS ID → SQLite lookup → beneficiary found
    → Select Day (e.g., Day 3)
    → DataCollectionScreen:
        For each question:
            - TTS reads question (expo-speech)
            - ASHA taps Yes/No or holds to record voice
            - expo-av saves .m4a to local FileSystem
            - Answer saved to SQLite immediately
    → SummaryScreen → confirm → visit saved (is_synced = 0)
```

### Flow 3: Data Sync
```
ASHA taps "Sync All Pending" (needs internet)
    → Read all visits WHERE is_synced = 0 from SQLite
    → Build FormData with visit JSON + audio files
    → POST /sync/visits (multipart)
    Backend:
        → Save visits to PostgreSQL (is_synced = true)
        → Upload audio to S3
        → Start AWS Transcribe jobs (async)
        → Create sync_log records
        → Return {success: true, synced_visit_ids: [...]}
    Mobile:
        → UPDATE SQLite visits SET is_synced = 1
        → Show "Sync successful" toast
```

### Flow 4: Report Generation (Web)
```
Medical Officer opens Data Export
    → Selects: HBNC, March 2026, Worker XYZ
    → POST /reports/generate
    Backend:
        → Query visits matching criteria from PostgreSQL
        → Format visit data into structured JSON
        → Send to Claude (Bedrock):
            "Generate HBNC report as JSON table for: [data]"
        → Parse Claude response
        → Build Excel with openpyxl
        → Upload to S3 (voc-exports/)
        → Return presigned download URL (15-min expiry)
    Web:
        → Show "Download Report" button
```

---

## Implementation Timeline (7 days)

### Day 1 — Backend Foundation
- [ ] Monorepo init + README
- [ ] FastAPI project setup (`/backend`)
- [ ] PostgreSQL models + Alembic migrations (all tables)
- [ ] Auth endpoints: login, MPIN setup, MPIN verify
- [ ] JWT middleware
- [ ] `/mobile/init` endpoint (beneficiaries + templates for device)

### Day 2 — Backend CRUD + AWS Integration
- [ ] Workers CRUD API
- [ ] Beneficiaries CRUD API (including MCTS lookup)
- [ ] Templates API + seed HBNC template with questions
- [ ] S3 service (upload, presigned URL)
- [ ] AWS Transcribe service (start job, async)
- [ ] Visits sync endpoint (multipart: JSON + audio)
- [ ] Sync logs

### Day 3 — Backend Reports + Web App Shell
- [ ] Bedrock service (Claude report generation)
- [ ] openpyxl Excel builder
- [ ] Reports API (`/reports/generate`, `/reports/:id/download`)
- [ ] React web app init (Vite + UX4G CDN)
- [ ] Sidebar layout, React Router setup
- [ ] Login + Signup pages (functional)

### Day 4 — Web App Dashboard
- [ ] Dashboard page (stats cards + chart + 3 tables)
- [ ] Reusable DataTable component
- [ ] Reusable DetailModal component
- [ ] Workers page (list + add form)
- [ ] Beneficiaries page (list + add form)

### Day 5 — Web App Remaining + Mobile Auth
- [ ] Visits page (list + detail modal showing visit_data)
- [ ] Sync Logs page
- [ ] Data Export page (report generation flow)
- [ ] Profile page
- [ ] ChatDrawer placeholder
- [ ] Expo app init (managed workflow)
- [ ] SQLite setup + schema
- [ ] LoginScreen + MPINScreen (functional)
- [ ] First-login init flow (SQLite seeding)

### Day 6 — Mobile Core Flows
- [ ] Navigation structure (all stacks/tabs)
- [ ] DashboardScreen (schedule + CTA)
- [ ] VisitTypeScreen, MCTSVerifyScreen, DaySelectScreen
- [ ] DataCollectionScreen (TTS + all input types)
- [ ] Voice recording with expo-av
- [ ] SummaryScreen
- [ ] PastVisitsScreen + filters
- [ ] ProfileScreen + language toggle
- [ ] i18n setup (en.json + hi.json)

### Day 7 — Integration, Sync, Deploy
- [ ] Sync service (FormData upload + SQLite update)
- [ ] End-to-end test: login → visit → sync → web dashboard
- [ ] EC2 setup + Docker deploy
- [ ] Web build (`npm run build`) → copy to nginx static dir
- [ ] Environment variables configured
- [ ] Demo walkthrough test run
- [ ] Bug fixes + polish

---

## Critical Dependencies / Open Items

1. **HBNC Question List** — The actual list of HBNC questions (in English + Hindi) must be provided before Day 2 for template seeding. Without this, the data collection screen cannot be completed.
2. **MCTS Sample Data** — Seed data for beneficiaries (even dummy data) needed for demo flow.
3. **EC2 Instance** — AWS account with EC2, S3, Bedrock, Transcribe access needed by Day 7.
4. **UX4G Palette for Mobile** — Agree on primary colors from UX4G system to apply as React Native StyleSheet constants.

---

## Chatbot — Plan for v2 (Not Implemented in v1)

**Architecture:** RAG pipeline using Amazon Bedrock Knowledge Bases
- Sync visit data summaries to a Bedrock Knowledge Base
- Medical officer types question in ChatDrawer
- POST `/chat/query` → Bedrock RetrieveAndGenerate API → returns answer
- Streaming response via SSE

**UI:** ChatDrawer shows conversation history, markdown-rendered responses.

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|---|---|---|
| HBNC question list not ready | Blocks mobile Day 6 | Use 5 placeholder questions to build + replace later |
| AWS Bedrock quota limits | Blocks report generation | Test early on Day 2, request limit increase if needed |
| Expo build fails on device | Blocks mobile demo | Test `eas build` on Day 5, not Day 7 |
| Sync multipart upload size | Large audio files may timeout | Limit recording to 60s max; compress to 64kbps |
| SQLite migration issues | Breaks local DB | Use `IF NOT EXISTS` on all CREATE TABLE statements |
| EC2 instance not ready | Blocks backend demo | Use ngrok tunnel during development as backup |
