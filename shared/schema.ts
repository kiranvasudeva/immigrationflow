import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
  integer,
  pgEnum,
  uuid
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Enums
export const userRoleEnum = pgEnum('user_role', ['ADMIN', 'OWNER', 'WORKER', 'VIEWER']);
export const stageKeyEnum = pgEnum('stage_key', ['AJOFM', 'IGI_WORK_PERMIT', 'CONSULATE_VISA', 'IGI_RESIDENCE']);
export const requirementTypeEnum = pgEnum('requirement_type', ['STANDARD', 'CUSTOM']);
export const assignmentStatusEnum = pgEnum('assignment_status', [
  'NOT_STARTED',
  'AWAITING_UPLOAD', 
  'SUBMITTED_BY_USER',
  'RECEIVED_BY_ADMIN',
  'SUBMITTED_TO_INSTITUTION_DIGITAL',
  'SUBMITTED_TO_INSTITUTION_COURIER',
  'ACCEPTED',
  'REJECTED'
]);
export const assignedToRoleEnum = pgEnum('assigned_to_role', ['OWNER', 'WORKER']);
export const documentKindEnum = pgEnum('document_kind', ['USER_UPLOAD', 'ADMIN_RECEIPT', 'GENERATED_PDF']);
export const reminderScopeEnum = pgEnum('reminder_scope', ['GLOBAL', 'CLIENT', 'STAGE']);
export const templateTypeEnum = pgEnum('template_type', ['FORM', 'DOCUMENT', 'CERTIFICATE']);
export const fieldTypeEnum = pgEnum('field_type', ['TEXT', 'DATE', 'NUMBER', 'CHECKBOX', 'DROPDOWN', 'SIGNATURE', 'PHOTO']);
export const languageEnum = pgEnum('language', ['en', 'ro', 'es', 'fr']);

