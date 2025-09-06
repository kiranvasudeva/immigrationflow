# System Bible - ImmigrationFlow

## Overview

ImmigrationFlow is a comprehensive SaaS platform designed to streamline Romanian immigration workflows. It manages the entire process, from AJOFM labor market tests and IGI work permits to consulate visa applications and final residence permits. The platform offers multi-role access (Admin, Client Owner, Worker, Viewer), robust document management with PDF generation, automated reminders, audit logging, and a kanban-style workflow interface. The vision is to provide an efficient and compliant solution for immigration management, targeting businesses and individuals navigating the complex Romanian immigration landscape.

## User Preferences

Preferred communication style: Simple, everyday language.

### Development Workflow Protocol

The agent must follow this comprehensive workflow for all development tasks:

1. **Read replit.md first** → Understand system architecture and patterns
2. **Inventory existing working functionality** → Check buttons, forms, UI workflows
3. **Follow documented patterns** → Use established code patterns and conventions
4. **Implement ALL requested functionality** → Complete with working CRUD operations
5. **Preserve all existing working features** → Never break what already works
6. **Frontend Verification Process** (NEW):
   - Run automated verification: `node scripts/verify-frontend.js`
   - Check for TypeScript/LSP errors: `get_latest_lsp_diagnostics`
   - Monitor console logs for errors (no red errors should appear)
   - Verify network requests (all API calls should return 200, not 500)
   - Test UI interactions (buttons clickable, forms submittable)
   - Use `mark_completed_and_get_feedback` for visual verification
7. **Verify API endpoints return 200 not 500** → Check network tab and server logs
8. **Verify no regressions** → Test previously working functionality
9. **Update documentation after** → Document changes and new patterns

### Frontend Testing Checklist

After any frontend or API changes, verify:

#### Automated Checks
- [ ] Run verification script: `node scripts/verify-frontend.js`
- [ ] Check LSP diagnostics: No TypeScript errors
- [ ] Monitor workflow status: Server running without compilation errors
- [ ] Check console logs: No JavaScript errors in browser console

#### Manual Verification
- [ ] **Forms**: Render without errors, validation works, submit successfully
- [ ] **CRUD Operations**: Create, Read, Update, Delete all function
- [ ] **API Integration**: Loading states appear, errors handled gracefully
- [ ] **UI State**: Buttons responsive, dropdowns populate, modals work

#### Network Verification
- [ ] All API calls return 200 (success) status codes
- [ ] No 500 (server error) responses
- [ ] No 400 (bad request) errors from validation issues
- [ ] Authentication headers included in requests

#### Visual Verification
After fixes, use `mark_completed_and_get_feedback` with:
- Specific page route to check
- Clear description of expected behavior
- Request for user testing confirmation

### Error Pattern Recognition

Common errors and immediate fixes:
- `Cannot read property of undefined` → Add optional chaining (`?.`)
- `Failed to fetch` → Check API endpoint URL and CORS
- `400 Bad Request` → Validate request payload structure
- `401 Unauthorized` → Verify authentication flow
- `500 Internal Server Error` → Check server logs for detailed error

### Verification Documentation

The system includes:
- `scripts/verify-frontend.js` - Automated frontend verification
- `docs/FRONTEND_VERIFICATION.md` - Detailed testing procedures
- Enhanced error logging in API endpoints for debugging

The agent should never mark a task complete without running through this verification process. Documentation must be updated after task completion. The agent should never break existing working functionality.

## System Architecture

### Frontend Architecture
- **Framework**: React with Next.js 14+ and TypeScript.
- **Styling**: Tailwind CSS with Shadcn UI component library for consistent design.
- **State Management**: TanStack Query (React Query) for server state and caching.
- **Form Handling**: React Hook Form with Zod validation for type-safe forms.
- **Routing**: Wouter for lightweight client-side routing.
- **Document Viewing**: PDF.js integration for document preview functionality.
- **UI/UX**: Focus on intuitive forms and a kanban-style workflow for assignments. Color schemes and design follow modern SaaS aesthetics provided by Shadcn UI.

### Backend Architecture
- **Runtime**: Node.js with Express.js and TypeScript.
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations.
- **Authentication**: JWT-based authentication integrated with Replit Auth, utilizing session storage.
- **Job Processing**: BullMQ with Redis for background tasks (e.g., reminders, document processing).
- **API Design**: RESTful API with role-based access control and audit middleware for all sensitive operations.

