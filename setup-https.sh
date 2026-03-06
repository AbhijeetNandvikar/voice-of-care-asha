#!/bin/bash
# HTTPS Setup Script for Voice of Care
# This script helps configure HTTPS with Let's Encrypt SSL certificates

set -e

echo "=========================================="
echo "Voice of Care - HTTPS Setup"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running on EC2
if [ ! -f /sys/hypervisor/uuid ] || ! grep -q ec2 /sys/hypervisor/uuid 2>/dev/null; then
    echo -e "${YELLOW}Warning: This doesn't appear to be an EC2 instance${NC}"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if certbot is installed
if ! command -v certbot &> /dev/null; then
    echo -e "${YELLOW}Certbot not found. Installing...${NC}"
    sudo apt update
    sudo apt install -y certbot
    echo -e "${GREEN}✓ Certbot installed${NC}"
else
    echo -e "${GREEN}✓ Certbot already installed${NC}"
fi

# Get domain name
echo ""
echo "Enter your domain name (e.g., voiceofcare.example.com):"
read -r DOMAIN

if [ -z "$DOMAIN" ]; then
    echo -e "${RED}Error: Domain name is required${NC}"
    exit 1
fi

echo ""
echo "Domain: $DOMAIN"
echo ""

# Check DNS resolution
echo "Checking DNS resolution..."
RESOLVED_IP=$(dig +short "$DOMAIN" | tail -n1)
PUBLIC_IP=$(curl -s http://checkip.amazonaws.com)

if [ -z "$RESOLVED_IP" ]; then
    echo -e "${RED}✗ Domain does not resolve to any IP${NC}"
    echo "Please configure your DNS A record to point to: $PUBLIC_IP"
    exit 1
elif [ "$RESOLVED_IP" != "$PUBLIC_IP" ]; then
    echo -e "${YELLOW}⚠ Warning: Domain resolves to $RESOLVED_IP but EC2 public IP is $PUBLIC_IP${NC}"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✓ DNS correctly configured${NC}"
fi

# Check if port 443 is open
echo ""
echo "Checking if port 443 is accessible..."
if timeout 5 bash -c "cat < /dev/null > /dev/tcp/0.0.0.0/443" 2>/dev/null; then
    echo -e "${GREEN}✓ Port 443 is accessible${NC}"
else
    echo -e "${YELLOW}⚠ Port 443 may not be open in Security Group${NC}"
    echo "Please ensure port 443 (HTTPS) is open in your EC2 Security Group"
fi

# Stop nginx container
echo ""
echo "Stopping nginx container..."
cd ~/voice-of-care-asha
docker-compose --profile production stop nginx || true
echo -e "${GREEN}✓ Nginx stopped${NC}"

# Generate SSL certificate
echo ""
echo "Generating SSL certificate with Let's Encrypt..."
echo "You will be prompted for:"
echo "  - Email address (for renewal notifications)"
echo "  - Agreement to Terms of Service"
echo ""
read -p "Press Enter to continue..."

sudo certbot certonly --standalone \
    -d "$DOMAIN" \
    --non-interactive \
    --agree-tos \
    --email "${EMAIL:-admin@$DOMAIN}" \
    || {
        echo -e "${RED}✗ Certificate generation failed${NC}"
        echo "Please check the error messages above"
        exit 1
    }

echo -e "${GREEN}✓ SSL certificate generated${NC}"

# Copy certificates
echo ""
echo "Copying certificates to project..."
mkdir -p ~/voice-of-care-asha/nginx/ssl

sudo cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" \
    ~/voice-of-care-asha/nginx/ssl/cert.pem

sudo cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" \
    ~/voice-of-care-asha/nginx/ssl/key.pem

sudo chown $USER:$USER ~/voice-of-care-asha/nginx/ssl/*.pem
chmod 644 ~/voice-of-care-asha/nginx/ssl/cert.pem
chmod 600 ~/voice-of-care-asha/nginx/ssl/key.pem

echo -e "${GREEN}✓ Certificates copied${NC}"

# Backup current nginx config
echo ""
echo "Backing up current nginx configuration..."
cp ~/voice-of-care-asha/nginx/nginx.conf \
   ~/voice-of-care-asha/nginx/nginx.conf.backup

# Copy HTTPS-enabled config
echo "Enabling HTTPS configuration..."
cp ~/voice-of-care-asha/nginx/nginx-https.conf \
   ~/voice-of-care-asha/nginx/nginx.conf

echo -e "${GREEN}✓ HTTPS configuration enabled${NC}"

# Restart nginx
echo ""
echo "Starting nginx with HTTPS..."
cd ~/voice-of-care-asha
docker-compose --profile production up -d --build nginx

echo -e "${GREEN}✓ Nginx restarted${NC}"

# Wait for nginx to start
echo ""
echo "Waiting for nginx to start..."
sleep 5

# Test HTTPS
echo ""
echo "Testing HTTPS connection..."
if curl -k -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/health" | grep -q "200"; then
    echo -e "${GREEN}✓ HTTPS is working!${NC}"
else
    echo -e "${YELLOW}⚠ HTTPS test failed, but this might be a certificate issue${NC}"
    echo "Try accessing https://$DOMAIN in your browser"
fi

# Setup auto-renewal
echo ""
echo "Setting up automatic certificate renewal..."

# Create renewal script
cat > /tmp/renew-certs.sh << 'EOF'
#!/bin/bash
certbot renew --quiet
if [ $? -eq 0 ]; then
    # Copy renewed certificates
    DOMAIN=$(ls /etc/letsencrypt/live/ | head -n1)
    cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" /home/ubuntu/voice-of-care-asha/nginx/ssl/cert.pem
    cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" /home/ubuntu/voice-of-care-asha/nginx/ssl/key.pem
    
    # Restart nginx
    cd /home/ubuntu/voice-of-care-asha
    docker-compose --profile production restart nginx
fi
EOF

sudo mv /tmp/renew-certs.sh /usr/local/bin/renew-certs.sh
sudo chmod +x /usr/local/bin/renew-certs.sh

# Add cron job
(sudo crontab -l 2>/dev/null; echo "0 0,12 * * * /usr/local/bin/renew-certs.sh >> /var/log/certbot-renewal.log 2>&1") | sudo crontab -

echo -e "${GREEN}✓ Auto-renewal configured (runs twice daily)${NC}"

# Summary
echo ""
echo "=========================================="
echo -e "${GREEN}HTTPS Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "Your site is now accessible at:"
echo "  https://$DOMAIN"
echo ""
echo "Certificate details:"
sudo certbot certificates | grep -A 5 "$DOMAIN"
echo ""
echo "Next steps:"
echo "  1. Test HTTPS: https://$DOMAIN"
echo "  2. Update mobile app API URL to use HTTPS"
echo "  3. Monitor certificate expiry (auto-renews)"
echo ""
echo "Useful commands:"
echo "  - Check certificates: sudo certbot certificates"
echo "  - Renew manually: sudo certbot renew"
echo "  - View logs: docker-compose logs nginx"
echo ""
