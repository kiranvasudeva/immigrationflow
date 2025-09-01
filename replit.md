# System Bible - ImmigrationFlow

## Overview

ImmigrationFlow is a comprehensive SaaS platform designed to streamline Romanian immigration workflows. It manages the entire process, from AJOFM labor market tests and IGI work permits to consulate visa applications and final residence permits. The platform offers multi-role access (Admin, Client Owner, Worker, Viewer), robust document management with PDF generation, automated reminders, audit logging, and a kanban-style workflow interface. The vision is to provide an efficient and compliant solution for immigration management, targeting businesses and individuals navigating the complex Romanian immigration landscape.

## User Preferences

Preferred communication style: Simple, everyday language.
The agent should always inventory existing working functionality, follow documented patterns, implement all requested functionality with working CRUD operations, preserve all existing working features, and verify UI/API functionality before marking a task complete. Documentation must be updated after task completion. The agent should never break existing working functionality.

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