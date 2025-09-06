// Clean fixed version of routes.ts with proper syntax
import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import { setupCORS } from "./middleware/security";
import { auditMiddleware } from "./middleware/auth";
import { requireRole, devRbacBypass } from "./middleware/rbac";
import { storage } from "./storage";
import { db } from "./db";
import { handleQABridge, qaBridgeAuth } from "./routes/qaBridge";
import { qaReportCache, type QAReport } from "./services/qaReportCache";
import { sql, eq, like, count, isNotNull } from "drizzle-orm";
import { users, clientProfiles, workers, stages, assignments, sessions, requirements, documentFiles, auditLogs, workflowStepTypeEnum, assignedToRoleEnum } from "../shared/schema";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupSecurityHeaders, createRateLimiter, validateInput, createEmergencyAdminAccess } from "./middleware/security";
import { createStructuredLogger, performanceMonitoring, errorTracking, setupHealthChecks } from "./middleware/monitoring";
import { ROMANIAN_WORK_PERMIT_WORKFLOW, mapWorkflowStepToAPI } from "./config/mapping";
import { authService } from "./services/authService";
import { gdprService } from "./services/gdprService";
import { csrfMiddleware } from "./middleware/csrf";
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';

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

  // Set up cookie parser
  app.use(cookieParser());

  // Rate limiting for auth routes
  const authRateLimit = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10, // Limit each IP to 10 requests per windowMs
    message: { error: 'Too many login attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path.includes('/healthz'),
  });

  // Apply CSRF middleware (TODO: Enable after session setup is fixed)
  // app.use(csrfMiddleware.generateToken);
  // app.use(csrfMiddleware.verifyToken);

  // Set up authentication (feature flag based)
  if (process.env.AUTH_MODE === 'password') {
    // Password-based authentication
    
    // Enhanced auth endpoints with feature flag
    app.post('/auth/login', authRateLimit, async (req, res) => {
      try {
        const { email, password } = req.body;
        
        if (!email || !password) {
          return res.status(400).json({ 
            error: 'Email and password are required' 
          });
        }

        // Authenticate user
        const user = await authService.authenticateUser(email, password);
        if (!user) {
          return res.status(401).json({ 
            error: 'Invalid credentials' 
          });
        }

        // Generate token pair
        const tokenPair = await authService.generateTokenPair(user);

        // Set secure cookies
        res.cookie('access_token', tokenPair.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 15 * 60 * 1000, // 15 minutes
        });

        res.cookie('refresh_token', tokenPair.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });

        res.json({
          user: {
            id: user.id,
            email: authService.maskEmail(user.email),
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
          },
          message: 'Login successful',
        });

      } catch (error: any) {
        console.error('Login error:', error.message);
        res.status(400).json({ 
          error: error.message || 'Login failed' 
        });
      }
    });

    app.post('/auth/refresh', async (req, res) => {
      try {
        const refreshToken = req.cookies.refresh_token;

        if (!refreshToken) {
          return res.status(401).json({ error: 'Refresh token required' });
        }

        // Rotate refresh token
        const tokenPair = await authService.rotateRefreshToken(refreshToken);
        if (!tokenPair) {
          return res.status(401).json({ error: 'Invalid refresh token' });
        }

        // Set new cookies
        res.cookie('access_token', tokenPair.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 15 * 60 * 1000,
        });

        res.cookie('refresh_token', tokenPair.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        res.json({ message: 'Token refreshed successfully' });

      } catch (error) {
        console.error('Token refresh error:', error);
        res.status(401).json({ error: 'Token refresh failed' });
      }
    });

    app.post('/auth/logout', async (req, res) => {
      try {
        const refreshToken = req.cookies.refresh_token;
        const accessToken = req.cookies.access_token;

        // Revoke tokens if present
        if (refreshToken) {
          const payload = await authService.verifyRefreshToken(refreshToken);
          if (payload) {
            await authService.revokeRefreshTokenFamily(payload.sub, payload.family || '');
          }
        }

        // Clear cookies
        res.clearCookie('access_token');
        res.clearCookie('refresh_token');
        res.clearCookie('csrf-token');

        res.json({ message: 'Logged out successfully' });

      } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Logout failed' });
      }
    });

    // Middleware to verify access tokens
    app.use((req: any, res, next) => {
      const accessToken = req.cookies.access_token;
      
      if (accessToken) {
        authService.verifyAccessToken(accessToken).then(payload => {
          if (payload) {
            req.user = {
              id: payload.sub,
              claims: { sub: payload.sub, email: payload.email },
              role: payload.role,
            };
            req.isAuthenticated = () => true;
          }
          next();
        }).catch(() => next());
      } else {
        next();
      }
    });

  } else {
    // Default to Replit Auth (OIDC)
    await setupAuth(app);
  }

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

  // Enhanced endpoints for new authentication system
  
  // WHO AM I endpoint (masked email)
  app.get('/whoami', async (req: any, res) => {
    try {
      if (!req.user || !req.isAuthenticated?.()) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const userId = req.user.id || req.user.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: 'No user ID found' });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        id: user.id,
        email: authService.maskEmail(user.email),
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        lastLogin: user.lastLoginAt,
      });
    } catch (error) {
      console.error('WHO AM I error:', error);
      res.status(500).json({ error: 'Failed to get user info' });
    }
  });

  // Health check endpoint
  app.get('/healthz', (req, res) => {
    res.json({ ok: true });
  });

  // QA Bridge endpoint - Secure token-gated control API
  app.post('/qa/bridge', express.json({ limit: '10mb' }), qaBridgeAuth, handleQABridge);

  // QA helper endpoints for dashboard
  app.get('/qa/last-report', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    const report = qaReportCache.getReport();
    if (!report) {
      return res.status(404).json({ ok: false, reason: 'NoReport' });
    }
    res.json(report);
  });

  app.get('/qa/public', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    const report = qaReportCache.getReport();
    if (!report) {
      return res.status(404).json({ ok: false, error: 'No cached report available' });
    }
    res.json({ ok: true, data: report });
  });

  // Simple mutex for QA test serialization
  let qaTestRunning = false;
  let qaTestQueue: Array<{ resolve: Function, reject: Function }> = [];

  app.post('/qa/run', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    try {
      // DEV-ONLY check
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ ok: false, error: 'QA runner disabled in production' });
      }

      // If already running, queue the request
      if (qaTestRunning) {
        await new Promise((resolve, reject) => {
          qaTestQueue.push({ resolve, reject });
        });
      }

      // Set running flag and process
      qaTestRunning = true;
      
      try {
        // Import and run QA tests directly (bypass bridge)
        const { comprehensiveQA } = await import('./services/qaTests');
        const report = await comprehensiveQA.runFullSuite();

        // Update cache
        qaReportCache.setReport(report);

        // Process any queued requests
        const queued = qaTestQueue.splice(0);
        queued.forEach(q => q.resolve());

        res.json({ ok: true, report });
      } catch (error) {
        // Process any queued requests with error
        const queued = qaTestQueue.splice(0);
        queued.forEach(q => q.reject(error));
        
        res.status(500).json({ 
          ok: false, 
          error: `QA tests failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
        });
      }
    } catch (error) {
      console.error('QA run error:', error);
      res.status(500).json({ ok: false, error: 'Internal server error' });
    } finally {
      qaTestRunning = false;
    }
  });

  app.get('/qa/audit-logs', (req, res) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      
      const fs = require('fs');
      const path = require('path');
      const auditLogPath = path.resolve(process.cwd(), 'qa_bridge_audit.log');
      
      if (!fs.existsSync(auditLogPath)) {
        return res.json([]); // Empty array for clean UI state
      }

      // Read safely with size limit
      const stats = fs.statSync(auditLogPath);
      const maxSize = 200 * 1024; // 200KB limit
      const readSize = Math.min(stats.size, maxSize);
      
      const fd = fs.openSync(auditLogPath, 'r');
      const buffer = Buffer.alloc(readSize);
      const startPos = Math.max(0, stats.size - readSize);
      
      fs.readSync(fd, buffer, 0, readSize, startPos);
      fs.closeSync(fd);
      
      const logContent = buffer.toString('utf8');
      const lines = logContent.trim().split('\n').filter((line: string) => line.length > 0);
      
      const entries = lines.slice(-200).map((line: string) => { // Last 200 lines max
        try {
          const parts = line.split(' - ');
          if (parts.length >= 4) {
            const timestamp = parts[0];
            const ip = parts[1].replace('IP:', '');
            const action = parts[2].replace('ACTION:', '');
            const result = parts[3].replace('RESULT:', '');
            const error = parts[4] ? parts[4].replace('ERROR:', '') : undefined;
            
            return {
              timestamp,
              ip: ip.length > 10 ? ip.substring(0, 8) + '...' : ip, // Truncate hash for display
              action,
              result,
              error
            };
          }
        } catch (e) {
          // Skip malformed lines silently
        }
        return null;
      }).filter((entry: any) => entry !== null).reverse(); // Most recent first

      res.json(entries);
    } catch (error) {
      console.error('Error reading audit logs:', error);
      // Return empty array instead of 500 to prevent UI crashes
      res.json([]);
    }
  });

  // GDPR Data Export (stub)
  app.get('/gdpr/export', async (req: any, res) => {
    try {
      if (!req.user || !req.isAuthenticated?.()) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const userId = req.user.id || req.user.claims?.sub;
      const exportData = await gdprService.exportUserData(userId);

      gdprService.generatePrivacyHeaders(res);
      res.json({
        message: 'GDPR data export completed',
        data: exportData,
        exportDate: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('GDPR export error:', error);
      res.status(500).json({ 
        error: 'Data export failed',
        message: error.message 
      });
    }
  });

  // GDPR Data Deletion Request (stub)
  app.post('/gdpr/delete', async (req: any, res) => {
    try {
      if (!req.user || !req.isAuthenticated?.()) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const userId = req.user.id || req.user.claims?.sub;
      await gdprService.requestDataDeletion(userId);

      res.json({
        message: 'Data deletion request submitted',
        note: 'Your account will be processed for deletion within 30 days as per GDPR requirements',
        requestDate: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('GDPR deletion error:', error);
      res.status(500).json({ 
        error: 'Deletion request failed',
        message: error.message 
      });
    }
  });

  // Development-only test credentials endpoint
  app.get('/dev/test-credentials', (req, res) => {
    // Security: Only in development mode and with secret header
    if (process.env.NODE_ENV !== 'development') {
      return res.status(404).json({ error: 'Not found' });
    }

    const devSecret = req.headers['x-dev-secret'];
    if (devSecret !== process.env.DEV_SEED_SECRET) {
      return res.status(403).json({ error: 'Invalid dev secret' });
    }

    // Return test credentials (never log passwords)
    res.json({
      message: 'Test credentials for development',
      accounts: [
        { email: 'admin@demo.law', role: 'ADMIN', note: 'System administrator' },
        { email: 'client@demo.law', role: 'OWNER', note: 'Client owner account' },
        { email: 'worker@demo.law', role: 'WORKER', note: 'Worker account' },
      ],
      password: 'Demo!2345',
      note: 'These credentials are only for development testing',
      seeded: new Date().toISOString(),
    });
  });

  // User authentication status endpoint
  app.get('/api/auth/user', async (req, res) => {
    try {
      if (process.env.AUTH_MODE === 'password') {
        // Password mode: check JWT token
        const accessToken = req.cookies.access_token;
        if (!accessToken) {
          return res.status(401).json({ message: 'Not authenticated' });
        }

        try {
          const payload = await authService.verifyAccessToken(accessToken);
          if (!payload) {
            return res.status(401).json({ message: 'Invalid token' });
          }
          const user = await storage.getUser(payload.sub);
          if (!user) {
            return res.status(404).json({ message: 'User not found' });
          }

          res.json({
            id: user.id,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
          });
        } catch (tokenError) {
          return res.status(401).json({ message: 'Invalid token' });
        }
      } else {
        // OIDC mode: use Replit Auth
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
      }
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

  // Create worker for specific client
  app.post('/api/clients/:clientId/workers', isAuthenticated, requireRole('ADMIN', 'OWNER'), async (req: any, res) => {
    try {
      const { clientId } = req.params;
      const workerData = { ...req.body, clientProfileId: clientId };
      
      // Convert date strings to Date objects if they exist
      if (workerData.dob) {
        workerData.dob = new Date(workerData.dob);
      }
      if (workerData.passportExpiry) {
        workerData.passportExpiry = new Date(workerData.passportExpiry);
      }
      if (workerData.passportIssueDate) {
        workerData.passportIssueDate = new Date(workerData.passportIssueDate);
      }
      if (workerData.contractStartDate) {
        workerData.contractStartDate = new Date(workerData.contractStartDate);
      }
      if (workerData.contractEndDate) {
        workerData.contractEndDate = new Date(workerData.contractEndDate);
      }
      
      const worker = await storage.createWorker(workerData);
      res.status(201).json(worker);
    } catch (error: any) {
      console.error('Error creating worker:', error);
      console.error('Error details:', error.message);
      console.error('Worker data received:', req.body);
      console.error('Client ID:', req.params.clientId);
      res.status(500).json({ message: error.message || "Failed to create worker" });
    }
  });

  // Update worker for specific client
  app.put('/api/clients/:clientId/workers/:workerId', isAuthenticated, requireRole('ADMIN', 'OWNER'), async (req: any, res) => {
    try {
      const { workerId } = req.params;
      const workerData = { ...req.body };
      
      // Convert date strings to Date objects if they exist
      if (workerData.dob) {
        workerData.dob = new Date(workerData.dob);
      }
      if (workerData.passportExpiry) {
        workerData.passportExpiry = new Date(workerData.passportExpiry);
      }
      if (workerData.passportIssueDate) {
        workerData.passportIssueDate = new Date(workerData.passportIssueDate);
      }
      if (workerData.contractStartDate) {
        workerData.contractStartDate = new Date(workerData.contractStartDate);
      }
      if (workerData.contractEndDate) {
        workerData.contractEndDate = new Date(workerData.contractEndDate);
      }
      
      const updatedWorker = await storage.updateWorker(workerId, workerData);
      if (!updatedWorker) {
        return res.status(404).json({ message: "Worker not found" });
      }
      res.json(updatedWorker);
    } catch (error) {
      console.error('Error updating worker:', error);
      res.status(500).json({ message: "Failed to update worker" });
    }
  });

  // Delete worker for specific client
  app.delete('/api/clients/:clientId/workers/:workerId', isAuthenticated, requireRole('ADMIN'), async (req: any, res) => {
    try {
      const { workerId } = req.params;
      
      const success = await storage.deleteWorker(workerId);
      if (!success) {
        return res.status(404).json({ message: "Worker not found" });
      }
      res.json({ message: "Worker deleted successfully" });
    } catch (error) {
      console.error('Error deleting worker:', error);
      res.status(500).json({ message: "Failed to delete worker" });
    }
  });

  // Get single worker
  app.get('/api/clients/:clientId/workers/:workerId', isAuthenticated, requireRole('ADMIN', 'OWNER', 'WORKER'), async (req: any, res) => {
    try {
      const { workerId } = req.params;
      
      const worker = await storage.getWorker(workerId);
      if (!worker) {
        return res.status(404).json({ message: "Worker not found" });
      }
      res.json(worker);
    } catch (error) {
      console.error('Error fetching worker:', error);
      res.status(500).json({ message: "Failed to fetch worker" });
    }
  });

  // General worker create endpoint - for use from workers page
  app.post('/api/workers', isAuthenticated, requireRole('ADMIN', 'OWNER'), async (req: any, res) => {
    try {
      const workerData = req.body;
      
      // Validate required fields
      if (!workerData.firstName || !workerData.lastName || !workerData.email || !workerData.clientId) {
        return res.status(400).json({ 
          message: "Missing required fields", 
          required: ['firstName', 'lastName', 'email', 'clientId']
        });
      }

      // Set clientProfileId from clientId for database consistency
      const workerDataWithProfile = {
        ...workerData,
        clientProfileId: workerData.clientId
      };

      const worker = await storage.createWorker(workerDataWithProfile);
      res.status(201).json(worker);
    } catch (error) {
      console.error('Error creating worker:', error);
      res.status(500).json({ message: "Failed to create worker", error: (error as Error).message });
    }
  });

  // General worker update endpoint - for use from workers page
  app.put('/api/workers/:workerId', isAuthenticated, requireRole('ADMIN', 'OWNER'), async (req: any, res) => {
    try {
      const { workerId } = req.params;
      const workerData = { ...req.body };
      
      console.log('Raw worker data received:', JSON.stringify(workerData, null, 2));

      // If clientId is provided, set clientProfileId for database consistency
      if (workerData.clientId) {
        workerData.clientProfileId = workerData.clientId;
      }

      // Convert date strings to Date objects if they exist
      if (workerData.dob) {
        if (typeof workerData.dob === 'string') {
          workerData.dob = new Date(workerData.dob);
          console.log('Converted dob from string to Date:', workerData.dob);
        }
      }
      if (workerData.passportExpiry) {
        if (typeof workerData.passportExpiry === 'string') {
          workerData.passportExpiry = new Date(workerData.passportExpiry);
          console.log('Converted passportExpiry from string to Date:', workerData.passportExpiry);
        }
      }
      if (workerData.passportIssueDate) {
        if (typeof workerData.passportIssueDate === 'string') {
          workerData.passportIssueDate = new Date(workerData.passportIssueDate);
        }
      }
      if (workerData.contractStartDate) {
        if (typeof workerData.contractStartDate === 'string') {
          workerData.contractStartDate = new Date(workerData.contractStartDate);
        }
      }
      if (workerData.contractEndDate) {
        if (typeof workerData.contractEndDate === 'string') {
          workerData.contractEndDate = new Date(workerData.contractEndDate);
        }
      }
      
      console.log('Worker data after date conversion:', JSON.stringify(workerData, null, 2));

      const updatedWorker = await storage.updateWorker(workerId, workerData);
      if (!updatedWorker) {
        return res.status(404).json({ message: "Worker not found" });
      }
      res.json(updatedWorker);
    } catch (error) {
      console.error('Error updating worker:', error);
      console.error('Error details:', (error as Error).message);
      res.status(500).json({ message: "Failed to update worker", error: (error as Error).message });
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

  // Get single client by ID
  app.get('/api/clients/:clientId', isAuthenticated, requireRole('ADMIN', 'OWNER'), async (req: any, res) => {
    try {
      const { clientId } = req.params;
      const client = await storage.getClientProfile(clientId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      console.error('Error fetching client:', error);
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  // Create new client profile - only ADMIN and OWNER can create clients
  app.post('/api/clients', isAuthenticated, requireRole('ADMIN', 'OWNER'), async (req: any, res) => {
    try {
      const clientData = req.body;
      
      // Validate required fields
      const requiredFields = ['legalName', 'registrationNumber', 'cui', 'legalAddress', 'adminName', 'contactEmail', 'phoneNumber', 'bankIban', 'caen'];
      const missingFields = requiredFields.filter(field => !clientData[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({ 
          message: "Missing required fields", 
          missingFields: missingFields 
        });
      }

      // Add ownerUserId from authenticated user
      const userClaims = (req.user as any).claims;
      if (!userClaims?.sub) {
        return res.status(401).json({ message: "Invalid user session" });
      }

      const clientDataWithOwner = {
        ...clientData,
        ownerUserId: userClaims.sub
      };

      const client = await storage.createClientProfile(clientDataWithOwner);
      res.status(201).json(client);
    } catch (error) {
      console.error('Error creating client:', error);
      res.status(500).json({ message: "Failed to create client", error: (error as Error).message });
    }
  });

  // Update existing client profile - only ADMIN and OWNER can update clients
  app.put('/api/clients/:clientId', isAuthenticated, requireRole('ADMIN', 'OWNER'), async (req: any, res) => {
    try {
      const { clientId } = req.params;
      const clientData = req.body;
      const updatedClient = await storage.updateClientProfile(clientId, clientData);
      if (!updatedClient) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(updatedClient);
    } catch (error) {
      console.error('Error updating client:', error);
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  // Delete client profile - only ADMIN can delete clients
  app.delete('/api/clients/:clientId', isAuthenticated, requireRole('ADMIN'), async (req: any, res) => {
    try {
      const { clientId } = req.params;
      const success = await storage.deleteClientProfile(clientId);
      if (!success) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json({ message: "Client deleted successfully" });
    } catch (error) {
      console.error('Error deleting client:', error);
      res.status(500).json({ message: "Failed to delete client" });
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

  // Assignments API endpoint - QA test expects this path
  app.get('/api/assignments', async (req: any, res) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      
      // Support both query filtering and general access
      const { workerId } = req.query;
      
      if (workerId) {
        // Get assignments for specific worker using the correct method name
        const assignments = await storage.getWorkerAssignments(workerId);
        res.json(assignments);
      } else {
        // Get all assignments 
        const assignments = await storage.getAllAssignments();
        res.json(assignments);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      res.status(500).json({ error: "Failed to fetch assignments" });
    }
  });

  // Workflow templates route - accessible to ADMIN, OWNER, WORKER (all authenticated users need workflow templates)
  app.get('/api/workflows/templates', isAuthenticated, requireRole('ADMIN', 'OWNER', 'WORKER'), async (req: any, res) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      
      // Get real workflow templates from database with proper step metadata
      const templates = await storage.getAllWorkflowTemplates();
      
      const workflowDefinitions = await Promise.all(templates.map(async (template) => {
        const steps = await storage.getWorkflowSteps(template.id);
        
        // Transform to expected QA format with proper step metadata
        const sortedSteps = steps
          .sort((a, b) => a.order - b.order)
          .map(step => ({
            id: step.id,
            stepOrder: step.order, // Map 'order' to 'stepOrder' 
            name: step.name,
            requiresUpload: step.stepType === 'DOCUMENT_COLLECTION' || step.stepType === 'DOCUMENT_REVIEW',
            requiresVerification: step.requiresApproval || step.stepType === 'APPROVAL',
            stepType: step.stepType,
            assignedRole: step.assignedRole,
            description: step.description,
            isRequired: step.isRequired
          }));

        return {
          id: template.id,
          name: template.name,
          description: template.description,
          steps: sortedSteps
        };
      }));
      
      res.json(workflowDefinitions);
    } catch (error) {
      console.error('Error fetching workflow templates:', error);
      res.status(500).json({ error: "Failed to fetch workflow templates" });
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
          stepType: stageData.stepType as typeof workflowStepTypeEnum.enumValues[number],
          assignedRole: stageData.assignedRole as typeof assignedToRoleEnum.enumValues[number],
          order: stageData.order,
          isRequired: true,
        });

        // Create document requirements for this step
        for (let i = 0; i < stageData.documentRequirements.length; i++) {
          const req = stageData.documentRequirements[i];
          await storage.createDocumentRequirement({
            workflowStepId: step.id,
            title: req.title,
            description: req.description,
            isRequired: req.isRequired,
            submittedBy: req.submittedBy as typeof assignedToRoleEnum.enumValues[number],
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
            assignedRole: item.assignedRole as typeof assignedToRoleEnum.enumValues[number],
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
    } catch (error: any) {
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
    } catch (error: any) {
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

  // Get workflow progress for a specific worker
  app.get('/api/workers/:workerId/workflow-progress', isAuthenticated, async (req: any, res) => {
    try {
      const { workerId } = req.params;
      
      if (!workerId) {
        return res.status(400).json({ message: "Worker ID is required" });
      }

      const progress = await storage.getWorkerWorkflowsProgress(workerId);
      res.json(progress);
    } catch (error) {
      console.error('Error fetching worker workflow progress:', error);
      res.status(500).json({ message: "Failed to fetch worker workflow progress", error: (error as Error).message });
    }
  });

  // Worker workflow linking endpoints
  app.post('/api/workers/:workerId/workflows/:templateId/link', isAuthenticated, requireRole('ADMIN', 'OWNER'), async (req: any, res) => {
    try {
      const { workerId, templateId } = req.params;
      
      if (!workerId || !templateId) {
        return res.status(400).json({ message: "Worker ID and Template ID are required" });
      }

      const progress = await storage.linkWorkerToWorkflow(workerId, templateId);
      res.status(201).json(progress);
    } catch (error) {
      console.error('Error linking worker to workflow:', error);
      res.status(500).json({ message: "Failed to link worker to workflow", error: (error as Error).message });
    }
  });

  app.delete('/api/workers/:workerId/workflows/:templateId/unlink', isAuthenticated, requireRole('ADMIN', 'OWNER'), async (req: any, res) => {
    try {
      const { workerId, templateId } = req.params;
      
      if (!workerId || !templateId) {
        return res.status(400).json({ message: "Worker ID and Template ID are required" });
      }

      const success = await storage.unlinkWorkerFromWorkflow(workerId, templateId);
      if (!success) {
        return res.status(404).json({ message: "Worker workflow link not found" });
      }
      
      res.json({ message: "Worker successfully unlinked from workflow" });
    } catch (error) {
      console.error('Error unlinking worker from workflow:', error);
      res.status(500).json({ message: "Failed to unlink worker from workflow", error: (error as Error).message });
    }
  });

  // Health Check Routes
  app.get('/api/health-check/status', async (req, res) => {
    try {
      const { HealthCheckOrchestrator } = await import('./healthCheckOrchestrator');
      const orchestrator = new HealthCheckOrchestrator();
      const status = await orchestrator.runQuickCheck();
      res.json(status);
    } catch (error) {
      console.error('Health check status error:', error);
      res.status(500).json({ 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  app.post('/api/health-check/run-all', async (req, res) => {
    try {
      const { HealthCheckOrchestrator } = await import('./healthCheckOrchestrator');
      const orchestrator = new HealthCheckOrchestrator();
      await orchestrator.runAllTests(res);
    } catch (error) {
      console.error('Health check run error:', error);
      if (!res.headersSent) {
        res.status(500).json({ 
          error: error instanceof Error ? error.message : 'Failed to run health checks' 
        });
      }
    }
  });

  // Reminder Rules API endpoint - only ADMIN and OWNER can manage reminder rules
  app.get('/api/reminder-rules', isAuthenticated, requireRole('ADMIN', 'OWNER'), async (req: any, res) => {
    try {
      const reminderRules = await storage.getAllReminderRules();
      res.json(reminderRules);
    } catch (error) {
      console.error('Error fetching reminder rules:', error);
      res.status(500).json({ message: "Failed to fetch reminder rules" });
    }
  });

  app.post('/api/reminder-rules', isAuthenticated, requireRole('ADMIN', 'OWNER'), async (req: any, res) => {
    try {
      const rule = await storage.createReminderRule({
        ...req.body,
        createdByUserId: req.user?.id || req.user?.claims?.sub
      });
      res.status(201).json(rule);
    } catch (error) {
      console.error('Error creating reminder rule:', error);
      res.status(500).json({ message: "Failed to create reminder rule" });
    }
  });

  // Get all worker workflow progress data
  app.get('/api/worker-workflow-progress', isAuthenticated, requireRole('ADMIN', 'OWNER'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      // Get all workflow progress data
      const allProgress = await storage.getAllWorkerWorkflowProgress();
      res.json(allProgress);
    } catch (error) {
      console.error('Error fetching worker workflow progress:', error);
      res.status(500).json({ message: 'Failed to fetch workflow progress' });
    }
  });

  // Worker Workflow Progress API endpoints - new template-based system
  app.get('/api/worker/:workerId/workflow-progress', isAuthenticated, requireRole('ADMIN', 'OWNER', 'WORKER'), async (req: any, res) => {
    try {
      const { workerId } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      // Verify access rights
      const worker = await storage.getWorker(workerId);
      if (!worker) {
        return res.status(404).json({ message: 'Worker not found' });
      }

      if (user?.role !== 'ADMIN') {
        const client = await storage.getClientProfile(worker.clientProfileId);
        const isOwner = client?.ownerUserId === userId;
        const isWorker = worker.id === userId;
        
        if (!isOwner && !isWorker) {
          return res.status(403).json({ message: 'Unauthorized' });
        }
      }

      // Get active workflow progress for this worker
      const workflowProgress = await storage.getWorkerWorkflowProgress(workerId, ''); 
      
      if (!workflowProgress) {
        return res.json({
          worker,
          workflowProgress: null,
          steps: []
        });
      }

      // Get step progress for this workflow
      const stepProgress = await storage.getWorkerStepProgress(workflowProgress.id);
      
      // Get workflow template for context
      const workflowTemplate = await storage.getWorkflowTemplate(workflowProgress.workflowTemplateId);

      res.json({
        worker,
        workflowProgress,
        workflowTemplate,
        steps: stepProgress
      });

    } catch (error) {
      console.error('Error fetching worker workflow progress:', error);
      res.status(500).json({ message: 'Failed to fetch workflow progress' });
    }
  });

  // Development-only test credentials endpoint
  app.get('/dev/test-credentials', (req, res) => {
    // Environment gate
    if (process.env.NODE_ENV !== 'development') {
      return res.status(404).json({ error: 'Endpoint not available' });
    }

    // Header-based authentication
    const devSecret = req.headers['x-dev-secret'];
    if (!devSecret || devSecret !== process.env.DEV_SEED_SECRET) {
      return res.status(403).json({ error: 'Invalid or missing X-Dev-Secret header' });
    }

    try {
      // Read and serve TEST_CREDENTIALS.md
      const fs = require('fs');
      const path = require('path');
      const credentialsPath = path.resolve(process.cwd(), 'TEST_CREDENTIALS.md');
      
      if (fs.existsSync(credentialsPath)) {
        const content = fs.readFileSync(credentialsPath, 'utf8');
        res.setHeader('Content-Type', 'text/plain');
        res.send(content);
      } else {
        res.status(404).json({ 
          error: 'TEST_CREDENTIALS.md not found',
          hint: 'Run npm run seed:test to generate test credentials'
        });
      }
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to read credentials',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Worker Workflows API endpoint - returns structured workflow progress for a specific worker
  app.get('/api/workers/:workerId/workflows', isAuthenticated, requireRole('ADMIN', 'OWNER', 'WORKER'), async (req: any, res) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      
      const { workerId } = req.params;
      
      // Verify worker exists
      const worker = await storage.getWorker(workerId);
      if (!worker) {
        return res.status(404).json({ error: "Worker not found" });
      }
      
      // Get worker's assignments and templates
      const [assignments, templates] = await Promise.all([
        storage.getAssignmentsByWorkerId(workerId),
        storage.getAllWorkflowTemplates()
      ]);
      
      // Build workflow progress response with proper step structure
      const workflows = await Promise.all(assignments.map(async (assignment) => {
        const template = templates.find(t => t.id === assignment.workflowTemplateId);
        if (!template) {
          return {
            workflowTemplateId: assignment.workflowTemplateId,
            name: 'Unknown Workflow',
            progress: {
              overallStatus: assignment.status || 'PENDING',
              steps: []
            }
          };
        }

        // Get workflow steps for this template
        const steps = await storage.getWorkflowSteps(template.id);
        const sortedSteps = steps.sort((a, b) => a.order - b.order);
        
        // Map steps to progress format with sequential rule enforcement
        const stepProgress = sortedSteps.map((step, index) => {
          let stepStatus = 'PENDING';
          
          // Apply sequential rule: if previous step isn't COMPLETED, force current to PENDING
          if (index > 0) {
            const prevStep = stepProgress[index - 1];
            if (prevStep.status !== 'COMPLETED') {
              stepStatus = 'PENDING';
            } else {
              // Only then check actual status (would come from worker_step_progress table)
              stepStatus = assignment.status === 'COMPLETED' ? 'COMPLETED' : 
                          assignment.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'PENDING';
            }
          } else {
            // First step can have any status
            stepStatus = assignment.status === 'COMPLETED' ? 'COMPLETED' : 
                        assignment.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'PENDING';
          }

          return {
            stepId: step.id,
            stepOrder: step.order,
            name: step.name,
            status: stepStatus
          };
        });

        // Calculate overall status based on step statuses
        let overallStatus = 'PENDING';
        const completedSteps = stepProgress.filter(s => s.status === 'COMPLETED').length;
        const rejectedSteps = stepProgress.filter(s => s.status === 'REJECTED').length;
        const inProgressSteps = stepProgress.filter(s => s.status === 'IN_PROGRESS').length;
        
        if (rejectedSteps > 0) {
          overallStatus = 'REJECTED';
        } else if (completedSteps === stepProgress.length) {
          overallStatus = 'COMPLETED';
        } else if (inProgressSteps > 0 || completedSteps > 0) {
          overallStatus = 'IN_PROGRESS';
        }

        return {
          workflowTemplateId: assignment.workflowTemplateId,
          name: template.name,
          progress: {
            overallStatus,
            steps: stepProgress
          }
        };
      }));
      
      res.json(workflows);
    } catch (error) {
      console.error('Error fetching worker workflows:', error);
      res.status(500).json({ error: "Failed to fetch worker workflows" });
    }
  });

  // Document Upload Preflight endpoint
  app.post('/api/documents/upload', isAuthenticated, async (req: any, res) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      
      // Check if object storage is configured
      const hasObjectStorage = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID && 
                              process.env.PUBLIC_OBJECT_SEARCH_PATHS && 
                              process.env.PRIVATE_OBJECT_DIR;
      
      if (hasObjectStorage) {
        res.status(200).json({ 
          ok: true, 
          storage: 's3', 
          maxSizeMB: 10 
        });
      } else {
        res.status(501).json({ 
          ok: false, 
          reason: 'StorageNotConfigured' 
        });
      }
    } catch (error) {
      console.error('Error in document upload preflight:', error);
      res.status(500).json({ 
        ok: false, 
        error: 'Internal server error' 
      });
    }
  });

  // Defensive 404 JSON handler for unknown /api/* paths
  // This prevents the Vite catch-all from serving HTML for API endpoints
  app.use('/api/*', (req, res, next) => {
    if (!res.headersSent) {
      res.status(404).json({ 
        ok: false,
        error: 'NotFound',
        path: req.originalUrl,
        timestamp: new Date().toISOString()
      });
    } else {
      next();
    }
  });

  const httpServer = createServer(app);
  // QA/Smoke Test endpoints (dev/QA only)
  app.get('/api/qa/smoke', isAuthenticated, requireRole('ADMIN'), async (req, res) => {
    try {
      // Environment gate
      const isQAEnabled = process.env.NODE_ENV === 'development' || process.env.QA_MODE === 'true';
      if (!isQAEnabled) {
        return res.status(404).json({ error: 'QA endpoints not available' });
      }

      const { QAService } = await import('./services/qaService');
      const qaService = new QAService();
      const report = await qaService.runSmokeTests();
      
      res.json(report);
    } catch (error) {
      res.status(500).json({ 
        error: 'QA smoke test failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Impersonation endpoints (admin + dev/QA only)
  app.post('/admin/impersonate', isAuthenticated, requireRole('ADMIN'), async (req, res) => {
    try {
      const isQAEnabled = process.env.NODE_ENV === 'development' || process.env.QA_MODE === 'true';
      if (!isQAEnabled) {
        return res.status(404).json({ error: 'Impersonation not available in production' });
      }

      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      const { ImpersonationService } = await import('./services/impersonationService');
      const result = await ImpersonationService.startImpersonation(req, userId);
      
      if (result.success) {
        res.json({ success: true, user: result.user });
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error) {
      res.status(500).json({ 
        error: 'Impersonation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post('/admin/unimpersonate', isAuthenticated, requireRole('ADMIN'), async (req, res) => {
    try {
      const isQAEnabled = process.env.NODE_ENV === 'development' || process.env.QA_MODE === 'true';
      if (!isQAEnabled) {
        return res.status(404).json({ error: 'Impersonation not available in production' });
      }

      const { ImpersonationService } = await import('./services/impersonationService');
      const result = await ImpersonationService.stopImpersonation(req);
      
      if (result.success) {
        res.json({ success: true, user: result.user });
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error) {
      res.status(500).json({ 
        error: 'Stop impersonation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return httpServer;
}
