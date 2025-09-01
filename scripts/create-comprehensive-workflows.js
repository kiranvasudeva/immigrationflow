#!/usr/bin/env node

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000';

// Comprehensive immigration workflows for Romania based on real immigration law
const immigrationWorkflows = [
  {
    name: 'Student Visa and Study Permit',
    description: 'Complete student visa process from admission to residence permit for studies',
    order: 2,
    estimatedDurationDays: 120,
    steps: [
      {
        name: 'University Admission and Confirmation Letter',
        description: 'Obtain official admission letter from Romanian educational institution',
        stepType: 'DOCUMENT_COLLECTION',
        assignedRole: 'OWNER',
        order: 1,
        estimatedDays: 14,
        documentRequirements: [
          {
            title: 'University Admission Letter',
            description: 'Official acceptance letter from accredited Romanian university',
            isRequired: true,
            submittedBy: 'OWNER',
            acceptedFileTypes: ['pdf', 'jpg', 'png']
          },
          {
            title: 'Academic Transcripts (Apostilled)',
            description: 'Official transcripts with apostille/consular legalization',
            isRequired: true,
            submittedBy: 'OWNER',
            acceptedFileTypes: ['pdf']
          },
          {
            title: 'Diploma/Certificate (Apostilled)',
            description: 'Previous education diploma with apostille certification',
            isRequired: true,
            submittedBy: 'OWNER',
            acceptedFileTypes: ['pdf']
          }
        ],
        checklistItems: [
          {
            title: 'Verify university accreditation with ARACIS',
            description: 'Confirm institution is officially recognized',
            isRequired: true,
            assignedRole: 'WORKER'
          },
          {
            title: 'Check admission letter authenticity',
            description: 'Verify letter format and university seal',
            isRequired: true,
            assignedRole: 'WORKER'
          }
        ]
      },
      {
        name: 'Student Visa Application at Consulate',
        description: 'Submit student visa application at Romanian consulate',
        stepType: 'INSTITUTIONAL_SUBMISSION',
        assignedRole: 'WORKER',
        order: 2,
        estimatedDays: 21,
        documentRequirements: [
          {
            title: 'Completed Visa Application Form',
            description: 'Official Romanian visa application form properly filled',
            isRequired: true,
            submittedBy: 'WORKER',
            acceptedFileTypes: ['pdf']
          },
          {
            title: 'Financial Guarantee Documents',
            description: 'Bank statements or scholarship proof for minimum €300/month',
            isRequired: true,
            submittedBy: 'OWNER',
            acceptedFileTypes: ['pdf']
          },
          {
            title: 'Medical Insurance Certificate',
            description: 'Health insurance valid in Romania for entire study period',
            isRequired: true,
            submittedBy: 'OWNER',
            acceptedFileTypes: ['pdf']
          }
        ],
        checklistItems: [
          {
            title: 'Schedule consulate appointment',
            description: 'Book appointment at Romanian consulate/embassy',
            isRequired: true,
            assignedRole: 'WORKER'
          },
          {
            title: 'Submit biometric data',
            description: 'Fingerprints and photo at consulate',
            isRequired: true,
            assignedRole: 'OWNER'
          }
        ]
      },
      {
        name: 'Entry to Romania and Registration',
        description: 'Enter Romania and complete initial student registration',
        stepType: 'DOCUMENT_REVIEW',
        assignedRole: 'OWNER',
        order: 3,
        estimatedDays: 7,
        documentRequirements: [
          {
            title: 'Entry Stamp Documentation',
            description: 'Passport entry stamp and arrival confirmation',
            isRequired: true,
            submittedBy: 'OWNER',
            acceptedFileTypes: ['jpg', 'png', 'pdf']
          },
          {
            title: 'Temporary Address Registration',
            description: 'Registration at local police station within 3 days',
            isRequired: true,
            submittedBy: 'OWNER',
            acceptedFileTypes: ['pdf']
          }
        ]
      },
      {
        name: 'University Enrollment Completion',
        description: 'Complete enrollment at Romanian university',
        stepType: 'FORM_COMPLETION',
        assignedRole: 'OWNER',
        order: 4,
        estimatedDays: 10,
        documentRequirements: [
          {
            title: 'University Enrollment Certificate',
            description: 'Official enrollment confirmation from university',
            isRequired: true,
            submittedBy: 'OWNER',
            acceptedFileTypes: ['pdf']
          },
          {
            title: 'Student ID Card',
            description: 'University-issued student identification',
            isRequired: true,
            submittedBy: 'OWNER',
            acceptedFileTypes: ['jpg', 'png']
          }
        ]
      },
      {
        name: 'Study Residence Permit Application',
        description: 'Apply for long-term study residence permit at IGI',
        stepType: 'INSTITUTIONAL_SUBMISSION',
        assignedRole: 'WORKER',
        order: 5,
        estimatedDays: 30,
        documentRequirements: [
          {
            title: 'IGI Residence Permit Application',
            description: 'Completed application for study residence permit',
            isRequired: true,
            submittedBy: 'WORKER',
            acceptedFileTypes: ['pdf']
          },
          {
            title: 'Academic Progress Documentation',
            description: 'Proof of academic enrollment and good standing',
            isRequired: true,
            submittedBy: 'OWNER',
            acceptedFileTypes: ['pdf']
          }
        ],
        checklistItems: [
          {
            title: 'Submit to IGI regional office',
            description: 'File application at appropriate IGI office',
            isRequired: true,
            assignedRole: 'WORKER'
          },
          {
            title: 'Pay residence permit fees',
            description: 'Complete payment of IGI processing fees',
            isRequired: true,
            assignedRole: 'OWNER'
          }
        ]
      },
      {
        name: 'Study Residence Permit Issuance',
        description: 'Receive and validate study residence permit',
        stepType: 'ADMIN_APPROVAL',
        assignedRole: 'WORKER',
        order: 6,
        estimatedDays: 14,
        documentRequirements: [
          {
            title: 'Study Residence Permit Card',
            description: 'Physical residence permit card from IGI',
            isRequired: true,
            submittedBy: 'OWNER',
            acceptedFileTypes: ['jpg', 'png', 'pdf']
          }
        ],
        checklistItems: [
          {
            title: 'Verify permit validity dates',
            description: 'Check permit covers entire study period',
            isRequired: true,
            assignedRole: 'WORKER'
          },
          {
            title: 'Register permit with university',
            description: 'Submit copy to university administration',
            isRequired: true,
            assignedRole: 'OWNER'
          }
        ]
      }
    ]
  },
  {
    name: 'Family Reunification Process',
    description: 'Family member reunification with EU citizen or Romanian resident',
    order: 3,
    estimatedDurationDays: 90,
    steps: [
      {
        name: 'Relationship Documentation and Legalization',
        description: 'Gather and legalize all family relationship documents',
        stepType: 'DOCUMENT_COLLECTION',
        assignedRole: 'OWNER',
        order: 1,
        estimatedDays: 21,
        documentRequirements: [
          {
            title: 'Marriage Certificate (Apostilled)',
            description: 'Official marriage certificate with apostille',
            isRequired: true,
            submittedBy: 'OWNER',
            acceptedFileTypes: ['pdf']
          },
          {
            title: 'Birth Certificates of Children (Apostilled)',
            description: 'Birth certificates for all dependent children',
            isRequired: false,
            submittedBy: 'OWNER',
            acceptedFileTypes: ['pdf']
          },
          {
            title: 'Sponsor EU/Romanian Residence Documentation',
            description: 'Proof of sponsor\'s legal residence in Romania',
            isRequired: true,
            submittedBy: 'OWNER',
            acceptedFileTypes: ['pdf', 'jpg']
          }
        ],
        checklistItems: [
          {
            title: 'Verify document apostille validity',
            description: 'Check all international documents have proper apostille',
            isRequired: true,
            assignedRole: 'WORKER'
          },
          {
            title: 'Translate documents to Romanian',
            description: 'Official Romanian translation by authorized translator',
            isRequired: true,
            assignedRole: 'WORKER'
          }
        ]
      },
      {
        name: 'Financial Support Documentation',
        description: 'Prove sponsor can financially support family members',
        stepType: 'DOCUMENT_COLLECTION',
        assignedRole: 'OWNER',
        order: 2,
        estimatedDays: 14,
        documentRequirements: [
          {
            title: 'Sponsor Income Statements',
            description: 'Last 6 months salary statements or business income',
            isRequired: true,
            submittedBy: 'OWNER',
            acceptedFileTypes: ['pdf']
          },
          {
            title: 'Bank Account Statements',
            description: 'Bank statements showing financial stability',
            isRequired: true,
            submittedBy: 'OWNER',
            acceptedFileTypes: ['pdf']
          },
          {
            title: 'Housing Documentation',
            description: 'Proof of adequate housing for family members',
            isRequired: true,
            submittedBy: 'OWNER',
            acceptedFileTypes: ['pdf']
          }
        ]
      },
      {
        name: 'Family Reunification Visa Application',
        description: 'Submit family reunification visa at Romanian consulate',
        stepType: 'INSTITUTIONAL_SUBMISSION',
        assignedRole: 'WORKER',
        order: 3,
        estimatedDays: 30,
        documentRequirements: [
          {
            title: 'Family Reunification Application Forms',
            description: 'Completed application forms for each family member',
            isRequired: true,
            submittedBy: 'WORKER',
            acceptedFileTypes: ['pdf']
          },
          {
            title: 'Medical Certificates',
            description: 'Health certificates for all family members',
            isRequired: true,
            submittedBy: 'OWNER',
            acceptedFileTypes: ['pdf']
          }
        ],
        checklistItems: [
          {
            title: 'Submit applications at consulate',
            description: 'File applications at Romanian consulate/embassy',
            isRequired: true,
            assignedRole: 'WORKER'
          },
          {
            title: 'Pay consular fees for all applicants',
            description: 'Complete fee payment for each family member',
            isRequired: true,
            assignedRole: 'OWNER'
          }
        ]
      },
      {
        name: 'Entry and Temporary Registration',
        description: 'Family entry to Romania and temporary registration',
        stepType: 'DOCUMENT_REVIEW',
        assignedRole: 'OWNER',
        order: 4,
        estimatedDays: 7,
        documentRequirements: [
          {
            title: 'Entry Documentation for All Members',
            description: 'Passport stamps and entry confirmations',
            isRequired: true,
            submittedBy: 'OWNER',
            acceptedFileTypes: ['jpg', 'png', 'pdf']
          },
          {
            title: 'Temporary Address Registration',
            description: 'Registration of all family members at local police',
            isRequired: true,
            submittedBy: 'OWNER',
            acceptedFileTypes: ['pdf']
          }
        ]
      },
      {
        name: 'Family Residence Permit Application',
        description: 'Apply for family residence permits at IGI',
        stepType: 'INSTITUTIONAL_SUBMISSION',
        assignedRole: 'WORKER',
        order: 5,
        estimatedDays: 30,
        documentRequirements: [
          {
            title: 'IGI Family Residence Applications',
            description: 'Individual residence permit applications for each member',
            isRequired: true,
            submittedBy: 'WORKER',
            acceptedFileTypes: ['pdf']
          },
          {
            title: 'Updated Financial Documentation',
            description: 'Current proof of sponsor\'s financial capacity',
            isRequired: true,
            submittedBy: 'OWNER',
            acceptedFileTypes: ['pdf']
          }
        ],
        checklistItems: [
          {
            title: 'Submit applications to IGI',
            description: 'File all family applications at IGI office',
            isRequired: true,
            assignedRole: 'WORKER'
          },
          {
            title: 'Complete biometric enrollment',
            description: 'Biometric data collection for all family members',
            isRequired: true,
            assignedRole: 'OWNER'
          }
        ]
      },
      {
        name: 'Family Residence Permits Issuance',
        description: 'Receive family residence permit cards',
        stepType: 'ADMIN_APPROVAL',
        assignedRole: 'WORKER',
        order: 6,
        estimatedDays: 14,
        documentRequirements: [
          {
            title: 'Family Residence Permit Cards',
            description: 'Physical residence permit cards for all family members',
            isRequired: true,
            submittedBy: 'OWNER',
            acceptedFileTypes: ['jpg', 'png', 'pdf']
          }
        ],
        checklistItems: [
          {
            title: 'Verify all permit validity dates',
            description: 'Check permits are issued for correct periods',
            isRequired: true,
            assignedRole: 'WORKER'
          },
          {
            title: 'Register family with local authorities',
            description: 'Complete family registration at town hall',
            isRequired: true,
            assignedRole: 'OWNER'
          }
        ]
      }
    ]
  },
  {
    name: 'Romanian Citizenship Application',
    description: 'Romanian citizenship acquisition through naturalization or restoration',
    order: 4,
    estimatedDurationDays: 365,
    steps: [
      {
        name: 'Eligibility Assessment and Documentation',
        description: 'Assess citizenship eligibility and gather required documents',
        stepType: 'DOCUMENT_REVIEW',
        assignedRole: 'WORKER',
        order: 1,
        estimatedDays: 30,
        documentRequirements: [
          {
            title: 'Continuous Residence Proof',
            description: 'Evidence of 8 years continuous legal residence in Romania',
            isRequired: true,
            submittedBy: 'OWNER',
            acceptedFileTypes: ['pdf']
          },
          {
            title: 'Romanian Language Certificate',
            description: 'B1 level Romanian language certificate from authorized institution',
            isRequired: true,
            submittedBy: 'OWNER',
            acceptedFileTypes: ['pdf']
          },
          {
            title: 'Clean Criminal Record (Romanian)',
            description: 'Criminal record extract from Romanian authorities',
            isRequired: true,
            submittedBy: 'WORKER',
            acceptedFileTypes: ['pdf']
          }
        ],
        checklistItems: [
          {
            title: 'Verify residence period calculation',
            description: 'Confirm continuous 8-year residence requirement is met',
            isRequired: true,
            assignedRole: 'WORKER'
          },
          {
            title: 'Check language certificate validity',
            description: 'Verify certificate is from authorized Romanian institution',
            isRequired: true,
            assignedRole: 'WORKER'
          }
        ]
      },
      {
        name: 'International Documentation Collection',
        description: 'Obtain and legalize documents from country of origin',
        stepType: 'DOCUMENT_COLLECTION',
        assignedRole: 'OWNER',
        order: 2,
        estimatedDays: 45,
        documentRequirements: [
          {
            title: 'Birth Certificate (Apostilled)',
            description: 'Official birth certificate with apostille from origin country',
            isRequired: true,
            submittedBy: 'OWNER',
            acceptedFileTypes: ['pdf']
          },
          {
            title: 'International Criminal Record',
            description: 'Clean criminal record from all countries of residence',
            isRequired: true,
            submittedBy: 'OWNER',
            acceptedFileTypes: ['pdf']
          },
          {
            title: 'Current Passport and Visa History',
            description: 'Valid passport with complete visa/entry history',
            isRequired: true,
            submittedBy: 'OWNER',
            acceptedFileTypes: ['pdf', 'jpg']
          }
        ],
        checklistItems: [
          {
            title: 'Verify apostille authenticity',
            description: 'Check all international documents have valid apostilles',
            isRequired: true,
            assignedRole: 'WORKER'
          },
          {
            title: 'Complete Romanian translations',
            description: 'Authorize Romanian translation of all foreign documents',
            isRequired: true,
            assignedRole: 'WORKER'
          }
        ]
      },
      {
        name: 'Financial and Social Integration Evidence',
        description: 'Document financial stability and social integration in Romania',
        stepType: 'DOCUMENT_COLLECTION',
        assignedRole: 'OWNER',
        order: 3,
        estimatedDays: 21,
        documentRequirements: [
          {
            title: 'Employment History in Romania',
            description: 'Complete employment record for residence period',
            isRequired: true,
            submittedBy: 'OWNER',
            acceptedFileTypes: ['pdf']
          },
          {
            title: 'Tax Payment Documentation',
            description: 'Tax declarations and payment proof for 8 years',
            isRequired: true,
            submittedBy: 'OWNER',
            acceptedFileTypes: ['pdf']
          },
          {
            title: 'Property or Rental Documentation',
            description: 'Proof of stable housing throughout residence period',
            isRequired: true,
            submittedBy: 'OWNER',
            acceptedFileTypes: ['pdf']
          },
          {
            title: 'Social Integration Evidence',
            description: 'Proof of community involvement, volunteering, or social activities',
            isRequired: false,
            submittedBy: 'OWNER',
            acceptedFileTypes: ['pdf', 'jpg']
          }
        ]
      },
      {
        name: 'Citizenship Application Submission',
        description: 'Submit complete citizenship application to ANR',
        stepType: 'INSTITUTIONAL_SUBMISSION',
        assignedRole: 'WORKER',
        order: 4,
        estimatedDays: 14,
        documentRequirements: [
          {
            title: 'Completed ANR Citizenship Application',
            description: 'Official citizenship application form properly completed',
            isRequired: true,
            submittedBy: 'WORKER',
            acceptedFileTypes: ['pdf']
          },
          {
            title: 'Supporting Documentation Portfolio',
            description: 'Complete file with all required supporting documents',
            isRequired: true,
            submittedBy: 'WORKER',
            acceptedFileTypes: ['pdf']
          }
        ],
        checklistItems: [
          {
            title: 'Submit to ANR territorial office',
            description: 'File application at appropriate ANR office',
            isRequired: true,
            assignedRole: 'WORKER'
          },
          {
            title: 'Pay citizenship application fees',
            description: 'Complete payment of ANR processing fees',
            isRequired: true,
            assignedRole: 'OWNER'
          },
          {
            title: 'Obtain receipt and tracking number',
            description: 'Secure official receipt with case tracking information',
            isRequired: true,
            assignedRole: 'WORKER'
          }
        ]
      },
      {
        name: 'ANR Review and Investigation Period',
        description: 'ANR conducts background investigation and file review',
        stepType: 'ADMIN_APPROVAL',
        assignedRole: 'WORKER',
        order: 5,
        estimatedDays: 240,
        documentRequirements: [
          {
            title: 'ANR Additional Document Requests',
            description: 'Any additional documents requested by ANR during review',
            isRequired: false,
            submittedBy: 'OWNER',
            acceptedFileTypes: ['pdf']
          }
        ],
        checklistItems: [
          {
            title: 'Monitor application status',
            description: 'Regular check of application progress with ANR',
            isRequired: true,
            assignedRole: 'WORKER'
          },
          {
            title: 'Respond to ANR requests promptly',
            description: 'Provide any additional requested documentation quickly',
            isRequired: true,
            assignedRole: 'WORKER'
          }
        ]
      },
      {
        name: 'Citizenship Decision and Oath Ceremony',
        description: 'Receive citizenship decision and complete oath ceremony',
        stepType: 'ADMIN_APPROVAL',
        assignedRole: 'OWNER',
        order: 6,
        estimatedDays: 30,
        documentRequirements: [
          {
            title: 'ANR Citizenship Approval Decision',
            description: 'Official ANR decision granting Romanian citizenship',
            isRequired: true,
            submittedBy: 'OWNER',
            acceptedFileTypes: ['pdf']
          },
          {
            title: 'Oath Ceremony Completion Certificate',
            description: 'Certificate of completed citizenship oath ceremony',
            isRequired: true,
            submittedBy: 'OWNER',
            acceptedFileTypes: ['pdf', 'jpg']
          },
          {
            title: 'Romanian Birth Certificate',
            description: 'New Romanian birth certificate issued after citizenship',
            isRequired: true,
            submittedBy: 'OWNER',
            acceptedFileTypes: ['pdf']
          }
        ],
        checklistItems: [
          {
            title: 'Attend mandatory oath ceremony',
            description: 'Participate in official citizenship oath ceremony',
            isRequired: true,
            assignedRole: 'OWNER'
          },
          {
            title: 'Apply for Romanian passport',
            description: 'Submit application for Romanian passport',
            isRequired: false,
            assignedRole: 'OWNER'
          },
          {
            title: 'Register with electoral authority',
            description: 'Register for voting rights as Romanian citizen',
            isRequired: false,
            assignedRole: 'OWNER'
          }
        ]
      }
    ]
  }
];

