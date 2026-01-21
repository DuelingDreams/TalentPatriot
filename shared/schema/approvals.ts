import { pgTable, text, uuid, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { organizations } from "./users";

export const approvalRequests = pgTable("approval_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  requestType: text("request_type").notNull(),
  targetTable: text("target_table").notNull(),
  targetId: uuid("target_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  requestedBy: uuid("requested_by").notNull(),
  requestedPayload: jsonb("requested_payload").default({}),
  status: text("status").default('pending').notNull(),
  resolvedBy: uuid("resolved_by"),
  resolutionNotes: text("resolution_notes"),
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertApprovalRequestSchema = createInsertSchema(approvalRequests).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  requestedAt: true,
});

export type InsertApprovalRequest = z.infer<typeof insertApprovalRequestSchema>;
export type ApprovalRequest = typeof approvalRequests.$inferSelect;
