#!/usr/bin/env node

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set. Did you forget to provision a database?');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool });

const ROMANIAN_WORK_PERMIT_STAGES = [
  {
    name: 'AJOFM Labor Market Test',
    description: 'Romanian Employment Agency labor market testing for foreign workers',
    estimatedDays: 14,
    stepType: 'GOVERNMENT_SUBMISSION',
    assignedRole: 'WORKER',
    isRequired: true,
    requiresApproval: true,
    order: 1,
    documentRequirements: [
      {
        title: 'AJOFM Application Form',
        description: 'Completed labor market test application form',
        required: true,
        acceptedFileTypes: ['application/pdf'],
        maxFileSize: 5242880,
        submittedBy: 'WORKER',
        order: 1
      },
      {
        title: 'Job Description',
        description: 'Detailed job description and requirements',
        required: true,
        acceptedFileTypes: ['application/pdf', 'application/msword'],
        maxFileSize: 2097152,
        submittedBy: 'OWNER',
        order: 2
      },
      {
        title: 'Worker CV and Qualifications',
        description: 'Worker curriculum vitae and professional qualifications',
        required: true,
        acceptedFileTypes: ['application/pdf'],
        maxFileSize: 10485760,
        submittedBy: 'WORKER',
        order: 3
      }
    ],
    checklist: [
      {
        title: 'Submit to local AJOFM office',
        description: 'Application must be submitted to appropriate regional AJOFM office',
        isRequired: true,
        assignedRole: 'WORKER',
        order: 1
      },
      {
        title: 'Monitor 14-day testing period',
        description: 'Track labor market test progress and respond to any requests',
        isRequired: true,
        assignedRole: 'WORKER',
        order: 2
      }
    ]
  },
  {
    name: 'Work Permit Application (IGI)',
    description: 'Romanian Immigration Office work permit application',
    estimatedDays: 30,
    stepType: 'GOVERNMENT_SUBMISSION',
    assignedRole: 'WORKER',
    isRequired: true,
    requiresApproval: true,
    order: 2,
    documentRequirements: [
      {
        title: 'AJOFM Approval Certificate',
        description: 'Labor market test approval from Romanian Employment Agency',
        required: true,
        acceptedFileTypes: ['application/pdf'],
        maxFileSize: 5242880,
        submittedBy: 'WORKER',
        order: 1
      },
      {
        title: 'Work Permit Application Form',
        description: 'Completed IGI work permit application',
        required: true,
        acceptedFileTypes: ['application/pdf'],
        maxFileSize: 5242880,
        submittedBy: 'WORKER',
        order: 2
      },
      {
        title: 'Employment Contract',
        description: 'Signed employment contract with Romanian employer',
        required: true,
        acceptedFileTypes: ['application/pdf'],
        maxFileSize: 5242880,
        submittedBy: 'OWNER',
        order: 3
      },
      {
        title: 'Company Documentation',
        description: 'Employer registration and tax compliance certificates',
        required: true,
        acceptedFileTypes: ['application/pdf'],
        maxFileSize: 10485760,
        submittedBy: 'OWNER',
        order: 4
      }
    ],
    checklist: [
      {
        title: 'Submit to IGI within validity period',
        description: 'Application must be submitted while AJOFM approval is valid',
        isRequired: true,
        assignedRole: 'WORKER',
        order: 1
      },
      {
        title: 'Pay required fees',
        description: 'Submit payment for work permit processing fees',
        isRequired: true,
        assignedRole: 'OWNER',
        order: 2
      }
    ]
  },
  {
    name: 'Consulate Visa Application',
    description: 'Long-stay visa application at Romanian consulate',
    estimatedDays: 21,
    stepType: 'INSTITUTIONAL_SUBMISSION',
    assignedRole: 'WORKER',
    isRequired: true,
    requiresApproval: true,
    order: 3,
    documentRequirements: [
      {
        title: 'IGI Work Permit',
        description: 'Approved work permit from Romanian Immigration Office',
        required: true,
        acceptedFileTypes: ['application/pdf'],
        maxFileSize: 5242880,
        submittedBy: 'WORKER',
        order: 1
      },
      {
        title: 'Visa Application Form',
        description: 'Completed long-stay visa application',
        required: true,
        acceptedFileTypes: ['application/pdf'],
        maxFileSize: 5242880,
        submittedBy: 'WORKER',
        order: 2
      },
      {
        title: 'Passport and Photos',
        description: 'Valid passport and biometric photographs',
        required: true,
        acceptedFileTypes: ['application/pdf', 'image/jpeg'],
        maxFileSize: 10485760,
        submittedBy: 'WORKER',
        order: 3
      },
      {
        title: 'Medical Insurance',
        description: 'Valid health insurance coverage for Romania',
        required: true,
        acceptedFileTypes: ['application/pdf'],
        maxFileSize: 5242880,
        submittedBy: 'WORKER',
        order: 4
      }
    ],
    checklist: [
      {
        title: 'Schedule consulate appointment',
        description: 'Book appointment at Romanian consulate in worker\'s country',
        isRequired: true,
        assignedRole: 'WORKER',
        order: 1
      },
      {
        title: 'Attend visa interview',
        description: 'Worker must attend scheduled consulate interview',
        isRequired: true,
        assignedRole: 'WORKER',
        order: 2
      }
    ]
  },
  {
    name: 'Entry to Romania',
    description: 'Worker entry to Romania and initial registration',
    estimatedDays: 7,
    stepType: 'ARRIVAL',
    assignedRole: 'WORKER',
    isRequired: true,
    requiresApproval: false,
    order: 4,
    documentRequirements: [
      {
        title: 'Entry Stamp/Documentation',
        description: 'Proof of legal entry to Romania with visa',
        required: true,
        acceptedFileTypes: ['application/pdf', 'image/jpeg'],
        maxFileSize: 5242880,
        submittedBy: 'WORKER',
        order: 1
      },
      {
        title: 'Address Registration',
        description: 'Temporary address registration in Romania',
        required: true,
        acceptedFileTypes: ['application/pdf'],
        maxFileSize: 2097152,
        submittedBy: 'WORKER',
        order: 2
      }
    ],
    checklist: [
      {
        title: 'Register address within 3 days',
        description: 'Complete mandatory address registration with local authorities',
        isRequired: true,
        assignedRole: 'WORKER',
        order: 1
      },
      {
        title: 'Notify employer of arrival',
        description: 'Inform employer of successful arrival in Romania',
        isRequired: true,
        assignedRole: 'WORKER',
        order: 2
      }
    ]
  },
  {
    name: 'Residence Permit Application',
    description: 'Temporary residence permit application at IGI',
    estimatedDays: 30,
    stepType: 'GOVERNMENT_SUBMISSION',
    assignedRole: 'WORKER',
    isRequired: true,
    requiresApproval: true,
    order: 5,
    documentRequirements: [
      {
        title: 'Residence Permit Application',
        description: 'Completed temporary residence permit application',
        required: true,
        acceptedFileTypes: ['application/pdf'],
        maxFileSize: 5242880,
        submittedBy: 'WORKER',
        order: 1
      },
      {
        title: 'Medical Certificate',
        description: 'Medical examination results from authorized Romanian facility',
        required: true,
        acceptedFileTypes: ['application/pdf'],
        maxFileSize: 5242880,
        submittedBy: 'WORKER',
        order: 2
      },
      {
        title: 'Housing Documentation',
        description: 'Proof of accommodation in Romania',
        required: true,
        acceptedFileTypes: ['application/pdf'],
        maxFileSize: 5242880,
        submittedBy: 'WORKER',
        order: 3
      },
      {
        title: 'Criminal Background Check',
        description: 'Criminal record certificate from country of origin',
        required: true,
        acceptedFileTypes: ['application/pdf'],
        maxFileSize: 5242880,
        submittedBy: 'WORKER',
        order: 4
      }
    ],
    checklist: [
      {
        title: 'Submit within 30 days of arrival',
        description: 'Application must be submitted within legal timeframe',
        isRequired: true,
        assignedRole: 'WORKER',
        order: 1
      },
      {
        title: 'Complete medical examination',
        description: 'Undergo required medical examination at authorized facility',
        isRequired: true,
        assignedRole: 'WORKER',
        order: 2
      }
    ]
  },
  {
    name: 'Residence Card Issuance',
    description: 'Collection of temporary residence card',
    estimatedDays: 14,
    stepType: 'COMPLETION',
    assignedRole: 'WORKER',
    isRequired: true,
    requiresApproval: true,
    order: 6,
    documentRequirements: [
      {
        title: 'Collection Receipt',
        description: 'Receipt confirming collection of residence card',
        required: true,
        acceptedFileTypes: ['application/pdf', 'image/jpeg'],
        maxFileSize: 2097152,
        submittedBy: 'WORKER',
        order: 1
      },
      {
        title: 'Residence Card Copy',
        description: 'Copy of issued temporary residence card',
        required: true,
        acceptedFileTypes: ['application/pdf', 'image/jpeg'],
        maxFileSize: 5242880,
        submittedBy: 'WORKER',
        order: 2
      }
    ],
    checklist: [
      {
        title: 'Collect card in person',
        description: 'Worker must personally collect residence card from IGI',
        isRequired: true,
        assignedRole: 'WORKER',
        order: 1
      },
      {
        title: 'Begin employment legally',
        description: 'Worker can now begin legal employment in Romania',
        isRequired: true,
        assignedRole: 'OWNER',
        order: 2
      }
    ]
  }
];

