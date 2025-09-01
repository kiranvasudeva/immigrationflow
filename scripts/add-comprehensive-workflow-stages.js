#!/usr/bin/env node

// Import necessary database setup
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set. Did you forget to provision a database?');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool });

// Define comprehensive workflow stages for each immigration type
const WORKFLOW_STAGES = {
  'Student Visa and Study Permit': [
    {
      name: 'University Application Preparation',
      description: 'Prepare and submit university admission application',
      estimatedDays: 14,
      stepType: 'DOCUMENT_COLLECTION',
      isRequired: true,
      requiresApproval: false,
      order: 1,
      documentRequirements: [
        {
          title: 'Academic Transcripts',
          description: 'Official transcripts from previous educational institutions',
          required: true,
          acceptedFileTypes: ['application/pdf'],
          maxFileSize: 10485760,
          submittedBy: 'WORKER',
          order: 1
        },
        {
          title: 'Language Proficiency Certificate',
          description: 'IELTS, TOEFL, or equivalent language certification',
          required: true,
          acceptedFileTypes: ['application/pdf', 'image/jpeg'],
          maxFileSize: 5242880,
          submittedBy: 'WORKER',
          order: 2
        },
        {
          title: 'Motivation Letter',
          description: 'Personal statement for university admission',
          required: true,
          acceptedFileTypes: ['application/pdf', 'application/msword'],
          maxFileSize: 2097152,
          submittedBy: 'WORKER',
          order: 3
        }
      ],
      checklist: [
        {
          title: 'Verify academic transcript authenticity',
          description: 'Confirm all academic documents are officially certified',
          isRequired: true,
          assignedRole: 'WORKER',
          order: 1
        },
        {
          title: 'Check language proficiency validity',
          description: 'Ensure language certificates meet university requirements',
          isRequired: true,
          assignedRole: 'WORKER',
          order: 2
        }
      ]
    },
    {
      name: 'University Admission Confirmation',
      description: 'Receive and process university admission letter',
      estimatedDays: 30,
      stepType: 'INSTITUTIONAL_SUBMISSION',
      isRequired: true,
      requiresApproval: true,
      order: 2,
      documentRequirements: [
        {
          title: 'University Admission Letter',
          description: 'Official admission letter from Romanian university',
          required: true,
          acceptedFileTypes: ['application/pdf'],
          maxFileSize: 5242880,
          submittedBy: 'OWNER',
          order: 1
        },
        {
          title: 'Study Program Details',
          description: 'Detailed curriculum and program information',
          required: true,
          acceptedFileTypes: ['application/pdf'],
          maxFileSize: 10485760,
          submittedBy: 'OWNER',
          order: 2
        }
      ],
      checklist: [
        {
          title: 'Validate university accreditation',
          description: 'Confirm university is officially recognized in Romania',
          isRequired: true,
          assignedRole: 'WORKER',
          order: 1
        }
      ]
    },
    {
      name: 'Financial Documentation',
      description: 'Prepare financial proof for student visa application',
      estimatedDays: 7,
      stepType: 'DOCUMENT_COLLECTION',
      isRequired: true,
      requiresApproval: false,
      order: 3,
      documentRequirements: [
        {
          title: 'Bank Statements',
          description: 'Financial proof covering study period expenses',
          required: true,
          acceptedFileTypes: ['application/pdf'],
          maxFileSize: 10485760,
          submittedBy: 'WORKER',
          order: 1
        },
        {
          title: 'Tuition Fee Payment Proof',
          description: 'Receipt of tuition fee payment to university',
          required: true,
          acceptedFileTypes: ['application/pdf', 'image/jpeg'],
          maxFileSize: 5242880,
          submittedBy: 'WORKER',
          order: 2
        }
      ],
      checklist: [
        {
          title: 'Verify sufficient funds',
          description: 'Confirm financial resources meet Romanian student visa requirements',
          isRequired: true,
          assignedRole: 'WORKER',
          order: 1
        }
      ]
    },
    {
      name: 'Student Visa Application',
      description: 'Submit student visa application to Romanian consulate',
      estimatedDays: 21,
      stepType: 'INSTITUTIONAL_SUBMISSION',
      isRequired: true,
      requiresApproval: true,
      order: 4,
      documentRequirements: [
        {
          title: 'Visa Application Form',
          description: 'Completed student visa application form',
          required: true,
          acceptedFileTypes: ['application/pdf'],
          maxFileSize: 5242880,
          submittedBy: 'WORKER',
          order: 1
        },
        {
          title: 'Passport and Photos',
          description: 'Valid passport and biometric photos',
          required: true,
          acceptedFileTypes: ['application/pdf', 'image/jpeg'],
          maxFileSize: 10485760,
          submittedBy: 'WORKER',
          order: 2
        }
      ],
      checklist: [
        {
          title: 'Schedule consulate appointment',
          description: 'Book visa application appointment at Romanian consulate',
          isRequired: true,
          assignedRole: 'WORKER',
          order: 1
        }
      ]
    },
    {
      name: 'Residence Permit Application',
      description: 'Apply for Romanian residence permit after arrival',
      estimatedDays: 30,
      stepType: 'GOVERNMENT_SUBMISSION',
      isRequired: true,
      requiresApproval: true,
      order: 5,
      documentRequirements: [
        {
          title: 'Residence Permit Application',
          description: 'Application for Romanian residence permit',
          required: true,
          acceptedFileTypes: ['application/pdf'],
          maxFileSize: 5242880,
          submittedBy: 'WORKER',
          order: 1
        },
        {
          title: 'Medical Insurance',
          description: 'Valid health insurance coverage in Romania',
          required: true,
          acceptedFileTypes: ['application/pdf'],
          maxFileSize: 5242880,
          submittedBy: 'WORKER',
          order: 2
        }
      ],
      checklist: [
        {
          title: 'Submit to IGI within 30 days',
          description: 'Apply for residence permit within legal timeframe',
          isRequired: true,
          assignedRole: 'WORKER',
          order: 1
        }
      ]
    },
    {
      name: 'Integration and Study Commencement',
      description: 'Complete integration process and begin studies',
      estimatedDays: 14,
      stepType: 'COMPLETION',
      isRequired: true,
      requiresApproval: true,
      order: 6,
      documentRequirements: [
        {
          title: 'University Enrollment Confirmation',
          description: 'Official confirmation of university enrollment',
          required: true,
          acceptedFileTypes: ['application/pdf'],
          maxFileSize: 5242880,
          submittedBy: 'OWNER',
          order: 1
        }
      ],
      checklist: [
        {
          title: 'Complete student integration',
          description: 'Finalize all administrative requirements for studies',
          isRequired: true,
          assignedRole: 'OWNER',
          order: 1
        }
      ]
    }
  ],

  'Family Reunification Process': [
    {
      name: 'Eligibility Assessment',
      description: 'Assess eligibility for family reunification under Romanian law',
      estimatedDays: 7,
      stepType: 'DOCUMENT_COLLECTION',
      isRequired: true,
      requiresApproval: false,
      order: 1,
      documentRequirements: [
        {
          title: 'Sponsor Legal Status Proof',
          description: 'Romanian resident/citizen status of sponsoring family member',
          required: true,
          acceptedFileTypes: ['application/pdf'],
          maxFileSize: 10485760,
          submittedBy: 'OWNER',
          order: 1
        },
        {
          title: 'Family Relationship Proof',
          description: 'Marriage certificate, birth certificates, or family ties documentation',
          required: true,
          acceptedFileTypes: ['application/pdf'],
          maxFileSize: 10485760,
          submittedBy: 'WORKER',
          order: 2
        }
      ],
      checklist: [
        {
          title: 'Verify sponsor eligibility',
          description: 'Confirm sponsor meets Romanian family reunification requirements',
          isRequired: true,
          assignedRole: 'WORKER',
          order: 1
        }
      ]
    },
    {
      name: 'Financial Documentation',
      description: 'Prepare financial guarantee and support evidence',
      estimatedDays: 10,
      stepType: 'DOCUMENT_COLLECTION',
      isRequired: true,
      requiresApproval: false,
      order: 2,
      documentRequirements: [
        {
          title: 'Income Proof',
          description: 'Sponsor income documentation and tax returns',
          required: true,
          acceptedFileTypes: ['application/pdf'],
          maxFileSize: 10485760,
          submittedBy: 'OWNER',
          order: 1
        },
        {
          title: 'Housing Documentation',
          description: 'Proof of adequate housing for family member',
          required: true,
          acceptedFileTypes: ['application/pdf'],
          maxFileSize: 10485760,
          submittedBy: 'OWNER',
          order: 2
        }
      ],
      checklist: [
        {
          title: 'Verify financial capacity',
          description: 'Confirm sponsor can financially support family member',
          isRequired: true,
          assignedRole: 'WORKER',
          order: 1
        }
      ]
    },
    {
      name: 'Application Preparation',
      description: 'Prepare family reunification application documentation',
      estimatedDays: 14,
      stepType: 'DOCUMENT_COLLECTION',
      isRequired: true,
      requiresApproval: false,
      order: 3,
      documentRequirements: [
        {
          title: 'Family Reunification Application',
          description: 'Completed family reunification application form',
          required: true,
          acceptedFileTypes: ['application/pdf'],
          maxFileSize: 5242880,
          submittedBy: 'WORKER',
          order: 1
        },
        {
          title: 'Family Member Documents',
          description: 'Passport, civil status documents, and background checks',
          required: true,
          acceptedFileTypes: ['application/pdf'],
          maxFileSize: 15728640,
          submittedBy: 'WORKER',
          order: 2
        }
      ],
      checklist: [
        {
          title: 'Authenticate foreign documents',
          description: 'Ensure all foreign documents are properly legalized',
          isRequired: true,
          assignedRole: 'WORKER',
          order: 1
        }
      ]
    },
    {
      name: 'IGI Application Submission',
      description: 'Submit family reunification application to Romanian Immigration Office',
      estimatedDays: 21,
      stepType: 'GOVERNMENT_SUBMISSION',
      isRequired: true,
      requiresApproval: true,
      order: 4,
      documentRequirements: [
        {
          title: 'IGI Submission Receipt',
          description: 'Official receipt from IGI confirming application submission',
          required: true,
          acceptedFileTypes: ['application/pdf', 'image/jpeg'],
          maxFileSize: 5242880,
          submittedBy: 'WORKER',
          order: 1
        }
      ],
      checklist: [
        {
          title: 'Submit to IGI within timeframe',
          description: 'Ensure application is submitted within legal deadlines',
          isRequired: true,
          assignedRole: 'WORKER',
          order: 1
        }
      ]
    },
    {
      name: 'Decision and Visa Processing',
      description: 'Await IGI decision and process entry visa if approved',
      estimatedDays: 30,
      stepType: 'INSTITUTIONAL_SUBMISSION',
      isRequired: true,
      requiresApproval: true,
      order: 5,
      documentRequirements: [
        {
          title: 'IGI Approval Decision',
          description: 'Official approval decision from Romanian Immigration Office',
          required: true,
          acceptedFileTypes: ['application/pdf'],
          maxFileSize: 10485760,
          submittedBy: 'WORKER',
          order: 1
        },
        {
          title: 'Entry Visa Application',
          description: 'Visa application for family member entry to Romania',
          required: true,
          acceptedFileTypes: ['application/pdf'],
          maxFileSize: 5242880,
          submittedBy: 'WORKER',
          order: 2
        }
      ],
      checklist: [
        {
          title: 'Process entry documents',
          description: 'Complete all entry documentation for family member',
          isRequired: true,
          assignedRole: 'WORKER',
          order: 1
        }
      ]
    },
    {
      name: 'Arrival and Integration',
      description: 'Family member arrival and residence permit finalization',
      estimatedDays: 14,
      stepType: 'COMPLETION',
      isRequired: true,
      requiresApproval: true,
      order: 6,
      documentRequirements: [
        {
          title: 'Residence Permit',
          description: 'Finalized Romanian residence permit for family member',
          required: true,
          acceptedFileTypes: ['application/pdf'],
          maxFileSize: 5242880,
          submittedBy: 'WORKER',
          order: 1
        }
      ],
      checklist: [
        {
          title: 'Complete family integration',
          description: 'Finalize all legal requirements for family reunification',
          isRequired: true,
          assignedRole: 'OWNER',
          order: 1
        }
      ]
    }
  ],

  'Romanian Citizenship Application': [
    {
      name: 'Eligibility Verification',
      description: 'Verify eligibility for Romanian citizenship by naturalization',
      estimatedDays: 14,
      stepType: 'DOCUMENT_COLLECTION',
      isRequired: true,
      requiresApproval: false,
      order: 1,
      documentRequirements: [
        {
          title: 'Residence History',
          description: 'Complete documentation of legal residence in Romania',
          required: true,
          acceptedFileTypes: ['application/pdf'],
          maxFileSize: 15728640,
          submittedBy: 'WORKER',
          order: 1
        },
        {
          title: 'Criminal Background Check',
          description: 'Criminal record certificates from all countries of residence',
          required: true,
          acceptedFileTypes: ['application/pdf'],
          maxFileSize: 10485760,
          submittedBy: 'WORKER',
          order: 2
        }
      ],
      checklist: [
        {
          title: 'Confirm minimum residence period',
          description: 'Verify applicant meets required residence duration',
          isRequired: true,
          assignedRole: 'WORKER',
          order: 1
        }
      ]
    },
    {
      name: 'Language and Integration Test',
      description: 'Complete Romanian language and civic knowledge assessment',
      estimatedDays: 30,
      stepType: 'EXAMINATION',
      isRequired: true,
      requiresApproval: true,
      order: 2,
      documentRequirements: [
        {
          title: 'Language Test Certificate',
          description: 'Romanian language proficiency certificate',
          required: true,
          acceptedFileTypes: ['application/pdf'],
          maxFileSize: 5242880,
          submittedBy: 'WORKER',
          order: 1
        },
        {
          title: 'Civic Knowledge Test',
          description: 'Romanian civics and history knowledge test results',
          required: true,
          acceptedFileTypes: ['application/pdf'],
          maxFileSize: 5242880,
          submittedBy: 'WORKER',
          order: 2
        }
      ],
      checklist: [
        {
          title: 'Pass required examinations',
          description: 'Successfully complete language and civic knowledge tests',
          isRequired: true,
          assignedRole: 'WORKER',
          order: 1
        }
      ]
    },
    {
      name: 'Financial and Tax Compliance',
      description: 'Demonstrate financial stability and tax compliance',
      estimatedDays: 21,
      stepType: 'DOCUMENT_COLLECTION',
      isRequired: true,
      requiresApproval: false,
      order: 3,
      documentRequirements: [
        {
          title: 'Tax Compliance Certificate',
          description: 'Proof of tax obligations fulfillment in Romania',
          required: true,
          acceptedFileTypes: ['application/pdf'],
          maxFileSize: 10485760,
          submittedBy: 'WORKER',
          order: 1
        },
        {
          title: 'Income Documentation',
          description: 'Employment and income verification documents',
          required: true,
          acceptedFileTypes: ['application/pdf'],
          maxFileSize: 10485760,
          submittedBy: 'WORKER',
          order: 2
        }
      ],
      checklist: [
        {
          title: 'Verify tax compliance',
          description: 'Confirm all tax obligations are up to date',
          isRequired: true,
          assignedRole: 'WORKER',
          order: 1
        }
      ]
    },
    {
      name: 'Citizenship Application Preparation',
      description: 'Prepare comprehensive citizenship application documentation',
      estimatedDays: 21,
      stepType: 'DOCUMENT_COLLECTION',
      isRequired: true,
      requiresApproval: false,
      order: 4,
      documentRequirements: [
        {
          title: 'Citizenship Application Form',
          description: 'Completed Romanian citizenship application',
          required: true,
          acceptedFileTypes: ['application/pdf'],
          maxFileSize: 10485760,
          submittedBy: 'WORKER',
          order: 1
        },
        {
          title: 'Supporting Documentation',
          description: 'All supporting documents for citizenship application',
          required: true,
          acceptedFileTypes: ['application/pdf'],
          maxFileSize: 26214400,
          submittedBy: 'WORKER',
          order: 2
        }
      ],
      checklist: [
        {
          title: 'Complete application review',
          description: 'Thoroughly review all application materials',
          isRequired: true,
          assignedRole: 'WORKER',
          order: 1
        }
      ]
    },
    {
      name: 'Government Submission and Review',
      description: 'Submit application to Romanian citizenship authorities',
      estimatedDays: 180,
      stepType: 'GOVERNMENT_SUBMISSION',
      isRequired: true,
      requiresApproval: true,
      order: 5,
      documentRequirements: [
        {
          title: 'Submission Receipt',
          description: 'Official receipt from citizenship processing authority',
          required: true,
          acceptedFileTypes: ['application/pdf'],
          maxFileSize: 5242880,
          submittedBy: 'WORKER',
          order: 1
        }
      ],
      checklist: [
        {
          title: 'Monitor application status',
          description: 'Track citizenship application processing status',
          isRequired: true,
          assignedRole: 'WORKER',
          order: 1
        }
      ]
    },
    {
      name: 'Citizenship Ceremony and Finalization',
      description: 'Complete citizenship oath ceremony and receive certificate',
      estimatedDays: 14,
      stepType: 'COMPLETION',
      isRequired: true,
      requiresApproval: true,
      order: 6,
      documentRequirements: [
        {
          title: 'Citizenship Certificate',
          description: 'Official Romanian citizenship certificate',
          required: true,
          acceptedFileTypes: ['application/pdf'],
          maxFileSize: 10485760,
          submittedBy: 'OWNER',
          order: 1
        },
        {
          title: 'Romanian Passport Application',
          description: 'Application for Romanian passport as new citizen',
          required: false,
          acceptedFileTypes: ['application/pdf'],
          maxFileSize: 5242880,
          submittedBy: 'WORKER',
          order: 2
        }
      ],
      checklist: [
        {
          title: 'Complete citizenship ceremony',
          description: 'Attend official citizenship oath ceremony',
          isRequired: true,
          assignedRole: 'OWNER',
          order: 1
        }
      ]
    }
  ]
};

