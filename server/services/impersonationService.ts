import type { Request } from 'express';
import { db } from '../db';
import { users, auditLogs } from '@shared/schema';
import { eq } from 'drizzle-orm';
import pino from 'pino';

const logger = pino({ name: 'impersonationService' });

export interface ImpersonationSession {
  originalUserId: string;
  impersonatedUserId: string;
  startTime: string;
}

declare module 'express-session' {
  interface SessionData {
    impersonation?: ImpersonationSession;
  }
}

export class ImpersonationService {
  
  static isQAEnabled(): boolean {
    return process.env.NODE_ENV === 'development' || process.env.QA_MODE === 'true';
  }

  static async startImpersonation(req: Request & { user?: any }, targetUserId: string): Promise<{ success: boolean; error?: string; user?: any }> {
    try {
      if (!this.isQAEnabled()) {
        return { success: false, error: 'Impersonation not available in production' };
      }

      const currentUser: any = req.user;
      if (!currentUser || currentUser.role !== 'ADMIN') {
        return { success: false, error: 'Only admins can use impersonation' };
      }

      // Get target user
      const targetUser = await db.query.users.findFirst({
        where: eq(users.id, targetUserId),
      });

      if (!targetUser) {
        return { success: false, error: 'Target user not found' };
      }

      // Store impersonation info in session
      req.session.impersonation = {
        originalUserId: currentUser.id,
        impersonatedUserId: targetUserId,
        startTime: new Date().toISOString(),
      };

      // Log the impersonation start
      await this.logImpersonationEvent(currentUser.id, targetUserId, 'START');

      logger.info(`Admin ${currentUser.id} started impersonating ${targetUserId}`);

      return { 
        success: true, 
        user: {
          id: targetUser.id,
          email: targetUser.email,
          role: targetUser.role,
          firstName: targetUser.firstName,
          lastName: targetUser.lastName,
        }
      };

    } catch (error) {
      logger.error('Impersonation start failed:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  static async stopImpersonation(req: Request & { user?: any }): Promise<{ success: boolean; error?: string; user?: any }> {
    try {
      const impersonation = req.session.impersonation;
      if (!impersonation) {
        return { success: false, error: 'No active impersonation session' };
      }

      // Get original admin user
      const originalUser = await db.query.users.findFirst({
        where: eq(users.id, impersonation.originalUserId),
      });

      if (!originalUser) {
        return { success: false, error: 'Original admin user not found' };
      }

      // Log the impersonation end
      await this.logImpersonationEvent(
        impersonation.originalUserId, 
        impersonation.impersonatedUserId, 
        'END'
      );

      // Clear impersonation from session
      delete req.session.impersonation;

      logger.info(`Admin ${impersonation.originalUserId} stopped impersonating ${impersonation.impersonatedUserId}`);

      return { 
        success: true, 
        user: {
          id: originalUser.id,
          email: originalUser.email,
          role: originalUser.role,
          firstName: originalUser.firstName,
          lastName: originalUser.lastName,
        }
      };

    } catch (error) {
      logger.error('Impersonation stop failed:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  static getCurrentUser(req: Request & { user?: any }) {
    const impersonation = req.session.impersonation;
    if (impersonation) {
      return req.user; // This should be the impersonated user from auth middleware
    }
    return req.user;
  }

  static isImpersonating(req: Request): boolean {
    return !!req.session.impersonation;
  }

  static getImpersonationInfo(req: Request): ImpersonationSession | null {
    return req.session.impersonation || null;
  }

  private static async logImpersonationEvent(adminId: string, targetUserId: string, action: 'START' | 'END') {
    try {
      await db.insert(auditLogs).values({
        action: `IMPERSONATION_${action}`,
        entityType: 'USER',
        entityId: targetUserId,
        metadata: {
          action,
          targetUserId,
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV,
        },
        createdAt: new Date(),
      });
    } catch (error) {
      logger.error('Failed to log impersonation event:', error);
    }
  }
}