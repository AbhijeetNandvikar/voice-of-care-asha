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
- AWS: EC2, S3, PostgreSQL on EC2, Bedrock, Transcribe
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
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── auth.py
│   │   │       ├── workers.py
│   │   │       ├── beneficiaries.py
│   │   │       ├── visits.py
│   │   │       ├── templates.py
│   │   │       ├── sync.py
│   │   │       └── reports.py
│   │   ├── core/
│   │   │   ├── config.py         # env-based settings (pydantic-settings)
│   │   │   ├── security.py       # JWT encode/decode, bcrypt hashing
│   │   │   └── database.py       # SQLAlchemy async engine + session
│   │   ├── models/               # SQLAlchemy ORM models
│   │   ├── schemas/              # Pydantic request/response schemas
│   │   ├── services/
│   │   │   ├── s3.py             # S3 upload + presigned URL generation
│   │   │   ├── transcribe.py     # AWS Transcribe job management
│   │   │   ├── bedrock.py        # Claude report generation
│   │   │   └── export.py         # openpyxl Excel builder
│   │   └── main.py               # FastAPI app, CORS, router registration
│   ├── alembic/                  # DB migrations
│   │   └── versions/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── nginx.conf
│   ├── requirements.txt
│   └── .env.example
│
├── app/                          # Expo React Native (Android)
│   ├── src/
│   │   ├── navigation/
│   │   │   ├── AuthStack.tsx
│   │   │   ├── MainTabs.tsx
│   │   │   └── VisitStack.tsx
│   │   ├── screens/
│   │   │   ├── auth/
│   │   │   │   ├── LoginScreen.tsx
│   │   │   │   └── MPINScreen.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── DashboardScreen.tsx
│   │   │   │   ├── PastVisitsScreen.tsx
│   │   │   │   └── ProfileScreen.tsx
│   │   │   └── visit/
│   │   │       ├── VisitTypeScreen.tsx
│   │   │       ├── MCTSVerifyScreen.tsx
│   │   │       ├── DaySelectScreen.tsx
│   │   │       ├── DataCollectionScreen.tsx
│   │   │       └── SummaryScreen.tsx
│   │   ├── components/
│   │   │   ├── ProgressBar.tsx
│   │   │   ├── HistoryCard.tsx
│   │   │   ├── VoiceRecorder.tsx
│   │   │   ├── ActionCard.tsx
│   │   │   └── SyncStatusBadge.tsx
│   │   ├── store/                # Zustand state stores
│   │   │   ├── authStore.ts
│   │   │   └── visitStore.ts
│   │   ├── db/
│   │   │   ├── schema.ts         # CREATE TABLE statements
│   │   │   └── queries.ts        # All SQLite read/write helpers
│   │   ├── services/
│   │   │   ├── api.ts            # Axios client (base URL + auth interceptor)
│   │   │   ├── audio.ts          # expo-av recording/playback helpers
│   │   │   └── sync.ts           # Sync orchestration logic
│   │   ├── i18n/
│   │   │   ├── index.ts          # i18next setup
│   │   │   ├── en.json
│   │   │   └── hi.json
│   │   └── utils/
│   │       └── constants.ts      # UX4G color palette, spacing
│   ├── assets/
│   └── app.json
│
└── web/                          # React.js Admin Dashboard
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
    │   │   ├── Layout.jsx         # Sidebar + topbar shell
    │   │   ├── Sidebar.jsx
    │   │   ├── DataTable.jsx      # Reusable paginated table
    │   │   ├── DetailModal.jsx    # Reusable detail drawer/modal
    │   │   ├── VisitsChart.jsx    # Recharts bar chart
    │   │   └── ChatDrawer.jsx     # Placeholder only in v1
    │   ├── api/
    │   │   └── client.js          # Axios instance with JWT interceptor
    │   └── App.jsx
    ├── index.html                 # UX4G CDN links here
    ├── vite.config.js
    └── package.json
