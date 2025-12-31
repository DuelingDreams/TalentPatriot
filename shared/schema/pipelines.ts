import { pgTable, text, uuid, timestamp, integer, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { organizations } from "./users";
import { jobs } from "./jobs";

export const pipelineColumns = pgTable("pipeline_columns", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id).notNull(),
  jobId: uuid("job_id").references(() => jobs.id),
  title: text("title").notNull(),
  position: integer("position").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  jobPositionIdx: index("idx_pipeline_cols_job_pos").on(table.jobId, table.position),
  orgPositionIdx: index("idx_pipeline_cols_org_pos").on(table.orgId, table.position),
}));

export const insertPipelineColumnSchema = createInsertSchema(pipelineColumns).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPipelineColumn = z.infer<typeof insertPipelineColumnSchema>;
export type PipelineColumn = typeof pipelineColumns.$inferSelect;
