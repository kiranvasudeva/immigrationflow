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

    // Add comprehensive translations
    const allTranslations = [
      // Romanian translations - Common
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
      { key: 'common.generating', language: 'ro' as const, value: 'Generare...' },
      { key: 'common.loading', language: 'ro' as const, value: 'Se încarcă...' },
      { key: 'common.save', language: 'ro' as const, value: 'Salvează' },
      { key: 'common.cancel', language: 'ro' as const, value: 'Anulează' },
      { key: 'common.add', language: 'ro' as const, value: 'Adaugă' },
      { key: 'common.edit', language: 'ro' as const, value: 'Editează' },
      { key: 'common.delete', language: 'ro' as const, value: 'Șterge' },
      { key: 'common.view', language: 'ro' as const, value: 'Vizualizează' },
      { key: 'common.search', language: 'ro' as const, value: 'Caută' },
      { key: 'common.filter', language: 'ro' as const, value: 'Filtrează' },
      { key: 'common.export', language: 'ro' as const, value: 'Exportă' },
      { key: 'common.import', language: 'ro' as const, value: 'Importă' },
      { key: 'common.settings', language: 'ro' as const, value: 'Setări' },
      { key: 'common.help', language: 'ro' as const, value: 'Ajutor' },
      { key: 'common.close', language: 'ro' as const, value: 'Închide' },
      { key: 'common.submit', language: 'ro' as const, value: 'Trimite' },
      
      // Dashboard translations - Romanian
      { key: 'dashboard.admin.title', language: 'ro' as const, value: 'Panou de Control Admin' },
      { key: 'dashboard.admin.subtitle', language: 'ro' as const, value: 'Gestionează clienții, lucrătorii și fluxurile de imigrație' },
      { key: 'dashboard.client.title', language: 'ro' as const, value: 'Panou de Control Client' },
      { key: 'dashboard.client.subtitle', language: 'ro' as const, value: 'Gestionează lucrătorii și fluxurile de imigrație' },
      { key: 'dashboard.worker.title', language: 'ro' as const, value: 'Panou de Control Lucrător' },
      { key: 'dashboard.worker.subtitle', language: 'ro' as const, value: 'Urmărește progresul și încarcă documentele' },
      { key: 'dashboard.stats.totalClients', language: 'ro' as const, value: 'Total Clienți' },
      { key: 'dashboard.stats.totalWorkers', language: 'ro' as const, value: 'Total Lucrători' },
      { key: 'dashboard.stats.activeWorkers', language: 'ro' as const, value: 'Lucrători Activi' },
      { key: 'dashboard.stats.pendingActions', language: 'ro' as const, value: 'Acțiuni în Așteptare' },
      { key: 'dashboard.stats.completedMonth', language: 'ro' as const, value: 'Finalizate Luna Aceasta' },
      
      // Actions and buttons - Romanian
      { key: 'action.addWorker', language: 'ro' as const, value: 'Adaugă Lucrător' },
      { key: 'action.addClient', language: 'ro' as const, value: 'Adaugă Client' },
      { key: 'action.viewProfile', language: 'ro' as const, value: 'Vezi Profilul' },
      { key: 'action.editProfile', language: 'ro' as const, value: 'Editează Profilul' },
      { key: 'action.uploadDocument', language: 'ro' as const, value: 'Încarcă Document' },
      { key: 'action.downloadDocument', language: 'ro' as const, value: 'Descarcă Document' },
      { key: 'action.manageWorkers', language: 'ro' as const, value: 'Gestionează Lucrătorii' },
      
      // Status and labels - Romanian
      { key: 'status.active', language: 'ro' as const, value: 'Activ' },
      { key: 'status.inactive', language: 'ro' as const, value: 'Inactiv' },
      { key: 'status.pending', language: 'ro' as const, value: 'În așteptare' },
      { key: 'status.completed', language: 'ro' as const, value: 'Finalizat' },
      { key: 'status.inProgress', language: 'ro' as const, value: 'În progres' },
      { key: 'status.urgent', language: 'ro' as const, value: 'Urgent' },
      { key: 'status.overdue', language: 'ro' as const, value: 'Întârziat' },
      
      // Worker dashboard specific - Romanian
      { key: 'worker.urgentActions', language: 'ro' as const, value: 'Acțiuni Urgente' },
      { key: 'worker.nextSteps', language: 'ro' as const, value: 'Următorii Pași' },
      { key: 'worker.myProgress', language: 'ro' as const, value: 'Progresul Meu' },
      { key: 'worker.myDocuments', language: 'ro' as const, value: 'Documentele Mele' },
      { key: 'worker.recentActivity', language: 'ro' as const, value: 'Activitate Recentă' },
      
      // Unauthorized messages - Romanian
      { key: 'auth.unauthorized', language: 'ro' as const, value: 'Neautorizat' },
      { key: 'auth.loggedOut', language: 'ro' as const, value: 'Ești deconectat. Se reconectează...' },
      
      // Navigation in Romanian
      { key: 'nav.features', language: 'ro' as const, value: 'Caracteristici' },
      { key: 'nav.pricing', language: 'ro' as const, value: 'Prețuri' },
      { key: 'nav.support', language: 'ro' as const, value: 'Suport' },
      
      // Landing page in Romanian
      { key: 'landing.title', language: 'ro' as const, value: 'Optimizează procesele de' },
      { key: 'landing.subtitle', language: 'ro' as const, value: 'Imigrație Românească' },
      { key: 'landing.description', language: 'ro' as const, value: 'Platformă SaaS completă pentru gestionarea autorizațiilor de muncă, vizelor și permiselor de ședere. De la testele AJOFM la aprobările finale IGI.' },
      { key: 'landing.login', language: 'ro' as const, value: 'Autentificare' },
      
      // Worker invitation in Romanian
      { key: 'worker.invite', language: 'ro' as const, value: 'Invită Lucrătorul' },
      { key: 'worker.inviteTitle', language: 'ro' as const, value: 'Invită Lucrătorul să acceseze Profilul' },
      { key: 'worker.generateInvite', language: 'ro' as const, value: 'Generează Link de Invitație' },
      { key: 'worker.invitationLink', language: 'ro' as const, value: 'Link de Invitație' },
      { key: 'worker.linkDescription', language: 'ro' as const, value: 'Trimite acest link lucrătorului pentru a-i da acces la profilul său și zona de încărcare documente.' },
      { key: 'form.email', language: 'ro' as const, value: 'Email' },
      
      // English translations - Common
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
      { key: 'common.generating', language: 'en' as const, value: 'Generating...' },
      { key: 'common.loading', language: 'en' as const, value: 'Loading...' },
      { key: 'common.save', language: 'en' as const, value: 'Save' },
      { key: 'common.cancel', language: 'en' as const, value: 'Cancel' },
      { key: 'common.add', language: 'en' as const, value: 'Add' },
      { key: 'common.edit', language: 'en' as const, value: 'Edit' },
      { key: 'common.delete', language: 'en' as const, value: 'Delete' },
      { key: 'common.view', language: 'en' as const, value: 'View' },
      { key: 'common.search', language: 'en' as const, value: 'Search' },
      { key: 'common.filter', language: 'en' as const, value: 'Filter' },
      { key: 'common.export', language: 'en' as const, value: 'Export' },
      { key: 'common.import', language: 'en' as const, value: 'Import' },
      { key: 'common.settings', language: 'en' as const, value: 'Settings' },
      { key: 'common.help', language: 'en' as const, value: 'Help' },
      { key: 'common.close', language: 'en' as const, value: 'Close' },
      { key: 'common.submit', language: 'en' as const, value: 'Submit' },
      
      // Dashboard translations - English
      { key: 'dashboard.admin.title', language: 'en' as const, value: 'Admin Dashboard' },
      { key: 'dashboard.admin.subtitle', language: 'en' as const, value: 'Manage clients, workers and immigration workflows' },
      { key: 'dashboard.client.title', language: 'en' as const, value: 'Client Dashboard' },
      { key: 'dashboard.client.subtitle', language: 'en' as const, value: 'Manage your workers and immigration workflows' },
      { key: 'dashboard.worker.title', language: 'en' as const, value: 'Worker Dashboard' },
      { key: 'dashboard.worker.subtitle', language: 'en' as const, value: 'Track your progress and upload documents' },
      { key: 'dashboard.stats.totalClients', language: 'en' as const, value: 'Total Clients' },
      { key: 'dashboard.stats.totalWorkers', language: 'en' as const, value: 'Total Workers' },
      { key: 'dashboard.stats.activeWorkers', language: 'en' as const, value: 'Active Workers' },
      { key: 'dashboard.stats.pendingActions', language: 'en' as const, value: 'Pending Actions' },
      { key: 'dashboard.stats.completedMonth', language: 'en' as const, value: 'Completed This Month' },
      
      // Actions and buttons - English
      { key: 'action.addWorker', language: 'en' as const, value: 'Add Worker' },
      { key: 'action.addClient', language: 'en' as const, value: 'Add Client' },
      { key: 'action.viewProfile', language: 'en' as const, value: 'View Profile' },
      { key: 'action.editProfile', language: 'en' as const, value: 'Edit Profile' },
      { key: 'action.uploadDocument', language: 'en' as const, value: 'Upload Document' },
      { key: 'action.downloadDocument', language: 'en' as const, value: 'Download Document' },
      { key: 'action.manageWorkers', language: 'en' as const, value: 'Manage Workers' },
      
      // Status and labels - English
      { key: 'status.active', language: 'en' as const, value: 'Active' },
      { key: 'status.inactive', language: 'en' as const, value: 'Inactive' },
      { key: 'status.pending', language: 'en' as const, value: 'Pending' },
      { key: 'status.completed', language: 'en' as const, value: 'Completed' },
      { key: 'status.inProgress', language: 'en' as const, value: 'In Progress' },
      { key: 'status.urgent', language: 'en' as const, value: 'Urgent' },
      { key: 'status.overdue', language: 'en' as const, value: 'Overdue' },
      
      // Worker dashboard specific - English
      { key: 'worker.urgentActions', language: 'en' as const, value: 'Urgent Actions' },
      { key: 'worker.nextSteps', language: 'en' as const, value: 'Next Steps' },
      { key: 'worker.myProgress', language: 'en' as const, value: 'My Progress' },
      { key: 'worker.myDocuments', language: 'en' as const, value: 'My Documents' },
      { key: 'worker.recentActivity', language: 'en' as const, value: 'Recent Activity' },
      
      // Unauthorized messages - English
      { key: 'auth.unauthorized', language: 'en' as const, value: 'Unauthorized' },
      { key: 'auth.loggedOut', language: 'en' as const, value: 'You are logged out. Logging in again...' },
      
      // Navigation in English
      { key: 'nav.features', language: 'en' as const, value: 'Features' },
      { key: 'nav.pricing', language: 'en' as const, value: 'Pricing' },
      { key: 'nav.support', language: 'en' as const, value: 'Support' },
      
      // Landing page in English
      { key: 'landing.title', language: 'en' as const, value: 'Streamline Romanian' },
      { key: 'landing.subtitle', language: 'en' as const, value: 'Immigration Workflows' },
      { key: 'landing.description', language: 'en' as const, value: 'Complete SaaS platform for managing work permits, visa applications, and residence permits. From AJOFM labor market tests to final IGI approvals.' },
      { key: 'landing.login', language: 'en' as const, value: 'Login' },
      
      // Worker invitation in English
      { key: 'worker.invite', language: 'en' as const, value: 'Invite Worker' },
      { key: 'worker.inviteTitle', language: 'en' as const, value: 'Invite Worker to Access Profile' },
      { key: 'worker.generateInvite', language: 'en' as const, value: 'Generate Invitation Link' },
      { key: 'worker.invitationLink', language: 'en' as const, value: 'Invitation Link' },
      { key: 'worker.linkDescription', language: 'en' as const, value: 'Share this link with the worker to give them access to their profile and document upload area.' },
      { key: 'form.email', language: 'en' as const, value: 'Email' },
    ];

    await db.insert(translations).values(allTranslations);
    console.log(`✅ Added ${allTranslations.length} translations`);

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