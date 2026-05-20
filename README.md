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
npx prisma generate
npx prisma migrate dev
npm run db:seed
npm run dev
```

### 🔐 Demo Credentials
- **Admin**: `admin@warehouse.local`
- **Password**: `SafeCore2026!`
*(Note: Use these only for development. Change all default passwords before deployment.)*

### 🛠 Local Troubleshooting

If login fails with **PrismaClientInitializationError**:
- check `/api/health`
- confirm PostgreSQL is running (`docker compose ps`)
- confirm `DATABASE_URL` uses localhost for local dev (`postgresql://postgres:postgres@localhost:5432/workplace_safety_platform?schema=public`)
- confirm `npx prisma generate` has run
- confirm `npx prisma migrate dev` has run
- confirm `npm run db:seed` has run

### 3. Docker Deployment
```bash
docker-compose up -d --build
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
