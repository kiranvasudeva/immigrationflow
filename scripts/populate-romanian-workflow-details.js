import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq } from 'drizzle-orm';
import ws from "ws";
import * as schema from "../shared/schema.js";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema });

console.log('🇷🇴 Populating Romanian Work Permit Process with detailed documents and checklists...');

async function populateRomanianWorkflowDetails() {
  try {
    // Find the Romanian Work Permit workflow
    const [workflow] = await db
      .select()
      .from(schema.workflowTemplates)
      .where(eq(schema.workflowTemplates.name, 'Romanian Work Permit Process'));

    if (!workflow) {
      console.log('❌ Romanian Work Permit Process workflow not found');
      return;
    }

    console.log(`✅ Found workflow: ${workflow.name}`);

    // Get all stages for this workflow
    const stages = await db
      .select()
      .from(schema.workflowStages)
      .where(eq(schema.workflowStages.workflowTemplateId, workflow.id))
      .orderBy(schema.workflowStages.order);

    console.log(`✅ Found ${stages.length} stages`);

    // Define comprehensive document requirements and checklists for each stage
    const stageDetails = {
      'AJOFM Labor Market Test': {
        documents: [
          {
            title: 'Job Position Description',
            description: 'Detailed description of the job position and requirements',
            isRequired: true,
            submittedBy: 'OWNER',
            acceptedFileTypes: ['PDF', 'DOC', 'DOCX'],
            order: 1
          },
          {
            title: 'Company Registration Certificate',
            description: 'Valid company registration from Trade Registry',
            isRequired: true,
            submittedBy: 'OWNER',
            acceptedFileTypes: ['PDF'],
            order: 2
          },
          {
            title: 'Labor Market Test Application',
            description: 'Completed AJOFM labor market test application form',
            isRequired: true,
            submittedBy: 'ADMIN',
            acceptedFileTypes: ['PDF'],
            order: 3
          }
        ],
        checklists: [
          {
            title: 'Verify job position requirements',
            description: 'Ensure job description matches Romanian classification standards',
            isRequired: true,
            assignedRole: 'ADMIN',
            order: 1
          },
          {
            title: 'Submit application to AJOFM',
            description: 'Submit completed application to Romanian Employment Agency',
            isRequired: true,
            assignedRole: 'ADMIN',
            order: 2
          },
          {
            title: 'Monitor application status',
            description: 'Track application progress and respond to AJOFM requests',
            isRequired: true,
            assignedRole: 'ADMIN',
            order: 3
          }
        ]
      },
      'Work Permit Application (IGI)': {
        documents: [
          {
            title: 'AJOFM Approval Certificate',
            description: 'Approved labor market test certificate from AJOFM',
            isRequired: true,
            submittedBy: 'ADMIN',
            acceptedFileTypes: ['PDF'],
            order: 1
          },
          {
            title: 'Worker Passport Copy',
            description: 'Clear copy of worker\'s valid passport',
            isRequired: true,
            submittedBy: 'WORKER',
            acceptedFileTypes: ['PDF', 'JPG', 'PNG'],
            order: 2
          },
          {
            title: 'Educational Certificates',
            description: 'Diplomas and educational qualifications with apostille',
            isRequired: true,
            submittedBy: 'WORKER',
            acceptedFileTypes: ['PDF'],
            order: 3
          },
          {
            title: 'Medical Certificate',
            description: 'Medical fitness certificate for work in Romania',
            isRequired: true,
            submittedBy: 'WORKER',
            acceptedFileTypes: ['PDF'],
            order: 4
          },
          {
            title: 'Criminal Background Check',
            description: 'Criminal record certificate from country of origin',
            isRequired: true,
            submittedBy: 'WORKER',
            acceptedFileTypes: ['PDF'],
            order: 5
          }
        ],
        checklists: [
          {
            title: 'Verify all documents are apostilled',
            description: 'Ensure all foreign documents have proper apostille certification',
            isRequired: true,
            assignedRole: 'ADMIN',
            order: 1
          },
          {
            title: 'Complete IGI application form',
            description: 'Fill out work permit application for Romanian Immigration Office',
            isRequired: true,
            assignedRole: 'ADMIN',
            order: 2
          },
          {
            title: 'Submit to IGI office',
            description: 'Submit complete application package to Immigration Office',
            isRequired: true,
            assignedRole: 'ADMIN',
            order: 3
          },
          {
            title: 'Pay IGI fees',
            description: 'Process payment for work permit application fees',
            isRequired: true,
            assignedRole: 'OWNER',
            order: 4
          }
        ]
      },
      'Consulate Visa Application': {
        documents: [
          {
            title: 'Work Permit Approval',
            description: 'Approved work permit from Romanian Immigration Office',
            isRequired: true,
            submittedBy: 'ADMIN',
            acceptedFileTypes: ['PDF'],
            order: 1
          },
          {
            title: 'Visa Application Form',
            description: 'Completed long-stay visa application form',
            isRequired: true,
            submittedBy: 'WORKER',
            acceptedFileTypes: ['PDF'],
            order: 2
          },
          {
            title: 'Employment Contract',
            description: 'Signed employment contract with Romanian company',
            isRequired: true,
            submittedBy: 'OWNER',
            acceptedFileTypes: ['PDF'],
            order: 3
          },
          {
            title: 'Accommodation Proof',
            description: 'Proof of accommodation arrangements in Romania',
            isRequired: true,
            submittedBy: 'WORKER',
            acceptedFileTypes: ['PDF'],
            order: 4
          }
        ],
        checklists: [
          {
            title: 'Schedule consulate appointment',
            description: 'Book visa application appointment at Romanian consulate',
            isRequired: true,
            assignedRole: 'ADMIN',
            order: 1
          },
          {
            title: 'Prepare document package',
            description: 'Organize all required documents for consulate submission',
            isRequired: true,
            assignedRole: 'ADMIN',
            order: 2
          },
          {
            title: 'Attend consulate interview',
            description: 'Worker attends visa interview at Romanian consulate',
            isRequired: true,
            assignedRole: 'WORKER',
            order: 3
          }
        ]
      },
      'Entry to Romania': {
        documents: [
          {
            title: 'Visa Approval',
            description: 'Approved long-stay visa in passport',
            isRequired: true,
            submittedBy: 'WORKER',
            acceptedFileTypes: ['PDF', 'JPG', 'PNG'],
            order: 1
          },
          {
            title: 'Flight Tickets',
            description: 'Proof of travel arrangements to Romania',
            isRequired: true,
            submittedBy: 'WORKER',
            acceptedFileTypes: ['PDF'],
            order: 2
          }
        ],
        checklists: [
          {
            title: 'Confirm travel plans',
            description: 'Verify worker has booked travel to Romania',
            isRequired: true,
            assignedRole: 'ADMIN',
            order: 1
          },
          {
            title: 'Border entry notification',
            description: 'Notify when worker has successfully entered Romania',
            isRequired: true,
            assignedRole: 'WORKER',
            order: 2
          },
          {
            title: 'Initial accommodation check',
            description: 'Confirm worker has reached planned accommodation',
            isRequired: true,
            assignedRole: 'OWNER',
            order: 3
          }
        ]
      },
      'Residence Permit Application': {
        documents: [
          {
            title: 'Entry Stamp in Passport',
            description: 'Proof of legal entry to Romania with border stamp',
            isRequired: true,
            submittedBy: 'WORKER',
            acceptedFileTypes: ['PDF', 'JPG', 'PNG'],
            order: 1
          },
          {
            title: 'Residence Permit Application',
            description: 'Completed temporary residence permit application form',
            isRequired: true,
            submittedBy: 'ADMIN',
            acceptedFileTypes: ['PDF'],
            order: 2
          },
          {
            title: 'Housing Registration',
            description: 'Registration of residence address with local authorities',
            isRequired: true,
            submittedBy: 'WORKER',
            acceptedFileTypes: ['PDF'],
            order: 3
          },
          {
            title: 'Health Insurance',
            description: 'Valid health insurance coverage in Romania',
            isRequired: true,
            submittedBy: 'WORKER',
            acceptedFileTypes: ['PDF'],
            order: 4
          }
        ],
        checklists: [
          {
            title: 'Register residence address',
            description: 'Complete address registration with local city hall',
            isRequired: true,
            assignedRole: 'WORKER',
            order: 1
          },
          {
            title: 'Obtain health insurance',
            description: 'Secure valid health insurance policy',
            isRequired: true,
            assignedRole: 'WORKER',
            order: 2
          },
          {
            title: 'Submit residence permit application',
            description: 'File application for temporary residence permit',
            isRequired: true,
            assignedRole: 'ADMIN',
            order: 3
          }
        ]
      },
      'Residence Card Issuance': {
        documents: [
          {
            title: 'Residence Permit Approval',
            description: 'Approved temporary residence permit from IGI',
            isRequired: true,
            submittedBy: 'ADMIN',
            acceptedFileTypes: ['PDF'],
            order: 1
          },
          {
            title: 'Biometric Data',
            description: 'Biometric data collection receipt',
            isRequired: true,
            submittedBy: 'WORKER',
            acceptedFileTypes: ['PDF'],
            order: 2
          }
        ],
        checklists: [
          {
            title: 'Schedule card collection appointment',
            description: 'Book appointment to collect residence card',
            isRequired: true,
            assignedRole: 'ADMIN',
            order: 1
          },
          {
            title: 'Collect residence card',
            description: 'Worker collects physical residence card from IGI',
            isRequired: true,
            assignedRole: 'WORKER',
            order: 2
          },
          {
            title: 'Verify card details',
            description: 'Check residence card for accuracy and validity period',
            isRequired: true,
            assignedRole: 'ADMIN',
            order: 3
          }
        ]
      }
    };

    // Populate document requirements and checklists for each stage
    for (const stage of stages) {
      const details = stageDetails[stage.name];
      if (!details) {
        console.log(`⚠️  No details defined for stage: ${stage.name}`);
        continue;
      }

      console.log(`\n📋 Processing stage: ${stage.name}`);

      // Clear existing documents and checklists
      await db.delete(schema.workflowDocumentRequirements)
        .where(eq(schema.workflowDocumentRequirements.stageId, stage.id));
      await db.delete(schema.workflowChecklistItems)
        .where(eq(schema.workflowChecklistItems.stageId, stage.id));

      // Insert document requirements
      for (const doc of details.documents) {
        await db.insert(schema.workflowDocumentRequirements).values({
          stageId: stage.id,
          title: doc.title,
          description: doc.description,
          isRequired: doc.isRequired,
          submittedBy: doc.submittedBy,
          acceptedFileTypes: JSON.stringify(doc.acceptedFileTypes),
          order: doc.order
        });
      }
      console.log(`  ✅ Added ${details.documents.length} document requirements`);

      // Insert checklist items
      for (const item of details.checklists) {
        await db.insert(schema.workflowChecklistItems).values({
          stageId: stage.id,
          title: item.title,
          description: item.description,
          isRequired: item.isRequired,
          assignedRole: item.assignedRole,
          order: item.order
        });
      }
      console.log(`  ✅ Added ${details.checklists.length} checklist items`);
    }

    console.log('\n🎉 Romanian Work Permit Process populated with comprehensive details!');
    console.log('✅ All stages now have document requirements and checklist items with assigned roles');
    
  } catch (error) {
    console.error('❌ Error populating Romanian workflow details:', error);
    throw error;
  }
}

populateRomanianWorkflowDetails()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });