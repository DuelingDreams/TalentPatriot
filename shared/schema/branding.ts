import { pgTable, text, uuid, timestamp, boolean, jsonb, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { organizations } from "./users";
import { brandingChannelEnum } from "./enums";

export const organizationBranding = pgTable("organization_branding", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  channel: brandingChannelEnum("channel").default('careers').notNull(),
  logoUrl: text("logo_url"),
  faviconUrl: text("favicon_url"),
  primaryColor: text("primary_color").default('#1E3A5F'),
  secondaryColor: text("secondary_color").default('#14B8A6'),
  accentColor: text("accent_color"),
  fontFamily: text("font_family").default('Inter'),
  headerText: text("header_text"),
  footerText: text("footer_text"),
  customCss: text("custom_css"),
  isPublished: boolean("is_published").default(false),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueOrgChannel: unique("unique_org_channel").on(table.orgId, table.channel),
}));

export const insertOrganizationBrandingSchema = createInsertSchema(organizationBranding).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
});

export type InsertOrganizationBranding = z.infer<typeof insertOrganizationBrandingSchema>;
export type OrganizationBranding = typeof organizationBranding.$inferSelect;
