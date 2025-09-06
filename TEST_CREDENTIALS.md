# Test Credentials for ImmigrationFlow Demo

## Overview
This file contains test account credentials for the ImmigrationFlow demo environment.

⚠️ **SECURITY WARNING**: These are DEMO credentials with KNOWN passwords.
**NEVER use these credentials in production!**

## Test Accounts

| Role   | Email             | Password     | Description                                  |
|--------|-------------------|--------------|----------------------------------------------|
| ADMIN  | admin@demo.law    | Demo!2345  | Full system access for demo purposes        |
| OWNER  | client@demo.law   | Demo!2345  | Client owner - can manage workers           |
| WORKER | worker@demo.law   | Demo!2345  | Worker - can view assignments, upload docs  |

## Usage Instructions

1. **Start the application**:
   ```bash
   npm run dev
   ```

2. **Set authentication mode**:
   - Ensure `AUTH_MODE=password` in your environment variables

3. **Access the application**:
   - Navigate to the login page
   - Use any of the credentials above

4. **Development API access**:
   - GET `/dev/test-credentials` with header `X-Dev-Secret` (development only)

## Demo Data Created

- **Users**: 3 test users (ADMIN, OWNER, WORKER)
- **Clients**: 2 demo client profiles
- **Workers**: 4 sample workers across both clients
- **Workflows**: 2 workflow templates with 4-5 steps each
- **Progress**: Active workflow progress for demonstration

## Generated On
2025-09-06T09:25:51.073Z

---
**Environment**: Development Only
**Script**: `tsx scripts/seed-test-data.ts`