### Data Storage Solutions
- **Primary Database**: PostgreSQL for relational data (users, clients, workers, assignments).
- **File Storage**: S3-compatible storage (configurable for AWS S3, MinIO, or Hetzner) for documents, utilizing signed URLs for secure direct uploads.
- **Session Storage**: PostgreSQL sessions table for authentication state.
- **Cache Layer**: Redis for job queues and temporary data caching.

### Authentication & Authorization
- **Dual Authentication Mode**: Feature flag (AUTH_MODE) supports both password-based authentication and Replit Auth (OIDC)
- **Password Authentication**: Argon2id hashing with JWT access/refresh token management and refresh token family rotation
- **Session Management**: Server-side sessions with PostgreSQL via `connect-pg-simple`, secure httpOnly cookies
- **Access Control**: Role-based permissions strictly enforced: ADMIN (full access), OWNER (manages own clients/workers), WORKER (views assignments, uploads documents), VIEWER (read-only)
- **Security**: CSRF protection via double-submit cookies, rate limiting on auth routes, comprehensive audit logging, secure token handling

### Document Management
- **PDF Generation**: Server-side PDF creation using PDFKit, with auto-population of predefined Romanian immigration templates.
- **File Upload**: Secure signed URL approach for direct S3 uploads, including metadata tracking, virus scanning, and validation.
- **Document Workflow**: Tracks document status from user upload through institutional submission.

### Background Processing
- **Queue System**: BullMQ ensures reliable processing of asynchronous tasks.
- **Reminder Engine**: Automates email notifications for critical deadlines and document expirations.
- **Job Types**: Includes document processing, email dispatch, and deadline monitoring.

### Core Features
- **Comprehensive Workflow Management**: Handles AJOFM Labor Market Tests, IGI Work Permit Applications, Consulate Visa Applications, and Residence Permit Applications.
- **Assignment Status Tracking**: Detailed status flow from `NOT_STARTED` to `ACCEPTED/REJECTED`.
- **Enhanced Worker Schema**: Stores over 50 fields of comprehensive immigration data, including personal, contact, passport, education, employment, immigration history, health, family, and financial details.
- **System Health Checks**: Dedicated `/health-check` endpoint with orchestrated tests (FileText, Shield, Database, Globe) and real-time logs via Server-Sent Events.
- **GDPR Compliance Suite**: Cookie banner with granular consent, privacy/cookie policies, data export/deletion endpoints, and comprehensive user rights management.
- **Security-First Design**: Enterprise-grade authentication, CSRF protection, rate limiting, secure session management, and comprehensive audit logging.

### New Authentication Endpoints
- `/auth/login` - Password-based login with JWT tokens
- `/auth/refresh` - Token refresh with family rotation
- `/auth/logout` - Secure logout with token revocation
- `/whoami` - User information with masked email
- `/healthz` - System health and feature status
- `/gdpr/export` - Personal data export (GDPR Article 20)
- `/gdpr/delete` - Data deletion request (GDPR Article 17)
- `/dev/test-credentials` - Development test account information

### Test Data
Demo accounts available via seeding script:
- `admin@demo.law` - System Administrator (ADMIN role)
- `client@demo.law` - Client Owner (OWNER role)  
- `worker@demo.law` - Worker (WORKER role)
- `viewer@demo.law` - Read-only access (VIEWER role)
- Default password: `Demo!2345`

## External Dependencies

### Cloud Infrastructure
- **Database Hosting**: Neon serverless PostgreSQL for scalable database operations.
- **File Storage**: S3-compatible object storage (AWS S3, MinIO for development, or Hetzner).
- **Redis Service**: Redis instance for job queues and session caching.

### Communication Services
- **Email Provider**: Mailjet or Postmark (EU region) for transactional emails and notifications.
- **Email Templates**: MJML-based responsive email templates for multi-language support.

### Development & Deployment
- **Package Manager**: npm for dependency management within a monorepo structure.
- **Development Environment**: Docker Compose for local development (PostgreSQL, Redis, MinIO).
- **Build System**: Vite for frontend bundling and esbuild for backend compilation.
- **Testing Framework**: Vitest for unit tests, Playwright for end-to-end testing.

### Authentication Integration
- **Replit Auth**: Primary authentication provider leveraging OpenID Connect.

### Romanian Government Integration
- **Target Systems**: Designed to interact with IGI (Romanian Immigration Office), AJOFM/ANOFM (Employment Agency), and Romanian consulates.
- **Compliance**: Adheres to Romanian legal document standards and GDPR for personal data handling.