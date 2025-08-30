# ImmigrationFlow API Documentation

## Overview

The ImmigrationFlow API is a RESTful service designed for managing Romanian immigration workflows. All endpoints return JSON responses and use standard HTTP status codes.

**Base URL**: `https://your-domain.com/api`
**Authentication**: JWT tokens with role-based access control

## Interactive Documentation

**Swagger UI**: Available at `/api/docs` when the server is running
- Complete endpoint documentation
- Interactive testing interface
- Request/response examples
- Authentication testing

## Authentication

All API endpoints (except health checks) require authentication via JWT tokens:

```bash
# Include JWT token in Authorization header
Authorization: Bearer your-jwt-token
```

## Roles & Permissions

- **ADMIN**: Full system access
- **OWNER**: Manage own clients and workers
- **WORKER**: View assigned tasks and update progress
- **VIEWER**: Read-only access to assigned data

## Core Endpoints

### Authentication
```
POST /api/auth/login       # User login
POST /api/auth/logout      # User logout
GET  /api/auth/me          # Current user info
```

### Dashboard
```
GET  /api/dashboard/stats      # System statistics
GET  /api/dashboard/activities # Recent activities
GET  /api/dashboard/assignments # User assignments
```

### Client Management
```
GET    /api/clients           # List clients
POST   /api/clients           # Create client
GET    /api/clients/:id       # Get client details
PUT    /api/clients/:id       # Update client
DELETE /api/clients/:id       # Delete client
```

### Worker Management
```
GET    /api/workers           # List workers
POST   /api/workers           # Create worker
GET    /api/workers/:id       # Get worker details
PUT    /api/workers/:id       # Update worker
DELETE /api/workers/:id       # Delete worker
```

### Assignment Management
```
GET    /api/assignments       # List assignments
POST   /api/assignments       # Create assignment
GET    /api/assignments/:id   # Get assignment
PUT    /api/assignments/:id   # Update assignment
DELETE /api/assignments/:id   # Delete assignment
```

### Document Management
```
GET    /api/documents         # List documents
POST   /api/documents/upload  # Upload document
GET    /api/documents/:id     # Get document
PUT    /api/documents/:id     # Update document metadata
DELETE /api/documents/:id     # Delete document
GET    /api/documents/:id/download # Download document
```

### PDF Generation
```
POST /api/pdf/generate        # Generate PDF from template
GET  /api/pdf/:id            # Get generated PDF
```

### Audit & Compliance
```
GET /api/audit               # Audit logs (Admin only)
GET /api/audit/export        # Export audit data
```

## Status Codes

- **200**: Success
- **201**: Created
- **204**: No Content
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **409**: Conflict
- **422**: Validation Error
- **500**: Internal Server Error

## Error Response Format

```json
{
  "error": "Error message",
  "details": "Additional error details",
  "code": "ERROR_CODE",
  "timestamp": "2025-08-30T15:05:00.000Z"
}
```

## Rate Limiting

- **General endpoints**: 100 requests per minute per user
- **File upload**: 10 uploads per minute per user
- **PDF generation**: 20 requests per minute per user

## File Upload Specifications

### Supported File Types
- **Documents**: PDF, DOC, DOCX
- **Images**: JPG, JPEG, PNG, GIF
- **Text**: TXT

### File Size Limits
- **Maximum size**: 10MB per file
- **Security**: All files scanned with ClamAV
- **Storage**: S3-compatible with signed URLs

## Pagination

List endpoints support pagination:

```
GET /api/clients?page=1&limit=20&sort=name&order=asc
```

**Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `sort`: Sort field
- `order`: Sort order (`asc` or `desc`)

## Filtering & Search

Most list endpoints support filtering:

```
GET /api/assignments?status=in_progress&worker_id=123&search=visa
```

## Webhooks

The system supports webhooks for real-time notifications:

```
POST /api/webhooks/register   # Register webhook URL
GET  /api/webhooks            # List registered webhooks
DELETE /api/webhooks/:id      # Unregister webhook
```

**Webhook Events:**
- `assignment.created`
- `assignment.status_changed`
- `document.uploaded`
- `document.approved`
- `reminder.sent`

## SDK Examples

### JavaScript/Node.js

```javascript
const api = axios.create({
  baseURL: 'https://your-domain.com/api',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

// Get all clients
const clients = await api.get('/clients');

// Create new assignment
const assignment = await api.post('/assignments', {
  client_id: 'client-123',
  worker_id: 'worker-456',
  stage: 'AJOFM_APPLICATION'
});
```

### cURL Examples

```bash
# Login
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'

# Get assignments with filtering
curl -H "Authorization: Bearer $TOKEN" \
  "https://your-domain.com/api/assignments?status=in_progress"

# Upload document
curl -X POST https://your-domain.com/api/documents/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@document.pdf" \
  -F "assignment_id=assignment-123"
```

## Romanian Immigration Workflow Stages

The API supports the complete Romanian immigration process:

1. **AJOFM_APPLICATION**: Labor market test application
2. **AJOFM_APPROVAL**: Labor market test approved
3. **IGI_WORK_PERMIT**: Work permit application to IGI
4. **CONSULATE_VISA**: Visa application at Romanian consulate
5. **ENTRY_ROMANIA**: Entry into Romania
6. **RESIDENCE_PERMIT**: Residence permit application
7. **COMPLETED**: Process completed

Each stage has specific document requirements and deadlines that are automatically tracked.

## Data Protection & GDPR

All API endpoints comply with GDPR requirements:
- **Data minimization**: Only required fields collected
- **Purpose limitation**: Data used only for immigration processing
- **Audit trail**: Complete activity logging
- **Right to erasure**: Secure data deletion capabilities
- **Data portability**: Export functionality for user data

For detailed security documentation, see [SECURITY.md](./SECURITY.md).