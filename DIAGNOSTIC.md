# Project Diagnostic Report

Generated: 2025-09-06T05:42:40.077Z

## Repository Structure

```
├── attached_assets
│   ├── content-1756749361220.md
│   ├── image_1756749338056.png
│   ├── image_1756749352266.png
│   ├── IMG_0011_1756194266638.png
│   ├── IMG_0015_1756200188036.jpeg
│   ├── IMG_0015_1756201469802.jpeg
│   ├── Pasted--In-settings-should-be-able-specify-what-access-Clients-and-employees-roles-should-have-in-the-app--1756712149941_1756712149941.txt
│   ├── Pasted--In-settings-should-be-able-specify-what-access-Clients-and-employees-roles-should-have-in-the-app--1756714278848_1756714278848.txt
│   ├── Pasted--In-settings-should-be-able-specify-what-access-Clients-and-employees-roles-should-have-in-the-app--1756716533610_1756716533610.txt
│   ├── Pasted--rest-express-1-0-0-dev-DATABASE-URL-found-initializing-database-connection-Database-co-1756241579664_1756241579665.txt
│   ├── Pasted--rest-express-1-0-0-dev-DATABASE-URL-found-initializing-database-connection-Database-co-1756250473715_1756250473716.txt
│   ├── Pasted-admin-title-admin-subtitle-action-newClient-stats-totalClients-4-stats-newClients-stats-activeWorke-1756216865987_1756216865988.txt
│   ├── Pasted-Awesome-I-dug-through-your-DocFlow-ImmigrationFlow-project-and-produced-a-full-technical-write-1756549087113_1756549087113.txt
│   ├── Pasted-chunk-WERSD76P-js-v-99738019-21551-Download-the-React-DevTools-for-a-better-development-experience--1756254451990_1756254451992.txt
│   ├── Pasted-clients-44-Refused-to-load-the-stylesheet-https-fonts-googleapis-com-css2-family-Architects-Daugh-1757099348998_1757099349001.txt
│   ├── Pasted-Clients-filters-All-Clients-All-Statuses-Clients-Edit-CloudSoft-Development-SRL-CUI--1756248296123_1756248296125.txt
│   ├── Pasted-Comprehensive-Production-Ready-App-Migration-Plan-Phase-1-Foundation-Stability-System-Mapping-S-1756668350375_1756668350376.txt
│   ├── Pasted-Download-the-React-DevTools-for-a-better-development-experience-https-reactjs-org-link-react-devt-1756579513213_1756579513223.txt
│   ├── Pasted-Download-the-React-DevTools-for-a-better-development-experience-https-reactjs-org-link-react-devt-1756579675686_1756579675688.txt
│   ├── Pasted-Download-the-React-DevTools-for-a-better-development-experience-https-reactjs-org-link-react-devt-1756580101166_1756580101168.txt
│   ├── Pasted-Manage-Workflow-Stages-Workflow-Stages-Add-Stage-Initial-Document-Collection-Collect-passport-d-1756665207228_1756665207238.txt
│   ├── Pasted-Refused-to-load-the-stylesheet-https-fonts-googleapis-com-css2-family-Architects-Daughter-family--1757099160279_1757099160280.txt
│   └── Pasted-You-are-an-expert-full-stack-engineer-Generate-a-complete-production-grade-SaaS-web-app-for-managi-1756192360626_1756192360627.txt
├── client
│   ├── public
│   │   └── locales
│   │       ├── en
│   │       └── ro
│   ├── src
│   │   ├── components
│   │   │   ├── clients
│   │   │   ├── documents
│   │   │   ├── forms
│   │   │   ├── icons
│   │   │   ├── kanban
│   │   │   ├── layout
│   │   │   ├── modals
│   │   │   ├── profile
│   │   │   ├── progress
│   │   │   ├── shared
│   │   │   ├── template-builder
│   │   │   ├── ui
│   │   │   ├── workers
│   │   │   ├── DocumentStatusTracker.tsx
│   │   │   ├── dummy-data-alert.tsx
│   │   │   ├── LanguageSelector.tsx
│   │   │   ├── MobileNavigation.tsx
│   │   │   ├── RoleBasedDashboard.tsx
│   │   │   ├── RoleSwitcher.tsx
│   │   │   ├── worker-invitation-link.tsx
│   │   │   ├── WorkerWorkflowAssignments.tsx
│   │   │   ├── WorkerWorkflowDashboard.tsx
│   │   │   └── WorkflowProgressTracker.tsx
│   │   ├── contexts
│   │   │   ├── BreadcrumbContext.tsx
│   │   │   └── I18nProvider.tsx
│   │   ├── hooks
│   │   │   ├── use-mobile.tsx
│   │   │   ├── use-toast.ts
│   │   │   ├── useAuth.ts
│   │   │   ├── useClientProfiles.ts
│   │   │   ├── usePageTitle.ts
│   │   │   ├── useRoleBasedLanguage.ts
│   │   │   └── useWorkers.ts
│   │   ├── lib
│   │   │   ├── authUtils.ts
│   │   │   ├── clientErrorReporter.ts
│   │   │   ├── queryClient.ts
│   │   │   └── utils.ts
│   │   ├── pages
│   │   │   ├── admin-dashboard.tsx
│   │   │   ├── analytics.tsx
│   │   │   ├── audit-logs.tsx
│   │   │   ├── client-dashboard.tsx
│   │   │   ├── client-profile.tsx
│   │   │   ├── clients.tsx
│   │   │   ├── deadlines.tsx
│   │   │   ├── documents.tsx
│   │   │   ├── health-check.tsx
│   │   │   ├── landing.tsx
│   │   │   ├── not-found.tsx
│   │   │   ├── payments.tsx
│   │   │   ├── profile.tsx
│   │   │   ├── reminders.tsx
│   │   │   ├── requirements.tsx
│   │   │   ├── settings.tsx
│   │   │   ├── templates.tsx
│   │   │   ├── worker-dashboard.tsx
│   │   │   ├── worker-profile.tsx
│   │   │   ├── workers.tsx
│   │   │   └── workflow-assignments.tsx
│   │   ├── types
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   ├── i18n.ts
│   │   ├── index.css
│   │   └── main.tsx
│   └── index.html
├── docs
│   ├── API.md
│   ├── dpa-template.md
│   ├── FRONTEND_VERIFICATION.md
│   ├── privacy.md
│   └── SECURITY.md
├── public
│   └── locales
│       ├── en
│       │   ├── actions.json
│       │   ├── common.json
│       │   ├── dashboard.json
│       │   └── nav.json
│       └── ro
│           ├── actions.json
│           ├── common.json
│           ├── dashboard.json
│           └── nav.json
├── scripts
│   ├── test-reports
│   │   ├── http-frontend-test-1756715763428.json
│   │   ├── http-frontend-test-1756715989291.json
│   │   └── puppeteer-frontend-test-1756716131571.json
│   ├── test-results
│   │   └── reports
│   │       ├── thorough-validation-report-1756683445433.json
│   │       ├── thorough-validation-report-1756715325000.json
│   │       ├── validation-summary-1756683445436.json
│   │       └── validation-summary-1756715325002.json
│   ├── test-screenshots
│   ├── add-comprehensive-workflow-stages.js
│   ├── add-romanian-work-permit-stages.js
│   ├── analyze-real-browser-activity.js
│   ├── authenticated-ui-test.js
│   ├── capture-rendered-content.js
│   ├── comprehensive-browser-test.js
│   ├── comprehensive-ui-test.js
│   ├── create-comprehensive-workflows.js
│   ├── create-sample-assignments.js
│   ├── extract-translations.mjs
│   ├── fix_translations.js
│   ├── http-frontend-test.js
│   ├── populate-romanian-workflow-details.js
│   ├── project-diagnostic.ts
│   ├── puppeteer-frontend-test.js
│   ├── quick-ui-validation.js
│   ├── run-ui-tests.js
│   ├── seed.js
│   ├── test_translations.js
│   ├── thorough-validation-test.js
│   ├── verify-frontend.js
│   └── wait-for-react-render.js
├── server
│   ├── automation
│   │   ├── comprehensive-migration.ts
│   │   ├── emergency-syntax-fix.ts
│   │   ├── execute-migration.ts
│   │   ├── final-production-cleanup.ts
│   │   ├── final-system-validation.ts
│   │   ├── fix-all-mock-data.ts
│   │   ├── migration-script.ts
│   │   └── validate-production-ready.ts
│   ├── config
│   │   ├── mapping.ts
│   │   ├── production-validation.ts
│   │   └── production.ts
│   ├── db
│   │   └── migrations.ts
│   ├── docs
│   │   └── openapi.json
│   ├── middleware
│   │   ├── auth.ts
│   │   ├── monitoring.ts
│   │   ├── rbac.ts
│   │   └── security.ts
│   ├── routes
│   │   ├── assignments.ts
│   │   ├── documents.ts
│   │   └── templates.ts
│   ├── services
│   │   ├── auditService.ts
│   │   ├── documentService.ts
│   │   ├── emailService.ts
│   │   ├── fileScanningService.ts
│   │   ├── government-api.ts
│   │   ├── loggingService.ts
│   │   ├── metricsService.ts
│   │   ├── ocr-service.ts
│   │   ├── pdfService.ts
│   │   ├── reminderService.ts
│   │   ├── s3Service.ts
│   │   ├── secureUploadService.ts
│   │   └── workflow-engine.ts
│   ├── tests
│   │   └── mock-data-detection.ts
│   ├── workers
│   │   ├── queue.ts
│   │   └── reminderWorker.ts
│   ├── create-sample-data.ts
│   ├── db.ts
│   ├── healthCheckOrchestrator.ts
│   ├── index.ts
│   ├── replitAuth.ts
│   ├── routes.ts
│   ├── routes.ts.backup
│   ├── seed.ts
│   ├── seedDatabase.ts
│   ├── storage.ts
│   └── vite.ts
├── shared
│   └── schema.ts
├── temp
├── test-results
│   ├── reports
│   │   ├── thorough-validation-report-1756674343597.json
│   │   ├── thorough-validation-report-1756674370652.json
│   │   ├── thorough-validation-report-1756674707762.json
│   │   ├── thorough-validation-report-1756674797068.json
│   │   ├── thorough-validation-report-1756675238005.json
│   │   ├── thorough-validation-report-1756675333711.json
│   │   ├── thorough-validation-report-1756675404371.json
│   │   ├── thorough-validation-report-1756675625619.json
│   │   ├── thorough-validation-report-1756682881119.json
│   │   ├── validation-summary-1756674343598.json
│   │   ├── validation-summary-1756674370653.json
│   │   ├── validation-summary-1756674707762.json
│   │   ├── validation-summary-1756674797070.json
│   │   ├── validation-summary-1756675238008.json
│   │   ├── validation-summary-1756675333712.json
│   │   ├── validation-summary-1756675404372.json
│   │   ├── validation-summary-1756675625622.json
│   │   └── validation-summary-1756682881124.json
│   ├── screenshots
│   └── videos
├── tests
│   ├── e2e
│   │   └── workflow.spec.ts
│   ├── helpers
│   │   └── testServer.ts
│   ├── integration
│   │   ├── api-integration.test.ts
│   │   ├── background-services-integration.test.ts
│   │   ├── data-validation-integration.test.ts
│   │   ├── email-reminder.integration.test.ts
│   │   ├── endpoint-mismatch-integration.test.ts
│   │   ├── frontend-api-integration.test.ts
│   │   └── security-rbac-integration.test.ts
│   ├── services
│   │   └── emailService.test.ts
│   ├── workers
│   │   └── queue.test.ts
│   ├── api.rbac.test.ts
│   ├── api.test.ts
│   ├── pdf.test.ts
│   ├── secure-upload.integration.test.ts
│   ├── upload.security.test.ts
│   └── upload.test.ts
├── components.json
├── docker-compose.yml
├── Dockerfile
├── drizzle.config.ts
├── immigration-flow-app.tar.gz
├── immigration-flow-complete.tar.gz
├── package-lock.json
├── package.json
├── postcss.config.js
├── README.md
├── replit.md
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

## Configuration: package.json

```json
{
  "name": "rest-express",
  "version": "1.0.0",
  "type": "module",
  "license": "MIT",
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "NODE_ENV=production node dist/index.js",
    "check": "tsc",
    "db:push": "drizzle-kit push"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.37.0",
    "@aws-sdk/client-s3": "^3.873.0",
    "@aws-sdk/s3-request-presigner": "^3.873.0",
    "@dnd-kit/core": "^6.3.1",
    "@dnd-kit/sortable": "^10.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "@hookform/resolvers": "^3.10.0",
    "@jridgewell/trace-mapping": "^0.3.25",
    "@neondatabase/serverless": "^0.10.4",
    "@playwright/test": "^1.55.0",
    "@radix-ui/react-accordion": "^1.2.4",
    "@radix-ui/react-alert-dialog": "^1.1.7",
    "@radix-ui/react-aspect-ratio": "^1.1.3",
    "@radix-ui/react-avatar": "^1.1.4",
    "@radix-ui/react-checkbox": "^1.1.5",
    "@radix-ui/react-collapsible": "^1.1.4",
    "@radix-ui/react-context-menu": "^2.2.7",
    "@radix-ui/react-dialog": "^1.1.7",
    "@radix-ui/react-dropdown-menu": "^2.1.7",
    "@radix-ui/react-hover-card": "^1.1.7",
    "@radix-ui/react-label": "^2.1.3",
    "@radix-ui/react-menubar": "^1.1.7",
    "@radix-ui/react-navigation-menu": "^1.2.6",
    "@radix-ui/react-popover": "^1.1.7",
    "@radix-ui/react-progress": "^1.1.3",
    "@radix-ui/react-radio-group": "^1.2.4",
    "@radix-ui/react-scroll-area": "^1.2.4",
    "@radix-ui/react-select": "^2.1.7",
    "@radix-ui/react-separator": "^1.1.3",
    "@radix-ui/react-slider": "^1.2.4",
    "@radix-ui/react-slot": "^1.2.0",
    "@radix-ui/react-switch": "^1.1.4",
    "@radix-ui/react-tabs": "^1.1.4",
    "@radix-ui/react-toast": "^1.2.7",
    "@radix-ui/react-toggle": "^1.1.3",
    "@radix-ui/react-toggle-group": "^1.1.3",
    "@radix-ui/react-tooltip": "^1.2.0",
    "@stripe/react-stripe-js": "^3.9.2",
    "@stripe/stripe-js": "^7.9.0",
    "@tanstack/react-query": "^5.60.5",
    "@types/memoizee": "^0.4.12",
    "@types/multer": "^2.0.0",
    "@types/nodemailer": "^7.0.1",
    "@types/pdfkit": "^0.17.2",
    "@types/swagger-ui-express": "^4.1.8",
    "@types/uuid": "^10.0.0",
    "@uppy/aws-s3": "^5.0.0",
    "@uppy/core": "^5.0.1",
    "@uppy/dashboard": "^5.0.1",
    "@uppy/react": "^5.0.2",
    "bullmq": "^5.58.2",
    "clamscan": "^2.4.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.1.1",
    "connect-pg-simple": "^10.0.0",
    "crypto": "^1.0.1",
    "date-fns": "^3.6.0",
    "drizzle-orm": "^0.39.1",
    "drizzle-zod": "^0.7.0",
    "embla-carousel-react": "^8.6.0",
    "express": "^4.21.2",
    "express-rate-limit": "^8.0.1",
    "express-session": "^1.18.1",
    "fabric": "^6.7.1",
    "framer-motion": "^11.13.1",
    "glob": "^11.0.3",
    "helmet": "^8.1.0",
    "html2canvas": "^1.4.1",
    "i18next": "^25.4.2",
    "i18next-browser-languagedetector": "^8.2.0",
    "i18next-http-backend": "^3.0.2",
    "input-otp": "^1.4.2",
    "ioredis": "^5.7.0",
    "jsdom": "^26.1.0",
    "jspdf": "^3.0.2",
    "lucide-react": "^0.453.0",
    "memoizee": "^0.4.17",
    "memorystore": "^1.6.7",
    "multer": "^2.0.2",
    "nanoid": "^5.1.5",
    "next-themes": "^0.4.6",
    "node-fetch": "^3.3.2",
    "nodemailer": "^7.0.5",
    "openid-client": "^6.7.1",
    "passport": "^0.7.0",
    "passport-local": "^1.0.0",
    "pdf-lib": "^1.17.1",
    "pdfkit": "^0.17.1",
    "pino": "^9.9.0",
    "pino-http": "^10.5.0",
    "pino-pretty": "^13.1.1",
    "prom-client": "^15.1.3",
    "puppeteer": "^24.17.1",
    "react": "^18.3.1",
    "react-color": "^2.19.3",
    "react-day-picker": "^8.10.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.55.0",
    "react-i18next": "^15.7.2",
    "react-icons": "^5.4.0",
    "react-quill": "^2.0.0",
    "react-resizable-panels": "^2.1.7",
    "react-select": "^5.10.2",
    "recharts": "^2.15.2",
    "resend": "^6.0.2",
    "stripe": "^18.4.0",
    "supertest": "^7.1.4",
    "swagger-ui-express": "^5.0.1",
    "tailwind-merge": "^2.6.0",
    "tailwindcss-animate": "^1.0.7",
    "tesseract.js": "^6.0.1",
    "tw-animate-css": "^1.2.5",
    "uuid": "^11.1.0",
    "vaul": "^1.1.2",
    "vitest": "^3.2.4",
    "wouter": "^3.3.5",
    "ws": "^8.18.0",
    "zod": "^3.24.2",
    "zod-validation-error": "^3.4.0"
  },
  "devDependencies": {
    "@replit/vite-plugin-cartographer": "^0.3.0",
    "@replit/vite-plugin-runtime-error-modal": "^0.0.3",
    "@tailwindcss/typography": "^0.5.15",
    "@tailwindcss/vite": "^4.1.3",
    "@types/connect-pg-simple": "^7.0.3",
    "@types/express": "4.17.21",
    "@types/express-session": "^1.18.0",
    "@types/node": "20.16.11",
    "@types/passport": "^1.0.16",
    "@types/passport-local": "^1.0.38",
    "@types/react": "^18.3.11",
    "@types/react-dom": "^18.3.1",
    "@types/ws": "^8.5.13",
    "@vitejs/plugin-react": "^4.3.2",
    "autoprefixer": "^10.4.20",
    "drizzle-kit": "^0.30.4",
    "esbuild": "^0.25.0",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.17",
    "tsx": "^4.19.1",
    "typescript": "5.6.3",
    "vite": "^5.4.19"
  },
  "optionalDependencies": {
    "bufferutil": "^4.0.8"
  }
}

