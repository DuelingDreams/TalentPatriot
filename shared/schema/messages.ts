import { pgTable, text, uuid, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { organizations } from "./users";
import { clients } from "./clients";
import { jobs } from "./jobs";
import { candidates, jobCandidate } from "./candidates";
import { messageTypeEnum, messagePriorityEnum, channelTypeEnum, recordStatusEnum } from "./enums";

export const messageThreads = pgTable("message_threads", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id).notNull(),
  subject: text("subject"),
  channelType: channelTypeEnum("channel_type"),
  externalThreadId: text("external_thread_id"),
  participantIds: text("participant_ids").array().default(sql`ARRAY[]::text[]`),
  lastMessageAt: timestamp("last_message_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  externalThreadIdx: index("idx_message_threads_external_id").on(table.externalThreadId),
  lastMessageIdx: index("idx_message_threads_last_message").on(table.lastMessageAt),
}));

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id).notNull(),
  type: messageTypeEnum("type").notNull(),
  priority: messagePriorityEnum("priority").default('normal').notNull(),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  senderId: uuid("sender_id").notNull(),
  recipientId: uuid("recipient_id"),
  clientId: uuid("client_id").references(() => clients.id),
  jobId: uuid("job_id").references(() => jobs.id),
  candidateId: uuid("candidate_id").references(() => candidates.id),
  jobCandidateId: uuid("job_candidate_id").references(() => jobCandidate.id),
  isRead: boolean("is_read").default(false).notNull(),
  readAt: timestamp("read_at"),
  isArchived: boolean("is_archived").default(false).notNull(),
  threadId: uuid("thread_id"),
  replyToId: uuid("reply_to_id"),
  channelType: channelTypeEnum("channel_type"),
  externalMessageId: text("external_message_id"),
  attachments: text("attachments").array(),
  tags: text("tags").array(),
  recordStatus: recordStatusEnum("record_status").default('active'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messageRecipients = pgTable("message_recipients", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id).notNull(),
  messageId: uuid("message_id").references(() => messages.id).notNull(),
  recipientId: uuid("recipient_id").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMessageThreadSchema = createInsertSchema(messageThreads).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMessageRecipientSchema = createInsertSchema(messageRecipients).omit({ id: true, createdAt: true });

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertMessageThread = z.infer<typeof insertMessageThreadSchema>;
export type InsertMessageRecipient = z.infer<typeof insertMessageRecipientSchema>;

export type Message = typeof messages.$inferSelect;
export type MessageThread = typeof messageThreads.$inferSelect;
export type MessageRecipient = typeof messageRecipients.$inferSelect;
