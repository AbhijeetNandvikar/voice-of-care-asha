# HTTPS Setup Without Domain Name

## Overview

If you don't have a domain name, you can still enable HTTPS using a self-signed certificate with your EC2 IP address. However, this comes with limitations.

---

## Quick Setup

### Option 1: Automated Script (Recommended)

```bash
# SSH into your EC2 instance
ssh ubuntu@your-ec2-ip

# Navigate to project
cd ~/voice-of-care-asha

# Make script executable
chmod +x setup-https-no-domain.sh

# Run setup
bash setup-https-no-domain.sh
```

### Option 2: Manual Setup

```bash
# Get your EC2 public IP
PUBLIC_IP=$(curl -s http://checkip.amazonaws.com)
echo "Your IP: $PUBLIC_IP"

# Create SSL directory
mkdir -p ~/voice-of-care-asha/nginx/ssl
cd ~/voice-of-care-asha

# Generate self-signed certificate (valid for 1 year)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/C=IN/ST=State/L=City/O=VoiceOfCare/CN=$PUBLIC_IP" \
  -addext "subjectAltName=IP:$PUBLIC_IP"

# Set permissions
chmod 644 nginx/ssl/cert.pem
chmod 600 nginx/ssl/key.pem

# Backup current config
cp nginx/nginx.conf nginx/nginx.conf.backup

# Enable HTTPS config
cp nginx/nginx-https.conf nginx/nginx.conf

# Restart nginx
docker-compose --profile production up -d --build nginx

# Test
curl -k https://$PUBLIC_IP/health
```

---

## Limitations & Considerations

### ⚠️ Browser Warnings
- Browsers will show "Your connection is not private" warning
- Users must manually accept the security exception
- Not suitable for public-facing production sites

### ⚠️ Mobile App Issues
- React Native may reject self-signed certificates by default
- Requires additional configuration (see below)
- Not recommended for production apps

### ⚠️ No Auto-Renewal
- Certificate expires after 365 days
- Must manually regenerate and redeploy
- No automated renewal like Let's Encrypt

### ⚠️ Trust Issues
- Certificate not trusted by browsers/devices
- Each user must manually trust the certificate
- Poor user experience

---

## Accessing Your Site

### Web Browser

1. **Visit:** `https://YOUR_EC2_IP`

2. **You'll see a warning:**
   - Chrome: "Your connection is not private"
   - Firefox: "Warning: Potential Security Risk Ahead"
   - Safari: "This Connection Is Not Private"

3. **Proceed anyway:**
   - Chrome: Click "Advanced" → "Proceed to [IP] (unsafe)"
   - Firefox: Click "Advanced" → "Accept the Risk and Continue"
   - Safari: Click "Show Details" → "visit this website"

4. **Site should load** (you may need to accept the warning each time)

---

## Mobile App Configuration

### React Native (Expo) - Development Only

For development/testing with self-signed certificates:

#### Android

**Option 1: Disable SSL Verification (Development Only)**

```typescript
// src/services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://YOUR_EC2_IP/api/v1',
  timeout: 10000,
  // WARNING: Only for development!
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
});
```

**Option 2: Add Certificate to Android (Better)**

1. Export certificate from server:
```bash
# On EC2
scp ubuntu@your-ec2-ip:~/voice-of-care-asha/nginx/ssl/cert.pem ./server-cert.pem
```

2. Add to Android app:
```bash
# In mobile/android/app/src/main/res/xml/network_security_config.xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config>
        <trust-anchors>
            <certificates src="system" />
            <certificates src="user" />
        </trust-anchors>
    </base-config>
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">YOUR_EC2_IP</domain>
        <trust-anchors>
            <certificates src="@raw/server_cert"/>
        </trust-anchors>
    </domain-config>
</network-security-config>
```

3. Update AndroidManifest.xml:
```xml
<application
    android:networkSecurityConfig="@xml/network_security_config"
    ...>
```

**⚠️ WARNING:** Never disable SSL verification in production!

---

## When to Use This Approach

### ✅ Good For:
- Development and testing
- Internal tools (not public-facing)
- Proof of concept / demos
- Learning and experimentation
- Temporary setups

### ❌ Not Good For:
- Production applications
- Public-facing websites
- Mobile apps in app stores
- Sites handling sensitive data
- Professional deployments

---

## Better Alternatives

