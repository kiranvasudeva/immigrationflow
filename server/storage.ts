import {
  users,
  clientProfiles,
  workers,
  stages,
  requirements,
  assignments,
  documentFiles,
  reminderRules,
  auditLogs,
  type User,
  type UpsertUser,
  type ClientProfile,
  type InsertClientProfile,
  type Worker,
  type InsertWorker,
  type Stage,
  type Requirement,
  type InsertRequirement,
  type Assignment,
  type InsertAssignment,
  type DocumentFile,
  type ReminderRule,
  type AuditLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, like, desc, asc, count, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Client Profile operations
  getClientProfile(id: string): Promise<ClientProfile | undefined>;
  getClientProfileByOwnerId(ownerId: string): Promise<ClientProfile | undefined>;
  createClientProfile(profile: InsertClientProfile): Promise<ClientProfile>;
  updateClientProfile(id: string, updates: Partial<InsertClientProfile>): Promise<ClientProfile>;
  getAllClientProfiles(): Promise<ClientProfile[]>;
  
  // Worker operations
  getWorker(id: string): Promise<Worker | undefined>;
  getWorkersByClientId(clientId: string): Promise<Worker[]>;
  createWorker(worker: InsertWorker): Promise<Worker>;
  updateWorker(id: string, updates: Partial<InsertWorker>): Promise<Worker>;
  
  // Stage operations
  getAllStages(): Promise<Stage[]>;
  getStage(id: string): Promise<Stage | undefined>;
  
  // Requirement operations
  getRequirement(id: string): Promise<Requirement | undefined>;
  getRequirementsByStage(stageId: string): Promise<Requirement[]>;
  createRequirement(requirement: InsertRequirement): Promise<Requirement>;
  
  // Assignment operations
  getAssignment(id: string): Promise<Assignment | undefined>;
  getAssignmentsByClient(clientId: string): Promise<Assignment[]>;
  getAssignmentsByWorker(workerId: string): Promise<Assignment[]>;
  getAssignmentsByStatus(status: string): Promise<Assignment[]>;
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  updateAssignment(id: string, updates: Partial<InsertAssignment>): Promise<Assignment>;
  
  // Document File operations
  getDocumentFile(id: string): Promise<DocumentFile | undefined>;
  getDocumentFilesByAssignment(assignmentId: string): Promise<DocumentFile[]>;
  createDocumentFile(file: Omit<DocumentFile, 'id' | 'createdAt'>): Promise<DocumentFile>;
  
  // Search operations
  searchClientsAndWorkers(query: string): Promise<{clients: ClientProfile[], workers: Worker[]}>;
  
  // Audit operations
  createAuditLog(log: Omit<AuditLog, 'id' | 'createdAt'>): Promise<AuditLog>;
  getAuditLogs(limit?: number): Promise<AuditLog[]>;
  
  // Dashboard statistics
  getDashboardStats(): Promise<{
    totalClients: number;
    totalWorkers: number;
    activeWorkers: number;
    pendingActions: number;
    completedThisMonth: number;
    assignmentsByStatus: Record<string, number>;
  }>;
  
  // Enhanced assignment queries for kanban
  getAssignmentsWithDetails(): Promise<Array<Assignment & {
    requirement: Requirement;
    clientProfile: ClientProfile;
    worker?: Worker;
    stage: Stage;
  }>>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // For Replit Auth, we use the email as the unique identifier
    const existingUser = await db.select().from(users).where(eq(users.email, userData.email || '')).limit(1);
    
    if (existingUser.length > 0) {
      // Update existing user
      const [updatedUser] = await db
        .update(users)
        .set({
          ...userData,
          updatedAt: new Date(),
        })
        .where(eq(users.email, userData.email || ''))
        .returning();
      return updatedUser;
    } else {
      // Create new user
      const [newUser] = await db
        .insert(users)
        .values(userData)
        .returning();
      return newUser;
    }
  }

  // Client Profile operations
  async getClientProfile(id: string): Promise<ClientProfile | undefined> {
    const [profile] = await db.select().from(clientProfiles).where(eq(clientProfiles.id, id));
    return profile;
  }

  async getClientProfileByOwnerId(ownerId: string): Promise<ClientProfile | undefined> {
    const [profile] = await db.select().from(clientProfiles).where(eq(clientProfiles.ownerUserId, ownerId));
    return profile;
  }

  async createClientProfile(profile: InsertClientProfile): Promise<ClientProfile> {
    const [newProfile] = await db.insert(clientProfiles).values(profile).returning();
    return newProfile;
  }

  async updateClientProfile(id: string, updates: Partial<InsertClientProfile>): Promise<ClientProfile> {
    const [updated] = await db
      .update(clientProfiles)
      .set(updates)
      .where(eq(clientProfiles.id, id))
      .returning();
    return updated;
  }

  async getAllClientProfiles(): Promise<ClientProfile[]> {
    return await db.select().from(clientProfiles).orderBy(asc(clientProfiles.companyName));
  }

  // Worker operations
  async getWorker(id: string): Promise<Worker | undefined> {
    const [worker] = await db.select().from(workers).where(eq(workers.id, id));
    return worker;
  }

  async getWorkersByClientId(clientId: string): Promise<Worker[]> {
    return await db.select().from(workers).where(eq(workers.clientProfileId, clientId));
  }

  async createWorker(worker: InsertWorker): Promise<Worker> {
    const [newWorker] = await db.insert(workers).values(worker).returning();
    return newWorker;
  }

  async updateWorker(id: string, updates: Partial<InsertWorker>): Promise<Worker> {
    const [updated] = await db
      .update(workers)
      .set(updates)
      .where(eq(workers.id, id))
      .returning();
    return updated;
  }

  // Stage operations
  async getAllStages(): Promise<Stage[]> {
    return await db.select().from(stages).orderBy(asc(stages.order));
  }

  async getStage(id: string): Promise<Stage | undefined> {
    const [stage] = await db.select().from(stages).where(eq(stages.id, id));
    return stage;
  }

  // Requirement operations
  async getRequirement(id: string): Promise<Requirement | undefined> {
    const [requirement] = await db.select().from(requirements).where(eq(requirements.id, id));
    return requirement;
  }

  async getRequirementsByStage(stageId: string): Promise<Requirement[]> {
    return await db.select().from(requirements).where(eq(requirements.stageId, stageId));
  }

  async createRequirement(requirement: InsertRequirement): Promise<Requirement> {
    const [newRequirement] = await db.insert(requirements).values(requirement).returning();
    return newRequirement;
  }

  // Assignment operations
  async getAssignment(id: string): Promise<Assignment | undefined> {
    const [assignment] = await db.select().from(assignments).where(eq(assignments.id, id));
    return assignment;
  }

  async getAssignmentsByClient(clientId: string): Promise<Assignment[]> {
    return await db.select().from(assignments).where(eq(assignments.clientProfileId, clientId));
  }

  async getAssignmentsByWorker(workerId: string): Promise<Assignment[]> {
    return await db.select().from(assignments).where(eq(assignments.workerId, workerId));
  }

  async getAssignmentsByStatus(status: string): Promise<Assignment[]> {
    return await db.select().from(assignments).where(eq(assignments.status, status as any));
  }

  async createAssignment(assignment: InsertAssignment): Promise<Assignment> {
    const [newAssignment] = await db.insert(assignments).values(assignment).returning();
    return newAssignment;
  }

  async updateAssignment(id: string, updates: Partial<InsertAssignment>): Promise<Assignment> {
    const [updated] = await db
      .update(assignments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(assignments.id, id))
      .returning();
    return updated;
  }

  // Document File operations
  async getDocumentFile(id: string): Promise<DocumentFile | undefined> {
    const [file] = await db.select().from(documentFiles).where(eq(documentFiles.id, id));
    return file;
  }

  async getDocumentFilesByAssignment(assignmentId: string): Promise<DocumentFile[]> {
    return await db.select().from(documentFiles).where(eq(documentFiles.assignmentId, assignmentId));
  }

  async createDocumentFile(file: Omit<DocumentFile, 'id' | 'createdAt'>): Promise<DocumentFile> {
    const [newFile] = await db.insert(documentFiles).values(file).returning();
    return newFile;
  }

  // Search operations
  async searchClientsAndWorkers(query: string): Promise<{clients: ClientProfile[], workers: Worker[]}> {
    const searchQuery = `%${query}%`;
    
    const clients = await db
      .select()
      .from(clientProfiles)
      .where(
        or(
          like(clientProfiles.companyName, searchQuery),
          like(clientProfiles.cui, searchQuery),
          like(clientProfiles.contactEmail, searchQuery)
        )
      );

    const workersResult = await db
      .select()
      .from(workers)
      .where(
        or(
          like(workers.firstName, searchQuery),
          like(workers.lastName, searchQuery),
          like(workers.passportNumber, searchQuery),
          like(workers.email, searchQuery)
        )
      );

    return { clients, workers: workersResult };
  }

  // Audit operations
  async createAuditLog(log: Omit<AuditLog, 'id' | 'createdAt'>): Promise<AuditLog> {
    const [newLog] = await db.insert(auditLogs).values(log).returning();
    return newLog;
  }

  async getAuditLogs(limit = 100): Promise<AuditLog[]> {
    return await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  }

  // Dashboard statistics
  async getDashboardStats(): Promise<{
    totalClients: number;
    totalWorkers: number;
    activeWorkers: number;
    pendingActions: number;
    completedThisMonth: number;
    assignmentsByStatus: Record<string, number>;
  }> {
    // Get total clients
    const totalClients = await db.select({ count: count() }).from(clientProfiles);
    
    // Get total workers
    const totalWorkers = await db.select({ count: count() }).from(workers);
    
    // Get active workers (workers with assignments in progress)
    const activeWorkersResult = await db
      .selectDistinct({ workerId: assignments.workerId })
      .from(assignments)
      .where(
        and(
          eq(assignments.workerId, workers.id),
          or(
            eq(assignments.status, 'AWAITING_UPLOAD'),
            eq(assignments.status, 'SUBMITTED_BY_USER'),
            eq(assignments.status, 'RECEIVED_BY_ADMIN'),
            eq(assignments.status, 'SUBMITTED_TO_INSTITUTION_DIGITAL'),
            eq(assignments.status, 'SUBMITTED_TO_INSTITUTION_COURIER')
          )
        )
      );
    
    // Get pending actions (assignments awaiting action)
    const pendingActionsResult = await db
      .select({ count: count() })
      .from(assignments)
      .where(
        or(
          eq(assignments.status, 'AWAITING_UPLOAD'),
          eq(assignments.status, 'SUBMITTED_BY_USER'),
          eq(assignments.status, 'RECEIVED_BY_ADMIN')
        )
      );
    
    // Get completed this month
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    const completedThisMonthResult = await db
      .select({ count: count() })
      .from(assignments)
      .where(
        and(
          eq(assignments.status, 'ACCEPTED'),
          sql`${assignments.approvedAt} >= ${currentMonth.toISOString()}`
        )
      );
    
    // Get assignments by status for kanban
    const statusCounts = await db
      .select({
        status: assignments.status,
        count: count()
      })
      .from(assignments)
      .groupBy(assignments.status);
    
    const assignmentsByStatus = statusCounts.reduce((acc, row) => {
      acc[row.status] = row.count;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalClients: totalClients[0]?.count ?? 0,
      totalWorkers: totalWorkers[0]?.count ?? 0,
      activeWorkers: activeWorkersResult.length,
      pendingActions: pendingActionsResult[0]?.count ?? 0,
      completedThisMonth: completedThisMonthResult[0]?.count ?? 0,
      assignmentsByStatus,
    };
  }
  
  // Enhanced assignment queries for kanban
  async getAssignmentsWithDetails(): Promise<Array<Assignment & {
    requirement: Requirement;
    clientProfile: ClientProfile;
    worker?: Worker;
    stage: Stage;
  }>> {
    const result = await db
      .select()
      .from(assignments)
      .leftJoin(requirements, eq(assignments.requirementId, requirements.id))
      .leftJoin(clientProfiles, eq(assignments.clientProfileId, clientProfiles.id))
      .leftJoin(workers, eq(assignments.workerId, workers.id))
      .leftJoin(stages, eq(requirements.stageId, stages.id))
      .orderBy(desc(assignments.updatedAt));
    
    return result.map(row => ({
      ...row.assignments,
      requirement: row.requirements!,
      clientProfile: row.client_profiles!,
      worker: row.workers || undefined,
      stage: row.stages!,
    }));
  }
}

export const storage = new DatabaseStorage();