async function addWorkflowStages() {
  console.log('🚀 Adding comprehensive workflow stages...\n');

  try {
    // Get all workflow templates
    const workflows = await db.execute(`
      SELECT id, name, estimated_duration_days
      FROM workflow_templates 
      WHERE name IN ('Student Visa and Study Permit', 'Family Reunification Process', 'Romanian Citizenship Application')
      ORDER BY name
    `);

    console.log(`📋 Found ${workflows.rows.length} workflows to enhance with stages:\n`);

    for (const workflow of workflows.rows) {
      const workflowName = workflow.name;
      const workflowId = workflow.id;
      
      console.log(`⚙️  Processing workflow: ${workflowName}`);
      
      const stages = WORKFLOW_STAGES[workflowName];
      if (!stages) {
        console.log(`   ⚠️  No stages defined for ${workflowName}, skipping...`);
        continue;
      }

      // Add stages to this workflow
      for (const stage of stages) {
        // Insert the stage
        const stageResult = await db.execute(`
          INSERT INTO workflow_steps (
            id, workflow_template_id, name, description, step_type, assigned_role,
            estimated_days, "order", is_required, requires_approval,
            created_at
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()
          ) RETURNING id
        `, [
          workflowId,
          stage.name,
          stage.description,
          stage.stepType,
          'WORKER', // Default assigned role
          stage.estimatedDays,
          stage.order,
          stage.isRequired,
          stage.requiresApproval
        ]);

        const stageId = stageResult.rows[0].id;

        // Add document requirements
        if (stage.documentRequirements && stage.documentRequirements.length > 0) {
          for (const docReq of stage.documentRequirements) {
            await db.execute(`
              INSERT INTO document_requirements (
                id, workflow_step_id, title, description, is_required,
                accepted_file_types, max_file_size, submitted_by, "order",
                created_at
              ) VALUES (
                gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, NOW()
              )
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
          for (const checkItem of stage.checklist) {
            await db.execute(`
              INSERT INTO checklist_items (
                id, workflow_step_id, title, description, is_required,
                assigned_role, "order", created_at
              ) VALUES (
                gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW()
              )
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

      console.log(`   ✅ Added ${stages.length} stages to ${workflowName}`);
    }

    console.log('\n🎉 All workflow stages added successfully!\n');

    // Verify the results
    console.log('📊 Verifying enhanced workflows...\n');
    
    const enhancedWorkflows = await db.execute(`
      SELECT 
        wt.name,
        wt.estimated_duration_days,
        COUNT(ws.id) as stage_count,
        COUNT(dr.id) as document_count,
        COUNT(ci.id) as checklist_count
      FROM workflow_templates wt
      LEFT JOIN workflow_steps ws ON wt.id = ws.workflow_template_id
      LEFT JOIN document_requirements dr ON ws.id = dr.workflow_step_id
      LEFT JOIN checklist_items ci ON ws.id = ci.workflow_step_id
      WHERE wt.name IN ('Student Visa and Study Permit', 'Family Reunification Process', 'Romanian Citizenship Application')
      GROUP BY wt.id, wt.name, wt.estimated_duration_days
      ORDER BY wt.name
    `);

    enhancedWorkflows.rows.forEach((workflow, index) => {
      console.log(`${index + 1}. ${workflow.name}`);
      console.log(`   📅 Duration: ${workflow.estimated_duration_days} days`);
      console.log(`   📋 Stages: ${workflow.stage_count}`);
      console.log(`   📄 Documents: ${workflow.document_count}`);
      console.log(`   ✅ Checklist items: ${workflow.checklist_count}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error adding workflow stages:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the script
addWorkflowStages().catch(console.error);