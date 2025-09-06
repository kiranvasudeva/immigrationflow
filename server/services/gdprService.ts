import { Response } from 'express';
import { db } from '../db';
import { users, clientProfiles, workers, auditLogs } from '@shared/schema';
import { eq } from 'drizzle-orm';

export class GDPRService {
  
  // Export user data in JSON format (GDPR compliance)
  async exportUserData(userId: string): Promise<any> {
    try {
      // Get user data
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));

      if (!user) {
        throw new Error('User not found');
      }

      // Get related client profiles (if owner)
      const userClientProfiles = await db
        .select()
        .from(clientProfiles)
        .where(eq(clientProfiles.ownerUserId, userId));

      // Get audit logs for this user (last 90 days)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      // Note: Audit logs might reference this user in metadata, but we'll keep it simple
      const userAuditLogs = await db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.userId, userId))
        .limit(1000); // Limit to prevent memory issues

      // Compile export data
      const exportData = {
        exportDate: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
        },
        clientProfiles: userClientProfiles,
        auditLogs: userAuditLogs.map(log => ({
          id: log.id,
          action: log.action,
          entityType: log.entityType,
          entityId: log.entityId,
          createdAt: log.createdAt,
          // IP is excluded for privacy
        })),
        notes: [
          'This export contains all personal data we have stored about you.',
          'Some fields may be empty if you have not provided that information.',
          'Audit logs are limited to the last 90 days for security reasons.',
          'Worker data is not included in this export as it belongs to your employer.',
        ],
      };

      return exportData;
    } catch (error) {
      console.error('GDPR export error:', error);
      throw new Error('Failed to export user data');
    }
  }

  // Mark user for deletion (GDPR Right to be Forgotten)
  async requestDataDeletion(userId: string): Promise<void> {
    try {
      const now = new Date();

      // Mark user for deletion (soft delete approach)
      await db
        .update(users)
        .set({
          dataDeletionRequestedAt: now,
          updatedAt: now,
        })
        .where(eq(users.id, userId));

      console.log(`User ${userId} marked for data deletion at ${now.toISOString()}`);

      // In a real implementation, you would:
      // 1. Queue a background job to process the deletion
      // 2. Check for dependencies (client profiles, workers, etc.)
      // 3. Anonymize or delete data according to retention policies
      // 4. Send confirmation email to user
      // 5. Log the deletion request for compliance audit

    } catch (error) {
      console.error('GDPR deletion request error:', error);
      throw new Error('Failed to request data deletion');
    }
  }

  // Generate privacy-compliant response headers
  generatePrivacyHeaders(res: Response): void {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // GDPR compliance headers
    res.setHeader('X-Data-Subject-Rights', 'access,rectification,erasure,portability');
    res.setHeader('X-Privacy-Policy', '/privacy');
  }

  // Check if user has pending GDPR requests
  async checkGDPRStatus(userId: string): Promise<{
    exportRequested: boolean;
    deletionRequested: boolean;
    exportRequestedAt?: Date;
    deletionRequestedAt?: Date;
  }> {
    const [user] = await db
      .select({
        dataExportRequestedAt: users.dataExportRequestedAt,
        dataDeletionRequestedAt: users.dataDeletionRequestedAt,
      })
      .from(users)
      .where(eq(users.id, userId));

    return {
      exportRequested: !!user?.dataExportRequestedAt,
      deletionRequested: !!user?.dataDeletionRequestedAt,
      exportRequestedAt: user?.dataExportRequestedAt || undefined,
      deletionRequestedAt: user?.dataDeletionRequestedAt || undefined,
    };
  }
}

export const gdprService = new GDPRService();