async function createWorkflows() {
  console.log('Creating comprehensive immigration workflows...');
  
  try {
    for (const workflow of immigrationWorkflows) {
      console.log(`\\n📋 Creating workflow: ${workflow.name}`);
      
      const response = await fetch(`${API_BASE}/api/workflow-templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workflow)
      });
      
      if (!response.ok) {
        const error = await response.text();
        console.error(`❌ Failed to create ${workflow.name}: ${error}`);
        continue;
      }
      
      const result = await response.json();
      console.log(`✅ Successfully created workflow: ${result.name}`);
      console.log(`   - ${result.steps ? result.steps.length : 0} steps defined`);
      console.log(`   - Estimated duration: ${result.estimatedDurationDays} days`);
    }
    
    console.log('\\n🎉 All workflows created successfully!');
    
    // Verify by listing all workflows
    console.log('\\n📊 Verifying created workflows...');
    const listResponse = await fetch(`${API_BASE}/api/workflow-templates`);
    
    if (listResponse.ok) {
      const workflows = await listResponse.json();
      console.log(`\\n📋 Total workflows in system: ${workflows.length}`);
      workflows.forEach((w, index) => {
        console.log(`${index + 1}. ${w.name} (${w.steps ? w.steps.length : 0} steps, ${w.estimatedDurationDays} days)`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error creating workflows:', error.message);
  }
}

createWorkflows();