```

---

## Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Mobile | Expo (managed workflow) | Fastest setup; built-in AV, SQLite, SecureStore APIs |
| Web | React.js + Vite | Fast build, simple |
| Backend | FastAPI (Python 3.11) | Async, auto OpenAPI docs, fast to develop |
| Database | PostgreSQL 15 (Docker on EC2) | Relational, cost-free vs RDS |
| ORM | SQLAlchemy (async) + Alembic | Type-safe models + migrations |
| Auth | JWT (python-jose) + bcrypt | Simple, stateless |
| Mobile State | Zustand | Lightweight, no boilerplate |
| Mobile Local DB | expo-sqlite | Offline-first persistent storage |
| Audio Recording | expo-av | Record + playback on device |
| Text-to-Speech | expo-speech | On-device TTS, free, works offline |
| i18n | react-i18next | EN + HI locale JSON files |
| Web Styling | UX4G Design System (CDN) | Required — Indian Gov design system |
| Mobile Styling | Custom StyleSheet (UX4G palette) | Consistent look with web |
| Charts | Recharts | React-native chart library |
| Excel Export | openpyxl (Python) | Server-side Excel generation |
| File Storage | AWS S3 | Audio recordings + generated exports |
| Speech-to-Text | AWS Transcribe | Triggered on sync; supports hi-IN + en-IN |
| AI Report Gen | AWS Bedrock (claude-3-5-sonnet) | Government-compliant report generation |
| Compute | AWS EC2 (t3.small, Ubuntu 22.04) | Single-server Docker deployment |
| Containerization | Docker + docker-compose | Manages app + DB + nginx as one stack |
| Reverse Proxy | Nginx (in compose) | Routes /api/* to FastAPI, /* to static web |

---

## Database Schema (PostgreSQL)

### `collection_centers`
```sql
id              SERIAL PRIMARY KEY,
name            VARCHAR NOT NULL,
address         TEXT,
meta_data       JSONB DEFAULT '{}',
created_at      TIMESTAMP DEFAULT now()
```

### `workers`
```sql
id                   SERIAL PRIMARY KEY,
first_name           VARCHAR NOT NULL,
last_name            VARCHAR NOT NULL,
phone_number         VARCHAR NOT NULL,
aadhar_id            VARCHAR UNIQUE,
email                VARCHAR UNIQUE,
address              TEXT,
worker_type          VARCHAR NOT NULL,         -- 'asha_worker' | 'medical_officer' | 'anm' | 'aaw'
worker_id            VARCHAR(8) UNIQUE NOT NULL, -- 8-digit system-generated ID for login
password_hash        TEXT NOT NULL,
mpin_hash            TEXT,                     -- null until first MPIN setup
collection_center_id INTEGER REFERENCES collection_centers(id),
profile_photo_url    TEXT,
meta_data            JSONB DEFAULT '{}',
created_at           TIMESTAMP DEFAULT now(),
updated_at           TIMESTAMP DEFAULT now()
```

### `beneficiaries`
```sql
id               SERIAL PRIMARY KEY,
first_name       VARCHAR NOT NULL,
last_name        VARCHAR NOT NULL,
phone_number     VARCHAR,
aadhar_id        VARCHAR,
email            VARCHAR,
address          TEXT,
age              INTEGER,
weight           NUMERIC(5,2),
mcts_id          VARCHAR UNIQUE,             -- Mother Child Tracking System ID
beneficiary_type VARCHAR NOT NULL,           -- 'individual' | 'child' | 'mother_child'
assigned_asha_id INTEGER REFERENCES workers(id),
meta_data        JSONB DEFAULT '{}',
created_at       TIMESTAMP DEFAULT now(),
updated_at       TIMESTAMP DEFAULT now()
```

### `visit_templates`
```sql
id             SERIAL PRIMARY KEY,
template_type  VARCHAR NOT NULL,   -- 'hbnc' | 'anc' | 'pnc'
name           VARCHAR NOT NULL,
questions      JSONB NOT NULL,     -- array of question objects (schema below)
meta_data      JSONB DEFAULT '{}',
created_at     TIMESTAMP DEFAULT now()
```

**Question object structure inside `questions` array:**
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

**`input_type` values:**
- `yes_no` — Yes/No toggle buttons only
- `yes_no_voice` — Yes/No buttons + push-to-talk voice recording
- `number` — Numeric keyboard input
- `text_voice` — Text input + push-to-talk voice recording

> **DEPENDENCY:** The actual HBNC question list (English + Hindi) must be provided before Day 2. Use 5 placeholder questions to unblock development if not ready.

### `visits`
```sql
id               SERIAL PRIMARY KEY,
visit_type       VARCHAR NOT NULL,        -- 'hbnc' | 'anc' | 'pnc'
visit_date_time  TIMESTAMP NOT NULL,
day_number       INTEGER,                 -- HBNC days: 1, 3, 7, 14, 28
is_synced        BOOLEAN DEFAULT FALSE,
assigned_asha_id INTEGER REFERENCES workers(id),
beneficiary_id   INTEGER REFERENCES beneficiaries(id),
template_id      INTEGER REFERENCES visit_templates(id),
visit_data       JSONB NOT NULL,          -- answers, audio S3 keys, transcripts
meta_data        JSONB DEFAULT '{}',
synced_at        TIMESTAMP,
created_at       TIMESTAMP DEFAULT now(),
updated_at       TIMESTAMP DEFAULT now()
```

**`visit_data` JSONB structure:**
```json
{
  "answers": [
    {
      "question_id": "hbnc_q1",
      "answer": "yes",
      "audio_s3_key": "audio/worker_1/visit_123/hbnc_q1.m4a",
      "transcript_en": "yes the baby is breathing fine",
      "transcript_hi": null,
      "recorded_at": "2026-03-01T10:30:00Z"
    }
  ]
}
```

### `sync_logs`
```sql
id                   SERIAL PRIMARY KEY,
visit_id             INTEGER REFERENCES visits(id),
worker_id            INTEGER REFERENCES workers(id),
collection_center_id INTEGER REFERENCES collection_centers(id),
date_time            TIMESTAMP DEFAULT now(),
status               VARCHAR NOT NULL,    -- 'completed' | 'incomplete' | 'failed'
error_message        TEXT,
meta_data            JSONB DEFAULT '{}'
```

### `compensations`
```sql
id                   SERIAL PRIMARY KEY,
status               VARCHAR NOT NULL,    -- 'pending' | 'approved' | 'paid' | 'rejected'
amount               NUMERIC(10,2),
worker_id            INTEGER REFERENCES workers(id),
collection_center_id INTEGER REFERENCES collection_centers(id),
visit_id             INTEGER REFERENCES visits(id),
approved_by_worker_id INTEGER REFERENCES workers(id),
meta_data            JSONB DEFAULT '{}',
created_at           TIMESTAMP DEFAULT now(),
updated_at           TIMESTAMP DEFAULT now()
```

---

## Backend API Design

**Base URL:** `https://<ec2-ip>/api/v1`
**Auth:** `Authorization: Bearer <JWT>` on all endpoints except `/auth/login` and `POST /workers` (signup)

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/login` | `worker_id` + `password` → JWT access token |
| POST | `/auth/mpin/setup` | Set 4-digit MPIN (requires valid JWT, called on first login) |
| POST | `/auth/mpin/verify` | Verify MPIN → returns short-lived JWT |

### Workers
| Method | Endpoint | Description |
|---|---|---|
| GET | `/workers` | List workers (paginated: `?page=1&limit=20&worker_type=asha_worker&search=`) |
| POST | `/workers` | Create worker — backend generates 8-digit `worker_id` |
| GET | `/workers/me` | Authenticated worker's full profile |
| GET | `/workers/{id}` | Get worker by ID |
| PUT | `/workers/{id}` | Update worker fields |

### Beneficiaries
| Method | Endpoint | Description |
|---|---|---|
| GET | `/beneficiaries` | List (paginated: `?page&limit&type&search`) |
| POST | `/beneficiaries` | Create beneficiary |
| GET | `/beneficiaries/{id}` | Get by ID |
| GET | `/beneficiaries/mcts/{mcts_id}` | Verify + fetch by MCTS ID |

### Templates
| Method | Endpoint | Description |
|---|---|---|
| GET | `/templates` | All templates |
| GET | `/templates/{type}` | Template by type: `hbnc`, `anc`, `pnc` |

### Mobile Init
| Method | Endpoint | Description |
|---|---|---|
| GET | `/mobile/init` | Returns `{beneficiaries: [...], templates: [...]}` for SQLite seeding |

### Sync
| Method | Endpoint | Description |
|---|---|---|
| POST | `/sync/visits` | Bulk sync — multipart: `visits_json` (string) + audio files |
| GET | `/sync/logs` | List sync logs (paginated) |

**Server-side sync flow:**
1. Parse `visits_json` from FormData
2. For each audio file in FormData: upload to S3 at `audio/{worker_id}/{local_visit_id}/{question_id}.m4a`
3. Start AWS Transcribe job per audio file (async, output to S3)
4. Insert visits into PostgreSQL with S3 keys embedded in `visit_data`
5. Create `sync_log` with `status = 'completed'`
6. Return `{success: true, synced_visit_ids: [...]}`

> Transcription is async — transcripts appear in the DB once Transcribe completes. A background task polls/updates on completion.

### Reports
| Method | Endpoint | Description |
|---|---|---|
| POST | `/reports/generate` | Generate Excel via Claude. Body: `{visit_type, start_date, end_date, worker_id?}` |
| GET | `/reports/{id}/download` | Returns presigned S3 URL (15-min expiry) |

**Claude (Bedrock) prompt pattern:**
```
You are a healthcare data assistant. Given the following HBNC visit records JSON,
generate a structured government register summary.