### 1. Get a Free Domain Name

**Free Options:**
- Freenom: .tk, .ml, .ga, .cf, .gq domains (free)
- DuckDNS: Free subdomain (yourname.duckdns.org)
- No-IP: Free dynamic DNS

**Cheap Options ($1-10/year):**
- Namecheap
- GoDaddy
- Google Domains
- Cloudflare

**Then use Let's Encrypt for free SSL!**

### 2. Use AWS Services

**Option A: Route 53 + ACM**
- Register domain in Route 53 (~$12/year)
- Get free SSL certificate from ACM
- Use with Application Load Balancer

**Option B: CloudFront + ACM**
- Use CloudFront as CDN
- Get free SSL certificate from ACM
- Point to your EC2 instance

### 3. Use Cloudflare (Recommended)

1. Get any domain (even free ones work)
2. Point domain to Cloudflare nameservers
3. Enable Cloudflare proxy (orange cloud)
4. Get free SSL from Cloudflare
5. Point to your EC2 IP

**Benefits:**
- Free SSL certificate
- DDoS protection
- CDN (faster loading)
- Analytics

---

## Troubleshooting

### Certificate Not Working

```bash
# Check certificate was generated
ls -la ~/voice-of-care-asha/nginx/ssl/
# Should see: cert.pem and key.pem

# Verify certificate
openssl x509 -in ~/voice-of-care-asha/nginx/ssl/cert.pem -text -noout

# Check nginx is using it
docker-compose exec nginx cat /etc/nginx/nginx.conf | grep ssl_certificate
```

### Port 443 Not Accessible

```bash
# Check Security Group in AWS Console
# Ensure port 443 is open: 0.0.0.0/0

# Check nginx is listening
docker-compose exec nginx netstat -tlnp | grep :443

# Test from outside
curl -k https://YOUR_EC2_IP/health
```

### Browser Still Shows HTTP

```bash
# Check if HTTP redirects to HTTPS
curl -I http://YOUR_EC2_IP
# Should see: Location: https://...

# If not, check nginx config
docker-compose exec nginx cat /etc/nginx/nginx.conf | grep -A 5 "listen 80"
```

### Mobile App Can't Connect

```bash
# Test from mobile device browser first
# Visit: https://YOUR_EC2_IP
# Accept certificate warning

# If browser works but app doesn't:
# - Check app SSL configuration
# - Verify API URL is correct
# - Check app logs for SSL errors
```

---

## Renewing Certificate (After 365 Days)

```bash
# Regenerate certificate
cd ~/voice-of-care-asha

PUBLIC_IP=$(curl -s http://checkip.amazonaws.com)

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/C=IN/ST=State/L=City/O=VoiceOfCare/CN=$PUBLIC_IP" \
  -addext "subjectAltName=IP:$PUBLIC_IP"

# Restart nginx
docker-compose --profile production restart nginx
```

---

## Security Considerations

### What Self-Signed Certificates DON'T Protect Against:
- Man-in-the-middle attacks (no chain of trust)
- Phishing (anyone can create similar certificate)
- Certificate impersonation

### What They DO Provide:
- Encrypted connection (data in transit is encrypted)
- HTTPS requirement for modern web features
- Basic protection from passive eavesdropping

### Best Practices:
1. **Only use for development/testing**
2. **Never use in production**
3. **Don't disable SSL verification in production apps**
4. **Get a proper domain + Let's Encrypt for production**
5. **Educate users about the security warnings**

---

## Migration Path to Production

When you're ready for production:

1. **Get a domain name** (even cheap ones work)
2. **Point domain to EC2 IP** (DNS A record)
3. **Run the proper HTTPS setup:**
   ```bash
   bash setup-https.sh
   ```
4. **Update mobile app** with new domain URL
5. **Remove SSL verification workarounds** from app
6. **Test thoroughly**

---

## Summary

**Current Setup:**
- ✅ HTTPS enabled with self-signed certificate
- ✅ Data encrypted in transit
- ⚠️ Browser warnings (expected)
- ⚠️ Not suitable for production

**Access:**
- Web: `https://YOUR_EC2_IP` (accept warning)
- API: `https://YOUR_EC2_IP/api/v1`

**Next Steps:**
1. Test with browser (accept security warning)
2. Update mobile app API URL
3. For production: Get domain + Let's Encrypt
