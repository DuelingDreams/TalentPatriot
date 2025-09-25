import { pgTable, text, uuid, timestamp, varchar, pgEnum, uniqueIndex, boolean, integer, index, pgView, jsonb, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { sql } from "drizzle-orm";

// Enums
export const jobStatusEnum = pgEnum('job_status', ['draft', 'open', 'closed', 'on_hold', 'filled']);
export const jobTypeEnum = pgEnum('job_type', ['full-time', 'part-time', 'contract', 'freelance', 'internship']);
export const candidateStageEnum = pgEnum('candidate_stage', ['applied', 'phone_screen', 'interview', 'technical', 'final', 'offer', 'hired', 'rejected']);
export const recordStatusEnum = pgEnum('record_status', ['active', 'inactive', 'demo']);
// Platform-level roles (minimal)
export const userRoleEnum = pgEnum('user_role', ['hiring_manager', 'recruiter', 'admin', 'interviewer', 'demo_viewer', 'platform_admin', 'user']);

// Organization-level roles (business functionality)
export const orgRoleEnum = pgEnum('org_role', ['owner', 'admin', 'hiring_manager', 'recruiter', 'interviewer', 'viewer']);
export const interviewTypeEnum = pgEnum('interview_type', ['phone', 'video', 'in_person', 'technical']);
export const interviewStatusEnum = pgEnum('interview_status', ['scheduled', 'completed', 'cancelled', 'no_show']);
export const messageTypeEnum = pgEnum('message_type', ['general', 'interview', 'application', 'team', 'internal', 'client', 'candidate', 'system']);
export const messagePriorityEnum = pgEnum('message_priority', ['low', 'normal', 'high', 'urgent']);
export const experienceLevelEnum = pgEnum('experience_level', ['entry', 'mid', 'senior', 'executive']);
export const remoteOptionEnum = pgEnum('remote_option', ['onsite', 'remote', 'hybrid']);
export const importStatusEnum = pgEnum('import_status', ['pending', 'processing', 'completed', 'failed', 'cancelled']);
export const importTypeEnum = pgEnum('import_type', ['candidates', 'jobs', 'both']);

// Tables
export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  ownerId: uuid("owner_id").notNull(), // references users.id from Supabase auth
  slug: text("slug"),
  seatsPurchased: integer("seats_purchased").default(0).notNull(), // Billing: how many recruiter seats are paid for
  planTier: varchar("plan_tier", { length: 50 }).default('starter'), // starter, professional, enterprise
}, (table) => ({
  uniqueSlug: uniqueIndex("unique_org_slug").on(table.slug),
}));

export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").primaryKey(), // references auth.users(id) 
  role: userRoleEnum("role").default('user').notNull(), // Platform-level role only
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  jobTitle: varchar("job_title", { length: 255 }),
  department: varchar("department", { length: 255 }),
  location: varchar("location", { length: 255 }),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userSettings = pgTable("user_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(), // references auth.users(id)
  emailNotifications: boolean("email_notifications").default(true),
  browserNotifications: boolean("browser_notifications").default(true),
  weeklyReports: boolean("weekly_reports").default(false),
  teamInvites: boolean("team_invites").default(true),
  publicProfile: boolean("public_profile").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUserSettings: uniqueIndex("unique_user_settings").on(table.userId),
}));

export const userOrganizations = pgTable("user_organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(), // references auth.users(id)
  orgId: uuid("org_id").references(() => organizations.id).notNull(),
  role: orgRoleEnum("role").notNull(),
  isRecruiterSeat: boolean("is_recruiter_seat").default(false).notNull(), // This drives pricing!
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUserOrg: uniqueIndex("unique_user_org").on(table.userId, table.orgId),
}));

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  industry: varchar("industry", { length: 100 }),
  location: varchar("location", { length: 255 }),
  website: varchar("website", { length: 255 }),
  contactName: varchar("contact_name", { length: 255 }),
  contactEmail: varchar("contact_email", { length: 255 }),
  notes: text("notes"),
  status: recordStatusEnum("status").default('active').notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
});