Output ONLY a JSON array with these fields for each visit:
[worker_name, beneficiary_name, mcts_id, visit_date, day_number, ...answers]

Visit data:
{visit_data_json}
```
→ Parse JSON response → Build `.xlsx` with openpyxl → Upload to `voc-exports/` S3 bucket → Return presigned URL

---

## Mobile App (Expo) — Screen-by-Screen

### Navigation Structure
```
RootNavigator (Stack)
├── AuthStack                        ← shown when no JWT in SecureStore
│   ├── LoginScreen
│   └── MPINScreen                   ← mode prop: 'setup' | 'enter'
└── MainTabs (Bottom Tab Navigator)  ← shown when authenticated
    ├── Tab 1: Dashboard
    │   ├── DashboardScreen
    │   └── VisitStack (modal stack from dashboard)
    │       ├── VisitTypeScreen
    │       ├── MCTSVerifyScreen
    │       ├── DaySelectScreen
    │       ├── DataCollectionScreen
    │       └── SummaryScreen
    ├── Tab 2: Past Visits
    │   └── PastVisitsScreen
    └── Tab 3: Profile
        └── ProfileScreen
```

### Screen Specifications

#### `LoginScreen`
- Inputs: Worker ID (numeric keypad), Password (masked)
- "Login" button → `POST /auth/login`
- On success: store JWT in `expo-secure-store`
- Check response `has_mpin` flag:
  - `false` → navigate to `MPINScreen` (mode: setup)
  - `true` → navigate to `MPINScreen` (mode: enter)
- No signup — credentials set by admin via web app

#### `MPINScreen`
- **mode: setup** — Enter 4-digit PIN → Confirm PIN → `POST /auth/mpin/setup` → call `GET /mobile/init` → seed SQLite → navigate to MainTabs
- **mode: enter** — Enter 4-digit PIN → `POST /auth/mpin/verify` → navigate to MainTabs

#### `DashboardScreen`
- Greeting: "Good morning, [first_name]"
- "Today's Schedule" section:
  - Query SQLite `beneficiaries` assigned to this worker
  - Query SQLite `visits` for today's date
  - Show beneficiary list with status chips: `Pending` (orange) / `Completed` (green)
- Large primary CTA: **"Start Visit"** → push `VisitTypeScreen`

#### `VisitTypeScreen`
- Card list: HBNC (active), ANC (grayed "Coming Soon"), PNC (grayed "Coming Soon")
- "Next" button → push `MCTSVerifyScreen` with `visitType` param

#### `MCTSVerifyScreen`
- Text input: MCTS ID
- "Verify" button → query SQLite `beneficiaries` where `mcts_id = input`
- Found: show beneficiary name card + "Confirm" button → push `DaySelectScreen`
- Not found: inline error "Beneficiary not found. Please sync or contact your supervisor."

#### `DaySelectScreen`
- Header: Beneficiary name
- Day chips: `Day 1`, `Day 3`, `Day 7`, `Day 14`, `Day 28`
- For each day: query SQLite visits to mark completed (green checkmark)
- Already-completed days show warning toast on tap ("Visit already recorded. Continue?")
- Tap day → push `DataCollectionScreen` with `{beneficiary, visitType, dayNumber, templateId}`

#### `DataCollectionScreen` ← Core screen
Layout top to bottom:
1. **Progress bar** — `currentQuestionIndex / totalQuestions`
2. **History card** — Previous answers for this exact question from past visits for this beneficiary (SQLite query)
3. **Question card**:
   - Question text (in active language: `question_en` or `question_hi`)
   - Play button → `expo-speech.speak(questionText)`
4. **Answer input** (conditional on `input_type`):
   - `yes_no` or `yes_no_voice`: Two large toggle buttons (Yes / No)
   - `yes_no_voice` additionally shows push-to-talk button
   - `number`: Numeric `TextInput`
   - `text_voice`: `TextInput` + push-to-talk
5. **Voice recording UI** (when push-to-talk shown):
   - "Hold to Record" → `expo-av` `Audio.Recording.createAsync()`
   - Release → `stopAndUnloadAsync()` → save `.m4a` to `FileSystem.documentDirectory + audio/visit_{id}/q_{qId}.m4a`
   - Playback bar (AudioPlayer component)
   - "Re-record" button
6. **Action/Suggestion card** — `action_en` or `action_hi` from question object
7. **Navigation**: Left/Right swipe gesture OR hamburger icon → slide-up question list sheet

On each question navigation (swipe/tap): immediately persist answer to SQLite `visits.visit_data`
On last question: "Finish" button → push `SummaryScreen`

#### `SummaryScreen`
- Scrollable list: question + recorded answer for each question
- Tap any row → navigate back to that question (editable)
- **"Save to Device"** button → SQLite `UPDATE visits SET is_synced = 0` (final save)
- Info banner: "Sync your data when you have a network connection"
- "Done" → pop back to `DashboardScreen`

#### `PastVisitsScreen`
- FlatList of all visits from SQLite, newest first
- Filter chips: `Last Week`, `Last Month`, `By MCTS ID`
- Row: beneficiary name, visit type + day, date, sync badge (Synced / Pending)
- **"Sync All Pending"** CTA → call `sync.syncAllPending()` → toast result

#### `ProfileScreen`
- Card 1: Name, ASHA ID, Email, Phone, Address, profile photo placeholder
- Card 2: "Earnings This Month" / "Total Earnings" — fetch from `GET /workers/me` if online, else show cached value
- **Language Toggle**: `English | हिंदी` — writes to `AsyncStorage`, calls `i18n.changeLanguage()`

---

### Local SQLite Schema

```sql
-- All created with IF NOT EXISTS for safe re-init

