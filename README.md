# ImmigrationFlow - Romanian Immigration Management Platform

A comprehensive SaaS platform for managing Romanian immigration workflows including work permits, visa applications, and residence permits.

## Features

- **Multi-Role Access Control**: Admin, Client Owner, Worker, and Viewer roles
- **Romanian Immigration Workflow**: AJOFM → Work Permit → Visa D/AM → Residence Permit
- **Document Management**: Upload, generate PDFs, track status, and manage requirements
- **Smart Reminders**: Automated email notifications for deadlines and expiring documents
- **Client Management**: Romanian company profiles with CUI, ONRC, and CAEN data
- **Worker Tracking**: Individual progress tracking and document checklists
- **Kanban Workflow**: Visual workflow management with status tracking
- **PDF Generation**: Auto-populated templates with watermarking
- **Audit Logging**: Comprehensive activity tracking for GDPR compliance
- **Search & Filtering**: Global search across clients, workers, and documents

## Tech Stack

### Frontend
- Next.js 14+ with TypeScript
- Tailwind CSS + Shadcn UI components
- PDF.js for document viewing
- React Hook Form with Zod validation
- TanStack Query for state management

### Backend
- Express.js with TypeScript
- Prisma ORM with PostgreSQL
- BullMQ + Redis for job processing
- JWT authentication with Replit Auth
- Supabase Storage for file management
- Mailjet/Postmark for emails

### Development
- Docker Compose for local environment
- Vitest for unit testing
- Playwright for E2E testing
- ESLint + Prettier for code quality

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd immigration-flow
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (copy from .env.example):
```bash
cp .env.example .env
```

4. Start the development server:
```bash
npm run dev

## Authentication Methods

ImmigrationFlow supports multiple authentication methods:

### Supabase Passwordless Authentication (New Users)

#### OTP (One-Time Password) - Default
Users receive a 6-digit code via email. No redirect URL is used, making this suitable for mobile and cross-device authentication.

**Flow:**
1. User enters email address
2. System sends 6-digit code via email
3. User enters code to verify
4. Frontend calls `/api/auth/supabase-session` with Supabase token
5. Backend validates Supabase token and creates JWT session
6. User can access dashboard with JWT cookies

**Implementation:** 
- Frontend: Uses `supabase.auth.signInWithOtp()` without `emailRedirectTo` parameter
- Backend: `/api/auth/supabase-session` endpoint bridges Supabase and JWT sessions

#### Magic Link - Alternative  
Users receive a clickable link via email that redirects to `/auth/callback`. Best for desktop users who have email and browser on the same device.

**Flow:**
1. User enters email address
2. System sends clickable link via email
3. User clicks link
4. Redirected to `/auth/callback` which calls `/api/auth/supabase-session`
5. Backend validates Supabase token and creates JWT session
6. User can access dashboard with JWT cookies

**Implementation:** 
- Frontend: Uses `supabase.auth.signInWithOtp()` with `emailRedirectTo` parameter
- Backend: Same session bridge as OTP

### Session Bridge Architecture

The `/api/auth/supabase-session` endpoint integrates Supabase Auth with the existing JWT/OIDC system:

1. **Accepts**: Supabase access token from frontend
2. **Validates**: Token using Supabase service role key
3. **Creates/Updates**: User in database with default VIEWER role
4. **Generates**: JWT token pair (access + refresh tokens)
5. **Sets**: HttpOnly cookies for backend authentication
6. **Returns**: User data for frontend state

This allows new Supabase users to seamlessly access the application alongside existing JWT/OIDC users.

### JWT/OIDC Authentication (Existing System)
Admin and worker login still use the existing JWT/OIDC authentication system. This will be gradually migrated to Supabase Auth.

### Configuration
- Supabase authentication configured via GoTrue Admin API (see `scripts/configure-supabase.ts`)
- Email templates support both OTP codes and Magic Links using conditional logic
- Environment variables required: 
  - Client: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
  - Server: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE`
- New Supabase users default to VIEWER role
- Testing: Run `npm run test` for unit tests, `npm run test:e2e` for end-to-end tests

### Logout
Logout clears both Supabase session and JWT cookies to ensure complete session termination

## File Storage with Supabase Storage

ImmigrationFlow uses Supabase Storage for secure document management:

### Features
- **Secure Storage**: Private bucket with role-based access control
- **Signed URLs**: Pre-signed upload and download URLs for direct client access
- **File Management**: Upload, download, and delete documents via REST API
- **Metadata**: Track file size, MIME type, and custom metadata
- **Integration**: Seamlessly integrates with Supabase Auth

### Configuration
Set the following environment variables:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE`: Service role key for server-side operations
- `SUPABASE_STORAGE_BUCKET`: Bucket name (default: 'documents')

The storage service will automatically create the bucket if it doesn't exist on first use.

```

## Production Deployment with Docker

### Docker Build and Deployment

The application includes a multi-stage Dockerfile optimized for production deployment:

- **Stage 1**: Install dependencies
- **Stage 2**: Build client with Vite and bundle server with esbuild
- **Stage 3**: Production runtime with Node.js 20 Alpine

To build and run the complete application stack:

```bash
docker compose up --build
```

This command will:
- Build the production Docker image
- Start PostgreSQL, Redis, ClamAV, and MailHog services
- Uses Supabase Storage for document management
- Run the application on port 5000 with health checks
- Include proper service dependencies and restart policies