export const jobs = pgTable("jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  location: varchar("location", { length: 255 }),
  jobType: jobTypeEnum("job_type").default('full-time').notNull(),
  department: varchar("department", { length: 100 }),
  salaryRange: varchar("salary_range", { length: 100 }),
  experienceLevel: experienceLevelEnum("experience_level").default('mid'),
  remoteOption: remoteOptionEnum("remote_option").default('onsite'),
  clientId: uuid("client_id").references(() => clients.id),
  status: jobStatusEnum("status").default('draft').notNull(),
  recordStatus: recordStatusEnum("record_status").default('active').notNull(),
  public_slug: varchar("public_slug", { length: 255 }),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
  assignedTo: uuid("assigned_to"),
}, (table) => ({
  uniquePublicSlug: uniqueIndex("unique_public_slug").on(table.public_slug),
}));

export const candidates = pgTable("candidates", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  resumeUrl: text("resume_url"),
  status: recordStatusEnum("status").default('active').notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
  // Resume parsing fields
  resumeParsed: boolean("resume_parsed").default(false),
  skills: text("skills").array(), // JSON array of skills
  experienceLevel: experienceLevelEnum("experience_level"),
  totalYearsExperience: integer("total_years_experience").default(0),
  education: text("education"), // JSON string of education data
  summary: text("summary"),
  searchableContent: text("searchable_content"), // For full-text search
});

// Pipeline columns for Kanban board (job-specific with backward compatibility)
export const pipelineColumns = pgTable("pipeline_columns", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id).notNull(),
  jobId: uuid("job_id").references(() => jobs.id), // Nullable for backward compatibility
  title: text("title").notNull(),
  position: integer("position").notNull(), // 0, 1, 2, etc. for sort order
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Index for performance - job-specific queries
  jobPositionIdx: index("idx_pipeline_cols_job_pos").on(table.jobId, table.position),
  // Index for org-wide queries (legacy)
  orgPositionIdx: index("idx_pipeline_cols_org_pos").on(table.orgId, table.position),
}));

// Main job-candidate relationships table (replaces old applications table)
export const jobCandidate = pgTable("job_candidate", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id).notNull(),
  jobId: uuid("job_id").references(() => jobs.id).notNull(),
  candidateId: uuid("candidate_id").references(() => candidates.id).notNull(),
  pipelineColumnId: uuid("pipeline_column_id").references(() => pipelineColumns.id),
  stage: candidateStageEnum("stage").default('applied').notNull(),
  notes: text("notes"),
  assignedTo: uuid("assigned_to"),
  status: recordStatusEnum("status").default('active').notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueJobCandidate: uniqueIndex("unique_job_candidate").on(table.jobId, table.candidateId),
}));

