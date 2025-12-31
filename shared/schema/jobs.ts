import { pgTable, text, uuid, timestamp, varchar, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { organizations } from "./users";
import { clients } from "./clients";
import { jobStatusEnum, jobTypeEnum, experienceLevelEnum, remoteOptionEnum, recordStatusEnum } from "./enums";

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

export const insertJobSchema = createInsertSchema(jobs).omit({ id: true, public_slug: true, createdAt: true });
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobs.$inferSelect;
