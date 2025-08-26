# Overview

ImmigrationFlow is a comprehensive SaaS platform for managing Romanian immigration workflows, including work permits, visa applications, and residence permits. The system handles the complete Romanian immigration process from AJOFM labor market tests through IGI work permits, consulate visa applications, to final residence permits. It features multi-role access control (Admin, Client Owner, Worker, Viewer), document management with PDF generation, automated reminders, audit logging, and a kanban-style workflow interface.

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