export const candidateNotes = pgTable("candidate_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id).notNull(),
  jobCandidateId: uuid("job_candidate_id").references(() => jobCandidate.id).notNull(),
  authorId: uuid("author_id").notNull(),
  content: text("content").notNull(),
  isPrivate: boolean("is_private").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const interviews = pgTable("interviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id).notNull(),
  jobCandidateId: uuid("job_candidate_id").references(() => jobCandidate.id).notNull(),
  title: text("title").notNull(),
  type: interviewTypeEnum("type").notNull(),
  status: interviewStatusEnum("status").default('scheduled').notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  duration: text("duration").default('60'), // Duration in minutes as text for now
  location: text("location"), // Meeting room, video link, etc.
  interviewerId: uuid("interviewer_id"), // References auth.users
  notes: text("notes"),
  feedback: text("feedback"), // Post-interview feedback
  rating: text("rating"), // 1-10 rating scale as text for now
  recordStatus: recordStatusEnum("record_status").default('active'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id).notNull(),
  type: messageTypeEnum("type").notNull(),
  priority: messagePriorityEnum("priority").default('normal').notNull(),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  senderId: uuid("sender_id").notNull(), // References auth.users
  recipientId: uuid("recipient_id"), // References auth.users (null for broadcasts)
  
  // Context references
  clientId: uuid("client_id").references(() => clients.id),
  jobId: uuid("job_id").references(() => jobs.id),
  candidateId: uuid("candidate_id").references(() => candidates.id),
  jobCandidateId: uuid("job_candidate_id").references(() => jobCandidate.id),
  
  isRead: boolean("is_read").default(false).notNull(),
  readAt: timestamp("read_at"),
  isArchived: boolean("is_archived").default(false).notNull(),
  
  // Thread support
  threadId: uuid("thread_id"), // References parent message
  replyToId: uuid("reply_to_id"), // References message being replied to
  
  // Metadata
  attachments: text("attachments").array(), // JSON array of file URLs
  tags: text("tags").array(), // Array of tags for categorization
  
  recordStatus: recordStatusEnum("record_status").default('active'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messageRecipients = pgTable("message_recipients", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id).notNull(),
  messageId: uuid("message_id").references(() => messages.id).notNull(),
  recipientId: uuid("recipient_id").notNull(), // References auth.users
  isRead: boolean("is_read").default(false).notNull(),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Beta Applications (for beta access control workflow)
export const betaApplications = pgTable("beta_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyName: text("company_name").notNull(),
  contactName: text("contact_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  website: text("website"),
  companySize: text("company_size").notNull(),
  currentAts: text("current_ats"),
  painPoints: text("pain_points").notNull(),
  expectations: text("expectations"),
  status: text("status").default('pending'),
  userId: uuid("user_id"),
  orgId: uuid("org_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
  processedBy: uuid("processed_by"),
  notes: text("notes"),
});

// Applications (legacy table - parallel to job_candidate)
export const applications = pgTable("applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobId: uuid("job_id").references(() => jobs.id),
  candidateId: uuid("candidate_id").references(() => candidates.id),
  status: recordStatusEnum("status"),
  appliedAt: timestamp("applied_at"),
  columnId: uuid("column_id").references(() => pipelineColumns.id),
});

// Application Metadata (extended application data)
export const applicationMetadata = pgTable("application_metadata", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id).notNull(),
  candidateId: uuid("candidate_id").references(() => candidates.id).notNull(),
  jobId: uuid("job_id").references(() => jobs.id).notNull(),
  educationDetails: text("education_details"),
  employmentDetails: text("employment_details"),
  applicationSource: varchar("application_source", { length: 50 }),
  submissionTimestamp: timestamp("submission_timestamp"),
  formVersion: varchar("form_version", { length: 10 }),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

// Apply Events (application event tracking)
export const applyEvents = pgTable("apply_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobId: uuid("job_id").notNull(),
  applicantEmail: text("applicant_email").notNull(),
  requesterIp: varchar("requester_ip"), // Using varchar for inet compatibility
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// AI Insights Cache
export const aiInsightsCache = pgTable("ai_insights_cache", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id).notNull(),
  insightsData: jsonb("insights_data").notNull(), 
  recruitmentMetrics: jsonb("recruitment_metrics").notNull(),
  generatedAt: timestamp("generated_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

// AI Insights Metrics
export const aiInsightsMetrics = pgTable("ai_insights_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id).notNull(),
  totalInsightsGenerated: integer("total_insights_generated"),
  recommendationsImplemented: integer("recommendations_implemented"),
  recommendationsDismissed: integer("recommendations_dismissed"),
  avgUserRating: numeric("avg_user_rating", { precision: 2, scale: 1 }),
  apiCallsCount: integer("api_calls_count"),
  lastGenerationTime: timestamp("last_generation_time"),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

// AI Recommendations History
export const aiRecommendationsHistory = pgTable("ai_recommendations_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id).notNull(),
  recommendationId: varchar("recommendation_id", { length: 255 }).notNull(),
  recommendationType: varchar("recommendation_type", { length: 50 }).notNull(),
  priority: varchar("priority", { length: 20 }).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  impact: text("impact").notNull(),
  actionItems: jsonb("action_items"),
  confidence: integer("confidence"),
  userFeedback: varchar("user_feedback", { length: 20 }),
  implementedAt: timestamp("implemented_at"),
  dismissedAt: timestamp("dismissed_at"),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

// Email System Tables
export const organizationEmailSettings = pgTable("organization_email_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id).notNull(),
  fromEmail: text("from_email").notNull().default('noreply@talentpatriot.com'),
  fromName: text("from_name").notNull().default('TalentPatriot'),
  replyToEmail: text("reply_to_email"),
  companyLogoUrl: text("company_logo_url"),
  brandColor: text("brand_color").default('#1e40af'),
  brandSecondaryColor: text("brand_secondary_color").default('#3b82f6'),
  companyWebsite: text("company_website"),
  companyAddress: text("company_address"),
  enabledEvents: jsonb("enabled_events").default(sql`'["application_confirmation", "new_application_notification", "interview_scheduled", "status_update"]'::jsonb`),
  emailSignature: text("email_signature"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueOrgEmailSettings: uniqueIndex("unique_org_email_settings").on(table.orgId),
}));

export const emailTemplates = pgTable("email_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id).notNull(),
  templateType: varchar("template_type", { length: 100 }).notNull(),
  templateName: text("template_name").notNull(),
  sendgridTemplateId: text("sendgrid_template_id"),
  fallbackSubject: text("fallback_subject").notNull(),
  fallbackHtml: text("fallback_html"),
  fallbackText: text("fallback_text"),
  templateVariables: jsonb("template_variables").default(sql`'{}'::jsonb`),
  isActive: boolean("is_active").default(true),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const emailEvents = pgTable("email_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id).notNull(),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  recipientEmail: text("recipient_email").notNull(),
  recipientName: text("recipient_name"),
  sendgridMessageId: text("sendgrid_message_id"),
  templateId: uuid("template_id").references(() => emailTemplates.id),
  jobId: uuid("job_id").references(() => jobs.id),
  candidateId: uuid("candidate_id").references(() => candidates.id),
  status: varchar("status", { length: 50 }).default('sent'),
  errorMessage: text("error_message"),
  templateData: jsonb("template_data").default(sql`'{}'::jsonb`),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  deliveredAt: timestamp("delivered_at"),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
});

// Job Candidate Stage Shadow (for tracking stage changes)
export const jobCandidateStageShad = pgTable("_job_candidate_stage_shadow", {
  jobCandidateId: uuid("job_candidate_id").notNull(),
  lastStage: text("last_stage"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Beta Organizations
export const betaOrganizations = pgTable("beta_organizations", {
  id: uuid("id"),
  name: text("name"),
  slug: text("slug"),
  createdAt: timestamp("created_at"),
  betaAppliedAt: timestamp("beta_applied_at"),
  betaApprovedAt: timestamp("beta_approved_at"),
  betaNotes: text("beta_notes"),
  originalCompanyName: text("original_company_name"),
  contactEmail: text("contact_email"),
  companySize: text("company_size"),
  painPoints: text("pain_points"),
  teamSize: integer("team_size"),
  totalJobs: integer("total_jobs"),
  totalCandidates: integer("total_candidates"),
});

// Beta Program Stats
export const betaProgramStats = pgTable("beta_program_stats", {
  pendingApplications: integer("pending_applications"),
  approvedApplications: integer("approved_applications"),
  rejectedApplications: integer("rejected_applications"),
  convertedUsers: integer("converted_users"),
  createdOrganizations: integer("created_organizations"),
});

// Beta Users
export const betaUsers = pgTable("beta_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email").notNull(),
  fullName: varchar("full_name").notNull(),
  companyName: varchar("company_name"),
  companySize: varchar("company_size"),
});

// Data Import Tables
export const dataImports = pgTable("data_imports", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id).notNull(),
  userId: uuid("user_id").notNull(), // references auth.users(id)
  importType: importTypeEnum("import_type").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  status: importStatusEnum("status").default('pending').notNull(),
  totalRecords: integer("total_records").default(0),
  successfulRecords: integer("successful_records").default(0),
  failedRecords: integer("failed_records").default(0),
  fieldMapping: jsonb("field_mapping").default(sql`'{}'::jsonb`),
  errorSummary: jsonb("error_summary").default(sql`'{}'::jsonb`),
  processingStartedAt: timestamp("processing_started_at"),
  processingCompletedAt: timestamp("processing_completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const importRecords = pgTable("import_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  importId: uuid("import_id").references(() => dataImports.id).notNull(),
  rowNumber: integer("row_number").notNull(),
  originalData: jsonb("original_data").notNull(),
  processedData: jsonb("processed_data"),
  status: varchar("status", { length: 20 }).default('pending').notNull(), // pending, success, failed
  errorMessage: text("error_message"),
  entityId: uuid("entity_id"), // ID of created candidate/job if successful
  entityType: varchar("entity_type", { length: 20 }), // 'candidate' or 'job'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});


// Insert schemas

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
});

export const insertUserOrganizationSchema = createInsertSchema(userOrganizations).omit({
  id: true,
  joinedAt: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  public_slug: true,
  createdAt: true,
});

export const insertCandidateSchema = createInsertSchema(candidates).omit({
  id: true,
  createdAt: true,
});

export const insertJobCandidateSchema = createInsertSchema(jobCandidate).omit({
  id: true,
  updatedAt: true,
});

export const insertCandidateNotesSchema = createInsertSchema(candidateNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPipelineColumnSchema = createInsertSchema(pipelineColumns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInterviewSchema = createInsertSchema(interviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageRecipientSchema = createInsertSchema(messageRecipients).omit({
  id: true,
  createdAt: true,
});

export const insertBetaApplicationSchema = createInsertSchema(betaApplications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertApplicationSchema = createInsertSchema(applications).omit({
  id: true,
});

export const insertApplicationMetadataSchema = createInsertSchema(applicationMetadata).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertApplyEventSchema = createInsertSchema(applyEvents).omit({
  id: true,
  createdAt: true,
});

export const insertAiInsightsCacheSchema = createInsertSchema(aiInsightsCache).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAiInsightsMetricsSchema = createInsertSchema(aiInsightsMetrics).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAiRecommendationsHistorySchema = createInsertSchema(aiRecommendationsHistory).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrganizationEmailSettingsSchema = createInsertSchema(organizationEmailSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmailEventSchema = createInsertSchema(emailEvents).omit({
  id: true,
  sentAt: true,
  deliveredAt: true,
  openedAt: true,
  clickedAt: true,
});

export const insertDataImportSchema = createInsertSchema(dataImports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertImportRecordSchema = createInsertSchema(importRecords).omit({
  id: true,
  createdAt: true,
});

export const insertJobCandidateStageShSch = createInsertSchema(jobCandidateStageShad);

export const insertBetaOrganizationSchema = createInsertSchema(betaOrganizations);

export const insertBetaProgramStatsSchema = createInsertSchema(betaProgramStats);

export const insertBetaUserSchema = createInsertSchema(betaUsers).omit({
  id: true,
});

// Types
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;

export type UserOrganization = typeof userOrganizations.$inferSelect;
export type InsertUserOrganization = z.infer<typeof insertUserOrganizationSchema>;

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;

export type Candidate = typeof candidates.$inferSelect;
export type InsertCandidate = z.infer<typeof insertCandidateSchema>;

export type PipelineColumn = typeof pipelineColumns.$inferSelect;
export type InsertPipelineColumn = z.infer<typeof insertPipelineColumnSchema>;

export type JobCandidate = typeof jobCandidate.$inferSelect;
export type InsertJobCandidate = z.infer<typeof insertJobCandidateSchema>;

export type CandidateNotes = typeof candidateNotes.$inferSelect;
export type InsertCandidateNotes = z.infer<typeof insertCandidateNotesSchema>;

export type Interview = typeof interviews.$inferSelect;
export type InsertInterview = z.infer<typeof insertInterviewSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type MessageRecipient = typeof messageRecipients.$inferSelect;
export type InsertMessageRecipient = z.infer<typeof insertMessageRecipientSchema>;

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;

export type BetaApplication = typeof betaApplications.$inferSelect;
export type InsertBetaApplication = z.infer<typeof insertBetaApplicationSchema>;

export type Application = typeof applications.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;

export type ApplicationMetadata = typeof applicationMetadata.$inferSelect;
export type InsertApplicationMetadata = z.infer<typeof insertApplicationMetadataSchema>;

export type ApplyEvent = typeof applyEvents.$inferSelect;
export type InsertApplyEvent = z.infer<typeof insertApplyEventSchema>;

export type AiInsightsCache = typeof aiInsightsCache.$inferSelect;
export type InsertAiInsightsCache = z.infer<typeof insertAiInsightsCacheSchema>;

export type AiInsightsMetrics = typeof aiInsightsMetrics.$inferSelect;
export type InsertAiInsightsMetrics = z.infer<typeof insertAiInsightsMetricsSchema>;

export type AiRecommendationsHistory = typeof aiRecommendationsHistory.$inferSelect;
export type InsertAiRecommendationsHistory = z.infer<typeof insertAiRecommendationsHistorySchema>;

export type OrganizationEmailSettings = typeof organizationEmailSettings.$inferSelect;
export type InsertOrganizationEmailSettings = z.infer<typeof insertOrganizationEmailSettingsSchema>;

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;

export type EmailEvent = typeof emailEvents.$inferSelect;
export type InsertEmailEvent = z.infer<typeof insertEmailEventSchema>;

export type DataImport = typeof dataImports.$inferSelect;
export type InsertDataImport = z.infer<typeof insertDataImportSchema>;

export type ImportRecord = typeof importRecords.$inferSelect;
export type InsertImportRecord = z.infer<typeof insertImportRecordSchema>;

// Pagination Types

export interface PaginationMetadata {
  hasMore: boolean;
  nextCursor?: string;
  totalCount?: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMetadata;
}

// Zod schemas for query parameter validation
export const paginationQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  cursor: z.string().optional(),
  include: z.string().optional(),
});

export const jobsQuerySchema = paginationQuerySchema.extend({
  orgId: z.string().uuid('Invalid organization ID'),
  status: z.enum(['draft', 'open', 'closed', 'on_hold', 'filled']).optional(),
  jobType: z.enum(['full-time', 'part-time', 'contract', 'internship']).optional(),
  search: z.string().optional(),
});

export const candidatesQuerySchema = paginationQuerySchema.extend({
  orgId: z.string().uuid('Invalid organization ID'),
  jobId: z.string().uuid().optional(),
  stage: z.enum(['applied', 'phone_screen', 'interview', 'technical', 'final', 'offer', 'hired', 'rejected']).optional(),
  status: z.string().optional(),
  search: z.string().optional(),
});

export const messagesQuerySchema = paginationQuerySchema.extend({
  userId: z.string().uuid().optional(),
  threadId: z.string().uuid().optional(),
  type: z.enum(['internal', 'client', 'candidate', 'system']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  clientId: z.string().uuid().optional(),
  jobId: z.string().uuid().optional(),
  candidateId: z.string().uuid().optional(),
});

// Types for paginated responses
export type PaginatedJobs = PaginatedResponse<Job>;
export type PaginatedCandidates = PaginatedResponse<Candidate>;
export type PaginatedMessages = PaginatedResponse<Message>;

// Field selection helpers
export const jobFieldsPresets = {
  list: ['id', 'title', 'status', 'location', 'job_type', 'created_at'],
  detail: ['id', 'title', 'description', 'status', 'location', 'job_type', 'department', 'salary_range', 'experience_level', 'created_at', 'updated_at'],
  public: ['id', 'title', 'description', 'location', 'job_type', 'experience_level', 'remote_option', 'salary_range'],
} as const;

export const candidateFieldsPresets = {
  list: ['id', 'name', 'email', 'stage', 'status', 'created_at'],
  detail: ['id', 'name', 'email', 'phone', 'stage', 'status', 'resume_url', 'notes', 'created_at', 'updated_at'],
} as const;

export const messageFieldsPresets = {
  list: ['id', 'subject', 'type', 'priority', 'is_read', 'created_at'],
  detail: ['id', 'subject', 'content', 'type', 'priority', 'is_read', 'created_at', 'thread_id'],
} as const;

// Schema introspection helper using materialized view
export async function getSchemaColumns(table?: string) {
  // Only import supabase when needed to avoid circular dependencies
  const { supabase } = await import("../server/lib/supabase");
  
  let query = supabase.from("schema_columns_mv").select("*").eq("table_schema", "public");
  if (table) {
    query = query.eq("table_name", table);
  }
  const { data, error } = await query.order("table_name").order("ordinal_position");
  if (error) throw error;
  return data;
}
