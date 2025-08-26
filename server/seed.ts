import { db } from './db';
import { stages, requirements, users, clientProfiles, workers, assignments } from '@shared/schema';
import { eq } from 'drizzle-orm';

async function seedDatabase() {
  try {
    console.log('Starting database seed...');

    // Create default admin user
    const [adminUser] = await db
      .insert(users)
      .values({
        id: 'admin-user-1',
        email: 'admin@immigrationflow.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
      })
      .onConflictDoNothing()
      .returning();

    console.log('Admin user created/verified');

    // Seed Romanian immigration stages
    const stageData = [
      {
        key: 'AJOFM' as const,
        title: 'Labor Market Test (AJOFM/ANOFM)',
        description: 'Application to Romanian National Employment Agency to test local labor market availability',
        order: 1,
      },
      {
        key: 'IGI_WORK_PERMIT' as const,
        title: 'Work Permit Application (IGI)',
        description: 'Work permit application at Romanian Immigration Office',
        order: 2,
      },
      {
        key: 'CONSULATE_VISA' as const,
        title: 'Long-Stay Visa D/AM (Consulate)',
        description: 'Long-stay visa application at Romanian consulate in country of origin',
        order: 3,
      },
      {
        key: 'IGI_RESIDENCE' as const,
        title: 'Residence Permit (IGI)',
        description: 'Residence permit application at Romanian Immigration Office',
        order: 4,
      },
    ];

    for (const stage of stageData) {
      await db
        .insert(stages)
        .values(stage)
        .onConflictDoUpdate({
          target: stages.key,
          set: {
            title: stage.title,
            description: stage.description,
            order: stage.order,
          },
        });
    }

    console.log('Stages seeded successfully');

    // Get created stages for requirements
    const createdStages = await db.select().from(stages);
    const stageMap = createdStages.reduce((acc, stage) => {
      acc[stage.key] = stage.id;
      return acc;
    }, {} as Record<string, string>);

    // Seed standard requirements for each stage
    const requirementData = [
      // AJOFM Requirements
      {
        stageId: stageMap['AJOFM'],
        type: 'STANDARD' as const,
        title: 'University Diploma (Apostilled)',
        description: 'University degree with apostille or similar international certification',
        required: true,
        autoPopulate: false,
        templateKey: null,
        dueRule: { type: 'stage_start', days: -30 },
        createdByUserId: adminUser?.id || 'admin-user-1',
      },
      {
        stageId: stageMap['AJOFM'],
        type: 'STANDARD' as const,
        title: 'Criminal Background Check',
        description: 'Criminal background check from country of origin with apostille',
        required: true,
        autoPopulate: false,
        templateKey: null,
        dueRule: { type: 'stage_start', days: -30 },
        createdByUserId: adminUser?.id || 'admin-user-1',
      },
      {
        stageId: stageMap['AJOFM'],
        type: 'STANDARD' as const,
        title: 'Job Description',
        description: 'Detailed job description from employer',
        required: true,
        autoPopulate: true,
        templateKey: 'job_description_template',
        dueRule: { type: 'stage_start', days: -15 },
        createdByUserId: adminUser?.id || 'admin-user-1',
      },

      // Work Permit Requirements
      {
        stageId: stageMap['IGI_WORK_PERMIT'],
        type: 'STANDARD' as const,
        title: 'Work Contract',
        description: 'Employment contract signed by employer and employee',
        required: true,
        autoPopulate: true,
        templateKey: 'work_contract_template',
        dueRule: { type: 'stage_start', days: -7 },
        createdByUserId: adminUser?.id || 'admin-user-1',
      },
      {
        stageId: stageMap['IGI_WORK_PERMIT'],
        type: 'STANDARD' as const,
        title: 'Medical Certificate',
        description: 'Medical examination from approved Romanian doctor',
        required: true,
        autoPopulate: false,
        templateKey: null,
        dueRule: { type: 'stage_start', days: -14 },
        createdByUserId: adminUser?.id || 'admin-user-1',
      },
      {
        stageId: stageMap['IGI_WORK_PERMIT'],
        type: 'STANDARD' as const,
        title: 'Power of Attorney',
        description: 'Power of attorney for legal representative',
        required: false,
        autoPopulate: true,
        templateKey: 'power_of_attorney_template',
        dueRule: { type: 'stage_start', days: -7 },
        createdByUserId: adminUser?.id || 'admin-user-1',
      },

      // Visa Requirements
      {
        stageId: stageMap['CONSULATE_VISA'],
        type: 'STANDARD' as const,
        title: 'Visa Application Form',
        description: 'Completed visa application form',
        required: true,
        autoPopulate: true,
        templateKey: 'visa_application_form',
        dueRule: { type: 'stage_start', days: -10 },
        createdByUserId: adminUser?.id || 'admin-user-1',
      },
      {
        stageId: stageMap['CONSULATE_VISA'],
        type: 'STANDARD' as const,
        title: 'Passport Photos',
        description: '4 passport-sized photos, recent, white background',
        required: true,
        autoPopulate: false,
        templateKey: null,
        dueRule: { type: 'stage_start', days: -7 },
        createdByUserId: adminUser?.id || 'admin-user-1',
      },
      {
        stageId: stageMap['CONSULATE_VISA'],
        type: 'STANDARD' as const,
        title: 'Health Insurance',
        description: 'Health insurance policy valid in Romania',
        required: true,
        autoPopulate: false,
        templateKey: null,
        dueRule: { type: 'stage_start', days: -14 },
        createdByUserId: adminUser?.id || 'admin-user-1',
      },

      // Residence Permit Requirements
      {
        stageId: stageMap['IGI_RESIDENCE'],
        type: 'STANDARD' as const,
        title: 'Residence Application',
        description: 'Application for residence permit',
        required: true,
        autoPopulate: true,
        templateKey: 'residence_application_template',
        dueRule: { type: 'stage_start', days: -30 },
        createdByUserId: adminUser?.id || 'admin-user-1',
      },
      {
        stageId: stageMap['IGI_RESIDENCE'],
        type: 'STANDARD' as const,
        title: 'Proof of Accommodation',
        description: 'Rental agreement or property ownership documents',
        required: true,
        autoPopulate: false,
        templateKey: null,
        dueRule: { type: 'stage_start', days: -15 },
        createdByUserId: adminUser?.id || 'admin-user-1',
      },
      {
        stageId: stageMap['IGI_RESIDENCE'],
        type: 'STANDARD' as const,
        title: 'Income Certificate',
        description: 'Proof of sufficient income for residence permit',
        required: true,
        autoPopulate: false,
        templateKey: null,
        dueRule: { type: 'stage_start', days: -15 },
        createdByUserId: adminUser?.id || 'admin-user-1',
      },
    ];

    for (const requirement of requirementData) {
      if (requirement.stageId) {
        await db
          .insert(requirements)
          .values(requirement)
          .onConflictDoNothing();
      }
    }

    console.log('Requirements seeded successfully');

    // Seed dummy client profiles with comprehensive data
    const clientData = [
      {
        companyName: 'TechFlow Solutions SRL',
        cui: 'RO12345678',
        address: 'Strada Ion Campineanu Nr. 15, Sector 1, București 010031, România',
        caen: '6201',
        contactEmail: 'contact@techflow.ro',
        onrc: 'J40/15234/2018',
        ownerUserId: adminUser?.id || 'admin-user-1',
      },
      {
        companyName: 'GlobalTech Industries SA',
        cui: 'RO23456789',
        address: 'Calea Victoriei Nr. 120, Sector 1, București 010096, România',
        caen: '7022',
        contactEmail: 'hr@globaltech.com',
        onrc: 'J40/8765/2020',
        ownerUserId: adminUser?.id || 'admin-user-1',
      },
      {
        companyName: 'Innovation Labs Romania SRL',
        cui: 'RO34567890',
        address: 'Bulevardul Carol I Nr. 34-36, Sector 2, București 020922, România',
        caen: '6209',
        contactEmail: 'office@innovationlabs.ro',
        onrc: 'J40/12987/2019',
        ownerUserId: adminUser?.id || 'admin-user-1',
      },
      {
        companyName: 'Digital Marketing Pro SRL',
        cui: 'RO45678901',
        address: 'Strada Magheru Nr. 28-30, Sector 1, București 010336, România',
        caen: '7311',
        contactEmail: 'contact@digitalmarketing.ro',
        onrc: 'J40/9876/2021',
        ownerUserId: adminUser?.id || 'admin-user-1',
      },
    ];

    const createdClients = [];
    for (const client of clientData) {
      const [createdClient] = await db
        .insert(clientProfiles)
        .values(client)
        .onConflictDoNothing()
        .returning();
      if (createdClient) {
        createdClients.push(createdClient);
      }
    }

    console.log('Client profiles seeded successfully');

    // Seed dummy workers with comprehensive data for each client
    const workerData = [
      // Workers for TechFlow Solutions
      {
        clientProfileId: createdClients[0]?.id,
        firstName: 'Alessandro',
        lastName: 'Rodriguez',
        dob: new Date('1985-03-15'),
        nationality: 'Spanish',
        passportNumber: 'ES123456789',
        passportExpiry: new Date('2028-03-15'),
        email: 'alessandro.rodriguez@gmail.com',
        phone: '+40721123456',
      },
      {
        clientProfileId: createdClients[0]?.id,
        firstName: 'Maria',
        lastName: 'Gonzalez',
        dob: new Date('1992-07-22'),
        nationality: 'Spanish',
        passportNumber: 'ES987654321',
        passportExpiry: new Date('2027-07-22'),
        email: 'maria.gonzalez@gmail.com',
        phone: '+40722234567',
      },
      {
        clientProfileId: createdClients[0]?.id,
        firstName: 'Kumar',
        lastName: 'Patel',
        dob: new Date('1988-11-08'),
        nationality: 'Indian',
        passportNumber: 'IN456789123',
        passportExpiry: new Date('2029-11-08'),
        email: 'kumar.patel@gmail.com',
        phone: '+40723345678',
      },
      
      // Workers for GlobalTech Industries
      {
        clientProfileId: createdClients[1]?.id,
        firstName: 'Pierre',
        lastName: 'Dubois',
        dob: new Date('1990-05-12'),
        nationality: 'French',
        passportNumber: 'FR789123456',
        passportExpiry: new Date('2028-05-12'),
        email: 'pierre.dubois@gmail.com',
        phone: '+40724456789',
      },
      {
        clientProfileId: createdClients[1]?.id,
        firstName: 'Sofia',
        lastName: 'Ivanova',
        dob: new Date('1987-09-30'),
        nationality: 'Bulgarian',
        passportNumber: 'BG123789456',
        passportExpiry: new Date('2026-09-30'),
        email: 'sofia.ivanova@gmail.com',
        phone: '+40725567890',
      },
      {
        clientProfileId: createdClients[1]?.id,
        firstName: 'Ahmed',
        lastName: 'Hassan',
        dob: new Date('1991-02-14'),
        nationality: 'Egyptian',
        passportNumber: 'EG987321654',
        passportExpiry: new Date('2027-02-14'),
        email: 'ahmed.hassan@gmail.com',
        phone: '+40726678901',
      },
      
      // Workers for Innovation Labs
      {
        clientProfileId: createdClients[2]?.id,
        firstName: 'João',
        lastName: 'Silva',
        dob: new Date('1989-12-03'),
        nationality: 'Brazilian',
        passportNumber: 'BR456123789',
        passportExpiry: new Date('2029-12-03'),
        email: 'joao.silva@gmail.com',
        phone: '+40727789012',
      },
      {
        clientProfileId: createdClients[2]?.id,
        firstName: 'Yuki',
        lastName: 'Tanaka',
        dob: new Date('1986-06-18'),
        nationality: 'Japanese',
        passportNumber: 'JP321654987',
        passportExpiry: new Date('2028-06-18'),
        email: 'yuki.tanaka@gmail.com',
        phone: '+40728890123',
      },
      {
        clientProfileId: createdClients[2]?.id,
        firstName: 'Elena',
        lastName: 'Petrov',
        dob: new Date('1993-04-25'),
        nationality: 'Russian',
        passportNumber: 'RU654987321',
        passportExpiry: new Date('2026-04-25'),
        email: 'elena.petrov@gmail.com',
        phone: '+40729901234',
      },
      
      // Workers for Digital Marketing Pro
      {
        clientProfileId: createdClients[3]?.id,
        firstName: 'Luca',
        lastName: 'Ferrari',
        dob: new Date('1984-08-07'),
        nationality: 'Italian',
        passportNumber: 'IT789456123',
        passportExpiry: new Date('2027-08-07'),
        email: 'luca.ferrari@gmail.com',
        phone: '+40720012345',
      },
      {
        clientProfileId: createdClients[3]?.id,
        firstName: 'Anna',
        lastName: 'Müller',
        dob: new Date('1990-10-15'),
        nationality: 'German',
        passportNumber: 'DE123456789',
        passportExpiry: new Date('2028-10-15'),
        email: 'anna.muller@gmail.com',
        phone: '+40721123450',
      },
      {
        clientProfileId: createdClients[3]?.id,
        firstName: 'Chen',
        lastName: 'Wei',
        dob: new Date('1988-01-20'),
        nationality: 'Chinese',
        passportNumber: 'CN987654321',
        passportExpiry: new Date('2029-01-20'),
        email: 'chen.wei@gmail.com',
        phone: '+40722234501',
      },
    ];

    const createdWorkers = [];
    for (const worker of workerData) {
      if (worker.clientProfileId) {
        const [createdWorker] = await db
          .insert(workers)
          .values(worker)
          .onConflictDoNothing()
          .returning();
        if (createdWorker) {
          createdWorkers.push(createdWorker);
        }
      }
    }

    console.log('Workers seeded successfully');

    // Create some dummy assignments to show workflow progress
    const assignmentData = [];
    const jobTitles = [
      'Software Engineer', 'Full Stack Developer', 'DevOps Engineer', 
      'Data Analyst', 'UI/UX Designer', 'Project Manager',
      'Marketing Specialist', 'Sales Representative', 'Business Analyst',
      'Quality Assurance Engineer', 'Technical Writer', 'Product Manager'
    ];
    
    const statuses = ['pending', 'in-progress', 'completed'];
    const stageStatuses = ['pending', 'in-progress', 'completed', 'rejected'];

    // Get some requirements to create assignments
    const allRequirements = await db.select().from(requirements);
    
    createdWorkers.forEach((worker, index) => {
      if (allRequirements.length > 0 && worker.clientProfileId) {
        const randomRequirement = allRequirements[index % allRequirements.length];
        const randomJobTitle = jobTitles[index % jobTitles.length];
        const randomStatus = statuses[index % statuses.length];
        
        assignmentData.push({
          requirementId: randomRequirement.id,
          clientProfileId: worker.clientProfileId,
          workerId: worker.id,
          assignedToRole: 'WORKER' as const,
          status: randomStatus === 'pending' ? 'NOT_STARTED' : 
                 randomStatus === 'in-progress' ? 'SUBMITTED_BY_USER' : 
                 'ACCEPTED',
          institution: randomStatus === 'completed' ? 'AJOFM București' : null,
          submissionChannel: randomStatus === 'completed' ? 'ONLINE' : null,
          receiptNumber: randomStatus === 'completed' ? `REC${Date.now()}${index}` : null,
        });
      }
    });

    for (const assignment of assignmentData) {
      await db
        .insert(assignments)
        .values(assignment)
        .onConflictDoNothing();
    }

    console.log('Assignments seeded successfully');
    console.log('Database seed completed successfully');
  } catch (error) {
    console.error('Database seed failed:', error);
    throw error;
  }
}

// Run seed if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => {
      console.log('Seed process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seed process failed:', error);
      process.exit(1);
    });
}

export { seedDatabase };
