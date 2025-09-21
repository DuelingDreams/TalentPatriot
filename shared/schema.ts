import { pgTable, text, uuid, timestamp, varchar, pgEnum, uniqueIndex, boolean, integer, index, pgView } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { sql } from "drizzle-orm";

// Enums
export const jobStatusEnum = pgEnum('job_status', ['draft', 'open', 'closed', 'on_hold', 'filled']);
export const jobTypeEnum = pgEnum('job_type', ['full-time', 'part-time', 'contract', 'internship']);
export const candidateStageEnum = pgEnum('candidate_stage', ['applied', 'screening', 'interview', 'technical', 'final', 'offer', 'hired', 'rejected']);
export const recordStatusEnum = pgEnum('record_status', ['active', 'demo', 'archived']);
export const userRoleEnum = pgEnum('user_role', ['hiring_manager', 'recruiter', 'admin', 'interviewer', 'demo_viewer']);
export const orgRoleEnum = pgEnum('org_role', ['owner', 'admin', 'hiring_manager', 'recruiter', 'interviewer', 'viewer']);
export const interviewTypeEnum = pgEnum('interview_type', ['phone', 'video', 'onsite', 'technical', 'cultural']);
export const interviewStatusEnum = pgEnum('interview_status', ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show']);
export const messageTypeEnum = pgEnum('message_type', ['internal', 'client', 'candidate', 'system']);
export const messagePriorityEnum = pgEnum('message_priority', ['low', 'normal', 'high', 'urgent']);
export const experienceLevelEnum = pgEnum('experience_level', ['entry', 'mid', 'senior', 'executive']);
export const remoteOptionEnum = pgEnum('remote_option', ['onsite', 'remote', 'hybrid']);

// Tables
export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  ownerId: uuid("owner_id").notNull(), // references users.id from Supabase auth
  slug: text("slug"),
}, (table) => ({
  uniqueSlug: uniqueIndex("unique_org_slug").on(table.slug),
}));

export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").primaryKey(), // references auth.users(id) 
  role: userRoleEnum("role").default('hiring_manager').notNull(),
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
  stage: z.enum(['applied', 'screening', 'interview', 'technical', 'final', 'offer', 'hired', 'rejected']).optional(),
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