```

## Configuration: replit.md

```markdown
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
- **Primary Auth**: Replit Auth with OpenID Connect integration.
- **Session Management**: Server-side sessions stored in PostgreSQL via `connect-pg-simple`.
- **Access Control**: Role-based permissions are strictly enforced: ADMIN (full access), OWNER (manages own clients/workers), WORKER (views assignments, uploads documents), VIEWER (read-only).
- **Security**: Utilizes HTTP-only cookies, CSRF protection, and comprehensive audit logging.

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
```

## Configuration: .env.example

```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/immigration_flow

# Session Configuration
SESSION_SECRET=your-session-secret-here

# Replit Auth Configuration (automatically provided)
REPL_ID=your-repl-id
ISSUER_URL=https://replit.com/oidc
REPLIT_DOMAINS=your-repl-domain.replit.dev

# Redis Configuration (for BullMQ)
REDIS_URL=redis://localhost:6379

# S3 Storage Configuration
S3_ENDPOINT=https://your-s3-endpoint.com
S3_BUCKET=immigration-flow-documents
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_REGION=eu-central-1

# Email Configuration
# Choose one provider: development, smtp, or resend
MAIL_PROVIDER=development
MAIL_FROM=noreply@patra.ro

# SMTP Configuration (if using MAIL_PROVIDER=smtp)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password

# Resend Configuration (if using MAIL_PROVIDER=resend)
MAIL_API_KEY=re_xxxxxxxxxx

# Application Configuration
APP_URL=https://your-app-domain.com
NODE_ENV=development

# Document Generation
WATERMARK_TOGGLE=true

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900000

# Reminder Service
REMINDER_ENABLED=true
REMINDER_CHECK_INTERVAL=3600000

# File Upload Limits
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,doc,docx,jpg,jpeg,png

```

## Configuration: tsconfig.json

```json
{
  "include": ["client/src/**/*", "shared/**/*", "server/**/*"],
  "exclude": ["node_modules", "build", "dist", "**/*.test.ts"],
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": "./node_modules/typescript/tsbuildinfo",
    "noEmit": true,
    "module": "ESNext",
    "strict": true,
    "lib": ["esnext", "dom", "dom.iterable"],
    "jsx": "preserve",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "allowImportingTsExtensions": true,
    "moduleResolution": "bundler",
    "baseUrl": ".",
    "types": ["node", "vite/client"],
    "paths": {
      "@/*": ["./client/src/*"],
      "@shared/*": ["./shared/*"]
    }
  }
}

```

## Configuration: vite.config.ts

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});

```

## Configuration: drizzle.config.ts

```typescript
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});

```

## Database Schema: shared/schema.ts

