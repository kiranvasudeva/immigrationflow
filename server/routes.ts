import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { auditMiddleware } from "./middleware/auth";
import { z } from "zod";
import { insertClientProfileSchema, insertWorkerSchema, insertRequirementSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Client Profile routes
  app.get('/api/clients', isAuthenticated, auditMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role === 'ADMIN') {
        const clients = await storage.getAllClientProfiles();
        res.json(clients);
      } else if (user?.role === 'OWNER') {
        const client = await storage.getClientProfileByOwnerId(userId);
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

  const httpServer = createServer(app);
  return httpServer;
}
