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
export const assignedToRoleEnum = pgEnum('assigned_to_role', ['ADMIN', 'OWNER', 'WORKER']);
export const documentKindEnum = pgEnum('document_kind', ['USER_UPLOAD', 'ADMIN_RECEIPT', 'GENERATED_PDF']);
export const reminderScopeEnum = pgEnum('reminder_scope', ['GLOBAL', 'CLIENT', 'STAGE']);
export const templateTypeEnum = pgEnum('template_type', ['FORM', 'DOCUMENT', 'CERTIFICATE']);
export const fieldTypeEnum = pgEnum('field_type', ['TEXT', 'DATE', 'NUMBER', 'CHECKBOX', 'DROPDOWN', 'SIGNATURE', 'PHOTO']);
export const languageEnum = pgEnum('language', ['en', 'ro', 'es', 'fr']);
export const workflowStepTypeEnum = pgEnum('workflow_step_type', ['DOCUMENT_COLLECTION', 'DOCUMENT_REVIEW', 'FORM_COMPLETION', 'ADMIN_APPROVAL', 'INSTITUTIONAL_SUBMISSION', 'PAYMENT']);
export const stepStatusEnum = pgEnum('step_status', ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'SKIPPED']);
export const workflowStatusEnum = pgEnum('workflow_status', ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'PAUSED', 'CANCELLED']);
export const checklistTypeEnum = pgEnum('checklist_type', ['VERIFICATION', 'APPROVAL', 'QUALITY_CHECK', 'COMPLIANCE']);
export const documentStatusEnum = pgEnum('document_status', ['PENDING', 'VERIFIED', 'REJECTED', 'REQUIRES_CHANGES']);

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

