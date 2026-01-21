import { pgTable, text, uuid, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
  reviewNotes: text("review_notes"),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: uuid("reviewed_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
  processedBy: uuid("processed_by"),
  notes: text("notes"),
  scheduledCallAt: timestamp("scheduled_call_at"),
  callCompletedAt: timestamp("call_completed_at"),
  callNotes: text("call_notes"),
  magicLinkSentAt: timestamp("magic_link_sent_at"),
});

export const insertBetaApplicationSchema = createInsertSchema(betaApplications).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBetaApplication = z.infer<typeof insertBetaApplicationSchema>;
export type BetaApplication = typeof betaApplications.$inferSelect;
