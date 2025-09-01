# System Bible - ImmigrationFlow

## MANDATORY UPDATE TRIGGERS
**I MUST update this documentation when:**
- ✅ Every time I complete a task → Update relevant sections
- ✅ Every time I discover a pattern → Add to Code Patterns & Standards
- ✅ Every time I fix an error → Add to Troubleshooting & Solutions
- ✅ Every time I create something new → Add to Component Library

## MANDATORY PRE-WORK PROTOCOL
**I MUST always:**
1. Read this entire replit.md file first
2. Search existing codebase for similar patterns before coding
3. Follow established patterns documented here
4. Update this documentation after completion

# Overview

ImmigrationFlow is a comprehensive SaaS platform for managing Romanian immigration workflows, including work permits, visa applications, and residence permits. The system handles the complete Romanian immigration process from AJOFM labor market tests through IGI work permits, consulate visa applications, to final residence permits. It features multi-role access control (Admin, Client Owner, Worker, Viewer), document management with PDF generation, automated reminders, audit logging, and a kanban-style workflow interface.

# Code Patterns & Standards

## Frontend Patterns
### Translation System
- **Hook**: `import { useTranslation } from '@/contexts/I18nProvider'`
- **Usage**: `const { t } = useTranslation();`
- **Pattern**: `t('key') || 'Default Text'` for fallbacks
- **NEVER use**: `useI18n` (does not exist)

### Form Patterns
- **Library**: React Hook Form + Zod validation
- **Schema Extension**: `const schema = insertSchema.extend({ field: z.string() })`
- **Type Inference**: `type FormData = z.infer<typeof schema>`
- **Components**: `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`

### API Call Patterns
- **Fetching**: `useQuery({ queryKey: ['/api/endpoint'], enabled: condition })`
- **Mutations**: `useMutation({ mutationFn: async (data) => apiRequest("POST", "/api/endpoint", data) })`
- **Cache Invalidation**: `queryClient.invalidateQueries({ queryKey: ['/api/endpoint'] })`
- **Error Handling**: Check `isUnauthorizedError` in mutation callbacks

### Component Imports
- **UI Components**: `@/components/ui/*` (Button, Card, Input, Dialog, Select, Tabs)
- **Custom Hooks**: `@/hooks/*` (useAuth, useToast)
- **Contexts**: `@/contexts/*` (useTranslation from I18nProvider)
- **Schema**: `@shared/schema` for type definitions

### Component Structure Standards
- Always include `data-testid` attributes for interactive elements
- Use descriptive test IDs: `{action}-{target}` or `{type}-{content}`
- For dynamic elements: `{type}-{description}-{id}`

## Backend Patterns
### API Endpoint Structure
- **Authentication**: `isAuthenticated` middleware required for protected routes
- **Authorization**: `requireRole('ADMIN', 'OWNER', 'WORKER')` for role-based access
- **Audit**: `auditMiddleware` for logging API requests
- **Validation**: Zod schemas for request validation

### Error Handling Pattern
```javascript
try {
  // operation
  res.json(result);
} catch (error) {
  console.error('Error description:', error);
  res.status(500).json({ message: "User-friendly error message" });
}
```

### Database Query Patterns
- **Access**: Via `storage` abstraction layer (never direct db access)
- **Methods**: `storage.getUser()`, `storage.createClient()`, etc.
- **Authorization Checks**: Verify user access before data operations

### Security Headers
Always include security headers:
```javascript
res.setHeader('X-Content-Type-Options', 'nosniff');
res.setHeader('X-Frame-Options', 'DENY');
res.setHeader('X-XSS-Protection', '1; mode=block');
```

## Database Schema Patterns
### Table Definitions
- **ORM**: Drizzle ORM with `pgTable`
- **Primary Keys**: `uuid("id").primaryKey().defaultRandom()` or `varchar("id").primaryKey().default(sql\`gen_random_uuid()\`)`
- **Timestamps**: `createdAt` and `updatedAt` with `timestamp().defaultNow()`
- **Relations**: Defined separately using `relations()` function

