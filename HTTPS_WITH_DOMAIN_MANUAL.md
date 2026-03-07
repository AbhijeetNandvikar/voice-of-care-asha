# HTTPS Setup with Domain Name (Manual Guide)

## Prerequisites

1. **Domain Name**: You own a domain (e.g., `voiceofcare.example.com`)
2. **DNS Configured**: Domain's A record points to your EC2 public IP
3. **Port 443 Open**: EC2 Security Group allows inbound traffic on port 443

---

## Step-by-Step Setup

### Step 1: Configure DNS

Before starting, ensure your domain points to your EC2 instance:

```bash
# Get your EC2 public IP
curl http://checkip.amazonaws.com

# Check DNS resolution (from your local machine or EC2)
nslookup your-domain.com
dig your-domain.com

# Should return your EC2 public IP
```

**How to configure DNS:**
- Go to your domain registrar (GoDaddy, Namecheap, etc.)
- Add an A record:
  - Type: `A`
  - Name: `@` (or subdomain like `api`)
  - Value: Your EC2 public IP
  - TTL: `3600` (or default)

Wait 5-10 minutes for DNS propagation.

---

### Step 2: Open Port 443 in Security Group

1. Go to AWS Console → EC2 → Security Groups
2. Select your instance's security group
3. Click "Edit inbound rules"
4. Add rule:
   - Type: `HTTPS`
   - Protocol: `TCP`
   - Port: `443`
   - Source: `0.0.0.0/0` (or your specific IP range)
5. Save rules

---

### Step 3: Install Certbot

SSH into your EC2 instance:

```bash
ssh ubuntu@your-ec2-ip

# Update package list
sudo apt update

# Install certbot
sudo apt install -y certbot

# Verify installation
certbot --version
```

---

### Step 4: Stop Nginx (Temporarily)

Certbot needs port 80 to verify domain ownership:

```bash
cd ~/voice-of-care-asha

# Stop nginx container
docker-compose --profile production stop nginx

# Verify port 80 is free
sudo netstat -tlnp | grep :80
```

---

### Step 5: Generate SSL Certificate

```bash
# Replace with your actual domain
DOMAIN="your-domain.com"

# Generate certificate
sudo certbot certonly --standalone \
  -d $DOMAIN \
  --non-interactive \
  --agree-tos \
  --email your-email@example.com

# If you have www subdomain too:
sudo certbot certonly --standalone \
  -d $DOMAIN \
  -d www.$DOMAIN \
  --non-interactive \
  --agree-tos \
  --email your-email@example.com
```

**What this does:**
- Validates domain ownership via HTTP challenge
- Generates SSL certificate and private key
- Saves to `/etc/letsencrypt/live/your-domain.com/`

