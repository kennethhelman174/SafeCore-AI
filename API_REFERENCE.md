# SafeCore Enterprise: API Reference

## Base URL
`/api`

## Authentication
All protected routes require a Bearer token:
`Authorization: Bearer <JWT_TOKEN>`

## Key Endpoints

### Auth
- `POST /api/auth/login`: Authenticate and receive JWT.
- `GET /api/auth/me`: Validate session and get role.

### Documents
- `GET /api/documents`: List docs (supports `page`, `limit`, `search`).
- `POST /api/documents`: Create new safety protocol.
- `PUT /api/documents/:id`: Update existing protocol.
- `POST /api/documents/:id/publish`: Mark as effective.

### Safety Operations
- `GET /api/corrective-actions`: Open safety issues.
- `POST /api/verifications`: Record critical control checks.
- `GET /api/training-records`: Site compliance status.

### Admin
- `GET /api/admin/system-health`: Real-time health metrics.
- `GET /api/admin/audit-logs`: Security trail.

## Status Codes
- `200`: Success
- `401`: Unauthorized
- `403`: Forbidden (Insufficient Permissions)
- `429`: Too Many Requests (Rate Limited)
- `500`: System Fault
