# System Bible - ImmigrationFlow

## Overview
ImmigrationFlow is a comprehensive SaaS platform designed to streamline Romanian immigration workflows. It manages the entire process from labor market tests and work permits to visa applications and residence permits, offering multi-role access, robust document management with PDF generation, automated reminders, audit logging, and a kanban-style workflow interface. Its vision is to provide an efficient and compliant solution for immigration management, targeting businesses and individuals navigating the complex Romanian immigration landscape.

## User Preferences
Preferred communication style: Simple, everyday language.

### Development Workflow Protocol

The agent must follow this comprehensive workflow for all development tasks:

1.  **Read replit.md first** → Understand system architecture and patterns
2.  **Inventory existing working functionality** → Check buttons, forms, UI workflows
3.  **Follow documented patterns** → Use established code patterns and conventions
4.  **Implement ALL requested functionality** → Complete with working CRUD operations
5.  **Preserve all existing working features** → Never break what already works
6.  **Frontend Verification Process** (NEW):
    *   Run automated verification: `node scripts/verify-frontend.js`
    *   Check for TypeScript/LSP errors: `get_latest_lsp_diagnostics`
    *   Monitor console logs for errors (no red errors should appear)
    *   Verify network requests (all API calls should return 200, not 500)
    *   Test UI interactions (buttons clickable, forms submittable)
    *   Use `mark_completed_and_get_feedback` for visual verification
7.  **Verify API endpoints return 200 not 500** → Check network tab and server logs
8.  **Verify no regressions** → Test previously working functionality
9.  **Update documentation after** → Document changes and new patterns

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
- **Styling**: Tailwind CSS with Shadcn UI component library.
- **State Management**: TanStack Query (React Query) for server state and caching.
- **Form Handling**: React Hook Form with Zod validation.
- **Routing**: Wouter for lightweight client-side routing.
- **Document Viewing**: PDF.js integration.
- **UI/UX**: Intuitive forms and a kanban-style workflow, modern SaaS aesthetics via Shadcn UI.

### Backend Architecture
- **Runtime**: Node.js with Express.js and TypeScript.
- **Database**: PostgreSQL with Drizzle ORM.
- **Authentication**: JWT-based, integrated with Replit Auth.
- **Job Processing**: BullMQ with Redis for background tasks.
- **API Design**: RESTful with role-based access control and audit middleware.

### Data Storage Solutions
- **Primary Database**: PostgreSQL for relational data.
- **File Storage**: S3-compatible storage for documents, using signed URLs.
- **Session Storage**: PostgreSQL sessions table.
- **Cache Layer**: Redis for job queues and temporary data caching.

### Authentication & Authorization
- **Dual Authentication Mode**: Supports both password-based (Argon2id, JWT) and Replit Auth (OIDC).
- **Session Management**: Server-side sessions with PostgreSQL, secure httpOnly cookies.
- **Access Control**: Role-based permissions (ADMIN, OWNER, WORKER, VIEWER).
- **Security**: CSRF protection, rate limiting, comprehensive audit logging.

### Document Management
- **PDF Generation**: Server-side PDF creation using PDFKit, with template auto-population.
- **File Upload**: Secure signed URL approach for direct S3 uploads, with metadata tracking and validation.
- **Document Workflow**: Tracks status from upload to institutional submission.

### Background Processing
- **Queue System**: BullMQ for reliable asynchronous task processing.
- **Reminder Engine**: Automates email notifications for deadlines.
- **Job Types**: Document processing, email dispatch, deadline monitoring.

### Core Features
- **Comprehensive Workflow Management**: Handles AJOFM Labor Market Tests, IGI Work Permit Applications, Consulate Visa Applications, and Residence Permit Applications.
- **Assignment Status Tracking**: Detailed status flow.
- **Enhanced Worker Schema**: Stores comprehensive immigration data (50+ fields).
- **System Health Checks**: Dedicated `/health-check` endpoint with orchestrated tests and real-time logs.
- **GDPR Compliance Suite**: Cookie banner, privacy policies, data export/deletion, user rights management.
- **Security-First Design**: Enterprise-grade authentication, CSRF protection, rate limiting, secure session management, and comprehensive audit logging.

### QA Bridge API
The system includes a secure, token-gated control bridge at `/qa/bridge` for external agents to inspect and debug. It supports actions like `listFiles`, `readFile`, `writeFile`, `listRoutes`, `queryDB`, `runCommand`, `getLogs`, and `qaTests` with strong security measures including authentication, replay protection, rate limiting, path blocking, secret masking, SQL injection protection, and command allowlisting. All actions are audit logged.

### Regression Prevention Infrastructure
- **Baseline Snapshot**: v0.1.0-stable (2025-09-06) serves as a reference point for regression detection with 13/13 QA tests passing.
- **Automated Regression Check**: `node scripts/regression-check.mjs` validates all QA tests pass and provides detailed failure reporting, integrated into CI/CD.
- **Baseline Maintenance**: Provides `git checkout` commands for rolling back to stable and a feature development flow that includes type checking and regression checks. `/qa/status` endpoint provides current baseline status.

## External Dependencies

### Cloud Infrastructure
- **Database Hosting**: Neon serverless PostgreSQL.
- **File Storage**: S3-compatible object storage (AWS S3, MinIO, or Hetzner).
- **Redis Service**: Redis instance.

### Communication Services
- **Email Provider**: Mailjet or Postmark.
- **Email Templates**: MJML-based responsive templates.

### Development & Deployment
- **Package Manager**: npm.
- **Development Environment**: Docker Compose.
- **Build System**: Vite (frontend) and esbuild (backend).
- **Testing Framework**: Vitest (unit) and Playwright (E2E).

### Authentication Integration
- **Replit Auth**: Primary authentication provider.

### Romanian Government Integration
- **Target Systems**: Designed to interact with IGI (Romanian Immigration Office), AJOFM/ANOFM (Employment Agency), and Romanian consulates.
- **Compliance**: Adheres to Romanian legal document standards and GDPR.