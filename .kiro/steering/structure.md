---
inclusion: always
---

# Project Structure

## Repository Layout

```
voice-of-care-asha/
├── backend/              # FastAPI backend application
├── mobile/               # Expo React Native mobile app
├── web/                  # React.js web dashboard
├── .kiro/                # Kiro AI assistant configuration
│   ├── specs/            # Feature specifications
│   ├── steering/         # AI guidance rules (this folder)
│   └── hooks/            # Automation hooks
├── docker-compose.yml    # Multi-service orchestration
├── Makefile              # Developer workflow commands
└── .env                  # Root environment config (Docker)
```

---

## Backend Structure (`backend/`)

FastAPI layered architecture:

```
backend/
├── app/
│   ├── main.py           # FastAPI app entry point; registers all routers
│   ├── config.py         # pydantic-settings: all env vars go here
│   ├── database.py       # SQLAlchemy async engine + session factory
│   ├── dependencies.py   # Shared Depends() — DB session, current user
│   ├── models/           # SQLAlchemy ORM models (one file per entity)
│   ├── schemas/          # Pydantic request/response schemas
│   ├── routers/          # API route handlers (one file per resource)
│   ├── services/         # Business logic (one file per domain)
│   └── utils/            # Pure helper functions (no DB/HTTP side effects)
├── alembic/              # Database migrations
│   └── versions/         # Auto-generated migration files
├── tests/                # pytest test suite
├── scripts/              # Utility scripts (seeding, one-off jobs)
├── requirements.txt      # Python dependencies
├── .env                  # Backend environment config (gitignored)
└── Dockerfile
```

### Backend Naming Conventions

| Layer | Location | Naming |
|---|---|---|
| ORM Models | `app/models/` | `snake_case.py`, class `PascalCase` extending `Base` |
| Pydantic Schemas | `app/schemas/` | `snake_case.py`, classes like `WorkerCreate`, `WorkerResponse` |
| Routers | `app/routers/` | `snake_case.py`, `router = APIRouter(prefix="/resource")` |
| Services | `app/services/` | `snake_case_service.py`, functions are plain async functions |
| Migrations | `alembic/versions/` | Auto-named by Alembic; message describes the change |

### Backend Architecture Rules

- **Routers call Services** — routers must not contain business logic or direct DB queries
- **Services call Models** — services use the DB session passed via `Depends()`; they do not import routers
- **Schemas are never ORM models** — always use Pydantic schemas at the router boundary
- **Config is centralized** — all env vars accessed via `from app.config import settings`; never call `os.environ` directly

---

## Mobile App Structure (`mobile/`)

Expo React Native + TypeScript:

```
mobile/
├── src/
│   ├── navigation/       # React Navigation setup (stacks, tabs, auth flow)
│   ├── screens/          # Full-page screen components
│   ├── components/       # Reusable UI components
│   ├── store/            # Zustand stores (global state)
│   ├── services/         # API clients, SQLite helpers, sync logic
│   ├── utils/            # Pure helper/utility functions
│   ├── types/            # TypeScript type definitions and interfaces
│   └── i18n/             # i18next translation files (en, hi)
├── assets/               # Images, fonts, icons
├── App.tsx               # Root component
├── index.ts              # Entry point
├── app.json              # Expo configuration
└── package.json
```

### Mobile Naming Conventions

| Type | Location | Naming |
|---|---|---|
| Screens | `src/screens/` | `PascalCase.tsx` (e.g., `HomeScreen.tsx`) |
| Components | `src/components/` | `PascalCase.tsx` |
| Zustand Stores | `src/store/` | `camelCaseStore.ts` (e.g., `authStore.ts`, `visitStore.ts`) |
| Services | `src/services/` | `camelCaseService.ts` (e.g., `syncService.ts`) |
| Translation keys | `src/i18n/` | `en.json`, `hi.json` — keys in `snake_case` |

### Mobile Architecture Rules

- **SQLite is the source of truth** — screens read from local DB first; sync with API happens in the background
- **Screens use stores** — screens call store actions; stores call services; services call the API or SQLite
- **No axios in screens** — all HTTP calls are inside `src/services/`
- **Secure storage only** — use `expo-secure-store` for JWT tokens and MPIN; never AsyncStorage for credentials
- **Offline-first sync** — queue failed syncs locally and retry when the device reconnects

---

## Web Dashboard Structure (`web/`)

React.js + Vite:

```
web/
├── src/
│   ├── components/       # Reusable UI components (UX4G-based)
│   ├── pages/            # Page-level components
│   ├── services/         # API clients
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Helper functions
│   └── types/            # TypeScript types
├── public/               # Static assets
├── index.html
├── vite.config.ts
└── package.json
```

---

## Database Schema

Core entities (PostgreSQL, managed via Alembic migrations):

| Table | Purpose |
|---|---|
| `workers` | ASHA worker accounts (MPIN auth) |
| `beneficiaries` | Pregnant women, newborns, children |
| `collection_centers` | Health facilities / sub-centers |
| `visit_templates` | Visit type definitions (HBNC, etc.) |
| `visits` | Recorded visit data (answers, audio refs) |
| `sync_logs` | Tracks what data has been synced per device |

---

## API Design Conventions

- **Base path**: `/api/v1/`
- **Authentication**: JWT bearer token in `Authorization` header
- **Mobile sync endpoint**: `POST /mobile/init` — returns all offline data needed by a worker
- **Resource naming**: plural nouns (e.g., `/workers`, `/visits`, `/beneficiaries`)
- **Error responses**: `{ "detail": "Human-readable message" }` with appropriate HTTP status code

---

## Testing Conventions

- **Location**: `backend/tests/` (mirroring `app/` structure where possible)
- **File naming**: `test_<module>.py`
- **Function naming**: `test_<what_is_being_tested>()`
- **Fixtures**: shared in `conftest.py`
- **Coverage focus**: routers, services, and any complex business logic
- Run with: `pytest` (from `backend/` with venv active, or `make test`)
