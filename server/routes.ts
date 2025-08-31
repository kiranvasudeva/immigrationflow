// Clean fixed version of routes.ts with proper syntax
import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import { setupCORS } from "./middleware/security";
import { auditMiddleware } from "./middleware/auth";
import { requireRole, devRbacBypass } from "./middleware/rbac";
import { workflowEngine } from "./workflowEngine";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupSecurityHeaders, createRateLimiter, validateInput, createEmergencyAdminAccess } from "./middleware/security";
import { createStructuredLogger, performanceMonitoring, errorTracking, setupHealthChecks } from "./middleware/monitoring";
// Production config disabled temporarily to fix startup
// import { setupProductionSecurity } from "./config/production";
// import { productionValidator } from './config/production-validation';
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

  // Client logging endpoint
  app.use(express.json({ limit: '10mb' }));
  
  // Client logs endpoint
  app.post('/api/client-logs', (req, res) => {
    try {
      const { events } = req.body;
      
      if (!events || !Array.isArray(events)) {
        return res.status(400).json({ error: 'Invalid events array' });
      }

      // Process each log event
      events.forEach((event: any) => {
        const logMessage = `[CLIENT-${event.category?.toUpperCase()}] ${event.message}`;
        const logData = {
          ...event.data,
          timestamp: event.timestamp,
          userAgent: event.userAgent,
          url: event.url,
          ...(event.stack && { stack: event.stack })
        };

        // Log with appropriate level to console for visibility
        switch (event.level) {
          case 'error':
            console.error(`🔴 ${logMessage}`, logData);
            break;
          case 'warn':
            console.warn(`🟡 ${logMessage}`, logData);
            break;
          case 'debug':
            console.debug(`🔵 ${logMessage}`, logData);
            break;
          case 'info':
          default:
            console.info(`ℹ️  ${logMessage}`, logData);
            break;
        }
      });

      res.status(200).json({ 
        received: events.length,
        message: 'Logs processed successfully' 
      });
      
    } catch (error) {
      const err = error as Error;
      console.error('Error processing client logs:', err.message);
      res.status(500).json({ error: 'Failed to process logs' });
    }
  });

  // Basic test route
  app.get('/test', (req, res) => {
    res.json({ message: 'Server is working' });
  });

  // Workflow templates route (fixed)
  app.get('/api/workflow/templates', isAuthenticated, async (req: any, res) => {
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

  const httpServer = createServer(app);
  return httpServer;
}