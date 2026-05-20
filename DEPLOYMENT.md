# SafeCore Enterprise: Deployment Guide

## Architecture
SafeCore follows a modern distributed industrial architecture:
- **Application Node**: React/Vite frontend + Node.js/Express backend.
- **Storage Node**: PostgreSQL (Production-grade).
  - *Constraint: SafeCore uses PostgreSQL only for Docker/local production. SQLite is not supported in this deployment.*
- **Inference Node**: Ollama (Local AI API).

## Self-Hosting with Docker
The easiest way to deploy SafeCore is via Docker.

### 1. Build and Run
```bash
docker-compose up -d --build
```

### 2. Environment Variables
Configure these in your `.env` file:
- `JWT_SECRET`: Random string for session signing.
- `DATABASE_URL`: `postgresql://USER:PASS@HOST:PORT/DB?schema=public`
- `AI_OLLAMA_ENDPOINT`: URL to your Ollama service (e.g., `http://ollama:11434`).
- `PORT`: 3000 (standard for SafeCore).
- `NODE_ENV`: Set to `production`.

## Cloud Deployment (GCP / AWS / Azure)
SafeCore is container-native.

### Google Cloud Run
1. Build the image: `gcloud builds submit --tag gcr.io/PROJECT_ID/safecore`
2. Deploy: `gcloud run deploy safecore --image gcr.io/PROJECT_ID/safecore --platform managed`
3. Connect to a Cloud SQL for PostgreSQL instance via environment variables.

## Local Network Deployment
For warehouse floor connectivity:
1. Deploy SafeCore to a central server on the local network (LAN).
2. Configure the server's static IP.
3. Associates access the platform via `http://<server-ip>:3000`.
4. Ensure firewall allows inbound traffic on port 3000.

## Windows Server Deployment
1. Install Node.js v20.
2. Install PM2: `npm install -g pm2`
3. Start the app: `pm2 start dist/server.cjs --name safecore`
4. Set up a reverse proxy using IIS or Nginx for SSL (HTTPS) termination.
