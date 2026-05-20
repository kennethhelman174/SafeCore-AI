# SafeCore Enterprise: Warehouse Safety Platform

SafeCore is a production-ready, full-stack safety management system designed for warehouse and distribution center operations. It automates the lifecycle of safety protocols, training, and compliance through a local-first, AI-enhanced architecture.

## 🚀 Key Features
- **Pillar 1: Document Lifecycle**: Full SOP/JSA/WI management with digital approvals and version control.
- **Pillar 2: Site Intelligence**: Real-time safety dashboards, KPI tracking, and corrective action management.
- **Pillar 3: AI Safety Assistant**: Local LLM integration (Ollama) for drafting safety procedures and identifying risks.
- **Pillar 4: Enterprise Security**: JWT authentication, RBAC, immutable audit logging, and rate limiting.
- **Pillar 5: M365 Integration**: Ready-to-go mapping for SharePoint, Power Apps, and Power BI.

## 🛠 Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS, Lucide, Motion/React, Recharts.
- **Backend**: Node.js, Express, JWT, Helmet, Zod, Bcrypt.
- **Database**: PostgreSQL (Production-ready) with Prisma ORM.
  - *Note: SafeCore uses PostgreSQL only for Docker/local production. SQLite is not supported in this deployment.*
- **Inference**: Ollama (Local AI).

## 📦 Installation & Setup

### 1. Prerequisites
- Node.js v20+
- PostgreSQL v16+
- Docker & Docker Compose (for containerized deployment)
- Ollama (installed on host or as a container)

### 2. Local Setup
```bash
cp .env.example .env
docker compose up -d db
npm install
npm run setup:local # Automatically generates Prisma client, deploys migrations & seeds master data
npm run dev
```

### 🔓 Development Auth Bypass
To bypass login screens during local design and development iterative cycles:
1. In your `.env` configuration file, configure:
   ```env
   AUTH_BYPASS=true
   VITE_AUTH_BYPASS=true
   ```
2. Restart your development server. Visiting `/` immediately logs you in automatically with the **Dev Admin (Administrator)** sandbox session without presenting the login screen.
3. To restore full authentication, simply toggle both flags back to `false` (or remove them) and restart the server.

*Security Guard:* The development auth bypass feature is strictly disabled when `NODE_ENV=production`. If `AUTH_BYPASS=true` is detected in a production build, the application server will throw a critical safety exception and refuse to boots up to prevent any security vulnerability.

### 🔐 Default Development Credentials
If development auth bypass is disabled, you can log in with:
*   **Admin Email**: `admin@warehouse.local`
*   **Site Manager**: `manager@warehouse.local`
*   **EHS Manager**: `ehs@warehouse.local`
*   **Standard Security Password**: `SafeCore2026!`

### 🔄 Database Reset & Hard Reseed
To reset your database scheme and cleanly re-seed all master library datasets (SOPs, JSAs, Work Instructions, Users, etc.):
```bash
# Deletes existing tables, runs migrations, and populates master records
npx prisma migrate reset --force

# OR manually trigger seeding at any point:
npm run db:seed
```

### 3. Docker Deployment
```bash
# Builds using the multi-stage Dockerfile and boots up the services
docker compose up -d --build
```
Note: You must pull the Ollama model manually for it to work. If you run Ollama inside Docker:
```bash
docker exec -it <ollama-container-name> ollama pull llama3.1:8b
```

## 📖 Detailed Documentation
- [User Guide](./USER_GUIDE.md)
- [Administrator Guide](./ADMIN_GUIDE.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Backup & Recovery](./BACKUP_RECOVERY.md)
- [AI Setup](./AI_SETUP.md)
- [M3365 Integration](./MICROSOFT365_INTEGRATION.md)
- [API Reference](./API_REFERENCE.md)

---
*Built for industrial safety. 100% Local. 100% Secure.*
