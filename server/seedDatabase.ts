import { db } from "./db";
import { 
  users, clientProfiles, workers, stages, requirements, assignments, 
  translations, documentTemplates, templateFields 
} from "@shared/schema";
import { nanoid } from 'nanoid';
import { sql } from 'drizzle-orm';

export async function seedDatabase() {
  console.log('🌱 Starting database seeding with test data...');
  
  try {
    // Clear existing test data only - clear in correct order due to foreign keys
    console.log('🗑️  Clearing existing test data...');
    await db.delete(assignments);
    await db.delete(requirements);
    await db.delete(stages);
    await db.delete(workers);
    await db.delete(clientProfiles);
    // Only clear test users, keep real ones
    await db.delete(users).where(sql`${users.firstName} LIKE 'Test %'`);
    
    console.log('✅ Cleared existing test data');

    // Create test admins
    const testAdmins = [
      {
        id: nanoid(),
        email: 'test.admin1@replit.dev',
        firstName: 'Test Admin',
        lastName: 'One',
        role: 'ADMIN' as const,
        profileImageUrl: null,
        invitedById: null,
      },
      {
        id: nanoid(),
        email: 'test.admin2@replit.dev', 
        firstName: 'Test Admin',
        lastName: 'Two',
        role: 'ADMIN' as const,
        profileImageUrl: null,
        invitedById: null,
      }
    ];

    const insertedAdmins = await db.insert(users).values(testAdmins).returning();
    console.log(`✅ Created ${insertedAdmins.length} test admin users`);

    // Create test client profiles for each admin
    const testClients = [];
    for (let i = 0; i < insertedAdmins.length; i++) {
      const admin = insertedAdmins[i];
      const clientsForAdmin = [
        {
          companyName: `Test Construction Company ${i + 1}`,
          cui: `RO${20000000 + i * 1000 + 1}`,
          address: `Test Address ${i + 1}, Sector ${i + 1}, București, România`,
          caen: '4120',
          contactEmail: `test.company${i + 1}@replit.dev`,
          onrc: `J40/${1000 + i}/2024`,
          ownerUserId: admin.id,
        },
        {
          companyName: `Test IT Solutions ${i + 1}`,
          cui: `RO${20000000 + i * 1000 + 2}`,
          address: `Test IT Address ${i + 1}, Cluj-Napoca, România`,
          caen: '6201',
          contactEmail: `test.it${i + 1}@replit.dev`,
          onrc: `J12/${1000 + i}/2024`,
          ownerUserId: admin.id,
        }
      ];
      testClients.push(...clientsForAdmin);
    }

    const insertedClients = await db.insert(clientProfiles).values(testClients).returning();
    console.log(`✅ Created ${insertedClients.length} test client profiles`);

    // Create test workers for each client
    const testWorkers = [];
    for (const client of insertedClients) {
      const workersForClient = [
        {
          clientProfileId: client.id,
          firstName: 'Test Worker',
          lastName: 'Alpha',
          dob: new Date('1990-01-15'),
          nationality: 'Indian',
          passportNumber: `T12345${Math.floor(Math.random() * 1000)}`,
          passportExpiry: new Date('2028-12-31'),
          email: `test.worker.alpha.${client.cui}@replit.dev`,
          phone: `+40700${Math.floor(Math.random() * 900000) + 100000}`,
        },
        {
          clientProfileId: client.id,
          firstName: 'Test Worker',
          lastName: 'Beta',
          dob: new Date('1992-05-22'),
          nationality: 'Filipino',
          passportNumber: `T54321${Math.floor(Math.random() * 1000)}`,
          passportExpiry: new Date('2029-06-15'),
          email: `test.worker.beta.${client.cui}@replit.dev`,
          phone: `+40701${Math.floor(Math.random() * 900000) + 100000}`,
        },
        {
          clientProfileId: client.id,
          firstName: 'Test Worker',
          lastName: 'Gamma',
          dob: new Date('1988-11-08'),
          nationality: 'Ukrainian',
          passportNumber: `T67890${Math.floor(Math.random() * 1000)}`,
          passportExpiry: new Date('2027-10-20'),
          email: `test.worker.gamma.${client.cui}@replit.dev`,
          phone: `+40702${Math.floor(Math.random() * 900000) + 100000}`,
        }
      ];
      testWorkers.push(...workersForClient);
    }

    const insertedWorkers = await db.insert(workers).values(testWorkers).returning();
    console.log(`✅ Created ${insertedWorkers.length} test workers`);

    // Create stages if they don't exist
    const stagesData = [
      {
        key: 'AJOFM' as const,
        title: 'AJOFM Labor Market Test',
        description: 'Romanian National Employment Agency labor market test approval',
        order: 1,
      },
      {
        key: 'IGI_WORK_PERMIT' as const,
        title: 'IGI Work Permit',
        description: 'Romanian Immigration Office work permit application',
        order: 2,
      },
      {
        key: 'CONSULATE_VISA' as const,
        title: 'Consulate Visa',
        description: 'Romanian consulate visa application',
        order: 3,
      },
      {
        key: 'IGI_RESIDENCE' as const,
        title: 'IGI Residence Permit',
        description: 'Romanian Immigration Office residence permit application',
        order: 4,
      }
    ];

    const insertedStages = await db.insert(stages).values(stagesData).returning();
    console.log(`✅ Created ${insertedStages.length} workflow stages`);

    // Create requirements for each stage
    const requirementsData = [];
    for (const stage of insertedStages) {
      const admin = insertedAdmins[0]; // Use first admin as creator
      
      if (stage.key === 'AJOFM') {
        requirementsData.push(
          {
            stageId: stage.id,
            type: 'STANDARD' as const,
            title: 'Test AJOFM Application Form',
            description: 'Complete and submit AJOFM application form with company details',
            required: true,
            autoPopulate: true,
            templateKey: 'ajofm_form',
            createdByUserId: admin.id,
          },
          {
            stageId: stage.id,
            type: 'STANDARD' as const,
            title: 'Test Job Advertisement',
            description: 'Publish job advertisement in official channels',
            required: true,
            autoPopulate: false,
            createdByUserId: admin.id,
          }
        );
      } else if (stage.key === 'IGI_WORK_PERMIT') {
        requirementsData.push(
          {
            stageId: stage.id,
            type: 'STANDARD' as const,
            title: 'Test Work Permit Application',
            description: 'Submit work permit application to IGI with worker documents',
            required: true,
            autoPopulate: true,
            templateKey: 'work_permit_form',
            createdByUserId: admin.id,
          }
        );
      } else if (stage.key === 'CONSULATE_VISA') {
        requirementsData.push(
          {
            stageId: stage.id,
            type: 'STANDARD' as const,
            title: 'Test Visa Application',
            description: 'Schedule and attend visa appointment at Romanian consulate',
            required: true,
            autoPopulate: false,
            createdByUserId: admin.id,
          }
        );
      } else if (stage.key === 'IGI_RESIDENCE') {
        requirementsData.push(
          {
            stageId: stage.id,
            type: 'STANDARD' as const,
            title: 'Test Residence Permit Application',
            description: 'Apply for residence permit within 30 days of arrival',
            required: true,
            autoPopulate: true,
            templateKey: 'residence_form',
            createdByUserId: admin.id,
          }
        );
      }
    }

    const insertedRequirements = await db.insert(requirements).values(requirementsData).returning();
    console.log(`✅ Created ${insertedRequirements.length} test requirements`);

    // Create assignments for workers
    const assignmentsData = [];
    const statuses = ['NOT_STARTED', 'AWAITING_UPLOAD', 'SUBMITTED_BY_USER', 'RECEIVED_BY_ADMIN', 'ACCEPTED'] as const;
    
    for (const worker of insertedWorkers) {
      for (const requirement of insertedRequirements) {
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        assignmentsData.push({
          requirementId: requirement.id,
          clientProfileId: worker.clientProfileId,
          workerId: worker.id,
          assignedToRole: 'WORKER' as const,
          status: randomStatus,
          institution: requirement.title.includes('AJOFM') ? 'AJOFM București' : 
                     requirement.title.includes('IGI') ? 'IGI București' : 
                     requirement.title.includes('Consulate') ? 'Romanian Consulate' : 'Immigration Office',
        });
      }
    }

    const insertedAssignments = await db.insert(assignments).values(assignmentsData).returning();
    console.log(`✅ Created ${insertedAssignments.length} test assignments`);

    // Add Romanian translations
    const romanianTranslations = [
      { key: 'common.welcome', language: 'ro' as const, value: 'Bun venit' },
      { key: 'common.dashboard', language: 'ro' as const, value: 'Panou de control' },
      { key: 'common.clients', language: 'ro' as const, value: 'Clienți' },
      { key: 'common.workers', language: 'ro' as const, value: 'Lucrători' },
      { key: 'common.templates', language: 'ro' as const, value: 'Șabloane' },
      { key: 'common.analytics', language: 'ro' as const, value: 'Analize' },
      { key: 'common.profile', language: 'ro' as const, value: 'Profil' },
      { key: 'common.documents', language: 'ro' as const, value: 'Documente' },
      { key: 'common.deadlines', language: 'ro' as const, value: 'Termene' },
      { key: 'common.logout', language: 'ro' as const, value: 'Ieșire' },
      { key: 'landing.title', language: 'ro' as const, value: 'ImmigrationFlow - Gestionarea Proceselor de Imigrație Românești' },
      { key: 'landing.subtitle', language: 'ro' as const, value: 'Platforma completă SaaS pentru gestionarea fluxurilor de lucru de imigrație românești' },
      { key: 'landing.login', language: 'ro' as const, value: 'Autentificare' },
      
      // English translations
      { key: 'common.welcome', language: 'en' as const, value: 'Welcome' },
      { key: 'common.dashboard', language: 'en' as const, value: 'Dashboard' },
      { key: 'common.clients', language: 'en' as const, value: 'Clients' },
      { key: 'common.workers', language: 'en' as const, value: 'Workers' },
      { key: 'common.templates', language: 'en' as const, value: 'Templates' },
      { key: 'common.analytics', language: 'en' as const, value: 'Analytics' },
      { key: 'common.profile', language: 'en' as const, value: 'Profile' },
      { key: 'common.documents', language: 'en' as const, value: 'Documents' },
      { key: 'common.deadlines', language: 'en' as const, value: 'Deadlines' },
      { key: 'common.logout', language: 'en' as const, value: 'Logout' },
      { key: 'landing.title', language: 'en' as const, value: 'ImmigrationFlow - Romanian Immigration Management' },
      { key: 'landing.subtitle', language: 'en' as const, value: 'Complete SaaS platform for managing Romanian immigration workflows' },
      { key: 'landing.login', language: 'en' as const, value: 'Login' },
    ];

    await db.insert(translations).values(romanianTranslations);
    console.log(`✅ Added ${romanianTranslations.length} translations`);

    // Create test document templates
    const templatesData = [
      {
        name: 'Test AJOFM Application Form',
        description: 'Test template for AJOFM labor market test application',
        type: 'FORM' as const,
        language: 'ro' as const,
        isActive: true,
        templateData: {
          title: 'Test AJOFM Application',
          sections: [
            { title: 'Company Information', fields: ['companyName', 'cui', 'address'] },
            { title: 'Job Details', fields: ['jobTitle', 'jobDescription', 'salary'] },
            { title: 'Worker Information', fields: ['workerName', 'nationality', 'education'] }
          ]
        },
        createdByUserId: insertedAdmins[0].id,
      },
      {
        name: 'Test Work Permit Application',
        description: 'Test template for IGI work permit application',
        type: 'FORM' as const,
        language: 'ro' as const,
        isActive: true,
        templateData: {
          title: 'Test Work Permit Application',
          sections: [
            { title: 'Personal Information', fields: ['firstName', 'lastName', 'dob', 'nationality'] },
            { title: 'Passport Details', fields: ['passportNumber', 'passportExpiry'] },
            { title: 'Employment Details', fields: ['employer', 'position', 'startDate'] }
          ]
        },
        createdByUserId: insertedAdmins[0].id,
      }
    ];

    const insertedTemplates = await db.insert(documentTemplates).values(templatesData).returning();
    console.log(`✅ Created ${insertedTemplates.length} test document templates`);

    console.log('🎉 Database seeding completed successfully!');
    return {
      admins: insertedAdmins.length,
      clients: insertedClients.length,
      workers: insertedWorkers.length,
      stages: insertedStages.length,
      requirements: insertedRequirements.length,
      assignments: insertedAssignments.length,
      templates: insertedTemplates.length,
    };
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}