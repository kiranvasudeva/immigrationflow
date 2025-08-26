import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { auditMiddleware } from "./middleware/auth";
import { governmentApiService } from "./services/government-api";
import { ocrService } from "./services/ocr-service";
import { workflowEngine } from "./services/workflow-engine";
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
  insertInvitationSchema
} from "@shared/schema";
import { seedDatabase } from "./seedDatabase";

export async function registerRoutes(app: Express): Promise<Server> {
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

  // Dashboard statistics
  app.get('/api/dashboard/stats', devAuthBypass, devAuditBypass, async (req: any, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard statistics" });
    }
  });

  app.get('/api/dashboard/assignments', devAuthBypass, devAuditBypass, async (req: any, res) => {
    try {
      const assignments = await storage.getAssignmentsWithDetails();
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching assignments with details:", error);
      res.status(500).json({ message: "Failed to fetch assignments" });
    }
  });

  // Auth routes
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      // Development mode - simulate admin user
      if (process.env.NODE_ENV === 'development') {
        const adminUser = {
          id: "dev-admin-1",
          email: "admin@dev.local",
          firstName: "Admin",
          lastName: "User",
          role: "ADMIN",
          profileImageUrl: null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        return res.json(adminUser);
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

  // Invitation routes
  app.post('/api/invitations', isAuthenticated, auditMiddleware, async (req: any, res) => {
    try {
      const userEmail = req.user.claims.email;
      const user = await storage.getUserByEmail(userEmail);
      
      if (user?.role !== 'ADMIN' && user?.role !== 'OWNER') {
        return res.status(403).json({ message: "Unauthorized" });
      }

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

  app.get('/api/invitations', isAuthenticated, auditMiddleware, async (req: any, res) => {
    try {
      const userEmail = req.user.claims.email;
      const user = await storage.getUserByEmail(userEmail);
      
      if (user?.role !== 'ADMIN' && user?.role !== 'OWNER') {
        return res.status(403).json({ message: "Unauthorized" });
      }

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

  // Client Profile routes
  app.get('/api/clients', isAuthenticated, auditMiddleware, async (req: any, res) => {
    try {
      const userEmail = req.user.claims.email;
      const user = await storage.getUserByEmail(userEmail);
      
      if (user?.role === 'ADMIN') {
        const clients = await storage.getAllClientProfiles();
        
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
      } else if (user?.role === 'OWNER') {
        const client = await storage.getClientProfileByOwnerId(user.id);
        if (client) {
          const workers = await storage.getWorkersByClientId(client.id);
          const clientWithWorkerCount = {
            ...client,
            activeWorkers: workers.length
          };
          res.json([clientWithWorkerCount]);
        } else {
          res.json([]);
        }
      } else {
        res.status(403).json({ message: "Unauthorized" });
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.post('/api/clients', devAuthBypass, devAuditBypass, async (req: any, res) => {
    try {
      const userEmail = req.user.claims?.email || 'admin@dev.local';
      const user = await storage.getUserByEmail(userEmail);
      
      if (user?.role !== 'ADMIN') {
        return res.status(403).json({ message: "Only admins can create clients" });
      }

      const parsedData = insertClientProfileSchema.parse({
        ...req.body,
        ownerUserId: user.id
      });
      
      const newClient = await storage.createClientProfile(parsedData);
      res.status(201).json(newClient);
    } catch (error) {
      console.error("Error creating client:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create client profile" });
    }
  });

  app.get('/api/clients/:id', isAuthenticated, auditMiddleware, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      const client = await storage.getClientProfile(id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      // Check authorization
      if (user?.role === 'ADMIN' || client.ownerUserId === userId) {
        res.json(client);
      } else {
        res.status(403).json({ message: "Unauthorized" });
      }
    } catch (error) {
      console.error("Error fetching client:", error);
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  app.put('/api/clients/:id', isAuthenticated, auditMiddleware, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      const client = await storage.getClientProfile(id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      // Check authorization
      if (user?.role !== 'ADMIN' && client.ownerUserId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const parsedData = insertClientProfileSchema.omit({ id: true, ownerUserId: true }).parse(req.body);
      
      const updatedClient = await storage.updateClientProfile(id, parsedData);
      res.json(updatedClient);
    } catch (error) {
      console.error("Error updating client:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  app.post('/api/clients', isAuthenticated, auditMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'ADMIN' && user?.role !== 'OWNER') {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const data = insertClientProfileSchema.parse({
        ...req.body,
        ownerUserId: user.role === 'OWNER' ? userId : req.body.ownerUserId
      });

      const client = await storage.createClientProfile(data);
      res.status(201).json(client);
    } catch (error) {
      console.error("Error creating client:", error);
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  // Worker routes
  app.get('/api/clients/:clientId/workers', isAuthenticated, auditMiddleware, async (req: any, res) => {
    try {
      const { clientId } = req.params;
      const userEmail = req.user.claims.email;
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

  app.post('/api/clients/:clientId/workers', isAuthenticated, auditMiddleware, async (req: any, res) => {
    try {
      const { clientId } = req.params;
      const userEmail = req.user.claims.email;
      const user = await storage.getUserByEmail(userEmail);
      
      const client = await storage.getClientProfile(clientId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      // Check authorization
      if (user?.role !== 'ADMIN' && client.ownerUserId !== user?.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const data = insertWorkerSchema.parse({
        ...req.body,
        clientProfileId: clientId
      });

      const worker = await storage.createWorker(data);
      res.status(201).json(worker);
    } catch (error) {
      console.error("Error creating worker:", error);
      res.status(500).json({ message: "Failed to create worker" });
    }
  });

  // Stage routes
  app.get('/api/stages', isAuthenticated, async (req: any, res) => {
    try {
      const stages = await storage.getAllStages();
      res.json(stages);
    } catch (error) {
      console.error("Error fetching stages:", error);
      res.status(500).json({ message: "Failed to fetch stages" });
    }
  });

  // Requirements routes
  app.post('/api/requirements', isAuthenticated, auditMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'ADMIN') {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const data = insertRequirementSchema.parse({
        ...req.body,
        createdByUserId: userId
      });

      const requirement = await storage.createRequirement(data);
      res.status(201).json(requirement);
    } catch (error) {
      console.error("Error creating requirement:", error);
      res.status(500).json({ message: "Failed to create requirement" });
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
  app.get('/api/audit', isAuthenticated, async (req: any, res) => {
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
  app.get('/api/templates', isAuthenticated, async (req: any, res) => {
    try {
      const templates = await storage.getAllDocumentTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.get('/api/templates/:id', isAuthenticated, async (req: any, res) => {
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

  app.post('/api/templates', isAuthenticated, auditMiddleware, async (req: any, res) => {
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

  app.put('/api/templates/:id', isAuthenticated, auditMiddleware, async (req: any, res) => {
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

  app.delete('/api/templates/:id', isAuthenticated, auditMiddleware, async (req: any, res) => {
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

  app.post('/api/translations', isAuthenticated, auditMiddleware, async (req: any, res) => {
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
  app.get('/api/clients/:clientId/payments', isAuthenticated, async (req: any, res) => {
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

  app.post('/api/payments', isAuthenticated, auditMiddleware, async (req: any, res) => {
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
  app.get('/api/workflow-rules', isAuthenticated, async (req: any, res) => {
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

  app.post('/api/workflow-rules', isAuthenticated, auditMiddleware, async (req: any, res) => {
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
  app.post('/api/documents/:documentId/ocr', isAuthenticated, auditMiddleware, async (req: any, res) => {
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

  // Analytics routes
  app.get('/api/analytics/events', isAuthenticated, async (req: any, res) => {
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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'ADMIN') {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const templates = (workflowEngine.constructor as any).getWorkflowTemplates();
      res.json(templates);
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

  // Government API Integration routes
  app.get('/api/government/igi/status/:applicationId', isAuthenticated, async (req: any, res) => {
    try {
      const { applicationId } = req.params;
      const status = await governmentApiService.getIgiStatus(applicationId);
      res.json(status);
    } catch (error) {
      console.error('Error fetching IGI status:', error);
      res.status(500).json({ message: "Failed to fetch IGI status" });
    }
  });

  app.get('/api/government/ajofm/status/:applicationId', isAuthenticated, async (req: any, res) => {
    try {
      const { applicationId } = req.params;
      const status = await governmentApiService.getAjofmStatus(applicationId);
      res.json(status);
    } catch (error) {
      console.error('Error fetching AJOFM status:', error);
      res.status(500).json({ message: "Failed to fetch AJOFM status" });
    }
  });

  app.get('/api/government/consulate/status/:applicationId/:consulateCode', isAuthenticated, async (req: any, res) => {
    try {
      const { applicationId, consulateCode } = req.params;
      const status = await governmentApiService.getConsulateStatus(applicationId, consulateCode);
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

      const comprehensiveStatus = await governmentApiService.getComprehensiveStatus(workerId, applicationIds);
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

  const httpServer = createServer(app);
  return httpServer;
}