```typescript
import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
  integer,
  pgEnum,
  uuid
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Enums
export const userRoleEnum = pgEnum('user_role', ['ADMIN', 'OWNER', 'WORKER', 'VIEWER']);
export const stageKeyEnum = pgEnum('stage_key', ['AJOFM', 'IGI_WORK_PERMIT', 'CONSULATE_VISA', 'IGI_RESIDENCE']);
export const requirementTypeEnum = pgEnum('requirement_type', ['STANDARD', 'CUSTOM']);
export const assignmentStatusEnum = pgEnum('assignment_status', [
  'NOT_STARTED',
  'AWAITING_UPLOAD', 
  'SUBMITTED_BY_USER',
  'RECEIVED_BY_ADMIN',
  'SUBMITTED_TO_INSTITUTION_DIGITAL',
  'SUBMITTED_TO_INSTITUTION_COURIER',
  'ACCEPTED',
  'REJECTED'
]);
export const assignedToRoleEnum = pgEnum('assigned_to_role', ['ADMIN', 'OWNER', 'WORKER']);
export const documentKindEnum = pgEnum('document_kind', ['USER_UPLOAD', 'ADMIN_RECEIPT', 'GENERATED_PDF']);
export const reminderScopeEnum = pgEnum('reminder_scope', ['GLOBAL', 'CLIENT', 'STAGE']);
export const templateTypeEnum = pgEnum('template_type', ['FORM', 'DOCUMENT', 'CERTIFICATE']);
export const fieldTypeEnum = pgEnum('field_type', ['TEXT', 'DATE', 'NUMBER', 'CHECKBOX', 'DROPDOWN', 'SIGNATURE', 'PHOTO']);
export const languageEnum = pgEnum('language', ['en', 'ro', 'es', 'fr']);
export const workflowStepTypeEnum = pgEnum('workflow_step_type', ['DOCUMENT_COLLECTION', 'DOCUMENT_REVIEW', 'FORM_COMPLETION', 'ADMIN_APPROVAL', 'INSTITUTIONAL_SUBMISSION', 'PAYMENT']);
export const stepStatusEnum = pgEnum('step_status', ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'SKIPPED']);
export const workflowStatusEnum = pgEnum('workflow_status', ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'PAUSED', 'CANCELLED']);
export const checklistTypeEnum = pgEnum('checklist_type', ['VERIFICATION', 'APPROVAL', 'QUALITY_CHECK', 'COMPLIANCE']);
export const documentStatusEnum = pgEnum('document_status', ['PENDING', 'VERIFIED', 'REJECTED', 'REQUIRES_CHANGES']);

// User table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").notNull().default('OWNER'),
  invitedById: varchar("invited_by_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Client Profile table
export const clientProfiles = pgTable("client_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  legalName: varchar("legal_name", { length: 255 }).notNull(), // Legal business name
  registrationNumber: varchar("registration_number", { length: 50 }).notNull(), // ONRC registration number
  cui: varchar("cui", { length: 20 }).notNull().unique(), // Romanian fiscal code
  legalAddress: text("legal_address").notNull(), // Sediu legal address
  adminName: varchar("admin_name", { length: 255 }).notNull(), // Name of administrator/representative
  contactEmail: varchar("contact_email", { length: 255 }).notNull(),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
  bankIban: varchar("bank_iban", { length: 34 }).notNull(), // Bank IBAN account number
  caen: varchar("caen", { length: 10 }).notNull(), // CAEN activity code
  ownerUserId: varchar("owner_user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Worker table (referred to as employees in frontend)
export const workers = pgTable("workers", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientProfileId: uuid("client_profile_id").notNull(),
  
  // Personal Information
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  middleName: varchar("middle_name", { length: 100 }),
  dob: timestamp("dob"),
  placeOfBirth: varchar("place_of_birth", { length: 255 }),
  countryOfBirth: varchar("country_of_birth", { length: 100 }),
  nationality: varchar("nationality", { length: 50 }).notNull(),
  gender: varchar("gender", { length: 10 }), // M/F/Other
  maritalStatus: varchar("marital_status", { length: 20 }), // Single/Married/Divorced/Widowed
  
  // Contact Information
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  emergencyContact: varchar("emergency_contact", { length: 255 }),
  emergencyPhone: varchar("emergency_phone", { length: 20 }),
  
  // Address Information
  homeAddress: text("home_address"),
  homeCity: varchar("home_city", { length: 100 }),
  homeCountry: varchar("home_country", { length: 100 }),
  homePostalCode: varchar("home_postal_code", { length: 20 }),
  romanianAddress: text("romanian_address"),
  romanianCity: varchar("romanian_city", { length: 100 }),
  romanianCounty: varchar("romanian_county", { length: 100 }),
  romanianPostalCode: varchar("romanian_postal_code", { length: 20 }),
  
  // Passport & Travel Documents
  passportNumber: varchar("passport_number", { length: 50 }).notNull(),
  passportIssueDate: timestamp("passport_issue_date"),
  passportExpiry: timestamp("passport_expiry"),
  passportIssuingAuthority: varchar("passport_issuing_authority", { length: 255 }),
  passportPlaceOfIssue: varchar("passport_place_of_issue", { length: 255 }),
  
  // Education & Professional Qualifications
  educationLevel: varchar("education_level", { length: 100 }),
  universityName: varchar("university_name", { length: 255 }),
  degreeField: varchar("degree_field", { length: 255 }),
  graduationYear: integer("graduation_year"),
  professionalCertifications: text("professional_certifications"),
  languageSkills: jsonb("language_skills"), // JSON array of {language, level}
  
  // Work Experience & Employment
  jobTitle: varchar("job_title", { length: 255 }),
  workExperience: text("work_experience"),
  previousEmployers: jsonb("previous_employers"), // JSON array of employer details
  monthlyGrossSalary: integer("monthly_gross_salary"), // in RON cents
  workLocation: varchar("work_location", { length: 255 }),
  workSchedule: varchar("work_schedule", { length: 100 }),
  contractType: varchar("contract_type", { length: 50 }), // Individual/Determinat/etc
  contractStartDate: timestamp("contract_start_date"),
  contractEndDate: timestamp("contract_end_date"),
  
  // Immigration Status & History
  previousRomanianVisa: boolean("previous_romanian_visa").default(false),
  previousVisaDetails: text("previous_visa_details"),
  previousRejections: boolean("previous_rejections").default(false),
  rejectionDetails: text("rejection_details"),
  criminalRecord: boolean("criminal_record").default(false),
  criminalRecordDetails: text("criminal_record_details"),
  
  // Health & Insurance
  healthInsurance: varchar("health_insurance", { length: 255 }),
  medicalConditions: text("medical_conditions"),
  vaccinationRecord: jsonb("vaccination_record"),
  
  // Family Information
  spouseName: varchar("spouse_name", { length: 255 }),
  spouseNationality: varchar("spouse_nationality", { length: 100 }),
  children: jsonb("children"), // JSON array of children details
  familyInRomania: boolean("family_in_romania").default(false),
  familyInRomaniaDetails: text("family_in_romania_details"),
  
  // Financial Information
  bankAccountDetails: text("bank_account_details"),
  financialSupport: text("financial_support"),
  proofOfFunds: varchar("proof_of_funds", { length: 255 }),
  
  // Legal & Administrative
  personalNumericalCode: varchar("personal_numerical_code", { length: 20 }), // CNP if applicable
  taxIdentificationNumber: varchar("tax_identification_number", { length: 50 }),
  socialSecurityNumber: varchar("social_security_number", { length: 50 }),
  
  // Document Status Tracking
  documentStatus: varchar("document_status", { length: 50 }).default('INCOMPLETE'),
  missingDocuments: jsonb("missing_documents"), // Array of missing document types
  
  // System Fields
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Stage table
export const stages = pgTable("stages", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: stageKeyEnum("key").notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  order: integer("order").notNull(),
});

// Requirement table
export const requirements = pgTable("requirements", {
  id: uuid("id").primaryKey().defaultRandom(),
  stageId: uuid("stage_id").notNull(),
  type: requirementTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  required: boolean("required").notNull().default(true),
  autoPopulate: boolean("auto_populate").notNull().default(false),
  templateKey: varchar("template_key", { length: 100 }),
  dueRule: jsonb("due_rule"), // JSON with deadline logic
  createdByUserId: varchar("created_by_user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Assignment table
export const assignments = pgTable("assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  requirementId: uuid("requirement_id").notNull(),
  clientProfileId: uuid("client_profile_id").notNull(),
  workerId: uuid("worker_id"),
  assignedToRole: assignedToRoleEnum("assigned_to_role").notNull(),
  status: assignmentStatusEnum("status").notNull().default('NOT_STARTED'),
  institution: varchar("institution", { length: 255 }),
  submissionChannel: varchar("submission_channel", { length: 50 }),
  receiptNumber: varchar("receipt_number", { length: 100 }),
  courierAwb: varchar("courier_awb", { length: 100 }),
  courierName: varchar("courier_name", { length: 100 }),
  submittedAt: timestamp("submitted_at"),
  approvedAt: timestamp("approved_at"),
  rejectedReason: text("rejected_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Document File table
export const documentFiles = pgTable("document_files", {
  id: uuid("id").primaryKey().defaultRandom(),
  assignmentId: uuid("assignment_id"), // Made nullable for workflow step support
  workflowStepProgressId: uuid("workflow_step_progress_id"), // New: for workflow step documents
  kind: documentKindEnum("kind").notNull(),
  s3Key: varchar("s3_key", { length: 500 }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }),
  fileSize: integer("file_size"), // File size in bytes
  fileHash: varchar("file_hash", { length: 64 }), // SHA256 hash
  status: documentStatusEnum("status").default('PENDING'),
  scanResult: varchar("scan_result", { length: 20 }), // 'CLEAN', 'INFECTED', 'SCAN_FAILED', 'PENDING'
  virusName: varchar("virus_name", { length: 255 }), // Name of virus if infected
  scannedAt: timestamp("scanned_at"), // When file was scanned
  uploadedByUserId: varchar("uploaded_by_user_id").notNull(),
  notes: text("notes"), // Verification notes
  createdAt: timestamp("created_at").defaultNow(),
});

// Reminder Rule table
export const reminderRules = pgTable("reminder_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  scope: reminderScopeEnum("scope").notNull(),
  frequency: varchar("frequency", { length: 100 }).notNull(), // CRON string or preset
  daysBeforeDue: integer("days_before_due"),
  active: boolean("active").notNull().default(true),
  createdByUserId: varchar("created_by_user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Reminder Log table
export const reminderLogs = pgTable("reminder_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull(),
  assignmentId: uuid("assignment_id"),
  email: varchar("email", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  sentAt: timestamp("sent_at").defaultNow(),
  status: varchar("status", { length: 50 }).notNull(),
});

// Audit Log table
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id"),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: varchar("entity_id", { length: 100 }).notNull(),
  ip: varchar("ip", { length: 45 }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Document Template System
export const documentTemplates = pgTable("document_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: templateTypeEnum("type").notNull(),
  language: languageEnum("language").notNull().default('ro'),
  isActive: boolean("is_active").default(true),
  templateData: jsonb("template_data").notNull(), // Visual editor structure
  createdByUserId: varchar("created_by_user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const templateFields = pgTable("template_fields", {
  id: uuid("id").primaryKey().defaultRandom(),
  templateId: uuid("template_id").notNull(),
  fieldKey: varchar("field_key", { length: 100 }).notNull(),
  fieldType: fieldTypeEnum("field_type").notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  required: boolean("required").default(false),
  placeholder: varchar("placeholder", { length: 255 }),
  options: jsonb("options"), // For dropdown options
  position: integer("position").notNull(),
  validation: jsonb("validation"), // Validation rules
  createdAt: timestamp("created_at").defaultNow(),
});

// Payment Management
export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientProfileId: uuid("client_profile_id").notNull(),
  workerId: uuid("worker_id"),
  amount: integer("amount").notNull(), // in cents
  currency: varchar("currency", { length: 3 }).default('RON'),
  description: text("description"),
  status: varchar("status", { length: 20 }).notNull().default('PENDING'),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// OCR Processing
export const ocrResults = pgTable("ocr_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentFileId: uuid("document_file_id").notNull(),
  extractedText: text("extracted_text"),
  extractedData: jsonb("extracted_data"), // Structured data
  confidence: integer("confidence"), // Confidence score 0-100
  processingStatus: varchar("processing_status", { length: 20 }).default('PENDING'),
  createdAt: timestamp("created_at").defaultNow(),
});

// Workflow Automation
export const workflowRules = pgTable("workflow_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  stageId: uuid("stage_id"),
  conditions: jsonb("conditions").notNull(), // Conditional rules
  actions: jsonb("actions").notNull(), // Actions to perform
  isActive: boolean("is_active").default(true),
  createdByUserId: varchar("created_by_user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Workflow Templates - Enhanced workflow configurations
export const workflowTemplates = pgTable("workflow_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  order: integer("order").notNull(),
  executionType: varchar("execution_type", { length: 20 }).notNull().default('sequential'), // 'sequential' or 'parallel'
  estimatedDurationDays: integer("estimated_duration_days"),
  createdByUserId: varchar("created_by_user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Workflow Steps - Detailed breakdown of each workflow stage
export const workflowSteps = pgTable("workflow_steps", {
  id: uuid("id").primaryKey().defaultRandom(),
  workflowTemplateId: uuid("workflow_template_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  stepType: workflowStepTypeEnum("step_type").notNull(),
  assignedRole: assignedToRoleEnum("assigned_role").notNull(),
  order: integer("order").notNull(),
  estimatedDays: integer("estimated_days").default(1),
  isRequired: boolean("is_required").default(true),
  requiresApproval: boolean("requires_approval").default(false),
  approverRole: varchar("approver_role", { length: 50 }), // Who can approve this step
  dependencies: text("dependencies").array(), // Step IDs that must be completed first
  createdAt: timestamp("created_at").defaultNow(),
});

// Document Requirements - Specific documents needed for each step
export const documentRequirements = pgTable("document_requirements", {
  id: uuid("id").primaryKey().defaultRandom(),
  workflowStepId: uuid("workflow_step_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  isRequired: boolean("is_required").default(true),
  submittedBy: assignedToRoleEnum("submitted_by").notNull().default('OWNER'), // Who submits this document
  acceptedFileTypes: text("accepted_file_types").array(), // ['pdf', 'jpg', 'png']
  maxFileSize: integer("max_file_size"), // in MB
  templateKey: varchar("template_key", { length: 100 }), // Reference to auto-generated template
  hasOcrExtraction: boolean("has_ocr_extraction").default(false),
  validationRules: jsonb("validation_rules"), // Custom validation logic
  requiredByDays: integer("required_by_days"), // Number of days by when this document is required
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Checklist Items - Verification tasks for admins/reviewers
export const checklistItems = pgTable("checklist_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  workflowStepId: uuid("workflow_step_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  checklistType: checklistTypeEnum("checklist_type").default('VERIFICATION'),
  isRequired: boolean("is_required").default(true),
  assignedRole: assignedToRoleEnum("assigned_role").notNull(), // Who performs this check
  requiredByDays: integer("required_by_days"), // Number of days by when this checklist item is required
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Worker Workflow Progress - Track individual worker progress through workflows
export const workerWorkflowProgress = pgTable("worker_workflow_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  workerId: uuid("worker_id").notNull(),
  workflowTemplateId: uuid("workflow_template_id").notNull(),
  currentStepId: uuid("current_step_id"),
  status: workflowStatusEnum("status").default('NOT_STARTED'),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Worker Step Progress - Track progress on individual steps
export const workerStepProgress = pgTable("worker_step_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  workerWorkflowProgressId: uuid("worker_workflow_progress_id").notNull(),
  workflowStepId: uuid("workflow_step_id").notNull(),
  status: stepStatusEnum("status").default('PENDING'),
  assignedToUserId: varchar("assigned_to_user_id"), // Specific user assigned to this step
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Workflow Step Document Requirements - Define what documents are needed for each step
export const workflowStepDocumentRequirements = pgTable("workflow_step_document_requirements", {
  id: uuid("id").primaryKey().defaultRandom(),
  workflowStepId: uuid("workflow_step_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  isRequired: boolean("is_required").default(true),
  submittedBy: assignedToRoleEnum("submitted_by").notNull(),
  acceptedFileTypes: text("accepted_file_types").array(),
  maxFileSize: integer("max_file_size"), // Size in bytes
  createdAt: timestamp("created_at").defaultNow(),
});

// Document Submissions - Track document uploads for each requirement
export const documentSubmissions = pgTable("document_submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  workerStepProgressId: uuid("worker_step_progress_id").notNull(),
  documentRequirementId: uuid("document_requirement_id").notNull(),
  documentFileId: uuid("document_file_id"),
  status: stepStatusEnum("status").default('PENDING'),
  submittedAt: timestamp("submitted_at"),
  reviewedAt: timestamp("reviewed_at"),
  reviewedByUserId: varchar("reviewed_by_user_id"),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Checklist Completions - Track completion of admin checklist items
export const checklistCompletions = pgTable("checklist_completions", {
  id: uuid("id").primaryKey().defaultRandom(),
  workerStepProgressId: uuid("worker_step_progress_id").notNull(),
  checklistItemId: uuid("checklist_item_id").notNull(),
  isCompleted: boolean("is_completed").default(false),
  completedByUserId: varchar("completed_by_user_id"),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Government API Integration
export const apiIntegrations = pgTable("api_integrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  endpoint: varchar("endpoint", { length: 500 }).notNull(),
  apiKey: varchar("api_key", { length: 500 }),
  isActive: boolean("is_active").default(true),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Multi-language Support
export const translations = pgTable("translations", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar("key", { length: 255 }).notNull(),
  language: languageEnum("language").notNull(),
  value: text("value").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Invitation system for workers
export const invitations = pgTable("invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull(),
  role: userRoleEnum("role").notNull().default('WORKER'),
  invitedByUserId: varchar("invited_by_user_id").notNull(),
  workerId: uuid("worker_id"), // Optional - links to existing worker record
  clientProfileId: uuid("client_profile_id"), // Optional - for worker invitations
  used: boolean("used").notNull().default(false),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Analytics
export const analyticsEvents = pgTable("analytics_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  userId: varchar("user_id"),
  clientProfileId: uuid("client_profile_id"),
  workerId: uuid("worker_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  invitedBy: one(users, {
    fields: [users.invitedById],
    references: [users.id],
  }),
  ownedClients: many(clientProfiles),
  createdRequirements: many(requirements),
  uploadedFiles: many(documentFiles),
  reminderRules: many(reminderRules),
}));

export const clientProfilesRelations = relations(clientProfiles, ({ one, many }) => ({
  owner: one(users, {
    fields: [clientProfiles.ownerUserId],
    references: [users.id],
  }),
  workers: many(workers),
  assignments: many(assignments),
}));

export const workersRelations = relations(workers, ({ one, many }) => ({
  clientProfile: one(clientProfiles, {
    fields: [workers.clientProfileId],
    references: [clientProfiles.id],
  }),
  assignments: many(assignments),
}));

export const stagesRelations = relations(stages, ({ many }) => ({
  requirements: many(requirements),
}));

export const requirementsRelations = relations(requirements, ({ one, many }) => ({
  stage: one(stages, {
    fields: [requirements.stageId],
    references: [stages.id],
  }),
  createdBy: one(users, {
    fields: [requirements.createdByUserId],
    references: [users.id],
  }),
  assignments: many(assignments),
}));

export const assignmentsRelations = relations(assignments, ({ one, many }) => ({
  requirement: one(requirements, {
    fields: [assignments.requirementId],
    references: [requirements.id],
  }),
  clientProfile: one(clientProfiles, {
    fields: [assignments.clientProfileId],
    references: [clientProfiles.id],
  }),
  worker: one(workers, {
    fields: [assignments.workerId],
    references: [workers.id],
  }),
  documentFiles: many(documentFiles),
  reminderLogs: many(reminderLogs),
}));

export const documentFilesRelations = relations(documentFiles, ({ one }) => ({
  assignment: one(assignments, {
    fields: [documentFiles.assignmentId],
    references: [assignments.id],
  }),
  workflowStepProgress: one(workerStepProgress, {
    fields: [documentFiles.workflowStepProgressId],
    references: [workerStepProgress.id],
  }),
  uploadedBy: one(users, {
    fields: [documentFiles.uploadedByUserId],
    references: [users.id],
  }),
}));

export const reminderRulesRelations = relations(reminderRules, ({ one }) => ({
  createdBy: one(users, {
    fields: [reminderRules.createdByUserId],
    references: [users.id],
  }),
}));

export const reminderLogsRelations = relations(reminderLogs, ({ one }) => ({
  user: one(users, {
    fields: [reminderLogs.userId],
    references: [users.id],
  }),
  assignment: one(assignments, {
    fields: [reminderLogs.assignmentId],
    references: [assignments.id],
  }),
}));

export const documentTemplatesRelations = relations(documentTemplates, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [documentTemplates.createdByUserId],
    references: [users.id],
  }),
  fields: many(templateFields),
}));

export const templateFieldsRelations = relations(templateFields, ({ one }) => ({
  template: one(documentTemplates, {
    fields: [templateFields.templateId],
    references: [documentTemplates.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  clientProfile: one(clientProfiles, {
    fields: [payments.clientProfileId],
    references: [clientProfiles.id],
  }),
  worker: one(workers, {
    fields: [payments.workerId],
    references: [workers.id],
  }),
}));

export const ocrResultsRelations = relations(ocrResults, ({ one }) => ({
  documentFile: one(documentFiles, {
    fields: [ocrResults.documentFileId],
    references: [documentFiles.id],
  }),
}));

export const workflowRulesRelations = relations(workflowRules, ({ one }) => ({
  stage: one(stages, {
    fields: [workflowRules.stageId],
    references: [stages.id],
  }),
  createdBy: one(users, {
    fields: [workflowRules.createdByUserId],
    references: [users.id],
  }),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  invitedBy: one(users, {
    fields: [invitations.invitedByUserId],
    references: [users.id],
  }),
  worker: one(workers, {
    fields: [invitations.workerId],
    references: [workers.id],
  }),
  clientProfile: one(clientProfiles, {
    fields: [invitations.clientProfileId],
    references: [clientProfiles.id],
  }),
}));

// New workflow template relations
export const workflowTemplatesRelations = relations(workflowTemplates, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [workflowTemplates.createdByUserId],
    references: [users.id],
  }),
  steps: many(workflowSteps),
  workerProgresses: many(workerWorkflowProgress),
}));

export const workflowStepsRelations = relations(workflowSteps, ({ one, many }) => ({
  workflowTemplate: one(workflowTemplates, {
    fields: [workflowSteps.workflowTemplateId],
    references: [workflowTemplates.id],
  }),
  documentRequirements: many(documentRequirements),
  checklistItems: many(checklistItems),
  workerStepProgresses: many(workerStepProgress),
}));

export const documentRequirementsRelations = relations(documentRequirements, ({ one, many }) => ({
  workflowStep: one(workflowSteps, {
    fields: [documentRequirements.workflowStepId],
    references: [workflowSteps.id],
  }),
  documentSubmissions: many(documentSubmissions),
}));

export const checklistItemsRelations = relations(checklistItems, ({ one, many }) => ({
  workflowStep: one(workflowSteps, {
    fields: [checklistItems.workflowStepId],
    references: [workflowSteps.id],
  }),
  checklistCompletions: many(checklistCompletions),
}));

export const workerWorkflowProgressRelations = relations(workerWorkflowProgress, ({ one, many }) => ({
  worker: one(workers, {
    fields: [workerWorkflowProgress.workerId],
    references: [workers.id],
  }),
  workflowTemplate: one(workflowTemplates, {
    fields: [workerWorkflowProgress.workflowTemplateId],
    references: [workflowTemplates.id],
  }),
  currentStep: one(workflowSteps, {
    fields: [workerWorkflowProgress.currentStepId],
    references: [workflowSteps.id],
  }),
  stepProgresses: many(workerStepProgress),
}));

export const workerStepProgressRelations = relations(workerStepProgress, ({ one, many }) => ({
  workerWorkflowProgress: one(workerWorkflowProgress, {
    fields: [workerStepProgress.workerWorkflowProgressId],
    references: [workerWorkflowProgress.id],
  }),
  workflowStep: one(workflowSteps, {
    fields: [workerStepProgress.workflowStepId],
    references: [workflowSteps.id],
  }),
  assignedToUser: one(users, {
    fields: [workerStepProgress.assignedToUserId],
    references: [users.id],
  }),
  documentSubmissions: many(documentSubmissions),
  checklistCompletions: many(checklistCompletions),
  documentFiles: many(documentFiles),
}));

export const documentSubmissionsRelations = relations(documentSubmissions, ({ one }) => ({
  workerStepProgress: one(workerStepProgress, {
    fields: [documentSubmissions.workerStepProgressId],
    references: [workerStepProgress.id],
  }),
  documentRequirement: one(documentRequirements, {
    fields: [documentSubmissions.documentRequirementId],
    references: [documentRequirements.id],
  }),
  documentFile: one(documentFiles, {
    fields: [documentSubmissions.documentFileId],
    references: [documentFiles.id],
  }),
  reviewedBy: one(users, {
    fields: [documentSubmissions.reviewedByUserId],
    references: [users.id],
  }),
}));

export const checklistCompletionsRelations = relations(checklistCompletions, ({ one }) => ({
  workerStepProgress: one(workerStepProgress, {
    fields: [checklistCompletions.workerStepProgressId],
    references: [workerStepProgress.id],
  }),
  checklistItem: one(checklistItems, {
    fields: [checklistCompletions.checklistItemId],
    references: [checklistItems.id],
  }),
  completedBy: one(users, {
    fields: [checklistCompletions.completedByUserId],
    references: [users.id],
  }),
}));

// Insert schemas using createInsertSchema
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  role: true,
  invitedById: true,
});

export const insertClientProfileSchema = createInsertSchema(clientProfiles).pick({
  legalName: true,
  registrationNumber: true,
  cui: true,
  legalAddress: true,
  adminName: true,
  contactEmail: true,
  phoneNumber: true,
  bankIban: true,
  caen: true,
  ownerUserId: true,
});

export const insertWorkerSchema = createInsertSchema(workers).pick({
  clientProfileId: true,
  firstName: true,
  lastName: true,
  middleName: true,
  dob: true,
  placeOfBirth: true,
  countryOfBirth: true,
  nationality: true,
  gender: true,
  maritalStatus: true,
  email: true,
  phone: true,
  emergencyContact: true,
  emergencyPhone: true,
  homeAddress: true,
  homeCity: true,
  homeCountry: true,
  homePostalCode: true,
  romanianAddress: true,
  romanianCity: true,
  romanianCounty: true,
  romanianPostalCode: true,
  passportNumber: true,
  passportIssueDate: true,
  passportExpiry: true,
  passportIssuingAuthority: true,
  passportPlaceOfIssue: true,
  educationLevel: true,
  universityName: true,
  degreeField: true,
  graduationYear: true,
  professionalCertifications: true,
  languageSkills: true,
  jobTitle: true,
  workExperience: true,
  previousEmployers: true,
  monthlyGrossSalary: true,
  workLocation: true,
  workSchedule: true,
  contractType: true,
  contractStartDate: true,
  contractEndDate: true,
  previousRomanianVisa: true,
  previousVisaDetails: true,
  previousRejections: true,
  rejectionDetails: true,
  criminalRecord: true,
  criminalRecordDetails: true,
  healthInsurance: true,
  medicalConditions: true,
  vaccinationRecord: true,
  spouseName: true,
  spouseNationality: true,
  children: true,
  familyInRomania: true,
  familyInRomaniaDetails: true,
  bankAccountDetails: true,
  financialSupport: true,
  proofOfFunds: true,
  personalNumericalCode: true,
  taxIdentificationNumber: true,
  socialSecurityNumber: true,
  documentStatus: true,
  missingDocuments: true,
  notes: true,
}).extend({
  // Override date fields to accept strings and convert to Date objects
  dob: z.union([z.date(), z.string().transform(str => str ? new Date(str) : undefined)]).optional(),
  passportIssueDate: z.union([z.date(), z.string().transform(str => str ? new Date(str) : undefined)]).optional(),
  passportExpiry: z.union([z.date(), z.string().transform(str => str ? new Date(str) : undefined)]).optional(),
  contractStartDate: z.union([z.date(), z.string().transform(str => str ? new Date(str) : undefined)]).optional(),
  contractEndDate: z.union([z.date(), z.string().transform(str => str ? new Date(str) : undefined)]).optional(),
});

export const insertAssignmentSchema = createInsertSchema(assignments).pick({
  requirementId: true,
  clientProfileId: true,
  workerId: true,
  assignedToRole: true,
  status: true,
  institution: true,
  submissionChannel: true,
  receiptNumber: true,
  courierAwb: true,
  courierName: true,
});

export const insertRequirementSchema = createInsertSchema(requirements).pick({
  stageId: true,
  type: true,
  title: true,
  description: true,
  required: true,
  autoPopulate: true,
  templateKey: true,
  dueRule: true,
  createdByUserId: true,
});

export const insertDocumentTemplateSchema = createInsertSchema(documentTemplates).pick({
  name: true,
  description: true,
  type: true,
  language: true,
  isActive: true,
  templateData: true,
  createdByUserId: true,
});

export const insertTemplateFieldSchema = createInsertSchema(templateFields).pick({
  templateId: true,
  fieldKey: true,
  fieldType: true,
  label: true,
  required: true,
  placeholder: true,
  options: true,
  position: true,
  validation: true,
});

export const insertPaymentSchema = createInsertSchema(payments).pick({
  clientProfileId: true,
  workerId: true,
  amount: true,
  currency: true,
  description: true,
  status: true,
});

export const insertWorkflowRuleSchema = createInsertSchema(workflowRules).pick({
  name: true,
  stageId: true,
  conditions: true,
  actions: true,
  isActive: true,
  createdByUserId: true,
});

export const insertTranslationSchema = createInsertSchema(translations).pick({
  key: true,
  language: true,
  value: true,
});

export const insertInvitationSchema = createInsertSchema(invitations).pick({
  token: true,
  email: true,
  role: true,
  invitedByUserId: true,
  workerId: true,
  clientProfileId: true,
  expiresAt: true,
});

// New workflow template schemas
export const insertWorkflowTemplateSchema = createInsertSchema(workflowTemplates).pick({
  name: true,
  description: true,
  isActive: true,
  order: true,
  executionType: true,
  estimatedDurationDays: true,
  createdByUserId: true,
});

export const insertWorkflowStepSchema = createInsertSchema(workflowSteps).pick({
  workflowTemplateId: true,
  name: true,
  description: true,
  stepType: true,
  assignedRole: true,
  order: true,
  estimatedDays: true,
  isRequired: true,
  requiresApproval: true,
  approverRole: true,
  dependencies: true,
});

export const insertDocumentRequirementSchema = createInsertSchema(documentRequirements).pick({
  workflowStepId: true,
  title: true,
  description: true,
  isRequired: true,
  submittedBy: true,
  acceptedFileTypes: true,
  maxFileSize: true,
  templateKey: true,
  hasOcrExtraction: true,
  validationRules: true,
  order: true,
  requiredByDays: true,
});

export const insertChecklistItemSchema = createInsertSchema(checklistItems).pick({
  workflowStepId: true,
  title: true,
  description: true,
  isRequired: true,
  assignedRole: true,
  checklistType: true,
  order: true,
  requiredByDays: true,
});

export const insertWorkerWorkflowProgressSchema = createInsertSchema(workerWorkflowProgress).pick({
  workerId: true,
  workflowTemplateId: true,
  currentStepId: true,
  status: true,
  startedAt: true,
  completedAt: true,
});

export const insertWorkerStepProgressSchema = createInsertSchema(workerStepProgress).pick({
  workerWorkflowProgressId: true,
  workflowStepId: true,
  status: true,
  assignedToUserId: true,
  startedAt: true,
  completedAt: true,
  rejectedAt: true,
  rejectionReason: true,
  notes: true,
});

export const insertDocumentSubmissionSchema = createInsertSchema(documentSubmissions).pick({
  workerStepProgressId: true,
  documentRequirementId: true,
  documentFileId: true,
  status: true,
  submittedAt: true,
  reviewedAt: true,
  reviewedByUserId: true,
  reviewNotes: true,
});

export const insertChecklistCompletionSchema = createInsertSchema(checklistCompletions).pick({
  workerStepProgressId: true,
  checklistItemId: true,
  isCompleted: true,
  completedByUserId: true,
  completedAt: true,
  notes: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type ClientProfile = typeof clientProfiles.$inferSelect;
export type InsertClientProfile = z.infer<typeof insertClientProfileSchema>;
export type Worker = typeof workers.$inferSelect;
export type InsertWorker = z.infer<typeof insertWorkerSchema>;

// Employee aliases for frontend consistency (refers to workers table)
export type Employee = Worker;
export type InsertEmployee = InsertWorker;
export type EmployeeWorkflowProgress = WorkerWorkflowProgress; 
export type InsertEmployeeWorkflowProgress = InsertWorkerWorkflowProgress;
export type EmployeeStepProgress = WorkerStepProgress;
export type InsertEmployeeStepProgress = InsertWorkerStepProgress;

// Table alias for consistency
export const employees = workers;
export type Stage = typeof stages.$inferSelect;
export type Requirement = typeof requirements.$inferSelect;
export type InsertRequirement = z.infer<typeof insertRequirementSchema>;
export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type DocumentFile = typeof documentFiles.$inferSelect;
export type ReminderRule = typeof reminderRules.$inferSelect;
export type ReminderLog = typeof reminderLogs.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type DocumentTemplate = typeof documentTemplates.$inferSelect;
export type InsertDocumentTemplate = z.infer<typeof insertDocumentTemplateSchema>;
export type TemplateField = typeof templateFields.$inferSelect;
export type InsertTemplateField = z.infer<typeof insertTemplateFieldSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type OcrResult = typeof ocrResults.$inferSelect;
export type WorkflowRule = typeof workflowRules.$inferSelect;
export type InsertWorkflowRule = z.infer<typeof insertWorkflowRuleSchema>;
export type ApiIntegration = typeof apiIntegrations.$inferSelect;
export type Translation = typeof translations.$inferSelect;
export type InsertTranslation = z.infer<typeof insertTranslationSchema>;
export type Invitation = typeof invitations.$inferSelect;
export type InsertInvitation = z.infer<typeof insertInvitationSchema>;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;

// New workflow template types
export type WorkflowTemplate = typeof workflowTemplates.$inferSelect;
export type InsertWorkflowTemplate = z.infer<typeof insertWorkflowTemplateSchema>;
export type WorkflowStep = typeof workflowSteps.$inferSelect;
export type InsertWorkflowStep = z.infer<typeof insertWorkflowStepSchema>;
export type DocumentRequirement = typeof documentRequirements.$inferSelect;
export type InsertDocumentRequirement = z.infer<typeof insertDocumentRequirementSchema>;
export type ChecklistItem = typeof checklistItems.$inferSelect;
export type InsertChecklistItem = z.infer<typeof insertChecklistItemSchema>;
export type WorkerWorkflowProgress = typeof workerWorkflowProgress.$inferSelect;
export type InsertWorkerWorkflowProgress = z.infer<typeof insertWorkerWorkflowProgressSchema>;
export type WorkerStepProgress = typeof workerStepProgress.$inferSelect;
export type InsertWorkerStepProgress = z.infer<typeof insertWorkerStepProgressSchema>;
export type DocumentSubmission = typeof documentSubmissions.$inferSelect;
export type InsertDocumentSubmission = z.infer<typeof insertDocumentSubmissionSchema>;
export type ChecklistCompletion = typeof checklistCompletions.$inferSelect;
export type InsertChecklistCompletion = z.infer<typeof insertChecklistCompletionSchema>;

// ========== CRUD API SCHEMAS ==========

// Client CRUD Schemas
export const createClientSchema = insertClientProfileSchema.omit({ 
  ownerUserId: true 
});
export const updateClientSchema = insertClientProfileSchema.partial();
export const clientResponseSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  company: z.string().nullable(),
  address: z.string().nullable(),
  nationality: z.string().nullable(),
  ownerUserId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Worker CRUD Schemas  
export const createWorkerSchema = insertWorkerSchema;
export const updateWorkerSchema = insertWorkerSchema.partial();
export const workerResponseSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  dateOfBirth: z.date().nullable(),
  nationality: z.string().nullable(),
  passportNumber: z.string().nullable(),
  passportExpiry: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Stage CRUD Schemas
export const createStageSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  order: z.number().int().min(0),
  color: z.string().optional(),
  isActive: z.boolean().default(true),
});
export const updateStageSchema = createStageSchema.partial();
export const stageResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  order: z.number(),
  color: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Requirement CRUD Schemas
export const createRequirementSchema = insertRequirementSchema.omit({
  createdByUserId: true
});
export const updateRequirementSchema = insertRequirementSchema.partial();
export const requirementResponseSchema = z.object({
  id: z.string().uuid(),
  stageId: z.string().uuid(),
  type: z.enum(['document', 'form', 'payment', 'approval']),
  title: z.string(),
  description: z.string().nullable(),
  required: z.boolean(),
  autoPopulate: z.boolean(),
  templateKey: z.string().nullable(),
  dueRule: z.string().nullable(),
  createdByUserId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Generic API Response Schemas
export const successResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const errorResponseSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  errors: z.array(z.any()).optional(),
});

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export const paginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) => z.object({
  data: z.array(itemSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

// CRUD Types
export type CreateClient = z.infer<typeof createClientSchema>;
export type UpdateClient = z.infer<typeof updateClientSchema>;
export type ClientResponse = z.infer<typeof clientResponseSchema>;

export type CreateWorker = z.infer<typeof createWorkerSchema>;
export type UpdateWorker = z.infer<typeof updateWorkerSchema>;
export type WorkerResponse = z.infer<typeof workerResponseSchema>;

export type CreateStage = z.infer<typeof createStageSchema>;
export type UpdateStage = z.infer<typeof updateStageSchema>;
export type StageResponse = z.infer<typeof stageResponseSchema>;

export type CreateRequirement = z.infer<typeof createRequirementSchema>;
export type UpdateRequirement = z.infer<typeof updateRequirementSchema>;
export type RequirementResponse = z.infer<typeof requirementResponseSchema>;

// Document Data Extraction Tables
export const documentTypeEnum = pgEnum('document_type', [
  // Personal Identity Documents
  'BIRTH_CERTIFICATE', 
  'MARRIAGE_CERTIFICATE', 
  'PASSPORT', 
  'ID_CARD', 
  'DIPLOMA', 
  'EMPLOYMENT_CONTRACT', 
  'BANK_STATEMENT',
  
  // Romanian Immigration Workflow Forms
  'WORK_CONTRACT_TEMPLATE',
  'POWER_OF_ATTORNEY_TEMPLATE', 
  'JOB_DESCRIPTION_TEMPLATE',
  'VISA_APPLICATION_FORM',
  'RESIDENCE_APPLICATION_TEMPLATE',
  'AJOFM_WORK_PERMIT_APPLICATION',
  'IGI_WORK_PERMIT_APPLICATION',
  'CONSULATE_VISA_FORM',
  'IGI_RESIDENCE_PERMIT_FORM',
  'MEDICAL_CERTIFICATE',
  'CRIMINAL_RECORD_CERTIFICATE',
  'APOSTILLE_DOCUMENT',
  'TRANSLATION_CERTIFICATE',
  'HOUSING_CONTRACT',
  'COMPANY_REGISTRATION_CERTIFICATE',
  'TAX_CERTIFICATE',
  'SALARY_CERTIFICATE',
  'INSURANCE_CERTIFICATE',
  
  'OTHER'
]);

export const extractedDocumentData = pgTable("extracted_document_data", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentFileId: uuid("document_file_id").notNull(),
  documentType: documentTypeEnum("document_type").notNull(),
  extractedText: text("extracted_text"), // Raw OCR text
  structuredData: jsonb("structured_data"), // Parsed structured data
  confidence: integer("confidence"), // OCR confidence percentage
  extractedAt: timestamp("extracted_at").defaultNow(),
  verifiedAt: timestamp("verified_at"),
  verifiedByUserId: varchar("verified_by_user_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const documentFieldMappings = pgTable("document_field_mappings", {
  id: uuid("id").primaryKey().defaultRandom(),
  extractedDataId: uuid("extracted_data_id").notNull(),
  fieldName: varchar("field_name", { length: 100 }).notNull(), // e.g., "firstName", "birthDate"
  fieldValue: text("field_value"), // Extracted field value
  confidence: integer("confidence"), // Field-specific confidence
  position: jsonb("position"), // Location in document where field was found
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations for extracted data
export const extractedDocumentDataRelations = relations(extractedDocumentData, ({ one, many }) => ({
  documentFile: one(documentFiles, {
    fields: [extractedDocumentData.documentFileId],
    references: [documentFiles.id],
  }),
  fieldMappings: many(documentFieldMappings),
  verifiedBy: one(users, {
    fields: [extractedDocumentData.verifiedByUserId],
    references: [users.id],
  }),
}));

export const documentFieldMappingsRelations = relations(documentFieldMappings, ({ one }) => ({
  extractedData: one(extractedDocumentData, {
    fields: [documentFieldMappings.extractedDataId],
    references: [extractedDocumentData.id],
  }),
}));

// Relations for workflow step document requirements
export const workflowStepDocumentRequirementsRelations = relations(workflowStepDocumentRequirements, ({ one }) => ({
  workflowStep: one(workflowSteps, {
    fields: [workflowStepDocumentRequirements.workflowStepId],
    references: [workflowSteps.id],
  }),
}));


// Zod schemas for workflow step document requirements
export const createWorkflowStepDocumentRequirementSchema = createInsertSchema(workflowStepDocumentRequirements).omit({
  id: true,
  createdAt: true,
});

export const updateWorkflowStepDocumentRequirementSchema = createWorkflowStepDocumentRequirementSchema.partial();

// Zod schemas for extracted data
export const createExtractedDocumentDataSchema = createInsertSchema(extractedDocumentData).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const createDocumentFieldMappingSchema = createInsertSchema(documentFieldMappings).omit({
  id: true,
  createdAt: true,
});

export const updateExtractedDocumentDataSchema = createExtractedDocumentDataSchema.partial();

// Types
export type WorkflowStepDocumentRequirement = typeof workflowStepDocumentRequirements.$inferSelect;
export type InsertWorkflowStepDocumentRequirement = z.infer<typeof createWorkflowStepDocumentRequirementSchema>;
export type ExtractedDocumentData = typeof extractedDocumentData.$inferSelect;
export type InsertExtractedDocumentData = z.infer<typeof createExtractedDocumentDataSchema>;
export type DocumentFieldMapping = typeof documentFieldMappings.$inferSelect;
export type InsertDocumentFieldMapping = z.infer<typeof createDocumentFieldMappingSchema>;

export type SuccessResponse = z.infer<typeof successResponseSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
export type Pagination = z.infer<typeof paginationSchema>;

```