CREATE TABLE IF NOT EXISTS workers (
  id INTEGER PRIMARY KEY,
  first_name TEXT, last_name TEXT,
  worker_id TEXT UNIQUE,
  phone_number TEXT,
  collection_center_id INTEGER,
  meta_data TEXT  -- JSON string
);

CREATE TABLE IF NOT EXISTS beneficiaries (
  id INTEGER PRIMARY KEY,
  first_name TEXT, last_name TEXT,
  mcts_id TEXT UNIQUE,
  phone_number TEXT,
  beneficiary_type TEXT,
  assigned_asha_id INTEGER,
  meta_data TEXT  -- JSON string
);

CREATE TABLE IF NOT EXISTS templates (
  id INTEGER PRIMARY KEY,
  template_type TEXT,
  name TEXT,
  questions TEXT  -- JSON stringified array of question objects
);

CREATE TABLE IF NOT EXISTS visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  server_id INTEGER,           -- null until successfully synced
  visit_type TEXT NOT NULL,
  day_number INTEGER,
  visit_date_time TEXT NOT NULL,
  beneficiary_id INTEGER NOT NULL,
  template_id INTEGER NOT NULL,
  assigned_asha_id INTEGER NOT NULL,
  visit_data TEXT NOT NULL,    -- JSON stringified answers with local audio paths
  is_synced INTEGER DEFAULT 0, -- 0 = pending, 1 = synced
  created_at TEXT DEFAULT (datetime('now'))
);
```

---

### Sync Service (`app/src/services/sync.ts`)

```
syncAllPending():
  1. const pending = await db.getAllWhere('visits', 'is_synced = 0')
  2. if (pending.length === 0) → show toast "Nothing to sync"
  3. Build FormData:
     - append 'visits_json': JSON.stringify(pending.map(v => ({...v, visit_data: JSON.parse(v.visit_data)})))
     - for each visit, for each answer with a local audio path:
         if (answer.local_audio_path) append file: { uri, name: 'audio_{visitId}_{questionId}.m4a', type: 'audio/m4a' }
  4. POST /sync/visits with FormData (Content-Type: multipart/form-data)
  5. On success response:
     - for each id in response.synced_visit_ids:
         UPDATE visits SET is_synced = 1, server_id = <returned_id> WHERE id = <local_id>
     - show success toast
  6. On error:
     - show error banner: "Sync failed. Check your connection or contact admin."
