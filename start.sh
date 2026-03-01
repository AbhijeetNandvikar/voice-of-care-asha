#!/bin/bash

# Voice of Care (ASHA) - Quick Start Script
# This script helps you get started with Docker Compose

set -e

echo "🏥 Voice of Care (ASHA) - Quick Start"
echo "======================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "   Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your configuration before proceeding!"
    echo ""
    echo "Required variables:"
    echo "  - POSTGRES_PASSWORD"
    echo "  - JWT_SECRET"
    echo "  - AWS_ACCESS_KEY_ID"
    echo "  - AWS_SECRET_ACCESS_KEY"
    echo "  - S3_AUDIO_BUCKET"
    echo "  - S3_EXPORTS_BUCKET"
    echo ""
    read -p "Press Enter after editing .env file..."
fi

echo "🔨 Building Docker images..."
docker-compose build

echo ""
echo "🚀 Starting services..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo ""
    echo "✅ Services are running!"
    echo ""
    echo "📍 Access points:"
    echo "   - Web Dashboard: http://localhost"
    echo "   - Backend API: http://localhost/api/v1"
    echo "   - API Docs: http://localhost/docs"
    echo "   - PostgreSQL: localhost:5432"
    echo ""
    echo "📊 View logs:"
    echo "   docker-compose logs -f"
    echo ""
    echo "🛑 Stop services:"
    echo "   docker-compose down"
    echo ""
    echo "📖 For more information, see DOCKER_SETUP.md"
else
    echo ""
    echo "⚠️  Some services may not be running properly."
    echo "   Check logs with: docker-compose logs"
fi
