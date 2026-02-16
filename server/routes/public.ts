import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage/index';
import { supabaseAdmin } from '../middleware/auth';
import { mapPublicJobRow } from './utils';

export function createPublicRoutes() {
  const router = Router();

  const publicJobsQuerySchema = z.object({
    limit: z.string().optional().refine(val => !val || !isNaN(Number(val)), "Limit must be a number"),
    offset: z.string().optional().refine(val => !val || !isNaN(Number(val)), "Offset must be a number"),
    location: z.string().optional(),
    search: z.string().optional(),
    orgSlug: z.string().optional()
  });

  router.get("/api/public/jobs", async (req, res) => {
    try {
      const queryParse = publicJobsQuerySchema.safeParse(req.query);
      if (!queryParse.success) {
        return res.status(400).json({ 
          error: "Invalid query parameters", 
          details: queryParse.error.errors.map(e => `${e.path.join('.')}: ${e.message}`) 
        });
      }
      
      const { orgSlug } = queryParse.data;
      let orgId: string | undefined;
      
      if (orgSlug) {
        try {
          const organizations = await storage.auth.getOrganizations();
          const organization = organizations.find(org => 
            org.slug === orgSlug || 
            org.name.toLowerCase().replace(/[^a-z0-9]/g, '-') === orgSlug ||
            org.name.toLowerCase().replace(/\s+/g, '-') === orgSlug
          );
          
          if (organization) {
            orgId = organization.id;
          }
        } catch (orgError) {
          console.error('Error looking up organization:', orgError);
          console.log('[API] Falling back to all jobs due to organization lookup error');
        }
      }
      
      const openJobs = await storage.jobs.getPublicJobs(orgId);
      res.json(openJobs.map(mapPublicJobRow));
    } catch (error) {
      console.error('Error fetching public jobs:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: "Failed to fetch job listings", details: errorMessage });
    }
  });

  router.get("/api/public/branding", async (req, res) => {
    try {
      const { orgSlug } = req.query as { orgSlug?: string };
      
      if (!orgSlug) {
        return res.json({});
      }

      const organizations = await storage.auth.getOrganizations();
      const organization = organizations.find(org => 
        org.slug === orgSlug || 
        org.name.toLowerCase().replace(/[^a-z0-9]/g, '-') === orgSlug ||
        org.name.toLowerCase().replace(/\s+/g, '-') === orgSlug
      );

      if (!organization) {
        return res.json({});
      }

      const { data: branding } = await supabaseAdmin
        .from('organization_branding')
        .select('logo_url, favicon_url, primary_color, accent_color, tagline, about_text, header_text, footer_text')
        .eq('org_id', organization.id)
        .eq('channel', 'careers')
        .maybeSingle();

      res.json({
        organizationName: organization.name,
        ...(branding || {})
      });
    } catch (error) {
      console.error('Error fetching public branding:', error);
      res.json({});
    }
  });

  const jobSlugSchema = z.object({
    slug: z.string().min(1, "Job slug is required").max(100, "Job slug too long")
  });
  
  const jobSlugQuerySchema = z.object({
    orgSlug: z.string().optional()
  });

  router.get("/api/public/jobs/slug/:slug", async (req, res) => {
    try {
      const paramsParse = jobSlugSchema.safeParse({ slug: req.params.slug });
      const queryParse = jobSlugQuerySchema.safeParse(req.query);
      
      if (!paramsParse.success) {
        return res.status(400).json({ 
          error: "Invalid slug parameter", 
          details: paramsParse.error.errors.map(e => `${e.path.join('.')}: ${e.message}`) 
        });
      }
      
      if (!queryParse.success) {
        return res.status(400).json({ 
          error: "Invalid query parameters", 
          details: queryParse.error.errors.map(e => `${e.path.join('.')}: ${e.message}`) 
        });
      }
      
      const { slug } = paramsParse.data;
      const { orgSlug } = queryParse.data;
      let orgId: string | undefined;
      
      console.log(`[API] GET /api/public/jobs/slug/${slug} | Looking for job with slug: ${slug}, orgSlug: ${orgSlug}`);
      
      if (orgSlug) {
        try {
          const organizations = await storage.auth.getOrganizations();
          const organization = organizations.find(org => 
            org.slug === orgSlug || 
            org.name.toLowerCase().replace(/[^a-z0-9]/g, '-') === orgSlug
          );
          
          if (organization) {
            orgId = organization.id;
          } else {
            return res.status(404).json({ error: "Organization not found" });
          }
        } catch (orgError) {
          console.error('Error looking up organization:', orgError);
          return res.status(500).json({ error: "Failed to lookup organization" });
        }
      }
      
      const allJobs = await storage.jobs.getPublicJobs(orgId);
      const job = allJobs.find(job => job.public_slug === slug && job.status === 'open');
      
      console.log(`[API] Found jobs: ${allJobs.length}, Looking for slug: ${slug}`);
      console.log(`[API] Available slugs: ${allJobs.map(j => j.public_slug).join(', ')}`);
      
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      
      console.log(`[API] Job found: ${job.title} (ID: ${job.id})`);
      res.json(mapPublicJobRow(job));
    } catch (error) {
      console.error('Error fetching job by slug:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: "Failed to fetch job", details: errorMessage });
    }
  });

  return router;
}
