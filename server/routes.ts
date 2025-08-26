import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { auditMiddleware } from "./middleware/auth";
import { governmentApiService } from "./services/government-api";
import { ocrService } from "./services/ocr-service";
import { workflowEngine } from "./services/workflow-engine";
import { z } from "zod";
import { 
  insertClientProfileSchema, 
  insertWorkerSchema, 
  insertRequirementSchema,
  insertDocumentTemplateSchema,
  insertTemplateFieldSchema,
  insertPaymentSchema,
  insertWorkflowRuleSchema,
  insertTranslationSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Dashboard statistics
  app.get('/api/dashboard/stats', isAuthenticated, auditMiddleware, async (req: any, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard statistics" });
    }
  });

  app.get('/api/dashboard/assignments', isAuthenticated, auditMiddleware, async (req: any, res) => {
    try {
      const assignments = await storage.getAssignmentsWithDetails();
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching assignments with details:", error);
      res.status(500).json({ message: "Failed to fetch assignments" });
    }
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userEmail = req.user.claims.email;
      
      // Look up user by email since that's how we store them
      const user = await storage.getUserByEmail(userEmail);
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Client Profile routes
  app.get('/api/clients', isAuthenticated, auditMiddleware, async (req: any, res) => {
    try {
      const userEmail = req.user.claims.email;
      const user = await storage.getUserByEmail(userEmail);
      
      if (user?.role === 'ADMIN') {
        const clients = await storage.getAllClientProfiles();
        res.json(clients);
      } else if (user?.role === 'OWNER') {
        const client = await storage.getClientProfileByOwnerId(user.id);
        res.json(client ? [client] : []);
      } else {
        res.status(403).json({ message: "Unauthorized" });
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      const client = await storage.getClientProfile(clientId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      // Check authorization
      if (user?.role === 'ADMIN' || client.ownerUserId === userId) {
        const workers = await storage.getWorkersByClientId(clientId);
        res.json(workers);
      } else {
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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      const client = await storage.getClientProfile(clientId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      // Check authorization
      if (user?.role !== 'ADMIN' && client.ownerUserId !== userId) {
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

      const templates = workflowEngine.constructor.getWorkflowTemplates();
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

  const httpServer = createServer(app);
  return httpServer;
}