```

---

### i18n Setup (`app/src/i18n/`)

- `index.ts`: initialize `i18next` with `react-i18next`, resources from `en.json` and `hi.json`
- All UI strings (labels, buttons, placeholders, error messages) are keys in locale files
- Template questions are stored bilingually in the DB — app reads `question.question_en` or `question.question_hi` based on `i18n.language`
- User's language preference saved to `AsyncStorage` key `'app_language'`
- On app start: read `AsyncStorage` → call `i18n.changeLanguage()`

---

## Web App (React.js) — Screen-by-Screen

### UX4G Integration
Add to `web/index.html`:
```html
<link rel="stylesheet" href="https://cdn.ux4g.gov.in/UX4G@2.0.8/css/ux4g-min.css">
<script src="https://cdn.ux4g.gov.in/UX4G@2.0.8/js/ux4g.min.js"></script>
```
Use UX4G's CSS utility classes and component classes throughout all pages.

### App Layout (`Layout.jsx`)
```
┌──────────────────────────────────────────────────────┐
│  [Logo] Voice of Care         [User Name]  [Logout]  │  ← Top bar
├──────────┬───────────────────────────────────────────┤
│          │                                           │
│ Sidebar  │         Main Content Area                 │
│          │                                           │
│ Dashboard│                                           │
│ Workers  │                                           │
│ Benefic. │                                           │
│ Visits   │                                           │
│ SyncLogs │                                        [💬]│  ← floating chat
│ Export   │                                           │
│ Profile  │                                           │
└──────────┴───────────────────────────────────────────┘
```

### Pages

#### `/login` — Login
Standard login form. `worker_id` + `password` → `POST /auth/login` → store JWT in `localStorage` → redirect to `/`.

#### `/signup` — Signup
Full form fields: first_name, last_name, address, email, phone_number, aadhar_id, worker_type (select), collection_center_id (select — fetched from API), profile_photo (file upload), password, confirm_password.
Submit → `POST /workers` → redirect to `/login` with "Account created" message.

#### `/` — Dashboard
- **Stats row** (4 cards): Total Workers | Total Beneficiaries | Total Visits | Pending Syncs
- **Visits Chart**: `VisitsChart` component — bar chart, X-axis: last 14 days, Y-axis: visit count
- **Workers table** (compact): paginated, search, filter by worker_type, Export button, row click → `DetailModal`
- **Beneficiaries table** (compact): same pattern
- **Visits table** (compact): filter by date range + worker_type, same pattern
- **Floating chat button** (bottom-right): opens `ChatDrawer`

#### `/workers` — Workers Management
Full-page `DataTable` for workers + "Add Worker" button → slide-in form panel (same fields as signup).

#### `/beneficiaries` — Beneficiary Management
Full-page `DataTable` + "Add Beneficiary" form panel.

#### `/visits` — Visit Records
Full-page `DataTable` with rich filters (visit_type, date range, worker, beneficiary).
Row click → `DetailModal` showing full `visit_data` formatted as Q&A list (question text + answer + transcript if available).

#### `/sync-logs` — Sync Logs
`DataTable` showing sync history: worker, timestamp, status badge (green/red/orange), error message column.

#### `/export` — Data Export
- Form: Visit Type (select), Date From, Date To, Worker (optional select)
- "Generate Report" → `POST /reports/generate` → shows loading spinner
- Poll `GET /reports/{id}` every 3 seconds until `status = 'ready'`
- "Download Excel" button → `GET /reports/{id}/download` → opens presigned S3 URL

#### `/profile` — Profile
Read-only profile card from `GET /workers/me`. Shows all worker fields.

### Reusable `DataTable` Component
Props: `columns[]`, `data[]`, `total`, `page`, `onPageChange`, `onSearch`, `onFilter`, `onExport`, `onRowClick`
Features: column headers, search input, filter dropdowns, pagination controls, export button.

### `DetailModal` Component
Props: `title`, `sections: [{label, value}][]`, `isOpen`, `onClose`
Centered modal (UX4G modal classes), scrollable, close on overlay click.

### `ChatDrawer` Component (v1 — placeholder only)
Right-side drawer sliding in on chat button click.
Content: "AI Assistant — Coming Soon" with disabled input box.
Fully implemented in v2 using Bedrock Knowledge Bases.

---

## AWS Infrastructure

### Architecture Overview
```
Internet
    │
    ▼
