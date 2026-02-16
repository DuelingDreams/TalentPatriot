import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage/index';
import { supabase } from '../lib/supabase';
import { writeLimiter } from '../middleware/rate-limit';
import { type AuthenticatedRequest, requireAuth } from '../middleware/auth';
import { renderMergeFields, type MergeFieldContext } from '../../shared/utils/mergeFields';
import { toCamelCase } from '../../shared/utils/caseConversion';
import {
  insertDripCampaignSchema,
  insertCandidateCampaignEnrollmentSchema,
  insertCampaignEmailSchema,
  type DripCampaign,
  type CandidateCampaignEnrollment,
  type CampaignEmail
} from '../../shared/schema';

export function createCampaignRoutes() {
  const router = Router();

  // GET /api/campaigns - Get all campaigns for the org
  router.get("/api/campaigns", async (req, res) => {
    try {
      const orgId = req.headers['x-org-id'] as string || req.query.org_id as string;
      
      if (!orgId) {
        return res.status(400).json({ error: "Organization ID is required" });
      }

      const { data, error } = await supabase
        .from('drip_campaigns')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching campaigns:', error);
        throw error;
      }

      res.json(data || []);
    } catch (error) {
      console.error('Campaigns fetch error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: "Failed to fetch campaigns", details: errorMessage });
    }
  });

  // POST /api/campaigns - Create a new campaign
  router.post("/api/campaigns", writeLimiter, async (req, res) => {
    try {
      const orgId = req.headers['x-org-id'] as string;
      
      if (!orgId) {
        return res.status(400).json({ error: "Organization ID is required" });
      }

      const validatedData = insertDripCampaignSchema.parse({
        ...req.body,
        orgId
      });

      const { data, error } = await supabase
        .from('drip_campaigns')
        .insert({
          org_id: validatedData.orgId,
          name: validatedData.name,
          description: validatedData.description || null,
          status: validatedData.status || 'active',
          created_by: validatedData.createdBy || null
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating campaign:', error);
        throw error;
      }

      res.status(201).json(data);
    } catch (error) {
      console.error('Campaign creation error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`) 
        });
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: "Failed to create campaign", details: errorMessage });
    }
  });

  // PUT /api/campaigns/:campaignId - Update a campaign
  router.put("/api/campaigns/:campaignId", writeLimiter, async (req, res) => {
    try {
      const { campaignId } = req.params;
      const orgId = req.headers['x-org-id'] as string;
      
      if (!orgId) {
        return res.status(400).json({ error: "Organization ID is required" });
      }

      const { data: existing, error: fetchError } = await supabase
        .from('drip_campaigns')
        .select('*')
        .eq('id', campaignId)
        .eq('org_id', orgId)
        .single();

      if (fetchError || !existing) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      const updateSchema = insertDripCampaignSchema.partial();
      const validatedBody = updateSchema.parse(req.body);

      const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
      
      if (validatedBody.name !== undefined) updateData.name = validatedBody.name;
      if (validatedBody.description !== undefined) updateData.description = validatedBody.description;
      if (validatedBody.status !== undefined) updateData.status = validatedBody.status;
      if (validatedBody.triggerType !== undefined) updateData.trigger_type = validatedBody.triggerType;
      if (validatedBody.triggerConditions !== undefined) updateData.trigger_conditions = validatedBody.triggerConditions;
      if (validatedBody.rules !== undefined) updateData.rules = validatedBody.rules;

      const { data, error } = await supabase
        .from('drip_campaigns')
        .update(updateData)
        .eq('id', campaignId)
        .eq('org_id', orgId)
        .select()
        .single();

      if (error) {
        console.error('Error updating campaign:', error);
        throw error;
      }

      res.json(data);
    } catch (error) {
      console.error('Campaign update error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`) 
        });
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: "Failed to update campaign", details: errorMessage });
    }
  });

  // DELETE /api/campaigns/:campaignId - Delete a campaign
  router.delete("/api/campaigns/:campaignId", writeLimiter, async (req, res) => {
    try {
      const { campaignId } = req.params;
      const orgId = req.headers['x-org-id'] as string;
      
      if (!orgId) {
        return res.status(400).json({ error: "Organization ID is required" });
      }

      const { error } = await supabase
        .from('drip_campaigns')
        .delete()
        .eq('id', campaignId)
        .eq('org_id', orgId);

      if (error) {
        console.error('Error deleting campaign:', error);
        throw error;
      }

      res.json({ success: true, message: "Campaign deleted successfully" });
    } catch (error) {
      console.error('Campaign delete error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: "Failed to delete campaign", details: errorMessage });
    }
  });

  // GET /api/candidates/:candidateId/campaigns - Get campaign enrollments for a candidate
  router.get("/api/candidates/:candidateId/campaigns", async (req, res) => {
    try {
      const { candidateId } = req.params;
      const orgId = req.headers['x-org-id'] as string;
      
      if (!orgId) {
        return res.status(400).json({ error: "Organization ID is required" });
      }

      const candidate = await storage.candidates.getCandidate(candidateId);
      if (!candidate) {
        return res.status(404).json({ error: "Candidate not found" });
      }
      
      if (candidate.orgId && candidate.orgId !== orgId) {
        return res.status(404).json({ error: "Candidate not found" });
      }

      const { data, error } = await supabase
        .from('candidate_campaign_enrollments')
        .select('*, drip_campaigns(id, name, description, status)')
        .eq('candidate_id', candidateId)
        .eq('org_id', orgId)
        .order('enrolled_at', { ascending: false });

      if (error) {
        console.error('Error fetching campaign enrollments:', error);
        throw error;
      }

      res.json(data || []);
    } catch (error) {
      console.error('Campaign enrollments fetch error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: "Failed to fetch campaign enrollments", details: errorMessage });
    }
  });

  // POST /api/candidates/:candidateId/campaigns/:campaignId/enroll - Enroll candidate in a campaign
  router.post("/api/candidates/:candidateId/campaigns/:campaignId/enroll", writeLimiter, async (req, res) => {
    try {
      const { candidateId, campaignId } = req.params;
      const orgId = req.headers['x-org-id'] as string;
      
      if (!orgId) {
        return res.status(400).json({ error: "Organization ID is required" });
      }

      const candidate = await storage.candidates.getCandidate(candidateId);
      if (!candidate) {
        return res.status(404).json({ error: "Candidate not found" });
      }
      
      if (candidate.orgId && candidate.orgId !== orgId) {
        return res.status(404).json({ error: "Candidate not found" });
      }

      const { data: campaign, error: campaignError } = await supabase
        .from('drip_campaigns')
        .select('*')
        .eq('id', campaignId)
        .eq('org_id', orgId)
        .single();

      if (campaignError || !campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      const { data: existing } = await supabase
        .from('candidate_campaign_enrollments')
        .select('id')
        .eq('candidate_id', candidateId)
        .eq('campaign_id', campaignId)
        .single();

      if (existing) {
        return res.status(400).json({ error: "Candidate is already enrolled in this campaign" });
      }

      const { data, error } = await supabase
        .from('candidate_campaign_enrollments')
        .insert({
          org_id: orgId,
          candidate_id: candidateId,
          campaign_id: campaignId,
          status: 'active'
        })
        .select('*, drip_campaigns(id, name, description, status)')
        .single();

      if (error) {
        console.error('Error enrolling candidate in campaign:', error);
        throw error;
      }

      res.status(201).json(data);
    } catch (error) {
      console.error('Campaign enrollment error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: "Failed to enroll candidate in campaign", details: errorMessage });
    }
  });

  // DELETE /api/candidates/:candidateId/campaigns/:enrollmentId - Remove candidate from a campaign
  router.delete("/api/candidates/:candidateId/campaigns/:enrollmentId", writeLimiter, async (req, res) => {
    try {
      const { candidateId, enrollmentId } = req.params;
      const orgId = req.headers['x-org-id'] as string;
      
      if (!orgId) {
        return res.status(400).json({ error: "Organization ID is required" });
      }

      const { data: existing, error: fetchError } = await supabase
        .from('candidate_campaign_enrollments')
        .select('*')
        .eq('id', enrollmentId)
        .eq('candidate_id', candidateId)
        .eq('org_id', orgId)
        .single();

      if (fetchError || !existing) {
        return res.status(404).json({ error: "Campaign enrollment not found" });
      }

      const { error } = await supabase
        .from('candidate_campaign_enrollments')
        .delete()
        .eq('id', enrollmentId);

      if (error) {
        console.error('Error removing candidate from campaign:', error);
        throw error;
      }

      res.json({ success: true, message: "Campaign enrollment removed successfully" });
    } catch (error) {
      console.error('Campaign enrollment deletion error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: "Failed to remove campaign enrollment", details: errorMessage });
    }
  });

  // ==================== CAMPAIGN EMAILS API ====================
  // GET /api/campaigns/:campaignId/emails - Get all emails for a campaign
  router.get("/api/campaigns/:campaignId/emails", async (req, res) => {
    try {
      const { campaignId } = req.params;
      const orgId = req.headers['x-org-id'] as string;
      
      if (!orgId) {
        return res.status(400).json({ error: "Organization ID is required" });
      }

      const { data: campaign, error: campaignError } = await supabase
        .from('drip_campaigns')
        .select('id')
        .eq('id', campaignId)
        .eq('org_id', orgId)
        .single();

      if (campaignError || !campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      const { data, error } = await supabase
        .from('campaign_emails')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('delay_days', { ascending: true })
        .order('sequence_order', { ascending: true });

      if (error) {
        console.error('Error fetching campaign emails:', error);
        throw error;
      }

      const camelCaseData = (data || []).map(email => toCamelCase(email));
      res.json(camelCaseData);
    } catch (error) {
      console.error('Campaign emails fetch error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: "Failed to fetch campaign emails", details: errorMessage });
    }
  });

  // POST /api/campaigns/:campaignId/emails - Create a new email in a campaign
  router.post("/api/campaigns/:campaignId/emails", writeLimiter, async (req, res) => {
    try {
      const { campaignId } = req.params;
      const orgId = req.headers['x-org-id'] as string;
      
      if (!orgId) {
        return res.status(400).json({ error: "Organization ID is required" });
      }

      const { data: campaign, error: campaignError } = await supabase
        .from('drip_campaigns')
        .select('id')
        .eq('id', campaignId)
        .eq('org_id', orgId)
        .single();

      if (campaignError || !campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      const emailData = z.object({
        subject: z.string().min(1),
        body: z.string().optional().nullable(),
        delayDays: z.number().min(0).optional().default(0),
      }).parse(req.body);

      const { data: existingEmails } = await supabase
        .from('campaign_emails')
        .select('sequence_order')
        .eq('campaign_id', campaignId)
        .order('sequence_order', { ascending: false })
        .limit(1);

      const nextSequenceOrder = existingEmails && existingEmails.length > 0 
        ? (existingEmails[0].sequence_order || 0) + 1 
        : 1;

      const { data, error } = await supabase
        .from('campaign_emails')
        .insert({
          campaign_id: campaignId,
          subject: emailData.subject,
          body: emailData.body || null,
          delay_days: emailData.delayDays,
          sequence_order: nextSequenceOrder
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating campaign email:', error);
        throw error;
      }

      res.status(201).json(toCamelCase(data));
    } catch (error) {
      console.error('Campaign email creation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: "Failed to create campaign email", details: errorMessage });
    }
  });

  // PUT /api/campaigns/:campaignId/emails/:emailId - Update a campaign email
  router.put("/api/campaigns/:campaignId/emails/:emailId", writeLimiter, async (req, res) => {
    try {
      const { campaignId, emailId } = req.params;
      const orgId = req.headers['x-org-id'] as string;
      
      if (!orgId) {
        return res.status(400).json({ error: "Organization ID is required" });
      }

      const { data: campaign, error: campaignError } = await supabase
        .from('drip_campaigns')
        .select('id')
        .eq('id', campaignId)
        .eq('org_id', orgId)
        .single();

      if (campaignError || !campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      const { data: existingEmail, error: emailError } = await supabase
        .from('campaign_emails')
        .select('id')
        .eq('id', emailId)
        .eq('campaign_id', campaignId)
        .single();

      if (emailError || !existingEmail) {
        return res.status(404).json({ error: "Campaign email not found" });
      }

      const updateData: Record<string, any> = {};
      if (req.body.subject !== undefined) updateData.subject = req.body.subject;
      if (req.body.body !== undefined) updateData.body = req.body.body;
      if (req.body.delayDays !== undefined) updateData.delay_days = req.body.delayDays;
      if (req.body.sequenceOrder !== undefined) updateData.sequence_order = req.body.sequenceOrder;
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('campaign_emails')
        .update(updateData)
        .eq('id', emailId)
        .select()
        .single();

      if (error) {
        console.error('Error updating campaign email:', error);
        throw error;
      }

      res.json(toCamelCase(data));
    } catch (error) {
      console.error('Campaign email update error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: "Failed to update campaign email", details: errorMessage });
    }
  });

  // DELETE /api/campaigns/:campaignId/emails/:emailId - Delete a campaign email
  router.delete("/api/campaigns/:campaignId/emails/:emailId", writeLimiter, async (req, res) => {
    try {
      const { campaignId, emailId } = req.params;
      const orgId = req.headers['x-org-id'] as string;
      
      if (!orgId) {
        return res.status(400).json({ error: "Organization ID is required" });
      }

      const { data: campaign, error: campaignError } = await supabase
        .from('drip_campaigns')
        .select('id')
        .eq('id', campaignId)
        .eq('org_id', orgId)
        .single();

      if (campaignError || !campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      const { error } = await supabase
        .from('campaign_emails')
        .delete()
        .eq('id', emailId)
        .eq('campaign_id', campaignId);

      if (error) {
        console.error('Error deleting campaign email:', error);
        throw error;
      }

      res.json({ success: true, message: "Campaign email deleted successfully" });
    } catch (error) {
      console.error('Campaign email deletion error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: "Failed to delete campaign email", details: errorMessage });
    }
  });

  // POST /api/campaigns/:campaignId/emails/:emailId/preview - Preview email with merge fields rendered
  router.post("/api/campaigns/:campaignId/emails/:emailId/preview", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { campaignId, emailId } = req.params;
      const { candidateId, jobId } = req.body;
      const orgId = req.headers['x-org-id'] as string;
      
      if (!orgId) {
        return res.status(400).json({ error: "Organization ID is required" });
      }

      const { data: campaign, error: campaignError } = await supabase
        .from('drip_campaigns')
        .select('id')
        .eq('id', campaignId)
        .eq('org_id', orgId)
        .single();

      if (campaignError || !campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      const { data: email, error: emailError } = await supabase
        .from('campaign_emails')
        .select('*')
        .eq('id', emailId)
        .eq('campaign_id', campaignId)
        .single();

      if (emailError || !email) {
        return res.status(404).json({ error: "Campaign email not found" });
      }

      const context: MergeFieldContext = {};

      if (candidateId) {
        const { data: candidate } = await supabase
          .from('candidates')
          .select('name, email, phone, location, current_title, current_company')
          .eq('id', candidateId)
          .eq('org_id', orgId)
          .single();
          
        if (candidate) {
          const nameParts = (candidate.name || '').split(' ');
          context.candidate = {
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
            name: candidate.name || '',
            email: candidate.email || '',
            phone: candidate.phone || '',
            location: candidate.location || '',
            currentTitle: candidate.current_title || '',
            currentCompany: candidate.current_company || '',
          };
        }
      }

      if (jobId) {
        const { data: job } = await supabase
          .from('jobs')
          .select('title, location, department, employment_type, client_id')
          .eq('id', jobId)
          .eq('org_id', orgId)
          .single();
          
        if (job) {
          context.job = {
            title: job.title || '',
            location: job.location || '',
            department: job.department || '',
            employmentType: job.employment_type || '',
          };

          if (job.client_id) {
            const { data: client } = await supabase
              .from('clients')
              .select('name')
              .eq('id', job.client_id)
              .eq('org_id', orgId)
              .single();
              
            if (client) {
              context.company = {
                name: client.name || '',
              };
            }
          }
        }
      }

      if (!context.company) {
        const { data: org } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', orgId)
          .single();
        if (org) {
          context.company = { name: org.name || '' };
        }
      }

      const userId = req.headers['x-user-id'] as string;
      if (userId) {
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('full_name, email, title')
          .eq('id', userId)
          .single();
        if (userProfile) {
          context.recruiter = {
            name: userProfile.full_name || '',
            email: userProfile.email || '',
            title: userProfile.title || '',
          };
        }
      }

      const renderedSubject = renderMergeFields(email.subject || '', context);
      const renderedBody = renderMergeFields(email.body || '', context);

      res.json({
        original: {
          subject: email.subject,
          body: email.body,
        },
        rendered: {
          subject: renderedSubject,
          body: renderedBody,
        },
        context,
      });
    } catch (error) {
      console.error('Email preview error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: "Failed to preview email", details: errorMessage });
    }
  });

  // GET /api/enrollments/:enrollmentId/email-sends - Get email sends for an enrollment
  router.get("/api/enrollments/:enrollmentId/email-sends", async (req, res) => {
    try {
      const { enrollmentId } = req.params;
      const orgId = req.headers['x-org-id'] as string;
      
      if (!orgId) {
        return res.status(400).json({ error: "Organization ID is required" });
      }

      const { data: enrollment, error: enrollmentError } = await supabase
        .from('candidate_campaign_enrollments')
        .select('id')
        .eq('id', enrollmentId)
        .eq('org_id', orgId)
        .single();

      if (enrollmentError || !enrollment) {
        return res.status(404).json({ error: "Enrollment not found" });
      }

      const { data, error } = await supabase
        .from('campaign_email_sends')
        .select('*, campaign_emails(id, subject, delay_days, order_index)')
        .eq('enrollment_id', enrollmentId)
        .order('scheduled_at', { ascending: true });

      if (error) {
        console.error('Error fetching email sends:', error);
        throw error;
      }

      res.json(data || []);
    } catch (error) {
      console.error('Email sends fetch error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: "Failed to fetch email sends", details: errorMessage });
    }
  });

  return router;
}
