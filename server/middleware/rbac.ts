import type { Request, Response, NextFunction, RequestHandler } from "express";
import { storage } from "../storage";

// Extend Express Request type to include user with role
declare global {
  namespace Express {
    interface User {
      claims: {
        sub: string;
        email?: string;
      };
      dbUser?: {
        id: string;
        email: string;
        role: 'ADMIN' | 'OWNER' | 'WORKER' | 'VIEWER';
        invitedById?: string;
      };
    }
  }
}

export type UserRole = 'ADMIN' | 'OWNER' | 'WORKER' | 'VIEWER';
export type ResourceType = 'client' | 'worker' | 'assignment' | 'document' | 'template';

/**
 * Middleware to require specific roles for access
 * @param roles - Array of roles that can access this route
 */
export function requireRole(...roles: UserRole[]): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Ensure user is authenticated first
      if (!req.user?.claims?.sub) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Get user from database to check role
      // Use email to lookup user (same pattern as /api/auth/user endpoint)
      const userEmail = req.user.claims.email;
      if (!userEmail) {
        return res.status(401).json({ message: "Invalid user session" });
      }
      
      const dbUser = await storage.getUserByEmail(userEmail);
      
      if (!dbUser) {
        return res.status(401).json({ message: "User not found" });
      }

      // Attach db user to request for future use (handle null email)
      req.user.dbUser = {
        id: dbUser.id,
        email: dbUser.email || '',
        role: dbUser.role,
        invitedById: dbUser.invitedById || undefined
      };

      // Check if user has required role
      if (!roles.includes(dbUser.role)) {
        return res.status(403).json({ 
          message: "Insufficient privileges", 
          required: roles,
          actual: dbUser.role 
        });
      }

      next();
    } catch (error) {
      console.error('RBAC role check error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
}

/**
 * Middleware to check resource ownership for tenant scoping
 * @param resourceType - Type of resource to check ownership for
 */
export function requireOwnership(resourceType: ResourceType): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user?.dbUser) {
        return res.status(401).json({ message: "User context not found" });
      }

      const { role, id: userId } = user.dbUser;
      
      // ADMIN can access all resources
      if (role === 'ADMIN') {
        return next();
      }

      // Get resource ID from params
      const resourceId = req.params.id || req.params.clientId || req.params.workerId || 
                        req.params.assignmentId || req.params.documentId || req.params.templateId;

      if (!resourceId) {
        return res.status(400).json({ message: "Resource ID not provided" });
      }

      let hasAccess = false;

      switch (resourceType) {
        case 'client':
          hasAccess = await checkClientAccess(userId, resourceId, role);
          break;
        
        case 'worker':
          hasAccess = await checkWorkerAccess(userId, resourceId, role);
          break;
        
        case 'assignment':
          hasAccess = await checkAssignmentAccess(userId, resourceId, role);
          break;
        
        case 'document':
          hasAccess = await checkDocumentAccess(userId, resourceId, role);
          break;
        
        case 'template':
          hasAccess = await checkTemplateAccess(userId, resourceId, role);
          break;
        
        default:
          return res.status(400).json({ message: "Invalid resource type" });
      }

      if (!hasAccess) {
        return res.status(403).json({ 
          message: "Access denied - insufficient ownership privileges",
          resource: resourceType,
          resourceId 
        });
      }

      next();
    } catch (error) {
      console.error('RBAC ownership check error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
}

/**
 * Combined middleware that checks both role and ownership
 */
export function requireRoleAndOwnership(roles: UserRole[], resourceType: ResourceType): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    // First check role
    requireRole(...roles)(req, res, (err) => {
      if (err) return next(err);
      
      // Then check ownership
      requireOwnership(resourceType)(req, res, next);
    });
  };
}

/**
 * Middleware to filter query results based on user access level
 */
