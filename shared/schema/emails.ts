import { pgTable, text, uuid, timestamp, varchar, boolean, uniqueIndex, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { organizations } from "./users";
import { jobs } from "./jobs";
import { candidates } from "./candidates";

export const organizationEmailSettings = pgTable("organization_email_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id).notNull(),
  fromEmail: text("from_email").notNull().default('noreply@talentpatriot.com'),
  fromName: text("from_name").notNull().default('TalentPatriot'),
  replyToEmail: text("reply_to_email"),
  companyLogoUrl: text("company_logo_url"),
  brandColor: text("brand_color").default('#1e40af'),
  brandSecondaryColor: text("brand_secondary_color").default('#3b82f6'),
  companyWebsite: text("company_website"),
  companyAddress: text("company_address"),
  enabledEvents: jsonb("enabled_events").default(sql`'["application_confirmation", "new_application_notification", "interview_scheduled", "status_update"]'::jsonb`),
  emailSignature: text("email_signature"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueOrgEmailSettings: uniqueIndex("unique_org_email_settings").on(table.orgId),
}));

export const emailTemplates = pgTable("email_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id).notNull(),
  templateType: varchar("template_type", { length: 100 }).notNull(),
  templateName: text("template_name").notNull(),
  sendgridTemplateId: text("sendgrid_template_id"),
  fallbackSubject: text("fallback_subject").notNull(),
  fallbackHtml: text("fallback_html"),
  fallbackText: text("fallback_text"),
  templateVariables: jsonb("template_variables").default(sql`'{}'::jsonb`),
  isActive: boolean("is_active").default(true),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const emailEvents = pgTable("email_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id).notNull(),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  recipientEmail: text("recipient_email").notNull(),
  recipientName: text("recipient_name"),
  sendgridMessageId: text("sendgrid_message_id"),
  templateId: uuid("template_id").references(() => emailTemplates.id),
  jobId: uuid("job_id").references(() => jobs.id),
  candidateId: uuid("candidate_id").references(() => candidates.id),
  status: varchar("status", { length: 50 }).default('sent'),
  errorMessage: text("error_message"),
  templateData: jsonb("template_data").default(sql`'{}'::jsonb`),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  deliveredAt: timestamp("delivered_at"),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
});

export const insertOrganizationEmailSettingsSchema = createInsertSchema(organizationEmailSettings).omit({ id: true, createdAt: true, updatedAt: true });
export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({ id: true, createdAt: true, updatedAt: true });
export const insertEmailEventSchema = createInsertSchema(emailEvents).omit({ id: true, sentAt: true, deliveredAt: true, openedAt: true, clickedAt: true });

export type InsertOrganizationEmailSettings = z.infer<typeof insertOrganizationEmailSettingsSchema>;
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
export type InsertEmailEvent = z.infer<typeof insertEmailEventSchema>;

export type OrganizationEmailSettings = typeof organizationEmailSettings.$inferSelect;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type EmailEvent = typeof emailEvents.$inferSelect;