// Worker table (referred to as employees in frontend)
export const workers = pgTable("workers", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientProfileId: uuid("client_profile_id").notNull(),
  
  // Personal Information
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  middleName: varchar("middle_name", { length: 100 }),
  dob: timestamp("dob"),
  placeOfBirth: varchar("place_of_birth", { length: 255 }),
  countryOfBirth: varchar("country_of_birth", { length: 100 }),
  nationality: varchar("nationality", { length: 50 }).notNull(),
  gender: varchar("gender", { length: 10 }), // M/F/Other
  maritalStatus: varchar("marital_status", { length: 20 }), // Single/Married/Divorced/Widowed
  
  // Contact Information
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  emergencyContact: varchar("emergency_contact", { length: 255 }),
  emergencyPhone: varchar("emergency_phone", { length: 20 }),
  
  // Address Information
  homeAddress: text("home_address"),
  homeCity: varchar("home_city", { length: 100 }),
  homeCountry: varchar("home_country", { length: 100 }),
  homePostalCode: varchar("home_postal_code", { length: 20 }),
  romanianAddress: text("romanian_address"),
  romanianCity: varchar("romanian_city", { length: 100 }),
  romanianCounty: varchar("romanian_county", { length: 100 }),
  romanianPostalCode: varchar("romanian_postal_code", { length: 20 }),
  
  // Passport & Travel Documents
  passportNumber: varchar("passport_number", { length: 50 }).notNull(),
  passportIssueDate: timestamp("passport_issue_date"),
  passportExpiry: timestamp("passport_expiry"),
  passportIssuingAuthority: varchar("passport_issuing_authority", { length: 255 }),
  passportPlaceOfIssue: varchar("passport_place_of_issue", { length: 255 }),
  
  // Education & Professional Qualifications
  educationLevel: varchar("education_level", { length: 100 }),
  universityName: varchar("university_name", { length: 255 }),
  degreeField: varchar("degree_field", { length: 255 }),
  graduationYear: integer("graduation_year"),
  professionalCertifications: text("professional_certifications"),
  languageSkills: jsonb("language_skills"), // JSON array of {language, level}
  
  // Work Experience & Employment
  jobTitle: varchar("job_title", { length: 255 }),
  workExperience: text("work_experience"),
  previousEmployers: jsonb("previous_employers"), // JSON array of employer details
  monthlyGrossSalary: integer("monthly_gross_salary"), // in RON cents
  workLocation: varchar("work_location", { length: 255 }),
  workSchedule: varchar("work_schedule", { length: 100 }),
  contractType: varchar("contract_type", { length: 50 }), // Individual/Determinat/etc
  contractStartDate: timestamp("contract_start_date"),
  contractEndDate: timestamp("contract_end_date"),
  
  // Immigration Status & History
  previousRomanianVisa: boolean("previous_romanian_visa").default(false),
  previousVisaDetails: text("previous_visa_details"),
  previousRejections: boolean("previous_rejections").default(false),
  rejectionDetails: text("rejection_details"),
  criminalRecord: boolean("criminal_record").default(false),
  criminalRecordDetails: text("criminal_record_details"),
  
  // Health & Insurance
  healthInsurance: varchar("health_insurance", { length: 255 }),
  medicalConditions: text("medical_conditions"),
  vaccinationRecord: jsonb("vaccination_record"),
  
  // Family Information
  spouseName: varchar("spouse_name", { length: 255 }),
  spouseNationality: varchar("spouse_nationality", { length: 100 }),
  children: jsonb("children"), // JSON array of children details
  familyInRomania: boolean("family_in_romania").default(false),
  familyInRomaniaDetails: text("family_in_romania_details"),
  
  // Financial Information
  bankAccountDetails: text("bank_account_details"),
  financialSupport: text("financial_support"),
  proofOfFunds: varchar("proof_of_funds", { length: 255 }),
  
  // Legal & Administrative
  personalNumericalCode: varchar("personal_numerical_code", { length: 20 }), // CNP if applicable
  taxIdentificationNumber: varchar("tax_identification_number", { length: 50 }),
  socialSecurityNumber: varchar("social_security_number", { length: 50 }),
  
  // Document Status Tracking
  documentStatus: varchar("document_status", { length: 50 }).default('INCOMPLETE'),
  missingDocuments: jsonb("missing_documents"), // Array of missing document types
  
  // System Fields
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
  assignmentId: uuid("assignment_id"), // Made nullable for workflow step support
  workflowStepProgressId: uuid("workflow_step_progress_id"), // New: for workflow step documents
  kind: documentKindEnum("kind").notNull(),
  s3Key: varchar("s3_key", { length: 500 }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }),
  fileSize: integer("file_size"), // File size in bytes
  fileHash: varchar("file_hash", { length: 64 }), // SHA256 hash
  status: documentStatusEnum("status").default('PENDING'),
  scanResult: varchar("scan_result", { length: 20 }), // 'CLEAN', 'INFECTED', 'SCAN_FAILED', 'PENDING'
  virusName: varchar("virus_name", { length: 255 }), // Name of virus if infected
  scannedAt: timestamp("scanned_at"), // When file was scanned
  uploadedByUserId: varchar("uploaded_by_user_id").notNull(),
  notes: text("notes"), // Verification notes
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

