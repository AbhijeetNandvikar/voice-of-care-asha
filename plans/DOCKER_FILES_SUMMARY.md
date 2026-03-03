# Docker Configuration Summary

This document summarizes the Docker configuration files added to the Voice of Care (ASHA) project.

## Files Created

### 1. Backend Docker Files

#### `backend/Dockerfile`
- Base image: Python 3.11 slim
- Installs PostgreSQL client and build dependencies
- Copies requirements and installs Python packages
- Runs Alembic migrations on startup
- Starts uvicorn server on port 8000

#### `backend/.dockerignore`
- Excludes Python cache files, virtual environments, and development files
- Reduces Docker image size

### 2. Web Docker Files

#### `web/Dockerfile`
- Multi-stage build for optimized production image
- Stage 1: Builds React app with Node.js
- Stage 2: Serves static files with Nginx
- Final image size is minimal (only built files + nginx)

#### `web/.dockerignore`
- Excludes node_modules, build output, and development files
- Reduces build context size

### 3. Docker Compose Configuration

#### `docker-compose.yml`
Defines three services:

**postgres**:
- PostgreSQL 15 Alpine image
- Persistent volume for data
- Health checks configured
- Port 5432 exposed

**backend**:
- Built from backend/Dockerfile
- Depends on postgres health check
- Environment variables from .env
- Volume mount for development
- Port 8000 exposed

**nginx**:
- Nginx Alpine image
- Reverse proxy configuration
- Serves web dashboard static files
- Ports 80 and 443 exposed
- Depends on backend service

### 4. Nginx Configuration

#### `nginx/nginx.conf`
- Routes `/api/*` to backend service
- Serves web dashboard from `/usr/share/nginx/html`
- SPA routing support (try_files)
- Gzip compression enabled
- Static asset caching (1 year)
- 5-minute timeout for long-running requests
- Health check endpoint at `/health`
- Commented HTTPS configuration for production

### 5. Environment Configuration

#### `.env.example`
Template for environment variables:
- Database credentials
- JWT secret
- AWS credentials and configuration
- S3 bucket names
- Application environment

### 6. Documentation

#### `DOCKER_SETUP.md`
Comprehensive guide covering:
- Prerequisites and quick start
- Service descriptions
- Docker commands (start, stop, logs, rebuild)
- Development workflow
- Production deployment to EC2
- Troubleshooting common issues
- Backup and restore procedures
- Security best practices
- Performance tuning

#### `DOCKER_FILES_SUMMARY.md` (this file)
Summary of all Docker-related files

### 7. Helper Scripts

#### `start.sh`
Quick start script that:
- Checks Docker and Docker Compose installation
- Creates .env from template if missing
- Builds Docker images
- Starts all services
- Displays access points and helpful commands

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Host                          │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Nginx Container (port 80/443)                   │  │
│  │  - Reverse proxy                                 │  │
│  │  - Static file server                            │  │
│  └────────────┬─────────────────────────────────────┘  │
│               │                                         │
│               ├─ /api/* ──────────────────┐            │
│               │                            │            │
│               └─ /* (static) ──────┐      │            │
│                                     │      │            │
│  ┌──────────────────────────────┐  │  ┌───▼──────────┐ │
│  │  Web Static Files            │  │  │  Backend     │ │
│  │  (React build output)        │◄─┘  │  Container   │ │
│  └──────────────────────────────┘     │  (FastAPI)   │ │
│                                        └───┬──────────┘ │
│                                            │            │
│                                        ┌───▼──────────┐ │
│                                        │  PostgreSQL  │ │
│                                        │  Container   │ │
│                                        └──────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Network Flow

1. **Client Request** → Nginx (port 80)
2. **API Requests** (`/api/*`) → Backend (port 8000)
3. **Static Requests** (`/*`) → Web static files
4. **Backend** → PostgreSQL (port 5432)
5. **Backend** → AWS Services (S3, Transcribe, Bedrock)

## Volume Mounts

### Development
- `./backend:/app` - Backend code hot reload
- `./web/dist:/usr/share/nginx/html` - Web static files

### Production
- `postgres_data` - PostgreSQL data persistence
- `./nginx/ssl` - SSL certificates (optional)

## Environment Variables

### Required
- `POSTGRES_PASSWORD` - Database password
- `JWT_SECRET` - JWT token secret
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `S3_AUDIO_BUCKET` - S3 bucket for audio files
- `S3_EXPORTS_BUCKET` - S3 bucket for reports

### Optional
- `AWS_REGION` - AWS region (default: us-east-1)
- `ENVIRONMENT` - Application environment (development/production)

## Usage

### Quick Start
```bash
./start.sh
```

### Manual Start
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env

# Build and start
docker-compose up -d

# View logs
docker-compose logs -f
```

### Stop Services
```bash
docker-compose down
```

### Rebuild After Changes
```bash
docker-compose up -d --build
```

## Benefits of Docker Setup

1. **Consistency**: Same environment across development and production
2. **Isolation**: Services run in isolated containers
3. **Easy Setup**: One command to start entire stack
4. **Portability**: Works on any system with Docker
5. **Scalability**: Easy to add more services or scale existing ones
6. **Development**: Volume mounts enable hot reload
7. **Production Ready**: Optimized images and configurations

## Next Steps

1. Configure `.env` file with your credentials
2. Run `./start.sh` or `docker-compose up -d`
3. Access web dashboard at http://localhost
4. Test API at http://localhost/api/v1
5. View API docs at http://localhost/docs
6. For production deployment, see DOCKER_SETUP.md

## Troubleshooting

### Port Conflicts
If ports 80, 5432, or 8000 are already in use:
- Stop conflicting services
- Or modify ports in docker-compose.yml

### Permission Issues
If you get permission errors:
```bash
sudo docker-compose up -d
```

### Database Connection Issues
Wait for PostgreSQL health check to pass:
```bash
docker-compose logs postgres
```

### Backend Not Starting
Check backend logs:
```bash
docker-compose logs backend
```

## Security Notes

1. **Change default passwords** in .env file
2. **Use strong JWT_SECRET** (random 32+ character string)
3. **Don't commit .env** to version control
4. **Use HTTPS in production** (configure SSL in nginx)
5. **Restrict database access** (don't expose port 5432 publicly)
6. **Use IAM roles** instead of hardcoded AWS credentials when possible

## Performance Considerations

1. **PostgreSQL**: Adjust shared_buffers and work_mem for your workload
2. **Backend**: Increase uvicorn workers for higher concurrency
3. **Nginx**: Enable caching and compression (already configured)
4. **Docker**: Allocate sufficient resources (4GB+ RAM recommended)

## Maintenance

### Backup Database
```bash
docker-compose exec postgres pg_dump -U voice_of_care_user voice_of_care > backup.sql
```

### Restore Database
```bash
docker-compose exec -T postgres psql -U voice_of_care_user voice_of_care < backup.sql
```

### Update Images
```bash
docker-compose pull
docker-compose up -d
```

### Clean Up
```bash
docker system prune -a
```

## Support

For detailed instructions and troubleshooting, see:
- [DOCKER_SETUP.md](DOCKER_SETUP.md) - Complete Docker guide
- [README.md](README.md) - Project overview
- [backend/DATABASE_SETUP.md](backend/DATABASE_SETUP.md) - Database guide
