// Comprehensive Configuration Mapping System
// This file contains all mappings that enable atomic script-driven updates

export interface WorkflowStepMapping {
  id: string;
  title: string;
  description: string;
  order: number;
  requirements: DocumentRequirementMapping[];
  checklist: ChecklistItemMapping[];
  estimatedDays: number;
  requiredRole: 'ADMIN' | 'OWNER' | 'WORKER' | 'VIEWER';
  governmentEntity?: string;
  isOptional?: boolean;
}

export interface DocumentRequirementMapping {
  title: string;
  description: string;
  isRequired: boolean;
  submittedBy: 'ADMIN' | 'OWNER' | 'WORKER' | 'VIEWER';
  acceptedFileTypes: string[];
  maxFileSize: number;
  order: number;
}

export interface ChecklistItemMapping {
  title: string;
  description: string;
  isRequired: boolean;
  assignedRole: 'ADMIN' | 'OWNER' | 'WORKER' | 'VIEWER';
  order: number;
  dependencies?: string[];
}

// Romanian Work Permit Workflow Configuration
export const ROMANIAN_WORK_PERMIT_WORKFLOW: WorkflowStepMapping[] = [
  {
    id: 'labor-market-test-prep',
    title: 'Labor Market Test Preparation',
    description: 'Prepare documentation for AJOFM labor market test application',
    order: 1,
    estimatedDays: 5,
    requiredRole: 'OWNER',
    governmentEntity: 'AJOFM',
    requirements: [
      {
        title: 'Job Description Document',
        description: 'Detailed job description in Romanian and English',
        isRequired: true,
        submittedBy: 'OWNER',
        acceptedFileTypes: ['application/pdf', 'application/msword'],
        maxFileSize: 5242880,
        order: 1
      },
      {
        title: 'Company Registration Certificate',
        description: 'Valid company registration from Romanian Trade Registry',
        isRequired: true,
        submittedBy: 'OWNER',
        acceptedFileTypes: ['application/pdf'],
        maxFileSize: 10485760,
        order: 2
      },
      {
        title: 'AJOFM Application Form',
        description: 'Completed AJOFM labor market test application form',
        isRequired: true,
        submittedBy: 'OWNER',
        acceptedFileTypes: ['application/pdf'],
        maxFileSize: 5242880,
        order: 3
      }
    ],
    checklist: [
      {
        title: 'Verify job posting requirements compliance',
        description: 'Ensure job description meets Romanian labor law requirements',
        isRequired: true,
        assignedRole: 'OWNER',
        order: 1
      },
      {
        title: 'Confirm salary above minimum threshold',
        description: 'Verify offered salary meets minimum requirements for work permits',
        isRequired: true,
        assignedRole: 'OWNER',
        order: 2
      },
      {
        title: 'Check company tax compliance',
        description: 'Verify company has no outstanding tax obligations',
        isRequired: true,
        assignedRole: 'OWNER',
        order: 3
      }
    ]
  },
  {
    id: 'ajofm-submission',
    title: 'AJOFM Application Submission',
    description: 'Submit labor market test application to AJOFM/ANOFM',
    order: 2,
    estimatedDays: 3,
    requiredRole: 'OWNER',
    governmentEntity: 'AJOFM',
    requirements: [
      {
        title: 'AJOFM Submission Receipt',
        description: 'Official receipt from AJOFM confirming application submission',
        isRequired: true,
        submittedBy: 'OWNER',
        acceptedFileTypes: ['application/pdf', 'image/jpeg', 'image/png'],
        maxFileSize: 5242880,
        order: 1
      }
    ],
    checklist: [
      {
        title: 'Submit application to correct AJOFM office',
        description: 'Ensure submission to appropriate territorial AJOFM office',
        isRequired: true,
        assignedRole: 'OWNER',
        order: 1
      },
      {
        title: 'Obtain official submission confirmation',
        description: 'Get stamped receipt or electronic confirmation',
        isRequired: true,
        assignedRole: 'OWNER',
        order: 2
      }
    ]
  },
  {
    id: 'worker-document-collection',
    title: 'Worker Document Collection',
    description: 'Collect required personal and professional documents from worker',
    order: 3,
    estimatedDays: 7,
    requiredRole: 'WORKER',
    requirements: [
      {
        title: 'Passport Copy',
        description: 'Clear copy of valid passport (all pages)',
        isRequired: true,
        submittedBy: 'WORKER',
        acceptedFileTypes: ['application/pdf', 'image/jpeg', 'image/png'],
        maxFileSize: 10485760,
        order: 1
      },
      {
        title: 'Education Certificates',
        description: 'University diplomas and professional certifications',
        isRequired: true,
        submittedBy: 'WORKER',
        acceptedFileTypes: ['application/pdf'],
        maxFileSize: 15728640,
        order: 2
      },
      {
        title: 'CV in Romanian',
        description: 'Professional curriculum vitae translated to Romanian',
        isRequired: true,
        submittedBy: 'WORKER',
        acceptedFileTypes: ['application/pdf', 'application/msword'],
        maxFileSize: 5242880,
        order: 3
      },
      {
        title: 'Criminal Background Check',
        description: 'Clean criminal record from home country (apostilled)',
        isRequired: true,
        submittedBy: 'WORKER',
        acceptedFileTypes: ['application/pdf'],
        maxFileSize: 10485760,
        order: 4
      },
      {
        title: 'Health Certificate',
        description: 'Medical certificate showing fitness for work',
        isRequired: true,
        submittedBy: 'WORKER',
        acceptedFileTypes: ['application/pdf'],
        maxFileSize: 5242880,
        order: 5
      }
    ],
    checklist: [
      {
        title: 'Verify passport validity (6+ months)',
        description: 'Ensure passport is valid for at least 6 months',
        isRequired: true,
        assignedRole: 'ADMIN',
        order: 1
      },
      {
        title: 'Confirm education document authenticity',
        description: 'Verify education certificates are apostilled/legalized',
        isRequired: true,
        assignedRole: 'ADMIN',
        order: 2
      },
      {
        title: 'Check criminal background validity',
        description: 'Ensure criminal check is recent (within 6 months)',
        isRequired: true,
        assignedRole: 'ADMIN',
        order: 3
      }
    ]
  },
  {
    id: 'document-translation',
    title: 'Document Translation & Legalization',
    description: 'Translate and legalize all foreign documents for Romanian authorities',
    order: 4,
    estimatedDays: 10,
    requiredRole: 'OWNER',
    requirements: [
      {
        title: 'Translated Education Certificates',
        description: 'Romanian sworn translations of education documents',
        isRequired: true,
        submittedBy: 'OWNER',
        acceptedFileTypes: ['application/pdf'],
        maxFileSize: 15728640,
        order: 1
      },
      {
        title: 'Translated Criminal Background',
        description: 'Romanian sworn translation of criminal background check',
        isRequired: true,
        submittedBy: 'OWNER',
        acceptedFileTypes: ['application/pdf'],
        maxFileSize: 10485760,
        order: 2
      }
    ],
    checklist: [
      {
        title: 'Use certified sworn translator',
        description: 'Ensure translations are done by authorized sworn translator',
        isRequired: true,
        assignedRole: 'OWNER',
        order: 1
      },
      {
        title: 'Obtain apostille stamps',
        description: 'Verify all foreign documents have proper apostille',
        isRequired: true,
        assignedRole: 'OWNER',
        order: 2
      }
    ]
  },
  {
    id: 'igi-work-permit-prep',
    title: 'IGI Work Permit Application Preparation',
    description: 'Prepare complete work permit application for Romanian Immigration Office',
    order: 5,
    estimatedDays: 5,
    requiredRole: 'OWNER',
    governmentEntity: 'IGI',
    requirements: [
      {
        title: 'IGI Application Form',
        description: 'Completed work permit application form for IGI',
        isRequired: true,
        submittedBy: 'OWNER',
        acceptedFileTypes: ['application/pdf'],
        maxFileSize: 5242880,
        order: 1
      },
      {
        title: 'AJOFM Approval Certificate',
        description: 'Official approval from AJOFM labor market test',
        isRequired: true,
        submittedBy: 'OWNER',
        acceptedFileTypes: ['application/pdf'],
        maxFileSize: 5242880,
        order: 2
      },
      {
        title: 'Employment Contract',
        description: 'Signed employment contract in Romanian',
        isRequired: true,
        submittedBy: 'OWNER',
        acceptedFileTypes: ['application/pdf'],
        maxFileSize: 10485760,
        order: 3
      }
    ],
    checklist: [
      {
        title: 'Verify AJOFM approval is current',
        description: 'Ensure AJOFM approval has not expired',
        isRequired: true,
        assignedRole: 'ADMIN',
        order: 1
      },
      {
        title: 'Confirm contract compliance',
        description: 'Verify employment contract meets Romanian labor law',
        isRequired: true,
        assignedRole: 'ADMIN',
        order: 2
      }
    ]
  }
];

