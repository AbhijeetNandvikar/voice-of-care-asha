#!/bin/bash
# HTTPS Setup Script for Voice of Care (Without Domain Name)
# Uses self-signed certificate with EC2 IP address

set -e

echo "=========================================="
echo "Voice of Care - HTTPS Setup (No Domain)"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get EC2 public IP
echo "Detecting EC2 public IP..."
PUBLIC_IP=$(curl -s http://checkip.amazonaws.com)

if [ -z "$PUBLIC_IP" ]; then
    echo -e "${RED}Error: Could not detect public IP${NC}"
    echo "Please enter your EC2 public IP manually:"
    read -r PUBLIC_IP
fi

echo -e "${GREEN}✓ Public IP: $PUBLIC_IP${NC}"
echo ""

# Warning about self-signed certificates
echo -e "${YELLOW}⚠ WARNING: Self-Signed Certificate${NC}"
echo ""
echo "This will create a self-signed SSL certificate."
echo "Browsers will show security warnings that you'll need to accept."
echo ""
echo "Limitations:"
echo "  - Browser security warnings"
echo "  - Not suitable for production"
echo "  - Mobile apps may reject the certificate"
echo ""
echo "For production, consider:"
echo "  1. Getting a domain name (cheap options: Namecheap, GoDaddy)"
echo "  2. Using Let's Encrypt (free SSL with domain)"
echo "  3. Using AWS Certificate Manager with Load Balancer"
echo ""
read -p "Continue with self-signed certificate? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Create SSL directory
echo ""
echo "Creating SSL directory..."
mkdir -p ~/voice-of-care-asha/nginx/ssl
cd ~/voice-of-care-asha

# Generate self-signed certificate
echo ""
echo "Generating self-signed certificate..."
echo "This certificate will be valid for 365 days"
echo ""

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/C=IN/ST=State/L=City/O=VoiceOfCare/CN=$PUBLIC_IP" \
  -addext "subjectAltName=IP:$PUBLIC_IP"

chmod 644 nginx/ssl/cert.pem
chmod 600 nginx/ssl/key.pem

echo -e "${GREEN}✓ Certificate generated${NC}"

# Backup current nginx config
echo ""
echo "Backing up current nginx configuration..."
if [ -f nginx/nginx.conf ]; then
    cp nginx/nginx.conf nginx/nginx.conf.backup
    echo -e "${GREEN}✓ Backup created${NC}"
fi

# Copy HTTPS-enabled config
echo ""
echo "Enabling HTTPS configuration..."
cp nginx/nginx-https.conf nginx/nginx.conf

echo -e "${GREEN}✓ HTTPS configuration enabled${NC}"

# Restart nginx
echo ""
echo "Restarting nginx with HTTPS..."
docker-compose --profile production up -d --build nginx

echo -e "${GREEN}✓ Nginx restarted${NC}"

# Wait for nginx to start
echo ""
echo "Waiting for nginx to start..."
sleep 5

# Test HTTPS (ignore certificate validation)
echo ""
echo "Testing HTTPS connection..."
if curl -k -s -o /dev/null -w "%{http_code}" "https://$PUBLIC_IP/health" | grep -q "200"; then
    echo -e "${GREEN}✓ HTTPS is working!${NC}"
else
    echo -e "${YELLOW}⚠ HTTPS test inconclusive${NC}"
    echo "Check manually: https://$PUBLIC_IP"
fi

# Summary
echo ""
echo "=========================================="
echo -e "${GREEN}HTTPS Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "Your site is now accessible at:"
echo "  https://$PUBLIC_IP"
echo ""
echo -e "${YELLOW}Important Notes:${NC}"
echo ""
echo "1. Browser Access:"
echo "   - Visit: https://$PUBLIC_IP"
echo "   - You'll see a security warning"
echo "   - Click 'Advanced' → 'Proceed to $PUBLIC_IP (unsafe)'"
echo ""
echo "2. Mobile App Configuration:"
echo "   - Update API URL to: https://$PUBLIC_IP/api/v1"
echo "   - May need to disable SSL verification in development"
echo "   - For production, use a proper domain + Let's Encrypt"
echo ""
echo "3. Certificate Details:"
openssl x509 -in nginx/ssl/cert.pem -noout -dates
echo ""
echo "4. Renewing Certificate (after 365 days):"
echo "   - Run this script again"
echo "   - Or manually: openssl req -x509 -nodes -days 365 ..."
echo ""
echo "5. For Production:"
echo "   - Get a domain name"
echo "   - Run: bash setup-https.sh"
echo "   - Use Let's Encrypt for trusted certificates"
echo ""
echo "Useful commands:"
echo "  - View logs: docker-compose logs nginx"
echo "  - Restart: docker-compose --profile production restart nginx"
echo "  - Test: curl -k https://$PUBLIC_IP/health"
echo ""
