import { pgTable, text, uuid, timestamp, varchar, pgEnum, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums
export const jobStatusEnum = pgEnum('job_status', ['open', 'closed', 'on_hold', 'filled']);
export const candidateStageEnum = pgEnum('candidate_stage', ['applied', 'screening', 'interview', 'technical', 'final', 'offer', 'hired', 'rejected']);
export const recordStatusEnum = pgEnum('record_status', ['active', 'demo', 'archived']);
export const userRoleEnum = pgEnum('user_role', ['recruiter', 'bd', 'pm', 'demo_viewer', 'admin']);
export const interviewTypeEnum = pgEnum('interview_type', ['phone', 'video', 'onsite', 'technical', 'cultural']);
export const interviewStatusEnum = pgEnum('interview_status', ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show']);

// Tables
export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
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
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  clientId: uuid("client_id").references(() => clients.id).notNull(),
  status: jobStatusEnum("status").default('open').notNull(),
  recordStatus: recordStatusEnum("record_status").default('active').notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
  assignedTo: uuid("assigned_to"),
});

export const candidates = pgTable("candidates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  resumeUrl: text("resume_url"),
  status: recordStatusEnum("status").default('active').notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
});

export const jobCandidate = pgTable("job_candidate", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobId: uuid("job_id").references(() => jobs.id).notNull(),
  candidateId: uuid("candidate_id").references(() => candidates.id).notNull(),
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
  jobCandidateId: uuid("job_candidate_id").references(() => jobCandidate.id).notNull(),
  authorId: uuid("author_id").notNull(),
  content: text("content").notNull(),
  isPrivate: varchar("is_private", { length: 10 }).default('false').notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const interviews = pgTable("interviews", {
  id: uuid("id").primaryKey().defaultRandom(),
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

// Relations
export const clientsRelations = relations(clients, ({ many }) => ({
  jobs: many(jobs),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  client: one(clients, {
    fields: [jobs.clientId],
    references: [clients.id],
  }),
  jobCandidates: many(jobCandidate),
}));

export const candidatesRelations = relations(candidates, ({ many }) => ({
  jobCandidates: many(jobCandidate),
}));

export const jobCandidateRelations = relations(jobCandidate, ({ one, many }) => ({
  job: one(jobs, {
    fields: [jobCandidate.jobId],
    references: [jobs.id],
  }),
  candidate: one(candidates, {
    fields: [jobCandidate.candidateId],
    references: [candidates.id],
  }),
  notes: many(candidateNotes),
  interviews: many(interviews),
}));

export const candidateNotesRelations = relations(candidateNotes, ({ one }) => ({
  jobCandidate: one(jobCandidate, {
    fields: [candidateNotes.jobCandidateId],
    references: [jobCandidate.id],
  }),
}));

export const interviewsRelations = relations(interviews, ({ one }) => ({
  jobCandidate: one(jobCandidate, {
    fields: [interviews.jobCandidateId],
    references: [jobCandidate.id],
  }),
}));

// Insert schemas
export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
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
});

export const insertInterviewSchema = createInsertSchema(interviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;

export type Candidate = typeof candidates.$inferSelect;
export type InsertCandidate = z.infer<typeof insertCandidateSchema>;

export type JobCandidate = typeof jobCandidate.$inferSelect;
export type InsertJobCandidate = z.infer<typeof insertJobCandidateSchema>;

export type CandidateNotes = typeof candidateNotes.$inferSelect;
export type InsertCandidateNotes = z.infer<typeof insertCandidateNotesSchema>;

export type Interview = typeof interviews.$inferSelect;
export type InsertInterview = z.infer<typeof insertInterviewSchema>;