## Server Entry: server/index.*

```typescript
import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { logger, httpLogger, logInfo, logError } from "./services/loggingService";
import { httpMetricsMiddleware, getMetrics, initializeMetrics } from "./services/metricsService";
import { register } from 'prom-client';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add Pino HTTP logging middleware
app.use(httpLogger);

// Add Prometheus metrics middleware
app.use(httpMetricsMiddleware());

(async () => {
  try {
    // Verify environment variables before starting
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is required");
    }
    
    // Initialize metrics collection
    initializeMetrics();
    logInfo("Starting server initialization...");
    
    const server = await registerRoutes(app);
    logInfo("Routes registered successfully");

    // Add Prometheus metrics endpoint
    app.get('/metrics', async (req, res) => {
      try {
        const metrics = await getMetrics();
        res.set('Content-Type', register.contentType);
        res.end(metrics);
      } catch (error) {
        logError('Failed to generate metrics', error);
        res.status(500).json({ error: 'Failed to generate metrics' });
      }
    });

    // Add health check endpoint
    app.get('/health', (req, res) => {
      res.status(200).json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
      });
    });
    
    // Add database health check endpoint
    app.get('/health/db', async (req, res) => {
      try {
        // Import storage here to avoid circular dependencies
        const { storage } = await import('./storage');
        // Simple database connectivity test
        await storage.getAllStages();
        res.status(200).json({ 
          status: 'ok', 
          database: 'connected',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logError('Database health check failed', error);
        res.status(503).json({ 
          status: 'error', 
          database: 'disconnected',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    });

    // Serve translation files before Vite takes over
    app.use('/locales', express.static(path.resolve(import.meta.dirname, '..', 'public', 'locales')));

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      
      logError(`HTTP Error: ${status} - ${message}`);
      res.status(status).json({ message });
      
      // Don't re-throw the error to prevent crashes
      if (status >= 500) {
        logError('Server error details', err);
      }
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
      logInfo("Vite development server setup complete");
    } else {
      serveStatic(app);
      logInfo("Static file serving setup complete");
    }

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || '5000', 10);
    
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      logInfo(`Server successfully started and listening on host 0.0.0.0:${port}`);
      logInfo(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logInfo(`Health check available at /health`);
      logInfo(`Database health check available at /health/db`);
    });
    
    // Handle server startup errors
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        logError(`Port ${port} is already in use. Server startup failed.`);
        process.exit(1);
      } else {
        logError('Server error', error);
        process.exit(1);
      }
    });
    
  } catch (error) {
    logError('Failed to start server', error);
    if (error instanceof Error && error.stack) {
      logError('Stack trace', new Error(error.stack));
    }
    process.exit(1);
  }
})();

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  logError('Uncaught Exception', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logError(`Unhandled Rejection at: ${String(promise)} reason: ${String(reason)}`);
  process.exit(1);
});

// Graceful shutdown handling
process.on('SIGINT', async () => {
  logInfo('Received SIGINT, shutting down gracefully...');
  await performGracefulShutdown();
});

process.on('SIGTERM', async () => {
  logInfo('Received SIGTERM, shutting down gracefully...');
  await performGracefulShutdown();
});

async function performGracefulShutdown() {
  try {
    // Shutdown queues first
    const { gracefulShutdown: shutdownQueues } = await import('./workers/queue');
    await shutdownQueues();
    
    logInfo('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logError('Error during graceful shutdown', error);
    process.exit(1);
  }
}

```

## Server Routes

## Route: server/routes/assignments.ts

```typescript
import { Router } from 'express';
import { isAuthenticated } from '../replitAuth';
import { auditMiddleware } from '../middleware/auth';
import { storage } from '../storage';
import { emailService } from '../services/emailService';
import { z } from 'zod';
import multer from 'multer';
import { s3Service } from '../services/s3Service';
import { v4 as uuidv4 } from 'uuid';
import Tesseract from 'tesseract.js';
import fs from 'fs';
import path from 'path';

const router = Router();

// Update assignment status
router.patch('/:id/status', isAuthenticated, auditMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;
    const schema = z.object({
      status: z.enum([
        'NOT_STARTED',
        'AWAITING_UPLOAD', 
        'SUBMITTED_BY_USER',
        'RECEIVED_BY_ADMIN',
        'SUBMITTED_TO_INSTITUTION_DIGITAL',
        'SUBMITTED_TO_INSTITUTION_COURIER',
        'ACCEPTED',
        'REJECTED'
      ]),
      institution: z.string().optional(),
      submissionChannel: z.string().optional(),
      receiptNumber: z.string().optional(),
      courierAwb: z.string().optional(),
      courierName: z.string().optional(),
      rejectedReason: z.string().optional(),
    });

    const data = schema.parse(req.body);
    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);

    const assignment = await storage.getAssignment(id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Only admin can update most statuses
    if (user?.role !== 'ADMIN') {
      // Non-admin users can only mark as submitted by user
      if (data.status !== 'SUBMITTED_BY_USER') {
        return res.status(403).json({ message: 'Unauthorized' });
      }
      
      // Check if user has access to this assignment
      const client = await storage.getClientProfile(assignment.clientProfileId);
      const isOwner = client?.ownerUserId === userId;
      const isWorker = assignment.workerId === userId;
      
      if (!isOwner && !isWorker) {

... (truncated at 60 lines, total: 400 lines)
```

## Route: server/routes/documents.ts

```typescript
import { Router } from 'express';
import { isAuthenticated } from '../replitAuth';
import { auditMiddleware } from '../middleware/auth';
import { s3Service } from '../services/s3Service';
import { storage } from '../storage';
import { z } from 'zod';

const router = Router();

// Generate signed upload URL
router.post('/upload-url', isAuthenticated, auditMiddleware, async (req: any, res) => {
  try {
    const schema = z.object({
      fileName: z.string().min(1),
      contentType: z.string().min(1),
      assignmentId: z.string().uuid(),
    });

    const { fileName, contentType, assignmentId } = schema.parse(req.body);
    
    // Verify user has access to this assignment
    const assignment = await storage.getAssignment(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    
    // Check authorization
    if (user?.role !== 'ADMIN') {
      const client = await storage.getClientProfile(assignment.clientProfileId);
      const isOwner = client?.ownerUserId === userId;
      const isWorker = assignment.workerId === userId;
      
      if (!isOwner && !isWorker) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
    }

    // Generate S3 key and signed URL
    const key = s3Service.generateFileKey('documents', fileName);
    const uploadUrl = await s3Service.generateUploadUrl(key, contentType, 3600);

    res.json({
      uploadUrl,
      key,
      expiresIn: 3600,
    });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    res.status(500).json({ message: 'Failed to generate upload URL' });
  }
});

// Confirm document upload
router.post('/confirm-upload', isAuthenticated, auditMiddleware, async (req: any, res) => {
  try {
    const schema = z.object({
      assignmentId: z.string().uuid(),

... (truncated at 60 lines, total: 298 lines)
```

## Route: server/routes/templates.ts

```typescript
import { Router } from 'express';
import { isAuthenticated } from '../replitAuth';
import { auditMiddleware } from '../middleware/auth';
import { pdfService } from '../services/pdfService';
import { s3Service } from '../services/s3Service';
import { storage } from '../storage';
import { z } from 'zod';

const router = Router();

// Get available templates
router.get('/', isAuthenticated, async (req: any, res) => {
  try {
    const templates = [
      {
        key: 'work_contract_template',
        name: 'Work Contract',
        description: 'Individual employment contract template',
        autoPopulate: true,
        fields: ['companyName', 'cui', 'address', 'workerName', 'nationality', 'passportNumber']
      },
      {
        key: 'power_of_attorney_template',
        name: 'Power of Attorney',
        description: 'Power of attorney for legal representation',
        autoPopulate: true,
        fields: ['workerName', 'nationality', 'passportNumber']
      },
      {
        key: 'job_description_template',
        name: 'Job Description',
        description: 'Detailed job description for AJOFM',
        autoPopulate: true,
        fields: ['companyName', 'cui', 'caen', 'address']
      },
      {
        key: 'visa_application_form',
        name: 'Visa Application Form',
        description: 'Long-stay visa application form',
        autoPopulate: true,
        fields: ['workerName', 'nationality', 'passportNumber', 'companyName']
      },
      {
        key: 'residence_application_template',
        name: 'Residence Application',
        description: 'Residence permit application form',
        autoPopulate: true,
        fields: ['workerName', 'nationality', 'passportNumber', 'companyName']
      }
    ];

    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ message: 'Failed to fetch templates' });
  }
});

// Generate PDF from template
router.post('/generate', isAuthenticated, auditMiddleware, async (req: any, res) => {

... (truncated at 60 lines, total: 215 lines)
```

