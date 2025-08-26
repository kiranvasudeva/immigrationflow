import { db } from './db';
import { 
  users, 
  clientProfiles, 
  workers, 
  stages, 
  requirements, 
  assignments 
} from '@shared/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

async function createSampleData() {
  try {
    console.log('Creating sample data...');

    // Get existing stages and requirements
    const allStages = await db.select().from(stages).orderBy(stages.order);
    const allRequirements = await db.select().from(requirements);
    
    if (allStages.length === 0) {
      throw new Error('No stages found. Please run seed.ts first.');
    }

    // Generate UUIDs for owners
    const ownerId1 = randomUUID();
    const ownerId2 = randomUUID();
    const ownerId3 = randomUUID();

    // Create sample client owners
    const sampleOwners = [
      {
        id: ownerId1,
        email: 'owner@techcorp.ro',
        firstName: 'Maria',
        lastName: 'Popescu',
        role: 'OWNER' as const,
      },
      {
        id: ownerId2,
        email: 'ceo@innovatelab.ro',
        firstName: 'Alexandru',
        lastName: 'Ionescu',
        role: 'OWNER' as const,
      },
      {
        id: ownerId3,
        email: 'admin@startuplabs.ro',
        firstName: 'Diana',
        lastName: 'Constantinescu',
        role: 'OWNER' as const,
      }
    ];

    for (const owner of sampleOwners) {
      await db.insert(users).values(owner).onConflictDoNothing();
    }

    // Generate UUIDs for clients
    const clientId1 = randomUUID();
    const clientId2 = randomUUID();
    const clientId3 = randomUUID();

    // Create sample client profiles
    const sampleClients = [
      {
        id: clientId1,
        companyName: 'TechCorp Solutions SRL',
        cui: 'RO12345678',
        address: 'Strada Victoriei 15, Sector 1, București',
        caen: '6201',
        contactEmail: 'contact@techcorp.ro',
        onrc: 'J40/1234/2020',
        ownerUserId: ownerId1,
      },
      {
        id: clientId2,
        companyName: 'InnovateLab Technologies SRL',
        cui: 'RO23456789',
        address: 'Bulevardul Magheru 28-30, Sector 1, București',
        caen: '6202',
        contactEmail: 'hr@innovatelab.ro',
        onrc: 'J40/5678/2021',
        ownerUserId: ownerId2,
      },
      {
        id: clientId3,
        companyName: 'StartupLabs Romania SRL',
        cui: 'RO34567890',
        address: 'Calea Floreasca 169, Sector 1, București',
        caen: '6209',
        contactEmail: 'contact@startuplabs.ro',
        onrc: 'J40/9012/2022',
        ownerUserId: ownerId3,
      }
    ];

    for (const client of sampleClients) {
      await db.insert(clientProfiles).values(client).onConflictDoNothing();
    }

    // Generate UUIDs for workers
    const workerId1 = randomUUID();
    const workerId2 = randomUUID();
    const workerId3 = randomUUID();
    const workerId4 = randomUUID();
    const workerId5 = randomUUID();

    // Create sample workers
    const sampleWorkers = [
      {
        id: workerId1,
        clientProfileId: clientId1,
        firstName: 'John',
        lastName: 'Smith',
        dob: new Date('1990-05-15'),
        nationality: 'American',
        passportNumber: 'US123456789',
        passportExpiry: new Date('2028-05-15'),
        email: 'john.smith@email.com',
        phone: '+1-555-0123',
      },
      {
        id: workerId2,
        clientProfileId: clientId1,
        firstName: 'Maria',
        lastName: 'Rodriguez',
        dob: new Date('1988-03-22'),
        nationality: 'Spanish',
        passportNumber: 'ES987654321',
        passportExpiry: new Date('2027-03-22'),
        email: 'maria.rodriguez@email.com',
        phone: '+34-666-123-456',
      },
      {
        id: workerId3,
        clientProfileId: clientId2,
        firstName: 'Ahmed',
        lastName: 'Hassan',
        dob: new Date('1992-08-10'),
        nationality: 'Egyptian',
        passportNumber: 'EG456789123',
        passportExpiry: new Date('2026-08-10'),
        email: 'ahmed.hassan@email.com',
        phone: '+20-10-1234-5678',
      },
      {
        id: workerId4,
        clientProfileId: clientId2,
        firstName: 'Priya',
        lastName: 'Sharma',
        dob: new Date('1991-12-03'),
        nationality: 'Indian',
        passportNumber: 'IN789123456',
        passportExpiry: new Date('2029-12-03'),
        email: 'priya.sharma@email.com',
        phone: '+91-98765-43210',
      },
      {
        id: workerId5,
        clientProfileId: clientId3,
        firstName: 'Liu',
        lastName: 'Wei',
        dob: new Date('1989-07-18'),
        nationality: 'Chinese',
        passportNumber: 'CN321654987',
        passportExpiry: new Date('2027-07-18'),
        email: 'liu.wei@email.com',
        phone: '+86-138-0013-8000',
      },
    ];

    for (const worker of sampleWorkers) {
      await db.insert(workers).values(worker).onConflictDoNothing();
    }

    // Create sample assignments across different statuses and stages
    const adminUserId = 'admin-user-1';
    
    // Get requirements by stage for assignment creation
    const ajofmReqs = allRequirements.filter(r => r.stageId === allStages.find(s => s.key === 'AJOFM')?.id);
    const workPermitReqs = allRequirements.filter(r => r.stageId === allStages.find(s => s.key === 'IGI_WORK_PERMIT')?.id);
    const visaReqs = allRequirements.filter(r => r.stageId === allStages.find(s => s.key === 'CONSULATE_VISA')?.id);
    const residenceReqs = allRequirements.filter(r => r.stageId === allStages.find(s => s.key === 'IGI_RESIDENCE')?.id);

    const sampleAssignments = [
      // John Smith - Various stages
      {
        requirementId: ajofmReqs[0]?.id, // University Diploma
        clientProfileId: clientId1,
        workerId: workerId1,
        assignedToRole: 'WORKER' as const,
        status: 'ACCEPTED' as const,
        institution: 'ANOFM',
        submissionChannel: 'digital',
        receiptNumber: 'ANOFM-2024-001',
        approvedAt: new Date('2024-01-15'),
      },
      {
        requirementId: workPermitReqs[0]?.id, // Work Contract
        clientProfileId: clientId1,
        workerId: workerId1,
        assignedToRole: 'OWNER' as const,
        status: 'SUBMITTED_TO_INSTITUTION_DIGITAL' as const,
        institution: 'IGI',
        submissionChannel: 'digital',
        receiptNumber: 'IGI-WP-2024-001',
        submittedAt: new Date(),
      },
      {
        requirementId: workPermitReqs[1]?.id, // Medical Certificate
        clientProfileId: clientId1,
        workerId: workerId1,
        assignedToRole: 'WORKER' as const,
        status: 'AWAITING_UPLOAD' as const,
      },

      // Maria Rodriguez - Different statuses
      {
        requirementId: ajofmReqs[1]?.id, // Criminal Background Check
        clientProfileId: clientId1,
        workerId: workerId2,
        assignedToRole: 'WORKER' as const,
        status: 'SUBMITTED_BY_USER' as const,
        submittedAt: new Date(),
      },
      {
        requirementId: ajofmReqs[2]?.id, // Job Description
        clientProfileId: clientId1,
        workerId: workerId2,
        assignedToRole: 'OWNER' as const,
        status: 'RECEIVED_BY_ADMIN' as const,
      },

      // Ahmed Hassan - Visa stage
      {
        requirementId: visaReqs[0]?.id, // Visa Application Form
        clientProfileId: clientId2,
        workerId: workerId3,
        assignedToRole: 'WORKER' as const,
        status: 'SUBMITTED_TO_INSTITUTION_COURIER' as const,
        institution: 'Romanian Consulate',
        submissionChannel: 'courier',
        courierAwb: 'DHL123456789',
        courierName: 'DHL',
        submittedAt: new Date(),
      },
      {
        requirementId: visaReqs[1]?.id, // Passport Photos
        clientProfileId: clientId2,
        workerId: workerId3,
        assignedToRole: 'WORKER' as const,
        status: 'AWAITING_UPLOAD' as const,
      },

      // Priya Sharma - Mixed stages
      {
        requirementId: workPermitReqs[2]?.id, // Power of Attorney
        clientProfileId: clientId2,
        workerId: workerId4,
        assignedToRole: 'OWNER' as const,
        status: 'REJECTED' as const,
        rejectedReason: 'Document not properly notarized',
      },
      {
        requirementId: visaReqs[2]?.id, // Health Insurance
        clientProfileId: clientId2,
        workerId: workerId4,
        assignedToRole: 'WORKER' as const,
        status: 'AWAITING_UPLOAD' as const,
      },

      // Liu Wei - Residence stage
      {
        requirementId: residenceReqs[0]?.id, // Residence Application
        clientProfileId: clientId3,
        workerId: workerId5,
        assignedToRole: 'WORKER' as const,
        status: 'SUBMITTED_BY_USER' as const,
        submittedAt: new Date(),
      },
      {
        requirementId: residenceReqs[1]?.id, // Proof of Accommodation
        clientProfileId: clientId3,
        workerId: workerId5,
        assignedToRole: 'WORKER' as const,
        status: 'RECEIVED_BY_ADMIN' as const,
      },
      {
        requirementId: residenceReqs[2]?.id, // Income Certificate
        clientProfileId: clientId3,
        workerId: workerId5,
        assignedToRole: 'OWNER' as const,
        status: 'AWAITING_UPLOAD' as const,
      },
    ];

    let createdAssignments = 0;
    for (const assignment of sampleAssignments) {
      if (assignment.requirementId) {
        try {
          await db.insert(assignments).values(assignment).onConflictDoNothing();
          createdAssignments++;
        } catch (error) {
          console.log(`Warning: Could not create assignment for requirement ${assignment.requirementId}:`, error);
        }
      }
    }

    console.log('Sample data created successfully:');
    console.log(`- ${sampleOwners.length} client owners`);
    console.log(`- ${sampleClients.length} client profiles`);
    console.log(`- ${sampleWorkers.length} workers`);
    console.log(`- ${createdAssignments} assignments`);
    
  } catch (error) {
    console.error('Failed to create sample data:', error);
    throw error;
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createSampleData()
    .then(() => {
      console.log('Sample data creation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Sample data creation failed:', error);
      process.exit(1);
    });
}

export { createSampleData };