### Schema Validation
- **Insert Schemas**: `createInsertSchema(table).pick({...})` for API validation
- **Type Inference**: `typeof table.$inferSelect` for select types

# Business Logic Rules

## Role-Based Permissions
- **ADMIN**: Full system access, can view/edit everything
- **OWNER** (Client Owner): Manage their workers, documents, company profile
- **WORKER**: View their assignments, upload documents, update progress
- **VIEWER**: Read-only access to assigned data

## Romanian Immigration Workflows
### Standard Workflow Stages
1. AJOFM Labor Market Test
2. IGI Work Permit Application  
3. Consulate Visa Application
4. Residence Permit Application

### Assignment Status Flow
- `NOT_STARTED` → `AWAITING_UPLOAD` → `SUBMITTED_BY_USER` → `RECEIVED_BY_ADMIN` → `SUBMITTED_TO_INSTITUTION_DIGITAL/COURIER` → `ACCEPTED/REJECTED`

# Component Library

## Standard Form Components
- **Client Form**: Uses `insertClientProfileSchema` with extensions
- **Worker Form**: Uses `insertWorkerSchema` with extensions
- **Modal Pattern**: Create/Edit modals with form validation

## File Upload Patterns
- **S3 Integration**: Signed URLs for direct uploads
- **Security**: Virus scanning, file validation
- **Authorization**: User must have access to assignment

## System Health Check Components
- **Health Check Page**: `/health-check` with comprehensive test orchestration
- **Test Categories**: FileText, Shield, Database, Globe icons for different test types
- **Real-time Logs**: Server-sent events with timestamped log entries
- **Universal Prompt Display**: Shows documentation-first workflow in UI
- **Progress Tracking**: Live progress bars and test status updates

# API Documentation

## Authentication Endpoints
- `GET /api/auth/user` - Get current user
- Authentication via Replit Auth integration

## Core Resource Endpoints
- `GET /api/workers` - List workers (ADMIN/OWNER only)
- `GET /api/clients` - List clients  
- `GET /api/assignments/:id` - Get assignment details
- `PATCH /api/assignments/:id/status` - Update assignment status

## File Endpoints
- `POST /api/documents/upload-url` - Get signed upload URL
- `POST /api/documents/confirm-upload` - Confirm file upload
- `GET /api/documents/:fileId/download` - Get download URL

## Health Check Endpoints
- `GET /api/health-check/status` - Quick system health status
- `POST /api/health-check/run-all` - Run comprehensive test suite (Server-Sent Events)

# Troubleshooting & Solutions

## Translation Issues
- **Error**: `useI18n is not exported`
- **Solution**: Use `useTranslation` from `@/contexts/I18nProvider`
- **Root Cause**: Inconsistent naming conventions
- **Fixed**: September 1, 2025 - Health check page updated to use correct import

## Common Import Errors
- Always verify exports exist in target files
- Check existing component usage patterns before creating new ones

## Universal Prompt Integration
- **Pattern**: Display universal prompt in UI when initiating system operations
- **Implementation**: Show "Read replit.md first, follow documented patterns, update documentation after" in logs and UI
- **Purpose**: Reinforce documentation-first workflow for all system interactions
- **Location**: Health check page demonstrates this pattern

# Recent Changes

## September 1, 2025: Enhanced Employee Schema & Navigation Updates
- **Menu Restructure**: Changed "Clients & Workers" → "Clients & Employees" in sidebar navigation for consistent terminology
- **Enhanced Worker Schema**: Expanded worker table with 50+ comprehensive immigration data fields including:
  - Personal information (birth place, country, middle name, gender, marital status)
  - Extended contact details (emergency contacts)
  - Dual address support (home country and Romanian addresses with counties)
  - Comprehensive passport details (issuing authority, place of issue)
  - Education & qualifications (university, degree, certifications, language skills)
  - Detailed employment information (salary, work location, contract details)
  - Immigration history (previous visas, rejections, criminal record)
  - Health & insurance information
  - Complete family details (spouse, children, Romanian family connections)
  - Financial information (bank details, proof of funds)
  - Legal identifiers (CNP, tax ID, social security)
  - Document status tracking and missing document arrays