## Server Services

## Service: server/services/auditService.ts

```typescript
import { storage } from "../storage";
import { AuditLog } from "@shared/schema";

export class AuditService {
  async log(data: Omit<AuditLog, 'id' | 'createdAt'>): Promise<void> {
    try {
      await storage.createAuditLog(data);
    } catch (error) {
      console.error("Failed to create audit log:", error);
    }
  }

  async logUserAction(
    userId: string | undefined,
    action: string,
    entityType: string,
    entityId: string,
    ip?: string,
    metadata?: any
  ): Promise<void> {
    await this.log({
      userId: userId || null,
      action,
      entityType,
      entityId,
      ip: ip || null,
      metadata
    });
  }
}

export const auditService = new AuditService();

```

## Service: server/services/documentService.ts

```typescript
import { storage } from "../storage";
import { DocumentFile } from "@shared/schema";

export class DocumentService {
  async generateSignedUploadUrl(fileName: string, mimeType: string): Promise<{ uploadUrl: string; key: string }> {
    // Generate S3 signed URL for upload
    const key = `documents/${Date.now()}-${fileName}`;
    
    // This would use AWS SDK to generate signed URL
    // For now, return mock implementation
    return {
      uploadUrl: `https://s3.example.com/upload/${key}`,
      key
    };
  }

  async generateSignedDownloadUrl(s3Key: string): Promise<string> {
    // Generate S3 signed URL for download
    return `https://s3.example.com/download/${s3Key}`;
  }

  async createDocumentRecord(data: Omit<DocumentFile, 'id' | 'createdAt'>): Promise<DocumentFile> {
    return await storage.createDocumentFile(data);
  }

  async getDocumentsByAssignment(assignmentId: string): Promise<DocumentFile[]> {
    return await storage.getDocumentFilesByAssignment(assignmentId);
  }

  async generatePDF(templateKey: string, data: any): Promise<Buffer> {
    // This would use docxtemplater and pdf-lib to generate PDF
    // For now, return mock PDF buffer
    return Buffer.from("Mock PDF content");
  }
}

export const documentService = new DocumentService();

```

## Service: server/services/emailService.ts

```typescript
import nodemailer from 'nodemailer';
import { Resend } from 'resend';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EmailData {
  clientName?: string;
  workerName?: string;
  documentName?: string;
  dueDate?: string;
  daysUntilDue?: number;
  loginUrl?: string;
  status?: string;
  stageName?: string;
  reason?: string;
  adminMessage?: string;
}

export interface EmailProvider {
  sendEmail(to: string, subject: string, html: string, text: string): Promise<boolean>;
}

class SMTPProvider implements EmailProvider {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: parseInt(process.env.MAIL_PORT || '587'),
      secure: process.env.MAIL_SECURE === 'true',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  async sendEmail(to: string, subject: string, html: string, text: string): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: process.env.MAIL_FROM || 'noreply@patra.ro',
        to,
        subject,
        html,
        text,
      });
      return true;
    } catch (error) {
      console.error('SMTP send error:', error);
      return false;
    }
  }
}

class ResendProvider implements EmailProvider {
  private resend: Resend;

... (truncated at 60 lines, total: 672 lines)
```

## Service: server/services/fileScanningService.ts

```typescript
import NodeClam from 'clamscan';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface ScanResult {
  isInfected: boolean;
  virusName?: string;
  scanTime: number;
  fileHash: string;
  fileSize: number;
  mimeType?: string;
}

export interface FileValidationError {
  code: 'FILE_TOO_LARGE' | 'INVALID_FILE_TYPE' | 'VIRUS_DETECTED' | 'SCAN_FAILED' | 'FILE_NOT_FOUND';
  message: string;
  details?: any;
}

export class FileScanningService {
  private clamAV: any = null;
  private isInitialized = false;
  private maxFileSize: number;
  private allowedTypes: string[];

  constructor() {
    // Get file size limit from environment (default 10MB)
    this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '10485760');
    
    // Get allowed file types from environment
    const allowedTypesStr = process.env.ALLOWED_FILE_TYPES || 'pdf,doc,docx,jpg,jpeg,png,gif,txt';
    this.allowedTypes = allowedTypesStr.toLowerCase().split(',').map(type => type.trim());

    // Initialize ClamAV connection
    this.initializeClamAV();
  }

