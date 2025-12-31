import { pgTable, text, uuid, timestamp, varchar, boolean, integer, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { userRoleEnum, orgRoleEnum } from "./enums";

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  ownerId: uuid("owner_id").notNull(),
  slug: text("slug"),
  seatsPurchased: integer("seats_purchased").default(0).notNull(),
  planTier: varchar("plan_tier", { length: 50 }).default('starter'),
}, (table) => ({
  uniqueSlug: uniqueIndex("unique_org_slug").on(table.slug),
}));

export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").primaryKey(),
  role: userRoleEnum("role").default('user').notNull(),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  jobTitle: varchar("job_title", { length: 255 }),
  department: varchar("department", { length: 255 }),
  location: varchar("location", { length: 255 }),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userSettings = pgTable("user_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  emailNotifications: boolean("email_notifications").default(true),
  browserNotifications: boolean("browser_notifications").default(true),
  weeklyReports: boolean("weekly_reports").default(false),
  teamInvites: boolean("team_invites").default(true),
  publicProfile: boolean("public_profile").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUserSettings: uniqueIndex("unique_user_settings").on(table.userId),
}));

export const userOrganizations = pgTable("user_organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  orgId: uuid("org_id").references(() => organizations.id).notNull(),
  role: orgRoleEnum("role").notNull(),
  isRecruiterSeat: boolean("is_recruiter_seat").default(false).notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUserOrg: uniqueIndex("unique_user_org").on(table.userId, table.orgId),
}));

export const insertOrganizationSchema = createInsertSchema(organizations).omit({ id: true, createdAt: true });
export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({ createdAt: true, updatedAt: true });
export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUserOrganizationSchema = createInsertSchema(userOrganizations).omit({ id: true, joinedAt: true });

export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type InsertUserOrganization = z.infer<typeof insertUserOrganizationSchema>;

export type Organization = typeof organizations.$inferSelect;
export type UserProfile = typeof userProfiles.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;
export type UserOrganization = typeof userOrganizations.$inferSelect;
