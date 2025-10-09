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
- JWT password-based authentication
- AWS S3 compatible storage
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
- S3-compatible storage (MinIO for development)

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
- Start PostgreSQL, Redis, MinIO (S3), ClamAV, and MailHog services
- Run the application on port 5000 with health checks
- Include proper service dependencies and restart policies

The application will be available at `http://localhost:5000` once all services are healthy.

### Environment Configuration

The Docker setup includes:
- **Database**: PostgreSQL 15 with health checks
- **Cache/Queue**: Redis 7 for BullMQ job processing
- **File Storage**: MinIO for S3-compatible object storage
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
| `S3_ENDPOINT` | S3-compatible storage endpoint | ✅ | `http://localhost:9000` (dev) |
| `S3_REGION` | S3 region | ❌ | `eu-central-1` |
| `S3_BUCKET` | S3 bucket name | ❌ | `immigration-flow-documents` |
| `S3_ACCESS_KEY` | S3 access key | ✅ | `minioadmin` (dev) |
| `S3_SECRET_KEY` | S3 secret key | ✅ | `minioadmin` (dev) |
| `JWT_SECRET` | JWT signing secret | ✅ | - |
| `SESSION_SECRET` | Session encryption secret | ✅ | - |
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
3. Ensure `S3_ENDPOINT` and credentials are configured
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
1. Verify S3 configuration
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
- **Data Encryption**: S3 server-side encryption enabled
- **Input Validation**: Zod schemas for all API endpoints

## Vercel Deployment

### Configuration

The application frontend is deployed on Vercel with the following settings:

**Framework:** Vite

**Build Command:** `npm ci && npm run build:client`

**Output Directory:** `dist/public`

**Install Command:** `npm ci`

### Required Environment Variables

Set these in your Vercel project settings:

**Client Variables (VITE_* prefix):**
- All client-side environment variables must be prefixed with `VITE_` to be accessible in the browser
- Example: `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

**Server Variables:**
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE` - Supabase service role key
- `SUPABASE_PROJECT_REF` - Supabase project reference ID
- `SUPABASE_ACCESS_TOKEN` - Supabase access token
- `JWT_SECRET` - JWT signing secret
- `SESSION_SECRET` - Session encryption secret

**Note:** The Vercel deployment only builds the frontend. The backend server must be deployed separately (e.g., using Docker, Fly.io, or another Node.js hosting service).

### Manual Deployment Steps

1. Connect your GitHub repository to Vercel
2. Configure the settings above in Vercel dashboard
3. Set all required environment variables
4. Deploy - Vercel will automatically build on push to main branch

### Build Process

The `build:client` script runs only `vite build`, which:
- Compiles the React frontend from `client/` directory
- Outputs static files to `dist/public/`
- Does not bundle or check server TypeScript code
- Uses path aliases defined in `vite.config.ts`

## Development Setup
