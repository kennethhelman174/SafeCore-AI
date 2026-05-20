# SafeCore Enterprise: Backup & Recovery

## Backup Strategy
SafeCore utilizes a production-grade PostgreSQL database.

### Automated Backups
It is recommended to use `pg_dump` for backing up the database. If using Docker Compose:

```bash
# Backup
docker exec -t workplace-safety-db-1 pg_dump -U postgres workplace_safety_platform > backup_$(date +%F).sql

# Restore
cat backup_file.sql | docker exec -i workplace-safety-db-1 psql -U postgres workplace_safety_platform
```

### Manual Export
Administrators can use the **Security & Health** dashboard to export:
- Security Audit Logs (CSV)
- Migration Schema Plans (CSV)
- Document Metadata (CSV)

## Disaster Recovery
1. **Database Corruption**: Stop the container, restore the latest `.sql` dump to a fresh PostgreSQL instance, and update connection strings.
2. **AI Service Failure**: If Ollama goes offline, document generation will revert to manual mode. Restart the `ollama-service` in Docker.
3. **Registry Failure**: SafeCore is stateless except for the database. Re-deploying the Docker image will restore the application logic immediately.

## Data Integrity
- Offline actions are queued in the browser's `localStorage`.
- Upon reconnection, SafeCore validates the synchronization queue against current server state to prevent duplicates.
