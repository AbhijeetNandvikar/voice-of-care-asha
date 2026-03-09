---
inclusion: always
---

# Technology Stack

## Backend

- **Framework**: FastAPI (Python 3.9+)
- **ORM**: SQLAlchemy 2.0 (async-compatible)
- **Database**: PostgreSQL 15
- **Migrations**: Alembic
- **Authentication**: JWT with python-jose; bcrypt for password hashing; MPIN (4-digit PIN) for ASHA workers on mobile
- **Cloud Services**: AWS S3 (audio + report storage), AWS Transcribe (speech-to-text), AWS Bedrock (Claude — report generation)
- **Testing**: pytest, pytest-asyncio, httpx

## Mobile App

- **Framework**: Expo React Native (Expo SDK ~55)
- **Language**: TypeScript (strict mode)
- **Navigation**: React Navigation — native-stack + bottom-tabs
- **State Management**: Zustand
- **Offline Storage**: expo-sqlite (source of truth when offline)
- **Audio Recording**: expo-av
- **Localization**: i18next + react-i18next (English and Hindi)
- **Secure Storage**: expo-secure-store (JWT tokens, MPIN)
- **HTTP Client**: axios

## Web Dashboard

- **Framework**: React.js with Vite
- **Design System**: UX4G (Government of India design system)
- **Charts**: Recharts

## Infrastructure

- **Containerization**: Docker + Docker Compose
- **Web Server**: Nginx (production reverse proxy)
- **Database**: PostgreSQL 15 (Docker container)

---

## Coding Conventions

### Backend (Python / FastAPI)

- All route handlers are **async**; use `await` for all I/O operations
- Follow **layered architecture**: `routers/ → services/ → models/`; routers must not contain business logic
- Use **Pydantic schemas** for all request bodies and responses; never return raw ORM models from endpoints
- Use `Depends()` for dependency injection (DB sessions, current user, etc.)
- **Retry logic**: External AWS calls (Transcribe, Bedrock, S3) should use retry with exponential backoff; wrap in try/except and surface errors cleanly to callers
- **Error handling**: Raise `HTTPException` with meaningful status codes and detail messages; do not let unhandled exceptions reach the client
- Use `pydantic-settings` (via `config.py`) for all environment variable access; never call `os.environ` directly in route/service code

### Mobile App (TypeScript / React Native)

- All screens are in `src/screens/`; all reusable UI in `src/components/`
- **Offline-first**: SQLite is the source of truth; API calls sync data, never bypass local storage
- Zustand stores are the single source of state; screens read from stores and dispatch store actions
- Use `expo-secure-store` for any sensitive data (tokens, MPIN); never use AsyncStorage for credentials
- API calls go through service files in `src/services/`; screens must not call axios directly
- Handle network failures gracefully — queue failed syncs and retry on next online event

### Web Dashboard (React / TypeScript)

- Use UX4G components wherever available for consistent government design compliance
- API calls go through `src/services/`; pages must not call axios/fetch directly

---

## Common Commands

### Docker (Recommended)

```bash
# Development
make dev-backend              # Start postgres + backend
make dev-web                  # Start web dev server
make dev                      # Start both (backend bg, web fg)

# Production
make prod-build               # Build production images
make prod                     # Start full stack with nginx
make prod-down                # Stop production stack

# Data seeding
make seed                     # Seed data (safe, skips existing)
make seed-reset               # Wipe and re-seed

# Utilities
make logs                     # Tail backend logs
make down                     # Stop all containers
make ps                       # Show container status
```

### Backend (Manual)

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload          # Start dev server
alembic upgrade head                   # Run migrations
alembic revision --autogenerate -m ""  # Create migration
pytest                                 # Run tests
python scripts/seed_data.py            # Seed data
```

### Mobile App

```bash
cd mobile
npm start          # Start Expo dev server
npm run android    # Run on Android
npm run ios        # Run on iOS
```

### Web Dashboard

```bash
cd web
npm run dev        # Start Vite dev server
npm run build      # Build for production
```

---

## Environment Configuration

- **Backend**: `backend/.env` — `DATABASE_URL`, `JWT_SECRET`, AWS credentials
- **Mobile**: `mobile/.env` — `API_BASE_URL`
- **Docker**: root `.env` — `POSTGRES_PASSWORD`, `JWT_SECRET`, AWS config
- See `.env.example` files for required variables; never commit real secrets

## AWS Services Configuration

- **Region**: `ap-south-1` (Mumbai) — chosen for data residency compliance
- **S3**: Separate buckets for audio files and generated reports
- **Bedrock Model**: `anthropic.claude-3-sonnet-20240229-v1:0` — used for HBNC report generation
- **Transcribe**: Automatic language detection (Hindi + English)