// User table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").notNull().default('OWNER'),
  invitedById: varchar("invited_by_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Client Profile table
export const clientProfiles = pgTable("client_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  legalName: varchar("legal_name", { length: 255 }).notNull(), // Legal business name
  registrationNumber: varchar("registration_number", { length: 50 }).notNull(), // ONRC registration number
  cui: varchar("cui", { length: 20 }).notNull().unique(), // Romanian fiscal code
  legalAddress: text("legal_address").notNull(), // Sediu legal address
  adminName: varchar("admin_name", { length: 255 }).notNull(), // Name of administrator/representative
  contactEmail: varchar("contact_email", { length: 255 }).notNull(),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
  bankIban: varchar("bank_iban", { length: 34 }).notNull(), // Bank IBAN account number
  caen: varchar("caen", { length: 10 }).notNull(), // CAEN activity code
  ownerUserId: varchar("owner_user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Worker table
export const workers = pgTable("workers", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientProfileId: uuid("client_profile_id").notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  dob: timestamp("dob"),
  nationality: varchar("nationality", { length: 50 }).notNull(),
  passportNumber: varchar("passport_number", { length: 50 }).notNull(),
  passportExpiry: timestamp("passport_expiry"),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Stage table
export const stages = pgTable("stages", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: stageKeyEnum("key").notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  order: integer("order").notNull(),
});

// Requirement table
export const requirements = pgTable("requirements", {
  id: uuid("id").primaryKey().defaultRandom(),
  stageId: uuid("stage_id").notNull(),
  type: requirementTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  required: boolean("required").notNull().default(true),
  autoPopulate: boolean("auto_populate").notNull().default(false),
  templateKey: varchar("template_key", { length: 100 }),
  dueRule: jsonb("due_rule"), // JSON with deadline logic
  createdByUserId: varchar("created_by_user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Assignment table
export const assignments = pgTable("assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  requirementId: uuid("requirement_id").notNull(),
  clientProfileId: uuid("client_profile_id").notNull(),
  workerId: uuid("worker_id"),
  assignedToRole: assignedToRoleEnum("assigned_to_role").notNull(),
  status: assignmentStatusEnum("status").notNull().default('NOT_STARTED'),
  institution: varchar("institution", { length: 255 }),
  submissionChannel: varchar("submission_channel", { length: 50 }),
  receiptNumber: varchar("receipt_number", { length: 100 }),
  courierAwb: varchar("courier_awb", { length: 100 }),
  courierName: varchar("courier_name", { length: 100 }),
  submittedAt: timestamp("submitted_at"),
  approvedAt: timestamp("approved_at"),
  rejectedReason: text("rejected_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Document File table
export const documentFiles = pgTable("document_files", {
  id: uuid("id").primaryKey().defaultRandom(),
  assignmentId: uuid("assignment_id").notNull(),
  kind: documentKindEnum("kind").notNull(),
  s3Key: varchar("s3_key", { length: 500 }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }),
  uploadedByUserId: varchar("uploaded_by_user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Reminder Rule table
export const reminderRules = pgTable("reminder_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  scope: reminderScopeEnum("scope").notNull(),
  frequency: varchar("frequency", { length: 100 }).notNull(), // CRON string or preset
  daysBeforeDue: integer("days_before_due"),
  active: boolean("active").notNull().default(true),
  createdByUserId: varchar("created_by_user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Reminder Log table
export const reminderLogs = pgTable("reminder_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull(),
  assignmentId: uuid("assignment_id"),
  email: varchar("email", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  sentAt: timestamp("sent_at").defaultNow(),
  status: varchar("status", { length: 50 }).notNull(),
});

// Audit Log table
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id"),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: varchar("entity_id", { length: 100 }).notNull(),
  ip: varchar("ip", { length: 45 }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Document Template System
export const documentTemplates = pgTable("document_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: templateTypeEnum("type").notNull(),
  language: languageEnum("language").notNull().default('ro'),
  isActive: boolean("is_active").default(true),
  templateData: jsonb("template_data").notNull(), // Visual editor structure
  createdByUserId: varchar("created_by_user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const templateFields = pgTable("template_fields", {
  id: uuid("id").primaryKey().defaultRandom(),
  templateId: uuid("template_id").notNull(),
  fieldKey: varchar("field_key", { length: 100 }).notNull(),
  fieldType: fieldTypeEnum("field_type").notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  required: boolean("required").default(false),
  placeholder: varchar("placeholder", { length: 255 }),
  options: jsonb("options"), // For dropdown options
  position: integer("position").notNull(),
  validation: jsonb("validation"), // Validation rules
  createdAt: timestamp("created_at").defaultNow(),
});

// Payment Management
export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientProfileId: uuid("client_profile_id").notNull(),
  workerId: uuid("worker_id"),
  amount: integer("amount").notNull(), // in cents
  currency: varchar("currency", { length: 3 }).default('RON'),
  description: text("description"),
  status: varchar("status", { length: 20 }).notNull().default('PENDING'),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// OCR Processing
export const ocrResults = pgTable("ocr_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentFileId: uuid("document_file_id").notNull(),
  extractedText: text("extracted_text"),
  extractedData: jsonb("extracted_data"), // Structured data
  confidence: integer("confidence"), // Confidence score 0-100
  processingStatus: varchar("processing_status", { length: 20 }).default('PENDING'),
  createdAt: timestamp("created_at").defaultNow(),
});

// Workflow Automation
export const workflowRules = pgTable("workflow_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  stageId: uuid("stage_id"),
  conditions: jsonb("conditions").notNull(), // Conditional rules
  actions: jsonb("actions").notNull(), // Actions to perform
  isActive: boolean("is_active").default(true),
  createdByUserId: varchar("created_by_user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Government API Integration
export const apiIntegrations = pgTable("api_integrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  endpoint: varchar("endpoint", { length: 500 }).notNull(),
  apiKey: varchar("api_key", { length: 500 }),
  isActive: boolean("is_active").default(true),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Multi-language Support
export const translations = pgTable("translations", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar("key", { length: 255 }).notNull(),
  language: languageEnum("language").notNull(),
  value: text("value").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Invitation system for workers
export const invitations = pgTable("invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull(),
  role: userRoleEnum("role").notNull().default('WORKER'),
  invitedByUserId: varchar("invited_by_user_id").notNull(),
  workerId: uuid("worker_id"), // Optional - links to existing worker record
  clientProfileId: uuid("client_profile_id"), // Optional - for worker invitations
  used: boolean("used").notNull().default(false),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Analytics
export const analyticsEvents = pgTable("analytics_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  userId: varchar("user_id"),
  clientProfileId: uuid("client_profile_id"),
  workerId: uuid("worker_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  invitedBy: one(users, {
    fields: [users.invitedById],
    references: [users.id],
  }),
  ownedClients: many(clientProfiles),
  createdRequirements: many(requirements),
  uploadedFiles: many(documentFiles),
  reminderRules: many(reminderRules),
}));

export const clientProfilesRelations = relations(clientProfiles, ({ one, many }) => ({
  owner: one(users, {
    fields: [clientProfiles.ownerUserId],
    references: [users.id],
  }),
  workers: many(workers),
  assignments: many(assignments),
}));

export const workersRelations = relations(workers, ({ one, many }) => ({
  clientProfile: one(clientProfiles, {
    fields: [workers.clientProfileId],
    references: [clientProfiles.id],
  }),
  assignments: many(assignments),
}));

export const stagesRelations = relations(stages, ({ many }) => ({
  requirements: many(requirements),
}));

export const requirementsRelations = relations(requirements, ({ one, many }) => ({
  stage: one(stages, {
    fields: [requirements.stageId],
    references: [stages.id],
  }),
  createdBy: one(users, {
    fields: [requirements.createdByUserId],
    references: [users.id],
  }),
  assignments: many(assignments),
}));

export const assignmentsRelations = relations(assignments, ({ one, many }) => ({
  requirement: one(requirements, {
    fields: [assignments.requirementId],
    references: [requirements.id],
  }),
  clientProfile: one(clientProfiles, {
    fields: [assignments.clientProfileId],
    references: [clientProfiles.id],
  }),
  worker: one(workers, {
    fields: [assignments.workerId],
    references: [workers.id],
  }),
  documentFiles: many(documentFiles),
  reminderLogs: many(reminderLogs),
}));

export const documentFilesRelations = relations(documentFiles, ({ one }) => ({
  assignment: one(assignments, {
    fields: [documentFiles.assignmentId],
    references: [assignments.id],
  }),
  uploadedBy: one(users, {
    fields: [documentFiles.uploadedByUserId],
    references: [users.id],
  }),
}));

export const reminderRulesRelations = relations(reminderRules, ({ one }) => ({
  createdBy: one(users, {
    fields: [reminderRules.createdByUserId],
    references: [users.id],
  }),
}));

export const reminderLogsRelations = relations(reminderLogs, ({ one }) => ({
  user: one(users, {
    fields: [reminderLogs.userId],
    references: [users.id],
  }),
  assignment: one(assignments, {
    fields: [reminderLogs.assignmentId],
    references: [assignments.id],
  }),
}));

export const documentTemplatesRelations = relations(documentTemplates, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [documentTemplates.createdByUserId],
    references: [users.id],
  }),
  fields: many(templateFields),
}));

export const templateFieldsRelations = relations(templateFields, ({ one }) => ({
  template: one(documentTemplates, {
    fields: [templateFields.templateId],
    references: [documentTemplates.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  clientProfile: one(clientProfiles, {
    fields: [payments.clientProfileId],
    references: [clientProfiles.id],
  }),
  worker: one(workers, {
    fields: [payments.workerId],
    references: [workers.id],
  }),
}));

export const ocrResultsRelations = relations(ocrResults, ({ one }) => ({
  documentFile: one(documentFiles, {
    fields: [ocrResults.documentFileId],
    references: [documentFiles.id],
  }),
}));

export const workflowRulesRelations = relations(workflowRules, ({ one }) => ({
  stage: one(stages, {
    fields: [workflowRules.stageId],
    references: [stages.id],
  }),
  createdBy: one(users, {
    fields: [workflowRules.createdByUserId],
    references: [users.id],
  }),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  invitedBy: one(users, {
    fields: [invitations.invitedByUserId],
    references: [users.id],
  }),
  worker: one(workers, {
    fields: [invitations.workerId],
    references: [workers.id],
  }),
  clientProfile: one(clientProfiles, {
    fields: [invitations.clientProfileId],
    references: [clientProfiles.id],
  }),
}));

// Insert schemas using createInsertSchema
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  role: true,
  invitedById: true,
});

export const insertClientProfileSchema = createInsertSchema(clientProfiles).pick({
  legalName: true,
  registrationNumber: true,
  cui: true,
  legalAddress: true,
  adminName: true,
  contactEmail: true,
  phoneNumber: true,
  bankIban: true,
  caen: true,
  ownerUserId: true,
});

export const insertWorkerSchema = createInsertSchema(workers).pick({
  clientProfileId: true,
  firstName: true,
  lastName: true,
  dob: true,
  nationality: true,
  passportNumber: true,
  passportExpiry: true,
  email: true,
  phone: true,
});

export const insertAssignmentSchema = createInsertSchema(assignments).pick({
  requirementId: true,
  clientProfileId: true,
  workerId: true,
  assignedToRole: true,
  status: true,
  institution: true,
  submissionChannel: true,
  receiptNumber: true,
  courierAwb: true,
  courierName: true,
});

export const insertRequirementSchema = createInsertSchema(requirements).pick({
  stageId: true,
  type: true,
  title: true,
  description: true,
  required: true,
  autoPopulate: true,
  templateKey: true,
  dueRule: true,
  createdByUserId: true,
});

export const insertDocumentTemplateSchema = createInsertSchema(documentTemplates).pick({
  name: true,
  description: true,
  type: true,
  language: true,
  isActive: true,
  templateData: true,
  createdByUserId: true,
});

export const insertTemplateFieldSchema = createInsertSchema(templateFields).pick({
  templateId: true,
  fieldKey: true,
  fieldType: true,
  label: true,
  required: true,
  placeholder: true,
  options: true,
  position: true,
  validation: true,
});

export const insertPaymentSchema = createInsertSchema(payments).pick({
  clientProfileId: true,
  workerId: true,
  amount: true,
  currency: true,
  description: true,
  status: true,
});

export const insertWorkflowRuleSchema = createInsertSchema(workflowRules).pick({
  name: true,
  stageId: true,
  conditions: true,
  actions: true,
  isActive: true,
  createdByUserId: true,
});

export const insertTranslationSchema = createInsertSchema(translations).pick({
  key: true,
  language: true,
  value: true,
});

export const insertInvitationSchema = createInsertSchema(invitations).pick({
  token: true,
  email: true,
  role: true,
  invitedByUserId: true,
  workerId: true,
  clientProfileId: true,
  expiresAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type ClientProfile = typeof clientProfiles.$inferSelect;
export type InsertClientProfile = z.infer<typeof insertClientProfileSchema>;
export type Worker = typeof workers.$inferSelect;
export type InsertWorker = z.infer<typeof insertWorkerSchema>;
export type Stage = typeof stages.$inferSelect;
export type Requirement = typeof requirements.$inferSelect;
export type InsertRequirement = z.infer<typeof insertRequirementSchema>;
export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type DocumentFile = typeof documentFiles.$inferSelect;
export type ReminderRule = typeof reminderRules.$inferSelect;
export type ReminderLog = typeof reminderLogs.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type DocumentTemplate = typeof documentTemplates.$inferSelect;
export type InsertDocumentTemplate = z.infer<typeof insertDocumentTemplateSchema>;
export type TemplateField = typeof templateFields.$inferSelect;
export type InsertTemplateField = z.infer<typeof insertTemplateFieldSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type OcrResult = typeof ocrResults.$inferSelect;
export type WorkflowRule = typeof workflowRules.$inferSelect;
export type InsertWorkflowRule = z.infer<typeof insertWorkflowRuleSchema>;
export type ApiIntegration = typeof apiIntegrations.$inferSelect;
export type Translation = typeof translations.$inferSelect;
export type InsertTranslation = z.infer<typeof insertTranslationSchema>;
export type Invitation = typeof invitations.$inferSelect;
export type InsertInvitation = z.infer<typeof insertInvitationSchema>;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;

// ========== CRUD API SCHEMAS ==========

// Client CRUD Schemas
export const createClientSchema = insertClientProfileSchema.omit({ 
  ownerUserId: true 
});
export const updateClientSchema = insertClientProfileSchema.partial().omit({
  id: true,
  ownerUserId: true,
  createdAt: true,
  updatedAt: true
});
export const clientResponseSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  company: z.string().nullable(),
  address: z.string().nullable(),
  nationality: z.string().nullable(),
  ownerUserId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Worker CRUD Schemas  
export const createWorkerSchema = insertWorkerSchema;
export const updateWorkerSchema = insertWorkerSchema.partial().omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export const workerResponseSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  dateOfBirth: z.date().nullable(),
  nationality: z.string().nullable(),
  passportNumber: z.string().nullable(),
  passportExpiry: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Stage CRUD Schemas
export const createStageSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  order: z.number().int().min(0),
  color: z.string().optional(),
  isActive: z.boolean().default(true),
});
export const updateStageSchema = createStageSchema.partial();
export const stageResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  order: z.number(),
  color: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Requirement CRUD Schemas
export const createRequirementSchema = insertRequirementSchema.omit({
  createdByUserId: true
});
export const updateRequirementSchema = insertRequirementSchema.partial().omit({
  id: true,
  createdByUserId: true,
  createdAt: true,
  updatedAt: true
});
export const requirementResponseSchema = z.object({
  id: z.string().uuid(),
  stageId: z.string().uuid(),
  type: z.enum(['document', 'form', 'payment', 'approval']),
  title: z.string(),
  description: z.string().nullable(),
  required: z.boolean(),
  autoPopulate: z.boolean(),
  templateKey: z.string().nullable(),
  dueRule: z.string().nullable(),
  createdByUserId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Generic API Response Schemas
export const successResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const errorResponseSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  errors: z.array(z.any()).optional(),
});

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export const paginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) => z.object({
  data: z.array(itemSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

// CRUD Types
export type CreateClient = z.infer<typeof createClientSchema>;
export type UpdateClient = z.infer<typeof updateClientSchema>;
export type ClientResponse = z.infer<typeof clientResponseSchema>;

export type CreateWorker = z.infer<typeof createWorkerSchema>;
export type UpdateWorker = z.infer<typeof updateWorkerSchema>;
export type WorkerResponse = z.infer<typeof workerResponseSchema>;

export type CreateStage = z.infer<typeof createStageSchema>;
export type UpdateStage = z.infer<typeof updateStageSchema>;
export type StageResponse = z.infer<typeof stageResponseSchema>;

export type CreateRequirement = z.infer<typeof createRequirementSchema>;
export type UpdateRequirement = z.infer<typeof updateRequirementSchema>;
export type RequirementResponse = z.infer<typeof requirementResponseSchema>;

export type SuccessResponse = z.infer<typeof successResponseSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
export type Pagination = z.infer<typeof paginationSchema>;
