# Voice of Care (ASHA)

Healthcare technology solution addressing manual paperwork burden on ASHA workers in rural India. This system replaces paper-based health visit registers with an offline-first mobile application that captures voice and structured data, synchronizes with a cloud backend, and uses AI to generate government-compliant reports.

## Problem Statement

ASHA workers in rural India conduct critical health visits but face:
- 2-3 month payment delays due to manual paperwork
- Transcription errors and data loss
- Significant administrative overhead
- Lack of real-time visibility into field activities

## Solution

Voice of Care provides:
1. **Mobile Application**: Offline-first React Native app for recording visits
2. **Backend API**: FastAPI-based cloud service for data sync and AI processing
3. **Web Dashboard**: React.js admin interface for monitoring and reporting
4. **AI Integration**: AWS Transcribe for speech-to-text and AWS Bedrock (Claude) for report generation

## Project Structure

```
voice-of-care/
├── backend/          # FastAPI backend application
│   ├── app/          # Application code
│   │   ├── __init__.py
│   │   ├── main.py   # FastAPI entry point
│   │   └── config.py # Configuration management
│   ├── requirements.txt
│   ├── .env.example
│   └── setup.sh      # Setup script
├── web/              # React.js web dashboard
└── mobile/           # Expo React Native mobile app
```

## Technology Stack

### Backend
- FastAPI (Python web framework)
- SQLAlchemy (ORM)
- Alembic (Database migrations)
- PostgreSQL (Database)
- JWT authentication with bcrypt
- AWS S3, Transcribe, Bedrock

### Web Dashboard
- React.js with Vite
- UX4G Design System
- Recharts for visualization

### Mobile App
- Expo React Native
- SQLite for offline storage
- expo-av for audio recording
- react-i18next for localization

## Getting Started

### Quick Start with Docker (Recommended)

The easiest way to run the entire stack is using Docker Compose:

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Edit .env with your configuration
nano .env

# 3. Build and start all services
docker-compose up -d

# 4. View logs
docker-compose logs -f

# 5. Access the application
# - Web Dashboard: http://localhost
# - Backend API: http://localhost/api/v1
# - API Docs: http://localhost/docs
```

For detailed Docker setup instructions, see [DOCKER_SETUP.md](DOCKER_SETUP.md).

### Manual Setup

#### Backend Setup

```bash
cd backend
chmod +x setup.sh
./setup.sh
source venv/bin/activate
cp .env.example .env
# Edit .env with your configuration

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload
```

The backend API will be available at http://localhost:8000

#### Web Dashboard Setup

```bash
cd web
npm install
npm run dev
```

The web dashboard will be available at http://localhost:5173

#### Mobile App Setup

Coming in subsequent tasks.

## Requirements

### With Docker (Recommended)
- Docker Engine 20.10+
- Docker Compose 2.0+
- AWS Account (for S3, Transcribe, Bedrock)
- 4GB+ RAM available

### Manual Setup
- Python 3.9+
- Node.js 18+
- PostgreSQL 15+
- AWS Account (for S3, Transcribe, Bedrock)

## Features (v1)

- ✅ ASHA worker authentication with MPIN
- ✅ Offline visit recording (HBNC visits)
- ✅ Voice, numeric, and yes/no question types
- ✅ Data synchronization when online
- ✅ Audio transcription (AWS Transcribe)
- ✅ AI-powered report generation (AWS Bedrock)
- ✅ Medical officer web dashboard
- ✅ English and Hindi language support

## Documentation

- [Docker Setup Guide](DOCKER_SETUP.md) - Complete Docker setup and deployment guide
- [Database Setup Guide](backend/DATABASE_SETUP.md) - Database configuration and migrations
- [Requirements Document](.kiro/specs/voice-of-care-asha/requirements.md)
- [Design Document](.kiro/specs/voice-of-care-asha/design.md)
- [Tasks](.kiro/specs/voice-of-care-asha/tasks.md)

## License

This project is developed for the AWS Hackathon 2026.

## Support

For issues and questions, please refer to the project documentation.
