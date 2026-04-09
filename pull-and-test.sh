#!/bin/bash

if [ ! -f .env ]; then
  echo "📄 Automatically staging .env file from .env.example..."
  cp .env.example .env
fi

echo "🚀 Pulling the latest image explicitly from GitHub Container Registry..."
docker pull ghcr.io/kahdichienja/event-notification-service:latest

echo "⚙️ Creating temporary Docker Compose override to map the pulled image..."
cat <<EOF > docker-compose.override.yml
services:
  app:
    image: ghcr.io/kahdichienja/event-notification-service:latest
EOF

echo "Spinning up Redis, Nginx Reverse Proxy, and the pulled NestJS GHCR application..."
docker-compose up -d

echo "✅ All services successfully mapped and started!"
echo ""
echo "Test endpoints:"
echo "👉 Health Check:   curl http://localhost/api/health"
echo "👉 Post Event:     curl -X POST http://localhost/api/events -H 'Content-Type: application/json' -d '{\"type\":\"ghcr_test\",\"payload\":{\"status\":\"working\"}}'"
echo ""
echo "To clean up the override and stop testing, run: docker-compose down && rm docker-compose.override.yml"
