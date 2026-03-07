# Project Structure

## Repository Layout

```
voice-of-care-asha/
├── backend/              # FastAPI backend application
├── mobile/               # Expo React Native mobile app
├── web/                  # React.js web dashboard
├── .kiro/                # Kiro AI assistant configuration
│   ├── specs/            # Feature specifications
│   ├── steering/         # AI guidance rules
│   └── hooks/            # Automation hooks
├── docker-compose.yml    # Multi-service orchestration
├── Makefile              # Developer workflow commands
└── .env                  # Root environment config
```

## Backend Structure (`backend/`)

Follows standard FastAPI layered architecture:

```
backend/
├── app/
│   ├── main.py           # FastAPI app entry point
│   ├── config.py         # Settings (pydantic-settings)
│   ├── database.py       # SQLAlchemy setup
│   ├── dependencies.py   # Dependency injection
│   ├── models/           # SQLAlchemy ORM models
│   ├── schemas/          # Pydantic request/response schemas
│   ├── routers/          # API route handlers
│   └── services/         # Business logic layer
├── alembic/              # Database migrations
│   └── versions/         # Migration files
├── tests/                # pytest test suite
├── scripts/              # Utility scripts (seeding, etc.)
├── requirements.txt      # Python dependencies
├── .env                  # Backend environment config
└── Dockerfile            # Backend container image
```

### Backend Conventions
- **Models**: SQLAlchemy models in `app/models/`, inherit from `Base`
- **Schemas**: Pydantic models in `app/schemas/` for validation
- **Routers**: API endpoints in `app/routers/`, registered in `main.py`
- **Services**: Business logic in `app/services/`, called by routers
- **Dependencies**: Shared dependencies (DB session, auth) in `dependencies.py`

## Mobile App Structure (`mobile/`)

Expo React Native with TypeScript:

```
mobile/
├── src/
│   ├── navigation/       # React Navigation setup
│   ├── screens/          # Screen components
│   ├── components/       # Reusable UI components
│   ├── store/            # Zustand state management
│   ├── services/         # API clients, SQLite, sync logic
│   ├── utils/            # Helper functions
│   ├── types/            # TypeScript type definitions
│   └── i18n/             # Internationalization (i18next)
├── assets/               # Images, fonts, etc.
├── App.tsx               # Root component
├── index.ts              # Entry point
├── app.json              # Expo configuration
└── package.json          # Dependencies
```

### Mobile Conventions
- **Screens**: Full-page components in `src/screens/`
- **Navigation**: Stack and tab navigators in `src/navigation/`
- **State**: Zustand stores in `src/store/` (e.g., `authStore`, `visitStore`)
- **Offline-First**: SQLite for local storage, sync service for cloud sync
- **Localization**: i18next with English and Hindi translations

## Web Dashboard Structure (`web/`)

React.js with Vite:

```
web/
├── src/
│   ├── components/       # Reusable UI components
│   ├── pages/            # Page components
│   ├── services/         # API clients
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Helper functions
│   └── types/            # TypeScript types
├── public/               # Static assets
├── index.html            # HTML entry point
├── vite.config.ts        # Vite configuration
└── package.json          # Dependencies
```

## Database Schema

Key entities:
- **workers**: ASHA worker accounts
- **beneficiaries**: Pregnant women and newborns
- **collection_centers**: Health facilities
- **visit_templates**: Visit type definitions (HBNC, etc.)
- **visits**: Recorded visit data
- **sync_logs**: Synchronization tracking

## Architecture Patterns

### Backend
- **Layered Architecture**: Routers → Services → Models
- **Dependency Injection**: FastAPI's `Depends()` for DB sessions, auth
- **Pydantic Validation**: Request/response schemas for type safety
- **Async/Await**: Async route handlers for I/O operations

### Mobile
- **Offline-First**: SQLite as source of truth, sync when online
- **State Management**: Zustand for global state (auth, visits)
- **Navigation**: Nested navigators (Auth, Main Tabs, Visit Stack)
- **Component Structure**: Screens use reusable components

### API Design
- **RESTful**: Standard HTTP methods (GET, POST, PUT, DELETE)
- **Versioning**: `/api/v1/` prefix
- **Authentication**: JWT bearer tokens
- **Mobile-Specific**: `/mobile/init` endpoint for offline data sync

## Configuration Files

- **Backend**: `.env` (DATABASE_URL, JWT_SECRET, AWS credentials)
- **Mobile**: `.env` (API_BASE_URL)
- **Docker**: Root `.env` (POSTGRES_PASSWORD, JWT_SECRET, AWS config)
- **Alembic**: `alembic.ini` (migration settings)
- **Expo**: `app.json` (app metadata, build config)

## Testing

- **Backend**: `backend/tests/` with pytest
- **Naming**: `test_*.py` files, `test_*` functions
- **Fixtures**: Shared fixtures in `conftest.py`
- **Coverage**: Focus on routers, services, and critical business logic
