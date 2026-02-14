import { pgTable, text, uuid, timestamp, numeric, date, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { organizations } from "./users";
import { candidates } from "./candidates";
import { jobs } from "./jobs";
import { clients } from "./clients";

export const offerLetterStatusEnum = pgEnum('offer_letter_status', ['draft', 'sent', 'accepted', 'declined', 'expired', 'withdrawn']);
export const salaryTypeEnum = pgEnum('salary_type_enum', ['per year', 'per hour', 'fixed']);
export const feeTypeEnum = pgEnum('fee_type_enum', ['percentage', 'flat']);
export const offerEmploymentTypeEnum = pgEnum('offer_employment_type', ['Full-Time', 'Part-Time', 'Contract']);

export const offerLetters = pgTable("offer_letters", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  candidateId: uuid("candidate_id").references(() => candidates.id).notNull(),
  jobId: uuid("job_id").references(() => jobs.id).notNull(),
  clientId: uuid("client_id").references(() => clients.id),

  salaryAmount: numeric("salary_amount", { precision: 12, scale: 2 }).notNull(),
  salaryType: text("salary_type").default('per year').notNull(),
  billRate: numeric("bill_rate", { precision: 12, scale: 2 }),
  feeType: text("fee_type"),
  feeAmount: numeric("fee_amount", { precision: 12, scale: 2 }),

  employmentType: text("employment_type").default('Full-Time').notNull(),
  startDate: date("start_date"),
  officeLocation: text("office_location"),
  managerName: text("manager_name"),
  benefits: text("benefits").array(),

  signatoryName: text("signatory_name"),
  signatoryTitle: text("signatory_title"),

  status: text("status").default('draft').notNull(),
  acceptBy: date("accept_by"),
  sentAt: timestamp("sent_at"),
  acceptedAt: timestamp("accepted_at"),
  declinedAt: timestamp("declined_at"),

  customNotes: text("custom_notes"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
});

export const insertOfferLetterSchema = createInsertSchema(offerLetters).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOfferLetter = z.infer<typeof insertOfferLetterSchema>;
export type OfferLetter = typeof offerLetters.$inferSelect;
