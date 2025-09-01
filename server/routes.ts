// Clean fixed version of routes.ts with proper syntax
import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import { setupCORS } from "./middleware/security";
import { auditMiddleware } from "./middleware/auth";
import { requireRole, devRbacBypass } from "./middleware/rbac";
import { storage } from "./storage";
import { db } from "./db";
import { sql, eq, like, count, isNotNull } from "drizzle-orm";
import { users, clientProfiles, workers, stages, assignments, sessions, requirements, documentFiles, auditLogs } from "../shared/schema";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupSecurityHeaders, createRateLimiter, validateInput, createEmergencyAdminAccess } from "./middleware/security";
import { createStructuredLogger, performanceMonitoring, errorTracking, setupHealthChecks } from "./middleware/monitoring";
import { ROMANIAN_WORK_PERMIT_WORKFLOW, mapWorkflowStepToAPI } from "./config/mapping";

let devAuthBypass: any;

export async function registerRoutes(app: Express): Promise<Server> {
  // Production configuration will be added once app is working
  // setupProductionSecurity(app);
  
  // Production security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'");
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // Set up authentication
  await setupAuth(app);

  // Development auth bypass (only in development)
  if (process.env.NODE_ENV === 'development') {
    devAuthBypass = (req: any, res: any, next: any) => {
      req.user = { 
        id: 'dev-user', 
        claims: { sub: 'dev-user' },
        roles: ['ADMIN'] 
      };
      next();
    };
  } else {
    devAuthBypass = isAuthenticated;
  }

  // Basic test route
  app.get('/test', (req, res) => {
    res.json({ message: 'Server is working' });
  });

  // User authentication status endpoint
  app.get('/api/auth/user', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const userClaims = (req.user as any).claims;
      if (!userClaims?.email) {
        return res.status(401).json({ message: 'Invalid user session' });
      }

      // Get user from database
      const user = await storage.getUserByEmail(userClaims.email);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      console.error('Error getting user:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Client logs endpoint for comprehensive monitoring
  app.post('/api/client-logs', express.json({ limit: '10mb' }), (req, res) => {
    try {
      const { logs, user, timestamp } = req.body;
      
      if (!logs) {
        return res.status(400).json({ error: 'Invalid logs data' });
      }

      const logTypes = ['errors', 'stateChanges', 'network', 'translations', 'performance'];
      let totalLogs = 0;

      logTypes.forEach(type => {
        if (logs[type] && Array.isArray(logs[type])) {
          logs[type].forEach((log: any) => {
            const logMessage = `[CLIENT-${type.toUpperCase()}] ${log.timestamp}`;
            const logData = {
              ...log,
              clientUser: user,
              batchTimestamp: timestamp
            };

            switch (type) {
              case 'errors':
                console.error(`🔴 ${logMessage}`, logData);
                break;
              case 'stateChanges':
                console.debug(`🔄 ${logMessage}`, logData);
                break;
              case 'network':
                if (log.error) {
                  console.error(`🌐❌ ${logMessage}`, logData);
                } else {
                  console.info(`🌐 ${logMessage}`, logData);
                }
                break;
              case 'translations':
                if (log.error) {
                  console.error(`🌍❌ ${logMessage}`, logData);
                } else if (log.fallback) {
                  console.warn(`🌍⚠️ ${logMessage}`, logData);
                } else {
                  console.debug(`🌍 ${logMessage}`, logData);
                }
                break;
              case 'performance':
                console.info(`⚡ ${logMessage}`, logData);
                break;
            }
            totalLogs++;
          });
        }
      });

      res.status(200).json({ 
        received: totalLogs,
        message: 'Client logs processed successfully',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      const err = error as Error;
      console.error('🔴 Error processing client logs:', err.message);
      res.status(500).json({ error: 'Failed to process client logs' });
    }
  });

  // Stages API endpoint - accessible to ADMIN, OWNER, WORKER (all authenticated users need stages)
  app.get('/api/stages', isAuthenticated, requireRole('ADMIN', 'OWNER', 'WORKER'), async (req: any, res) => {
    try {
      const stages = await storage.getAllStages();
      res.json(stages);
    } catch (error) {
      console.error('Error fetching stages:', error);
      res.status(500).json({ message: "Failed to fetch stages" });
    }
  });

  // Workers API endpoint - only ADMIN and OWNER can view all workers
  app.get('/api/workers', isAuthenticated, requireRole('ADMIN', 'OWNER'), async (req: any, res) => {
    try {
      const workers = await storage.getAllWorkers();
      res.json(workers);
    } catch (error) {
      console.error('Error fetching workers:', error);
      res.status(500).json({ message: "Failed to fetch workers" });
    }
  });

  // Client workers API endpoint - get workers for a specific client
  app.get('/api/clients/:clientId/workers', isAuthenticated, requireRole('ADMIN', 'OWNER'), async (req: any, res) => {
    try {
      const { clientId } = req.params;
      const workers = await storage.getWorkersByClientId(clientId);
      res.json(workers);
    } catch (error) {
      console.error('Error fetching client workers:', error);
      res.status(500).json({ message: "Failed to fetch client workers" });
    }
  });

  // Clients API endpoint - only ADMIN and OWNER can view all clients
  app.get('/api/clients', isAuthenticated, requireRole('ADMIN', 'OWNER'), async (req: any, res) => {
    try {
      const clients = await storage.getAllClientProfiles();
      res.json(clients);
    } catch (error) {
      console.error('Error fetching clients:', error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  // Dashboard stats API endpoint - only ADMIN and OWNER can view dashboard stats
  app.get('/api/dashboard/stats', isAuthenticated, requireRole('ADMIN', 'OWNER'), async (req: any, res) => {
    try {
      const [workers, clients, assignments] = await Promise.all([
        storage.getAllWorkers(),
        storage.getAllClientProfiles(),
        storage.getAllAssignments()
      ]);

      const stats = {
        totalWorkers: workers.length,
        totalClients: clients.length,
        totalAssignments: assignments.length,
        activeAssignments: assignments.filter(a => a.status !== 'ACCEPTED').length,
        completedAssignments: assignments.filter(a => a.status === 'ACCEPTED').length,
        pendingAssignments: assignments.filter(a => a.status === 'AWAITING_UPLOAD' || a.status === 'NOT_STARTED').length
      };

      res.json(stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Dashboard assignments API endpoint - only ADMIN and OWNER can view all assignments
  app.get('/api/dashboard/assignments', isAuthenticated, requireRole('ADMIN', 'OWNER'), async (req: any, res) => {
    try {
      const assignments = await storage.getAllAssignments();
      res.json(assignments);
    } catch (error) {
      console.error('Error fetching dashboard assignments:', error);
      res.status(500).json({ message: "Failed to fetch dashboard assignments" });
    }
  });

  // Workflow templates route - accessible to ADMIN, OWNER, WORKER (all authenticated users need workflow templates)
  app.get('/api/workflow/templates', isAuthenticated, requireRole('ADMIN', 'OWNER', 'WORKER'), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      // Use configuration-driven workflow data instead of hardcoded data
      const workflowDefinitions = [
        {
          id: 'work-permit-initial',
          name: 'Initial Work Permit Application',
          description: 'Complete Romanian work permit application process from AJOFM labor market test through IGI permit issuance',
          stages: ROMANIAN_WORK_PERMIT_WORKFLOW.map(mapWorkflowStepToAPI)
        },
        {
          id: 'residence-permit-temp',
          name: 'Temporary Residence Permit',
          description: 'Romanian temporary residence permit application process',
          stages: ROMANIAN_WORK_PERMIT_WORKFLOW.map(mapWorkflowStepToAPI)
        },
        {
          id: 'work-permit-renewal',
          name: 'Work Permit Renewal',
          description: 'Renewal process for existing work permits and residence cards',
          stages: ROMANIAN_WORK_PERMIT_WORKFLOW.map(mapWorkflowStepToAPI)
        }
      ];
      
      res.json(workflowDefinitions);
    } catch (error) {
      console.error('Error fetching workflow templates:', error);
      res.status(500).json({ message: "Failed to fetch workflow templates" });
    }
  });

  // Workflow Templates CRUD API endpoints
  app.get('/api/workflow-templates', isAuthenticated, requireRole('ADMIN', 'OWNER'), async (req: any, res) => {
    try {
      // Disable caching to ensure fresh data
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      const templates = await storage.getAllWorkflowTemplates();
      res.json(templates);
    } catch (error) {
      console.error('Error fetching workflow templates:', error);
      res.status(500).json({ message: "Failed to fetch workflow templates" });
    }
  });

  app.get('/api/workflow-templates/:id', isAuthenticated, requireRole('ADMIN', 'OWNER'), async (req: any, res) => {
    try {
      const template = await storage.getWorkflowTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ message: "Workflow template not found" });
      }
      res.json(template);
    } catch (error) {
      console.error('Error fetching workflow template:', error);
      res.status(500).json({ message: "Failed to fetch workflow template" });
    }
  });

  app.post('/api/workflow-templates', isAuthenticated, requireRole('ADMIN', 'OWNER'), async (req: any, res) => {
    try {
      const userId = req.user.id || req.user.claims?.sub || 'dev-user';
      
      // Prepare template data with required fields
      const templateData = {
        name: req.body.name,
        description: req.body.description || '',
        isActive: req.body.isActive !== undefined ? req.body.isActive : true,
        order: req.body.order || 1,
        executionType: req.body.executionType || 'sequential',
        estimatedDurationDays: req.body.estimatedDurationDays || 30,
        createdByUserId: userId
      };
      
      console.log('Creating workflow template with data:', templateData);
      const template = await storage.createWorkflowTemplate(templateData);
      
      // Create workflow steps if provided
      if (req.body.steps && Array.isArray(req.body.steps)) {
        for (const step of req.body.steps) {
          const stepData = {
            workflowTemplateId: template.id,
            name: step.name,
            description: step.description || '',
            stepType: step.stepType,
            assignedRole: step.assignedRole,
            order: step.order,
            estimatedDays: step.estimatedDays || 1,
            isRequired: step.isRequired !== undefined ? step.isRequired : true,
            requiresApproval: step.requiresApproval || false,
            approverRole: step.approverRole || null,
            dependencies: step.dependencies || null
          };
          
          // Create the workflow step
          const createdStep = await storage.createWorkflowStep(stepData);
          
          // Create document requirements if provided
          if (step.documentRequirements && Array.isArray(step.documentRequirements)) {
            for (const req of step.documentRequirements) {
              await storage.createDocumentRequirement({
                workflowStepId: createdStep.id,
                title: req.title,
                description: req.description || '',
                isRequired: req.isRequired !== undefined ? req.isRequired : true,
                submittedBy: req.submittedBy || 'OWNER',
                acceptedFileTypes: req.acceptedFileTypes || ['pdf'],
                order: req.order || 1
              });
            }
          }
          
          // Create checklist items if provided
          if (step.checklistItems && Array.isArray(step.checklistItems)) {
            for (const item of step.checklistItems) {
              await storage.createChecklistItem({
                workflowStepId: createdStep.id,
                title: item.title,
                description: item.description || '',
                isRequired: item.isRequired !== undefined ? item.isRequired : true,
                assignedRole: item.assignedRole || 'ADMIN',
                order: item.order || 1
              });
            }
          }
        }
      }
      
      // Return the created template - the frontend will refetch complete data
      res.status(201).json(template);
    } catch (error) {
      console.error('Error creating workflow template:', error);
      res.status(500).json({ message: "Failed to create workflow template", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.put('/api/workflow-templates/:id', isAuthenticated, requireRole('ADMIN', 'OWNER'), async (req: any, res) => {
    try {
      const template = await storage.updateWorkflowTemplate(req.params.id, req.body);
      res.json(template);
    } catch (error) {
      console.error('Error updating workflow template:', error);
      res.status(500).json({ message: "Failed to update workflow template" });
    }
  });

  app.delete('/api/workflow-templates/:id', isAuthenticated, requireRole('ADMIN'), async (req: any, res) => {
    try {
      const success = await storage.deleteWorkflowTemplate(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Workflow template not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting workflow template:', error);
      res.status(500).json({ message: "Failed to delete workflow template" });
    }
  });

  // Seed Romanian workflow data endpoint
  // Cache refresh endpoint
  app.post('/api/refresh-workflow-cache', isAuthenticated, requireRole('ADMIN'), async (req: any, res) => {
    try {
      // This endpoint is just to trigger a cache refresh on the frontend
      // by returning a different response each time
      res.json({ 
        message: "Cache refresh triggered", 
        timestamp: new Date().toISOString(),
        cacheBuster: Math.random()
      });
    } catch (error) {
      console.error('Error refreshing cache:', error);
      res.status(500).json({ message: "Failed to refresh cache" });
    }
  });

  app.post('/api/seed-romanian-workflow', isAuthenticated, requireRole('ADMIN'), async (req: any, res) => {
    try {
      const userId = req.user.id || req.user.claims?.sub || 'dev-user';
      
      // First, find or create the Romanian Work Permit workflow template
      let workflowTemplate = await storage.getAllWorkflowTemplates();
      let romanianTemplate = workflowTemplate.find(t => t.name.includes('Romanian Work Permit'));
      
      if (!romanianTemplate) {
        // Create the Romanian Work Permit template
        romanianTemplate = await storage.createWorkflowTemplate({
          name: 'Romanian Work Permit Process',
          description: 'Complete Romanian immigration workflow from AJOFM labor market test through residence permit',
          isActive: true,
          order: 1,
          executionType: 'sequential',
          estimatedDurationDays: 180,
          createdByUserId: userId
        });
      }

      // Define comprehensive Romanian workflow stages with real documents and checklists
      const workflowStages = [
        {
          name: 'AJOFM Labor Market Test',
          description: 'Romanian Employment Agency labor market testing for foreign workers',
          stepType: 'DOCUMENT_COLLECTION',
          assignedRole: 'OWNER',
          estimatedDuration: 14,
          order: 1,
          documentRequirements: [
            {
              title: 'AJOFM Application Form F090',
              description: 'Completed Form F090 for labor market testing at Romanian Employment Agency',
              isRequired: true,
              submittedBy: 'OWNER',
              acceptedFileTypes: ['pdf']
            },
            {
              title: 'Detailed Job Description',
              description: 'Complete job description with requirements and responsibilities',
              isRequired: true,
              submittedBy: 'OWNER',
              acceptedFileTypes: ['pdf', 'doc', 'docx']
            },
            {
              title: 'Company Registration Certificate',
              description: 'Valid company registration certificate from ONRC',
              isRequired: true,
              submittedBy: 'OWNER',
              acceptedFileTypes: ['pdf']
            }
          ],
          checklistItems: [
            {
              title: 'Verify job posting requirements',
              description: 'Ensure job meets Romanian labor law requirements for foreign workers',
              isRequired: true,
              assignedRole: 'OWNER'
            },
            {
              title: 'Submit to local AJOFM office',
              description: 'Submit application to the relevant county AJOFM office',
              isRequired: true,
              assignedRole: 'OWNER'
            }
          ]
        },
        {
          name: 'Work Permit Application (IGI)',
          description: 'Romanian Immigration Office work permit application',
          stepType: 'FORM_COMPLETION',
          assignedRole: 'OWNER',
          estimatedDuration: 30,
          order: 2,
          documentRequirements: [
            {
              title: 'AJOFM Approval Notice',
              description: 'Official approval from AJOFM for labor market test',
              isRequired: true,
              submittedBy: 'OWNER',
              acceptedFileTypes: ['pdf']
            },
            {
              title: 'IGI Work Permit Application',
              description: 'Completed work permit application form for IGI',
              isRequired: true,
              submittedBy: 'OWNER',
              acceptedFileTypes: ['pdf']
            },
            {
              title: 'Employment Contract',
              description: 'Signed individual employment contract in Romanian',
              isRequired: true,
              submittedBy: 'OWNER',
              acceptedFileTypes: ['pdf']
            },
            {
              title: 'Worker Passport Copy',
              description: 'Clear copy of worker passport (all pages)',
              isRequired: true,
              submittedBy: 'WORKER',
              acceptedFileTypes: ['pdf', 'jpg', 'png']
            }
          ],
          checklistItems: [
            {
              title: 'Verify all documents are apostilled',
              description: 'Ensure foreign documents have proper apostille or legalization',
              isRequired: true,
              assignedRole: 'OWNER'
            },
            {
              title: 'Submit to IGI',
              description: 'Submit complete application package to Romanian Immigration Office',
              isRequired: true,
              assignedRole: 'OWNER'
            }
          ]
        },
        {
          name: 'Consulate Visa Application',
          description: 'Long-stay visa application at Romanian consulate',
          stepType: 'INSTITUTIONAL_SUBMISSION',
          assignedRole: 'WORKER',
          estimatedDuration: 21,
          order: 3,
          documentRequirements: [
            {
              title: 'IGI Work Permit',
              description: 'Approved work permit from Romanian Immigration Office',
              isRequired: true,
              submittedBy: 'OWNER',
              acceptedFileTypes: ['pdf']
            },
            {
              title: 'Visa Application Form',
              description: 'Completed long-stay visa application form',
              isRequired: true,
              submittedBy: 'WORKER',
              acceptedFileTypes: ['pdf']
            },
            {
              title: 'Medical Certificate',
              description: 'Medical certificate from approved medical center',
              isRequired: true,
              submittedBy: 'WORKER',
              acceptedFileTypes: ['pdf']
            },
            {
              title: 'Criminal Background Check',
              description: 'Apostilled criminal background check from country of origin',
              isRequired: true,
              submittedBy: 'WORKER',
              acceptedFileTypes: ['pdf']
            }
          ],
          checklistItems: [
            {
              title: 'Schedule consulate appointment',
              description: 'Book appointment at Romanian consulate in worker country',
              isRequired: true,
              assignedRole: 'WORKER'
            },
            {
              title: 'Prepare visa interview',
              description: 'Review documents and prepare for consulate interview',
              isRequired: true,
              assignedRole: 'OWNER'
            }
          ]
        },
        {
          name: 'Entry to Romania',
          description: 'Worker entry to Romania and initial registration',
          stepType: 'DOCUMENT_REVIEW',
          assignedRole: 'WORKER',
          estimatedDuration: 7,
          order: 4,
          documentRequirements: [
            {
              title: 'Entry Stamp',
              description: 'Passport entry stamp at Romanian border',
              isRequired: true,
              submittedBy: 'WORKER',
              acceptedFileTypes: ['jpg', 'png', 'pdf']
            },
            {
              title: 'Accommodation Proof',
              description: 'Proof of accommodation in Romania (rental contract or hotel)',
              isRequired: true,
              submittedBy: 'WORKER',
              acceptedFileTypes: ['pdf']
            }
          ],
          checklistItems: [
            {
              title: 'Register with local police',
              description: 'Report residence to local police within 30 days of arrival',
              isRequired: true,
              assignedRole: 'WORKER'
            },
            {
              title: 'Open Romanian bank account',
              description: 'Open bank account for salary payments',
              isRequired: false,
              assignedRole: 'WORKER'
            }
          ]
        },
        {
          name: 'Residence Permit Application',
          description: 'Temporary residence permit application at IGI',
          stepType: 'INSTITUTIONAL_SUBMISSION',
          assignedRole: 'WORKER',
          estimatedDuration: 30,
          order: 5,
          documentRequirements: [
            {
              title: 'Residence Permit Application',
              description: 'Completed temporary residence permit application form',
              isRequired: true,
              submittedBy: 'WORKER',
              acceptedFileTypes: ['pdf']
            },
            {
              title: 'Proof of Accommodation',
              description: 'Valid rental contract or property ownership documents',
              isRequired: true,
              submittedBy: 'WORKER',
              acceptedFileTypes: ['pdf']
            },
            {
              title: 'Health Insurance Proof',
              description: 'Valid health insurance coverage in Romania',
              isRequired: true,
              submittedBy: 'WORKER',
              acceptedFileTypes: ['pdf']
            },
            {
              title: 'Income Proof',
              description: 'Employment contract and salary confirmation',
              isRequired: true,
              submittedBy: 'OWNER',
              acceptedFileTypes: ['pdf']
            }
          ],
          checklistItems: [
            {
              title: 'Schedule IGI appointment',
              description: 'Book appointment at local IGI office for residence permit',
              isRequired: true,
              assignedRole: 'WORKER'
            },
            {
              title: 'Pay residence permit fees',
              description: 'Pay required government fees for residence permit processing',
              isRequired: true,
              assignedRole: 'WORKER'
            }
          ]
        },
        {
          name: 'Residence Card Issuance',
          description: 'Collection of temporary residence card',
          stepType: 'ADMIN_APPROVAL',
          assignedRole: 'WORKER',
          estimatedDuration: 14,
          order: 6,
          documentRequirements: [
            {
              title: 'Residence Card',
              description: 'Physical temporary residence card from IGI',
              isRequired: true,
              submittedBy: 'WORKER',
              acceptedFileTypes: ['jpg', 'png', 'pdf']
            },
            {
              title: 'Collection Receipt',
              description: 'Official receipt for residence card collection',
              isRequired: true,
              submittedBy: 'WORKER',
              acceptedFileTypes: ['pdf', 'jpg']
            }
          ],
          checklistItems: [
            {
              title: 'Verify card information',
              description: 'Check all information on residence card is correct',
              isRequired: true,
              assignedRole: 'WORKER'
            },
            {
              title: 'Update employer records',
              description: 'Provide copy of residence card to employer HR department',
              isRequired: true,
              assignedRole: 'WORKER'
            }
          ]
        }
      ];

      // Create workflow steps with their requirements and checklists
      for (const stageData of workflowStages) {
        // Create the workflow step
        const step = await storage.createWorkflowStep({
          workflowTemplateId: romanianTemplate.id,
          name: stageData.name,
          description: stageData.description,
          stepType: stageData.stepType,
          assignedRole: stageData.assignedRole,
          estimatedDuration: stageData.estimatedDuration,
          order: stageData.order,
          isRequired: true,
          approvalRequired: false
        });

        // Create document requirements for this step
        for (let i = 0; i < stageData.documentRequirements.length; i++) {
          const req = stageData.documentRequirements[i];
          await storage.createDocumentRequirement({
            workflowStepId: step.id,
            title: req.title,
            description: req.description,
            isRequired: req.isRequired,
            submittedBy: req.submittedBy,
            acceptedFileTypes: req.acceptedFileTypes,
            order: i + 1
          });
        }

        // Create checklist items for this step
        for (let i = 0; i < stageData.checklistItems.length; i++) {
          const item = stageData.checklistItems[i];
          await storage.createChecklistItem({
            workflowStepId: step.id,
            title: item.title,
            description: item.description,
            isRequired: item.isRequired,
            assignedRole: item.assignedRole,
            order: i + 1
          });
        }
      }

      res.json({ 
        success: true, 
        message: 'Romanian workflow stages and documents populated successfully',
        workflowTemplateId: romanianTemplate.id,
        stagesCreated: workflowStages.length
      });
    } catch (error) {
      console.error('Error seeding Romanian workflow:', error);
      res.status(500).json({ 
        message: "Failed to seed Romanian workflow", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Workflow Steps CRUD API endpoints
  app.get('/api/workflow-templates/:id/steps', isAuthenticated, requireRole('ADMIN', 'OWNER'), async (req: any, res) => {
    try {
      const steps = await storage.getWorkflowSteps(req.params.id);
      res.json(steps);
    } catch (error) {
      console.error('Error fetching workflow steps:', error);
      res.status(500).json({ message: "Failed to fetch workflow steps" });
    }
  });

  app.post('/api/workflow-templates/:id/steps', isAuthenticated, requireRole('ADMIN', 'OWNER'), async (req: any, res) => {
    try {
      const stepData = {
        workflowTemplateId: req.params.id,
        ...req.body
      };
      const step = await storage.createWorkflowStep(stepData);
      res.json(step);
    } catch (error) {
      console.error('Error creating workflow step:', error);
      res.status(500).json({ message: "Failed to create workflow step" });
    }
  });

  app.put('/api/workflow-steps/:id', isAuthenticated, requireRole('ADMIN', 'OWNER'), async (req: any, res) => {
    try {
      const step = await storage.updateWorkflowStep(req.params.id, req.body);
      res.json(step);
    } catch (error) {
      console.error('Error updating workflow step:', error);
      res.status(500).json({ message: "Failed to update workflow step" });
    }
  });

  app.delete('/api/workflow-steps/:id', isAuthenticated, requireRole('ADMIN', 'OWNER'), async (req: any, res) => {
    try {
      const stepId = req.params.id;
      
      // First delete all associated document requirements
      const documents = await storage.getDocumentRequirements(stepId);
      for (const doc of documents) {
        await storage.deleteDocumentRequirement(doc.id);
      }
      
      // Then delete all associated checklist items
      const checklists = await storage.getChecklistItems(stepId);
      for (const item of checklists) {
        await storage.deleteChecklistItem(item.id);
      }
      
      // Finally delete the workflow step itself
      const success = await storage.deleteWorkflowStep(stepId);
      if (!success) {
        return res.status(404).json({ message: "Workflow step not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting workflow step:', error);
      res.status(500).json({ message: "Failed to delete workflow step" });
    }
  });

  // Workflow Step Management
  app.post('/api/workflow-templates/:templateId/steps', isAuthenticated, requireRole('ADMIN', 'OWNER'), async (req: any, res) => {
    try {
      const { templateId } = req.params;
      const { name, description, stepType, assignedRole, estimatedDays, isRequired, position } = req.body;
      
      // Calculate order based on position
      let order = 1;
      const existingSteps = await storage.getWorkflowSteps(templateId);
      
      if (position === 'start') {
        order = 1;
        // Update existing steps to make room
        for (const step of existingSteps) {
          await storage.updateWorkflowStep(step.id, { order: step.order + 1 });
        }
      } else if (position === 'end' || !position) {
        order = existingSteps.length + 1;
      } else if (position.startsWith('after-')) {
        const targetStepId = position.replace('after-', '');
        const targetStep = existingSteps.find(s => s.id === targetStepId);
        if (targetStep) {
          order = targetStep.order + 1;
          // Update subsequent steps to make room
          for (const step of existingSteps) {
            if (step.order >= order) {
              await storage.updateWorkflowStep(step.id, { order: step.order + 1 });
            }
          }
        } else {
          order = existingSteps.length + 1;
        }
      }
      
      const stepData = {
        workflowTemplateId: templateId,
        name,
        description: description || '',
        stepType,
        assignedRole,
        order,
        estimatedDays: estimatedDays || 1,
        isRequired: isRequired !== undefined ? isRequired : true,
        requiresApproval: false,
        approverRole: null,
        dependencies: null
      };
      
      const step = await storage.createWorkflowStep(stepData);
      res.status(201).json(step);
    } catch (error) {
      console.error('Error creating workflow step:', error);
      res.status(500).json({ message: "Failed to create workflow step" });
    }
  });

  app.put('/api/workflow-steps/:stepId', isAuthenticated, requireRole('ADMIN', 'OWNER'), async (req: any, res) => {
    try {
      const step = await storage.updateWorkflowStep(req.params.stepId, req.body);
      res.json(step);
    } catch (error) {
      console.error('Error updating workflow step:', error);
      res.status(500).json({ message: "Failed to update workflow step" });
    }
  });


  // Document Requirements CRUD API endpoints
  app.get('/api/workflow-steps/:id/documents', isAuthenticated, requireRole('ADMIN', 'OWNER'), async (req: any, res) => {
    try {
      const documents = await storage.getDocumentRequirements(req.params.id);
      res.json(documents);
    } catch (error) {
      console.error('Error fetching document requirements:', error);
      res.status(500).json({ message: "Failed to fetch document requirements" });
    }
  });

  app.post('/api/workflow-steps/:id/documents', isAuthenticated, requireRole('ADMIN', 'OWNER'), async (req: any, res) => {
    try {
      const { title, description, isRequired, submittedBy, acceptedFileTypes, requiredByDays, order } = req.body;
      const docData = {
        workflowStepId: req.params.id,
        title,
        description: description || '',
        isRequired: isRequired !== undefined ? isRequired : true,
        submittedBy: submittedBy || 'OWNER',
        acceptedFileTypes: acceptedFileTypes || ['pdf'],
        requiredByDays: requiredByDays ? parseInt(requiredByDays) : null,
        order: order || 1
      };
      const document = await storage.createDocumentRequirement(docData);
      res.json(document);
    } catch (error) {
      console.error('Error creating document requirement:', error);
      res.status(500).json({ message: "Failed to create document requirement" });
    }
  });

  app.put('/api/document-requirements/:id', isAuthenticated, requireRole('ADMIN', 'OWNER'), async (req: any, res) => {
    try {
      // Parse requiredByDays as integer if provided
      if (req.body.requiredByDays) {
        req.body.requiredByDays = parseInt(req.body.requiredByDays);
      }
      const document = await storage.updateDocumentRequirement(req.params.id, req.body);
      res.json(document);
    } catch (error) {
      console.error('Error updating document requirement:', error);
      res.status(500).json({ message: "Failed to update document requirement" });
    }
  });

  app.delete('/api/document-requirements/:id', isAuthenticated, requireRole('ADMIN', 'OWNER'), async (req: any, res) => {
    try {
      const success = await storage.deleteDocumentRequirement(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Document requirement not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting document requirement:', error);
      res.status(500).json({ message: "Failed to delete document requirement" });
    }
  });

  // Checklist Items CRUD API endpoints
  app.get('/api/workflow-steps/:id/checklist', isAuthenticated, requireRole('ADMIN', 'OWNER'), async (req: any, res) => {
    try {
      const checklist = await storage.getChecklistItems(req.params.id);
      res.json(checklist);
    } catch (error) {
      console.error('Error fetching checklist items:', error);
      res.status(500).json({ message: "Failed to fetch checklist items" });
    }
  });

  app.post('/api/workflow-steps/:id/checklist', isAuthenticated, requireRole('ADMIN', 'OWNER'), async (req: any, res) => {
    try {
      const { title, description, isRequired, assignedRole, checklistType, requiredByDays, order } = req.body;
      const checklistData = {
        workflowStepId: req.params.id,
        title,
        description: description || '',
        isRequired: isRequired !== undefined ? isRequired : true,
        assignedRole: assignedRole || 'WORKER',
        checklistType: checklistType || 'VERIFICATION',
        requiredByDays: requiredByDays ? parseInt(requiredByDays) : null,
        order: order || 1
      };
      const item = await storage.createChecklistItem(checklistData);
      res.json(item);
    } catch (error) {
      console.error('Error creating checklist item:', error);
      res.status(500).json({ message: "Failed to create checklist item" });
    }
  });

  app.put('/api/checklist-items/:id', isAuthenticated, requireRole('ADMIN', 'OWNER'), async (req: any, res) => {
    try {
      // Parse requiredByDays as integer if provided
      if (req.body.requiredByDays) {
        req.body.requiredByDays = parseInt(req.body.requiredByDays);
      }
      const item = await storage.updateChecklistItem(req.params.id, req.body);
      res.json(item);
    } catch (error) {
      console.error('Error updating checklist item:', error);
      res.status(500).json({ message: "Failed to update checklist item" });
    }
  });

  app.delete('/api/checklist-items/:id', isAuthenticated, requireRole('ADMIN', 'OWNER'), async (req: any, res) => {
    try {
      const success = await storage.deleteChecklistItem(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Checklist item not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting checklist item:', error);
      res.status(500).json({ message: "Failed to delete checklist item" });
    }
  });

  // Create standalone workflow step with ordering
  app.post('/api/workflow-steps', isAuthenticated, requireRole('ADMIN', 'OWNER'), async (req: any, res) => {
    try {
      console.log('Received workflow step creation request:', JSON.stringify(req.body, null, 2));
      const { workflowTemplateId, insertPosition, targetStepId, ...stepData } = req.body;
      
      if (!workflowTemplateId) {
        console.error('Missing workflowTemplateId');
        return res.status(400).json({ message: "workflowTemplateId is required" });
      }
      
      // Calculate order based on position
      let order = 1;
      if (insertPosition && targetStepId) {
        const existingSteps = await storage.getWorkflowSteps(workflowTemplateId);
        const targetStep = existingSteps.find(s => s.id === targetStepId);
        
        if (targetStep && insertPosition === 'after') {
          order = targetStep.order + 1;
          // Update orders of subsequent steps
          for (const step of existingSteps.filter(s => s.order > targetStep.order)) {
            await storage.updateWorkflowStep(step.id, { order: step.order + 1 });
          }
        } else if (targetStep && insertPosition === 'before') {
          order = targetStep.order;
          // Update orders of current and subsequent steps
          for (const step of existingSteps.filter(s => s.order >= targetStep.order)) {
            await storage.updateWorkflowStep(step.id, { order: step.order + 1 });
          }
        }
      } else {
        // Add at the end
        console.log('Getting existing steps for workflowTemplateId:', workflowTemplateId);
        const existingSteps = await storage.getWorkflowSteps(workflowTemplateId);
        console.log('Existing steps:', existingSteps.length);
        order = existingSteps.length > 0 ? Math.max(...existingSteps.map(s => s.order)) + 1 : 1;
      }
      
      const finalStepData = {
        ...stepData,
        workflowTemplateId,
        order
      };
      
      console.log('Final step data to create:', JSON.stringify(finalStepData, null, 2));
      const newStep = await storage.createWorkflowStep(finalStepData);
      console.log('Successfully created workflow step:', newStep.id);
      
      res.status(201).json(newStep);
    } catch (error) {
      console.error('Error creating workflow step:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ message: "Failed to create workflow step", error: error.message });
    }
  });

  // Create standalone document requirement
  app.post('/api/document-requirements', isAuthenticated, requireRole('ADMIN', 'OWNER'), async (req: any, res) => {
    try {
      const documentData = req.body;
      const newDocument = await storage.createDocumentRequirement(documentData);
      res.status(201).json(newDocument);
    } catch (error) {
      console.error('Error creating document requirement:', error);
      res.status(500).json({ message: "Failed to create document requirement" });
    }
  });

  // Create standalone checklist item
  app.post('/api/checklist-items', isAuthenticated, requireRole('ADMIN', 'OWNER'), async (req: any, res) => {
    try {
      const checklistData = req.body;
      const newItem = await storage.createChecklistItem(checklistData);
      res.status(201).json(newItem);
    } catch (error) {
      console.error('Error creating checklist item:', error);
      res.status(500).json({ message: "Failed to create checklist item" });
    }
  });

  // Get complete workflow with all stages, documents, and checklists
  app.get('/api/workflow-templates/:id/complete', isAuthenticated, requireRole('ADMIN', 'OWNER'), async (req: any, res) => {
    try {
      const template = await storage.getWorkflowTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ message: "Workflow template not found" });
      }

      const steps = await storage.getWorkflowSteps(req.params.id);
      
      // Get documents and checklists for each step
      const stepsWithDetails = await Promise.all(steps.map(async (step) => {
        const [documents, checklist] = await Promise.all([
          storage.getDocumentRequirements(step.id),
          storage.getChecklistItems(step.id)
        ]);
        
        return {
          ...step,
          documentRequirements: documents,
          checklistItems: checklist
        };
      }));

      res.json({
        ...template,
        steps: stepsWithDetails
      });
    } catch (error) {
      console.error('Error fetching complete workflow:', error);
      res.status(500).json({ message: "Failed to fetch complete workflow" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
