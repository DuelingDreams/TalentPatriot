import { pgTable, text, uuid, timestamp, varchar, boolean, integer, uniqueIndex, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { organizations } from "./users";
import { jobs } from "./jobs";
import { clients } from "./clients";
import { pipelineColumns } from "./pipelines";
import { recordStatusEnum, candidateStageEnum, experienceLevelEnum, parsingStatusEnum } from "./enums";

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
  resumeParsed: boolean("resume_parsed").default(false),
  skills: text("skills").array(),
  experienceLevel: experienceLevelEnum("experience_level"),
  totalYearsExperience: integer("total_years_experience").default(0),
  education: text("education"),
  summary: text("summary"),
  searchableContent: text("searchable_content"),
  linkedinUrl: text("linkedin_url"),
  portfolioUrl: text("portfolio_url"),
  workAuthorization: varchar("work_authorization", { length: 100 }),
  visaSponsorship: varchar("visa_sponsorship", { length: 100 }),
  ageConfirmation: varchar("age_confirmation", { length: 50 }),
  previousEmployee: varchar("previous_employee", { length: 50 }),
  referralSource: varchar("referral_source", { length: 100 }),
  employmentHistory: text("employment_history"),
  comprehensiveEducation: text("comprehensive_education"),
  dataPrivacyAck: boolean("data_privacy_ack").default(false),
  aiAcknowledgment: boolean("ai_acknowledgment").default(false),
  gender: varchar("gender", { length: 50 }),
  raceEthnicity: varchar("race_ethnicity", { length: 100 }),
  veteranStatus: varchar("veteran_status", { length: 50 }),
  disabilityStatus: varchar("disability_status", { length: 50 }),
  skillLevels: jsonb("skill_levels"),
  source: varchar("source", { length: 100 }),
  workExperience: jsonb("work_experience"),
  projects: jsonb("projects"),
  languages: text("languages").array(),
  certifications: text("certifications").array(),
  parsingStatus: parsingStatusEnum("parsing_status").default('pending'),
  resumeParsedAt: timestamp("resume_parsed_at"),
  parsingError: text("parsing_error"),
  desiredSalaryMin: integer("desired_salary_min"),
  desiredSalaryMax: integer("desired_salary_max"),
  availability: varchar("availability", { length: 100 }),
  rating: integer("rating").default(0),
  currentTitle: varchar("current_title", { length: 255 }),
});

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
  source: varchar("source", { length: 100 }),
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

export const applications = pgTable("applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobId: uuid("job_id").references(() => jobs.id),
  candidateId: uuid("candidate_id").references(() => candidates.id),
  status: recordStatusEnum("status"),
  appliedAt: timestamp("applied_at"),
  columnId: uuid("column_id").references(() => pipelineColumns.id),
});

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

