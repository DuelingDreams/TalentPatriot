import { pgTable, text, uuid, timestamp, boolean, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { organizations } from "./users";
import { providerEnum, connectionHealthEnum } from "./enums";

export const oauthSessions = pgTable("oauth_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionTokenHash: text("session_token_hash").notNull(),
  userId: uuid("user_id").notNull(),
  orgId: uuid("org_id").references(() => organizations.id).notNull(),
  returnTo: text("return_to").default('/settings/integrations'),
  stateNonce: text("state_nonce").notNull(),
  redirectHost: text("redirect_host"),
  expiresAt: timestamp("expires_at").notNull(),
  consumedAt: timestamp("consumed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdIp: text("created_ip"),
  userAgent: text("user_agent"),
}, (table) => ({
  uniqueTokenHash: uniqueIndex("unique_oauth_session_token").on(table.sessionTokenHash),
  expiryIdx: index("idx_oauth_sessions_expiry").on(table.expiresAt, table.consumedAt),
}));

export const connectedAccounts = pgTable("connected_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  orgId: uuid("org_id").references(() => organizations.id).notNull(),
  provider: providerEnum("provider").notNull(),
  providerEmail: text("provider_email"),
  scopes: text("scopes").array().default(sql`ARRAY[]::text[]`),
  connectorAccountId: text("connector_account_id"),
  encryptedRefreshToken: text("encrypted_refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  lastUsedAt: timestamp("last_used_at"),
  isActive: boolean("is_active").default(true).notNull(),
  connectedAt: timestamp("connected_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  healthStatus: connectionHealthEnum("health_status").default('unknown'),
  lastValidatedAt: timestamp("last_validated_at"),
  lastErrorCode: text("last_error_code"),
  lastErrorMessage: text("last_error_message"),
  needsAttention: boolean("needs_attention").default(false),
}, (table) => ({
  uniqueUserProvider: uniqueIndex("unique_user_provider").on(table.userId, table.orgId, table.provider),
  userIdx: index("idx_connected_accounts_user_id").on(table.userId),
  providerIdx: index("idx_connected_accounts_provider").on(table.provider),
  healthIdx: index("idx_connected_accounts_health").on(table.healthStatus, table.needsAttention),
}));

export const insertOAuthSessionSchema = createInsertSchema(oauthSessions).omit({ id: true, createdAt: true });
export const insertConnectedAccountSchema = createInsertSchema(connectedAccounts).omit({ id: true, createdAt: true, updatedAt: true, connectedAt: true });

export type InsertOAuthSession = z.infer<typeof insertOAuthSessionSchema>;
export type InsertConnectedAccount = z.infer<typeof insertConnectedAccountSchema>;

export type OAuthSession = typeof oauthSessions.$inferSelect;
export type ConnectedAccount = typeof connectedAccounts.$inferSelect;