// Workflow Templates - Enhanced workflow configurations
export const workflowTemplates = pgTable("workflow_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  order: integer("order").notNull(),
  executionType: varchar("execution_type", { length: 20 }).notNull().default('sequential'), // 'sequential' or 'parallel'
  estimatedDurationDays: integer("estimated_duration_days"),
  createdByUserId: varchar("created_by_user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Workflow Steps - Detailed breakdown of each workflow stage
export const workflowSteps = pgTable("workflow_steps", {
  id: uuid("id").primaryKey().defaultRandom(),
  workflowTemplateId: uuid("workflow_template_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  stepType: workflowStepTypeEnum("step_type").notNull(),
  assignedRole: assignedToRoleEnum("assigned_role").notNull(),
  order: integer("order").notNull(),
  estimatedDays: integer("estimated_days").default(1),
  isRequired: boolean("is_required").default(true),
  requiresApproval: boolean("requires_approval").default(false),
  approverRole: varchar("approver_role", { length: 50 }), // Who can approve this step
  dependencies: text("dependencies").array(), // Step IDs that must be completed first
  createdAt: timestamp("created_at").defaultNow(),
});

// Document Requirements - Specific documents needed for each step
export const documentRequirements = pgTable("document_requirements", {
  id: uuid("id").primaryKey().defaultRandom(),
  workflowStepId: uuid("workflow_step_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  isRequired: boolean("is_required").default(true),
  submittedBy: assignedToRoleEnum("submitted_by").notNull().default('OWNER'), // Who submits this document
  acceptedFileTypes: text("accepted_file_types").array(), // ['pdf', 'jpg', 'png']
  maxFileSize: integer("max_file_size"), // in MB
  templateKey: varchar("template_key", { length: 100 }), // Reference to auto-generated template
  hasOcrExtraction: boolean("has_ocr_extraction").default(false),
  validationRules: jsonb("validation_rules"), // Custom validation logic
  requiredByDays: integer("required_by_days"), // Number of days by when this document is required
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Checklist Items - Verification tasks for admins/reviewers
export const checklistItems = pgTable("checklist_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  workflowStepId: uuid("workflow_step_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  checklistType: checklistTypeEnum("checklist_type").default('VERIFICATION'),
  isRequired: boolean("is_required").default(true),
  assignedRole: assignedToRoleEnum("assigned_role").notNull(), // Who performs this check
  requiredByDays: integer("required_by_days"), // Number of days by when this checklist item is required
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Worker Workflow Progress - Track individual worker progress through workflows
export const workerWorkflowProgress = pgTable("worker_workflow_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  workerId: uuid("worker_id").notNull(),
  workflowTemplateId: uuid("workflow_template_id").notNull(),
  currentStepId: uuid("current_step_id"),
  status: workflowStatusEnum("status").default('NOT_STARTED'),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Worker Step Progress - Track progress on individual steps
export const workerStepProgress = pgTable("worker_step_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  workerWorkflowProgressId: uuid("worker_workflow_progress_id").notNull(),
  workflowStepId: uuid("workflow_step_id").notNull(),
  status: stepStatusEnum("status").default('PENDING'),
  assignedToUserId: varchar("assigned_to_user_id"), // Specific user assigned to this step
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Workflow Step Document Requirements - Define what documents are needed for each step
export const workflowStepDocumentRequirements = pgTable("workflow_step_document_requirements", {
  id: uuid("id").primaryKey().defaultRandom(),
  workflowStepId: uuid("workflow_step_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  isRequired: boolean("is_required").default(true),
  submittedBy: assignedToRoleEnum("submitted_by").notNull(),
  acceptedFileTypes: text("accepted_file_types").array(),
  maxFileSize: integer("max_file_size"), // Size in bytes
  createdAt: timestamp("created_at").defaultNow(),
});

// Document Submissions - Track document uploads for each requirement
export const documentSubmissions = pgTable("document_submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  workerStepProgressId: uuid("worker_step_progress_id").notNull(),
  documentRequirementId: uuid("document_requirement_id").notNull(),
  documentFileId: uuid("document_file_id"),
  status: stepStatusEnum("status").default('PENDING'),
  submittedAt: timestamp("submitted_at"),
  reviewedAt: timestamp("reviewed_at"),
  reviewedByUserId: varchar("reviewed_by_user_id"),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Checklist Completions - Track completion of admin checklist items
export const checklistCompletions = pgTable("checklist_completions", {
  id: uuid("id").primaryKey().defaultRandom(),
  workerStepProgressId: uuid("worker_step_progress_id").notNull(),
  checklistItemId: uuid("checklist_item_id").notNull(),
  isCompleted: boolean("is_completed").default(false),
  completedByUserId: varchar("completed_by_user_id"),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
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
  workflowStepProgress: one(workerStepProgress, {
    fields: [documentFiles.workflowStepProgressId],
    references: [workerStepProgress.id],
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

// New workflow template relations
export const workflowTemplatesRelations = relations(workflowTemplates, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [workflowTemplates.createdByUserId],
    references: [users.id],
  }),
  steps: many(workflowSteps),
  workerProgresses: many(workerWorkflowProgress),
}));

export const workflowStepsRelations = relations(workflowSteps, ({ one, many }) => ({
  workflowTemplate: one(workflowTemplates, {
    fields: [workflowSteps.workflowTemplateId],
    references: [workflowTemplates.id],
  }),
  documentRequirements: many(documentRequirements),
  checklistItems: many(checklistItems),
  workerStepProgresses: many(workerStepProgress),
}));

export const documentRequirementsRelations = relations(documentRequirements, ({ one, many }) => ({
  workflowStep: one(workflowSteps, {
    fields: [documentRequirements.workflowStepId],
    references: [workflowSteps.id],
  }),
  documentSubmissions: many(documentSubmissions),
}));

export const checklistItemsRelations = relations(checklistItems, ({ one, many }) => ({
  workflowStep: one(workflowSteps, {
    fields: [checklistItems.workflowStepId],
    references: [workflowSteps.id],
  }),
  checklistCompletions: many(checklistCompletions),
}));

export const workerWorkflowProgressRelations = relations(workerWorkflowProgress, ({ one, many }) => ({
  worker: one(workers, {
    fields: [workerWorkflowProgress.workerId],
    references: [workers.id],
  }),
  workflowTemplate: one(workflowTemplates, {
    fields: [workerWorkflowProgress.workflowTemplateId],
    references: [workflowTemplates.id],
  }),
  currentStep: one(workflowSteps, {
    fields: [workerWorkflowProgress.currentStepId],
    references: [workflowSteps.id],
  }),
  stepProgresses: many(workerStepProgress),
}));

export const workerStepProgressRelations = relations(workerStepProgress, ({ one, many }) => ({
  workerWorkflowProgress: one(workerWorkflowProgress, {
    fields: [workerStepProgress.workerWorkflowProgressId],
    references: [workerWorkflowProgress.id],
  }),
  workflowStep: one(workflowSteps, {
    fields: [workerStepProgress.workflowStepId],
    references: [workflowSteps.id],
  }),
  assignedToUser: one(users, {
    fields: [workerStepProgress.assignedToUserId],
    references: [users.id],
  }),
  documentSubmissions: many(documentSubmissions),
  checklistCompletions: many(checklistCompletions),
  documentFiles: many(documentFiles),
}));

export const documentSubmissionsRelations = relations(documentSubmissions, ({ one }) => ({
  workerStepProgress: one(workerStepProgress, {
    fields: [documentSubmissions.workerStepProgressId],
    references: [workerStepProgress.id],
  }),
  documentRequirement: one(documentRequirements, {
    fields: [documentSubmissions.documentRequirementId],
    references: [documentRequirements.id],
  }),
  documentFile: one(documentFiles, {
    fields: [documentSubmissions.documentFileId],
    references: [documentFiles.id],
  }),
  reviewedBy: one(users, {
    fields: [documentSubmissions.reviewedByUserId],
    references: [users.id],
  }),
}));

export const checklistCompletionsRelations = relations(checklistCompletions, ({ one }) => ({
  workerStepProgress: one(workerStepProgress, {
    fields: [checklistCompletions.workerStepProgressId],
    references: [workerStepProgress.id],
  }),
  checklistItem: one(checklistItems, {
    fields: [checklistCompletions.checklistItemId],
    references: [checklistItems.id],
  }),
  completedBy: one(users, {
    fields: [checklistCompletions.completedByUserId],
    references: [users.id],
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
  middleName: true,
  dob: true,
  placeOfBirth: true,
  countryOfBirth: true,
  nationality: true,
  gender: true,
  maritalStatus: true,
  email: true,
  phone: true,
  emergencyContact: true,
  emergencyPhone: true,
  homeAddress: true,
  homeCity: true,
  homeCountry: true,
  homePostalCode: true,
  romanianAddress: true,
  romanianCity: true,
  romanianCounty: true,
  romanianPostalCode: true,
  passportNumber: true,
  passportIssueDate: true,
  passportExpiry: true,
  passportIssuingAuthority: true,
  passportPlaceOfIssue: true,
  educationLevel: true,
  universityName: true,
  degreeField: true,
  graduationYear: true,
  professionalCertifications: true,
  languageSkills: true,
  jobTitle: true,
  workExperience: true,
  previousEmployers: true,
  monthlyGrossSalary: true,
  workLocation: true,
  workSchedule: true,
  contractType: true,
  contractStartDate: true,
  contractEndDate: true,
  previousRomanianVisa: true,
  previousVisaDetails: true,
  previousRejections: true,
  rejectionDetails: true,
  criminalRecord: true,
  criminalRecordDetails: true,
  healthInsurance: true,
  medicalConditions: true,
  vaccinationRecord: true,
  spouseName: true,
  spouseNationality: true,
  children: true,
  familyInRomania: true,
  familyInRomaniaDetails: true,
  bankAccountDetails: true,
  financialSupport: true,
  proofOfFunds: true,
  personalNumericalCode: true,
  taxIdentificationNumber: true,
  socialSecurityNumber: true,
  documentStatus: true,
  missingDocuments: true,
  notes: true,
});

export const insertAssignmentSchema = createInsertSchema(assignments).pick({
  requirementId: true,
  clientProfileId: true,
  employeeId: true,
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
  employeeId: true,
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
  employeeId: true,
  clientProfileId: true,
  expiresAt: true,
});

// New workflow template schemas
export const insertWorkflowTemplateSchema = createInsertSchema(workflowTemplates).pick({
  name: true,
  description: true,
  isActive: true,
  order: true,
  executionType: true,
  estimatedDurationDays: true,
  createdByUserId: true,
});

export const insertWorkflowStepSchema = createInsertSchema(workflowSteps).pick({
  workflowTemplateId: true,
  name: true,
  description: true,
  stepType: true,
  assignedRole: true,
  order: true,
  estimatedDays: true,
  isRequired: true,
  requiresApproval: true,
  approverRole: true,
  dependencies: true,
});

export const insertDocumentRequirementSchema = createInsertSchema(documentRequirements).pick({
  workflowStepId: true,
  title: true,
  description: true,
  isRequired: true,
  submittedBy: true,
  acceptedFileTypes: true,
  maxFileSize: true,
  templateKey: true,
  hasOcrExtraction: true,
  validationRules: true,
  order: true,
  requiredByDays: true,
});

export const insertChecklistItemSchema = createInsertSchema(checklistItems).pick({
  workflowStepId: true,
  title: true,
  description: true,
  isRequired: true,
  assignedRole: true,
  checklistType: true,
  order: true,
  requiredByDays: true,
});

export const insertWorkerWorkflowProgressSchema = createInsertSchema(workerWorkflowProgress).pick({
  employeeId: true,
  workflowTemplateId: true,
  currentStepId: true,
  status: true,
  startedAt: true,
  completedAt: true,
});

export const insertWorkerStepProgressSchema = createInsertSchema(workerStepProgress).pick({
  workerWorkflowProgressId: true,
  workflowStepId: true,
  status: true,
  assignedToUserId: true,
  startedAt: true,
  completedAt: true,
  rejectedAt: true,
  rejectionReason: true,
  notes: true,
});

export const insertDocumentSubmissionSchema = createInsertSchema(documentSubmissions).pick({
  workerStepProgressId: true,
  documentRequirementId: true,
  documentFileId: true,
  status: true,
  submittedAt: true,
  reviewedAt: true,
  reviewedByUserId: true,
  reviewNotes: true,
});

export const insertChecklistCompletionSchema = createInsertSchema(checklistCompletions).pick({
  workerStepProgressId: true,
  checklistItemId: true,
  isCompleted: true,
  completedByUserId: true,
  completedAt: true,
  notes: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type ClientProfile = typeof clientProfiles.$inferSelect;
export type InsertClientProfile = z.infer<typeof insertClientProfileSchema>;
export type Worker = typeof workers.$inferSelect;
export type InsertWorker = z.infer<typeof insertWorkerSchema>;

// Employee aliases for frontend consistency (refers to workers table)
export type Employee = Worker;
export type InsertEmployee = InsertWorker;
export type EmployeeWorkflowProgress = WorkerWorkflowProgress; 
export type InsertEmployeeWorkflowProgress = InsertWorkerWorkflowProgress;
export type EmployeeStepProgress = WorkerStepProgress;
export type InsertEmployeeStepProgress = InsertWorkerStepProgress;

// Table alias for consistency
export const employees = workers;
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

// New workflow template types
export type WorkflowTemplate = typeof workflowTemplates.$inferSelect;
export type InsertWorkflowTemplate = z.infer<typeof insertWorkflowTemplateSchema>;
export type WorkflowStep = typeof workflowSteps.$inferSelect;
export type InsertWorkflowStep = z.infer<typeof insertWorkflowStepSchema>;
export type DocumentRequirement = typeof documentRequirements.$inferSelect;
export type InsertDocumentRequirement = z.infer<typeof insertDocumentRequirementSchema>;
export type ChecklistItem = typeof checklistItems.$inferSelect;
export type InsertChecklistItem = z.infer<typeof insertChecklistItemSchema>;
export type WorkerWorkflowProgress = typeof workerWorkflowProgress.$inferSelect;
export type InsertWorkerWorkflowProgress = z.infer<typeof insertWorkerWorkflowProgressSchema>;
export type WorkerStepProgress = typeof workerStepProgress.$inferSelect;
export type InsertWorkerStepProgress = z.infer<typeof insertWorkerStepProgressSchema>;
export type DocumentSubmission = typeof documentSubmissions.$inferSelect;
export type InsertDocumentSubmission = z.infer<typeof insertDocumentSubmissionSchema>;
export type ChecklistCompletion = typeof checklistCompletions.$inferSelect;
export type InsertChecklistCompletion = z.infer<typeof insertChecklistCompletionSchema>;

// ========== CRUD API SCHEMAS ==========

// Client CRUD Schemas
export const createClientSchema = insertClientProfileSchema.omit({ 
  ownerUserId: true 
});
export const updateClientSchema = insertClientProfileSchema.partial();
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
export const updateWorkerSchema = insertWorkerSchema.partial();
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
export const updateRequirementSchema = insertRequirementSchema.partial();
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

// Document Data Extraction Tables
export const documentTypeEnum = pgEnum('document_type', [
  // Personal Identity Documents
  'BIRTH_CERTIFICATE', 
  'MARRIAGE_CERTIFICATE', 
  'PASSPORT', 
  'ID_CARD', 
  'DIPLOMA', 
  'EMPLOYMENT_CONTRACT', 
  'BANK_STATEMENT',
  
  // Romanian Immigration Workflow Forms
  'WORK_CONTRACT_TEMPLATE',
  'POWER_OF_ATTORNEY_TEMPLATE', 
  'JOB_DESCRIPTION_TEMPLATE',
  'VISA_APPLICATION_FORM',
  'RESIDENCE_APPLICATION_TEMPLATE',
  'AJOFM_WORK_PERMIT_APPLICATION',
  'IGI_WORK_PERMIT_APPLICATION',
  'CONSULATE_VISA_FORM',
  'IGI_RESIDENCE_PERMIT_FORM',
  'MEDICAL_CERTIFICATE',
  'CRIMINAL_RECORD_CERTIFICATE',
  'APOSTILLE_DOCUMENT',
  'TRANSLATION_CERTIFICATE',
  'HOUSING_CONTRACT',
  'COMPANY_REGISTRATION_CERTIFICATE',
  'TAX_CERTIFICATE',
  'SALARY_CERTIFICATE',
  'INSURANCE_CERTIFICATE',
  
  'OTHER'
]);

export const extractedDocumentData = pgTable("extracted_document_data", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentFileId: uuid("document_file_id").notNull(),
  documentType: documentTypeEnum("document_type").notNull(),
  extractedText: text("extracted_text"), // Raw OCR text
  structuredData: jsonb("structured_data"), // Parsed structured data
  confidence: integer("confidence"), // OCR confidence percentage
  extractedAt: timestamp("extracted_at").defaultNow(),
  verifiedAt: timestamp("verified_at"),
  verifiedByUserId: varchar("verified_by_user_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const documentFieldMappings = pgTable("document_field_mappings", {
  id: uuid("id").primaryKey().defaultRandom(),
  extractedDataId: uuid("extracted_data_id").notNull(),
  fieldName: varchar("field_name", { length: 100 }).notNull(), // e.g., "firstName", "birthDate"
  fieldValue: text("field_value"), // Extracted field value
  confidence: integer("confidence"), // Field-specific confidence
  position: jsonb("position"), // Location in document where field was found
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations for extracted data
export const extractedDocumentDataRelations = relations(extractedDocumentData, ({ one, many }) => ({
  documentFile: one(documentFiles, {
    fields: [extractedDocumentData.documentFileId],
    references: [documentFiles.id],
  }),
  fieldMappings: many(documentFieldMappings),
  verifiedBy: one(users, {
    fields: [extractedDocumentData.verifiedByUserId],
    references: [users.id],
  }),
}));

export const documentFieldMappingsRelations = relations(documentFieldMappings, ({ one }) => ({
  extractedData: one(extractedDocumentData, {
    fields: [documentFieldMappings.extractedDataId],
    references: [extractedDocumentData.id],
  }),
}));

// Relations for workflow step document requirements
export const workflowStepDocumentRequirementsRelations = relations(workflowStepDocumentRequirements, ({ one }) => ({
  workflowStep: one(workflowSteps, {
    fields: [workflowStepDocumentRequirements.workflowStepId],
    references: [workflowSteps.id],
  }),
}));


// Zod schemas for workflow step document requirements
export const createWorkflowStepDocumentRequirementSchema = createInsertSchema(workflowStepDocumentRequirements).omit({
  id: true,
  createdAt: true,
});

export const updateWorkflowStepDocumentRequirementSchema = createWorkflowStepDocumentRequirementSchema.partial();

// Zod schemas for extracted data
export const createExtractedDocumentDataSchema = createInsertSchema(extractedDocumentData).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const createDocumentFieldMappingSchema = createInsertSchema(documentFieldMappings).omit({
  id: true,
  createdAt: true,
});

export const updateExtractedDocumentDataSchema = createExtractedDocumentDataSchema.partial();

// Types
export type WorkflowStepDocumentRequirement = typeof workflowStepDocumentRequirements.$inferSelect;
export type InsertWorkflowStepDocumentRequirement = z.infer<typeof createWorkflowStepDocumentRequirementSchema>;
export type ExtractedDocumentData = typeof extractedDocumentData.$inferSelect;
export type InsertExtractedDocumentData = z.infer<typeof createExtractedDocumentDataSchema>;
export type DocumentFieldMapping = typeof documentFieldMappings.$inferSelect;
export type InsertDocumentFieldMapping = z.infer<typeof createDocumentFieldMappingSchema>;

export type SuccessResponse = z.infer<typeof successResponseSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
export type Pagination = z.infer<typeof paginationSchema>;