**Certificate files created:**
- `fullchain.pem` - Full certificate chain (use this)
- `privkey.pem` - Private key
- `cert.pem` - Certificate only (don't use)
- `chain.pem` - Intermediate certificates

---

### Step 6: Copy Certificates to Project

```bash
cd ~/voice-of-care-asha

# Create SSL directory
mkdir -p nginx/ssl

# Copy certificates
sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem nginx/ssl/key.pem

# Set ownership
sudo chown $USER:$USER nginx/ssl/*.pem

# Set permissions
chmod 644 nginx/ssl/cert.pem
chmod 600 nginx/ssl/key.pem

# Verify files exist
ls -la nginx/ssl/
```

---

### Step 7: Update Nginx Configuration

```bash
cd ~/voice-of-care-asha

# Backup current config
cp nginx/nginx.conf nginx/nginx.conf.backup

# Use HTTPS-enabled config
cp nginx/nginx-https.conf nginx/nginx.conf

# Optional: Update server_name in config
# Edit nginx/nginx.conf and replace "server_name _;" with "server_name your-domain.com;"
```

**To update server_name (optional but recommended):**

```bash
# Edit the config
nano nginx/nginx.conf

# Find these lines in the HTTPS server block:
#   server_name _;
# Replace with:
#   server_name your-domain.com www.your-domain.com;

# Save and exit (Ctrl+X, Y, Enter)
```

---

### Step 8: Restart Nginx

```bash
cd ~/voice-of-care-asha

# Start nginx with HTTPS
docker-compose --profile production up -d --build nginx

# Check if nginx is running
docker-compose ps nginx

# View logs
docker-compose logs nginx
```

---

### Step 9: Test HTTPS

```bash
# Test from EC2
curl -I https://your-domain.com

# Should return: HTTP/2 200

# Test health endpoint
curl https://your-domain.com/health

# Should return: healthy
```

**Test from browser:**
1. Visit: `https://your-domain.com`
2. Should load without security warnings
3. Check for green padlock in address bar
4. Click padlock → Certificate should show "Let's Encrypt"

---

### Step 10: Setup Auto-Renewal

Let's Encrypt certificates expire after 90 days. Setup automatic renewal:

```bash
# Create renewal script
sudo tee /usr/local/bin/renew-certs.sh > /dev/null << 'EOF'
#!/bin/bash
# Renew Let's Encrypt certificates and update nginx

# Renew certificates
certbot renew --quiet

# Check if renewal was successful
if [ $? -eq 0 ]; then
    # Get domain name
    DOMAIN=$(ls /etc/letsencrypt/live/ | head -n1)
    
    # Copy renewed certificates
    cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" /home/ubuntu/voice-of-care-asha/nginx/ssl/cert.pem
    cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" /home/ubuntu/voice-of-care-asha/nginx/ssl/key.pem
    
    # Restart nginx
    cd /home/ubuntu/voice-of-care-asha
    docker-compose --profile production restart nginx
    
    echo "$(date): Certificates renewed and nginx restarted" >> /var/log/certbot-renewal.log
else
    echo "$(date): Certificate renewal failed" >> /var/log/certbot-renewal.log
fi
EOF

# Make script executable
sudo chmod +x /usr/local/bin/renew-certs.sh

# Test the script (dry run)
sudo certbot renew --dry-run

# Add cron job (runs twice daily at midnight and noon)
(sudo crontab -l 2>/dev/null; echo "0 0,12 * * * /usr/local/bin/renew-certs.sh") | sudo crontab -

# Verify cron job
sudo crontab -l
```

---

## Verification Checklist

- [ ] DNS resolves to EC2 IP: `dig your-domain.com`
- [ ] Port 443 open in Security Group
- [ ] SSL certificates exist: `ls -la nginx/ssl/`
- [ ] Nginx running: `docker-compose ps nginx`
- [ ] HTTPS works: `curl https://your-domain.com/health`
- [ ] Browser shows green padlock
- [ ] HTTP redirects to HTTPS
- [ ] Auto-renewal configured: `sudo crontab -l`

---

## Troubleshooting

### DNS Not Resolving

```bash
# Check DNS from multiple sources
dig @8.8.8.8 your-domain.com  # Google DNS
dig @1.1.1.1 your-domain.com  # Cloudflare DNS

# If not resolving, wait for DNS propagation (up to 48 hours)
# Or check your DNS settings at domain registrar
```

### Certbot Fails

```bash
# Check if port 80 is accessible
curl http://your-domain.com

# Ensure nginx is stopped
docker-compose --profile production stop nginx

# Check what's using port 80
sudo netstat -tlnp | grep :80

# Try certbot again with verbose output
sudo certbot certonly --standalone -d your-domain.com -v
```

### Nginx Won't Start

```bash
# Check nginx logs
docker-compose logs nginx

# Test nginx config
docker-compose run --rm nginx nginx -t

# Check if certificates exist
ls -la nginx/ssl/

# Check permissions
stat nginx/ssl/cert.pem
stat nginx/ssl/key.pem
```

### Certificate Not Trusted

```bash
# Ensure using fullchain.pem, not cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem

# Restart nginx
docker-compose --profile production restart nginx

# Clear browser cache and try again
```

---

## Update Mobile App

After HTTPS is working, update your mobile app:

```typescript
// mobile/src/config.ts or similar
export const API_BASE_URL = 'https://your-domain.com/api/v1';
```

Rebuild and redeploy the mobile app.

---

## Monitoring Certificate Expiry

```bash
# Check certificate expiry
sudo certbot certificates

# Or check the file directly
openssl x509 -in nginx/ssl/cert.pem -noout -dates

# Check renewal log
sudo tail -f /var/log/certbot-renewal.log
```

---

## Renewing Certificate Manually

If auto-renewal fails, renew manually:

```bash
# Stop nginx
cd ~/voice-of-care-asha
docker-compose --profile production stop nginx

# Renew certificate
sudo certbot renew

# Copy certificates
DOMAIN=$(ls /etc/letsencrypt/live/ | head -n1)
sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem nginx/ssl/key.pem
sudo chown $USER:$USER nginx/ssl/*.pem

# Restart nginx
docker-compose --profile production up -d nginx
```

---

## Security Best Practices

### Enable HSTS (Optional)

After confirming HTTPS works, enable HSTS in `nginx/nginx.conf`:

```nginx
# In the HTTPS server block, uncomment:
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

Then restart nginx:
```bash
docker-compose --profile production restart nginx
```

### Redirect HTTP to HTTPS

This is already configured in `nginx/nginx-https.conf`:

```nginx
server {
    listen 80;
    server_name _;
    
    location / {
        return 301 https://$host$request_uri;
    }
}
```

### Test SSL Configuration

Use SSL Labs to test your SSL setup:
```
https://www.ssllabs.com/ssltest/analyze.html?d=your-domain.com
```

Aim for an A or A+ rating.

---

## Summary

**What you did:**
1. ✅ Configured DNS to point to EC2
2. ✅ Opened port 443 in Security Group
3. ✅ Installed Certbot
4. ✅ Generated Let's Encrypt SSL certificate
5. ✅ Configured nginx for HTTPS
6. ✅ Setup automatic certificate renewal

**Your site is now:**
- ✅ Accessible via HTTPS
- ✅ Trusted by browsers (green padlock)
- ✅ Automatically renewing certificates
- ✅ Redirecting HTTP to HTTPS

**Access your site:**
- Web: `https://your-domain.com`
- API: `https://your-domain.com/api/v1`
- Docs: `https://your-domain.com/docs`

**Next steps:**
1. Update mobile app with HTTPS URL
2. Test all functionality
3. Monitor certificate expiry
4. Consider enabling HSTS
