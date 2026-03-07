# HTTPS Troubleshooting Guide

## Common Issues and Solutions

### 1. Port 443 Not Accessible

**Symptom:** Cannot connect to https://your-domain.com

**Solution:**
```bash
# Check if port 443 is open in EC2 Security Group
# AWS Console → EC2 → Security Groups → Your SG → Inbound rules

# Add rule if missing:
# Type: HTTPS
# Protocol: TCP
# Port: 443
# Source: 0.0.0.0/0 (or your specific IP range)
```

**Verify:**
```bash
# From another machine
telnet your-ec2-ip 443

# Or use nmap
nmap -p 443 your-ec2-ip
```

---

### 2. DNS Not Resolving

**Symptom:** Domain doesn't point to EC2 instance

**Check DNS:**
```bash
# Check what IP your domain resolves to
nslookup your-domain.com
dig your-domain.com

# Check your EC2 public IP
curl http://checkip.amazonaws.com
```

**Solution:**
- Update DNS A record to point to EC2 public IP
- Wait for DNS propagation (can take up to 48 hours, usually minutes)
- Use `dig @8.8.8.8 your-domain.com` to check Google's DNS

---

### 3. Certificate Generation Failed

**Symptom:** Certbot fails with error

**Common Causes:**
1. Port 80 not accessible (certbot needs it for validation)
2. Domain doesn't resolve to this server
3. Another service using port 80

**Solution:**
```bash
# Stop all services using port 80
docker-compose --profile production stop nginx
sudo systemctl stop apache2 || true
sudo systemctl stop nginx || true

# Check what's using port 80
sudo netstat -tlnp | grep :80
sudo lsof -i :80

# Try certbot again
sudo certbot certonly --standalone -d your-domain.com
```

---

### 4. Nginx Won't Start

**Symptom:** Nginx container exits immediately

**Check logs:**
```bash
docker-compose logs nginx
```

**Common Issues:**

**A. Certificate files missing:**
```bash
# Check if certificates exist
ls -la nginx/ssl/

# Should see:
# cert.pem
# key.pem
```

**B. Configuration syntax error:**
```bash
# Test nginx config
docker-compose --profile production run --rm nginx nginx -t

# If error, check nginx.conf syntax
```

**C. Port already in use:**
```bash
# Check what's using port 443
sudo netstat -tlnp | grep :443

# Stop conflicting service
sudo systemctl stop <service-name>
```

---

### 5. Certificate Expired

**Symptom:** Browser shows "Certificate expired" error

**Check expiry:**
```bash
sudo certbot certificates

# Or check certificate file
openssl x509 -in nginx/ssl/cert.pem -noout -dates
```

**Renew certificate:**
```bash
# Manual renewal
sudo certbot renew

# Copy renewed certificates
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem

# Restart nginx
docker-compose --profile production restart nginx
```

---

### 6. Mixed Content Warnings

**Symptom:** Browser console shows "Mixed Content" errors

**Cause:** Page loaded over HTTPS but resources loaded over HTTP

**Solution:**
- Ensure all API calls use HTTPS
- Update web app to use relative URLs or HTTPS URLs
- Check `VITE_API_BASE_URL` in web app build

---

### 7. SSL Handshake Failed

**Symptom:** `SSL_ERROR_RX_RECORD_TOO_LONG` or similar

**Possible Causes:**
1. Nginx not listening on 443
2. Certificate/key mismatch
3. Wrong certificate format

**Debug:**
```bash
# Test SSL connection
openssl s_client -connect your-domain.com:443 -servername your-domain.com

# Check nginx is listening
docker-compose exec nginx netstat -tlnp | grep :443

# Verify certificate and key match
openssl x509 -noout -modulus -in nginx/ssl/cert.pem | openssl md5
openssl rsa -noout -modulus -in nginx/ssl/key.pem | openssl md5
# Both should output the same hash
```

---

### 8. Auto-Renewal Not Working

**Symptom:** Certificate expires despite cron job

