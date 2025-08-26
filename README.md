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