export const applyEvents = pgTable("apply_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobId: uuid("job_id").notNull(),
  applicantEmail: text("applicant_email").notNull(),
  requesterIp: varchar("requester_ip"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Candidate Documents - for multiple file management per candidate
export const candidateDocuments = pgTable("candidate_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id).notNull(),
  candidateId: uuid("candidate_id").references(() => candidates.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: varchar("file_type", { length: 50 }),
  fileSize: integer("file_size"),
  uploadedBy: uuid("uploaded_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Drip Campaigns - email campaign templates
export const dripCampaigns = pgTable("drip_campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 20 }).default('active').notNull(),
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Campaign Emails - email sequence items within a campaign
export const campaignEmails = pgTable("campaign_emails", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id").references(() => dripCampaigns.id).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  body: text("body"),
  delayDays: integer("delay_days").default(0).notNull(),
  sequenceOrder: integer("sequence_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Candidate Campaign Enrollments - tracks which candidates are in which campaigns
export const candidateCampaignEnrollments = pgTable("candidate_campaign_enrollments", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id).notNull(),
  candidateId: uuid("candidate_id").references(() => candidates.id).notNull(),
  campaignId: uuid("campaign_id").references(() => dripCampaigns.id).notNull(),
  status: varchar("status", { length: 20 }).default('active').notNull(),
  enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueEnrollment: uniqueIndex("unique_candidate_campaign").on(table.candidateId, table.campaignId),
}));

// Campaign Email Sends - tracks sent/scheduled emails for enrollments
export const campaignEmailSends = pgTable("campaign_email_sends", {
  id: uuid("id").primaryKey().defaultRandom(),
  enrollmentId: uuid("enrollment_id").references(() => candidateCampaignEnrollments.id).notNull(),
  campaignEmailId: uuid("campaign_email_id").references(() => campaignEmails.id).notNull(),
  status: varchar("status", { length: 20 }).default('scheduled').notNull(),
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Client Submissions - tracks candidate submissions to clients
export const clientSubmissions = pgTable("client_submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id).notNull(),
  candidateId: uuid("candidate_id").references(() => candidates.id).notNull(),
  clientId: uuid("client_id").references(() => clients.id).notNull(),
  jobId: uuid("job_id").references(() => jobs.id),
  positionTitle: varchar("position_title", { length: 255 }),
  rate: varchar("rate", { length: 50 }),
  status: varchar("status", { length: 50 }).default('submitted').notNull(),
  feedback: text("feedback"),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  submittedBy: uuid("submitted_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCandidateSchema = createInsertSchema(candidates).omit({ id: true, createdAt: true, updatedAt: true }).extend({
  skills: z.array(z.string()).optional(),
  skillLevels: z.record(z.string(), z.number()).optional(),
});
export const insertJobCandidateSchema = createInsertSchema(jobCandidate).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCandidateNoteSchema = createInsertSchema(candidateNotes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertApplicationSchema = createInsertSchema(applications).omit({ id: true });
export const insertApplicationMetadataSchema = createInsertSchema(applicationMetadata).omit({ id: true, createdAt: true, updatedAt: true });
export const insertApplyEventSchema = createInsertSchema(applyEvents).omit({ id: true, createdAt: true });

// New table insert schemas
export const insertCandidateDocumentSchema = createInsertSchema(candidateDocuments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDripCampaignSchema = createInsertSchema(dripCampaigns).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCampaignEmailSchema = createInsertSchema(campaignEmails).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCandidateCampaignEnrollmentSchema = createInsertSchema(candidateCampaignEnrollments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCampaignEmailSendSchema = createInsertSchema(campaignEmailSends).omit({ id: true, createdAt: true });
export const insertClientSubmissionSchema = createInsertSchema(clientSubmissions).omit({ id: true, createdAt: true, updatedAt: true });

export type InsertCandidate = z.infer<typeof insertCandidateSchema>;
export type InsertJobCandidate = z.infer<typeof insertJobCandidateSchema>;
export type InsertCandidateNote = z.infer<typeof insertCandidateNoteSchema>;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type InsertApplicationMetadata = z.infer<typeof insertApplicationMetadataSchema>;
export type InsertApplyEvent = z.infer<typeof insertApplyEventSchema>;

// New table insert types
export type InsertCandidateDocument = z.infer<typeof insertCandidateDocumentSchema>;
export type InsertDripCampaign = z.infer<typeof insertDripCampaignSchema>;
export type InsertCampaignEmail = z.infer<typeof insertCampaignEmailSchema>;
export type InsertCandidateCampaignEnrollment = z.infer<typeof insertCandidateCampaignEnrollmentSchema>;
export type InsertCampaignEmailSend = z.infer<typeof insertCampaignEmailSendSchema>;
export type InsertClientSubmission = z.infer<typeof insertClientSubmissionSchema>;

export type Candidate = typeof candidates.$inferSelect;
export type JobCandidate = typeof jobCandidate.$inferSelect;
export type CandidateNote = typeof candidateNotes.$inferSelect;
export type CandidateNotes = typeof candidateNotes.$inferSelect;
export type InsertCandidateNotes = z.infer<typeof insertCandidateNoteSchema>;
export type Application = typeof applications.$inferSelect;
export type ApplicationMetadata = typeof applicationMetadata.$inferSelect;
export type ApplyEvent = typeof applyEvents.$inferSelect;

// New table select types
export type CandidateDocument = typeof candidateDocuments.$inferSelect;
export type DripCampaign = typeof dripCampaigns.$inferSelect;
export type CampaignEmail = typeof campaignEmails.$inferSelect;
export type CandidateCampaignEnrollment = typeof candidateCampaignEnrollments.$inferSelect;
export type CampaignEmailSend = typeof campaignEmailSends.$inferSelect;
export type ClientSubmission = typeof clientSubmissions.$inferSelect;
