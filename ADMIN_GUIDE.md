# SafeCore Enterprise: Administrator Guide

## Overview
SafeCore Enterprise is designed for high-availability warehouse environments. This guide covers user management, security configurations, and system health monitoring.

## User Management
Access the **Security & Health** dashboard (/admin) to monitor principal activity.
- **Roles**: Manage permissions through the `Role` table in Prisma.
- **RBAC**: SafeCore uses Role-Based Access Control. Administrators have full access, while EHS Engineers and Warehouse Managers have scoped authorities.

## System Monitoring
- **Health Checks**: Monitor the status of the PostgreSQL database and the Ollama AI Mesh in real-time.
- **Audit Logs**: Every sensitive action (Login, Document Create, Approval, Publish) is logged with a timestamp, principal ID, and resource target.
- **Diagnostics**: Use the "Refresh Diagnostics" button to re-scan hardware and service availability.

## Security Controls
- **Session Token**: JWTs are valid for 8 hours. To force a global log-out, change the `JWT_SECRET` in environment variables and restart the container.
- **Rate Limiting**: The API is protected against brute force and DOS attacks via `express-rate-limit`.

## Data Governance
- **Retention**: Audit logs are persistent. It is recommended to export and archive them quarterly.
- **Backups**: Standard backup procedure involves executing `pg_dump` on the PostgreSQL instance.
