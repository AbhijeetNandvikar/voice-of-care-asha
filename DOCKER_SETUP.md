# Docker Setup Guide for Voice of Care (ASHA)

This guide explains how to run the Voice of Care system using Docker and Docker Compose.

## Prerequisites

- Docker Engine 20.10+ installed
- Docker Compose 2.0+ installed
- AWS credentials configured (for S3, Transcribe, Bedrock)
- At least 4GB RAM available for containers

## Quick Start

### 1. Clone Repository and Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your configuration
nano .env
```

Required environment variables:
- `POSTGRES_PASSWORD`: Database password
- `JWT_SECRET`: Secret key for JWT token generation
- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key
- `AWS_REGION`: AWS region (default: us-east-1)
- `S3_AUDIO_BUCKET`: S3 bucket name for audio files
- `S3_EXPORTS_BUCKET`: S3 bucket name for report exports

### 2. Build and Start Services

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

### 3. Access the Application

- **Web Dashboard**: http://localhost
- **Backend API**: http://localhost/api/v1
- **API Documentation**: http://localhost/docs
- **PostgreSQL**: localhost:5432

## Services

### PostgreSQL Database
- **Container**: voice-of-care-db
- **Port**: 5432
- **Database**: voice_of_care
- **User**: voice_of_care_user
- **Data Volume**: postgres_data

### FastAPI Backend
- **Container**: voice-of-care-backend
- **Port**: 8000 (internal), accessible via nginx at /api/
- **Auto-runs migrations**: Alembic migrations run on startup

### Nginx Reverse Proxy
- **Container**: voice-of-care-nginx
- **Ports**: 80 (HTTP), 443 (HTTPS)
- **Routes**:
  - `/api/*` → Backend API
  - `/docs` → API documentation
  - `/*` → Web dashboard (SPA)

## Docker Commands

### Start Services
```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d backend
```

### Stop Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes database data)
docker-compose down -v
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f postgres
docker-compose logs -f nginx
```

### Rebuild Services
```bash
# Rebuild all services
docker-compose build

# Rebuild specific service
docker-compose build backend

# Rebuild and restart
docker-compose up -d --build
```

### Execute Commands in Containers
```bash
# Access backend shell
docker-compose exec backend bash

# Access PostgreSQL
docker-compose exec postgres psql -U voice_of_care_user -d voice_of_care

# Run Alembic migrations manually
docker-compose exec backend alembic upgrade head

# Run seed scripts
docker-compose exec backend python scripts/seed_hbnc_template.py
docker-compose exec backend python scripts/seed_demo_data.py
```

## Development Workflow

### Backend Development
```bash
# Edit code in ./backend/
# Changes are reflected immediately due to volume mount

# Restart backend to apply changes
docker-compose restart backend

# View backend logs
docker-compose logs -f backend
```

### Web Development
```bash
# For development, run web app locally with hot reload
cd web
npm install
npm run dev

# For production build
npm run build

# Copy build to nginx
docker-compose restart nginx
```

### Database Management
```bash
# Create new migration
docker-compose exec backend alembic revision --autogenerate -m "Description"

# Apply migrations
docker-compose exec backend alembic upgrade head

# Rollback migration
docker-compose exec backend alembic downgrade -1

# View migration history
docker-compose exec backend alembic history
```

## Production Deployment

### 1. Update Environment Variables
```bash
# Use strong passwords and secrets
POSTGRES_PASSWORD=<strong-password>
JWT_SECRET=<random-secret-key>
ENVIRONMENT=production
```

### 2. Configure HTTPS (Optional)
```bash
# Obtain SSL certificates (Let's Encrypt recommended)
mkdir -p nginx/ssl
# Copy cert.pem and key.pem to nginx/ssl/

# Uncomment HTTPS server block in nginx/nginx.conf
```

### 3. Deploy to EC2
```bash
# SSH to EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Install Docker and Docker Compose
sudo apt-get update
sudo apt-get install -y docker.io docker-compose

# Clone repository
git clone <your-repo-url>
cd voice-of-care-asha

# Configure environment
cp .env.example .env
nano .env

# Start services
sudo docker-compose up -d

# Check logs
sudo docker-compose logs -f
```

### 4. Configure AWS IAM
```bash
# Attach IAM role to EC2 instance with policies:
# - AmazonS3FullAccess (or custom policy for specific buckets)
# - AmazonTranscribeFullAccess
# - AmazonBedrockFullAccess

# Remove AWS credentials from .env if using IAM role
```

## Troubleshooting

### Backend won't start
```bash
# Check logs
docker-compose logs backend

# Common issues:
# - Database not ready: Wait for postgres healthcheck
# - Migration errors: Check alembic logs
# - Missing environment variables: Verify .env file
```

### Database connection errors
```bash
# Check postgres is running
docker-compose ps postgres

# Check postgres logs
docker-compose logs postgres

# Test connection
docker-compose exec postgres psql -U voice_of_care_user -d voice_of_care
```

### Nginx 502 Bad Gateway
```bash
# Check backend is running
docker-compose ps backend

# Check backend logs
docker-compose logs backend

# Verify backend is accessible
docker-compose exec nginx curl http://backend:8000/health
```

### Port conflicts
```bash
# If ports 80, 443, 5432, or 8000 are in use:
# 1. Stop conflicting services
# 2. Or modify ports in docker-compose.yml
```

## Monitoring

### Health Checks
```bash
# Nginx health check
curl http://localhost/health

# Backend health check
curl http://localhost/api/v1/health

# Database health check
docker-compose exec postgres pg_isready -U voice_of_care_user
```

### Resource Usage
```bash
# View container stats
docker stats

# View disk usage
docker system df

# Clean up unused resources
docker system prune -a
```

## Backup and Restore

### Backup Database
```bash
# Create backup
docker-compose exec postgres pg_dump -U voice_of_care_user voice_of_care > backup_$(date +%Y%m%d).sql

# Or use docker volume backup
docker run --rm -v voice-of-care-asha_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz /data
```

### Restore Database
```bash
# Restore from SQL dump
docker-compose exec -T postgres psql -U voice_of_care_user voice_of_care < backup.sql

# Or restore volume
docker run --rm -v voice-of-care-asha_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres_backup.tar.gz -C /
```

## Security Best Practices

1. **Change default passwords**: Update POSTGRES_PASSWORD and JWT_SECRET
2. **Use HTTPS in production**: Configure SSL certificates
3. **Restrict database access**: Don't expose port 5432 publicly
4. **Use IAM roles**: Prefer IAM roles over hardcoded AWS credentials
5. **Regular updates**: Keep Docker images updated
6. **Backup regularly**: Automate database backups
7. **Monitor logs**: Set up log aggregation and monitoring

## Performance Tuning

### PostgreSQL
```bash
# Edit postgresql.conf in container or use environment variables
# Increase shared_buffers, work_mem, etc.
```

### Backend
```bash
# Adjust worker count in Dockerfile CMD
CMD uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Nginx
```bash
# Adjust worker_connections in nginx.conf
# Enable caching for static assets
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [PostgreSQL Docker](https://hub.docker.com/_/postgres)
- [Nginx Docker](https://hub.docker.com/_/nginx)
