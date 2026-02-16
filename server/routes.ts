import type { Express } from "express";
import { createServer, type Server } from "http";

import { uploadRouter } from "./routes/upload";
import { createGoogleAuthRoutes } from "./routes/google-auth";
import { createGoogleCalendarRoutes } from "./routes/google-calendar";
import { createCoreRoutes } from "./routes/core";
import { createPublicRoutes } from "./routes/public";
import { createOrganizationRoutes } from "./routes/organization";
import { createAnalyticsRoutes } from "./routes/analytics";
import { createCandidateRoutes } from "./routes/candidates";
import { createCampaignRoutes } from "./routes/campaigns";
import { createClientRoutes } from "./routes/clients";
import { createJobRoutes } from "./routes/jobs";
import { createPipelineRoutes } from "./routes/pipeline";
import { createCommunicationsRoutes } from "./routes/communications";
import { createAdminRoutes } from "./routes/admin";
import { createAuthRoutes } from "./routes/auth";
import { createBetaRoutes } from "./routes/beta";
import { createImportRoutes } from "./routes/imports";
import { createOfferLetterRoutes } from "./routes/offerLetters";

import { storage } from "./storage/index";
import { subdomainResolver } from './middleware/subdomainResolver';
import { startScheduledRefresh } from './lib/analyticsRefresh';

export async function registerRoutes(app: Express): Promise<Server> {
  console.log('📡 Registered all API routes');

  app.use(createCoreRoutes());
  app.use(createPublicRoutes());
  app.use(createOrganizationRoutes());
  app.use(createAnalyticsRoutes());
  app.use(createCandidateRoutes());
  app.use(createCampaignRoutes());
  app.use(createClientRoutes());
  app.use(createJobRoutes());
  app.use(createPipelineRoutes());
  app.use(createCommunicationsRoutes());
  app.use(createAdminRoutes());
  app.use(createAuthRoutes());
  app.use(createBetaRoutes());
  app.use(createImportRoutes());
  app.use(createOfferLetterRoutes());

  app.use("/api/upload", uploadRouter);

  app.use('/auth/google', createGoogleAuthRoutes(storage));
  app.use('/api/google', createGoogleCalendarRoutes(storage));
  console.log('✅ Mounted Google integration routes');

  const httpServer = createServer(app);

  startScheduledRefresh();

  console.log("📡 Registered all API routes");

  return httpServer;
}
