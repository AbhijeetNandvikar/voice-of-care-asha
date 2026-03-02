# Project Structure

## Monorepo Layout
```
voice-of-care-asha/
├── backend/          # FastAPI backend application
├── web/              # React.js web dashboard
├── mobile/           # Expo React Native mobile app (planned)
├── nginx/            # Nginx configuration
├── .kiro/            # Kiro AI assistant configuration
│   ├── specs/        # Feature specifications
│   └── steering/     # Project guidance documents
└── docker-compose.yml
```

## Backend Structure (`backend/`)
```
backend/
├── app/
│   ├── main.py              # FastAPI entry point, router registration
│   ├── config.py            # Environment-based settings (pydantic-settings)
│   ├── database.py          # SQLAlchemy engine and session management
│   ├── dependencies.py      # Shared dependencies (auth, db session)
│   ├── models/              # SQLAlchemy ORM models
│   │   ├── base.py          # Base model class
│   │   ├── worker.py
│   │   ├── beneficiary.py
│   │   ├── visit.py
│   │   ├── visit_template.py
│   │   ├── collection_center.py
│   │   └── sync_log.py
│   ├── schemas/             # Pydantic request/response schemas
│   │   ├── auth.py
│   │   ├── workers.py
│   │   ├── beneficiaries.py
│   │   └── templates.py
│   ├── routers/             # API route handlers (grouped by resource)
│   │   ├── auth.py          # /api/v1/auth/*
│   │   ├── workers.py       # /api/v1/workers/*
│   │   ├── beneficiaries.py # /api/v1/beneficiaries/*
│   │   ├── templates.py     # /api/v1/templates/*
│   │   ├── mobile.py        # /api/v1/mobile/*
│   │   └── sync.py          # /api/v1/sync/*
│   └── services/            # Business logic and external integrations
│       ├── auth_service.py  # Password/MPIN hashing, JWT generation
│       ├── s3.py            # AWS S3 operations
│       ├── transcribe.py    # AWS Transcribe integration
│       └── bedrock.py       # AWS Bedrock (Claude) integration
├── alembic/                 # Database migrations
│   ├── versions/            # Migration scripts
│   └── env.py
├── tests/                   # Pytest test suite
│   ├── conftest.py          # Test fixtures
│   └── test_*.py            # Test files
├── scripts/                 # Utility scripts (seeding, etc.)
├── requirements.txt
├── Dockerfile
└── .env.example
```

## Web Dashboard Structure (`web/`)
```
web/
├── src/
│   ├── App.jsx              # Main app component with routing
│   ├── pages/               # Page components
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Workers.jsx
│   │   ├── Beneficiaries.jsx
│   │   ├── Visits.jsx
│   │   └── Profile.jsx
│   ├── components/          # Reusable UI components
│   │   ├── Sidebar.jsx
│   │   ├── DataTable.jsx    # Paginated table component
│   │   └── DetailModal.jsx  # Detail view modal
│   └── api/
│       └── client.js        # Axios instance with auth interceptor
├── public/
├── dist/                    # Build output (served by Nginx)
└── package.json
```

## Mobile App Structure (`mobile/`) - Planned
```
mobile/
├── src/
│   ├── navigation/          # React Navigation stacks
│   ├── screens/
│   │   ├── auth/            # Login, MPIN screens
│   │   ├── dashboard/       # Dashboard, PastVisits, Profile
│   │   └── visit/           # Visit flow screens
│   ├── components/          # Shared UI components
│   ├── store/               # Zustand state management
│   ├── db/                  # SQLite schema and queries
│   ├── services/
│   │   ├── api.ts           # API client
│   │   ├── audio.ts         # Audio recording helpers
│   │   └── sync.ts          # Sync orchestration
│   ├── i18n/
│   │   ├── en.json
│   │   └── hi.json
│   └── utils/
└── app.json
```

## Key Architectural Patterns

### Backend
- **Dependency Injection**: Use FastAPI's `Depends()` for database sessions and auth
- **Service Layer**: Business logic separated from route handlers
- **Schema Validation**: Pydantic models for all request/response data
- **Database Models**: SQLAlchemy ORM with Alembic migrations
- **JSONB Fields**: Use for flexible metadata and nested structures (visit_data, questions)

### API Structure
- Base URL: `/api/v1/`
- RESTful resource naming
- JWT Bearer token authentication (except login/signup)
- Consistent error responses

### Mobile (Planned)
- **Offline-First**: SQLite as source of truth, sync when online
- **State Management**: Zustand for global state
- **Navigation**: React Navigation with stack and tab navigators
- **Localization**: i18n with English and Hindi support

### Database
- **JSONB Usage**: 
  - `visit_templates.questions`: Array of question objects
  - `visits.visit_data`: Answers, audio S3 keys, transcripts
  - `*.meta_data`: Flexible additional data
- **Relationships**: Foreign keys with proper indexing
- **Timestamps**: `created_at`, `updated_at` on all main tables
