import { pgTable, text, uuid, timestamp, integer, varchar, numeric, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { organizations } from "./users";

export const aiInsightsCache = pgTable("ai_insights_cache", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id).notNull(),
  insightsData: jsonb("insights_data").notNull(),
  recruitmentMetrics: jsonb("recruitment_metrics").notNull(),
  generatedAt: timestamp("generated_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const aiInsightsMetrics = pgTable("ai_insights_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id).notNull(),
  totalInsightsGenerated: integer("total_insights_generated"),
  recommendationsImplemented: integer("recommendations_implemented"),
  recommendationsDismissed: integer("recommendations_dismissed"),
  avgUserRating: numeric("avg_user_rating", { precision: 2, scale: 1 }),
  apiCallsCount: integer("api_calls_count"),
  lastGenerationTime: timestamp("last_generation_time"),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const aiRecommendationsHistory = pgTable("ai_recommendations_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id).notNull(),
  recommendationId: varchar("recommendation_id", { length: 255 }).notNull(),
  recommendationType: varchar("recommendation_type", { length: 50 }).notNull(),
  priority: varchar("priority", { length: 20 }).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  impact: text("impact").notNull(),
  actionItems: jsonb("action_items"),
  confidence: integer("confidence"),
  userFeedback: varchar("user_feedback", { length: 20 }),
  implementedAt: timestamp("implemented_at"),
  dismissedAt: timestamp("dismissed_at"),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const insertAiInsightsCacheSchema = createInsertSchema(aiInsightsCache).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAiInsightsMetricsSchema = createInsertSchema(aiInsightsMetrics).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAiRecommendationsHistorySchema = createInsertSchema(aiRecommendationsHistory).omit({ id: true, createdAt: true, updatedAt: true });

export type InsertAiInsightsCache = z.infer<typeof insertAiInsightsCacheSchema>;
export type InsertAiInsightsMetrics = z.infer<typeof insertAiInsightsMetricsSchema>;
export type InsertAiRecommendationsHistory = z.infer<typeof insertAiRecommendationsHistorySchema>;

export type AiInsightsCache = typeof aiInsightsCache.$inferSelect;
export type AiInsightsMetrics = typeof aiInsightsMetrics.$inferSelect;
export type AiRecommendationsHistory = typeof aiRecommendationsHistory.$inferSelect;
