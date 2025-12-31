import { pgTable, text, uuid, timestamp, index, uniqueIndex, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { organizations } from "./users";
import { interviewTypeEnum, interviewStatusEnum, recordStatusEnum, providerEnum, calendarEventStatusEnum } from "./enums";

export const interviews = pgTable("interviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id).notNull(),
  jobCandidateId: uuid("job_candidate_id").notNull(),
  title: text("title").notNull(),
  type: interviewTypeEnum("type").notNull(),
  status: interviewStatusEnum("status").default('scheduled').notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  duration: text("duration").default('60'),
  location: text("location"),
  interviewerId: uuid("interviewer_id"),
  notes: text("notes"),
  feedback: text("feedback"),
  rating: text("rating"),
  recordStatus: recordStatusEnum("record_status").default('active'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const calendarEvents = pgTable("calendar_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id).notNull(),
  provider: providerEnum("provider").notNull(),
  providerEventId: text("provider_event_id").notNull(),
  threadId: uuid("thread_id"),
  summary: text("summary").notNull(),
  description: text("description"),
  startAt: timestamp("start_at").notNull(),
  endAt: timestamp("end_at").notNull(),
  timezone: text("timezone").default('UTC'),
  conferenceUrl: text("conference_url"),
  attendees: jsonb("attendees").default(sql`'[]'::jsonb`),
  status: calendarEventStatusEnum("status").default('confirmed'),
  createdBy: uuid("created_by").notNull(),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueProviderEvent: uniqueIndex("unique_provider_event").on(table.provider, table.providerEventId),
  createdByIdx: index("idx_calendar_events_created_by").on(table.createdBy),
  startAtIdx: index("idx_calendar_events_start_at").on(table.startAt),
  threadIdx: index("idx_calendar_events_thread_id").on(table.threadId),
}));

export const insertInterviewSchema = createInsertSchema(interviews).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCalendarEventSchema = createInsertSchema(calendarEvents).omit({ id: true, createdAt: true, updatedAt: true });

export type InsertInterview = z.infer<typeof insertInterviewSchema>;
export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;

export type Interview = typeof interviews.$inferSelect;
export type CalendarEvent = typeof calendarEvents.$inferSelect;
