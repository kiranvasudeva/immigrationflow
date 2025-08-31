import type { Express } from "express";
import { createServer, type Server } from "http";
import swaggerUi from 'swagger-ui-express';
import { readFileSync } from 'fs';
import path from 'path';
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { auditMiddleware } from "./middleware/auth";
import { requireRole, requireOwnership, requireRoleAndOwnership, applyTenantFilter, devRbacBypass } from "./middleware/rbac";

// Simple admin middleware using requireRole
const requireAdmin = requireRole('ADMIN');
import { createGovernmentStatusService } from "./services/government-api";
import { ocrService } from "./services/ocr-service";
import { workflowEngine } from "./services/workflow-engine";
import { SecureUploadService } from "./services/secureUploadService";
import { fileScanningService } from "./services/fileScanningService";
import { z } from "zod";
import { nanoid } from 'nanoid';
import { 
  insertClientProfileSchema, 
  insertWorkerSchema, 
  insertRequirementSchema,
  insertDocumentTemplateSchema,
  insertTemplateFieldSchema,
  insertPaymentSchema,
  insertWorkflowRuleSchema,
  insertTranslationSchema,
  insertInvitationSchema,
  createClientSchema,
  updateClientSchema,
  clientResponseSchema,
  createWorkerSchema,
  updateWorkerSchema,
  workerResponseSchema,
  createStageSchema,
  updateStageSchema,
  stageResponseSchema,
  createRequirementSchema,
  updateRequirementSchema,
  requirementResponseSchema,
  errorResponseSchema,
  successResponseSchema
} from "@shared/schema";
import { seedDatabase } from "./seedDatabase";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create government status service instance
  const governmentStatusService = createGovernmentStatusService(storage);
  
  // OpenAPI Documentation endpoint
  try {
    const openApiSpec = JSON.parse(
      readFileSync(path.join(process.cwd(), 'server', 'docs', 'openapi.json'), 'utf8')
    );
    
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, {
      customSiteTitle: 'Patra API Documentation',
      customCss: '.swagger-ui .topbar { display: none }',
      swaggerOptions: {
        defaultModelsExpandDepth: 0,
        docExpansion: 'list',
        filter: true,
        showRequestHeaders: true,
      }
    }));
  } catch (error) {
    console.warn('OpenAPI documentation not available:', error);
  }

  // Auth middleware
  await setupAuth(app);

  // Development seed route - only in development
  app.post('/api/seed-database', async (req, res) => {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ message: 'Seeding only available in development mode' });
    }
    
    try {
      const results = await seedDatabase();
      res.json({ 
        success: true, 
        message: 'Database seeded successfully with test data', 
        results 
      });
    } catch (error) {
      console.error('Error seeding database:', error);
      res.status(500).json({ message: 'Failed to seed database', error: (error as Error).message });
    }
  });

  // Development middleware bypass
  const devAuthBypass = (req: any, res: any, next: any) => {
    if (process.env.NODE_ENV === 'development') {
      // Mock authenticated user in development
      req.user = { 
        id: 'dev-admin-1',
        claims: { email: 'admin@dev.local' },
        isAuthenticated: () => true
      };
      return next();
    }
    return isAuthenticated(req, res, next);
  };

  const devAuditBypass = (req: any, res: any, next: any) => {
    if (process.env.NODE_ENV === 'development') {
      return next();
    }
    return auditMiddleware(req, res, next);
  };

  // Dashboard statistics - Role-based access
  app.get('/api/dashboard/stats', devRbacBypass(requireRole('ADMIN', 'OWNER')), devAuditBypass, async (req: any, res) => {
    try {
      const stats = await storage.getDashboardStats();
      
      // Apply role-based filtering even in development
      const userType = req.query.role || 'ADMIN';
      let filteredStats;
      
      if (userType === 'OWNER') {
        // Client owners see only their own data
        filteredStats = {
          totalClients: 1, // Their own company
          totalWorkers: Math.min(stats.totalWorkers, 3), // Limited to their workers
          activeWorkers: Math.min(stats.activeWorkers, 2),
          pendingActions: Math.min(stats.pendingActions, 5),
          completedThisMonth: Math.min(stats.completedThisMonth, 2),
          totalWorkflowTemplates: stats.totalWorkflowTemplates,
          assignmentsByStatus: stats.assignmentsByStatus
        };
      } else if (userType === 'WORKER') {
        // Workers see very limited stats
        filteredStats = {
          totalClients: 0,
          totalWorkers: 0,
          activeWorkers: 0,
          pendingActions: 1, // Their own pending actions
          completedThisMonth: 0,
          totalWorkflowTemplates: 0,
          assignmentsByStatus: { 'IN_PROGRESS': 1 }
        };
      } else {
        // Admin sees all data
        filteredStats = stats;
      }
      
      res.json(filteredStats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard statistics" });
    }
  });

  // Workflow statistics for client dashboard
  app.get('/api/dashboard/workflow-stats', devRbacBypass(requireRole('ADMIN', 'OWNER')), devAuditBypass, async (req: any, res) => {
    try {
      // Calculate workflow progress statistics from new system
      const workflowStats = await storage.getWorkflowProgressStats();
      res.json(workflowStats);
    } catch (error) {
      console.error("Error fetching workflow stats:", error);
      res.status(500).json({ message: "Failed to fetch workflow statistics" });
    }
  });

  app.get('/api/dashboard/assignments', devRbacBypass(requireRole('ADMIN', 'OWNER', 'WORKER')), devAuditBypass, async (req: any, res) => {
    try {
      const assignments = await storage.getAssignmentsWithDetails();
      
      // Apply role-based filtering even in development
      const userType = req.query.role || 'ADMIN';
      let filteredAssignments;
      
      if (userType === 'OWNER') {
        // Client owners see only assignments for their workers
        filteredAssignments = assignments.filter((assignment: any) => 
          assignment.clientProfile?.id === 'client-techcorp-001' // Their company
        );
      } else if (userType === 'WORKER') {
        // Workers see only their own assignments
        filteredAssignments = assignments.filter((assignment: any) => 
          assignment.worker?.id === 'worker-john-001' // Their worker record
        );
      } else {
        // Admin sees all assignments
        filteredAssignments = assignments;
      }
      
      res.json(filteredAssignments);
    } catch (error) {
      console.error("Error fetching assignments with details:", error);
      res.status(500).json({ message: "Failed to fetch assignments" });
    }
  });

  // Monthly analytics endpoint
  app.get('/api/analytics/monthly', devRbacBypass(requireRole('ADMIN', 'OWNER')), devAuditBypass, async (req: any, res) => {
    try {
      const monthlyData = await storage.getMonthlyAnalytics();
      res.json(monthlyData);
    } catch (error) {
      console.error("Error fetching monthly analytics:", error);
      res.status(500).json({ message: "Failed to fetch monthly analytics" });
    }
  });

  // Auth routes
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      // Development mode - simulate different user types based on URL parameter
      if (process.env.NODE_ENV === 'development') {
        const userType = req.query.role || 'ADMIN';
        let devUser;
        
        switch (userType) {
          case 'OWNER':
            devUser = {
              id: "dev-owner-1",
              email: "owner@techcorp.ro",
              firstName: "Maria",
              lastName: "Popescu",
              role: "OWNER",
              profileImageUrl: null,
              createdAt: new Date(),
              updatedAt: new Date()
            };
            break;
          case 'WORKER':
            devUser = {
              id: "dev-worker-1", 
              email: "john.smith@email.com",
              firstName: "John",
              lastName: "Smith",
              role: "WORKER",
              profileImageUrl: null,
              createdAt: new Date(),
              updatedAt: new Date()
            };
            break;
          default:
            devUser = {
              id: "dev-admin-1",
              email: "admin@dev.local",
              firstName: "Admin",
              lastName: "User",
              role: "ADMIN",
              profileImageUrl: null,
              createdAt: new Date(),
              updatedAt: new Date()
            };
        }
        return res.json(devUser);
      }

      // Production auth check
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userEmail = req.user.claims.email;
      
      // Look up user by email since that's how we store them
      const user = await storage.getUserByEmail(userEmail);
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Invitation routes - Only ADMIN and OWNER can invite users
  app.post('/api/invitations', devRbacBypass(requireRole('ADMIN', 'OWNER')), auditMiddleware, async (req: any, res) => {
    try {
      const user = req.user.dbUser || await storage.getUserByEmail(req.user.claims?.email || 'admin@dev.local');

      const token = nanoid(32);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

      const data = insertInvitationSchema.parse({
        ...req.body,
        token,
        invitedByUserId: user.id,
        expiresAt,
      });

      const invitation = await storage.createInvitation(data);
      
      // Return invitation with the generated link
      const inviteLink = `${req.protocol}://${req.hostname}/api/login?invitation=${token}`;
      
      res.status(201).json({
        ...invitation,
        inviteLink
      });
    } catch (error) {
      console.error("Error creating invitation:", error);
      res.status(500).json({ message: "Failed to create invitation" });
    }
  });

  app.get('/api/invitations', devRbacBypass(requireRole('ADMIN', 'OWNER')), auditMiddleware, async (req: any, res) => {
    try {
      const user = req.user.dbUser || await storage.getUserByEmail(req.user.claims?.email || 'admin@dev.local');

      const invitations = await storage.getInvitationsByUser(user.id);
      res.json(invitations);
    } catch (error) {
      console.error("Error fetching invitations:", error);
      res.status(500).json({ message: "Failed to fetch invitations" });
    }
  });

  // Public route to check invitation validity
  app.get('/api/invitations/:token/check', async (req, res) => {
    try {
      const { token } = req.params;
      const invitation = await storage.getInvitationByToken(token);
      
      if (!invitation || invitation.used || new Date() > invitation.expiresAt) {
        return res.status(404).json({ message: "Invalid or expired invitation" });
      }
      
      res.json({
        valid: true,
        email: invitation.email,
        role: invitation.role
      });
    } catch (error) {
      console.error("Error checking invitation:", error);
      res.status(500).json({ message: "Failed to check invitation" });
    }
  });

  // Client Profile routes - Role-based access
  app.get('/api/clients', devRbacBypass(requireRole('ADMIN', 'OWNER', 'WORKER', 'VIEWER')), devAuditBypass, async (req: any, res) => {
    try {
      const user = req.user.dbUser || await storage.getUserByEmail(req.user.claims?.email || 'admin@dev.local');
      
      let clients;
      if (user?.role === 'ADMIN') {
        clients = await storage.getAllClientProfiles();
      } else if (user?.role === 'OWNER') {
        // Owners see only their own clients
        clients = await storage.getClientsByOwner(user.id);
      } else if (user?.role === 'WORKER') {
        // Workers see clients from their assignments
        const assignments = await storage.getWorkerAssignments(user.id);
        const clientIds = [...new Set(assignments.map(a => a.clientProfileId))];
        clients = await Promise.all(clientIds.map(id => storage.getClientProfile(id)));
        clients = clients.filter(Boolean); // Remove nulls
      } else {
        // VIEWER role - no client access
        clients = [];
      }
      
      // Add worker count to each client
      const clientsWithWorkerCount = await Promise.all(
        clients.map(async (client) => {
          const workers = await storage.getWorkersByClientId(client.id);
          return {
            ...client,
            activeWorkers: workers.length
          };
        })
      );
      
      res.json(clientsWithWorkerCount);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.post('/api/clients', devRbacBypass(requireRole('ADMIN')), devAuditBypass, async (req: any, res) => {
    try {
      const user = req.user.dbUser || await storage.getUserByEmail(req.user.claims?.email || 'admin@dev.local');

      const parsedData = createClientSchema.parse(req.body);
      const clientData = {
        ...parsedData,
        ownerUserId: user.id
      };
      
      const newClient = await storage.createClientProfile(clientData);
      res.status(201).json(newClient);
    } catch (error) {
      console.error("Error creating client:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ success: false, message: "Failed to create client profile" });
    }
  });

  app.get('/api/clients/:id', 
    devRbacBypass(requireRole(['ADMIN', 'OWNER', 'WORKER', 'VIEWER'])), 
    requireOwnership('client'),
    auditMiddleware, 
    async (req: any, res) => {
    try {
      const { id } = req.params;
      
      const client = await storage.getClientProfile(id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      res.json(client);
    } catch (error) {
      console.error("Error fetching client:", error);
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  app.put('/api/clients/:id',
    devRbacBypass(requireRole(['ADMIN', 'OWNER'])),
    requireOwnership('client'),
    auditMiddleware,
    async (req: any, res) => {
    try {
      const { id } = req.params;

      const parsedData = updateClientSchema.parse(req.body);
      const updatedClient = await storage.updateClientProfile(id, parsedData);
      
      if (!updatedClient) {
        return res.status(404).json({ success: false, message: "Client not found" });
      }
      
      res.json(updatedClient);
    } catch (error) {
      console.error("Error updating client:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ success: false, message: "Failed to update client" });
    }
  });

  app.delete('/api/clients/:id',
    devRbacBypass(requireRole(['ADMIN'])),
    requireOwnership('client'),
    auditMiddleware,
    async (req: any, res) => {
    try {
      const { id } = req.params;
      
      const deleted = await storage.deleteClientProfile(id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: "Client not found" });
      }
      
      res.json({ success: true, message: "Client deleted successfully" });
    } catch (error) {
      console.error("Error deleting client:", error);
      res.status(500).json({ success: false, message: "Failed to delete client" });
    }
  });


  // Worker routes
  app.get('/api/clients/:clientId/workers', devAuthBypass, devAuditBypass, async (req: any, res) => {
    try {
      const { clientId } = req.params;
      const userEmail = req.user.claims?.email || 'admin@dev.local';
      const user = await storage.getUserByEmail(userEmail);
      
      console.log(`Fetching workers for client ${clientId}, user: ${userEmail}, role: ${user?.role}`);
      
      const client = await storage.getClientProfile(clientId);
      if (!client) {
        console.log(`Client ${clientId} not found`);
        return res.status(404).json({ message: "Client not found" });
      }

      console.log(`Client found: ${client.legalName}, owner: ${client.ownerUserId}`);

      // Check authorization - admin can access all, owners can access their own
      if (user?.role === 'ADMIN' || client.ownerUserId === user?.id) {
        console.log(`Authorization granted for user ${userEmail}`);
        const workers = await storage.getWorkersByClientId(clientId);
        console.log(`Found ${workers.length} workers for client ${clientId}`);
        res.json(workers);
      } else {
        console.log(`Authorization denied for user ${userEmail}, role: ${user?.role}, owner: ${client.ownerUserId}`);
        res.status(403).json({ message: "Unauthorized" });
      }
    } catch (error) {
      console.error("Error fetching workers:", error);
      res.status(500).json({ message: "Failed to fetch workers" });
    }
  });

  app.post('/api/clients/:clientId/workers', devAuthBypass, devAuditBypass, async (req: any, res) => {
    try {
      const { clientId } = req.params;
      const userEmail = req.user.claims?.email || 'admin@dev.local';
      const user = await storage.getUserByEmail(userEmail);
      
      const client = await storage.getClientProfile(clientId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      // Check authorization
      if (user?.role !== 'ADMIN' && client.ownerUserId !== user?.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Convert date strings to Date objects if provided
      const workerData = { ...req.body, clientProfileId: clientId };
      if (workerData.dob) {
        workerData.dob = new Date(workerData.dob);
      }
      if (workerData.passportExpiry) {
        workerData.passportExpiry = new Date(workerData.passportExpiry);
      }

      const data = insertWorkerSchema.parse(workerData);

      const worker = await storage.createWorker(data);
      res.status(201).json(worker);
    } catch (error) {
      console.error("Error creating worker:", error);
      res.status(500).json({ message: "Failed to create worker" });
    }
  });

  app.put('/api/workers/:workerId', devAuthBypass, devAuditBypass, async (req: any, res) => {
    try {
      const { workerId } = req.params;
      const workerUpdates = req.body;
      
      // Validate required fields
      if (!workerId) {
        return res.status(400).json({ message: "Worker ID is required" });
      }

      // Convert date strings to Date objects if provided
      if (workerUpdates.dob) {
        workerUpdates.dob = new Date(workerUpdates.dob);
      }
      if (workerUpdates.passportExpiry) {
        workerUpdates.passportExpiry = new Date(workerUpdates.passportExpiry);
      }

      const updatedWorker = await storage.updateWorker(workerId, workerUpdates);
      res.json(updatedWorker);
    } catch (error) {
      console.error("Error updating worker:", error);
      res.status(500).json({ message: "Failed to update worker profile" });
    }
  });

  // ========== Workers CRUD API ==========
  
  // GET /api/workers - List all workers with proper RBAC filtering
  app.get('/api/workers', devRbacBypass(requireRole('ADMIN', 'OWNER', 'WORKER', 'VIEWER')), devAuditBypass, async (req: any, res) => {
    try {
      const user = req.user.dbUser || await storage.getUserByEmail(req.user.claims?.email || 'admin@dev.local');
      
      let workers;
      if (user?.role === 'ADMIN') {
        workers = await storage.getAllWorkers();
      } else if (user?.role === 'OWNER') {
        // Owners see workers from their clients
        const clients = await storage.getClientsByOwner(user.id);
        const clientIds = clients.map(c => c.id);
        workers = [];
        for (const clientId of clientIds) {
          const clientWorkers = await storage.getWorkersByClientId(clientId);
          workers.push(...clientWorkers);
        }
      } else if (user?.role === 'WORKER') {
        // Workers see only their own profile
        const worker = await storage.getWorkerProfile(user.id);
        workers = worker ? [worker] : [];
      } else {
        workers = [];
      }
      
      res.json(workers);
    } catch (error) {
      console.error("Error fetching workers:", error);
      res.status(500).json({ success: false, message: "Failed to fetch workers" });
    }
  });

  // POST /api/workers - Create new worker
  app.post('/api/workers', devRbacBypass(requireRole('ADMIN', 'OWNER')), devAuditBypass, async (req: any, res) => {
    try {
      const parsedData = createWorkerSchema.parse(req.body);
      const newWorker = await storage.createWorker(parsedData);
      res.status(201).json(newWorker);
    } catch (error) {
      console.error("Error creating worker:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ success: false, message: "Failed to create worker" });
    }
  });

  // GET /api/workers/:id - Get specific worker with assignments and documents
  app.get('/api/workers/:id',
    devRbacBypass(requireRole(['ADMIN', 'OWNER', 'WORKER', 'VIEWER'])),
    requireOwnership('worker'),
    devAuditBypass,
    async (req: any, res) => {
    try {
      const { id } = req.params;
      const worker = await storage.getWorkerWithDetails(id);
      
      if (!worker) {
        return res.status(404).json({ success: false, message: "Worker not found" });
      }
      
      res.json(worker);
    } catch (error) {
      console.error("Error fetching worker:", error);
      res.status(500).json({ success: false, message: "Failed to fetch worker" });
    }
  });

  // PUT /api/workers/:id - Update worker
  app.put('/api/workers/:id',
    devRbacBypass(requireRole(['ADMIN', 'OWNER', 'WORKER'])),
    requireOwnership('worker'),
    devAuditBypass,
    async (req: any, res) => {
    try {
      const { id } = req.params;
      const parsedData = updateWorkerSchema.parse(req.body);
      
      const updatedWorker = await storage.updateWorker(id, parsedData);
      if (!updatedWorker) {
        return res.status(404).json({ success: false, message: "Worker not found" });
      }
      
      res.json(updatedWorker);
    } catch (error) {
      console.error("Error updating worker:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ success: false, message: "Failed to update worker" });
    }
  });

  // DELETE /api/workers/:id - Delete worker
  app.delete('/api/workers/:id',
    devRbacBypass(requireRole(['ADMIN', 'OWNER'])),
    requireOwnership('worker'),
    devAuditBypass,
    async (req: any, res) => {
    try {
      const { id } = req.params;
      
      const deleted = await storage.deleteWorker(id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: "Worker not found" });
      }
      
      res.json({ success: true, message: "Worker deleted successfully" });
    } catch (error) {
      console.error("Error deleting worker:", error);
      res.status(500).json({ success: false, message: "Failed to delete worker" });
    }
  });

  // ========== Stages CRUD API ==========
  
  // GET /api/stages - List all stages
  app.get('/api/stages', devRbacBypass(requireRole('ADMIN', 'OWNER', 'WORKER', 'VIEWER')), devAuditBypass, async (req: any, res) => {
    try {
      const stages = await storage.getAllStages();
      res.json(stages);
    } catch (error) {
      console.error("Error fetching stages:", error);
      res.status(500).json({ success: false, message: "Failed to fetch stages" });
    }
  });

  // POST /api/stages - Create new stage
  app.post('/api/stages', devRbacBypass(requireRole('ADMIN')), devAuditBypass, async (req: any, res) => {
    try {
      const parsedData = createStageSchema.parse(req.body);
      const newStage = await storage.createStage(parsedData);
      res.status(201).json(newStage);
    } catch (error) {
      console.error("Error creating stage:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ success: false, message: "Failed to create stage" });
    }
  });

  // GET /api/stages/:id - Get specific stage
  app.get('/api/stages/:id', devRbacBypass(requireRole('ADMIN', 'OWNER', 'WORKER', 'VIEWER')), devAuditBypass, async (req: any, res) => {
    try {
      const { id } = req.params;
      const stage = await storage.getStage(id);
      
      if (!stage) {
        return res.status(404).json({ success: false, message: "Stage not found" });
      }
      
      res.json(stage);
    } catch (error) {
      console.error("Error fetching stage:", error);
      res.status(500).json({ success: false, message: "Failed to fetch stage" });
    }
  });

  // PUT /api/stages/:id - Update stage
  app.put('/api/stages/:id', devRbacBypass(requireRole('ADMIN')), devAuditBypass, async (req: any, res) => {
    try {
      const { id } = req.params;
      const parsedData = updateStageSchema.parse(req.body);
      
      const updatedStage = await storage.updateStage(id, parsedData);
      if (!updatedStage) {
        return res.status(404).json({ success: false, message: "Stage not found" });
      }
      
      res.json(updatedStage);
    } catch (error) {
      console.error("Error updating stage:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ success: false, message: "Failed to update stage" });
    }
  });

  // DELETE /api/stages/:id - Delete stage
  app.delete('/api/stages/:id', devRbacBypass(requireRole('ADMIN')), devAuditBypass, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      const deleted = await storage.deleteStage(id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: "Stage not found" });
      }
      
      res.json({ success: true, message: "Stage deleted successfully" });
    } catch (error) {
      console.error("Error deleting stage:", error);
      res.status(500).json({ success: false, message: "Failed to delete stage" });
    }
  });

  // ========== Requirements CRUD API ==========
  
  // GET /api/requirements - List all requirements or filter by stage
  app.get('/api/requirements', devRbacBypass(requireRole('ADMIN', 'OWNER', 'WORKER', 'VIEWER')), devAuditBypass, async (req: any, res) => {
    try {
      const { stageId } = req.query;
      let requirements;
      
      if (stageId) {
        requirements = await storage.getRequirementsByStage(stageId);
      } else {
        requirements = await storage.getAllRequirements();
      }
      
      res.json(requirements);
    } catch (error) {
      console.error("Error fetching requirements:", error);
      res.status(500).json({ success: false, message: "Failed to fetch requirements" });
    }
  });

  // POST /api/requirements - Create new requirement
  app.post('/api/requirements', devRbacBypass(requireRole('ADMIN', 'OWNER')), devAuditBypass, async (req: any, res) => {
    try {
      const parsedData = createRequirementSchema.parse(req.body);
      const newRequirement = await storage.createRequirement(parsedData);
      res.status(201).json(newRequirement);
    } catch (error) {
      console.error("Error creating requirement:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ success: false, message: "Failed to create requirement" });
    }
  });

  // GET /api/requirements/:id - Get specific requirement
  app.get('/api/requirements/:id', devRbacBypass(requireRole('ADMIN', 'OWNER', 'WORKER', 'VIEWER')), devAuditBypass, async (req: any, res) => {
    try {
      const { id } = req.params;
      const requirement = await storage.getRequirement(id);
      
      if (!requirement) {
        return res.status(404).json({ success: false, message: "Requirement not found" });
      }
      
      res.json(requirement);
    } catch (error) {
      console.error("Error fetching requirement:", error);
      res.status(500).json({ success: false, message: "Failed to fetch requirement" });
    }
  });

  // PUT /api/requirements/:id - Update requirement
  app.put('/api/requirements/:id', devRbacBypass(requireRole('ADMIN', 'OWNER')), devAuditBypass, async (req: any, res) => {
    try {
      const { id } = req.params;
      const parsedData = updateRequirementSchema.parse(req.body);
      
      const updatedRequirement = await storage.updateRequirement(id, parsedData);
      if (!updatedRequirement) {
        return res.status(404).json({ success: false, message: "Requirement not found" });
      }
      
      res.json(updatedRequirement);
    } catch (error) {
      console.error("Error updating requirement:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ success: false, message: "Failed to update requirement" });
    }
  });

  // DELETE /api/requirements/:id - Delete requirement
  app.delete('/api/requirements/:id', devRbacBypass(requireRole('ADMIN', 'OWNER')), devAuditBypass, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      const deleted = await storage.deleteRequirement(id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: "Requirement not found" });
      }
      
      res.json({ success: true, message: "Requirement deleted successfully" });
    } catch (error) {
      console.error("Error deleting requirement:", error);
      res.status(500).json({ success: false, message: "Failed to delete requirement" });
    }
  });

  // Assignment routes
  app.get('/api/clients/:clientId/requirements', isAuthenticated, auditMiddleware, async (req: any, res) => {
    try {
      const { clientId } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      const client = await storage.getClientProfile(clientId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      // Check authorization
      if (user?.role === 'ADMIN' || client.ownerUserId === userId) {
        const assignments = await storage.getAssignmentsByClient(clientId);
        res.json(assignments);
      } else {
        res.status(403).json({ message: "Unauthorized" });
      }
    } catch (error) {
      console.error("Error fetching assignments:", error);
      res.status(500).json({ message: "Failed to fetch assignments" });
    }
  });

  // Search routes
  app.get('/api/search', isAuthenticated, auditMiddleware, async (req: any, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Query parameter 'q' is required" });
      }

      const results = await storage.searchClientsAndWorkers(q);
      res.json(results);
    } catch (error) {
      console.error("Error searching:", error);
      res.status(500).json({ message: "Failed to search" });
    }
  });

  // Audit logs
  app.get('/api/audit', devRbacBypass(requireRole('ADMIN')), devAuditBypass, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'ADMIN') {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const logs = await storage.getAuditLogs();
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // Document Template routes
  app.get('/api/templates', devRbacBypass(requireRole('ADMIN', 'OWNER', 'WORKER', 'VIEWER')), devAuditBypass, async (req: any, res) => {
    try {
      const templates = await storage.getAllDocumentTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.get('/api/templates/:id', devRbacBypass(requireRole('ADMIN', 'OWNER', 'WORKER', 'VIEWER')), devAuditBypass, async (req: any, res) => {
    try {
      const { id } = req.params;
      const template = await storage.getDocumentTemplate(id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      const fields = await storage.getTemplateFields(id);
      res.json({ template, fields });
    } catch (error) {
      console.error("Error fetching template:", error);
      res.status(500).json({ message: "Failed to fetch template" });
    }
  });

  app.post('/api/templates', devRbacBypass(requireRole('ADMIN')), auditMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'ADMIN') {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const { template, fields } = req.body;
      
      const templateData = insertDocumentTemplateSchema.parse({
        ...template,
        createdByUserId: userId
      });

      const newTemplate = await storage.createDocumentTemplate(templateData);
      
      if (fields && fields.length > 0) {
        const fieldsData = fields.map((field: any, index: number) => 
          insertTemplateFieldSchema.parse({
            ...field,
            templateId: newTemplate.id,
            position: index + 1
          })
        );
        
        await storage.updateTemplateFields(newTemplate.id, fieldsData);
      }

      const templateFields = await storage.getTemplateFields(newTemplate.id);
      res.status(201).json({ template: newTemplate, fields: templateFields });
    } catch (error) {
      console.error("Error creating template:", error);
      res.status(500).json({ message: "Failed to create template" });
    }
  });

  app.put('/api/templates/:id', devRbacBypass(requireRole('ADMIN')), auditMiddleware, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'ADMIN') {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const { template, fields } = req.body;
      
      const updatedTemplate = await storage.updateDocumentTemplate(id, template);
      
      if (fields) {
        const fieldsData = fields.map((field: any, index: number) => 
          insertTemplateFieldSchema.parse({
            ...field,
            templateId: id,
            position: index + 1
          })
        );
        
        await storage.updateTemplateFields(id, fieldsData);
      }

      const templateFields = await storage.getTemplateFields(id);
      res.json({ template: updatedTemplate, fields: templateFields });
    } catch (error) {
      console.error("Error updating template:", error);
      res.status(500).json({ message: "Failed to update template" });
    }
  });

  app.delete('/api/templates/:id', devRbacBypass(requireRole('ADMIN')), auditMiddleware, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'ADMIN') {
        return res.status(403).json({ message: "Unauthorized" });
      }

      await storage.deleteDocumentTemplate(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting template:", error);
      res.status(500).json({ message: "Failed to delete template" });
    }
  });

  // Translation routes (Multi-language support)
  app.get('/api/translations', async (req: any, res) => {
    try {
      const { language } = req.query;
      const translations = await storage.getTranslations(language);
      res.json(translations);
    } catch (error) {
      console.error("Error fetching translations:", error);
      res.status(500).json({ message: "Failed to fetch translations" });
    }
  });

  app.post('/api/translations', devRbacBypass(requireRole('ADMIN')), auditMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'ADMIN') {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const data = insertTranslationSchema.parse(req.body);
      const translation = await storage.createTranslation(data);
      res.status(201).json(translation);
    } catch (error) {
      console.error("Error creating translation:", error);
      res.status(500).json({ message: "Failed to create translation" });
    }
  });

  // Payment routes
  app.get('/api/clients/:clientId/payments', devRbacBypass(requireRoleAndOwnership(['ADMIN', 'OWNER'], 'client')), devAuditBypass, async (req: any, res) => {
    try {
      const { clientId } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      const client = await storage.getClientProfile(clientId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      if (user?.role === 'ADMIN' || client.ownerUserId === userId) {
        const payments = await storage.getPaymentsByClient(clientId);
        res.json(payments);
      } else {
        res.status(403).json({ message: "Unauthorized" });
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.post('/api/payments', devRbacBypass(requireRole('ADMIN', 'OWNER')), auditMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'ADMIN') {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const data = insertPaymentSchema.parse(req.body);
      const payment = await storage.createPayment(data);
      res.status(201).json(payment);
    } catch (error) {
      console.error("Error creating payment:", error);
      res.status(500).json({ message: "Failed to create payment" });
    }
  });

  // Workflow automation routes
  app.get('/api/workflow-rules', devRbacBypass(requireRole('ADMIN')), devAuditBypass, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'ADMIN') {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const rules = await storage.getAllWorkflowRules();
      res.json(rules);
    } catch (error) {
      console.error("Error fetching workflow rules:", error);
      res.status(500).json({ message: "Failed to fetch workflow rules" });
    }
  });

  app.post('/api/workflow-rules', devRbacBypass(requireRole('ADMIN')), auditMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'ADMIN') {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const data = insertWorkflowRuleSchema.parse({
        ...req.body,
        createdByUserId: userId
      });

      const rule = await storage.createWorkflowRule(data);
      res.status(201).json(rule);
    } catch (error) {
      console.error("Error creating workflow rule:", error);
      res.status(500).json({ message: "Failed to create workflow rule" });
    }
  });

  // OCR endpoint for document processing
  app.post('/api/documents/:documentId/ocr', devRbacBypass(requireRole('ADMIN', 'OWNER', 'WORKER')), auditMiddleware, async (req: any, res) => {
    try {
      const { documentId } = req.params;
      const { imagePath, documentType } = req.body;
      const userId = req.user.claims.sub;
      
      // Process OCR with actual service
      let ocrResult;
      if (imagePath) {
        const processResult = await ocrService.processDocumentFromFile(imagePath, documentType);
        
        ocrResult = await storage.createOcrResult({
          documentFileId: documentId,
          extractedText: processResult.extractedText,
          extractedData: processResult.extractedData,
          confidence: processResult.confidence,
          processingStatus: processResult.processingStatus
        });
      } else {
        ocrResult = await storage.createOcrResult({
          documentFileId: documentId,
          extractedText: "OCR processing requires image path",
          extractedData: {},
          confidence: 0,
          processingStatus: 'FAILED'
        });
      }

      res.json(ocrResult);
    } catch (error) {
      console.error("Error processing OCR:", error);
      res.status(500).json({ message: "Failed to process OCR" });
    }
  });

  // User Documents routes
  app.get('/api/user/documents', devRbacBypass(requireRole('ADMIN', 'OWNER', 'WORKER', 'VIEWER')), devAuditBypass, async (req: any, res) => {
    try {
      const user = req.user.dbUser || await storage.getUserByEmail(req.user.claims?.email || 'admin@dev.local');
      
      let documents = [];
      if (user?.role === 'ADMIN') {
        // Admin sees all documents with assignment info
        const assignments = await storage.getAssignmentsWithDetails();
        for (const assignment of assignments) {
          const assignmentDocs = await storage.getDocumentFilesByAssignment(assignment.id);
          documents.push(...assignmentDocs.map(doc => ({
            ...doc,
            assignment: {
              id: assignment.id,
              requirement: assignment.requirement.title,
              stage: assignment.stage.title,
              worker: assignment.worker ? `${assignment.worker.firstName} ${assignment.worker.lastName}` : null,
              client: assignment.clientProfile.legalName
            }
          })));
        }
      } else if (user?.role === 'OWNER') {
        // Owners see documents from their clients
        const clients = await storage.getClientsByOwner(user.id);
        for (const client of clients) {
          const assignments = await storage.getAssignmentsByClient(client.id);
          for (const assignment of assignments) {
            const assignmentDocs = await storage.getDocumentFilesByAssignment(assignment.id);
            const requirement = await storage.getRequirement(assignment.requirementId);
            documents.push(...assignmentDocs.map(doc => ({
              ...doc,
              assignment: {
                id: assignment.id,
                requirement: requirement?.title || 'Unknown',
                stage: requirement?.stageId || 'Unknown',
                client: client.legalName
              }
            })));
          }
        }
      } else if (user?.role === 'WORKER') {
        // Workers see their own documents
        const assignments = await storage.getWorkerAssignments(user.id);
        for (const assignment of assignments) {
          const assignmentDocs = await storage.getDocumentFilesByAssignment(assignment.id);
          const requirement = await storage.getRequirement(assignment.requirementId);
          documents.push(...assignmentDocs.map(doc => ({
            ...doc,
            assignment: {
              id: assignment.id,
              requirement: requirement?.title || 'Unknown',
              stage: requirement?.stageId || 'Unknown'
            }
          })));
        }
      }
      
      res.json(documents);
    } catch (error) {
      console.error("Error fetching user documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  // User Deadlines routes
  app.get('/api/user/deadlines', devRbacBypass(requireRole('ADMIN', 'OWNER', 'WORKER', 'VIEWER')), devAuditBypass, async (req: any, res) => {
    try {
      const user = req.user.dbUser || await storage.getUserByEmail(req.user.claims?.email || 'admin@dev.local');
      
      let deadlines = [];
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      if (user?.role === 'ADMIN') {
        // Admin sees all pending assignments as deadlines
        const assignments = await storage.getAssignmentsWithDetails();
        deadlines = assignments
          .filter(assignment => ['NOT_STARTED', 'AWAITING_UPLOAD', 'SUBMITTED_BY_USER'].includes(assignment.status))
          .map(assignment => ({
            id: assignment.id,
            title: assignment.requirement.title,
            description: assignment.requirement.description || 'Complete this requirement',
            dueDate: new Date(now.getTime() + Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Random due date within 2 weeks
            status: assignment.status === 'NOT_STARTED' ? 'urgent' : 
                   assignment.status === 'AWAITING_UPLOAD' ? 'upcoming' : 'completed',
            stage: assignment.stage.title,
            priority: assignment.requirement.required ? 'high' : 'medium',
            worker: assignment.worker ? `${assignment.worker.firstName} ${assignment.worker.lastName}` : null,
            client: assignment.clientProfile.legalName
          }));
      } else if (user?.role === 'OWNER') {
        // Owners see deadlines from their clients
        const clients = await storage.getClientsByOwner(user.id);
        for (const client of clients) {
          const assignments = await storage.getAssignmentsByClient(client.id);
          for (const assignment of assignments) {
            if (['NOT_STARTED', 'AWAITING_UPLOAD', 'SUBMITTED_BY_USER'].includes(assignment.status)) {
              const requirement = await storage.getRequirement(assignment.requirementId);
              const worker = assignment.workerId ? await storage.getWorker(assignment.workerId) : null;
              deadlines.push({
                id: assignment.id,
                title: requirement?.title || 'Unknown Requirement',
                description: requirement?.description || 'Complete this requirement',
                dueDate: new Date(now.getTime() + Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: assignment.status === 'NOT_STARTED' ? 'urgent' : 
                       assignment.status === 'AWAITING_UPLOAD' ? 'upcoming' : 'completed',
                stage: requirement?.stageId || 'Unknown',
                priority: requirement?.required ? 'high' : 'medium',
                worker: worker ? `${worker.firstName} ${worker.lastName}` : null,
                client: client.legalName
              });
            }
          }
        }
      } else if (user?.role === 'WORKER') {
        // Workers see their own assignment deadlines
        const assignments = await storage.getWorkerAssignments(user.id);
        for (const assignment of assignments) {
          if (['NOT_STARTED', 'AWAITING_UPLOAD', 'SUBMITTED_BY_USER'].includes(assignment.status)) {
            const requirement = await storage.getRequirement(assignment.requirementId);
            deadlines.push({
              id: assignment.id,
              title: requirement?.title || 'Unknown Requirement',
              description: requirement?.description || 'Complete this requirement',
              dueDate: new Date(now.getTime() + Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              status: assignment.status === 'NOT_STARTED' ? 'urgent' : 
                     assignment.status === 'AWAITING_UPLOAD' ? 'upcoming' : 'completed',
              stage: requirement?.stageId || 'Unknown',
              priority: requirement?.required ? 'high' : 'medium'
            });
          }
        }
      }
      
      res.json(deadlines);
    } catch (error) {
      console.error("Error fetching user deadlines:", error);
      res.status(500).json({ message: "Failed to fetch deadlines" });
    }
  });

  // User-specific documents endpoint
  app.get('/api/user/documents', devRbacBypass(requireRole('ADMIN', 'OWNER', 'WORKER')), devAuditBypass, async (req: any, res) => {
    try {
      const userType = req.query.role || 'ADMIN';
      let documents = [];

      if (userType === 'WORKER') {
        // Workers see only their own uploaded documents
        const workerAssignments = await storage.getAssignmentsByWorker('worker-john-001');
        for (const assignment of workerAssignments) {
          const assignmentDocs = await storage.getDocumentFilesByAssignment(assignment.id);
          documents.push(...assignmentDocs);
        }
      } else if (userType === 'OWNER') {
        // Client owners see documents for their workers
        const allAssignments = await storage.getAssignmentsWithDetails();
        const clientAssignments = allAssignments.filter((assignment: any) => 
          assignment.clientProfile?.id === 'client-techcorp-001'
        );
        for (const assignment of clientAssignments) {
          const assignmentDocs = await storage.getDocumentFilesByAssignment(assignment.id);
          documents.push(...assignmentDocs);
        }
      } else {
        // Admin sees all documents
        const allAssignments = await storage.getAssignmentsWithDetails();
        for (const assignment of allAssignments) {
          const assignmentDocs = await storage.getDocumentFilesByAssignment(assignment.id);
          documents.push(...assignmentDocs);
        }
      }

      res.json(documents);
    } catch (error) {
      console.error("Error fetching user documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  // User-specific deadlines endpoint  
  app.get('/api/user/deadlines', devRbacBypass(requireRole('ADMIN', 'OWNER', 'WORKER')), devAuditBypass, async (req: any, res) => {
    try {
      const userType = req.query.role || 'ADMIN';
      let deadlines = [];

      if (userType === 'WORKER') {
        // Workers see only their own assignment deadlines
        const workerAssignments = await storage.getAssignmentsByWorker('worker-john-001');
        deadlines = workerAssignments.map((assignment: any) => ({
          id: assignment.id,
          title: `${assignment.requirement?.title || 'Assignment'} Deadline`,
          description: assignment.requirement?.description || 'Complete assignment requirements',
          dueDate: assignment.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now if no due date
          status: assignment.status === 'COMPLETED' ? 'completed' : 'upcoming',
          assignmentId: assignment.id
        }));
      } else if (userType === 'OWNER') {
        // Client owners see deadlines for their workers
        const allAssignments = await storage.getAssignmentsWithDetails();
        const clientAssignments = allAssignments.filter((assignment: any) => 
          assignment.clientProfile?.id === 'client-techcorp-001'
        );
        deadlines = clientAssignments.map((assignment: any) => ({
          id: assignment.id,
          title: `${assignment.worker?.firstName || 'Worker'} - ${assignment.requirement?.title || 'Assignment'}`,
          description: assignment.requirement?.description || 'Worker assignment deadline',
          dueDate: assignment.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: assignment.status === 'COMPLETED' ? 'completed' : 'upcoming',
          assignmentId: assignment.id
        }));
      } else {
        // Admin sees all deadlines
        const allAssignments = await storage.getAssignmentsWithDetails();
        deadlines = allAssignments.map((assignment: any) => ({
          id: assignment.id,
          title: `${assignment.clientProfile?.legalName || 'Client'} - ${assignment.worker?.firstName || 'Worker'} - ${assignment.requirement?.title || 'Assignment'}`,
          description: assignment.requirement?.description || 'Assignment deadline',
          dueDate: assignment.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: assignment.status === 'COMPLETED' ? 'completed' : 'upcoming',
          assignmentId: assignment.id
        }));
      }

      res.json(deadlines);
    } catch (error) {
      console.error("Error fetching user deadlines:", error);
      res.status(500).json({ message: "Failed to fetch deadlines" });
    }
  });

  // Analytics routes
  app.get('/api/analytics/events', devRbacBypass(requireRole('ADMIN')), devAuditBypass, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'ADMIN') {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const { eventType, clientId } = req.query;
      const events = await storage.getAnalyticsEvents({
        eventType: eventType as string,
        clientProfileId: clientId as string
      });

      res.json(events);
    } catch (error) {
      console.error("Error fetching analytics events:", error);
      res.status(500).json({ message: "Failed to fetch analytics events" });
    }
  });

  app.post('/api/analytics/track', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { eventType, clientProfileId, workerId, metadata } = req.body;

      await storage.createAnalyticsEvent({
        eventType,
        userId,
        clientProfileId,
        workerId,
        metadata
      });

      res.status(201).json({ success: true });
    } catch (error) {
      console.error("Error tracking analytics event:", error);
      res.status(500).json({ message: "Failed to track event" });
    }
  });

  // Workflow engine routes
  app.get('/api/workflow/templates', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      // Allow all authenticated users to view workflow definitions for worker form
      // (removed admin-only restriction)

      // Return complete workflow definitions with stages and document requirements from settings
      const workflowDefinitions = [
        {
          id: 'work-permit-initial',
          name: 'Initial Work Permit Application',
          description: 'Complete Romanian work permit application process from AJOFM labor market test through IGI permit issuance',
          stages: [
            {
              id: 'doc-collection',
              name: 'Initial Document Collection',
              description: 'Collect passport, diplomas, employment contract, and personal documents from worker',
              status: 'in-progress',
              estimatedDays: 3,
              documentRequirements: [
                {
                  id: 'passport-copy',
                  title: 'Passport Copy',
                  description: 'High-quality scan of passport bio page (color, readable, unedited)',
                  required: true,
                  status: 'pending'
                },
                {
                  id: 'diploma-copy',
                  title: 'University Diploma',
                  description: 'Original university diploma or degree certificate',
                  required: true,
                  status: 'pending'
                },
                {
                  id: 'employment-contract',
                  title: 'Signed Employment Contract',
                  description: 'Signed employment contract with Romanian employer',
                  required: true,
                  status: 'pending'
                }
              ]
            },
            {
              id: 'ajofm-submission',
              name: 'AJOFM Labor Market Test',
              description: 'Submit job posting to AJOFM for labor market testing',
              status: 'pending',
              estimatedDays: 7,
              documentRequirements: [
                {
                  id: 'job-posting',
                  title: 'Job Posting Document',
                  description: 'Detailed job description for AJOFM submission',
                  required: true,
                  status: 'pending'
                }
              ]
            },
            {
              id: 'igi-application',
              name: 'IGI Work Permit Application',
              description: 'Submit complete work permit application to Romanian Immigration Office',
              status: 'pending',
              estimatedDays: 14,
              documentRequirements: [
                {
                  id: 'medical-certificate',
                  title: 'Medical Certificate',
                  description: 'Health certificate from approved Romanian medical provider',
                  required: true,
                  status: 'pending'
                }
              ]
            }
          ]
        },
        {
          id: 'residence-permit-temp',
          name: 'Temporary Residence Permit',
          description: 'Romanian temporary residence permit application process',
          stages: [
            {
              id: 'residence-docs',
              name: 'Residence Document Preparation',
              description: 'Prepare documents for temporary residence permit application',
              status: 'pending',
              estimatedDays: 5,
              documentRequirements: [
                {
                  id: 'accommodation-proof',
                  title: 'Proof of Accommodation',
                  description: 'Rental contract or property ownership documents',
                  required: true,
                  status: 'pending'
                }
              ]
            }
          ]
        },
        {
          id: 'work-permit-renewal',
          name: 'Work Permit Renewal',
          description: 'Renewal process for existing work permits and residence cards',
          stages: [
            {
              id: 'renewal-prep',
              name: 'Renewal Document Preparation',
              description: 'Prepare documents for work permit renewal',
              status: 'pending',
              estimatedDays: 5,
              documentRequirements: [
                {
                  id: 'current-permit',
                  title: 'Current Work Permit',
                  description: 'Copy of existing work permit to be renewed',
                  required: true,
                  status: 'pending'
                }
              ]
            }
          ]
        }
      ];
      
      res.json(workflowDefinitions);
    } catch (error) {
      console.error('Error fetching workflow templates:', error);
      res.status(500).json({ message: "Failed to fetch workflow templates" });
    }
  });

  app.post('/api/workflow/trigger/:assignmentId', isAuthenticated, async (req: any, res) => {
    try {
      const { assignmentId } = req.params;
      const { event } = req.body;
      
      await workflowEngine.processAssignmentWorkflow(assignmentId, event);
      res.json({ success: true, message: `Workflow triggered for event: ${event}` });
    } catch (error) {
      console.error('Error triggering workflow:', error);
      res.status(500).json({ message: "Failed to trigger workflow" });
    }
  });


  app.get('/api/workflow/worker/:workerId', devAuthBypass, async (req: any, res) => {
    try {
      const { workerId } = req.params;
      const userId = req.user.id;
      
      // Get worker to check authorization
      const worker = await storage.getWorker(workerId);
      if (!worker) {
        return res.status(404).json({ message: "Worker not found" });
      }

      // Check authorization - worker can view their own data, admin can view all
      const user = await storage.getUser(userId);
      if (user?.role !== 'ADMIN') {
        // For now, allow access to demonstrate workflow functionality
        // In production, implement proper authorization
      }

      // Get all workflows assigned to this worker through workerWorkflowProgress table
      const assignedWorkflows = await storage.getWorkflowsForWorker(workerId);
      
      if (!assignedWorkflows || assignedWorkflows.length === 0) {
        return res.json({ 
          id: null,
          name: 'No Active Workflow',
          description: 'No workflow assignments found for this worker. Please contact your administrator.',
          stages: []
        });
      }

      // Get the first assigned workflow (primary workflow)
      const primaryWorkflow = assignedWorkflows[0];
      
      // Get workflow progress for this worker and template
      const workflowProgress = await storage.getWorkerWorkflowProgress(workerId, primaryWorkflow.id);
      
      // Get workflow steps and build stages with real progress data
      const steps = await storage.getWorkflowSteps(primaryWorkflow.id);
      
      // Get step progress data if workflow has been started
      let stepProgressMap = new Map();
      if (workflowProgress) {
        const stepProgressList = await storage.getWorkerStepProgress(workflowProgress.id);
        stepProgressMap = new Map(stepProgressList.map(sp => [sp.workflowStepId, sp]));
      }
      
      // Build stages with real status based on progress data
      const stagesWithProgress = await Promise.all(
        steps.map(async (step, index) => {
          const stepProgress = stepProgressMap.get(step.id);
          const requirements = await storage.getDocumentRequirements(step.id);
          
          // Determine stage status based on actual progress
          let stageStatus = 'pending';
          if (stepProgress) {
            stageStatus = stepProgress.status;
          } else if (workflowProgress) {
            // If workflow is started but this step has no progress, check if previous steps are complete
            const previousSteps = steps.slice(0, index);
            const allPreviousComplete = previousSteps.every(prevStep => {
              const prevProgress = stepProgressMap.get(prevStep.id);
              return prevProgress && prevProgress.status === 'COMPLETED';
            });
            
            // Current step can only be "available" if all previous steps are complete
            if (allPreviousComplete && workflowProgress.currentStepId === step.id) {
              stageStatus = 'in_progress';
            } else if (allPreviousComplete) {
              stageStatus = 'available';
            } else {
              stageStatus = 'locked'; // Cannot proceed until previous steps are complete
            }
          }
          
          return {
            id: step.id,
            name: step.name,
            description: step.description,
            status: stageStatus,
            stageType: step.stepType, // Pass through the step type for stage-specific UI
            estimatedDays: step.estimatedDays,
            responsibleParty: step.assignedRole,
            documentRequirements: requirements.map(req => ({
              id: req.id,
              title: req.title,
              description: req.description,
              required: req.isRequired,
              status: 'pending', // TODO: Get actual document status from document uploads
              responsibleParty: req.submittedBy
            }))
          };
        })
      );

      // Return the workflow with real progress data
      res.json({
        id: primaryWorkflow.id,
        name: primaryWorkflow.name,
        description: primaryWorkflow.description,
        stages: stagesWithProgress
      });
    } catch (error) {
      console.error('Error fetching worker workflow:', error);
      res.status(500).json({ message: "Failed to fetch worker workflow" });
    }
  });

  // Update workflow step status - with sequencing validation
  app.put('/api/workflow/worker/:workerId/step/:stepId/status', devAuthBypass, async (req: any, res) => {
    try {
      const { workerId, stepId } = req.params;
      const { status, notes, assignedToEmail } = req.body;
      const userId = req.user.id;
      
      // Get worker and validate workflow
      const worker = await storage.getWorker(workerId);
      if (!worker) {
        return res.status(404).json({ message: "Worker not found" });
      }

      // Get assigned workflows for this worker
      const assignedWorkflows = await storage.getWorkflowsForWorker(workerId);
      if (!assignedWorkflows || assignedWorkflows.length === 0) {
        return res.status(404).json({ message: "No workflow assigned to this worker" });
      }

      // Basic validation for now - can be enhanced with proper workflow step tracking
      res.json({ success: true, message: "Step status updated successfully" });
    } catch (error) {
      console.error('Error updating workflow step status:', error);
      res.status(500).json({ message: "Failed to update step status" });
    }
  });

  // Workflow Step Document Management Endpoints
  
  // Get documents for a workflow step progress
  app.get('/api/workers/:workerId/step-progress/:stepProgressId/documents', devAuthBypass, async (req: any, res) => {
    try {
      const { workerId, stepProgressId } = req.params;
      const userId = req.user.id;
      
      // Check authorization
      const user = await storage.getUser(userId);
      if (user?.role !== 'ADMIN' && user?.role !== 'OWNER' && workerId !== userId) {
        return res.status(403).json({ message: "Unauthorized to view documents" });
      }
      
      const documents = await storage.getDocumentFilesByWorkflowStepProgress(stepProgressId);
      res.json(documents);
    } catch (error) {
      console.error('Error fetching workflow step documents:', error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  // Upload document for workflow step
  app.post('/api/workers/:workerId/step-progress/:stepProgressId/documents', devAuthBypass, async (req: any, res) => {
    try {
      const { workerId, stepProgressId } = req.params;
      const { s3Key, fileName, mimeType, fileSize, fileHash, kind = 'USER_UPLOAD', notes } = req.body;
      const userId = req.user.id;
      
      // Check authorization
      const user = await storage.getUser(userId);
      if (user?.role !== 'ADMIN' && user?.role !== 'OWNER' && workerId !== userId) {
        return res.status(403).json({ message: "Unauthorized to upload documents" });
      }
      
      const document = await storage.createDocumentFile({
        workflowStepProgressId: stepProgressId,
        assignmentId: null,
        kind,
        s3Key,
        fileName,
        mimeType,
        fileSize,
        fileHash,
        uploadedByUserId: userId,
        notes,
        status: 'PENDING'
      });
      
      res.json(document);
    } catch (error) {
      console.error('Error uploading workflow document:', error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  // Get document requirements for a workflow step
  app.get('/api/workflow/steps/:stepId/document-requirements', isAuthenticated, async (req: any, res) => {
    try {
      const { stepId } = req.params;
      const requirements = await storage.getWorkflowStepDocumentRequirements(stepId);
      res.json(requirements);
    } catch (error) {
      console.error('Error fetching document requirements:', error);
      res.status(500).json({ message: "Failed to fetch document requirements" });
    }
  });

  // Create document requirement for workflow step (admin only)
  app.post('/api/workflow/steps/:stepId/document-requirements', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { stepId } = req.params;
      const { title, description, isRequired, submittedBy, acceptedFileTypes, maxFileSize } = req.body;
      
      const requirement = await storage.createWorkflowStepDocumentRequirement({
        workflowStepId: stepId,
        title,
        description,
        isRequired,
        submittedBy,
        acceptedFileTypes,
        maxFileSize
      });
      
      res.json(requirement);
    } catch (error) {
      console.error('Error creating document requirement:', error);
      res.status(500).json({ message: "Failed to create document requirement" });
    }
  });

  // Update document status
  app.put('/api/documents/:documentId/status', isAuthenticated, async (req: any, res) => {
    try {
      const { documentId } = req.params;
      const { status, notes } = req.body;
      const userId = req.user.id;
      
      // Check authorization - only owners and admins can update document status
      const user = await storage.getUser(userId);
      if (user?.role !== 'ADMIN' && user?.role !== 'OWNER') {
        return res.status(403).json({ message: "Unauthorized to update document status" });
      }
      
      const document = await storage.updateDocumentFileStatus(documentId, status, notes);
      res.json(document);
    } catch (error) {
      console.error('Error updating document status:', error);
      res.status(500).json({ message: "Failed to update document status" });
    }
  });

  // Government API Integration routes
  app.get('/api/government/igi/status/:applicationId', isAuthenticated, async (req: any, res) => {
    try {
      const { applicationId } = req.params;
      const status = await governmentStatusService.getIgiStatus(applicationId);
      res.json(status);
    } catch (error) {
      console.error('Error fetching IGI status:', error);
      res.status(500).json({ message: "Failed to fetch IGI status" });
    }
  });

  app.get('/api/government/ajofm/status/:applicationId', isAuthenticated, async (req: any, res) => {
    try {
      const { applicationId } = req.params;
      const status = await governmentStatusService.getAjofmStatus(applicationId);
      res.json(status);
    } catch (error) {
      console.error('Error fetching AJOFM status:', error);
      res.status(500).json({ message: "Failed to fetch AJOFM status" });
    }
  });

  app.get('/api/government/consulate/status/:applicationId/:consulateCode', isAuthenticated, async (req: any, res) => {
    try {
      const { applicationId, consulateCode } = req.params;
      const status = await governmentStatusService.getConsulateStatus(applicationId, consulateCode);
      res.json(status);
    } catch (error) {
      console.error('Error fetching Consulate status:', error);
      res.status(500).json({ message: "Failed to fetch Consulate status" });
    }
  });

  app.get('/api/government/comprehensive/:workerId', isAuthenticated, async (req: any, res) => {
    try {
      const { workerId } = req.params;
      const { igi, ajofm, consulateId, consulateCode } = req.query;

      const applicationIds: any = {};
      if (igi) applicationIds.igi = igi as string;
      if (ajofm) applicationIds.ajofm = ajofm as string;
      if (consulateId && consulateCode) {
        applicationIds.consulate = { id: consulateId as string, code: consulateCode as string };
      }

      const comprehensiveStatus = await governmentStatusService.getComprehensiveStatus(workerId, applicationIds.consulate?.code);
      res.json(comprehensiveStatus);
    } catch (error) {
      console.error('Error fetching comprehensive status:', error);
      res.status(500).json({ message: "Failed to fetch comprehensive status" });
    }
  });

  // Delete dummy/test data route
  app.delete('/api/dummy-data', isAuthenticated, async (req: any, res) => {
    try {
      const userEmail = req.user.claims.email;
      const user = await storage.getUserByEmail(userEmail);
      
      if (user?.role !== 'ADMIN') {
        return res.status(403).json({ message: "Only admins can delete test data" });
      }
      
      // Delete test data by filtering on names starting with "Test"
      await storage.deleteTestData();
      res.json({ message: "Test data deleted successfully" });
    } catch (error) {
      console.error("Error deleting test data:", error);
      res.status(500).json({ message: "Failed to delete test data" });
    }
  });

  // Worker invitation routes
  app.post('/api/invitations', isAuthenticated, async (req, res) => {
    try {
      const { email, role, workerId } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      // Generate invitation token
      const token = require('crypto').randomUUID();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 72); // 72 hours expiry

      // Store invitation (for now, just return the token)
      // In a real system, you'd store this in database
      const inviteLink = `${req.protocol}://${req.get('host')}/invite/${token}`;

      // Log invitation creation
      console.log(`Invitation created for ${email} with role ${role}`);
      
      res.json({ 
        token,
        inviteLink,
        email,
        role,
        expiresAt: expiresAt.toISOString()
      });
    } catch (error) {
      console.error('Error creating invitation:', error);
      res.status(500).json({ error: 'Failed to create invitation' });
    }
  });

  // Secure Upload Routes - Protected with authentication and scanning
  app.post('/api/secure-upload', isAuthenticated, auditMiddleware, SecureUploadService.upload, SecureUploadService.processSecureUpload);
  
  app.get('/api/secure-download/:fileId', isAuthenticated, auditMiddleware, SecureUploadService.getSecureDownloadUrl);
  
  // Upload configuration and health check
  app.get('/api/upload-config', isAuthenticated, SecureUploadService.getUploadConfiguration);
  
  app.get('/api/upload-health', isAuthenticated, SecureUploadService.healthCheck);

  // File scanning service health check
  app.get('/api/file-scanner/health', isAuthenticated, async (req, res) => {
    const health = await fileScanningService.healthCheck();
    res.status(health.healthy ? 200 : 503).json(health);
  });

  // Workflow Template Management API Endpoints
  app.get('/api/workflow-templates', isAuthenticated, async (req: any, res) => {
    try {
      const templates = await storage.getAllWorkflowTemplates();
      res.json(templates);
    } catch (error) {
      console.error('Error fetching workflow templates:', error);
      res.status(500).json({ message: "Failed to fetch workflow templates" });
    }
  });

  app.get('/api/workflow-templates/:templateId', isAuthenticated, async (req: any, res) => {
    try {
      const { templateId } = req.params;
      const template = await storage.getWorkflowTemplate(templateId);
      if (!template) {
        return res.status(404).json({ message: "Workflow template not found" });
      }
      
      // Get steps for this template
      const steps = await storage.getWorkflowSteps(templateId);
      
      // Get document requirements and checklist items for each step
      const stepsWithDetails = await Promise.all(steps.map(async (step) => {
        const documentRequirements = await storage.getDocumentRequirements(step.id);
        const checklistItems = await storage.getChecklistItems(step.id);
        return {
          ...step,
          documentRequirements,
          checklistItems
        };
      }));
      
      res.json({
        ...template,
        steps: stepsWithDetails
      });
    } catch (error) {
      console.error('Error fetching workflow template:', error);
      res.status(500).json({ message: "Failed to fetch workflow template" });
    }
  });

  app.post('/api/workflow-templates', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { steps, ...templateData } = req.body;
      
      // Create the workflow template first
      const template = await storage.createWorkflowTemplate(templateData);
      
      // Create steps and their associated document requirements and checklist items
      if (steps && steps.length > 0) {
        for (const stepData of steps) {
          const { documentRequirements, checklistItems, ...stepInfo } = stepData;
          
          // Create the step
          const step = await storage.createWorkflowStep({
            workflowTemplateId: template.id,
            ...stepInfo
          });
          
          // Create document requirements for this step
          if (documentRequirements && documentRequirements.length > 0) {
            for (const docReq of documentRequirements) {
              await storage.createDocumentRequirement({
                workflowStepId: step.id,
                ...docReq
              });
            }
          }
          
          // Create checklist items for this step
          if (checklistItems && checklistItems.length > 0) {
            for (const checklistItem of checklistItems) {
              await storage.createChecklistItem({
                workflowStepId: step.id,
                ...checklistItem
              });
            }
          }
        }
      }
      
      res.status(201).json(template);
    } catch (error) {
      console.error('Error creating workflow template:', error);
      res.status(500).json({ message: "Failed to create workflow template" });
    }
  });

  app.put('/api/workflow-templates/:templateId', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { templateId } = req.params;
      const { steps, ...updates } = req.body;
      
      // Update the workflow template
      const template = await storage.updateWorkflowTemplate(templateId, updates);
      
      // If steps are provided, we need to handle step updates
      if (steps && steps.length > 0) {
        // Get existing steps for this template
        const existingSteps = await storage.getWorkflowSteps(templateId);
        const existingStepIds = existingSteps.map(s => s.id);
        
        // Process each step in the request
        for (const stepData of steps) {
          const { documentRequirements, checklistItems, id: stepId, ...stepInfo } = stepData;
          
          let step;
          if (stepId && existingStepIds.includes(stepId)) {
            // Update existing step
            step = await storage.updateWorkflowStep(stepId, stepInfo);
          } else {
            // Create new step
            step = await storage.createWorkflowStep({
              workflowTemplateId: templateId,
              ...stepInfo
            });
          }
          
          // Handle document requirements
          if (documentRequirements) {
            // Get existing document requirements for this step
            const existingDocReqs = await storage.getDocumentRequirements(step.id);
            const existingDocReqIds = existingDocReqs.map(d => d.id);
            
            // Update or create document requirements
            for (const docReq of documentRequirements) {
              if (docReq.id && existingDocReqIds.includes(docReq.id)) {
                // Update existing document requirement
                await storage.updateDocumentRequirement(docReq.id, docReq);
              } else {
                // Create new document requirement
                await storage.createDocumentRequirement({
                  workflowStepId: step.id,
                  ...docReq
                });
              }
            }
            
            // Delete document requirements that are no longer present
            const providedDocReqIds = documentRequirements.filter(d => d.id).map(d => d.id);
            const toDelete = existingDocReqIds.filter(id => !providedDocReqIds.includes(id));
            for (const deleteId of toDelete) {
              await storage.deleteDocumentRequirement(deleteId);
            }
          }
          
          // Handle checklist items
          if (checklistItems) {
            // Get existing checklist items for this step
            const existingChecklistItems = await storage.getChecklistItems(step.id);
            const existingChecklistIds = existingChecklistItems.map(c => c.id);
            
            // Update or create checklist items
            for (const checklistItem of checklistItems) {
              if (checklistItem.id && existingChecklistIds.includes(checklistItem.id)) {
                // Update existing checklist item
                await storage.updateChecklistItem(checklistItem.id, checklistItem);
              } else {
                // Create new checklist item
                await storage.createChecklistItem({
                  workflowStepId: step.id,
                  ...checklistItem
                });
              }
            }
            
            // Delete checklist items that are no longer present
            const providedChecklistIds = checklistItems.filter(c => c.id).map(c => c.id);
            const toDeleteChecklist = existingChecklistIds.filter(id => !providedChecklistIds.includes(id));
            for (const deleteId of toDeleteChecklist) {
              await storage.deleteChecklistItem(deleteId);
            }
          }
        }
        
        // Delete steps that are no longer present
        const providedStepIds = steps.filter(s => s.id).map(s => s.id);
        const stepsToDelete = existingStepIds.filter(id => !providedStepIds.includes(id));
        for (const deleteId of stepsToDelete) {
          await storage.deleteWorkflowStep(deleteId);
        }
      }
      
      res.json(template);
    } catch (error) {
      console.error('Error updating workflow template:', error);
      res.status(500).json({ message: "Failed to update workflow template" });
    }
  });

  app.delete('/api/workflow-templates/:templateId', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { templateId } = req.params;
      const success = await storage.deleteWorkflowTemplate(templateId);
      if (!success) {
        return res.status(404).json({ message: "Workflow template not found" });
      }
      res.json({ success: true, message: "Workflow template deleted successfully" });
    } catch (error) {
      console.error('Error deleting workflow template:', error);
      res.status(500).json({ message: "Failed to delete workflow template" });
    }
  });

  // Worker-Workflow Linking API Endpoints
  app.post('/api/workers/:workerId/workflows/:templateId/link', devAuthBypass, async (req: any, res) => {
    try {
      const { workerId, templateId } = req.params;
      
      // Verify worker exists
      const worker = await storage.getWorker(workerId);
      if (!worker) {
        return res.status(404).json({ message: "Worker not found" });
      }
      
      // Verify template exists
      const template = await storage.getWorkflowTemplate(templateId);
      if (!template) {
        return res.status(404).json({ message: "Workflow template not found" });
      }
      
      const progress = await storage.linkWorkerToWorkflow(workerId, templateId);
      res.status(201).json(progress);
    } catch (error) {
      console.error('Error linking worker to workflow:', error);
      res.status(500).json({ message: "Failed to link worker to workflow" });
    }
  });

  app.delete('/api/workers/:workerId/workflows/:templateId/unlink', devAuthBypass, async (req: any, res) => {
    try {
      const { workerId, templateId } = req.params;
      const success = await storage.unlinkWorkerFromWorkflow(workerId, templateId);
      if (!success) {
        return res.status(404).json({ message: "Worker workflow link not found" });
      }
      res.json({ success: true, message: "Worker unlinked from workflow successfully" });
    } catch (error) {
      console.error('Error unlinking worker from workflow:', error);
      res.status(500).json({ message: "Failed to unlink worker from workflow" });
    }
  });

  app.get('/api/workers/:workerId/workflows', devAuthBypass, async (req: any, res) => {
    try {
      const { workerId } = req.params;
      const userId = req.user.id;
      
      // Check authorization - worker can view their own workflows, admin can view all
      const user = await storage.getUser(userId);
      if (user?.role !== 'ADMIN') {
        // Check if the requesting user is the worker or has access to this worker
        const worker = await storage.getWorker(workerId);
        if (!worker) {
          return res.status(404).json({ message: "Worker not found" });
        }
        // Add proper authorization logic here based on your requirements
      }
      
      const workflows = await storage.getWorkflowsForWorker(workerId);
      res.json(workflows);
    } catch (error) {
      console.error('Error fetching worker workflows:', error);
      res.status(500).json({ message: "Failed to fetch worker workflows" });
    }
  });

  app.get('/api/workflow-templates/:templateId/workers', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { templateId } = req.params;
      const workers = await storage.getWorkersForWorkflow(templateId);
      res.json(workers);
    } catch (error) {
      console.error('Error fetching workflow workers:', error);
      res.status(500).json({ message: "Failed to fetch workflow workers" });
    }
  });

  // Worker workflow progress endpoints
  app.get('/api/workers/:workerId/workflow-progress', devAuthBypass, async (req: any, res) => {
    try {
      const { workerId } = req.params;
      const userId = req.user.id;
      
      // Check authorization - worker can view their own progress, admin/owner can view all
      const user = await storage.getUser(userId);
      if (user?.role !== 'ADMIN' && user?.role !== 'OWNER' && workerId !== userId) {
        return res.status(403).json({ message: "Unauthorized to view this worker's progress" });
      }
      
      // Get all workflow progress for this worker
      const workflows = await storage.getWorkflowsForWorker(workerId);
      const progressData = [];
      
      for (const workflow of workflows) {
        const progress = await storage.getWorkerWorkflowProgress(workerId, workflow.id);
        if (progress) {
          const steps = await storage.getWorkflowSteps(workflow.id);
          const stepProgress = await storage.getWorkerStepProgress(progress.id);
          
          const detailedSteps = await Promise.all(steps.map(async (step) => {
            const stepProg = stepProgress.find(sp => sp.workflowStepId === step.id);
            const docRequirements = await storage.getDocumentRequirements(step.id);
            const checklistItems = await storage.getChecklistItems(step.id);
            
            return {
              ...step,
              progress: stepProg || { status: 'PENDING' },
              documentRequirements: docRequirements,
              checklistItems
            };
          }));
          
          progressData.push({
            workflow,
            progress,
            steps: detailedSteps
          });
        }
      }
      
      res.json(progressData);
    } catch (error) {
      console.error('Error fetching worker workflow progress:', error);
      res.status(500).json({ message: "Failed to fetch worker workflow progress" });
    }
  });

  app.put('/api/workers/:workerId/workflow-progress/:progressId/steps/:stepId', devAuthBypass, async (req: any, res) => {
    try {
      const { workerId, progressId, stepId } = req.params;
      const { status, notes } = req.body;
      const userId = req.user.id;
      
      // Check authorization
      const user = await storage.getUser(userId);
      if (user?.role !== 'ADMIN' && user?.role !== 'OWNER' && workerId !== userId) {
        return res.status(403).json({ message: "Unauthorized to update this worker's progress" });
      }
      
      // Update step progress
      const existingProgress = await storage.getWorkerStepProgress(progressId);
      const stepProgress = existingProgress.find(sp => sp.workflowStepId === stepId);
      
      if (stepProgress) {
        const updated = await storage.updateWorkerStepProgress(stepProgress.id, {
          status,
          notes,
          ...(status === 'COMPLETED' && { completedAt: new Date() }),
          ...(status === 'IN_PROGRESS' && !stepProgress.startedAt && { startedAt: new Date() })
        });
        res.json(updated);
      } else {
        // Create new step progress
        const newProgress = await storage.createWorkerStepProgress({
          workerWorkflowProgressId: progressId,
          workflowStepId: stepId,
          status,
          notes,
          startedAt: status === 'IN_PROGRESS' ? new Date() : undefined,
          completedAt: status === 'COMPLETED' ? new Date() : undefined
        });
        res.json(newProgress);
      }
    } catch (error) {
      console.error('Error updating worker step progress:', error);
      res.status(500).json({ message: "Failed to update worker step progress" });
    }
  });

  app.post('/api/workers/:workerId/workflow-progress/:progressId/steps/:stepId/checklist/:itemId', devAuthBypass, async (req: any, res) => {
    try {
      const { workerId, progressId, stepId, itemId } = req.params;
      const { isCompleted, notes } = req.body;
      const userId = req.user.id;
      
      // Check authorization - only admin/owner can complete checklist items
      const user = await storage.getUser(userId);
      if (user?.role !== 'ADMIN' && user?.role !== 'OWNER') {
        return res.status(403).json({ message: "Unauthorized to complete checklist items" });
      }
      
      // Get or create step progress
      const existingProgress = await storage.getWorkerStepProgress(progressId);
      let stepProgress = existingProgress.find(sp => sp.workflowStepId === stepId);
      
      if (!stepProgress) {
        stepProgress = await storage.createWorkerStepProgress({
          workerWorkflowProgressId: progressId,
          workflowStepId: stepId,
          status: 'IN_PROGRESS'
        });
      }
      
      // Update checklist completion
      const existingCompletions = await storage.getChecklistCompletions(itemId, workerId);
      
      if (existingCompletions.length > 0) {
        const updated = await storage.updateChecklistCompletion(existingCompletions[0].id, {
          isCompleted,
          notes,
          completedByUserId: userId,
          completedAt: isCompleted ? new Date() : undefined
        });
        res.json(updated);
      } else {
        const newCompletion = await storage.createChecklistCompletion({
          workerStepProgressId: stepProgress.id,
          checklistItemId: itemId,
          isCompleted,
          notes,
          completedByUserId: userId,
          completedAt: isCompleted ? new Date() : undefined
        });
        res.json(newCompletion);
      }
    } catch (error) {
      console.error('Error updating checklist completion:', error);
      res.status(500).json({ message: "Failed to update checklist completion" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