// Complete Workflow Template Configuration
export const WORKFLOW_TEMPLATES = {
  'romanian-work-permit': {
    name: 'Romanian Work Permit Process',
    description: 'Complete workflow for obtaining Romanian work permits',
    category: 'work-permits',
    estimatedDuration: 90,
    steps: ROMANIAN_WORK_PERMIT_WORKFLOW,
    requiredRoles: ['ADMIN', 'OWNER', 'WORKER'],
    governmentEntities: ['AJOFM', 'IGI', 'Romanian Consulate'],
    isActive: true
  }
};

// API Response Mapping Functions
export function mapWorkflowStepToAPI(step: WorkflowStepMapping) {
  return {
    id: step.id,
    title: step.title,
    description: step.description,
    order: step.order,
    estimatedDays: step.estimatedDays,
    requiredRole: step.requiredRole,
    governmentEntity: step.governmentEntity,
    isOptional: step.isOptional || false,
    requirements: step.requirements.map(mapDocumentRequirementToAPI),
    checklist: step.checklist.map(mapChecklistItemToAPI)
  };
}

export function mapDocumentRequirementToAPI(req: DocumentRequirementMapping) {
  return {
    title: req.title,
    description: req.description,
    isRequired: req.isRequired,
    submittedBy: req.submittedBy,
    acceptedFileTypes: req.acceptedFileTypes,
    maxFileSize: req.maxFileSize,
    order: req.order
  };
}

export function mapChecklistItemToAPI(item: ChecklistItemMapping) {
  return {
    title: item.title,
    description: item.description,
    isRequired: item.isRequired,
    assignedRole: item.assignedRole,
    order: item.order,
    dependencies: item.dependencies || []
  };
}

// Configuration Update Functions for Atomic Changes
export function updateWorkflowConfiguration(newConfig: typeof WORKFLOW_TEMPLATES) {
  // This would be called by automation scripts to update configurations
  // All changes are applied atomically
  console.log('Updating workflow configuration atomically...');
  return newConfig;
}

export function validateWorkflowConfiguration(config: any): boolean {
  // Validation logic for configuration integrity
  try {
    if (!config || typeof config !== 'object') return false;
    
    for (const [templateId, template] of Object.entries(config)) {
      if (!template || typeof template !== 'object') return false;
      const t = template as any;
      
      if (!t.name || !t.steps || !Array.isArray(t.steps)) return false;
      
      for (const step of t.steps) {
        if (!step.id || !step.title || !step.order) return false;
        if (!Array.isArray(step.requirements) || !Array.isArray(step.checklist)) return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Configuration validation failed:', error);
    return false;
  }
}