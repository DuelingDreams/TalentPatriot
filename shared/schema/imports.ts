import { pgTable, text, uuid, timestamp, integer, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { organizations } from "./users";
import { importStatusEnum, importTypeEnum } from "./enums";

export const dataImports = pgTable("data_imports", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id).notNull(),
  userId: uuid("user_id").notNull(),
  importType: importTypeEnum("import_type").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  status: importStatusEnum("status").default('pending').notNull(),
  totalRecords: integer("total_records").default(0),
  successfulRecords: integer("successful_records").default(0),
  failedRecords: integer("failed_records").default(0),
  fieldMapping: jsonb("field_mapping").default(sql`'{}'::jsonb`),
  errorSummary: jsonb("error_summary").default(sql`'{}'::jsonb`),
  processingStartedAt: timestamp("processing_started_at"),
  processingCompletedAt: timestamp("processing_completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const importRecords = pgTable("import_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  importId: uuid("import_id").references(() => dataImports.id).notNull(),
  rowNumber: integer("row_number").notNull(),
  originalData: jsonb("original_data").notNull(),
  processedData: jsonb("processed_data"),
  status: varchar("status", { length: 20 }).default('pending').notNull(),
  errorMessage: text("error_message"),
  entityId: uuid("entity_id"),
  entityType: varchar("entity_type", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDataImportSchema = createInsertSchema(dataImports).omit({ id: true, createdAt: true, updatedAt: true });
export const insertImportRecordSchema = createInsertSchema(importRecords).omit({ id: true, createdAt: true });

export type InsertDataImport = z.infer<typeof insertDataImportSchema>;
export type InsertImportRecord = z.infer<typeof insertImportRecordSchema>;

export type DataImport = typeof dataImports.$inferSelect;
export type ImportRecord = typeof importRecords.$inferSelect;