**Check cron:**
```bash
# View cron jobs
sudo crontab -l

# Check renewal log
sudo tail -f /var/log/certbot-renewal.log

# Test renewal (dry run)
sudo certbot renew --dry-run
```

**Fix:**
```bash
# Ensure renewal script is executable
sudo chmod +x /usr/local/bin/renew-certs.sh

# Test renewal script manually
sudo /usr/local/bin/renew-certs.sh

# Re-add cron job if missing
(sudo crontab -l 2>/dev/null; echo "0 0,12 * * * /usr/local/bin/renew-certs.sh >> /var/log/certbot-renewal.log 2>&1") | sudo crontab -
```

---

### 9. HTTP Not Redirecting to HTTPS

**Symptom:** Can access site via HTTP but not redirected to HTTPS

**Check nginx config:**
```bash
# Ensure HTTP server block has redirect
docker-compose exec nginx cat /etc/nginx/nginx.conf | grep -A 5 "listen 80"

# Should see:
# return 301 https://$host$request_uri;
```

**Fix:**
```bash
# Use the HTTPS-enabled config
cp nginx/nginx-https.conf nginx/nginx.conf
docker-compose --profile production restart nginx
```

---

### 10. Certificate Not Trusted

**Symptom:** Browser shows "Not Secure" or certificate warning

**Possible Causes:**
1. Self-signed certificate (expected for testing)
2. Certificate chain incomplete
3. Wrong certificate file

**For Let's Encrypt:**
```bash
# Ensure using fullchain.pem, not cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem

# Restart nginx
docker-compose --profile production restart nginx
```

**For Self-Signed (testing only):**
- Browser warnings are expected
- Add exception in browser
- Not suitable for production

---

## Diagnostic Commands

### Check Service Status
```bash
# Check all containers
docker-compose --profile production ps

# Check nginx specifically
docker-compose ps nginx

# View nginx logs
docker-compose logs -f nginx
```

### Test Connectivity
```bash
# Test HTTP
curl -I http://your-domain.com

# Test HTTPS
curl -I https://your-domain.com

# Test with verbose SSL info
curl -vI https://your-domain.com
```

### Check Certificates
```bash
# View certificate details
openssl x509 -in nginx/ssl/cert.pem -text -noout

# Check expiry date
openssl x509 -in nginx/ssl/cert.pem -noout -dates

# Verify certificate chain
openssl verify -CAfile nginx/ssl/cert.pem nginx/ssl/cert.pem
```

### Check Ports
```bash
# Check what's listening on 443
sudo netstat -tlnp | grep :443

# Check from outside (replace with your IP)
nmap -p 443 your-ec2-ip
```

---

## Emergency Rollback

If HTTPS is causing issues and you need to quickly revert to HTTP:

```bash
cd ~/voice-of-care-asha

# Restore original config
cp nginx/nginx.conf.backup nginx/nginx.conf

# Restart nginx
docker-compose --profile production restart nginx

# Verify HTTP works
curl http://your-domain.com/health
```

---

## Getting Help

If you're still stuck:

1. **Check logs:**
   ```bash
   docker-compose logs nginx
   sudo tail -f /var/log/letsencrypt/letsencrypt.log
   ```

2. **Verify setup:**
   ```bash
   # Domain resolves correctly
   dig your-domain.com
   
   # Port 443 open
   sudo netstat -tlnp | grep :443
   
   # Certificates exist
   ls -la nginx/ssl/
   
   # Nginx config valid
   docker-compose run --rm nginx nginx -t
   ```

3. **Test from outside:**
   - Use https://www.ssllabs.com/ssltest/ to test your SSL setup
   - Use https://dnschecker.org/ to verify DNS propagation

4. **Common quick fixes:**
   ```bash
   # Restart everything
   docker-compose --profile production restart
   
   # Rebuild nginx
   docker-compose --profile production up -d --build nginx
   
   # Check EC2 security group in AWS Console
   ```
