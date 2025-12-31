import { pgTable, text, uuid, timestamp, varchar, boolean, integer, uniqueIndex, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { organizations } from "./users";
import { jobs } from "./jobs";
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

export const insertCandidateSchema = createInsertSchema(candidates).omit({ id: true, createdAt: true, updatedAt: true }).extend({
  skills: z.array(z.string()).optional(),
  skillLevels: z.record(z.string(), z.number()).optional(),
});
export const insertJobCandidateSchema = createInsertSchema(jobCandidate).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCandidateNoteSchema = createInsertSchema(candidateNotes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertApplicationSchema = createInsertSchema(applications).omit({ id: true });
export const insertApplicationMetadataSchema = createInsertSchema(applicationMetadata).omit({ id: true, createdAt: true, updatedAt: true });

export type InsertCandidate = z.infer<typeof insertCandidateSchema>;
export type InsertJobCandidate = z.infer<typeof insertJobCandidateSchema>;
export type InsertCandidateNote = z.infer<typeof insertCandidateNoteSchema>;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type InsertApplicationMetadata = z.infer<typeof insertApplicationMetadataSchema>;

export type Candidate = typeof candidates.$inferSelect;
export type JobCandidate = typeof jobCandidate.$inferSelect;
export type CandidateNote = typeof candidateNotes.$inferSelect;
export type CandidateNotes = typeof candidateNotes.$inferSelect;
export type InsertCandidateNotes = z.infer<typeof insertCandidateNoteSchema>;
export type Application = typeof applications.$inferSelect;
export type ApplicationMetadata = typeof applicationMetadata.$inferSelect;
export type ApplyEvent = typeof applyEvents.$inferSelect;
export type InsertApplyEvent = z.infer<typeof insertApplyEventSchema>;

export const insertApplyEventSchema = createInsertSchema(applyEvents).omit({ id: true, createdAt: true });
