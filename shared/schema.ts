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

// User table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").notNull().default('WORKER'),
  invitedById: varchar("invited_by_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Client Profile table
export const clientProfiles = pgTable("client_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  cui: varchar("cui", { length: 20 }).notNull().unique(),
  address: text("address").notNull(),
  caen: varchar("caen", { length: 10 }).notNull(),
  contactEmail: varchar("contact_email", { length: 255 }).notNull(),
  onrc: varchar("onrc", { length: 50 }),
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
  companyName: true,
  cui: true,
  address: true,
  caen: true,
  contactEmail: true,
  onrc: true,
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
