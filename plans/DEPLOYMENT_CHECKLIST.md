# Deployment Checklist for Voice of Care (ASHA)

Use this checklist to ensure a smooth deployment to production.

## Pre-Deployment

### 1. Environment Configuration
- [ ] Copy `.env.example` to `.env`
- [ ] Set strong `POSTGRES_PASSWORD` (16+ characters)
- [ ] Set strong `JWT_SECRET` (32+ random characters)
- [ ] Configure AWS credentials (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
- [ ] Set correct `AWS_REGION`
- [ ] Create S3 buckets and set names in `.env`
- [ ] Set `ENVIRONMENT=production`

### 2. AWS Setup
- [ ] Create S3 bucket for audio files (private access)
- [ ] Create S3 bucket for report exports (private access)
- [ ] Configure S3 lifecycle policies (archive to Glacier after 90 days)
- [ ] Enable S3 versioning on both buckets
- [ ] Create IAM role for EC2 with required permissions:
  - S3 read/write access
  - AWS Transcribe access
  - AWS Bedrock access
- [ ] Request AWS Bedrock model access (Claude 3.5 Sonnet)
- [ ] Check AWS service quotas and request increases if needed

### 3. EC2 Instance Setup
- [ ] Launch EC2 t3.small instance (Ubuntu 22.04 LTS)
- [ ] Configure security group:
  - Port 22 (SSH) - Your IP only
  - Port 80 (HTTP) - 0.0.0.0/0
  - Port 443 (HTTPS) - 0.0.0.0/0
- [ ] Attach IAM role to EC2 instance
- [ ] Allocate and associate Elastic IP (optional but recommended)
- [ ] Configure domain name DNS (if using custom domain)

### 4. Code Preparation
- [ ] Commit all changes to Git
- [ ] Tag release version
- [ ] Build and test locally with Docker
- [ ] Run all tests and ensure they pass
- [ ] Review and update documentation

## Deployment Steps

### 1. Server Setup
```bash
# SSH to EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker
sudo apt-get install -y docker.io

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker ubuntu
newgrp docker

# Verify installations
docker --version
docker-compose --version
```

### 2. Deploy Application
```bash
# Clone repository
git clone <your-repo-url>
cd voice-of-care-asha

# Copy environment file
cp .env.example .env
nano .env  # Edit with production values

# Build and start services
docker-compose build
docker-compose up -d

# Check logs
docker-compose logs -f
```

### 3. Database Setup
```bash
# Migrations should run automatically, but verify
docker-compose exec backend alembic current

# Seed HBNC template
docker-compose exec backend python scripts/seed_hbnc_template.py

# Seed demo data (optional)
docker-compose exec backend python scripts/seed_demo_data.py
```

### 4. SSL/HTTPS Setup (Recommended)
```bash
# Install Certbot
sudo apt-get install -y certbot

# Obtain SSL certificate
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates
sudo mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem

# Update nginx.conf to enable HTTPS
# Uncomment HTTPS server block in nginx/nginx.conf

# Restart nginx
docker-compose restart nginx

# Set up auto-renewal
sudo crontab -e
# Add: 0 0 * * * certbot renew --quiet && docker-compose restart nginx
```

## Post-Deployment Verification

### 1. Service Health Checks
- [ ] Check all containers are running: `docker-compose ps`
- [ ] Verify PostgreSQL is healthy: `docker-compose exec postgres pg_isready`
- [ ] Test backend health: `curl http://your-domain/api/v1/health`
- [ ] Test nginx health: `curl http://your-domain/health`

### 2. API Testing
- [ ] Access API docs: `http://your-domain/docs`
- [ ] Test login endpoint with demo credentials
- [ ] Test mobile init endpoint
- [ ] Test sync endpoint with sample data
- [ ] Test report generation endpoint

### 3. Web Dashboard Testing
- [ ] Access web dashboard: `http://your-domain`
- [ ] Test login with medical officer credentials
- [ ] Verify dashboard loads correctly
- [ ] Test navigation to all pages
- [ ] Test data table pagination and search
- [ ] Test report generation and download

### 4. AWS Integration Testing
- [ ] Upload test audio file to S3
- [ ] Verify transcription job is created
- [ ] Test Claude report generation
- [ ] Verify presigned URLs work

### 5. Mobile App Testing
- [ ] Update mobile app API base URL to production
- [ ] Test login and MPIN setup
- [ ] Test initialization and data download
- [ ] Test visit recording and sync
- [ ] Verify data appears in web dashboard

## Monitoring Setup

### 1. Logging
```bash
# Set up log rotation
sudo nano /etc/docker/daemon.json
# Add:
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}

# Restart Docker
sudo systemctl restart docker
```

### 2. Monitoring Commands
```bash
# View container stats
docker stats

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f postgres
docker-compose logs -f nginx

# Check disk usage
df -h
docker system df
```

### 3. Alerts (Optional)
- [ ] Set up CloudWatch alarms for EC2 metrics
- [ ] Configure SNS notifications for critical alerts
- [ ] Set up log aggregation (CloudWatch Logs or ELK)

## Backup Setup

### 1. Database Backup
```bash
# Create backup script
cat > /home/ubuntu/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
docker-compose exec -T postgres pg_dump -U voice_of_care_user voice_of_care > $BACKUP_DIR/backup_$DATE.sql
# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
EOF

chmod +x /home/ubuntu/backup.sh

# Schedule daily backups
crontab -e
# Add: 0 2 * * * /home/ubuntu/backup.sh
```

### 2. S3 Backup
- [ ] Enable S3 versioning (already done in pre-deployment)
- [ ] Configure S3 lifecycle policies for archival
- [ ] Set up cross-region replication (optional)

## Security Hardening

### 1. Firewall Configuration
```bash
# Enable UFW
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. SSH Hardening
```bash
# Disable password authentication
sudo nano /etc/ssh/sshd_config
# Set: PasswordAuthentication no
sudo systemctl restart sshd
```

### 3. Application Security
- [ ] Verify JWT_SECRET is strong and unique
- [ ] Verify database password is strong
- [ ] Ensure .env file has restricted permissions: `chmod 600 .env`
- [ ] Verify AWS credentials are not in .env (use IAM role)
- [ ] Enable HTTPS and redirect HTTP to HTTPS
- [ ] Set up rate limiting in nginx (optional)

## Performance Optimization

### 1. Database Tuning
```bash
# Adjust PostgreSQL settings if needed
docker-compose exec postgres psql -U voice_of_care_user -d voice_of_care
# ALTER SYSTEM SET shared_buffers = '256MB';
# ALTER SYSTEM SET work_mem = '16MB';
# SELECT pg_reload_conf();
```

### 2. Backend Scaling
```bash
# Increase uvicorn workers in backend/Dockerfile
# CMD uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### 3. Nginx Caching
- [ ] Verify static asset caching is enabled (already configured)
- [ ] Consider adding API response caching for read-heavy endpoints

## Rollback Plan

### If Deployment Fails
```bash
# Stop services
docker-compose down

# Restore previous version
git checkout <previous-tag>

# Rebuild and restart
docker-compose build
docker-compose up -d

# Restore database if needed
docker-compose exec -T postgres psql -U voice_of_care_user voice_of_care < backup.sql
```

## Documentation Updates

- [ ] Update README.md with production URL
- [ ] Document any production-specific configurations
- [ ] Update API documentation with production endpoints
- [ ] Create user guides for ASHA workers and medical officers
- [ ] Document troubleshooting procedures

## Final Checklist

- [ ] All services are running and healthy
- [ ] API endpoints are accessible and working
- [ ] Web dashboard is accessible and functional
- [ ] Mobile app can connect and sync data
- [ ] AWS integrations are working (S3, Transcribe, Bedrock)
- [ ] HTTPS is configured and working
- [ ] Backups are scheduled and tested
- [ ] Monitoring is set up
- [ ] Security hardening is complete
- [ ] Documentation is updated
- [ ] Team is trained on deployment and operations

## Support Contacts

- **Technical Lead**: [Name] - [Email]
- **DevOps**: [Name] - [Email]
- **AWS Support**: [Account ID]

## Useful Commands

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart backend

# View logs
docker-compose logs -f

# Check service status
docker-compose ps

# Update and restart
git pull
docker-compose up -d --build

# Database backup
docker-compose exec postgres pg_dump -U voice_of_care_user voice_of_care > backup.sql

# Database restore
docker-compose exec -T postgres psql -U voice_of_care_user voice_of_care < backup.sql

# Clean up
docker system prune -a
```

## Notes

- Keep this checklist updated as deployment procedures evolve
- Document any issues encountered and their solutions
- Review and update security measures regularly
- Monitor AWS costs and optimize as needed
- Schedule regular maintenance windows for updates