async function addRomanianWorkPermitStages() {
  console.log('🇷🇴 Adding Romanian Work Permit Process stages...\n');

  try {
    // Find the Romanian Work Permit Process workflow
    const workflowResult = await db.execute(`
      SELECT id, name, estimated_duration_days
      FROM workflow_templates 
      WHERE name = 'Romanian Work Permit Process'
    `);

    if (workflowResult.rows.length === 0) {
      console.log('❌ Romanian Work Permit Process workflow not found!');
      return;
    }

    const workflow = workflowResult.rows[0];
    const workflowId = workflow.id;
    
    console.log(`⚙️  Processing workflow: ${workflow.name} (${workflow.estimated_duration_days} days)`);

    // Clear existing stages for this workflow
    console.log('🧹 Clearing existing stages...');
    await db.execute(`DELETE FROM checklist_items WHERE workflow_step_id IN (SELECT id FROM workflow_steps WHERE workflow_template_id = $1)`, [workflowId]);
    await db.execute(`DELETE FROM document_requirements WHERE workflow_step_id IN (SELECT id FROM workflow_steps WHERE workflow_template_id = $1)`, [workflowId]);
    await db.execute(`DELETE FROM workflow_steps WHERE workflow_template_id = $1`, [workflowId]);

    // Add each stage
    for (const stage of ROMANIAN_WORK_PERMIT_STAGES) {
      console.log(`   📋 Adding stage: ${stage.name} (${stage.estimatedDays} days)`);
      
      // Insert the stage
      const stageResult = await db.execute(`
        INSERT INTO workflow_steps (
          workflow_template_id, name, description, step_type, assigned_role,
          estimated_days, "order", is_required, requires_approval
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id
      `, [
        workflowId,
        stage.name,
        stage.description,
        stage.stepType,
        stage.assignedRole,
        stage.estimatedDays,
        stage.order,
        stage.isRequired,
        stage.requiresApproval
      ]);

      const stageId = stageResult.rows[0].id;

      // Add document requirements
      if (stage.documentRequirements && stage.documentRequirements.length > 0) {
        console.log(`      📄 Adding ${stage.documentRequirements.length} document requirements`);
        for (const docReq of stage.documentRequirements) {
          await db.execute(`
            INSERT INTO document_requirements (
              workflow_step_id, title, description, is_required,
              accepted_file_types, max_file_size, submitted_by, "order"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `, [
            stageId,
            docReq.title,
            docReq.description,
            docReq.required,
            JSON.stringify(docReq.acceptedFileTypes),
            docReq.maxFileSize,
            docReq.submittedBy,
            docReq.order
          ]);
        }
      }

      // Add checklist items
      if (stage.checklist && stage.checklist.length > 0) {
        console.log(`      ✅ Adding ${stage.checklist.length} checklist items`);
        for (const checkItem of stage.checklist) {
          await db.execute(`
            INSERT INTO checklist_items (
              workflow_step_id, title, description, is_required,
              assigned_role, "order"
            ) VALUES ($1, $2, $3, $4, $5, $6)
          `, [
            stageId,
            checkItem.title,
            checkItem.description,
            checkItem.isRequired,
            checkItem.assignedRole,
            checkItem.order
          ]);
        }
      }
    }

    console.log(`\n✅ Successfully added ${ROMANIAN_WORK_PERMIT_STAGES.length} stages to Romanian Work Permit Process!\n`);

    // Verify the results
    console.log('📊 Verification results:\n');
    
    const verificationResult = await db.execute(`
      SELECT 
        ws.name as stage_name,
        ws.estimated_days,
        ws.assigned_role,
        COUNT(DISTINCT dr.id) as document_count,
        COUNT(DISTINCT ci.id) as checklist_count
      FROM workflow_steps ws
      LEFT JOIN document_requirements dr ON ws.id = dr.workflow_step_id
      LEFT JOIN checklist_items ci ON ws.id = ci.workflow_step_id
      WHERE ws.workflow_template_id = $1
      GROUP BY ws.id, ws.name, ws.estimated_days, ws.assigned_role, ws."order"
      ORDER BY ws."order"
    `, [workflowId]);

    verificationResult.rows.forEach((stage, index) => {
      console.log(`${index + 1}. ${stage.stage_name}`);
      console.log(`   📅 Duration: ${stage.estimated_days} days`);
      console.log(`   👤 Assigned to: ${stage.assigned_role}`);
      console.log(`   📄 Documents: ${stage.document_count}`);
      console.log(`   ✅ Checklist items: ${stage.checklist_count}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error adding Romanian Work Permit stages:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the script
addRomanianWorkPermitStages().catch(console.error);