The application will be available at `http://localhost:5000` once all services are healthy.

### Environment Configuration

The Docker setup includes:
- **Database**: PostgreSQL 15 with health checks
- **Cache/Queue**: Redis 7 for BullMQ job processing
- **File Storage**: Supabase Storage for secure document storage with signed URLs
- **Email Testing**: MailHog for development email testing
- **Security**: ClamAV for file scanning and malware detection

### Health Monitoring

The application includes comprehensive health checks:
- Application health: `http://localhost:5000/health`
- Database connectivity: `http://localhost:5000/health/db`
- Docker services automatically restart on failure

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ | - |
| `REDIS_URL` | Redis connection string for job queues | ✅ | - |
| `SUPABASE_URL` | Supabase project URL | ✅ | - |
| `SUPABASE_SERVICE_ROLE` | Supabase service role key | ✅ | - |
| `SUPABASE_STORAGE_BUCKET` | Supabase storage bucket name | ❌ | `documents` |
| `JWT_SECRET` | JWT signing secret | ✅ | - |
| `SESSION_SECRET` | Session encryption secret | ✅ | - |
| `REPLIT_DOMAINS` | Authorized domains for Replit Auth | ✅ | - |
| `NODE_ENV` | Environment mode | ❌ | `development` |
| `PORT` | Server port | ❌ | `5000` |
| `LOG_LEVEL` | Logging level (debug, info, warn, error) | ❌ | `info` |
| `CLAMAV_HOST` | ClamAV daemon host | ❌ | `localhost` |
| `CLAMAV_PORT` | ClamAV daemon port | ❌ | `3310` |
| `MAX_FILE_SIZE` | Maximum file upload size in bytes | ❌ | `10485760` (10MB) |
| `ALLOWED_FILE_TYPES` | Comma-separated allowed file extensions | ❌ | `pdf,doc,docx,jpg,jpeg,png,gif,txt` |
| `MAIL_FROM` | Email sender address | ✅ | - |
| `MAIL_API_KEY` | Email service API key | ✅ | - |
| `WATERMARK_TOGGLE` | Enable PDF watermarking | ❌ | `true` |

## Monitoring & Observability

### Health Checks
- **Application**: `GET /health` - Server status and uptime
- **Database**: `GET /health/db` - Database connectivity test
- **All services**: Docker Compose includes health checks for all dependencies

### Metrics
- **Prometheus**: `GET /metrics` - Application metrics in Prometheus format
- **Included metrics**:
  - HTTP request count and duration
  - Queue depth and job processing statistics
  - PDF generation metrics
  - File upload statistics
  - Database query performance
  - Business logic metrics (clients, workers, assignments)

### Logging
- **Structured logging** with Pino JSON format
- **PII scrubbing** automatically removes sensitive data
- **Request/response logging** for all API endpoints
- **Error tracking** with stack traces and context

## Operations Runbook

### Starting the Application

**Development Mode:**
```bash
npm run dev
```

**Production Mode:**
```bash
# Build the application
npm run build

# Start the production server
npm start
```

**Docker Production:**
```bash
docker compose up --build
```

### Database Operations

```bash
# Push schema changes to database
npm run db:push

# Force push (when data loss warning appears)
npm run db:push --force

# Seed development data
node scripts/seed.js

# Create additional sample assignments  
node scripts/create-sample-assignments.js
```

### Queue Management

The application uses BullMQ for background job processing:

- **Reminder Queue**: Daily reminder evaluation and deadline notifications
- **Email Queue**: Template-based email sending with retry logic
- **PDF Queue**: Document generation and processing
- **Dead Letter Queue**: Failed jobs for manual review

### Troubleshooting

#### Common Issues

**App won't start:**
1. Check `DATABASE_URL` is set and accessible
2. Verify `REDIS_URL` for queue functionality
3. Ensure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE` are configured
4. Check logs for specific error messages

**Database connection failed:**
```bash
# Test database connectivity
curl http://localhost:5000/health/db
```

**Queue jobs not processing:**
1. Verify Redis connection
2. Check worker logs for errors
3. Monitor queue depth via metrics endpoint

**File uploads failing:**
1. Verify Supabase Storage configuration (SUPABASE_URL, SUPABASE_SERVICE_ROLE, SUPABASE_STORAGE_BUCKET)
2. Check ClamAV is running (for production)
3. Validate file size and type restrictions

**Performance issues:**
1. Monitor metrics at `/metrics`
2. Check database query performance
3. Review queue processing times
4. Monitor memory usage

#### Log Analysis

**Development:**
- Logs are pretty-printed with colors
- All requests/responses logged
- PII automatically scrubbed

**Production:**
- Structured JSON logs
- Integration ready for log aggregation
- Error tracking with correlation IDs

### Security Considerations

- **PII Protection**: All logging automatically scrubs personal data
- **File Security**: ClamAV scanning for malware detection
- **Access Control**: Role-based permissions (Admin, Owner, Worker, Viewer)
- **Audit Trail**: Complete activity logging for compliance
- **Session Security**: HTTP-only cookies with secure session storage
- **Data Encryption**: Supabase Storage server-side encryption enabled
- **Input Validation**: Zod schemas for all API endpoints

## Development Setup