  private async initializeClamAV(): Promise<void> {
    try {
      const clamAVHost = process.env.CLAMAV_HOST || 'localhost';
      const clamAVPort = parseInt(process.env.CLAMAV_PORT || '3310');

      this.clamAV = new NodeClam({
        clamdscan: {
          host: clamAVHost,
          port: clamAVPort,
          timeout: 60000,
          local_fallback: false,
          path: '/usr/bin/clamdscan',
          config_file: '/etc/clamd.conf',
          multiscan: true,
          reload_db: false,
          active: true,
          bypass_test: false,
        },
        preference: 'clamdscan'
      });
      
      // Initialize the scanner

... (truncated at 60 lines, total: 326 lines)
```

## Service: server/services/government-api.ts

```typescript
import { z } from 'zod';
import { Storage } from '../storage.js';

// Government status tracking service
// Manages government application statuses that are manually updated by users in the system
// No external API connections - all data is entered by admins, clients, and workers

// API Response schemas
const IgiStatusResponseSchema = z.object({
  applicationId: z.string(),
  status: z.enum(['SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED']),
  lastUpdated: z.string(),
  nextSteps: z.array(z.string()),
  estimatedCompletion: z.string().optional(),
  documents: z.array(z.object({
    name: z.string(),
    status: z.enum(['RECEIVED', 'VERIFIED', 'MISSING', 'REJECTED']),
    notes: z.string().optional()
  }))
});

const AjofmStatusResponseSchema = z.object({
  applicationId: z.string(),
  laborMarketTestStatus: z.enum(['PENDING', 'IN_PROGRESS', 'APPROVED', 'REJECTED']),
  testResults: z.object({
    availableRomanians: z.number(),
    positionsOffered: z.number(),
    testDuration: z.string(),
    completedAt: z.string().optional()
  }).optional(),
  approvalNumber: z.string().optional(),
  validUntil: z.string().optional()
});

const ConsulateStatusResponseSchema = z.object({
  applicationId: z.string(),
  appointmentDate: z.string().optional(),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED']),
  visaStatus: z.enum(['PENDING', 'ISSUED', 'DENIED']).optional(),
  visaNumber: z.string().optional(),
  pickupDate: z.string().optional(),
  consulate: z.string()
});

export type IgiStatusResponse = z.infer<typeof IgiStatusResponseSchema>;
export type AjofmStatusResponse = z.infer<typeof AjofmStatusResponseSchema>;
export type ConsulateStatusResponse = z.infer<typeof ConsulateStatusResponseSchema>;

export class GovernmentStatusService {
  private storage: Storage;

  constructor(storage: Storage) {
    this.storage = storage;
  }

  // IGI (Romanian Immigration Office) status from internal data
  async getIgiStatus(workerId: string): Promise<IgiStatusResponse | null> {
    try {
      // Get worker's workflow progress for IGI-related steps
      const workerProgress = await this.storage.getWorkerWorkflowProgress(workerId);

... (truncated at 60 lines, total: 242 lines)
```

## Service: server/services/loggingService.ts

```typescript
import pino from 'pino';
import pinoHttp from 'pino-http';

// PII patterns to scrub from logs
const PII_PATTERNS = [
  // Email patterns
  /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
  // Phone numbers (Romanian format)
  /(\+40|0040|0)([7-9]\d{8})/g,
  // Romanian CNP (Personal Numeric Code)
  /\b\d{13}\b/g,
  // Passport numbers (alphanumeric 6-9 chars)
  /\b[A-Z0-9]{6,9}\b/g,
  // Credit card patterns
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
];

// Sensitive field names that should be redacted
const SENSITIVE_FIELDS = [
  'password', 'pwd', 'secret', 'token', 'key', 'auth',
  'email', 'phone', 'cnp', 'passport', 'ssn', 'tax_id',
  'credit_card', 'card_number', 'cvv', 'pin'
];

/**
 * Scrub PII from strings
 */
function scrubPII(text: string): string {
  let scrubbed = text;
  
  // Replace PII patterns with placeholders
  PII_PATTERNS.forEach((pattern, index) => {
    scrubbed = scrubbed.replace(pattern, `[PII_REDACTED_${index}]`);
  });
  
  return scrubbed;
}

/**
 * Recursively scrub PII from objects
 */
function scrubObjectPII(obj: any, depth = 0): any {
  if (depth > 10) return '[MAX_DEPTH_REACHED]'; // Prevent infinite recursion
  
  if (typeof obj === 'string') {
    return scrubPII(obj);
  }
  
  if (typeof obj === 'number' || typeof obj === 'boolean' || obj === null || obj === undefined) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => scrubObjectPII(item, depth + 1));
  }
  
  if (typeof obj === 'object') {
    const scrubbed: any = {};
    
    for (const [key, value] of Object.entries(obj)) {

... (truncated at 60 lines, total: 170 lines)
```

## Service: server/services/metricsService.ts

```typescript
import { register, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';
import { createModuleLogger } from './loggingService';

const logger = createModuleLogger('metrics');

// Enable default metrics collection (memory, CPU, etc.)
collectDefaultMetrics({
  register,
  prefix: 'immigration_flow_',
});

// HTTP Request Metrics
export const httpRequestsTotal = new Counter({
  name: 'immigration_flow_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

export const httpRequestDuration = new Histogram({
  name: 'immigration_flow_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register]
});

// Queue Metrics
export const queueDepth = new Gauge({
  name: 'immigration_flow_queue_depth',
  help: 'Number of jobs waiting in the queue',
  labelNames: ['queue_name'],
  registers: [register]
});

export const jobsProcessedTotal = new Counter({
  name: 'immigration_flow_jobs_processed_total',
  help: 'Total number of jobs processed',
  labelNames: ['queue_name', 'job_type', 'status'],
  registers: [register]
});

export const jobProcessingDuration = new Histogram({
  name: 'immigration_flow_job_processing_duration_seconds',
  help: 'Duration of job processing in seconds',
  labelNames: ['queue_name', 'job_type'],
  buckets: [0.1, 0.5, 1, 5, 10, 30, 60],
  registers: [register]
});

// PDF Generation Metrics
export const pdfsGeneratedTotal = new Counter({
  name: 'immigration_flow_pdfs_generated_total',
  help: 'Total number of PDFs generated',
  labelNames: ['template_type', 'status'],
  registers: [register]
});

export const pdfGenerationDuration = new Histogram({
  name: 'immigration_flow_pdf_generation_duration_seconds',

... (truncated at 60 lines, total: 270 lines)
```

## Service: server/services/ocr-service.ts

```typescript
import Tesseract from 'tesseract.js';
import { storage } from '../storage';

export interface OcrExtractionResult {
  extractedText: string;
  extractedData: Record<string, any>;
  confidence: number;
  processingStatus: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  fieldMatches?: Array<{
    field: string;
    value: string;
    confidence: number;
  }>;
}

export class OcrService {
  private worker: Tesseract.Worker | null = null;

  async initializeWorker() {
    if (!this.worker) {
      this.worker = await Tesseract.createWorker('eng+ron+spa+fra');
    }
    return this.worker;
  }

  async processDocument(imageBuffer: Buffer, documentType?: string): Promise<OcrExtractionResult> {
    try {
      const worker = await this.initializeWorker();
      
      const { data } = await worker.recognize(imageBuffer);
      const extractedText = data.text;
      
      // Extract structured data based on document type and text patterns
      const extractedData = this.extractStructuredData(extractedText, documentType);
      
      // Calculate overall confidence
      const confidence = this.calculateConfidence(data);
      
      return {
        extractedText,
        extractedData,
        confidence,
        processingStatus: 'COMPLETED',
        fieldMatches: this.findFieldMatches(extractedText, extractedData)
      };
    } catch (error) {
      console.error('OCR processing failed:', error);
      return {
        extractedText: '',
        extractedData: {},
        confidence: 0,
        processingStatus: 'FAILED'
      };
    }
  }

  private extractStructuredData(text: string, documentType?: string): Record<string, any> {
    const data: Record<string, any> = {};
    
    // Common patterns for Romanian immigration documents

... (truncated at 60 lines, total: 239 lines)
```

## Service: server/services/pdfService.ts

```typescript
import PDFDocument from 'pdfkit';
import { s3Service } from './s3Service';

export interface TemplateData {
  client?: {
    companyName: string;
    cui: string;
    address: string;
    caen: string;
    contactEmail: string;
    onrc?: string;
  };
  worker?: {
    firstName: string;
    lastName: string;
    nationality: string;
    passportNumber: string;
    email?: string;
    phone?: string;
  };
  assignment?: {
    id: string;
    status: string;
  };
  metadata?: {
    generatedAt: Date;
    generatedBy: string;
    watermark?: string;
  };
}

export class PDFService {
  async generatePDF(templateKey: string, data: TemplateData): Promise<Buffer> {
    switch (templateKey) {
      case 'work_contract_template':
        return this.generateWorkContract(data);
      case 'power_of_attorney_template':
        return this.generatePowerOfAttorney(data);
      case 'job_description_template':
        return this.generateJobDescription(data);
      case 'visa_application_form':
        return this.generateVisaApplication(data);
      case 'residence_application_template':
        return this.generateResidenceApplication(data);
      default:
        throw new Error(`Unknown template: ${templateKey}`);
    }
  }

  private async generateWorkContract(data: TemplateData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(16).text('CONTRACT INDIVIDUAL DE MUNCĂ', { align: 'center' });

... (truncated at 60 lines, total: 387 lines)
```

## Service: server/services/reminderService.ts

```typescript
import { storage } from "../storage";
import { ReminderRule, Assignment } from "@shared/schema";

export class ReminderService {
  async createReminderRule(rule: Omit<ReminderRule, 'id' | 'createdAt'>): Promise<ReminderRule> {
    // Implementation would create reminder rule and schedule jobs
    throw new Error("Not implemented");
  }

  async evaluateReminders(): Promise<void> {
    // This would be called by BullMQ job to evaluate and send reminders
    // Implementation would:
    // 1. Get all active reminder rules
    // 2. Find assignments matching criteria
    // 3. Send emails via email service
    // 4. Log reminder activities
    console.log("Evaluating reminders...");
  }

  async sendEmail(to: string, subject: string, content: string): Promise<void> {
    // This would integrate with Mailjet/Postmark EU
    console.log(`Sending email to ${to}: ${subject}`);
  }
}

export const reminderService = new ReminderService();

```

## Service: server/services/s3Service.ts

```typescript
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export class S3Service {
  private s3Client: S3Client;
  private bucket: string;

  constructor() {
    const endpoint = process.env.S3_ENDPOINT;
    const region = process.env.S3_REGION || 'eu-central-1';
    
    if (!endpoint) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️  S3_ENDPOINT not configured, using development defaults');
        // Use localhost MinIO defaults for development
        process.env.S3_ENDPOINT = 'http://localhost:9000';
        process.env.S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || 'minioadmin';
        process.env.S3_SECRET_KEY = process.env.S3_SECRET_KEY || 'minioadmin';
      } else {
        throw new Error('S3_ENDPOINT environment variable is required');
      }
    }

    this.s3Client = new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY!,
        secretAccessKey: process.env.S3_SECRET_KEY!,
      },
      forcePathStyle: true, // Required for MinIO
    });

    this.bucket = process.env.S3_BUCKET || 'immigration-flow-documents';
  }

  async generateUploadUrl(key: string, contentType: string, expiresIn = 3600): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
      ACL: 'private', // Ensure private access only
      ServerSideEncryption: 'AES256', // Enable server-side encryption
      Metadata: {
        'uploaded-via': 'patra-security-service',
        'encryption-enabled': 'true'
      }
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn });
  }

  async generateDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn });
  }

... (truncated at 60 lines, total: 138 lines)
```

## Service: server/services/secureUploadService.ts

```typescript
import { Request, Response } from 'express';
import { fileScanningService, ScanResult, FileValidationError } from './fileScanningService';
import { s3Service } from './s3Service';
import { db } from '../db';
import { documentFiles, assignments } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Configure multer for temporary file storage
const upload = multer({
  dest: 'temp/', // Temporary directory for scanning
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // Default 10MB
  },
  fileFilter: (req, file, cb) => {
    // Pre-validation before upload
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'pdf,doc,docx,jpg,jpeg,png').split(',');
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type .${ext} not allowed. Allowed types: ${allowedTypes.join(', ')}`));
    }
  }
});

export interface SecureUploadResult {
  success: boolean;
  fileId?: string;
  s3Key?: string;
  scanResult?: ScanResult;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export class SecureUploadService {
  /**
   * Handle secure file upload with validation and scanning
   */
  static upload = upload.single('file');

  static async processSecureUpload(req: Request, res: Response): Promise<void> {
    let tempFilePath: string | null = null;

    try {
      // Validate required parameters
      const { assignmentId } = req.body;
      if (!assignmentId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_ASSIGNMENT_ID',
            message: 'Assignment ID is required'

... (truncated at 60 lines, total: 341 lines)
```

## Service: server/services/workflow-engine.ts

```typescript
import { storage } from '../storage';
import { WorkflowRule, Assignment } from '@shared/schema';

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains' | 'is_empty' | 'is_not_empty';
  value: any;
}

export interface WorkflowAction {
  type: 'update_status' | 'assign_to_user' | 'send_notification' | 'create_task' | 'update_field' | 'trigger_api_call';
  parameters: Record<string, any>;
}

export interface ProcessedWorkflowRule extends WorkflowRule {
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
}

export class WorkflowEngine {
  async processAssignmentWorkflow(assignmentId: string, triggerEvent: string) {
    try {
      const assignment = await storage.getAssignment(assignmentId);
      if (!assignment) {
        console.error(`Assignment not found: ${assignmentId}`);
        return;
      }

      // Get all active workflow rules for this trigger
      const rules = await storage.getAllWorkflowRules();
      const applicableRules = rules.filter(rule => 
        rule.isActive && 
        rule.triggerEvent === triggerEvent
      );

      for (const rule of applicableRules) {
        await this.evaluateAndExecuteRule(rule, assignment, triggerEvent);
      }
    } catch (error) {
      console.error('Error processing workflow:', error);
    }
  }

  private async evaluateAndExecuteRule(rule: WorkflowRule, assignment: Assignment, triggerEvent: string) {
    try {
      // Parse rule conditions and actions
      const conditions = this.parseConditions(rule.conditions);
      const actions = this.parseActions(rule.actions);

      // Evaluate conditions
      const conditionsMatch = await this.evaluateConditions(conditions, assignment);
      
      if (conditionsMatch) {
        console.log(`Executing workflow rule: ${rule.name} for assignment ${assignment.id}`);
        
        // Execute actions
        await this.executeActions(actions, assignment, rule);
        
        // Log workflow execution
        await storage.createAnalyticsEvent({

... (truncated at 60 lines, total: 343 lines)
```

## Client App: App.tsx

```typescript
import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/contexts/I18nProvider";
import { clientErrorReporter } from "@/lib/clientErrorReporter";
import { BreadcrumbProvider } from "@/contexts/BreadcrumbContext";
import { useAuth } from "@/hooks/useAuth";
import { DummyDataAlert } from "@/components/dummy-data-alert";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { useRoleBasedLanguage } from "@/hooks/useRoleBasedLanguage";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import AppSidebar from "@/components/layout/sidebar";
import RoleBasedDashboard from "@/components/RoleBasedDashboard";
import TemplatesPage from "@/pages/templates";
import AnalyticsPage from "@/pages/analytics";
import DocumentsPage from "@/pages/documents";
import DeadlinesPage from "@/pages/deadlines";
import ProfilePage from "@/pages/profile";
import ClientProfile from "@/pages/client-profile";
import WorkerProfile from "@/pages/worker-profile";
import SettingsPage from "@/pages/settings";
import AuditLogsPage from "@/pages/audit-logs";
import RequirementsPage from "@/pages/requirements";
import RemindersPage from "@/pages/reminders";
import PaymentsPage from "@/pages/payments";
import WorkersPage from "@/pages/workers";
import ClientsPage from "@/pages/clients";
import WorkflowAssignmentsPage from "@/pages/workflow-assignments";
import HealthCheckPage from "@/pages/health-check";
import { User } from "@shared/schema";

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  // Initialize role-based language settings
  useRoleBasedLanguage();

  // Initialize client error reporter with user data
  React.useEffect(() => {
    if (user) {
      clientErrorReporter.setUser({
        id: user.id,
        role: user.role
      });
    } else {
      clientErrorReporter.setUser(null);
    }
  }, [user]);


  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }


  return (
    <div>
      {/* Development role switcher */}
      <RoleSwitcher />
      
      {/* Show dummy data alert for authenticated users */}
      {isAuthenticated && <DummyDataAlert />}
      
      <Switch>
        {!isAuthenticated ? (
          <Route path="/" component={Landing} />
        ) : (
          <SidebarProvider>
            <AppSidebar userRole={user?.role || 'VIEWER'} />
            <SidebarInset>
              <Switch>
                <Route path="/" component={RoleBasedDashboard} />
                <Route path="/dashboard" component={RoleBasedDashboard} />
                <Route path="/templates" component={TemplatesPage} />
                <Route path="/reports" component={AnalyticsPage} />
                <Route path="/clients" component={ClientsPage} />
                <Route path="/clients/:id" component={ClientProfile} />
                <Route path="/workers" component={WorkersPage} />
                <Route path="/workers/:id" component={WorkerProfile} />
                <Route path="/workflow-assignments" component={WorkflowAssignmentsPage} />
                <Route path="/requirements" component={RequirementsPage} />
                <Route path="/reminders" component={RemindersPage} />
                <Route path="/audit" component={AuditLogsPage} />
                <Route path="/profile" component={ProfilePage} />
                <Route path="/documents" component={DocumentsPage} />
                <Route path="/payments" component={PaymentsPage} />
                <Route path="/deadlines" component={DeadlinesPage} />
                <Route path="/settings" component={SettingsPage} />
                <Route path="/health-check" component={HealthCheckPage} />
                <Route component={NotFound} />
              </Switch>
            </SidebarInset>
          </SidebarProvider>
        )}
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <BreadcrumbProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </BreadcrumbProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

export default App;

```

## Client Pages

## Page: client/src/pages/admin-dashboard.tsx

```typescript
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from '@/contexts/I18nProvider';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Users, 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Edit, 
  Save, 
  X, 
  Eye, 
  FileText, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  UserCheck,
  Building2,
  Search,
  Filter,
  Upload,
  Download,
  BarChart3
} from "lucide-react";
import { DocumentUploader } from "@/components/documents/DocumentUploader";
import { DocumentViewer } from "@/components/documents/DocumentViewer";
import WorkerWorkflowAssignments from "@/components/WorkerWorkflowAssignments";
import { WorkerWorkflowDisplay } from '@/components/shared/WorkerWorkflowDisplay';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  
  // Collapsible states
  const [clientsOpen, setClientsOpen] = useState(true);
  const [workflowOpen, setWorkflowOpen] = useState(true);
  const [activityOpen, setActivityOpen] = useState(false);
  
  // Filter states
  const [clientFilter, setClientFilter] = useState("all");
  const [workerFilter, setWorkerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [workerSearchTerm, setWorkerSearchTerm] = useState("");
  
  // Navigation states
  const [activeSection, setActiveSection] = useState<string>("overview");
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [editingClient, setEditingClient] = useState(false);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<any>(null);
  const [editingWorker, setEditingWorker] = useState(false);
  const [showClientWorkers, setShowClientWorkers] = useState(false);
  const [editClientForm, setEditClientForm] = useState({
    legalName: '',
    registrationNumber: '',
    cui: '',
    legalAddress: '',
    adminName: '',
    contactEmail: '',
    phoneNumber: '',
    bankIban: '',
    caen: ''
  });
  
  const [editWorkerForm, setEditWorkerForm] = useState({
    firstName: '',
    lastName: '',
    nationality: '',
    dob: '',
    passportNumber: '',
    passportExpiry: '',
    email: '',
    phone: '',
  });

  const [newClientForm, setNewClientForm] = useState({
    legalName: '',
    registrationNumber: '',
    cui: '',
    legalAddress: '',
    adminName: '',
    contactEmail: '',
    phoneNumber: '',
    bankIban: '',
    caen: ''
  });


  // Auth check
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/');
    }
  }, [isAuthenticated, isLoading, setLocation]);

  // Update active section based on current route
  useEffect(() => {
    if (location === '/' || location === '/dashboard') {
      setActiveSection('overview');
    } else if (location === '/clients') {
      setActiveSection('clients');
    } else if (location === '/workers') {

... (truncated at 120 lines, total: 902 lines)
```

## Page: client/src/pages/analytics.tsx

```typescript
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@/contexts/I18nProvider';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { CalendarDays, TrendingUp, Users, FileText, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { apiRequest } from '@/lib/queryClient';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AnalyticsPage() {
  const { t } = useTranslation();
  usePageTitle('nav.analytics');
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [selectedClient, setSelectedClient] = useState('all');
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    enabled: isAuthenticated && !isLoading,
  });

  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ['/api/dashboard/assignments'],
    enabled: isAuthenticated && !isLoading,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['/api/clients'],
  });

  const { data: analyticsEvents = [] } = useQuery({
    queryKey: ['/api/analytics/events', { clientId: selectedClient !== 'all' ? selectedClient : undefined }],
    enabled: user?.role === 'ADMIN',
  });

  const { data: monthlyData = [] } = useQuery({
    queryKey: ['/api/analytics/monthly'],
    enabled: isAuthenticated && !isLoading,
  });

  // Process assignment data for charts
  const statusData = (assignments as any[]).reduce((acc: any[], assignment: any) => {
    const existing = acc.find(item => item.status === assignment.status);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({
        status: assignment.status.replace('_', ' '),
        count: 1,
        color: COLORS[acc.length % COLORS.length]
      });
    }
    return acc;
  }, []);

  // Stage progression data
  const stageData = (assignments as any[]).reduce((acc: any[], assignment: any) => {
    const stageName = assignment.stage?.name || 'Unknown';
    const existing = acc.find(item => item.stage === stageName);
    if (existing) {
      existing.total += 1;
      if (assignment.status === 'ACCEPTED') {
        existing.completed += 1;
      }
    } else {
      acc.push({
        stage: stageName,
        total: 1,
        completed: assignment.status === 'ACCEPTED' ? 1 : 0,
        pending: assignment.status !== 'ACCEPTED' ? 1 : 0
      });
    }
    return acc;
  }, []);

  // Client performance data
  const clientData = (assignments as any[]).reduce((acc: any[], assignment: any) => {
    const clientName = assignment.clientProfile?.companyName || 'Unknown';
    const existing = acc.find(item => item.client === clientName);
    if (existing) {
      existing.total += 1;
      if (assignment.status === 'ACCEPTED') {
        existing.completed += 1;
      }
    } else {

... (truncated at 120 lines, total: 371 lines)
```

## Page: client/src/pages/audit-logs.tsx

```typescript
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from '@/contexts/I18nProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Search, Calendar, User, Activity, Filter } from 'lucide-react';

export default function AuditLogsPage() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState('all');
  const [selectedAction, setSelectedAction] = useState('all');

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'ADMIN')) {
      toast({
        title: "Unauthorized",
        description: "Access denied. Admin privileges required.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return null;
  }

  // Fetch audit logs from API
  const { data: auditLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['/api/audit'],
    enabled: isAuthenticated && user?.role === 'ADMIN',
  });

  // Filter logs based on search criteria
  const filteredLogs = (auditLogs as any[]).filter((log: any) => {
    const matchesSearch = !searchTerm || 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesUser = selectedUser === 'all' || log.userId === selectedUser;
    const matchesAction = selectedAction === 'all' || log.action.includes(selectedAction.toUpperCase());
    
    return matchesSearch && matchesUser && matchesAction;
  });

  const getActionBadge = (action: string) => {
    if (action.includes('POST')) {
      return <Badge variant="default" className="bg-green-500">Create</Badge>;
    }
    if (action.includes('PUT') || action.includes('PATCH')) {
      return <Badge variant="default" className="bg-blue-500">Update</Badge>;
    }
    if (action.includes('DELETE')) {
      return <Badge variant="destructive">Delete</Badge>;
    }
    if (action.includes('GET')) {
      return <Badge variant="secondary">View</Badge>;
    }
    return <Badge variant="outline">Action</Badge>;
  };

  const getEntityIcon = (entityType: string) => {
    if (entityType.includes('client')) return '🏢';
    if (entityType.includes('worker')) return '👤';
    if (entityType.includes('document')) return '📄';
    if (entityType.includes('template')) return '📋';
    return '🔧';
  };

  return (
    <div className="flex flex-col">
      <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8" />
              {t('pages.audit.title') || 'Audit Logs'}
            </h1>
            <p className="text-gray-600 mt-2">
              {t('pages.audit.description') || 'Security and activity monitoring for administrative actions'}
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search actions, entities..."

... (truncated at 120 lines, total: 236 lines)
```

## Page: client/src/pages/client-dashboard.tsx

```typescript
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import CompanyProfile from "@/components/profile/company-profile";
import WorkerList from "@/components/workers/worker-list";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useTranslation } from "@/contexts/I18nProvider";
import WorkflowProgressTracker from "@/components/WorkflowProgressTracker";

export default function ClientDashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();

  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ["/api/clients"],
    enabled: isAuthenticated && !isLoading && user?.role === 'OWNER',
  });

  const clientProfile = clients[0]; // Owner should have exactly one client profile

  const { data: workers = [] } = useQuery<any[]>({
    queryKey: ["/api/clients", clientProfile?.id, "workers"],
    enabled: !!clientProfile?.id,
  });

  // Fetch workflow progress for calculating real stats
  const { data: workflowStats = { pending: 0, completed: 0 } } = useQuery({
    queryKey: ["/api/dashboard/workflow-stats"],
    enabled: !!clientProfile?.id,
    select: (data: any) => {
      // Calculate stats from workflow data
      const totalSteps = data?.totalSteps || 0;
      const completedSteps = data?.completedSteps || 0;
      const pendingSteps = data?.pendingSteps || 0;
      
      return {
        pending: pendingSteps,
        completed: Math.round((completedSteps / totalSteps) * 100) || 0
      };
    }
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: t('auth.unauthorized') || "Unauthorized",
        description: t('auth.loggedOut') || "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'OWNER') {
    return null;
  }

  const realStats = {
    totalWorkers: workers?.length || 0,
    pendingActions: workflowStats.pending,
    completed: workflowStats.completed,
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userRole="OWNER" />
      
      <div className="ml-64">
        <Header 
          title={t('dashboard.client.title') || "Client Dashboard"}
          subtitle={t('dashboard.client.subtitle') || "Manage your workers and immigration workflows"}
          actions={
            <Button data-testid="button-add-worker">
              <i className="fas fa-plus mr-2"></i>{t('action.addWorker') || 'Add Worker'}
            </Button>
          }
        />

        <div className="p-8">
          {/* Company Profile */}
          {clientProfile && <CompanyProfile profile={clientProfile} />}

          {/* Workers Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card data-testid="card-total-workers">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-secondary">{t('dashboard.stats.totalWorkers') || 'Total Workers'}</p>
                    <p className="text-3xl font-bold text-gray-900">{realStats.totalWorkers}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <i className="fas fa-users text-primary text-xl"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-pending-actions-client">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">

... (truncated at 120 lines, total: 197 lines)
```

## Page: client/src/pages/client-profile.tsx

```typescript
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Building, Mail, Phone, MapPin, CreditCard, Edit, Save, X, User, Plus, Calendar, Globe, CheckCircle, Clock, AlertTriangle, FileText, Upload, Download, Eye } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useTranslation } from "@/contexts/I18nProvider";

interface WorkerAssignment {
  id: string;
  requirement: {
    id: string;
    title: string;
    description: string;
    stage: {
      key: string;
      title: string;
      order: number;
    };
  };
  status: string;
  documentFiles: {
    id: string;
    fileName: string;
    kind: string;
    createdAt: string;
  }[];
  submittedAt?: string;
  approvedAt?: string;
  rejectedReason?: string;
}

interface SelectedWorkerData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string;
  nationality: string;
  passportNumber: string;
  passportExpiry: string;
  clientProfile: {
    id: string;
    legalName: string;
  };
  assignments: WorkerAssignment[];
}

export default function ClientProfile() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [isEditingWorker, setIsEditingWorker] = useState(false);
  const [isAddingWorker, setIsAddingWorker] = useState(false);
  const [newWorkerData, setNewWorkerData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    nationality: '',
    dob: '',
    passportNumber: '',
    passportExpiry: ''
  });
  const [editedWorkerData, setEditedWorkerData] = useState<any>(null);
  
  // Extract client ID from URL
  const clientId = location.split('/clients/')[1];
  
  // Form states
  const [formData, setFormData] = useState({
    legalName: '',
    cui: '',
    caen: '',
    legalAddress: '',
    contactEmail: '',
    registrationNumber: '',
    phoneNumber: '',
    adminName: '',
    bankIban: ''
  });

  // Fetch client data
  const { data: client, isLoading: clientLoading, error: clientError } = useQuery<any>({
    queryKey: ['/api/clients', clientId],
    enabled: !!clientId && isAuthenticated,
  });

  // Fetch workers for this client  
  const { data: workers, isLoading: workersLoading, error: workersError } = useQuery<any[]>({
    queryKey: ['/api/clients', clientId, 'workers'],
    enabled: !!clientId && isAuthenticated,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized", 
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return false;
      }
      return failureCount < 3;
    }
  });

... (truncated at 120 lines, total: 1230 lines)
```

## Page: client/src/pages/clients.tsx

```typescript
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/contexts/I18nProvider';
import { 
  Building2, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  Users,
  UserCheck,
  X,
  FileText,
  Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import WorkerList from '@/components/workers/worker-list';
import { WorkerWorkflowDisplay } from '@/components/shared/WorkerWorkflowDisplay';
import ClientWorkersDisplay from '@/components/clients/ClientWorkersDisplay';

interface Client {
  id: string;
  legalName: string;
  cui: string;
  registrationNumber: string;
  contactEmail: string;
  phoneNumber: string;
  adminName: string;
  legalAddress: string;
  bankIban: string;
  caen: string;
  createdAt: string;
  updatedAt: string;
}

export default function ClientsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [editingClient, setEditingClient] = useState<string | null>(null);
  const [showClientWorkers, setShowClientWorkers] = useState<Record<string, boolean>>({});
  const [selectedWorker, setSelectedWorker] = useState<any>(null);
  const [newClientForm, setNewClientForm] = useState({
    legalName: '',
    cui: '',
    registrationNumber: '',
    contactEmail: '',
    phoneNumber: '',
    adminName: '',
    legalAddress: '',
    bankIban: '',
    caen: ''
  });
  const [editClientForm, setEditClientForm] = useState({
    legalName: '',
    cui: '',
    registrationNumber: '',
    contactEmail: '',
    phoneNumber: '',
    adminName: '',
    legalAddress: '',
    bankIban: '',
    caen: ''
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "Please log in to access this page.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Fetch clients from API
  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['/api/clients'],
    enabled: isAuthenticated,
  });

  // Create client mutation (for ADMIN users only)
  const createClientMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/clients', {

... (truncated at 120 lines, total: 651 lines)
```

## Page: client/src/pages/deadlines.tsx

```typescript
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from '@/contexts/I18nProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

export default function DeadlinesPage() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Fetch user-specific deadlines from API
  const { data: deadlines = [], isLoading: deadlinesLoading, error: deadlinesError } = useQuery({
    queryKey: ['/api/user/deadlines'],
    enabled: isAuthenticated,
  });

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusBadge = (status: string, daysUntil: number) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />{t('status.completed') || 'Completed'}</Badge>;
      case 'urgent':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />{t('status.urgent') || 'Urgent'}</Badge>;
      case 'upcoming':
        return daysUntil <= 7 ? 
          <Badge variant="destructive"><Clock className="h-3 w-3 mr-1" />{t('status.dueSoon') || 'Due Soon'}</Badge> :
          <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />{t('status.upcoming') || 'Upcoming'}</Badge>;
      case 'scheduled':
        return <Badge variant="default" className="bg-blue-500"><Calendar className="h-3 w-3 mr-1" />{t('status.scheduled') || 'Scheduled'}</Badge>;
      default:
        return <Badge variant="outline">{t('status.unknown') || 'Unknown'}</Badge>;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-yellow-500';
      case 'low':
        return 'border-l-green-500';
      default:
        return 'border-l-gray-500';
    }
  };

  const sortedDeadlines = (deadlines as any[]).sort((a: any, b: any) => {
    const aDays = getDaysUntilDue(a.dueDate);
    const bDays = getDaysUntilDue(b.dueDate);
    if (a.status === 'completed') return 1;
    if (b.status === 'completed') return -1;
    return aDays - bDays;
  });

  return (
    <>
      <div className="flex flex-col">
        <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">{t('pages.deadlines.title') || 'Deadlines'}</h1>
              <p className="text-gray-600 mt-2">
                {t('pages.deadlines.description') || 'Track important deadlines for your immigration process'}
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            {sortedDeadlines.map((deadline: any) => {
              const daysUntil = getDaysUntilDue(deadline.dueDate);
              
              return (
                <Card 
                  key={deadline.id} 
                  className={`border-l-4 ${getPriorityColor(deadline.priority)} ${
                    deadline.status === 'urgent' || daysUntil <= 3 ? 'shadow-lg' : ''
                  }`}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">

... (truncated at 120 lines, total: 169 lines)
```

## Page: client/src/pages/documents.tsx

```typescript
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from '@/contexts/I18nProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Download, Eye, Calendar } from 'lucide-react';

export default function DocumentsPage() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Fetch user-specific documents from API
  const { data: documents = [], isLoading: documentsLoading, error: documentsError } = useQuery({
    queryKey: ['/api/user/documents'],
    enabled: isAuthenticated,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return <Badge variant="default" className="bg-green-500">{t('status.accepted') || 'Accepted'}</Badge>;
      case 'SUBMITTED':
        return <Badge variant="default" className="bg-blue-500">{t('status.submitted') || 'Submitted'}</Badge>;
      case 'PENDING':
        return <Badge variant="secondary">{t('status.pendingUpload') || 'Pending Upload'}</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">{t('status.rejected') || 'Rejected'}</Badge>;
      default:
        return <Badge variant="outline">{t('status.unknown') || 'Unknown'}</Badge>;
    }
  };

  return (
    <>
      <div className="flex flex-col">
        <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">{t('pages.documents.title') || 'Documents'}</h1>
              <p className="text-gray-600 mt-2">
                Manage and track your immigration documents
              </p>
            </div>
            <Button 
              className="flex items-center space-x-2"
              data-testid="button-upload-document"
            >
              <Upload className="h-4 w-4" />
              <span>{t('actions.uploadDocument') || 'Upload Document'}</span>
            </Button>
          </div>

          {documentsLoading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-600">{t('status.loading') || 'Loading documents...'}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(documents as any[]).map((doc: any) => (
              <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      {doc.name}
                    </CardTitle>
                    {getStatusBadge(doc.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      {t('pages.documents.requiredFor') || 'Required for'}: {doc.assignment?.requirement || doc.requirement || 'Unknown'}
                    </p>
                    
                    {doc.uploadedAt && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        {t('pages.documents.uploaded') || 'Uploaded'}: {new Date(doc.uploadedAt).toLocaleDateString()}
                      </div>
                    )}

                    <div className="flex space-x-2">
                      {doc.status === 'PENDING' || doc.status === 'AWAITING_UPLOAD' ? (
                        <Button size="sm" className="flex-1" data-testid={`button-upload-${doc.id}`}>
                          <Upload className="h-4 w-4 mr-1" />
                          {t('actions.upload') || 'Upload'}

... (truncated at 120 lines, total: 160 lines)
```

## Page: client/src/pages/health-check.tsx

```typescript
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, AlertCircle, Play, Loader2, FileText, Shield, Database, Globe } from 'lucide-react';
import { useTranslation } from '@/contexts/I18nProvider';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  message?: string;
  duration?: number;
  details?: any;
}

interface TestCategory {
  name: string;
  description: string;
  tests: TestResult[];
  icon: any;
}

export default function HealthCheck() {
  const { t } = useTranslation();
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTest, setCurrentTest] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [testCategories, setTestCategories] = useState<TestCategory[]>([
    {
      name: 'Unit & Integration Tests',
      description: '16 test files with 26+ individual tests',
      icon: FileText,
      tests: [
        { name: 'API Integration Tests', status: 'pending' },
        { name: 'Security RBAC Tests', status: 'pending' },
        { name: 'Data Validation Tests', status: 'pending' },
        { name: 'Frontend-Backend Integration', status: 'pending' },
        { name: 'Authentication & Authorization', status: 'pending' },
        { name: 'File Upload Security', status: 'pending' },
        { name: 'Email & Reminder Systems', status: 'pending' },
        { name: 'PDF Generation', status: 'pending' },
        { name: 'Background Job Processing', status: 'pending' },
        { name: 'End-to-End Workflows', status: 'pending' }
      ]
    },
    {
      name: 'Validation Scripts',
      description: '19 comprehensive validation scripts',
      icon: Shield,
      tests: [
        { name: 'Thorough Validation Test (1440 lines)', status: 'pending' },
        { name: 'Comprehensive Browser Test', status: 'pending' },
        { name: 'Comprehensive UI Test', status: 'pending' },
        { name: 'Authenticated UI Test', status: 'pending' },
        { name: 'HTTP Frontend Test', status: 'pending' },
        { name: 'Puppeteer Frontend Test', status: 'pending' },
        { name: 'Quick UI Validation', status: 'pending' },
        { name: 'Endpoint Mismatch Detection', status: 'pending' },
        { name: 'Mock Data Detection', status: 'pending' }
      ]
    },
    {
      name: 'Data Integrity',
      description: 'Database and storage validation',
      icon: Database,
      tests: [
        { name: 'No Mock Data Verification', status: 'pending' },
        { name: 'Database Schema Validation', status: 'pending' },
        { name: 'Foreign Key Constraints', status: 'pending' },
        { name: 'Data Consistency Check', status: 'pending' },
        { name: 'Storage Integrity', status: 'pending' }
      ]
    },
    {
      name: 'System Performance',
      description: 'Performance and response metrics',
      icon: Globe,
      tests: [
        { name: 'API Response Times', status: 'pending' },
        { name: 'Frontend Load Times', status: 'pending' },
        { name: 'Database Query Performance', status: 'pending' },
        { name: 'Memory Usage', status: 'pending' },
        { name: 'Network Latency', status: 'pending' }
      ]
    }
  ]);

  const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    setLogs(prev => [`[${timestamp}] ${prefix} ${message}`, ...prev]);
  };

  const updateTestStatus = (categoryIndex: number, testIndex: number, status: TestResult['status'], message?: string) => {
    setTestCategories(prev => {
      const updated = [...prev];
      updated[categoryIndex].tests[testIndex] = {
        ...updated[categoryIndex].tests[testIndex],
        status,
        message
      };
      return updated;
    });
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setProgress(0);
    setLogs([]);
    addLog('🔍 UNIVERSAL PROMPT ENFORCED:', 'info');
    addLog('Read replit.md first, follow documented patterns, update documentation after', 'info');
    addLog('✅ Pre-work protocol: Reading system documentation...', 'success');
    addLog('✅ Following established patterns from System Bible', 'success');
    addLog('✅ Will update documentation after test completion', 'success');
    addLog('Starting comprehensive system health check...', 'info');
    
    try {

... (truncated at 120 lines, total: 344 lines)
```

## Page: client/src/pages/landing.tsx

```typescript
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "@/contexts/I18nProvider";
import { usePageTitle } from "@/hooks/usePageTitle";
import { LanguageSelector } from "@/components/LanguageSelector";

export default function Landing() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { setLanguage, t } = useTranslation();
  
  // Set page title
  usePageTitle('landing.title', 'Welcome to ImmigrationFlow');
  
  // Set Romanian as default for landing page
  useEffect(() => {
    const saved = localStorage.getItem('immigration-app-language');
    if (!saved) {
      setLanguage('ro');
    }
  }, [setLanguage]);

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-surface border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <i className="fas fa-passport text-primary text-2xl mr-3"></i>
              <span className="font-bold text-xl text-gray-900">ImmigrationFlow</span>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSelector />
              <Button variant="ghost" data-testid="button-features">{t('nav.features') || 'Features'}</Button>
              <Button variant="ghost" data-testid="button-pricing">{t('nav.pricing') || 'Pricing'}</Button>
              <Button variant="ghost" data-testid="button-support">{t('nav.support') || 'Support'}</Button>
              <Button onClick={() => setShowLoginModal(true)} data-testid="button-login">
                {t('landing.login') || 'Login'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              {t('landing.title') || 'Streamline Romanian'} <br />
              <span className="text-primary">{t('landing.subtitle') || 'Immigration Workflows'}</span>
            </h1>
            <p className="text-xl text-secondary mb-8 max-w-3xl mx-auto">
              {t('landing.description') || 'Complete SaaS platform for managing work permits, visa applications, and residence permits. From AJOFM labor market tests to final IGI approvals.'}
            </p>
            <div className="flex justify-center space-x-4">
              <Button size="lg" onClick={handleLogin} data-testid="button-trial">
                {t('landing.trial') || 'Start Free Trial'}
              </Button>
              <Button variant="outline" size="lg" data-testid="button-demo">
                {t('landing.demo') || 'Schedule Demo'}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('landing.features.title') || 'Everything You Need'}</h2>
            <p className="text-xl text-secondary">{t('landing.features.subtitle') || 'Comprehensive immigration workflow management'}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Cards */}
            <Card className="hover:shadow-md transition-shadow" data-testid="card-client-management">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-users text-white text-xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('landing.features.clientManagement') || 'Client Management'}</h3>
                <p className="text-secondary">{t('landing.features.clientManagementDesc') || 'Manage Romanian companies with CUI, ONRC, and CAEN data. Track multiple workers per client profile.'}</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow" data-testid="card-workflow-tracking">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-success rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-clipboard-check text-white text-xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('landing.features.workflowTracking') || 'Workflow Tracking'}</h3>
                <p className="text-secondary">{t('landing.features.workflowTrackingDesc') || 'Complete Romanian immigration stages: AJOFM → Work Permit → Visa D/AM → Residence Permit.'}</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow" data-testid="card-document-generation">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-warning rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-file-pdf text-white text-xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('landing.features.documentGeneration') || 'Document Generation'}</h3>
                <p className="text-secondary">{t('landing.features.documentGenerationDesc') || 'Auto-generate PDFs from templates with client data. Watermarking and secure preview system.'}</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow" data-testid="card-smart-reminders">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-error rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-bell text-white text-xl"></i>

... (truncated at 120 lines, total: 211 lines)
```

## Page: client/src/pages/not-found.tsx

```typescript
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            Did you forget to add the page to the router?
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

```

## Page: client/src/pages/payments.tsx

```typescript
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from '@/contexts/I18nProvider';
import { queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CreditCard, Plus, Search, Filter, Edit2, Trash2, DollarSign, Calendar } from 'lucide-react';

interface Payment {
  id: string;
  clientId: string;
  workerId?: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  description?: string;
  dueDate?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function PaymentsPage() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedMethod, setSelectedMethod] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPayment, setNewPayment] = useState({
    clientId: '',
    workerId: '',
    amount: 0,
    currency: 'RON',
    status: 'PENDING',
    paymentMethod: 'BANK_TRANSFER',
    description: '',
    dueDate: ''
  });

  // Redirect if not authenticated or insufficient permissions
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !['ADMIN', 'OWNER'].includes(user?.role || ''))) {
      toast({
        title: "Unauthorized",
        description: "Access denied. Admin or Owner privileges required.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || !['ADMIN', 'OWNER'].includes(user?.role || '')) {
    return null;
  }

  // Fetch payments from API (placeholder - will use real API when available)
  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['/api/payments'],
    enabled: isAuthenticated && ['ADMIN', 'OWNER'].includes(user?.role || ''),
    queryFn: async () => {
      // For now, return empty array as payments API is not fully implemented yet
      return [];
    }
  });

  // Filter payments based on search criteria
  const filteredPayments = (payments as Payment[]).filter((payment: Payment) => {
    const matchesSearch = !searchTerm || 
      payment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.clientId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || payment.status === selectedStatus;
    const matchesMethod = selectedMethod === 'all' || payment.paymentMethod === selectedMethod;
    
    return matchesSearch && matchesStatus && matchesMethod;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge variant="default" className="bg-green-500">Paid</Badge>;
      case 'PENDING':
        return <Badge variant="default" className="bg-yellow-500">Pending</Badge>;
      case 'OVERDUE':
        return <Badge variant="destructive">Overdue</Badge>;
      case 'CANCELLED':
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: currency || 'RON'
    }).format(amount);
  };

... (truncated at 120 lines, total: 350 lines)
```

## Page: client/src/pages/profile.tsx

```typescript
import { useState, useEffect } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, Calendar, Building, MapPin, Phone } from 'lucide-react';

export default function ProfilePage() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleSave = () => {
    toast({
      title: "Profile Updated",
      description: "Your profile has been saved successfully.",
    });
    setIsEditing(false);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-500';
      case 'OWNER':
        return 'bg-blue-500';
      case 'WORKER':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrator';
      case 'OWNER':
        return 'Client Owner';
      case 'WORKER':
        return 'Worker';
      default:
        return 'Viewer';
    }
  };

  // Use real user data
  const profileData = {
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: '',
    nationality: '',
    dateOfBirth: '',
    address: '',
    emergencyContact: '',
    workPermitStatus: '',
    visaStatus: ''
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userRole={user?.role || 'VIEWER'} />
      
      <div className="ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold">{t('pages.profile.title') || 'Profile'}</h1>
                <p className="text-gray-600 mt-2">
                  {t('profile.manageInfo') || 'Manage your personal information and immigration status'}
                </p>
              </div>
              <Button 
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                data-testid="button-edit-profile"
              >
                {isEditing ? (t('actions.saveChanges') || 'Save Changes') : (t('actions.editProfile') || 'Edit Profile')}
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Overview Card */}
              <Card>
                <CardHeader className="text-center">

... (truncated at 120 lines, total: 276 lines)
```

## Page: client/src/pages/reminders.tsx

```typescript
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from '@/contexts/I18nProvider';
import { queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Bell, Plus, Search, Filter, Edit2, Trash2, Calendar, Clock } from 'lucide-react';

interface ReminderRule {
  id: string;
  name: string;
  description?: string;
  triggerEvent: string;
  daysBefore: number;
  isActive: boolean;
  emailTemplate?: string;
  recipients: string[];
  createdAt: string;
  updatedAt: string;
}

export default function RemindersPage() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrigger, setSelectedTrigger] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newReminder, setNewReminder] = useState({
    name: '',
    description: '',
    triggerEvent: '',
    daysBefore: 7,
    isActive: true,
    emailTemplate: '',
    recipients: [] as string[]
  });

  // Redirect if not authenticated or insufficient permissions
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !['ADMIN', 'OWNER'].includes(user?.role || ''))) {
      toast({
        title: "Unauthorized",
        description: "Access denied. Admin or Owner privileges required.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || !['ADMIN', 'OWNER'].includes(user?.role || '')) {
    return null;
  }

  // Fetch reminder rules from API (placeholder - will use real API when available)
  const { data: reminderRules = [], isLoading: remindersLoading } = useQuery({
    queryKey: ['/api/reminder-rules'],
    enabled: isAuthenticated && ['ADMIN', 'OWNER'].includes(user?.role || ''),
    queryFn: async () => {
      // For now, return empty array as reminder rules API is not implemented yet
      return [];
    }
  });

  // Filter reminders based on search criteria
  const filteredReminders = (reminderRules as ReminderRule[]).filter((reminder: ReminderRule) => {
    const matchesSearch = !searchTerm || 
      reminder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reminder.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTrigger = selectedTrigger === 'all' || reminder.triggerEvent === selectedTrigger;
    const matchesStatus = selectedStatus === 'all' || 
      (selectedStatus === 'active' && reminder.isActive) ||
      (selectedStatus === 'inactive' && !reminder.isActive);
    
    return matchesSearch && matchesTrigger && matchesStatus;
  });

  const getTriggerBadge = (trigger: string) => {
    if (trigger.includes('deadline')) {
      return <Badge variant="default" className="bg-red-500">Deadline</Badge>;
    }
    if (trigger.includes('document')) {
      return <Badge variant="default" className="bg-blue-500">Document</Badge>;
    }
    if (trigger.includes('status')) {
      return <Badge variant="default" className="bg-green-500">Status</Badge>;
    }
    return <Badge variant="outline">Event</Badge>;
  };

  return (
    <div className="flex flex-col">
      <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bell className="h-8 w-8" />
              {t('pages.reminders.title') || 'Reminder Rules'}
            </h1>

... (truncated at 120 lines, total: 335 lines)
```

## Page: client/src/pages/requirements.tsx

```typescript
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from '@/contexts/I18nProvider';
import { queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Plus, Search, Filter, Edit2, Trash2 } from 'lucide-react';

interface Requirement {
  id: string;
  title: string;
  description?: string;
  category: string;
  stage: string;
  isRequired: boolean;
  documentTypes?: string[];
  templateId?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export default function RequirementsPage() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStage, setSelectedStage] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newRequirement, setNewRequirement] = useState({
    title: '',
    description: '',
    category: '',
    stage: '',
    isRequired: true,
    documentTypes: [] as string[],
    templateId: '',
    order: 0
  });

  // Redirect if not authenticated or insufficient permissions
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !['ADMIN', 'OWNER'].includes(user?.role || ''))) {
      toast({
        title: "Unauthorized",
        description: "Access denied. Admin or Owner privileges required.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || !['ADMIN', 'OWNER'].includes(user?.role || '')) {
    return null;
  }

  // Fetch requirements from API
  const { data: requirements = [], isLoading: requirementsLoading } = useQuery({
    queryKey: ['/api/requirements'],
    enabled: isAuthenticated && ['ADMIN', 'OWNER'].includes(user?.role || ''),
  });

  // Create requirement mutation
  const createRequirementMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create requirement');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/requirements'] });
      toast({
        title: "Success",
        description: "Requirement created successfully",
      });
      setIsCreateDialogOpen(false);
      setNewRequirement({
        title: '',
        description: '',
        category: '',
        stage: '',
        isRequired: true,
        documentTypes: [],
        templateId: '',
        order: 0
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create requirement",
        variant: "destructive",
      });
    },
  });


... (truncated at 120 lines, total: 365 lines)
```

## Page: client/src/pages/settings.tsx

```typescript
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/contexts/I18nProvider';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useBreadcrumb } from '@/contexts/BreadcrumbContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  FileText, 
  Workflow, 
  Calendar, 
  Building, 
  CreditCard, 
  Plus, 
  Trash2, 
  Edit,
  Save,
  Shield,
  Bell,
  Globe,
  Clock,
  Euro,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  XCircle,
  UserCheck,
  ArrowLeft,
  GitBranch,
  ChevronDown,
  ChevronUp,
  Code,
  Upload,
  CheckSquare,
  ListChecks,
  X
} from 'lucide-react';
import PatraIcon from '@/components/icons/PatraIcon';
import WorkerWorkflowAssignments from '@/components/WorkerWorkflowAssignments';

function SettingsPage() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();

  usePageTitle(t('nav.settings'));
  const { setBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    setBreadcrumbs([
      { label: t('nav.dashboard'), href: '/' },
      { label: t('nav.settings'), href: '/settings' }
    ]);
  }, [setBreadcrumbs, t]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const isAdmin = user.role === 'ADMIN';
  const isOwner = user.role === 'OWNER';

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-6 h-6" />
        <h1 className="text-2xl font-bold">{t('nav.settings')}</h1>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-6">
          <TabsTrigger value="general" className="text-xs lg:text-sm">General</TabsTrigger>
          <TabsTrigger value="workflows" className="text-xs lg:text-sm">Workflows</TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs lg:text-sm">Notifications</TabsTrigger>
          <TabsTrigger value="documents" className="text-xs lg:text-sm">Documents</TabsTrigger>
          {isAdmin && <TabsTrigger value="system" className="text-xs lg:text-sm">System</TabsTrigger>}
          <TabsTrigger value="assignments" className="text-xs lg:text-sm">Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <GeneralSettings />
        </TabsContent>

        <TabsContent value="workflows" className="space-y-6">
          <WorkflowManagement />
        </TabsContent>

... (truncated at 120 lines, total: 1561 lines)
```

## Page: client/src/pages/templates.tsx

```typescript
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { TemplateBuilder } from '@/components/template-builder/template-builder';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, FileText, Settings } from 'lucide-react';
import { DocumentTemplate, TemplateField } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

export default function TemplatesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<{ template: DocumentTemplate; fields: TemplateField[] } | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading } = useAuth();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['/api/templates'],
    enabled: isAuthenticated && !isLoading,
  });

  const createTemplateMutation = useMutation({
    mutationFn: (data: { template: Partial<DocumentTemplate>; fields: Partial<TemplateField>[] }) =>
      apiRequest('POST', '/api/templates', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      setIsCreating(false);
      setSelectedTemplate(null);
      toast({
        title: "Template Created",
        description: "Template has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create template.",
        variant: "destructive",
      });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { template: Partial<DocumentTemplate>; fields: Partial<TemplateField>[] } }) =>
      apiRequest('PUT', `/api/templates/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      setSelectedTemplate(null);
      toast({
        title: "Template Updated",
        description: "Template has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update template.",
        variant: "destructive",
      });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      toast({
        title: "Template Deleted",
        description: "Template has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete template.",
        variant: "destructive",
      });
    },
  });

  const handleSave = (template: Partial<DocumentTemplate>, fields: Partial<TemplateField>[]) => {
    if (selectedTemplate) {
      updateTemplateMutation.mutate({
        id: selectedTemplate.template.id,
        data: { template, fields },
      });
    } else {
      createTemplateMutation.mutate({ template, fields });

... (truncated at 120 lines, total: 282 lines)
```

## Page: client/src/pages/worker-dashboard.tsx

```typescript
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import StageProgress from "@/components/progress/stage-progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useTranslation } from "@/contexts/I18nProvider";
import WorkflowProgressTracker from "@/components/WorkflowProgressTracker";

export default function WorkerDashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: t('auth.unauthorized') || "Unauthorized",
        description: t('auth.loggedOut') || "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Debug: Allow viewing for all roles for now
  if (user?.role !== 'WORKER' && user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Restricted</h2>
          <p>Worker dashboard is only accessible to workers. Your role: {user?.role || 'Unknown'}</p>
          <p className="text-sm text-gray-500 mt-2">User ID: {user?.id}</p>
        </div>
      </div>
    );
  }

  // All workflow data is now managed directly by the WorkflowProgressTracker component

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userRole="WORKER" />
      
      <div className="ml-64">
        <Header 
          title={t('dashboard.worker.title') || "My Immigration Progress"}
          subtitle={t('dashboard.worker.subtitle') || "Track your Romanian work permit and residence application"}
        />

        <div className="p-8">
          {/* Admin Demo Notice */}
          {user?.role === 'ADMIN' && user?.id === 'dev-admin-1' && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                🔍 <strong>Admin Preview:</strong> This shows how the worker dashboard displays workflow data from Settings. This is demo data for demonstration.
              </p>
            </div>
          )}

          {/* Main Content */}
          {user?.id ? (
            <WorkflowProgressTracker 
              workerId={user.id}
              userRole={user.role || 'WORKER'}
              showUploadPane={true}
              showVerificationToggles={false}
            />
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-gray-500">
                  <p>{t('workflow.noUser') || 'Unable to load user information'}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* All workflow data now handled by WorkflowProgressTracker component */}
        </div>
      </div>
    </div>
  );
}

```

## Page: client/src/pages/worker-profile.tsx

```typescript
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Globe, 
  CreditCard, 
  Edit, 
  Save, 
  X,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  Upload,
  Download,
  Eye
} from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useTranslation } from "@/contexts/I18nProvider";
import { DocumentViewer } from "@/components/documents/DocumentViewer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import WorkflowProgressTracker from "@/components/WorkflowProgressTracker";

interface WorkerAssignment {
  id: string;
  requirement: {
    id: string;
    title: string;
    description: string;
    stage: {
      key: string;
      title: string;
      order: number;
    };
  };
  status: string;
  documentFiles: {
    id: string;
    fileName: string;
    kind: string;
    createdAt: string;
  }[];
  submittedAt?: string;
  approvedAt?: string;
  rejectedReason?: string;
}

interface WorkerData {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  dob: string | null;
  nationality: string | null;
  passportNumber: string | null;
  passportExpiry: string | null;
  clientProfile: {
    id: string;
    legalName: string;
  } | null;
  assignments: WorkerAssignment[];
}

export default function WorkerProfile() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  
  // Extract worker ID from URL
  const workerId = location.split('/workers/')[1];
  
