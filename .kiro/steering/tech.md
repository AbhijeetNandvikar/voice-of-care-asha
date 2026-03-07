# Technology Stack

## Backend
- **Framework**: FastAPI (Python 3.9+)
- **ORM**: SQLAlchemy 2.0
- **Database**: PostgreSQL 15
- **Migrations**: Alembic
- **Authentication**: JWT with python-jose, bcrypt for password hashing
- **Cloud Services**: AWS S3, AWS Transcribe, AWS Bedrock (Claude 3 Sonnet)
- **Testing**: pytest, pytest-asyncio, httpx

## Mobile App
- **Framework**: Expo React Native (Expo SDK ~55)
- **Language**: TypeScript
- **Navigation**: React Navigation (native-stack, bottom-tabs)
- **State Management**: Zustand
- **Offline Storage**: expo-sqlite
- **Audio**: expo-av
- **Localization**: i18next, react-i18next
- **Secure Storage**: expo-secure-store
- **HTTP Client**: axios

## Web Dashboard
- **Framework**: React.js with Vite
- **Design System**: UX4G
- **Charts**: Recharts

## Infrastructure
- **Containerization**: Docker, Docker Compose
- **Web Server**: Nginx (production proxy)
- **Database**: PostgreSQL 15 (Docker container)

## Common Commands

### Docker (Recommended)
```bash
# Development (backend only)
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

### Backend (Manual Setup)
```bash
cd backend
source venv/bin/activate      # Activate virtual environment
uvicorn app.main:app --reload # Start dev server
alembic upgrade head          # Run migrations
alembic revision --autogenerate -m "message"  # Create migration
pytest                        # Run tests
python scripts/seed_data.py   # Seed data
```

### Mobile App
```bash
cd mobile
npm start                     # Start Expo dev server
npm run android               # Run on Android
npm run ios                   # Run on iOS
```

### Web Dashboard
```bash
cd web
npm run dev                   # Start Vite dev server
npm run build                 # Build for production
```

## Environment Configuration
- Backend: `.env` file in `backend/` directory
- Mobile: `.env` file in `mobile/` directory
- Docker: `.env` file in project root
- See `.env.example` files for required variables

## AWS Services Configuration
- **Region**: ap-south-1 (Mumbai)
- **S3 Buckets**: Separate buckets for audio files and reports
- **Bedrock Model**: anthropic.claude-3-sonnet-20240229-v1:0
- **Transcribe**: Automatic language detection
