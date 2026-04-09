# Event Notification Service

A small Event Notification Service built using NestJS, fully containerized with Docker, and running behind an Nginx reverse proxy. It uses Redis for caching and Pub/Sub.

## Local Setup

1. Create a `.env` file from the example (optional, Docker Compose defaults map smoothly):
   ```bash
   cp .env.example .env
   ```
   
2. Start the services using Docker Compose:
   ```bash
   docker-compose up --build -d
   ```

The application and Nginx reverse proxy will start on port `80` with the `api` prefix.

## API Usage

### Create and Publish an Event

**Endpoint:** `POST /api/events`

**Request Body:**
```json
{
  "type": "user_signup",
  "payload": {
    "userId": "123",
    "email": "user@example.com"
  }
}
```

**Curl Example:**
```bash
curl -X POST http://localhost/api/events \
  -H 'Content-Type: application/json' \
  -d '{"type":"user_signup","payload":{"userId":"123","email":"user@example.com"}}'
```

### Retrieve an Event

**Endpoint:** `GET /api/events/:id`

**Curl Example:**
```bash
curl http://localhost/api/events/YOUR_EVENT_ID
```

### Health Check

**Endpoint:** `GET /api/health`

**Curl Example:**
```bash
curl http://localhost/api/health
```

## Architecture & Trade-offs

- **NestJS Structure:** The app is structured modularly. A dedicated `EventsModule` handles API logic, while a separate `RedisModule` wraps `ioredis` publisher and subscriber interactions.
- **Redis Connections:** As per requirements, two distinct `ioredis` clients are instantiated, one for subscriber functions (listening to `events:created`), and one for publishing events as well as cache interactions (`set`/`get`).
- **Nginx Proxy:** The application doesn't expose its port on the host directly. Instead, traffic routes through Nginx acting as a reverse proxy, dropping irrelevant requests and forwarding correct headers (`X-Real-IP`).
- **Storage Strategy:** Under the hood, the service utilizes a transient in-memory store for saving events. Redis operates as a cache-aside layer configured with TTL defined via the environment context.

## Production Deployment Actions

The GitHub Actions are configured to automate builds and deployments. On push to `main`, the pipeline tags and pushes the Docker image to the GitHub Container Registry. 

**Simulated Deploy Step Details:**
To execute standard deployment steps on a live server, the process simulates the following. You can pull the image directly from the GitHub Container Registry:

```bash
# Pull the exact image explicitly:
docker pull ghcr.io/kahdichienja/event-notification-service:latest

# Or if updating via Docker Compose:
docker-compose pull

# Run the services using the specified environment variables from GitHub environments
export APP_ENV=production
export CACHE_TTL_SECONDS=120

# Restart the proxy and application with daemon mode
docker-compose up -d
```
## One Click deployment
Use this script to pull the latest image and run the services:
```
chmod +x pull-and-test.sh
./pull-and-test.sh
```


## Future Enhancements
Given more time, we could add:
- Persistent Database (Postgres or MongoDB) instead of an in-memory Map
- Event validations and schemas utilizing class-validator customized DTOs more extensively
- Integration with external metrics or logging architectures (e.g. Prometheus, Winston, ELK)
- Comprehensive test coverage with unit/e2e tests asserting Pub/Sub interactions relying perhaps on a local Redis mock