export function applyTenantFilter(): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user?.dbUser) {
        return res.status(401).json({ message: "User context not found" });
      }

      const { role, id: userId } = user.dbUser;

      // Add tenant filter to request context
      (req as any).tenantFilter = {
        userId,
        role,
        canAccessAll: role === 'ADMIN',
        getClientFilter: () => getClientFilterForUser(userId, role),
        getWorkerFilter: () => getWorkerFilterForUser(userId, role),
        getAssignmentFilter: () => getAssignmentFilterForUser(userId, role)
      };

      next();
    } catch (error) {
      console.error('Tenant filter error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
}

// Helper functions for ownership checks

async function checkClientAccess(userId: string, clientId: string, role: UserRole): Promise<boolean> {
  if (role === 'ADMIN') return true;
  
  if (role === 'OWNER') {
    // Check if user owns this client
    const client = await storage.getClientProfile(clientId);
    return client?.ownerUserId === userId;
  }
  
  if (role === 'WORKER') {
    // Workers can only access clients through their assignments
    const assignments = await storage.getWorkerAssignments(userId);
    return assignments.some(assignment => assignment.clientProfileId === clientId);
  }
  
  return false;
}

async function checkWorkerAccess(userId: string, workerId: string, role: UserRole): Promise<boolean> {
  if (role === 'ADMIN') return true;
  
  if (role === 'WORKER') {
    // Workers can only access their own profile
    return workerId === userId;
  }
  
  if (role === 'OWNER') {
    // Owners can access workers assigned to their clients
    const worker = await storage.getWorkerProfile(workerId);
    if (!worker) return false;
    
    const assignments = await storage.getWorkerAssignments(workerId);
    const ownerClients = await storage.getClientsByOwner(userId);
    const ownerClientIds = ownerClients.map(c => c.id);
    
    return assignments.some(assignment => ownerClientIds.includes(assignment.clientProfileId));
  }
  
  return false;
}

async function checkAssignmentAccess(userId: string, assignmentId: string, role: UserRole): Promise<boolean> {
  if (role === 'ADMIN') return true;
  
  const assignment = await storage.getAssignment(assignmentId);
  if (!assignment) return false;
  
  if (role === 'WORKER') {
    // Workers can only access their own assignments
    return assignment.workerId === userId;
  }
  
  if (role === 'OWNER') {
    // Owners can access assignments for their clients
    const client = await storage.getClientProfile(assignment.clientProfileId);
    return client?.ownerUserId === userId;
  }
  
  return false;
}

async function checkDocumentAccess(userId: string, documentId: string, role: UserRole): Promise<boolean> {
  if (role === 'ADMIN') return true;
  
  const document = await storage.getDocument(documentId);
  if (!document) return false;
  
  // Check access through assignment
  return checkAssignmentAccess(userId, document.assignmentId || '', role);
}

async function checkTemplateAccess(userId: string, templateId: string, role: UserRole): Promise<boolean> {
  if (role === 'ADMIN') return true;
  
  const template = await storage.getTemplate(templateId);
  if (!template) return false;
  
  // Templates are generally accessible to OWNER and above
  return role === 'OWNER';
}

// Helper functions for query filtering

function getClientFilterForUser(userId: string, role: UserRole) {
  if (role === 'ADMIN') return {}; // No filter for admin
  
  if (role === 'OWNER') {
    return { ownerUserId: userId };
  }
  
  // WORKER: filter through assignments (more complex query needed)
  return { __workerFilter: userId };
}

function getWorkerFilterForUser(userId: string, role: UserRole) {
  if (role === 'ADMIN') return {}; // No filter for admin
  
  if (role === 'WORKER') {
    return { id: userId }; // Only own profile
  }
  
  if (role === 'OWNER') {
    // Filter workers through assignments to owner's clients
    return { __ownerFilter: userId };
  }
  
  return { id: 'impossible' }; // No access
}

function getAssignmentFilterForUser(userId: string, role: UserRole) {
  if (role === 'ADMIN') return {}; // No filter for admin
  
  if (role === 'WORKER') {
    return { workerId: userId };
  }
  
  if (role === 'OWNER') {
    // Filter assignments through owner's clients
    return { __ownerFilter: userId };
  }
  
  return { id: 'impossible' }; // No access
}

/**
 * Dev bypass for RBAC in development environment
 */
export function devRbacBypass(originalMiddleware: RequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV === 'development' && req.path.includes('/api/')) {
      // In dev, mock a user with ADMIN role for all API calls to ensure access
      if (!req.user?.dbUser) {
        (req.user as any) = {
          ...req.user,
          dbUser: {
            id: 'dev-admin-1',
            email: 'admin@dev.local',
            role: 'ADMIN' as UserRole,
            invitedById: null
          }
        };
      }
      return next();
    }
    return originalMiddleware(req, res, next);
  };
}