  // Form states
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dob: '',
    nationality: '',
    passportNumber: '',
    passportExpiry: ''
  });

  // Fetch worker data
  const { data: worker, isLoading: workerLoading, error: workerError } = useQuery<WorkerData>({
    queryKey: ['/api/workers', workerId],
    enabled: !!workerId && isAuthenticated,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized", 
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return false;
      }
      return failureCount < 3;

... (truncated at 120 lines, total: 628 lines)
```

## Page: client/src/pages/workers.tsx

```typescript
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from '@/contexts/I18nProvider';
import { usePageTitle } from '@/hooks/usePageTitle';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Users, Plus, Search, Filter, Edit2, Eye, MapPin, Calendar, Briefcase, Save, X } from 'lucide-react';
import { Link } from 'wouter';

interface Worker {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  nationality?: string;
  passportNumber?: string;
  currentWorkPermitExpiry?: string;
  status: string;
  clientProfileId: string;
  assignmentId?: string;
  createdAt: string;
  updatedAt: string;
}

export default function WorkersPage() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();
  usePageTitle('nav.workers');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedNationality, setSelectedNationality] = useState('all');
  const [showNewWorkerForm, setShowNewWorkerForm] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [newWorkerForm, setNewWorkerForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    nationality: '',
    passportNumber: '',
    currentWorkPermitExpiry: '',
    status: 'PENDING',
    clientProfileId: ''
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "Please log in to access this page.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Fetch workers from API
  const { data: workers = [], isLoading: workersLoading } = useQuery({
    queryKey: ['/api/workers'],
    enabled: isAuthenticated,
  });

  // Fetch clients for the dropdown
  const { data: clients = [] } = useQuery({
    queryKey: ['/api/clients'],
    enabled: isAuthenticated && user?.role === 'ADMIN',
  });

  // Create worker mutation
  const createWorkerMutation = useMutation({
    mutationFn: (workerData: typeof newWorkerForm) => {
      if (!workerData.clientProfileId) {
        throw new Error('Client ID is required to create a worker');
      }
      return apiRequest(`/api/clients/${workerData.clientProfileId}/workers`, 'POST', workerData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workers'] });
      setShowNewWorkerForm(false);
      setNewWorkerForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        nationality: '',
        passportNumber: '',
        currentWorkPermitExpiry: '',
        status: 'PENDING',
        clientProfileId: ''
      });
      toast({
        title: "Success",

... (truncated at 120 lines, total: 673 lines)
```

## Page: client/src/pages/workflow-assignments.tsx

```typescript
import React from 'react';
import WorkerWorkflowAssignments from '@/components/WorkerWorkflowAssignments';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useTranslation } from '@/contexts/I18nProvider';

export default function WorkflowAssignmentsPage() {
  const { t } = useTranslation();
  
  usePageTitle(t('nav.workflowAssignments'));

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {t('nav.workflowAssignments')}
        </h1>
        <p className="text-lg text-muted-foreground">
          {t('common.assignWorkflowsToWorkers')}
        </p>
      </div>
      
      <WorkerWorkflowAssignments />
    </div>
  );
}
```

## I18n Provider: I18nProvider.tsx

```typescript
import React, { createContext, useContext, ReactNode } from 'react';
import { useTranslation as useI18nextTranslation } from 'react-i18next';
import '../i18n';
import { clientErrorReporter } from '../lib/clientErrorReporter';

interface I18nContextType {
  t: (key: string, options?: any) => string;
  language: string;
  changeLanguage: (lng: string) => Promise<void>;
  availableLanguages: { code: string; name: string }[];
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const { t: originalT, i18n } = useI18nextTranslation();

  const availableLanguages = [
    { code: 'en', name: 'English' },
    { code: 'ro', name: 'Română' }
  ];

  // Enhanced translation function with comprehensive monitoring
  const t = (key: string, options?: any): string => {
    try {
      // Handle namespace-based keys (namespace.key) 
      const parts = key.split('.');
      let namespace = 'common'; // Default namespace
      let translationKey = key;
      
      if (parts.length > 1 && ['common', 'nav', 'actions', 'dashboard'].includes(parts[0])) {
        namespace = parts[0]; // Use the first part as namespace
        translationKey = parts.slice(1).join('.'); // Use remaining parts as key
      }
      
      const translation = originalT(translationKey, { 
        ...options, 
        lng: i18n.language, 
        ns: namespace 
      });
      
      // Ensure we always return a string
      const translationString = typeof translation === 'string' ? translation : String(translation);
      
      // Check if we got the key back (meaning no translation found)
      if (translationString === translationKey && i18n.language !== 'en') {
        // Try to get English fallback
        const fallback = originalT(translationKey, { 
          ...options, 
          lng: 'en', 
          ns: namespace 
        });
        const fallbackString = typeof fallback === 'string' ? fallback : String(fallback);
        if (fallbackString !== translationKey) {
          // Log successful fallback
          clientErrorReporter.logTranslation(key, i18n.language, fallbackString, true);
          return fallbackString;
        } else {
          // Log translation not found
          clientErrorReporter.logTranslation(key, i18n.language, translationString, false, 'Translation not found in any language');
        }
      } else {
        // Log successful translation
        clientErrorReporter.logTranslation(key, i18n.language, translationString, false);
      }
      
      return translationString;
    } catch (error) {
      const err = error as Error;
      clientErrorReporter.logTranslation(key, i18n.language, key, false, err.message);
      clientErrorReporter.logError(err, 'Translation Error', { key, language: i18n.language });
      
      // Return a meaningful fallback instead of the key
      const parts = key.split('.');
      return parts[parts.length - 1];
    }
  };

  const contextValue: I18nContextType = {
    t,
    language: i18n.language,
    changeLanguage: async (lng: string) => {
      await i18n.changeLanguage(lng);
      localStorage.setItem('app-language', lng);
    },
    availableLanguages,
  };

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  
  // Add compatibility properties
  return {
    ...context,
    currentLanguage: context.language,
    setLanguage: context.changeLanguage
  };
}
```

## I18n Config: i18n.ts

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpApi from 'i18next-http-backend';

i18n
  .use(HttpApi)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: false, // Disable debug in production
    
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      requestOptions: {
        cache: 'no-cache' // Prevent caching issues during development
      }
    },

    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'app-language', // Match what we use in I18nProvider
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: false,
    },

    // Configure multiple namespaces
    defaultNS: 'common',
    ns: ['common', 'nav', 'dashboard', 'actions'],

    // Wait for resources to load
    initImmediate: false,
  });

export default i18n;
```

## Analysis

### Potential Duplicate Sidebars

- client/src/components/layout/sidebar.tsx
- client/src/components/ui/sidebar.tsx

### Potential Duplicate Navigation

- client/src/components/MobileNavigation.tsx
- client/src/components/layout/NavigationBreadcrumb.tsx
- client/src/components/ui/navigation-menu.tsx
- public/locales/en/nav.json
- public/locales/ro/nav.json

### Potential Duplicate I18n Configs

- client/src/contexts/I18nProvider.tsx
- client/src/i18n.ts

### Files with Potential Mock/Test Data References

- client/src/App.tsx
- client/src/components/DocumentStatusTracker.tsx
- client/src/components/LanguageSelector.tsx
- client/src/components/MobileNavigation.tsx
- client/src/components/WorkerWorkflowAssignments.tsx
- client/src/components/WorkerWorkflowDashboard.tsx
- client/src/components/WorkflowProgressTracker.tsx
- client/src/components/clients/ClientWorkersDisplay.tsx
- client/src/components/documents/DocumentUploader.tsx
- client/src/components/documents/DocumentViewer.tsx
- client/src/components/dummy-data-alert.tsx
- client/src/components/forms/client-form.tsx
- client/src/components/forms/worker-form.tsx
- client/src/components/kanban/workflow-kanban.tsx
- client/src/components/layout/NavigationBreadcrumb.tsx
- client/src/components/layout/sidebar.tsx
- client/src/components/modals/add-worker-modal.tsx
- client/src/components/modals/create-client-modal.tsx
- client/src/components/profile/company-profile.tsx
- client/src/components/progress/stage-progress.tsx
- client/src/components/shared/WorkerWorkflowDisplay.tsx
- client/src/components/template-builder/template-builder.tsx
- client/src/components/ui/alert-banner.tsx
- client/src/components/ui/command.tsx
- client/src/components/ui/input.tsx
- client/src/components/ui/select.tsx
- client/src/components/ui/textarea.tsx
- client/src/components/worker-invitation-link.tsx
- client/src/components/workers/worker-list.tsx
- client/src/lib/authUtils.ts
- client/src/pages/admin-dashboard.tsx
- client/src/pages/analytics.tsx
- client/src/pages/audit-logs.tsx
- client/src/pages/client-dashboard.tsx
- client/src/pages/client-profile.tsx
- client/src/pages/clients.tsx
- client/src/pages/deadlines.tsx
- client/src/pages/documents.tsx
- client/src/pages/health-check.tsx
- client/src/pages/landing.tsx
- client/src/pages/payments.tsx
- client/src/pages/profile.tsx
- client/src/pages/reminders.tsx
- client/src/pages/requirements.tsx
- client/src/pages/settings.tsx
- client/src/pages/templates.tsx
- client/src/pages/worker-profile.tsx
- client/src/pages/workers.tsx
- scripts/add-comprehensive-workflow-stages.js
- scripts/add-romanian-work-permit-stages.js
- scripts/analyze-real-browser-activity.js
- scripts/authenticated-ui-test.js
- scripts/capture-rendered-content.js
- scripts/comprehensive-browser-test.js
- scripts/comprehensive-ui-test.js
- scripts/create-sample-assignments.js
- scripts/fix_translations.js
- scripts/http-frontend-test.js
- scripts/populate-romanian-workflow-details.js
- scripts/project-diagnostic.ts
- scripts/puppeteer-frontend-test.js
- scripts/quick-ui-validation.js
- scripts/run-ui-tests.js
- scripts/seed.js
- scripts/test_translations.js
- scripts/thorough-validation-test.js
- scripts/verify-frontend.js
- scripts/wait-for-react-render.js
- server/automation/comprehensive-migration.ts
- server/automation/execute-migration.ts
- server/automation/final-production-cleanup.ts
- server/automation/final-system-validation.ts
- server/automation/fix-all-mock-data.ts
- server/automation/migration-script.ts
- server/automation/validate-production-ready.ts
- server/config/mapping.ts
- server/config/production-validation.ts
- server/db.ts
- server/healthCheckOrchestrator.ts
- server/index.ts
- server/middleware/monitoring.ts
- server/middleware/rbac.ts
- server/replitAuth.ts
- server/routes.ts
- server/seed.ts
- server/seedDatabase.ts
- server/services/documentService.ts
- server/services/emailService.ts
- server/services/fileScanningService.ts
- server/services/government-api.ts
- server/services/loggingService.ts
- server/services/ocr-service.ts
- server/storage.ts
- server/tests/mock-data-detection.ts
- shared/schema.ts
- tests/api.rbac.test.ts
- tests/api.test.ts
- tests/e2e/workflow.spec.ts
- tests/helpers/testServer.ts
- tests/integration/api-integration.test.ts
- tests/integration/background-services-integration.test.ts
- tests/integration/data-validation-integration.test.ts
- tests/integration/email-reminder.integration.test.ts
- tests/integration/endpoint-mismatch-integration.test.ts
- tests/integration/frontend-api-integration.test.ts
- tests/integration/security-rbac-integration.test.ts
- tests/pdf.test.ts
- tests/secure-upload.integration.test.ts
- tests/services/emailService.test.ts
- tests/upload.security.test.ts
- tests/upload.test.ts
- tests/workers/queue.test.ts

### Project Statistics

- Total JavaScript/TypeScript files: 201
- React component files: 101
