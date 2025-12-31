import { pgTable, text, uuid, timestamp, varchar, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { organizations } from "./users";
import { recordStatusEnum } from "./enums";

export const clientTypeEnum = pgEnum("client_type", ["commercial", "government", "non_profit", "startup"]);

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id).notNull(),
  name: text("name").notNull(),
  industry: text("industry"),
  location: text("location"),
  website: text("website"),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  notes: text("notes"),
  status: recordStatusEnum("status").default('active'),
  clientType: clientTypeEnum("client_type").default('commercial'),
  pocs: jsonb("pocs").default([]),
  region: text("region"),
  priority: text("priority"),
  paymentTerms: text("payment_terms"),
  lastContactAt: timestamp("last_contact_at"),
  marginTrend: text("margin_trend"),
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertClientSchema = createInsertSchema(clients).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;