- **Schema Validation Update**: Updated insertWorkerSchema to include all 50+ new immigration process fields

## August 31, 2025: Comprehensive Codebase Cleanup
- **Migration Complete**: Successfully migrated from mock data to real workflow data from settings across all components
- **Internationalization Consolidation**: Removed client/src/i18n.js and consolidated to single TypeScript-based I18nProvider
- **Component Unification**: Merged 3 separate language selector components into unified LanguageSelector.tsx
- **Import Standardization**: Updated all translation imports to use consistent @/contexts/I18nProvider
- **Code Quality**: Removed backup files, moved development scripts to scripts/ folder, cleaned console.log statements
- **Architecture Improvement**: Eliminated circular dependencies and standardized import paths throughout codebase

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with Next.js 14+ and TypeScript
- **Styling**: Tailwind CSS with Shadcn UI component library for consistent design
- **State Management**: TanStack Query (React Query) for server state and caching
- **Form Handling**: React Hook Form with Zod validation for type-safe forms
- **Routing**: Wouter for lightweight client-side routing
- **PDF Viewing**: PDF.js integration for document preview functionality

## Backend Architecture
- **Runtime**: Node.js with Express.js server and TypeScript
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: JWT-based auth with Replit Auth integration, using session storage
- **Job Processing**: BullMQ with Redis for handling background tasks like reminders
- **API Design**: RESTful API with role-based access control and audit middleware

## Data Storage Solutions
- **Primary Database**: PostgreSQL for relational data (users, clients, workers, assignments)
- **File Storage**: S3-compatible storage (configurable for AWS S3, MinIO, or Hetzner) with signed URLs
- **Session Storage**: PostgreSQL sessions table for authentication state
- **Cache Layer**: Redis for job queues and temporary data

## Authentication & Authorization
- **Primary Auth**: Replit Auth with OpenID Connect integration
- **Session Management**: Server-side sessions stored in PostgreSQL
- **Access Control**: Role-based permissions (ADMIN, OWNER, WORKER, VIEWER)
- **Security**: HTTP-only cookies, CSRF protection, and audit logging for all actions

## Document Management
- **PDF Generation**: Server-side PDF creation using PDFKit with auto-populated templates
- **File Upload**: Signed URL approach for direct S3 uploads with metadata tracking
- **Document Workflow**: Status tracking from upload through institutional submission
- **Template System**: Predefined Romanian immigration forms with field auto-population

## Background Processing
- **Queue System**: BullMQ for reliable job processing
- **Reminder Engine**: Automated email notifications for deadlines and document expiries
- **Job Types**: Document processing, email sending, deadline monitoring
- **Error Handling**: Retry logic and failure tracking for background tasks

# External Dependencies

## Cloud Infrastructure
- **Database Hosting**: Neon serverless PostgreSQL for scalable database operations
- **File Storage**: S3-compatible object storage (AWS S3, MinIO for development, or Hetzner)
- **Redis Service**: Redis instance for job queues and session caching

## Communication Services
- **Email Provider**: Mailjet or Postmark (EU region) for transactional emails and notifications
- **Email Templates**: MJML-based responsive email templates for multi-language support

## Development & Deployment
- **Package Manager**: npm with dependency management for monorepo structure
- **Development Environment**: Docker Compose for local development with PostgreSQL, Redis, and MinIO
- **Build System**: Vite for frontend bundling and esbuild for backend compilation
- **Testing Framework**: Vitest for unit tests, Playwright for end-to-end testing

## Authentication Integration
- **Replit Auth**: Primary authentication provider with OpenID Connect
- **Session Store**: connect-pg-simple for PostgreSQL-backed session storage

## Romanian Government Integration
- **Target Systems**: IGI (Romanian Immigration Office), AJOFM/ANOFM (Employment Agency), Romanian consulates
- **Document Standards**: Romanian legal document templates and requirements
- **Compliance**: GDPR compliance for handling personal data of foreign workers