[EC2 t3.small — Ubuntu 22.04]  (Elastic IP recommended)
    │
    ├─ Docker: Nginx (port 80)
    │       ├── /api/v1/*  → proxy_pass FastAPI:8000
    │       └── /*         → serve /web/dist (React static build)
    │
    ├─ Docker: FastAPI app (port 8000, internal)
    │
    ├─ Docker: PostgreSQL 15 (port 5432, internal only)
    │
    └─ IAM Instance Role attached → allows boto3 to call AWS services

[AWS S3]
    ├── voc-audio/          (private — raw audio .m4a files)
    └── voc-exports/        (private — generated .xlsx, accessed via presigned URLs)

[AWS Transcribe]   ← StartTranscriptionJob called from /sync/visits endpoint
[AWS Bedrock]      ← InvokeModel called from /reports/generate endpoint
```

### `docker-compose.yml`
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
      DATABASE_URL: postgresql+asyncpg://${DB_USER}:${DB_PASSWORD}@db:5432/${DB_NAME}
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRE_MINUTES: 1440
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
      - ../web/dist:/usr/share/nginx/html
    depends_on:
      - app
    restart: always

volumes:
  pgdata:
```

### `nginx.conf`
```nginx
server {
    listen 80;
    server_name _;

    location /api/ {
        proxy_pass http://app:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 50M;  # for audio file uploads
    }

    location / {
        root /usr/share/nginx/html;
        try_files $uri /index.html;
    }
}
```

### `.env.example`
```
DB_NAME=voiceofcare
DB_USER=vocuser
DB_PASSWORD=changeme_strong_password
JWT_SECRET=changeme_long_random_secret
AWS_REGION=ap-south-1
S3_AUDIO_BUCKET=voc-audio
S3_EXPORTS_BUCKET=voc-exports
```

### EC2 One-Time Setup
```bash
# Connect to EC2, then:
sudo apt update && sudo apt install -y docker.io docker-compose git
sudo usermod -aG docker ubuntu
sudo systemctl enable --now docker

git clone https://github.com/<your-org>/voice-of-care-asha.git
cd voice-of-care-asha/backend
cp .env.example .env         # fill in real values
docker-compose up -d
docker-compose exec app alembic upgrade head   # run migrations
```

### IAM Instance Role Policy (minimal permissions)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject", "s3:GetObject", "s3:DeleteObject", "s3:GetPresignedUrl"
      ],
      "Resource": [
        "arn:aws:s3:::voc-audio/*",
        "arn:aws:s3:::voc-exports/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "transcribe:StartTranscriptionJob",
        "transcribe:GetTranscriptionJob"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": ["bedrock:InvokeModel"],
      "Resource": "arn:aws:bedrock:ap-south-1::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0"
    }
  ]
}
```

---

## Key Data Flows

### Flow 1: First Login (Mobile App)
```
ASHA enters Worker ID + Password
  → POST /auth/login  →  {access_token, has_mpin: false}
  → Store JWT in expo-secure-store
  → Navigate to MPINScreen (mode: setup)
  → Enter + confirm 4-digit PIN
  → POST /auth/mpin/setup
  → GET /mobile/init  →  {beneficiaries: [...], templates: [...]}
  → Seed SQLite (workers, beneficiaries, templates tables)
  → Navigate to MainTabs (DashboardScreen)
```

### Flow 2: HBNC Visit (Fully Offline)
```
DashboardScreen → "Start Visit"
  → VisitTypeScreen: select HBNC
  → MCTSVerifyScreen: enter MCTS ID → SQLite lookup → beneficiary confirmed
  → DaySelectScreen: tap "Day 3"
  → DataCollectionScreen (15-20 questions):
      For each question:
        TTS reads question  (expo-speech — no network needed)
        ASHA answers (Yes/No tap OR hold to record)
        expo-av saves .m4a to local FileSystem
        Answer persisted to SQLite immediately
  → SummaryScreen: review all answers
  → "Save to Device"  →  visit saved with is_synced = 0
  → Back to Dashboard
```

### Flow 3: Data Sync (Needs Internet)
```
PastVisitsScreen → "Sync All Pending"
  → Read SQLite: visits WHERE is_synced = 0
  → Build multipart FormData:
       visits_json = JSON.stringify([...])
       audio files attached per question
  → POST /sync/visits

  [Backend]:
    → Parse FormData
    → Upload each audio to S3: audio/{worker_id}/{local_id}/{q_id}.m4a
    → Start AWS Transcribe job per audio (async, hi-IN language)
    → INSERT visits to PostgreSQL with S3 keys in visit_data
    → INSERT sync_log (status: 'completed')
    → Return {success: true, synced_visit_ids: [...]}

  [Mobile]:
    → UPDATE SQLite visits SET is_synced = 1
    → Show success toast: "X visits synced successfully"
```

### Flow 4: AI Report Generation (Web)
```
Medical Officer → Data Export page
  → Select: HBNC, March 1–31 2026, Worker: Priya Sharma
  → "Generate Report"  →  POST /reports/generate

  [Backend]:
    → Query PostgreSQL visits matching criteria
    → Format visit records as structured JSON
    → Build Claude prompt:
        "Given these HBNC visit records, generate a JSON array
         formatted as a government HBNC register table..."
    → Call Bedrock: InvokeModel (claude-3-5-sonnet)
    → Parse JSON response
    → Build Excel (.xlsx) with openpyxl
    → Upload to S3: exports/report_{uuid}.xlsx
    → Save report record in DB with presigned URL
    → Return {report_id, status: 'ready'}

  [Web]:
    → Poll GET /reports/{id} until status = 'ready'
    → Show "Download Report" button
    → Button click → open presigned S3 URL → browser downloads Excel
```

---

## Implementation Timeline (7 Days)

### Day 1 — Backend Foundation
- [ ] Initialize monorepo: `/backend`, `/app`, `/web` folders + root `README.md`
- [ ] FastAPI project: `main.py`, CORS, router structure, health endpoint
- [ ] SQLAlchemy models for all 7 tables
- [ ] Alembic init + first migration
- [ ] `POST /auth/login`, `POST /auth/mpin/setup`, `POST /auth/mpin/verify`
- [ ] JWT middleware dependency
- [ ] `GET /mobile/init` endpoint

### Day 2 — Backend CRUD + AWS Integration
- [ ] `GET/POST /workers`, `GET /workers/me`, `GET/PUT /workers/{id}`
- [ ] `GET/POST /beneficiaries`, `GET /beneficiaries/mcts/{mcts_id}`
- [ ] `GET /templates`, `GET /templates/{type}` + seed HBNC template in DB
- [ ] `services/s3.py` — upload_file, generate_presigned_url
- [ ] `services/transcribe.py` — start_job, (optional) poll_job
- [ ] `POST /sync/visits` (multipart) + `GET /sync/logs`
- [ ] Basic manual test with curl/Postman

### Day 3 — Backend Reports + Web Shell
- [ ] `services/bedrock.py` — invoke_claude with structured prompt
- [ ] `services/export.py` — openpyxl Excel generation
- [ ] `POST /reports/generate`, `GET /reports/{id}/download`
- [ ] React web app: `npm create vite@latest web -- --template react`
- [ ] UX4G CDN added to `index.html`
- [ ] React Router setup, `Layout.jsx` (sidebar + topbar)
- [ ] `/login` and `/signup` pages (functional with API)

### Day 4 — Web Dashboard
- [ ] `DataTable.jsx` reusable component (columns, pagination, search, filter, export, row click)
- [ ] `DetailModal.jsx` reusable component
- [ ] `VisitsChart.jsx` (Recharts bar chart)
- [ ] `/` Dashboard page — stats cards + chart + 3 compact tables
- [ ] `/workers` full-page table + add form panel
- [ ] `/beneficiaries` full-page table + add form panel

### Day 5 — Web Remaining + Mobile Auth
- [ ] `/visits` table + DetailModal with visit_data Q&A rendering
- [ ] `/sync-logs` table
- [ ] `/export` report generation page (full generate → poll → download flow)
- [ ] `/profile` page
- [ ] `ChatDrawer.jsx` placeholder
- [ ] `npx create-expo-app app --template blank-typescript`
- [ ] SQLite schema + all query helpers in `db/queries.ts`
- [ ] `LoginScreen.tsx` + `MPINScreen.tsx` (fully functional)
- [ ] First-login init flow (SQLite seeding from `/mobile/init`)

### Day 6 — Mobile Core Flows
- [ ] Navigation structure: AuthStack, MainTabs, VisitStack
- [ ] `DashboardScreen.tsx` (schedule from SQLite + Start Visit CTA)
- [ ] `VisitTypeScreen.tsx`, `MCTSVerifyScreen.tsx`, `DaySelectScreen.tsx`
- [ ] `DataCollectionScreen.tsx` — TTS, all input types, voice recording with expo-av
- [ ] `SummaryScreen.tsx` — review + save to device
- [ ] `PastVisitsScreen.tsx` — list + filters + Sync CTA
- [ ] `ProfileScreen.tsx` — profile cards + language toggle
- [ ] `i18n/` setup with `en.json` + `hi.json`

### Day 7 — Integration + Deploy
- [ ] `sync.ts` — full sync service (FormData build + SQLite update)
- [ ] End-to-end test: Login → HBNC visit → sync → view in web dashboard → generate report
- [ ] EC2: Docker setup + `docker-compose up -d`
- [ ] `npm run build` in `/web` → copy `dist/` to nginx volume
- [ ] Configure `.env` on EC2
- [ ] Run `alembic upgrade head` on server
- [ ] Full demo walkthrough — fix critical bugs
- [ ] (Optional) EAS Build: `eas build --platform android --profile preview` for installable APK

---

## Critical Dependencies

| # | Dependency | Needed By | Blocker? |
|---|---|---|---|
| 1 | HBNC question list (English + Hindi) | Day 2 (template seeding), Day 6 (data collection screen) | Yes — use 5 placeholder questions to unblock |
| 2 | Sample beneficiary data (even dummy) | Day 7 (demo) | Yes — seed script with dummy data |
| 3 | AWS account with EC2 + Bedrock access enabled | Day 7 | Yes — Bedrock requires manual opt-in per model |
| 4 | UX4G color palette mapped to StyleSheet constants | Day 5 (mobile) | No — can use approximate values |

---

## Risk Mitigation

| Risk | Mitigation |
|---|---|
| HBNC questions not ready | Build with 5 placeholder questions; swap before demo |
| Bedrock access not enabled | Enable model access in AWS console Day 1; it can take hours |
| Expo EAS build fails | Test `eas build` on Day 5, not Day 7; keep Expo Go as demo fallback |
| Large audio files timeout on sync | Cap recording at 60 seconds; compress to 64 kbps in expo-av options |
| SQLite schema changes during dev | Always use `IF NOT EXISTS`; add a `DROP TABLE` dev reset utility |
| EC2 not provisioned in time | Use `ngrok` tunnel to local FastAPI during development as fallback |
| Transcription takes too long for demo | Show "Transcription in progress..." in UI; mock a transcript for demo |

---

## v2 Chatbot Plan (Not in v1 scope)

**When:** After hackathon — implement as second feature

**Architecture:**
1. Create Amazon Bedrock Knowledge Base pointing to an S3 bucket
2. Populate S3 with visit summaries (generated as text files post-sync)
3. `POST /chat/query` endpoint:
   - Call Bedrock `RetrieveAndGenerate` API with user's question
   - Stream response back via Server-Sent Events (SSE)
4. `ChatDrawer.jsx`: replace placeholder with real chat UI
   - Message history in component state
   - Markdown rendering for responses
   - Streaming tokens via EventSource

**Example queries the chatbot should handle:**
- "How many HBNC visits did Priya do this month?"
- "Which beneficiaries had a low birth weight recorded?"
- "Show me all Day 1 visits in Pune district this week"
