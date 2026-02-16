import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage/index';
import { type AuthenticatedRequest, requireAuth, requirePlatformAdmin, supabaseAdmin } from '../middleware/auth';
import { writeLimiter } from '../middleware/rate-limit';
import { sendEmail, sendBetaConfirmationEmail, betaConfirmationTemplate, betaApprovalTemplate } from '../services/email';

export function createBetaRoutes() {
  const router = Router();

  const betaApplicationSchema = z.object({
    companyName: z.string().min(1, "Company name is required"),
    contactName: z.string().min(1, "Contact name is required"),
    email: z.string().email("Valid email is required"),
    phone: z.string().optional(),
    website: z.string().url().optional().or(z.literal("")),
    companySize: z.string().min(1, "Company size is required"),
    currentAts: z.string().optional(),
    painPoints: z.string().min(1, "Pain points are required"),
    expectations: z.string().optional(),
  });

  router.post("/api/beta/apply", writeLimiter, async (req, res) => {
    console.info('[API]', req.method, req.url);
    try {
      const validatedData = betaApplicationSchema.parse(req.body);
      
      const betaApplication = await storage.beta.createBetaApplication({
        ...validatedData,
        status: 'pending',
      });
      
      try {
        const firstName = validatedData.contactName.split(' ')[0];
        const result = await sendBetaConfirmationEmail({
          to: validatedData.email,
          firstName,
        });
        if (result.success) {
          console.info('[API] Beta confirmation email sent to:', validatedData.email, 'messageId:', result.messageId);
        } else {
          console.error('[API] Beta confirmation email failed:', result.error);
        }
      } catch (emailError) {
        console.error('[API] Failed to send beta confirmation email:', emailError);
      }

      try {
        const { betaApplicationNotificationTemplate } = await import('../services/email/templates');
        await sendEmail({
          to: 'contact@talentpatriot.com',
          subject: `New Beta Application: ${validatedData.companyName}`,
          html: betaApplicationNotificationTemplate({
            contactName: validatedData.contactName,
            email: validatedData.email,
            companyName: validatedData.companyName,
            companySize: validatedData.companySize,
            role: validatedData.role,
            painPoints: validatedData.painPoints,
            currentAts: validatedData.currentAts,
            expectations: validatedData.expectations,
            adminDashboardUrl: `${process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'https://talentpatriot.com'}/admin/beta-applications`,
          }),
        });
        console.info('[API] Beta application notification sent to admin');
      } catch (emailError) {
        console.error('[API] Failed to send admin notification email:', emailError);
      }
      
      console.info('[API] POST /api/beta/apply →', { success: true, id: betaApplication.id });
      res.status(201).json({ 
        success: true, 
        message: "Beta application submitted successfully! We'll review your application and get back to you soon.",
        id: betaApplication.id 
      });
    } catch (error) {
      console.error('Beta application submission error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`) 
        });
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: "Failed to submit beta application", details: errorMessage });
    }
  });

  router.get("/api/beta/applications", requireAuth, requirePlatformAdmin, async (req: AuthenticatedRequest, res) => {
    console.info('[API]', req.method, req.url, 'User:', req.user?.email);
    try {
      const betaApplications = await storage.beta.getBetaApplications();
      
      const normalizedApplications = betaApplications;
      
      console.info('[API] GET /api/beta/applications →', { success: true, count: normalizedApplications.length });
      res.json(normalizedApplications);
    } catch (error) {
      console.error('Beta applications fetch error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: "Failed to fetch beta applications", details: errorMessage });
    }
  });

  router.get("/api/beta/applications/:id", requireAuth, requirePlatformAdmin, async (req: AuthenticatedRequest, res) => {
    console.info('[API]', req.method, req.url, 'User:', req.user?.email);
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ error: "Application ID is required" });
      }
      
      const betaApplication = await storage.beta.getBetaApplication(id);
      
      if (!betaApplication) {
        return res.status(404).json({ error: "Beta application not found" });
      }
      
      const normalizedApplication = betaApplication;
      
      console.info('[API] GET /api/beta/applications/:id →', { success: true, id });
      res.json(normalizedApplication);
    } catch (error) {
      console.error('Beta application fetch error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: "Failed to fetch beta application", details: errorMessage });
    }
  });

  const updateBetaApplicationSchema = z.object({
    status: z.enum(['pending', 'reviewing', 'approved', 'rejected', 'waitlist']).optional(),
    reviewNotes: z.string().optional(),
    reviewedBy: z.string().optional(),
  });

  router.put("/api/beta/applications/:id", requireAuth, requirePlatformAdmin, writeLimiter, async (req: AuthenticatedRequest, res) => {
    console.info('[API]', req.method, req.url, 'User:', req.user?.email);
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ error: "Application ID is required" });
      }
      
      const validatedData = updateBetaApplicationSchema.parse(req.body);
      
      const originalApplication = await storage.beta.getBetaApplication(id);
      
      const updateData = { ...validatedData };
      if (validatedData.status && validatedData.status !== 'pending') {
        (updateData as any).reviewedAt = new Date();
        (updateData as any).reviewedBy = req.user?.id;
      }
      
      const updatedApplication = await storage.beta.updateBetaApplication(id, updateData);
      
      if (validatedData.status === 'approved' && originalApplication && originalApplication.status !== 'approved') {
        try {
          const baseUrl = process.env.REPLIT_DEV_DOMAIN 
            ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
            : 'https://talentpatriot.com';
          
          await sendEmail({
            to: originalApplication.email,
            subject: 'You\'re Approved! Welcome to TalentPatriot Beta 🎉',
            html: betaApprovalTemplate({
              contactName: originalApplication.contactName,
              companyName: originalApplication.companyName,
              onboardingUrl: `${baseUrl}/onboarding/step1?beta=${id}`,
            }),
          });
          console.info('[API] Beta approval email sent to:', originalApplication.email);
        } catch (emailError) {
          console.error('[API] Failed to send beta approval email:', emailError);
        }
      }
      
      const normalizedApplication = updatedApplication;
      
      console.info('[API] PUT /api/beta/applications/:id →', { success: true, id, status: validatedData.status });
      res.json({ 
        success: true, 
        message: "Beta application updated successfully",
        application: normalizedApplication 
      });
    } catch (error) {
      console.error('Beta application update error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`) 
        });
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('not found') || errorMessage.includes('Not found')) {
        return res.status(404).json({ error: "Beta application not found", details: errorMessage });
      }
      res.status(500).json({ error: "Failed to update beta application", details: errorMessage });
    }
  });

  router.delete("/api/beta/applications/:id", writeLimiter, async (req, res) => {
    console.info('[API]', req.method, req.url);
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ error: "Application ID is required" });
      }
      
      await storage.beta.deleteBetaApplication(id);
      
      console.info('[API] DELETE /api/beta/applications/:id →', { success: true, id });
      res.json({ 
        success: true, 
        message: "Beta application deleted successfully" 
      });
    } catch (error) {
      console.error('Beta application deletion error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('not found') || errorMessage.includes('Not found')) {
        return res.status(404).json({ error: "Beta application not found", details: errorMessage });
      }
      res.status(500).json({ error: "Failed to delete beta application", details: errorMessage });
    }
  });

  router.post("/api/beta/applications/:id/schedule-call", requireAuth, requirePlatformAdmin, writeLimiter, async (req: AuthenticatedRequest, res) => {
    console.info('[API]', req.method, req.url, 'User:', req.user?.email);
    try {
      const { id } = req.params;
      const { scheduledCallAt } = req.body;
      
      if (!id) {
        return res.status(400).json({ error: "Application ID is required" });
      }
      
      if (!scheduledCallAt) {
        return res.status(400).json({ error: "Scheduled call date/time is required" });
      }
      
      const updatedApplication = await storage.beta.updateBetaApplication(id, {
        scheduledCallAt: new Date(scheduledCallAt),
        status: 'reviewing',
      });
      
      console.info('[API] POST /api/beta/applications/:id/schedule-call →', { success: true, id });
      res.json({ 
        success: true, 
        message: "Call scheduled successfully",
        application: updatedApplication
      });
    } catch (error) {
      console.error('Beta application schedule call error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: "Failed to schedule call", details: errorMessage });
    }
  });

  router.post("/api/beta/applications/:id/complete-call", requireAuth, requirePlatformAdmin, writeLimiter, async (req: AuthenticatedRequest, res) => {
    console.info('[API]', req.method, req.url, 'User:', req.user?.email);
    try {
      const { id } = req.params;
      const { callNotes, approved } = req.body;
      
      if (!id) {
        return res.status(400).json({ error: "Application ID is required" });
      }
      
      const newStatus = approved ? 'approved' : 'rejected';
      
      const updatedApplication = await storage.beta.updateBetaApplication(id, {
        callCompletedAt: new Date(),
        callNotes,
        status: newStatus,
        reviewedAt: new Date(),
        reviewedBy: req.user?.id,
      });
      
      console.info('[API] POST /api/beta/applications/:id/complete-call →', { success: true, id, approved });
      res.json({ 
        success: true, 
        message: approved ? "Call completed - applicant approved" : "Call completed - applicant not approved",
        application: updatedApplication
      });
    } catch (error) {
      console.error('Beta application complete call error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: "Failed to complete call", details: errorMessage });
    }
  });

  router.post("/api/beta/applications/:id/send-magic-link", requireAuth, requirePlatformAdmin, writeLimiter, async (req: AuthenticatedRequest, res) => {
    console.info('[API]', req.method, req.url, 'User:', req.user?.email);
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ error: "Application ID is required" });
      }
      
      const application = await storage.beta.getBetaApplication(id);
      if (!application) {
        return res.status(404).json({ error: "Beta application not found" });
      }
      
      if (application.status !== 'approved') {
        return res.status(400).json({ error: "Can only send magic link to approved applicants" });
      }
      
      if (!supabaseAdmin) {
        return res.status(500).json({ error: "Admin client not configured - cannot generate magic link" });
      }
      
      const baseUrl = process.env.VITE_APP_URL || process.env.APP_URL || 'https://talentpatriot.com';
      const { data, error: magicLinkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: application.email,
        options: {
          redirectTo: `${baseUrl}/onboarding`,
        }
      });
      
      if (magicLinkError || !data?.properties?.action_link) {
        console.error('Magic link generation error:', magicLinkError);
        return res.status(500).json({ 
          error: "Failed to generate magic link", 
          details: magicLinkError?.message || 'No link generated' 
        });
      }
      
      const firstName = application.contactName.split(' ')[0];
      const { sendBetaMagicLinkEmail } = await import('../services/email/resend');
      const emailResult = await sendBetaMagicLinkEmail({
        to: application.email,
        firstName,
        magicLink: data.properties.action_link,
      });
      
      if (!emailResult.success) {
        return res.status(500).json({ error: "Failed to send magic link email", details: emailResult.error });
      }
      
      await storage.beta.updateBetaApplication(id, {
        magicLinkSentAt: new Date(),
      });
      
      console.info('[API] POST /api/beta/applications/:id/send-magic-link →', { 
        success: true, 
        id, 
        email: application.email,
        messageId: emailResult.messageId 
      });
      
      res.json({ 
        success: true, 
        message: `Magic link sent to ${application.email}`,
        messageId: emailResult.messageId
      });
    } catch (error) {
      console.error('Beta application send magic link error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: "Failed to send magic link", details: errorMessage });
    }
  });

  return router;
}
