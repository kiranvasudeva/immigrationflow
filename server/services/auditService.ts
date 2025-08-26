import { storage } from "../storage";
import { AuditLog } from "@shared/schema";

export class AuditService {
  async log(data: Omit<AuditLog, 'id' | 'createdAt'>): Promise<void> {
    try {
      await storage.createAuditLog(data);
    } catch (error) {
      console.error("Failed to create audit log:", error);
    }
  }

  async logUserAction(
    userId: string | undefined,
    action: string,
    entityType: string,
    entityId: string,
    ip?: string,
    metadata?: any
  ): Promise<void> {
    await this.log({
      userId,
      action,
      entityType,
      entityId,
      ip,
      metadata
    });
  }
}

export const auditService = new AuditService();
