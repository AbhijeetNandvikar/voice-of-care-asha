# Technology Stack

## Backend
- **Framework**: FastAPI (Python 3.9+)
- **ORM**: SQLAlchemy with Alembic migrations
- **Database**: PostgreSQL 15
- **Authentication**: JWT (python-jose) + bcrypt for password/MPIN hashing
- **AWS Services**: S3 (storage), Transcribe (STT), Bedrock (Claude for reports)
- **Excel Generation**: openpyxl
- **Testing**: pytest, pytest-asyncio, httpx

## Web Dashboard
- **Framework**: React.js with Vite
- **Design System**: UX4G (loaded via CDN)
- **Charts**: Recharts
- **HTTP Client**: Axios

## Mobile App
- **Framework**: Expo React Native (managed workflow, Android only)
- **State Management**: Zustand
- **Local Database**: expo-sqlite
- **Audio**: expo-av (recording/playback)
- **TTS**: expo-speech
- **i18n**: react-i18next (English + Hindi)

## Infrastructure
- **Containerization**: Docker + docker-compose
- **Reverse Proxy**: Nginx
- **Deployment**: AWS EC2 (single server)
- **Storage**: AWS S3 (audio files + reports)

## Common Commands

### Backend
```bash
# Setup
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env

# Database migrations
alembic upgrade head
alembic revision --autogenerate -m "description"

# Run development server
uvicorn app.main:app --reload

# Run tests (only when requested)
pytest
pytest -v  # verbose
pytest tests/test_auth_service.py  # specific file
```

### Docker (Full Stack)
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
docker-compose logs -f backend

# Stop services
docker-compose down

# Rebuild after code changes
docker-compose up -d --build
```

### Web Dashboard
```bash
cd web
npm install
npm run dev      # development server
npm run build    # production build
```

## Code Style Conventions
- **Python**: Follow PEP 8, use type hints where appropriate
- **Imports**: Absolute imports from `app.*` for backend modules
- **Models**: SQLAlchemy ORM models in `app/models/`
- **Schemas**: Pydantic models in `app/schemas/` for request/response validation
- **Services**: Business logic in `app/services/`
- **Routers**: API endpoints in `app/routers/`
- **Testing**: Do NOT run tests automatically after changes - only when explicitly requested
- **Datetime**: Use `datetime.now(UTC)` for timezone-aware timestamps
- **Database Sessions**: Use dependency injection with `Depends(get_db)`
