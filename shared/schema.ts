import { pgTable, text, uuid, timestamp, varchar, pgEnum, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums
export const jobStatusEnum = pgEnum('job_status', ['open', 'closed', 'on_hold', 'filled']);
export const candidateStageEnum = pgEnum('candidate_stage', ['applied', 'screening', 'interview', 'technical', 'final', 'offer', 'hired', 'rejected']);

// Tables
export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  industry: varchar("industry", { length: 100 }),
  location: varchar("location", { length: 255 }),
  website: varchar("website", { length: 255 }),
  contactName: varchar("contact_name", { length: 255 }),
  contactEmail: varchar("contact_email", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 50 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const jobs = pgTable("jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  clientId: uuid("client_id").references(() => clients.id).notNull(),
  status: jobStatusEnum("status").default('open').notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const candidates = pgTable("candidates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  resumeUrl: text("resume_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const jobCandidate = pgTable("job_candidate", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobId: uuid("job_id").references(() => jobs.id).notNull(),
  candidateId: uuid("candidate_id").references(() => candidates.id).notNull(),
  stage: candidateStageEnum("stage").default('applied').notNull(),
  notes: text("notes"),
  assignedTo: varchar("assigned_to", { length: 255 }),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueJobCandidate: uniqueIndex("unique_job_candidate").on(table.jobId, table.candidateId),
}));

export const candidateNotes = pgTable("candidate_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobCandidateId: uuid("job_candidate_id").references(() => jobCandidate.id).notNull(),
  authorId: varchar("author_id", { length: 255 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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
}));

export const candidateNotesRelations = relations(candidateNotes, ({ one }) => ({
  jobCandidate: one(jobCandidate, {
    fields: [candidateNotes.jobCandidateId],
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
