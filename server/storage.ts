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
  documentTemplates,
  templateFields,
  payments,
  ocrResults,
  workflowRules,
  apiIntegrations,
  translations,
  analyticsEvents,
  invitations,
  workflowTemplates,
  workflowSteps,
  documentRequirements,
  checklistItems,
  workerWorkflowProgress,
  workerStepProgress,
  documentSubmissions,
  checklistCompletions,
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
  type DocumentTemplate,
  type InsertDocumentTemplate,
  type TemplateField,
  type InsertTemplateField,
  type Payment,
  type InsertPayment,
  type OcrResult,
  type WorkflowRule,
  type InsertWorkflowRule,
  type ApiIntegration,
  type Translation,
  type InsertTranslation,
  type AnalyticsEvent,
  type Invitation,
  type InsertInvitation,
  type WorkflowTemplate,
  type InsertWorkflowTemplate,
  type WorkflowStep,
  type InsertWorkflowStep,
  type DocumentRequirement,
  type InsertDocumentRequirement,
  type ChecklistItem,
  type InsertChecklistItem,
  type WorkerWorkflowProgress,
  type InsertWorkerWorkflowProgress,
  type WorkerStepProgress,
  type InsertWorkerStepProgress,
  type DocumentSubmission,
  type InsertDocumentSubmission,
  type ChecklistCompletion,
  type InsertChecklistCompletion,
  extractedDocumentData,
  documentFieldMappings,
  type ExtractedDocumentData,
  type InsertExtractedDocumentData,
  type DocumentFieldMapping,
  type InsertDocumentFieldMapping,
  type WorkflowStepDocumentRequirement,
  type InsertWorkflowStepDocumentRequirement,
  workflowStepDocumentRequirements,
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
  deleteClientProfile(id: string): Promise<boolean>;
  getAllClientProfiles(): Promise<ClientProfile[]>;
  
  // Worker operations
  getWorker(id: string): Promise<Worker | undefined>;
  getWorkerWithDetails(id: string): Promise<any>;
  getWorkersByClientId(clientId: string): Promise<Worker[]>;
  getAllWorkers(): Promise<Worker[]>;
  createWorker(worker: InsertWorker): Promise<Worker>;
  updateWorker(id: string, updates: Partial<InsertWorker>): Promise<Worker>;
  deleteWorker(id: string): Promise<boolean>;
  
  // Stage operations
  getAllStages(): Promise<Stage[]>;
  getStage(id: string): Promise<Stage | undefined>;
  createStage(stage: any): Promise<Stage>;
  updateStage(id: string, updates: any): Promise<Stage | undefined>;
  deleteStage(id: string): Promise<boolean>;
  
  // Requirement operations
  getRequirement(id: string): Promise<Requirement | undefined>;
  getRequirementsByStage(stageId: string): Promise<Requirement[]>;
  getAllRequirements(): Promise<Requirement[]>;
  createRequirement(requirement: InsertRequirement): Promise<Requirement>;
  updateRequirement(id: string, updates: any): Promise<Requirement | undefined>;
  deleteRequirement(id: string): Promise<boolean>;
  
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
  getDocumentFilesByWorkflowStepProgress(workflowStepProgressId: string): Promise<DocumentFile[]>;
  createDocumentFile(file: Omit<DocumentFile, 'id' | 'createdAt'>): Promise<DocumentFile>;
  updateDocumentFileStatus(documentId: string, status: string, notes?: string): Promise<DocumentFile>;
  deleteDocumentFile(documentId: string): Promise<boolean>;
  
  // Workflow Step Document Requirements operations
  getWorkflowStepDocumentRequirements(workflowStepId: string): Promise<WorkflowStepDocumentRequirement[]>;
  createWorkflowStepDocumentRequirement(requirement: InsertWorkflowStepDocumentRequirement): Promise<WorkflowStepDocumentRequirement>;
  updateWorkflowStepDocumentRequirement(id: string, updates: Partial<InsertWorkflowStepDocumentRequirement>): Promise<WorkflowStepDocumentRequirement>;
  deleteWorkflowStepDocumentRequirement(id: string): Promise<boolean>;
  
  // Extracted Document Data operations
  getExtractedDocumentData(documentFileId: string): Promise<ExtractedDocumentData | undefined>;
  createExtractedDocumentData(data: InsertExtractedDocumentData): Promise<ExtractedDocumentData>;
  updateExtractedDocumentData(id: string, updates: Partial<InsertExtractedDocumentData>): Promise<ExtractedDocumentData>;
  getDocumentFieldMappings(extractedDataId: string): Promise<DocumentFieldMapping[]>;
  createDocumentFieldMapping(mapping: InsertDocumentFieldMapping): Promise<DocumentFieldMapping>;
  updateDocumentFieldMapping(id: string, updates: Partial<InsertDocumentFieldMapping>): Promise<DocumentFieldMapping>;
  verifyExtractedData(id: string, verifiedByUserId: string): Promise<ExtractedDocumentData>;
  
  // Search operations
  searchClientsAndWorkers(query: string): Promise<{clients: ClientProfile[], workers: Worker[]}>;
  
  // Audit operations
  createAuditLog(log: Omit<AuditLog, 'id' | 'createdAt'>): Promise<AuditLog>;
  getAuditLogs(limit?: number): Promise<AuditLog[]>;
  
  // Document Template operations
  getAllDocumentTemplates(): Promise<DocumentTemplate[]>;
  getDocumentTemplate(id: string): Promise<DocumentTemplate | undefined>;
  createDocumentTemplate(template: InsertDocumentTemplate): Promise<DocumentTemplate>;
  updateDocumentTemplate(id: string, updates: Partial<InsertDocumentTemplate>): Promise<DocumentTemplate>;
  deleteDocumentTemplate(id: string): Promise<void>;
  getTemplateFields(templateId: string): Promise<TemplateField[]>;
  createTemplateField(field: InsertTemplateField): Promise<TemplateField>;
  updateTemplateFields(templateId: string, fields: InsertTemplateField[]): Promise<TemplateField[]>;
  
  // Payment operations
  getPayment(id: string): Promise<Payment | undefined>;
  getPaymentsByClient(clientId: string): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: string, updates: Partial<InsertPayment>): Promise<Payment>;
  
  // OCR operations
  getOcrResult(documentFileId: string): Promise<OcrResult | undefined>;
  createOcrResult(result: Omit<OcrResult, 'id' | 'createdAt'>): Promise<OcrResult>;
  updateOcrResult(id: string, updates: Partial<OcrResult>): Promise<OcrResult>;
  
  // Workflow operations
  getAllWorkflowRules(): Promise<WorkflowRule[]>;
  getWorkflowRule(id: string): Promise<WorkflowRule | undefined>;
  createWorkflowRule(rule: InsertWorkflowRule): Promise<WorkflowRule>;
  updateWorkflowRule(id: string, updates: Partial<InsertWorkflowRule>): Promise<WorkflowRule>;
  
  // Translation operations
  getTranslations(language?: string): Promise<Translation[]>;
  createTranslation(translation: InsertTranslation): Promise<Translation>;
  updateTranslation(id: string, updates: Partial<InsertTranslation>): Promise<Translation>;
  
  // Analytics operations
  createAnalyticsEvent(event: Omit<AnalyticsEvent, 'id' | 'createdAt'>): Promise<AnalyticsEvent>;
  getAnalyticsEvents(filters?: { eventType?: string; userId?: string; clientProfileId?: string }): Promise<AnalyticsEvent[]>;
  
  // Invitation operations
  createInvitation(invitation: InsertInvitation): Promise<Invitation>;
  getInvitationByToken(token: string): Promise<Invitation | undefined>;
  useInvitation(id: string): Promise<void>;
  getInvitationsByUser(userId: string): Promise<Invitation[]>;
  
  // Dashboard statistics
  getDashboardStats(): Promise<{
    totalClients: number;
    totalWorkers: number;
    activeWorkers: number;
    pendingActions: number;
    completedThisMonth: number;
    totalWorkflowTemplates: number;
    assignmentsByStatus: Record<string, number>;
  }>;
  getWorkflowProgressStats(): Promise<{
    totalSteps: number;
    completedSteps: number;
    pendingSteps: number;
    inProgressSteps: number;
  }>;
  getMonthlyAnalytics(): Promise<Array<{
    month: string;
    completed: number;
    pending: number;
    rejected: number;
  }>>;
  
  // Enhanced assignment queries for kanban
  getAssignmentsWithDetails(): Promise<Array<Assignment & {
    requirement: Requirement;
    clientProfile: ClientProfile;
    worker?: Worker;
    stage: Stage;
  }>>;
  
  // Workflow Template operations
  getAllWorkflowTemplates(): Promise<WorkflowTemplate[]>;
  getWorkflowTemplate(id: string): Promise<WorkflowTemplate | undefined>;
  createWorkflowTemplate(template: InsertWorkflowTemplate): Promise<WorkflowTemplate>;
  updateWorkflowTemplate(id: string, updates: Partial<InsertWorkflowTemplate>): Promise<WorkflowTemplate>;
  deleteWorkflowTemplate(id: string): Promise<boolean>;
  getWorkflowSteps(templateId: string): Promise<WorkflowStep[]>;
  createWorkflowStep(step: InsertWorkflowStep): Promise<WorkflowStep>;
  updateWorkflowStep(id: string, updates: Partial<InsertWorkflowStep>): Promise<WorkflowStep>;
  deleteWorkflowStep(id: string): Promise<boolean>;
  
  // Document Requirements operations
  getDocumentRequirements(stepId: string): Promise<DocumentRequirement[]>;
  createDocumentRequirement(requirement: InsertDocumentRequirement): Promise<DocumentRequirement>;
  updateDocumentRequirement(id: string, updates: Partial<InsertDocumentRequirement>): Promise<DocumentRequirement>;
  deleteDocumentRequirement(id: string): Promise<boolean>;
  
  // Checklist Items operations
  getChecklistItems(stepId: string): Promise<ChecklistItem[]>;
  createChecklistItem(item: InsertChecklistItem): Promise<ChecklistItem>;
  updateChecklistItem(id: string, updates: Partial<InsertChecklistItem>): Promise<ChecklistItem>;
  deleteChecklistItem(id: string): Promise<boolean>;
  
  // Worker Workflow Progress operations
  getWorkerWorkflowProgress(workerId: string, templateId: string): Promise<WorkerWorkflowProgress | undefined>;
  createWorkerWorkflowProgress(progress: InsertWorkerWorkflowProgress): Promise<WorkerWorkflowProgress>;
  updateWorkerWorkflowProgress(id: string, updates: Partial<InsertWorkerWorkflowProgress>): Promise<WorkerWorkflowProgress>;
  getWorkerStepProgress(progressId: string): Promise<WorkerStepProgress[]>;
  createWorkerStepProgress(progress: InsertWorkerStepProgress): Promise<WorkerStepProgress>;
  updateWorkerStepProgress(id: string, updates: Partial<InsertWorkerStepProgress>): Promise<WorkerStepProgress>;
  
  // Document Submission operations
  getDocumentSubmissions(requirementId: string, workerId: string): Promise<DocumentSubmission[]>;
  createDocumentSubmission(submission: InsertDocumentSubmission): Promise<DocumentSubmission>;
  updateDocumentSubmission(id: string, updates: Partial<InsertDocumentSubmission>): Promise<DocumentSubmission>;
  
  // Checklist Completion operations
  getChecklistCompletions(itemId: string, workerId: string): Promise<ChecklistCompletion[]>;
  createChecklistCompletion(completion: InsertChecklistCompletion): Promise<ChecklistCompletion>;
  updateChecklistCompletion(id: string, updates: Partial<InsertChecklistCompletion>): Promise<ChecklistCompletion>;
  
  // Worker workflow linking operations
  linkWorkerToWorkflow(workerId: string, templateId: string): Promise<WorkerWorkflowProgress>;
  unlinkWorkerFromWorkflow(workerId: string, templateId: string): Promise<boolean>;
  getWorkersForWorkflow(templateId: string): Promise<Worker[]>;
  getWorkflowsForWorker(workerId: string): Promise<WorkflowTemplate[]>;

  // RBAC helper methods
  getWorkerAssignments(workerId: string): Promise<Assignment[]>;
  getWorkerProfile(workerId: string): Promise<Worker | undefined>;
  getClientsByOwner(ownerId: string): Promise<ClientProfile[]>;
  getDocument(documentId: string): Promise<DocumentFile | undefined>;
  getTemplate(templateId: string): Promise<DocumentTemplate | undefined>;
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
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(clientProfiles.id, id))
      .returning();
    return updated;
  }

  async deleteClientProfile(id: string): Promise<boolean> {
    const result = await db
      .delete(clientProfiles)
      .where(eq(clientProfiles.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getAllClientProfiles(): Promise<ClientProfile[]> {
    return await db.select().from(clientProfiles).orderBy(clientProfiles.legalName);
  }

  // Worker operations
  async getWorker(id: string): Promise<Worker | undefined> {
    const [worker] = await db.select().from(workers).where(eq(workers.id, id));
    return worker;
  }

  async getWorkerWithDetails(id: string): Promise<any> {
    // Get the worker basic info
    const [worker] = await db.select().from(workers).where(eq(workers.id, id));
    if (!worker) return undefined;

    // Get the client profile info
    const [clientProfile] = await db
      .select({
        id: clientProfiles.id,
        legalName: clientProfiles.legalName
      })
      .from(clientProfiles)
      .where(eq(clientProfiles.id, worker.clientProfileId));

    // Get assignments with requirements and stages
    const assignmentsData = await db
      .select({
        assignment: assignments,
        requirement: requirements,
        stage: stages
      })
      .from(assignments)
      .leftJoin(requirements, eq(assignments.requirementId, requirements.id))
      .leftJoin(stages, eq(requirements.stageId, stages.id))
      .where(eq(assignments.workerId, id));

    // Get document files for each assignment
    const assignmentIds = assignmentsData.map((a: any) => a.assignment.id);
    const documents = assignmentIds.length > 0 
      ? await db.select().from(documentFiles).where(
          or(...assignmentIds.map((assignId: string) => eq(documentFiles.assignmentId, assignId)))
        )
      : [];

    // Group documents by assignment ID
    const documentsByAssignment = documents.reduce((acc: any, doc: any) => {
      if (!acc[doc.assignmentId]) acc[doc.assignmentId] = [];
      acc[doc.assignmentId].push(doc);
      return acc;
    }, {} as Record<string, typeof documents>);

    // Combine assignments with their documents
    const workerAssignments = assignmentsData.map(({ assignment, requirement, stage }: any) => ({
      id: assignment.id,
      requirement: {
        id: requirement?.id,
        title: requirement?.title,
        description: requirement?.description,
        stage: {
          key: stage?.key,
          title: stage?.title,
          order: stage?.order
        }
      },
      status: assignment.status,
      documentFiles: documentsByAssignment[assignment.id] || [],
      submittedAt: assignment.submittedAt,
      approvedAt: assignment.approvedAt,
      rejectedReason: assignment.rejectedReason
    }));

    return {
      ...worker,
      clientProfile,
      assignments: workerAssignments
    };
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

  async getAllWorkers(): Promise<Worker[]> {
    return await db.select().from(workers);
  }

  async deleteWorker(id: string): Promise<boolean> {
    const result = await db
      .delete(workers)
      .where(eq(workers.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Stage operations
  async getAllStages(): Promise<Stage[]> {
    return await db.select().from(stages).orderBy(asc(stages.order));
  }

  async getStage(id: string): Promise<Stage | undefined> {
    const [stage] = await db.select().from(stages).where(eq(stages.id, id));
    return stage;
  }

  async createStage(stageData: any): Promise<Stage> {
    const [newStage] = await db.insert(stages).values(stageData).returning();
    return newStage;
  }

  async updateStage(id: string, updates: any): Promise<Stage | undefined> {
    const [updated] = await db
      .update(stages)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(stages.id, id))
      .returning();
    return updated;
  }

  async deleteStage(id: string): Promise<boolean> {
    const result = await db
      .delete(stages)
      .where(eq(stages.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Requirement operations
  async getRequirement(id: string): Promise<Requirement | undefined> {
    const [requirement] = await db.select().from(requirements).where(eq(requirements.id, id));
    return requirement;
  }

  async getRequirementsByStage(stageId: string): Promise<Requirement[]> {
    return await db.select().from(requirements).where(eq(requirements.stageId, stageId));
  }

  async getAllRequirements(): Promise<Requirement[]> {
    return await db.select().from(requirements).orderBy(requirements.title);
  }

  async createRequirement(requirement: InsertRequirement): Promise<Requirement> {
    const [newRequirement] = await db.insert(requirements).values(requirement).returning();
    return newRequirement;
  }

  async updateRequirement(id: string, updates: any): Promise<Requirement | undefined> {
    const [updated] = await db
      .update(requirements)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(requirements.id, id))
      .returning();
    return updated;
  }

  async deleteRequirement(id: string): Promise<boolean> {
    const result = await db
      .delete(requirements)
      .where(eq(requirements.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
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

  async updateDocumentFileStatus(documentId: string, status: string, notes?: string): Promise<DocumentFile> {
    // Note: The documentFiles table doesn't have status/notes fields in current schema
    // For now, we'll create an audit log entry and return the file
    await this.createAuditLog({
      userId: 'system',
      action: 'document_status_update',
      entityType: 'document_file',
      entityId: documentId,
      metadata: { status, notes }
    });
    
    const file = await this.getDocumentFile(documentId);
    if (!file) {
      throw new Error('Document file not found');
    }
    
    return file;
  }

  async deleteDocumentFile(documentId: string): Promise<boolean> {
    const result = await db.delete(documentFiles).where(eq(documentFiles.id, documentId));
    return result.rowCount > 0;
  }

  async getDocumentFilesByWorkflowStepProgress(workflowStepProgressId: string): Promise<DocumentFile[]> {
    return await db.select().from(documentFiles).where(eq(documentFiles.workflowStepProgressId, workflowStepProgressId));
  }

  // Workflow Step Document Requirements operations
  async getWorkflowStepDocumentRequirements(workflowStepId: string): Promise<WorkflowStepDocumentRequirement[]> {
    return await db.select().from(workflowStepDocumentRequirements).where(eq(workflowStepDocumentRequirements.workflowStepId, workflowStepId));
  }

  async createWorkflowStepDocumentRequirement(requirement: InsertWorkflowStepDocumentRequirement): Promise<WorkflowStepDocumentRequirement> {
    const [newRequirement] = await db.insert(workflowStepDocumentRequirements).values(requirement).returning();
    return newRequirement;
  }

  async updateWorkflowStepDocumentRequirement(id: string, updates: Partial<InsertWorkflowStepDocumentRequirement>): Promise<WorkflowStepDocumentRequirement> {
    const [updated] = await db.update(workflowStepDocumentRequirements)
      .set(updates)
      .where(eq(workflowStepDocumentRequirements.id, id))
      .returning();
    return updated;
  }

  async deleteWorkflowStepDocumentRequirement(id: string): Promise<boolean> {
    const result = await db.delete(workflowStepDocumentRequirements).where(eq(workflowStepDocumentRequirements.id, id));
    return result.rowCount > 0;
  }

  // Extracted Document Data operations
  async getExtractedDocumentData(documentFileId: string): Promise<ExtractedDocumentData | undefined> {
    const [result] = await db
      .select()
      .from(extractedDocumentData)
      .where(eq(extractedDocumentData.documentFileId, documentFileId));
    return result;
  }

  async createExtractedDocumentData(data: InsertExtractedDocumentData): Promise<ExtractedDocumentData> {
    const [result] = await db.insert(extractedDocumentData).values(data).returning();
    return result;
  }

  async updateExtractedDocumentData(id: string, updates: Partial<InsertExtractedDocumentData>): Promise<ExtractedDocumentData> {
    const [result] = await db
      .update(extractedDocumentData)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(extractedDocumentData.id, id))
      .returning();
    return result;
  }

  async getDocumentFieldMappings(extractedDataId: string): Promise<DocumentFieldMapping[]> {
    return await db
      .select()
      .from(documentFieldMappings)
      .where(eq(documentFieldMappings.extractedDataId, extractedDataId));
  }

  async createDocumentFieldMapping(mapping: InsertDocumentFieldMapping): Promise<DocumentFieldMapping> {
    const [result] = await db.insert(documentFieldMappings).values(mapping).returning();
    return result;
  }

  async updateDocumentFieldMapping(id: string, updates: Partial<InsertDocumentFieldMapping>): Promise<DocumentFieldMapping> {
    const [result] = await db
      .update(documentFieldMappings)
      .set(updates)
      .where(eq(documentFieldMappings.id, id))
      .returning();
    return result;
  }

  async verifyExtractedData(id: string, verifiedByUserId: string): Promise<ExtractedDocumentData> {
    const [result] = await db
      .update(extractedDocumentData)
      .set({ 
        verifiedAt: new Date(),
        verifiedByUserId,
        updatedAt: new Date()
      })
      .where(eq(extractedDocumentData.id, id))
      .returning();
    return result;
  }

  // Search operations
  async searchClientsAndWorkers(query: string): Promise<{clients: ClientProfile[], workers: Worker[]}> {
    const searchQuery = `%${query}%`;
    
    const clients = await db
      .select()
      .from(clientProfiles)
      .where(
        or(
          like(clientProfiles.legalName, searchQuery),
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
    totalWorkflowTemplates: number;
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
      .innerJoin(workers, eq(assignments.workerId, workers.id))
      .where(
        or(
          eq(assignments.status, 'AWAITING_UPLOAD'),
          eq(assignments.status, 'SUBMITTED_BY_USER'),
          eq(assignments.status, 'RECEIVED_BY_ADMIN'),
          eq(assignments.status, 'SUBMITTED_TO_INSTITUTION_DIGITAL'),
          eq(assignments.status, 'SUBMITTED_TO_INSTITUTION_COURIER')
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
    
    // Get total workflow templates
    const totalWorkflowTemplatesResult = await db.select({ count: count() }).from(workflowTemplates);
    
    return {
      totalClients: totalClients[0]?.count ?? 0,
      totalWorkers: totalWorkers[0]?.count ?? 0,
      activeWorkers: activeWorkersResult.length,
      pendingActions: pendingActionsResult[0]?.count ?? 0,
      completedThisMonth: completedThisMonthResult[0]?.count ?? 0,
      totalWorkflowTemplates: totalWorkflowTemplatesResult[0]?.count ?? 0,
      assignmentsByStatus,
    };
  }
  
  // Delete test data
  async deleteTestData(): Promise<void> {
    // Delete in correct order due to foreign key constraints
    await db.delete(assignments).where(sql`${assignments.id} IN (
      SELECT a.id FROM assignments a
      JOIN clientProfiles cp ON a.clientProfileId = cp.id
      WHERE cp.companyName LIKE 'Test %'
    )`);

    await db.delete(requirements).where(sql`${requirements.title} LIKE 'Test %'`);
    await db.delete(stages).where(sql`${stages.title} LIKE 'Test %'`);
    await db.delete(workers).where(sql`${workers.firstName} LIKE 'Test %'`);
    await db.delete(clientProfiles).where(sql`${clientProfiles.legalName} LIKE 'Test %'`);
    await db.delete(users).where(sql`${users.firstName} LIKE 'Test %'`);
  }
  
  // Get workflow progress statistics
  async getWorkflowProgressStats(): Promise<{
    totalSteps: number;
    completedSteps: number;
    pendingSteps: number;
    inProgressSteps: number;
  }> {
    const totalStepsResult = await db.select({ count: count() }).from(workerStepProgress);
    
    const stepStatusCounts = await db
      .select({
        status: workerStepProgress.status,
        count: count()
      })
      .from(workerStepProgress)
      .groupBy(workerStepProgress.status);
    
    const statusCounts = stepStatusCounts.reduce((acc, row) => {
      acc[row.status] = row.count;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalSteps: totalStepsResult[0]?.count ?? 0,
      completedSteps: statusCounts.COMPLETED || 0,
      pendingSteps: statusCounts.PENDING || 0,
      inProgressSteps: statusCounts.IN_PROGRESS || 0,
    };
  }
  
  // Get monthly analytics data
  async getMonthlyAnalytics(): Promise<Array<{
    month: string;
    completed: number;
    pending: number;
    rejected: number;
  }>> {
    // Get data for last 6 months
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' });
      
      // Get completed assignments for this month
      const completedResult = await db
        .select({ count: count() })
        .from(assignments)
        .where(
          and(
            eq(assignments.status, 'ACCEPTED'),
            sql`${assignments.approvedAt} >= ${monthDate.toISOString()}`,
            sql`${assignments.approvedAt} < ${nextMonth.toISOString()}`
          )
        );
      
      // Get pending assignments for this month
      const pendingResult = await db
        .select({ count: count() })
        .from(assignments)
        .where(
          and(
            or(
              eq(assignments.status, 'AWAITING_UPLOAD'),
              eq(assignments.status, 'SUBMITTED_BY_USER'),
              eq(assignments.status, 'RECEIVED_BY_ADMIN')
            ),
            sql`${assignments.createdAt} >= ${monthDate.toISOString()}`,
            sql`${assignments.createdAt} < ${nextMonth.toISOString()}`
          )
        );
      
      // Get rejected assignments for this month
      const rejectedResult = await db
        .select({ count: count() })
        .from(assignments)
        .where(
          and(
            eq(assignments.status, 'REJECTED'),
            sql`${assignments.createdAt} >= ${monthDate.toISOString()}`,
            sql`${assignments.createdAt} < ${nextMonth.toISOString()}`
          )
        );
      
      months.push({
        month: monthName,
        completed: completedResult[0]?.count || 0,
        pending: pendingResult[0]?.count || 0,
        rejected: rejectedResult[0]?.count || 0,
      });
    }
    
    return months;
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

  // Document Template operations
  async getAllDocumentTemplates(): Promise<DocumentTemplate[]> {
    return await db.select().from(documentTemplates).orderBy(desc(documentTemplates.createdAt));
  }

  async getDocumentTemplate(id: string): Promise<DocumentTemplate | undefined> {
    const result = await db.select().from(documentTemplates).where(eq(documentTemplates.id, id));
    return result[0];
  }

  async createDocumentTemplate(template: InsertDocumentTemplate): Promise<DocumentTemplate> {
    const result = await db.insert(documentTemplates).values(template).returning();
    return result[0];
  }

  async updateDocumentTemplate(id: string, updates: Partial<InsertDocumentTemplate>): Promise<DocumentTemplate> {
    const result = await db
      .update(documentTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(documentTemplates.id, id))
      .returning();
    return result[0];
  }

  async deleteDocumentTemplate(id: string): Promise<void> {
    await db.delete(templateFields).where(eq(templateFields.templateId, id));
    await db.delete(documentTemplates).where(eq(documentTemplates.id, id));
  }

  async getTemplateFields(templateId: string): Promise<TemplateField[]> {
    return await db
      .select()
      .from(templateFields)
      .where(eq(templateFields.templateId, templateId))
      .orderBy(asc(templateFields.position));
  }

  async createTemplateField(field: InsertTemplateField): Promise<TemplateField> {
    const result = await db.insert(templateFields).values(field).returning();
    return result[0];
  }

  async updateTemplateFields(templateId: string, fields: InsertTemplateField[]): Promise<TemplateField[]> {
    // Delete existing fields
    await db.delete(templateFields).where(eq(templateFields.templateId, templateId));
    
    // Insert new fields
    if (fields.length === 0) return [];
    
    const result = await db.insert(templateFields).values(fields).returning();
    return result;
  }

  // Payment operations
  async getPayment(id: string): Promise<Payment | undefined> {
    const result = await db.select().from(payments).where(eq(payments.id, id));
    return result[0];
  }

  async getPaymentsByClient(clientId: string): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.clientProfileId, clientId));
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const result = await db.insert(payments).values(payment).returning();
    return result[0];
  }

  async updatePayment(id: string, updates: Partial<InsertPayment>): Promise<Payment> {
    const result = await db
      .update(payments)
      .set(updates)
      .where(eq(payments.id, id))
      .returning();
    return result[0];
  }

  // OCR operations
  async getOcrResult(documentFileId: string): Promise<OcrResult | undefined> {
    const result = await db.select().from(ocrResults).where(eq(ocrResults.documentFileId, documentFileId));
    return result[0];
  }

  async createOcrResult(result: Omit<OcrResult, 'id' | 'createdAt'>): Promise<OcrResult> {
    const insertResult = await db.insert(ocrResults).values(result).returning();
    return insertResult[0];
  }

  async updateOcrResult(id: string, updates: Partial<OcrResult>): Promise<OcrResult> {
    const result = await db
      .update(ocrResults)
      .set(updates)
      .where(eq(ocrResults.id, id))
      .returning();
    return result[0];
  }

  // Workflow operations
  async getAllWorkflowRules(): Promise<WorkflowRule[]> {
    return await db.select().from(workflowRules).orderBy(desc(workflowRules.createdAt));
  }

  async getWorkflowRule(id: string): Promise<WorkflowRule | undefined> {
    const result = await db.select().from(workflowRules).where(eq(workflowRules.id, id));
    return result[0];
  }

  async createWorkflowRule(rule: InsertWorkflowRule): Promise<WorkflowRule> {
    const result = await db.insert(workflowRules).values(rule).returning();
    return result[0];
  }

  async updateWorkflowRule(id: string, updates: Partial<InsertWorkflowRule>): Promise<WorkflowRule> {
    const result = await db
      .update(workflowRules)
      .set(updates)
      .where(eq(workflowRules.id, id))
      .returning();
    return result[0];
  }

  // Translation operations
  async getTranslations(language?: string): Promise<Translation[]> {
    if (language) {
      return await db.select().from(translations).where(eq(translations.language, language as any));
    }
    return await db.select().from(translations);
  }

  async createTranslation(translation: InsertTranslation): Promise<Translation> {
    const result = await db.insert(translations).values(translation).returning();
    return result[0];
  }

  async updateTranslation(id: string, updates: Partial<InsertTranslation>): Promise<Translation> {
    const result = await db
      .update(translations)
      .set(updates)
      .where(eq(translations.id, id))
      .returning();
    return result[0];
  }

  // Analytics operations
  async createAnalyticsEvent(event: Omit<AnalyticsEvent, 'id' | 'createdAt'>): Promise<AnalyticsEvent> {
    const result = await db.insert(analyticsEvents).values(event).returning();
    return result[0];
  }

  async getAnalyticsEvents(filters?: { eventType?: string; userId?: string; clientProfileId?: string }): Promise<AnalyticsEvent[]> {
    let baseQuery = db.select().from(analyticsEvents);
    
    if (filters) {
      const conditions = [];
      if (filters.eventType) {
        conditions.push(eq(analyticsEvents.eventType, filters.eventType));
      }
      if (filters.userId) {
        conditions.push(eq(analyticsEvents.userId, filters.userId));
      }
      if (filters.clientProfileId) {
        conditions.push(eq(analyticsEvents.clientProfileId, filters.clientProfileId));
      }
      
      if (conditions.length > 0) {
        baseQuery = baseQuery.where(and(...conditions));
      }
    }
    
    return await baseQuery.orderBy(desc(analyticsEvents.createdAt));
  }

  // Invitation operations
  async createInvitation(invitation: InsertInvitation): Promise<Invitation> {
    const result = await db.insert(invitations).values(invitation).returning();
    return result[0];
  }

  async getInvitationByToken(token: string): Promise<Invitation | undefined> {
    const result = await db.select().from(invitations).where(eq(invitations.token, token));
    return result[0];
  }

  async useInvitation(id: string): Promise<void> {
    await db
      .update(invitations)
      .set({ used: true, usedAt: new Date() })
      .where(eq(invitations.id, id));
  }

  async getInvitationsByUser(userId: string): Promise<Invitation[]> {
    return await db
      .select()
      .from(invitations)
      .where(eq(invitations.invitedByUserId, userId))
      .orderBy(desc(invitations.createdAt));
  }
  
  // RBAC helper methods
  async getWorkerAssignments(workerId: string): Promise<Assignment[]> {
    return await db.select().from(assignments).where(eq(assignments.workerId, workerId));
  }

  async getWorkerProfile(workerId: string): Promise<Worker | undefined> {
    const [worker] = await db.select().from(workers).where(eq(workers.id, workerId));
    return worker;
  }

  async getClientsByOwner(ownerId: string): Promise<ClientProfile[]> {
    return await db.select().from(clientProfiles).where(eq(clientProfiles.ownerUserId, ownerId));
  }

  async getDocument(documentId: string): Promise<DocumentFile | undefined> {
    const [doc] = await db.select().from(documentFiles).where(eq(documentFiles.id, documentId));
    return doc;
  }

  async getTemplate(templateId: string): Promise<DocumentTemplate | undefined> {
    const [template] = await db.select().from(documentTemplates).where(eq(documentTemplates.id, templateId));
    return template;
  }

  // Workflow Template operations
  async getAllWorkflowTemplates(): Promise<WorkflowTemplate[]> {
    return await db.select().from(workflowTemplates).orderBy(asc(workflowTemplates.name));
  }

  async getWorkflowTemplate(id: string): Promise<WorkflowTemplate | undefined> {
    const [template] = await db.select().from(workflowTemplates).where(eq(workflowTemplates.id, id));
    return template;
  }

  async createWorkflowTemplate(template: InsertWorkflowTemplate): Promise<WorkflowTemplate> {
    const result = await db.insert(workflowTemplates).values(template).returning();
    return result[0];
  }

  async updateWorkflowTemplate(id: string, updates: Partial<InsertWorkflowTemplate>): Promise<WorkflowTemplate> {
    const result = await db.update(workflowTemplates).set(updates).where(eq(workflowTemplates.id, id)).returning();
    return result[0];
  }

  async deleteWorkflowTemplate(id: string): Promise<boolean> {
    const result = await db.delete(workflowTemplates).where(eq(workflowTemplates.id, id));
    return result.rowCount > 0;
  }

  async getWorkflowSteps(templateId: string): Promise<WorkflowStep[]> {
    return await db.select().from(workflowSteps).where(eq(workflowSteps.workflowTemplateId, templateId)).orderBy(asc(workflowSteps.order));
  }

  async createWorkflowStep(step: InsertWorkflowStep): Promise<WorkflowStep> {
    const result = await db.insert(workflowSteps).values(step).returning();
    const createdStep = result[0];
    
    // Automatically create default document requirements based on step type
    await this.createDefaultDocumentRequirements(createdStep.id, createdStep.stepType);
    
    return createdStep;
  }

  async updateWorkflowStep(id: string, updates: Partial<InsertWorkflowStep>): Promise<WorkflowStep> {
    const result = await db.update(workflowSteps).set(updates).where(eq(workflowSteps.id, id)).returning();
    return result[0];
  }

  async deleteWorkflowStep(id: string): Promise<boolean> {
    const result = await db.delete(workflowSteps).where(eq(workflowSteps.id, id));
    return result.rowCount > 0;
  }

  // Document Requirements operations
  async getDocumentRequirements(stepId: string): Promise<DocumentRequirement[]> {
    return await db.select().from(documentRequirements).where(eq(documentRequirements.workflowStepId, stepId)).orderBy(asc(documentRequirements.order));
  }

  async createDocumentRequirement(requirement: InsertDocumentRequirement): Promise<DocumentRequirement> {
    const result = await db.insert(documentRequirements).values(requirement).returning();
    return result[0];
  }

  async updateDocumentRequirement(id: string, updates: Partial<InsertDocumentRequirement>): Promise<DocumentRequirement> {
    const result = await db.update(documentRequirements).set(updates).where(eq(documentRequirements.id, id)).returning();
    return result[0];
  }

  async deleteDocumentRequirement(id: string): Promise<boolean> {
    const result = await db.delete(documentRequirements).where(eq(documentRequirements.id, id));
    return result.rowCount > 0;
  }

  // Helper method to create default document requirements based on step type
  private async createDefaultDocumentRequirements(stepId: string, stepType: string): Promise<void> {
    const defaultRequirements = this.getDefaultDocumentRequirementsByStepType(stepType);
    
    for (const requirement of defaultRequirements) {
      await this.createDocumentRequirement({
        workflowStepId: stepId,
        ...requirement
      });
    }
  }

  // Define default document requirements for each step type
  private getDefaultDocumentRequirementsByStepType(stepType: string): Array<Omit<InsertDocumentRequirement, 'workflowStepId'>> {
    switch (stepType) {
      case 'DOCUMENT_COLLECTION':
        return [
          {
            title: 'Required Documents',
            description: 'Collection of all required documents for this stage',
            isRequired: true,
            submittedBy: 'WORKER',
            acceptedFileTypes: ['pdf', 'jpg', 'png'],
            order: 1
          }
        ];
      
      case 'DOCUMENT_REVIEW':
        return [
          {
            title: 'Document Verification Checklist',
            description: 'Complete verification of all submitted documents for completeness and accuracy',
            isRequired: true,
            submittedBy: 'OWNER',
            acceptedFileTypes: ['pdf'],
            order: 1
          }
        ];
      
      case 'FORM_COMPLETION':
        return [
          {
            title: 'Completed Application Forms',
            description: 'All required forms completed and ready for submission',
            isRequired: true,
            submittedBy: 'OWNER',
            acceptedFileTypes: ['pdf'],
            order: 1
          }
        ];
      
      case 'INSTITUTIONAL_SUBMISSION':
        return [
          {
            title: 'Submission Confirmation Receipt',
            description: 'Official receipt or confirmation of submission to the relevant institution',
            isRequired: true,
            submittedBy: 'OWNER',
            acceptedFileTypes: ['pdf', 'jpg', 'png'],
            order: 1
          }
        ];
      
      case 'ADMIN_APPROVAL':
        return [
          {
            title: 'Official Approval Document',
            description: 'Official approval, certificate, or permit issued by the relevant authority',
            isRequired: true,
            submittedBy: 'OWNER',
            acceptedFileTypes: ['pdf'],
            order: 1
          }
        ];
      
      default:
        return [];
    }
  }

  // Checklist Items operations
  async getChecklistItems(stepId: string): Promise<ChecklistItem[]> {
    return await db.select().from(checklistItems).where(eq(checklistItems.workflowStepId, stepId)).orderBy(asc(checklistItems.title));
  }

  async createChecklistItem(item: InsertChecklistItem): Promise<ChecklistItem> {
    const result = await db.insert(checklistItems).values(item).returning();
    return result[0];
  }

  async updateChecklistItem(id: string, updates: Partial<InsertChecklistItem>): Promise<ChecklistItem> {
    const result = await db.update(checklistItems).set(updates).where(eq(checklistItems.id, id)).returning();
    return result[0];
  }

  async deleteChecklistItem(id: string): Promise<boolean> {
    const result = await db.delete(checklistItems).where(eq(checklistItems.id, id));
    return result.rowCount > 0;
  }

  // Worker Workflow Progress operations
  async getWorkerWorkflowProgress(workerId: string, templateId: string): Promise<WorkerWorkflowProgress | undefined> {
    const [progress] = await db.select().from(workerWorkflowProgress)
      .where(and(eq(workerWorkflowProgress.workerId, workerId), eq(workerWorkflowProgress.workflowTemplateId, templateId)));
    return progress;
  }

  async createWorkerWorkflowProgress(progress: InsertWorkerWorkflowProgress): Promise<WorkerWorkflowProgress> {
    const result = await db.insert(workerWorkflowProgress).values(progress).returning();
    return result[0];
  }

  async updateWorkerWorkflowProgress(id: string, updates: Partial<InsertWorkerWorkflowProgress>): Promise<WorkerWorkflowProgress> {
    const result = await db.update(workerWorkflowProgress).set(updates).where(eq(workerWorkflowProgress.id, id)).returning();
    return result[0];
  }

  async getWorkerStepProgress(progressId: string): Promise<WorkerStepProgress[]> {
    return await db.select().from(workerStepProgress).where(eq(workerStepProgress.workerWorkflowProgressId, progressId));
  }

  async createWorkerStepProgress(progress: InsertWorkerStepProgress): Promise<WorkerStepProgress> {
    const result = await db.insert(workerStepProgress).values(progress).returning();
    return result[0];
  }

  async updateWorkerStepProgress(id: string, updates: Partial<InsertWorkerStepProgress>): Promise<WorkerStepProgress> {
    const result = await db.update(workerStepProgress).set(updates).where(eq(workerStepProgress.id, id)).returning();
    return result[0];
  }

  // Document Submission operations
  async getDocumentSubmissions(requirementId: string, workerId: string): Promise<DocumentSubmission[]> {
    return await db.select().from(documentSubmissions)
      .where(and(eq(documentSubmissions.requirementId, requirementId), eq(documentSubmissions.workerId, workerId)))
      .orderBy(desc(documentSubmissions.submittedAt));
  }

  async createDocumentSubmission(submission: InsertDocumentSubmission): Promise<DocumentSubmission> {
    const result = await db.insert(documentSubmissions).values(submission).returning();
    return result[0];
  }

  async updateDocumentSubmission(id: string, updates: Partial<InsertDocumentSubmission>): Promise<DocumentSubmission> {
    const result = await db.update(documentSubmissions).set(updates).where(eq(documentSubmissions.id, id)).returning();
    return result[0];
  }

  // Checklist Completion operations
  async getChecklistCompletions(itemId: string, workerId: string): Promise<ChecklistCompletion[]> {
    return await db.select().from(checklistCompletions)
      .where(and(eq(checklistCompletions.itemId, itemId), eq(checklistCompletions.workerId, workerId)))
      .orderBy(desc(checklistCompletions.completedAt));
  }

  async createChecklistCompletion(completion: InsertChecklistCompletion): Promise<ChecklistCompletion> {
    const result = await db.insert(checklistCompletions).values(completion).returning();
    return result[0];
  }

  async updateChecklistCompletion(id: string, updates: Partial<InsertChecklistCompletion>): Promise<ChecklistCompletion> {
    const result = await db.update(checklistCompletions).set(updates).where(eq(checklistCompletions.id, id)).returning();
    return result[0];
  }

  // Worker workflow linking operations
  async linkWorkerToWorkflow(workerId: string, templateId: string): Promise<WorkerWorkflowProgress> {
    // Check if already linked
    const existing = await this.getWorkerWorkflowProgress(workerId, templateId);
    if (existing) {
      return existing;
    }
    
    // Create new workflow progress
    const progress: InsertWorkerWorkflowProgress = {
      workerId,
      templateId,
      status: 'not_started',
      startedAt: new Date(),
      completedAt: null,
      notes: null
    };
    
    return await this.createWorkerWorkflowProgress(progress);
  }

  async unlinkWorkerFromWorkflow(workerId: string, templateId: string): Promise<boolean> {
    const progress = await this.getWorkerWorkflowProgress(workerId, templateId);
    if (!progress) {
      return false;
    }
    
    // Delete all related step progress
    await db.delete(workerStepProgress).where(eq(workerStepProgress.progressId, progress.id));
    
    // Delete workflow progress
    const result = await db.delete(workerWorkflowProgress).where(eq(workerWorkflowProgress.id, progress.id));
    return result.rowCount > 0;
  }

  async getWorkersForWorkflow(templateId: string): Promise<Worker[]> {
    const result = await db.select({ worker: workers })
      .from(workerWorkflowProgress)
      .innerJoin(workers, eq(workerWorkflowProgress.workerId, workers.id))
      .where(eq(workerWorkflowProgress.templateId, templateId));
    
    return result.map(r => r.worker);
  }

  async getWorkflowsForWorker(workerId: string): Promise<WorkflowTemplate[]> {
    const result = await db.select({ template: workflowTemplates })
      .from(workerWorkflowProgress)
      .innerJoin(workflowTemplates, eq(workerWorkflowProgress.workflowTemplateId, workflowTemplates.id))
      .where(eq(workerWorkflowProgress.workerId, workerId));
    
    return result.map(r => r.template);
  }

  // Data consistency fixes
  async getInconsistentAssignments(): Promise<Assignment[]> {
    // Find assignments with SUBMITTED_BY_USER status but no documents
    const submittedAssignments = await db
      .select({ assignment: assignments })
      .from(assignments)
      .where(eq(assignments.status, 'SUBMITTED_BY_USER'));

    const inconsistentAssignments = [];
    
    for (const { assignment } of submittedAssignments) {
      const documents = await db
        .select()
        .from(documentFiles)
        .where(eq(documentFiles.assignmentId, assignment.id));
      
      if (documents.length === 0) {
        inconsistentAssignments.push(assignment);
      }
    }
    
    return inconsistentAssignments;
  }

  async fixInconsistentAssignmentStatuses(): Promise<number> {
    const inconsistentAssignments = await this.getInconsistentAssignments();
    
    if (inconsistentAssignments.length === 0) {
      return 0;
    }

    // Reset status to AWAITING_UPLOAD and clear submission timestamp
    const assignmentIds = inconsistentAssignments.map(a => a.id);
    
    for (const assignmentId of assignmentIds) {
      await db
        .update(assignments)
        .set({ 
          status: 'AWAITING_UPLOAD',
          submittedAt: null
        })
        .where(eq(assignments.id, assignmentId));
    }

    return inconsistentAssignments.length;
  }
}

export const storage = new DatabaseStorage();
