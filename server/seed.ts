import { db } from './db';
import { stages, requirements, users } from '@shared/schema';
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
    console.log('Database seed completed successfully');
  } catch (error) {
    console.error('Database seed failed:', error);
    throw error;
  }
}

// Run seed if this file is executed directly
if (require.main === module) {
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
