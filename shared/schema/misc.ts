import { pgTable, text, uuid, timestamp, varchar, boolean, integer, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { organizations } from "./users";

export const jobCandidateStageShad = pgTable("_job_candidate_stage_shadow", {
  jobCandidateId: uuid("job_candidate_id").notNull(),
  lastStage: text("last_stage"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

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

export const betaProgramStats = pgTable("beta_program_stats", {
  pendingApplications: integer("pending_applications"),
  approvedApplications: integer("approved_applications"),
  rejectedApplications: integer("rejected_applications"),
  convertedUsers: integer("converted_users"),
  createdOrganizations: integer("created_organizations"),
});

export const betaUsers = pgTable("beta_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email").notNull(),
  fullName: varchar("full_name").notNull(),
  companyName: varchar("company_name"),
  companySize: varchar("company_size"),
});

export const jobPipelineStageEvents = pgTable("job_pipeline_stage_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobCandidateId: uuid("job_candidate_id").notNull(),
  fromStage: text("from_stage"),
  toStage: text("to_stage").notNull(),
  changedBy: uuid("changed_by").notNull(),
  changeReason: text("change_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notes = pgTable("notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id).notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: uuid("entity_id").notNull(),
  authorId: uuid("author_id").notNull(),
  content: text("content").notNull(),
  isPrivate: boolean("is_private").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const schemaMigrations = pgTable("schema_migrations", {
  version: varchar("version", { length: 255 }).primaryKey(),
  appliedAt: timestamp("applied_at").defaultNow().notNull(),
});

export const stageOrder = pgTable("stage_order", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id).notNull(),
  stage: text("stage").notNull(),
  orderIndex: integer("order_index").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const timezoneCache = pgTable("timezone_cache", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  displayName: text("display_name"),
  offset: varchar("offset", { length: 10 }),
  region: varchar("region", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueTimezoneName: uniqueIndex("unique_timezone_name").on(table.name),
}));

export const insertJobCandidateStageShSch = createInsertSchema(jobCandidateStageShad);
export const insertBetaOrganizationSchema = createInsertSchema(betaOrganizations);
export const insertBetaProgramStatsSchema = createInsertSchema(betaProgramStats);
export const insertBetaUserSchema = createInsertSchema(betaUsers).omit({ id: true });
export const insertJobPipelineStageEventSchema = createInsertSchema(jobPipelineStageEvents).omit({ id: true, createdAt: true });
export const insertNoteSchema = createInsertSchema(notes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertStageOrderSchema = createInsertSchema(stageOrder).omit({ id: true, createdAt: true });
export const insertTimezoneCacheSchema = createInsertSchema(timezoneCache).omit({ id: true, createdAt: true });

export type JobCandidateStageShadow = typeof jobCandidateStageShad.$inferSelect;
export type BetaOrganization = typeof betaOrganizations.$inferSelect;
export type BetaProgramStats = typeof betaProgramStats.$inferSelect;
export type BetaUser = typeof betaUsers.$inferSelect;
export type JobPipelineStageEvent = typeof jobPipelineStageEvents.$inferSelect;
export type Note = typeof notes.$inferSelect;
export type SchemaMigration = typeof schemaMigrations.$inferSelect;
export type StageOrder = typeof stageOrder.$inferSelect;
export type TimezoneCache = typeof timezoneCache.$inferSelect;

export type InsertJobPipelineStageEvent = z.infer<typeof insertJobPipelineStageEventSchema>;
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type InsertStageOrder = z.infer<typeof insertStageOrderSchema>;
export type InsertTimezoneCache = z.infer<typeof insertTimezoneCacheSchema>;
export type InsertBetaUser = z.infer<typeof insertBetaUserSchema>;
