#!/usr/bin/env tsx

/**
 * Test Data Seeding Script for ImmigrationFlow Demo Environment
 * 
 * SECURITY WARNING: This script is only for development and demo environments.
 * It creates test accounts with KNOWN PASSWORDS for demonstration purposes.
 * 
 * Usage:
 * - Development: tsx scripts/seed-test-data.ts
 */

import { db } from '../server/db.js';
import { 
  users, 
  clientProfiles, 
  workers, 
  workflowTemplates, 
  workflowSteps, 
  workerWorkflowProgress, 
  workerStepProgress 
} from '../shared/schema.js';
import { authService } from '../server/services/authService.js';
import { eq, and } from 'drizzle-orm';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

const DEFAULT_PASSWORD = 'Demo!2345';

async function seedTestData() {
  try {
    console.log('🌱 Starting test data seeding...');
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ SECURITY ERROR: Test data seeding is DISABLED in production!');
      process.exit(1);
    }

    const password = DEFAULT_PASSWORD;

    // Test users to create
    const testUsers = [
      {
        email: 'admin@demo.law',
        firstName: 'System',
        lastName: 'Administrator',
        role: 'ADMIN' as const
      },
      {
        email: 'client@demo.law', 
        firstName: 'Maria',
        lastName: 'Popescu',
        role: 'OWNER' as const
      },
      {
        email: 'worker@demo.law',
        firstName: 'Ion',
        lastName: 'Ionescu', 
        role: 'WORKER' as const
      }
    ];

    const createdUsers = [];

    // Create or update test users
    for (const userData of testUsers) {
      console.log(`\n🔍 Processing ${userData.email} (${userData.role})...`);
      
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, userData.email));

      const { hash, salt } = await authService.hashPassword(password);

      if (existingUser) {
        console.log(`⚠️  User exists, updating password...`);
        await db
          .update(users)
          .set({
            passwordHash: hash,
            passwordSalt: salt,
            updatedAt: new Date(),
          })
          .where(eq(users.id, existingUser.id));
        
        createdUsers.push(existingUser);
      } else {
        const [newUser] = await db
          .insert(users)
          .values({
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            role: userData.role,
            passwordHash: hash,
            passwordSalt: salt,
            failedLoginAttempts: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        console.log(`✅ Created user: ${newUser.email}`);
        createdUsers.push(newUser);
      }
    }

    // Find owner user for client profiles
    const ownerUser = createdUsers.find(u => u.role === 'OWNER');
    if (!ownerUser) {
      throw new Error('No OWNER user found');
    }

    // Create demo client profiles
    console.log(`\n🏢 Creating demo client profiles...`);
    
    const clientsData = [
      {
        legalName: 'Demo Legal Services SRL',
        registrationNumber: 'J40/12345/2024',
        cui: 'RO12345678',
        legalAddress: 'Str. Victoriei Nr. 10, București, România',
        adminName: 'Maria Popescu',
        contactEmail: 'client@demo.law',
        phoneNumber: '+40721234567',
        bankIban: 'RO49AAAA1B310075938402',
        caen: '6910'
      },
      {
        legalName: 'Tech Solutions Romania SRL',
        registrationNumber: 'J40/67890/2024',
        cui: 'RO87654321',
        legalAddress: 'Bulevardul Unirii Nr. 25, București, România',
        adminName: 'Ion Georgescu',
        contactEmail: 'tech@demo.law',
        phoneNumber: '+40722345678',
        bankIban: 'RO49BBBB1C320186049503',
        caen: '6201'
      }
    ];

    const createdClients = [];
    for (const clientData of clientsData) {
      const [existingClient] = await db
        .select()
        .from(clientProfiles)
        .where(eq(clientProfiles.cui, clientData.cui));

      if (!existingClient) {
        const [client] = await db
          .insert(clientProfiles)
          .values({
            ...clientData,
            ownerUserId: ownerUser.id,
            createdAt: new Date(),
          })
          .returning();
          
        console.log(`✅ Created client: ${client.legalName}`);
        createdClients.push(client);
      } else {
        console.log(`⚠️  Client exists: ${clientData.legalName}`);
        createdClients.push(existingClient);
      }
    }

    // Create sample workers
    console.log(`\n👥 Creating sample workers...`);
    
    const workersData = [
      {
        firstName: 'Ion',
        lastName: 'Ionescu',
        nationality: 'Romanian',
        passportNumber: 'AB1234567',
        email: 'worker@demo.law',
        clientIndex: 0
      },
      {
        firstName: 'Ana',
        lastName: 'Marinescu',
        nationality: 'Romanian',
        passportNumber: 'CD7654321',
        email: 'ana.marinescu@demo.law',
        clientIndex: 0
      },
      {
        firstName: 'Mihai',
        lastName: 'Constantinescu',
        nationality: 'Romanian',
        passportNumber: 'EF9876543',
        email: 'mihai.const@demo.law',
        clientIndex: 1
      },
      {
        firstName: 'Elena',
        lastName: 'Stanescu',
        nationality: 'Romanian',
        passportNumber: 'GH5432109',
        email: 'elena.stanescu@demo.law',
        clientIndex: 1
      }
    ];

    const createdWorkers = [];
    for (const workerData of workersData) {
      const client = createdClients[workerData.clientIndex];
      
      const [existingWorker] = await db
        .select()
        .from(workers)
        .where(and(
          eq(workers.passportNumber, workerData.passportNumber),
          eq(workers.clientProfileId, client.id)
        ));

      if (!existingWorker) {
        const [worker] = await db
          .insert(workers)
          .values({
            clientProfileId: client.id,
            firstName: workerData.firstName,
            lastName: workerData.lastName,
            nationality: workerData.nationality,
            passportNumber: workerData.passportNumber,
            email: workerData.email,
            createdAt: new Date(),
          })
          .returning();
          
        console.log(`✅ Created worker: ${worker.firstName} ${worker.lastName}`);
        createdWorkers.push(worker);
      } else {
        console.log(`⚠️  Worker exists: ${workerData.firstName} ${workerData.lastName}`);
        createdWorkers.push(existingWorker);
      }
    }

    // Create workflow templates
    console.log(`\n📋 Creating workflow templates...`);
    
    const adminUser = createdUsers.find(u => u.role === 'ADMIN');
    if (!adminUser) {
      throw new Error('No ADMIN user found');
    }

    const templatesData = [
      {
        name: 'Romanian Immigration Workflow',
        description: 'Complete Romanian immigration process',
        isActive: true,
        order: 1,
        executionType: 'sequential',
        estimatedDurationDays: 120
      },
      {
        name: 'EU Blue Card Process',
        description: 'EU Blue Card application process',
        isActive: true,
        order: 2,
        executionType: 'sequential',
        estimatedDurationDays: 90
      }
    ];

    const createdTemplates = [];
    for (const templateData of templatesData) {
      const [existingTemplate] = await db
        .select()
        .from(workflowTemplates)
        .where(eq(workflowTemplates.name, templateData.name));

      if (!existingTemplate) {
        const [template] = await db
          .insert(workflowTemplates)
          .values({
            ...templateData,
            createdByUserId: adminUser.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
          
        console.log(`✅ Created template: ${template.name}`);
        createdTemplates.push(template);
      } else {
        console.log(`⚠️  Template exists: ${templateData.name}`);
        createdTemplates.push(existingTemplate);
      }
    }

    // Create workflow steps
    console.log(`\n📝 Creating workflow steps...`);
    
    const stepsData = [
      // Romanian Immigration steps
      {
        templateIndex: 0,
        name: 'AJOFM Labor Market Test',
        description: 'Submit application to Romanian National Employment Agency',
        stepType: 'INSTITUTIONAL_SUBMISSION',
        assignedRole: 'OWNER',
        order: 1,
        estimatedDays: 30
      },
      {
        templateIndex: 0,
        name: 'IGI Work Permit Application',
        description: 'Apply for work permit at Romanian Immigration Office',
        stepType: 'INSTITUTIONAL_SUBMISSION',
        assignedRole: 'OWNER',
        order: 2,
        estimatedDays: 45
      },
      {
        templateIndex: 0,
        name: 'Consulate Visa Application',
        description: 'Apply for long-stay visa at Romanian consulate',
        stepType: 'FORM_COMPLETION',
        assignedRole: 'WORKER',
        order: 3,
        estimatedDays: 30
      },
      {
        templateIndex: 0,
        name: 'Residence Permit Application',
        description: 'Apply for residence permit at IGI',
        stepType: 'ADMIN_APPROVAL',
        assignedRole: 'WORKER',
        order: 4,
        estimatedDays: 15
      },
      // EU Blue Card steps
      {
        templateIndex: 1,
        name: 'Document Preparation',
        description: 'Prepare all required documents',
        stepType: 'DOCUMENT_COLLECTION',
        assignedRole: 'OWNER',
        order: 1,
        estimatedDays: 14
      },
      {
        templateIndex: 1,
        name: 'Application Submission',
        description: 'Submit EU Blue Card application',
        stepType: 'INSTITUTIONAL_SUBMISSION',
        assignedRole: 'WORKER',
        order: 2,
        estimatedDays: 30
      },
      {
        templateIndex: 1,
        name: 'Interview Process',
        description: 'Attend required interviews',
        stepType: 'DOCUMENT_REVIEW',
        assignedRole: 'WORKER',
        order: 3,
        estimatedDays: 7
      },
      {
        templateIndex: 1,
        name: 'Card Collection',
        description: 'Collect approved EU Blue Card',
        stepType: 'DOCUMENT_COLLECTION',
        assignedRole: 'WORKER',
        order: 4,
        estimatedDays: 1
      }
    ];

    const createdSteps = [];
    for (const stepData of stepsData) {
      const template = createdTemplates[stepData.templateIndex];
      
      const [existingStep] = await db
        .select()
        .from(workflowSteps)
        .where(and(
          eq(workflowSteps.workflowTemplateId, template.id),
          eq(workflowSteps.order, stepData.order)
        ));

      if (!existingStep) {
        const [step] = await db
          .insert(workflowSteps)
          .values({
            workflowTemplateId: template.id,
            name: stepData.name,
            description: stepData.description,
            stepType: stepData.stepType,
            assignedRole: stepData.assignedRole,
            order: stepData.order,
            estimatedDays: stepData.estimatedDays,
            isRequired: true,
            requiresApproval: false,
            createdAt: new Date(),
          })
          .returning();
          
        console.log(`✅ Created step: ${step.name}`);
        createdSteps.push(step);
      } else {
        console.log(`⚠️  Step exists: ${stepData.name}`);
        createdSteps.push(existingStep);
      }
    }

    // Create worker progress
    console.log(`\n🔄 Creating worker workflow progress...`);
    
    if (createdWorkers.length > 0 && createdTemplates.length > 0) {
      const worker = createdWorkers[0];
      const template = createdTemplates[0];
      
      const [existingProgress] = await db
        .select()
        .from(workerWorkflowProgress)
        .where(and(
          eq(workerWorkflowProgress.workerId, worker.id),
          eq(workerWorkflowProgress.workflowTemplateId, template.id)
        ));

      if (!existingProgress) {
        const templateSteps = createdSteps
          .filter(step => step.workflowTemplateId === template.id)
          .sort((a, b) => a.order - b.order);

        const [progress] = await db
          .insert(workerWorkflowProgress)
          .values({
            workerId: worker.id,
            workflowTemplateId: template.id,
            currentStepId: templateSteps[0]?.id || null,
            status: 'IN_PROGRESS',
            startedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
          
        console.log(`✅ Created workflow progress`);

        // Create step progress
        for (let i = 0; i < Math.min(templateSteps.length, 3); i++) {
          const step = templateSteps[i];
          const status = i === 0 ? 'IN_PROGRESS' : 'PENDING';
          
          await db
            .insert(workerStepProgress)
            .values({
              workerWorkflowProgressId: progress.id,
              workflowStepId: step.id,
              status: status,
              assignedToUserId: ownerUser.id,
              startedAt: i === 0 ? new Date() : null,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
            
          console.log(`✅ Created step progress: ${step.name}`);
        }
      }
    }

    // Generate TEST_CREDENTIALS.md
    console.log(`\n📄 Generating TEST_CREDENTIALS.md...`);
    
    const credentialsContent = `# Test Credentials for ImmigrationFlow Demo

## Overview
This file contains test account credentials for the ImmigrationFlow demo environment.

⚠️ **SECURITY WARNING**: These are DEMO credentials with KNOWN passwords.
**NEVER use these credentials in production!**

## Test Accounts

| Role   | Email             | Password     | Description                                  |
|--------|-------------------|--------------|----------------------------------------------|
| ADMIN  | admin@demo.law    | ${password}  | Full system access for demo purposes        |
| OWNER  | client@demo.law   | ${password}  | Client owner - can manage workers           |
| WORKER | worker@demo.law   | ${password}  | Worker - can view assignments, upload docs  |

## Usage Instructions

1. **Start the application**:
   \`\`\`bash
   npm run dev
   \`\`\`

2. **Set authentication mode**:
   - Ensure \`AUTH_MODE=password\` in your environment variables

3. **Access the application**:
   - Navigate to the login page
   - Use any of the credentials above

4. **Development API access**:
   - GET \`/dev/test-credentials\` with header \`X-Dev-Secret\` (development only)

## Demo Data Created

- **Users**: 3 test users (ADMIN, OWNER, WORKER)
- **Clients**: 2 demo client profiles
- **Workers**: 4 sample workers across both clients
- **Workflows**: 2 workflow templates with 4-5 steps each
- **Progress**: Active workflow progress for demonstration

## Generated On
${new Date().toISOString()}

---
**Environment**: Development Only
**Script**: \`tsx scripts/seed-test-data.ts\`
`;

    const credentialsPath = resolve(process.cwd(), 'TEST_CREDENTIALS.md');
    writeFileSync(credentialsPath, credentialsContent, 'utf8');
    console.log(`✅ Generated TEST_CREDENTIALS.md at: ${credentialsPath}`);

    // Summary report
    console.log('\n🎉 Test data seeding completed!');
    console.log('\n📋 SUMMARY:');
    console.log(`✅ Users: 3`);
    console.log(`✅ Client profiles: 2`);
    console.log(`✅ Workers: 4`);
    console.log(`✅ Workflow templates: 2`);
    console.log(`✅ Workflow steps: 8`);
    console.log(`✅ Credentials file: ${credentialsPath}`);

    console.log('\n📖 USAGE:');
    console.log('1. npm run dev');
    console.log('2. Set AUTH_MODE=password');
    console.log('3. Login with credentials from TEST_CREDENTIALS.md');

  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    process.exit(1);
  }
}

// Validate environment
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL required');
  process.exit(1);
}

// Run seeding
seedTestData()
  .then(() => {
    console.log('\n✨ Seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Seeding failed:', error);
    process.exit(1);
  });