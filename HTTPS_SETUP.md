# HTTPS Setup Guide for EC2

## Current Status
- ✅ HTTP (port 80) working
- ✅ SSH (port 22) working
- ❌ HTTPS (port 443) not configured

## Prerequisites

1. **Domain Name**: You need a domain pointing to your EC2 instance
   - Example: `voiceofcare.example.com`
   - DNS A record should point to your EC2 public IP

2. **Security Group**: Ensure port 443 is open
   ```bash
   # Check current security group rules
   # AWS Console → EC2 → Security Groups → Your SG → Inbound rules
   # Should have: Port 443, TCP, Source: 0.0.0.0/0
   ```

3. **Certbot Installed**: For Let's Encrypt SSL certificates

---

## Option 1: Let's Encrypt (Recommended - Free SSL)

### Step 1: Install Certbot on EC2

```bash
# SSH into your EC2 instance
ssh ubuntu@your-ec2-ip

# Install certbot
sudo apt update
sudo apt install -y certbot

# Verify installation
certbot --version
```

### Step 2: Stop Nginx Container (Temporarily)

```bash
cd ~/voice-of-care-asha
docker-compose --profile production stop nginx
```

### Step 3: Generate SSL Certificate

```bash
# Replace with your actual domain
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Follow the prompts:
# - Enter email address
# - Agree to terms
# - Choose whether to share email with EFF

# Certificates will be saved to:
# /etc/letsencrypt/live/your-domain.com/fullchain.pem
# /etc/letsencrypt/live/your-domain.com/privkey.pem
```

### Step 4: Copy Certificates to Project

```bash
# Create SSL directory if it doesn't exist
mkdir -p ~/voice-of-care-asha/nginx/ssl

# Copy certificates
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem \
  ~/voice-of-care-asha/nginx/ssl/cert.pem

sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem \
  ~/voice-of-care-asha/nginx/ssl/key.pem

# Set proper permissions
sudo chown $USER:$USER ~/voice-of-care-asha/nginx/ssl/*.pem
chmod 644 ~/voice-of-care-asha/nginx/ssl/cert.pem
chmod 600 ~/voice-of-care-asha/nginx/ssl/key.pem
```

### Step 5: Update Nginx Configuration

The nginx configuration needs to be updated to enable HTTPS. I'll create the updated config for you.

### Step 6: Restart Services

```bash
cd ~/voice-of-care-asha
docker-compose --profile production up -d --build nginx
```

### Step 7: Test HTTPS

```bash
# Test from EC2
curl https://your-domain.com/health

# Test from browser
# Visit: https://your-domain.com
```

### Step 8: Setup Auto-Renewal

```bash
# Test renewal (dry run)
sudo certbot renew --dry-run

# Add cron job for auto-renewal
sudo crontab -e

# Add this line (runs twice daily):
0 0,12 * * * certbot renew --quiet --post-hook "cd /home/ubuntu/voice-of-care-asha && docker-compose --profile production restart nginx"
```

---

## Option 2: Self-Signed Certificate (Testing Only)

⚠️ **Not recommended for production** - Browsers will show security warnings

```bash
# Generate self-signed certificate
cd ~/voice-of-care-asha
mkdir -p nginx/ssl

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/C=IN/ST=State/L=City/O=Organization/CN=your-domain.com"

# Update nginx config and restart
docker-compose --profile production up -d --build nginx
```

---

## Option 3: AWS Certificate Manager (ACM) with Load Balancer

If you want to use AWS ACM, you'll need:
1. Application Load Balancer (ALB)
2. ACM certificate
3. ALB listens on 443, forwards to EC2 on port 80

This is more complex but provides better scalability.

---

## Troubleshooting

### Port 443 Not Open
```bash
# Check if port 443 is listening
sudo netstat -tlnp | grep :443

# Check docker container
docker-compose --profile production ps
docker-compose logs nginx
```

### Certificate Errors
```bash
# Check certificate validity
openssl x509 -in nginx/ssl/cert.pem -text -noout

# Check certificate dates
openssl x509 -in nginx/ssl/cert.pem -noout -dates
```

### DNS Not Resolving
```bash
# Check DNS resolution
nslookup your-domain.com
dig your-domain.com

# Should return your EC2 public IP
```

### Nginx Configuration Errors
```bash
# Test nginx config
docker-compose --profile production exec nginx nginx -t

# View nginx logs
docker-compose logs nginx
```

---

## Security Checklist

- [ ] Port 443 open in EC2 Security Group
- [ ] Domain DNS pointing to EC2 public IP
- [ ] SSL certificates generated and copied
- [ ] Nginx configuration updated
- [ ] HTTPS working (test with curl and browser)
- [ ] HTTP to HTTPS redirect enabled
- [ ] Auto-renewal configured (for Let's Encrypt)
- [ ] Certificate expiry monitoring setup

---

## Quick Commands Reference

```bash
# Check certificate expiry
sudo certbot certificates

# Renew certificates manually
sudo certbot renew

# Restart nginx
cd ~/voice-of-care-asha
docker-compose --profile production restart nginx

# View nginx logs
docker-compose logs -f nginx

# Test HTTPS
curl -I https://your-domain.com
```

---

## Next Steps

1. Choose your SSL option (Let's Encrypt recommended)
2. Follow the steps above
3. Update the nginx configuration (I'll provide the updated config)
4. Test HTTPS connectivity
5. Setup monitoring for certificate expiry

Let me know your domain name and I'll help you configure it!
