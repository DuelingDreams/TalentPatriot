import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage/index';
import { writeLimiter, publicJobLimiter } from '../middleware/rate-limit';
import { generateETag, setResponseCaching } from './utils';
import {
  jobsQuerySchema,
  jobFieldsPresets,
} from '../../shared/schema';

export function createJobRoutes() {
  const router = Router();

  router.get("/api/jobs", async (req, res) => {
    try {
      const orgId = req.query.orgId as string || req.headers['x-org-id'] as string;
      console.info('[API]', req.method, req.url, '| orgId from query:', req.query.orgId, '| orgId from header:', req.headers['x-org-id'], '| final orgId:', orgId);
      
      if (!orgId) {
        res.status(400).json({ error: "Organization ID is required" });
        return;
      }

      const queryWithOrgId = { ...req.query, orgId };
      
      const isPaginatedRequest = 'limit' in req.query || 'cursor' in req.query || 'include' in req.query;
      
      if (isPaginatedRequest) {
        const validationResult = jobsQuerySchema.safeParse(queryWithOrgId);
        
        if (!validationResult.success) {
          return res.status(400).json({
            error: "Invalid query parameters",
            details: validationResult.error.errors
          });
        }

        const {
          limit,
          cursor,
          include,
          status,
          jobType,
          search
        } = validationResult.data;

        let fields: string[] | undefined;
        if (include) {
          if (include === 'list') {
            fields = [...jobFieldsPresets.list];
          } else if (include === 'detail') {
            fields = [...jobFieldsPresets.detail];
          } else {
            fields = include.split(',').map(f => f.trim());
          }
        }

        const result = await storage.jobs.getJobsPaginated({
          orgId,
          limit,
          cursor,
          fields,
          status,
          jobType,
          search
        });

        const etag = generateETag(result);
        
        const clientETag = req.headers['if-none-match'];
        if (clientETag && clientETag === `"${etag}"`) {
          return res.status(304).end();
        }

        setResponseCaching(res, {
          etag,
          cacheControl: 'private, max-age=180, must-revalidate',
          lastModified: result.data.length > 0 ? new Date(result.data[0].createdAt) : undefined
        });

        console.info('[API] GET /api/jobs (paginated) →', { 
          success: true, 
          count: result.data.length,
          hasMore: result.pagination.hasMore,
          totalCount: result.pagination.totalCount
        });

        res.json(result);
      } else {
        const jobs = await storage.jobs.getJobsByOrg(orgId);
        
        const jobsWithCounts = await Promise.all(
          jobs.map(async (job: any) => {
            try {
              const jobCandidates = await storage.candidates.getJobCandidatesByJob(job.id);
              return {
                ...job,
                candidateCount: jobCandidates.length
              };
            } catch (error) {
              console.error(`Error fetching candidates for job ${job.id}:`, error);
              return {
                ...job,
                candidateCount: 0
              };
            }
          })
        );
        
        const etag = generateETag(jobsWithCounts);
        
        const clientETag = req.headers['if-none-match'];
        if (clientETag && clientETag === `"${etag}"`) {
          return res.status(304).end();
        }

        setResponseCaching(res, {
          etag,
          cacheControl: 'private, max-age=180, must-revalidate',
          lastModified: jobsWithCounts.length > 0 ? new Date(jobsWithCounts[0].created_at) : undefined
        });

        console.info('[API] GET /api/jobs (legacy) →', { success: true, count: jobsWithCounts?.length || 0 });
        res.json(jobsWithCounts);
      }
    } catch (error) {
      console.error('Error in GET /api/jobs:', error);
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
  });

  router.get("/api/jobs/:id", async (req, res) => {
    try {
      const orgId = req.query.orgId as string;
      const job = await storage.jobs.getJob(req.params.id);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      if (orgId && job.orgId !== orgId) {
        return res.status(404).json({ error: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch job" });
    }
  });

  const createJobSchema = z.object({
    title: z.string().min(1, "Job title is required"),
    description: z.string().optional(),
    clientId: z.string().optional(),
    orgId: z.string().min(1, "Organization ID is required"),
    location: z.string().optional(),
    jobType: z.enum(['full-time', 'part-time', 'contract', 'internship']).optional(),
    remoteOption: z.enum(['onsite', 'remote', 'hybrid']).optional(),
    salaryRange: z.string().optional(),
    experienceLevel: z.enum(['entry', 'mid', 'senior', 'executive']).optional(),
    postingTargets: z.array(z.string()).optional(),
    autoPost: z.boolean().optional()
  });

  router.post("/api/jobs", writeLimiter, async (req, res) => {
    console.info('[API]', req.method, req.url);
    try {
      const orgId = req.headers['x-org-id'] as string;
      if (!orgId) {
        return res.status(400).json({ error: "Missing organization ID", details: "x-org-id header is required" });
      }
      
      const requestData = { ...req.body, orgId };
      const validatedData = createJobSchema.parse(requestData);
      
      if (!validatedData.orgId) {
        return res.status(400).json({ error: "Organization ID is required" });
      }
      
      const userContext = { 
        userId: req.headers['x-user-id'] as string || 'system',
        orgId: validatedData.orgId
      };
      
      const job = await storage.jobs.createJobWithContext(validatedData, userContext);
      
      try {
        const { ensureDefaultPipelineForJob } = await import('../lib/pipelineService');
        await ensureDefaultPipelineForJob({ jobId: job.id, organizationId: job.org_id });
      } catch (e) {
        console.warn('[API] ensureDefaultPipelineForJob on draft failed:', e);
      }
      
      console.info('[API] POST /api/jobs →', { success: true, jobId: job.id });
      res.status(201).json(job);
    } catch (error) {
      console.error('Job creation error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`) 
        });
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: "Failed to create job", details: errorMessage });
    }
  });

  const publishJobSchema = z.object({
    jobId: z.string().uuid("Invalid job ID format")
  });

  router.post("/api/jobs/:jobId/publish", writeLimiter, async (req, res) => {
    console.info('[API]', req.method, req.url);
    try {
      const paramsParse = publishJobSchema.safeParse({ jobId: req.params.jobId });
      if (!paramsParse.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: paramsParse.error.errors.map(e => `${e.path.join('.')}: ${e.message}`) 
        });
      }
      
      const { jobId } = paramsParse.data;
      
      const userContext = { 
        userId: req.headers['x-user-id'] as string || 'system',
        orgId: req.headers['x-org-id'] as string || ''
      };
      
      const result = await storage.jobs.publishJob(jobId, userContext);
      console.info('[API] POST /api/jobs/:jobId/publish →', { success: true, jobId, status: result.job.status });
      res.json(result);
    } catch (error) {
      console.error('Error publishing job:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('not found') || errorMessage.includes('Not found')) {
        return res.status(404).json({ error: "Job not found", details: errorMessage });
      }
      res.status(500).json({ error: "Failed to publish job", details: errorMessage });
    }
  });

  const updateJobSchema = z.object({
    title: z.string().min(1, "Job title is required").optional(),
    description: z.string().optional(),
    clientId: z.string().optional(),
    location: z.string().optional(),
    jobType: z.enum(['full-time', 'part-time', 'contract', 'internship']).optional(),
    remoteOption: z.enum(['onsite', 'remote', 'hybrid']).optional(),
    salaryRange: z.string().optional(),
    experienceLevel: z.enum(['entry', 'mid', 'senior', 'executive']).optional(),
    status: z.enum(['draft', 'open', 'closed', 'on_hold', 'filled', 'archived', 'pending_approval', 'approved', 'closed_cancelled', 'closed_no_hire']).optional(),
  });

  router.put("/api/jobs/:jobId", writeLimiter, async (req, res) => {
    console.info('[API]', req.method, req.url);
    try {
      const jobId = req.params.jobId;
      const orgId = req.headers['x-org-id'] as string;
      const userId = req.headers['x-user-id'] as string;

      if (!orgId) {
        return res.status(400).json({ error: "Missing organization ID", details: "x-org-id header is required" });
      }

      if (!userId) {
        return res.status(400).json({ error: "Missing user ID", details: "x-user-id header is required" });
      }

      const validatedData = updateJobSchema.parse(req.body);

      const existingJob = await storage.jobs.getJob(jobId);
      if (!existingJob) {
        return res.status(404).json({ error: "Job not found" });
      }

      if (existingJob.orgId !== orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      if (existingJob.status !== 'draft') {
        const changedNonStatusFields: string[] = [];
        for (const [key, value] of Object.entries(validatedData)) {
          if (key === 'status') continue;
          const existingValue = (existingJob as any)[key];
          const normalizedNew = value === '' ? null : value;
          const normalizedExisting = existingValue === '' ? null : existingValue;
          if (normalizedNew !== normalizedExisting) {
            changedNonStatusFields.push(key);
          }
        }
        if (changedNonStatusFields.length > 0) {
          return res.status(400).json({ 
            error: "Only status can be updated on published jobs", 
            details: `Cannot modify: ${changedNonStatusFields.join(', ')}` 
          });
        }
      }

      const updatedJob = await storage.jobs.updateJob(jobId, {
        ...validatedData,
        updatedAt: new Date(),
      });

      console.info('[API] PUT /api/jobs/:jobId →', { success: true, jobId });
      res.json(updatedJob);
    } catch (error) {
      console.error('Error updating job:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`) 
        });
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: "Failed to update job", details: errorMessage });
    }
  });

  router.delete("/api/jobs/:jobId", writeLimiter, async (req, res) => {
    console.info('[API]', req.method, req.url);
    try {
      const jobId = req.params.jobId;
      const orgId = req.headers['x-org-id'] as string;
      const userId = req.headers['x-user-id'] as string;

      if (!orgId) {
        return res.status(400).json({ error: "Missing organization ID", details: "x-org-id header is required" });
      }

      if (!userId) {
        return res.status(400).json({ error: "Missing user ID", details: "x-user-id header is required" });
      }

      const existingJob = await storage.jobs.getJob(jobId);
      if (!existingJob) {
        return res.status(404).json({ error: "Job not found" });
      }

      if (existingJob.orgId !== orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      await storage.jobs.deleteJob(jobId);

      console.info('[API] DELETE /api/jobs/:jobId →', { success: true, jobId });
      res.json({ message: "Job deleted successfully" });
    } catch (error) {
      console.error('Error deleting job:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: "Failed to delete job", details: errorMessage });
    }
  });

  const createCandidateSchema = z.object({
    name: z.string().min(1, "Candidate name is required"),
    email: z.string().email("Valid email is required"),
    phone: z.string().optional(),
    orgId: z.string().min(1, "Organization ID is required"),
    resumeUrl: z.string().optional()
  });

  router.post("/api/candidates", writeLimiter, async (req, res) => {
    console.info('[API]', req.method, req.url);
    try {
      const validatedData = createCandidateSchema.parse(req.body);
      const candidate = await storage.candidates.createCandidate(validatedData);
      console.info('[API] POST /api/candidates →', { success: true, candidateId: candidate.id, email: candidate.email });
      res.status(201).json(candidate);
    } catch (error) {
      console.error('Candidate creation error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`) 
        });
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: "Failed to create candidate", details: errorMessage });
    }
  });

  const candidateSearchSchema = z.object({
    orgId: z.string().uuid("Invalid organization ID"),
    searchTerm: z.string().optional(),
    jobId: z.string().uuid().optional(),
    stage: z.string().optional(),
    status: z.string().optional(),
    skills: z.array(z.string()).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional()
  });

  const jobSearchSchema = z.object({
    orgId: z.string().uuid("Invalid organization ID"),
    searchTerm: z.string().optional(),
    status: z.string().optional(),
    clientId: z.string().uuid().optional(),
    experienceLevel: z.enum(['entry', 'mid', 'senior', 'executive']).optional(),
    remoteOption: z.enum(['onsite', 'remote', 'hybrid']).optional()
  });

  router.post("/api/search/candidates", writeLimiter, async (req, res) => {
    console.info('[API]', req.method, req.url);
    try {
      const validatedData = candidateSearchSchema.parse(req.body);
      
      const filters: Partial<Record<string, unknown>> = {
        orgId: validatedData.orgId,
        searchTerm: validatedData.searchTerm,
        jobId: validatedData.jobId,
        stage: validatedData.stage,
        status: validatedData.status,
        skills: validatedData.skills
      };

      if (validatedData.startDate && validatedData.endDate) {
        filters.dateRange = {
          start: new Date(validatedData.startDate),
          end: new Date(validatedData.endDate)
        };
      }

      const results = await storage.candidates.searchCandidatesAdvanced(filters);
      res.json(results);
    } catch (error) {
      console.error('Candidate search error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`) 
        });
      }
      res.status(500).json({ error: "Search failed" });
    }
  });

  router.post("/api/search/jobs", writeLimiter, async (req, res) => {
    console.info('[API]', req.method, req.url);
    try {
      const validatedData = jobSearchSchema.parse(req.body);
      
      const filters = {
        orgId: validatedData.orgId,
        searchTerm: validatedData.searchTerm,
        status: validatedData.status,
        clientId: validatedData.clientId,
        experienceLevel: validatedData.experienceLevel,
        remoteOption: validatedData.remoteOption
      };

      const results = await storage.jobs.searchJobsAdvanced(filters);
      res.json(results);
    } catch (error) {
      console.error('Job search error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`) 
        });
      }
      res.status(500).json({ error: "Search failed" });
    }
  });

  const skillsSearchSchema = z.object({
    orgId: z.string().min(1, "Organization ID is required"),
    skills: z.array(z.string()).min(1, "At least one skill is required")
  });

  router.post('/api/search/candidates/by-skills', writeLimiter, async (req, res) => {
    console.info('[API]', req.method, req.url);
    try {
      const validatedData = skillsSearchSchema.parse(req.body);
      const results = await storage.candidates.searchCandidatesBySkills(validatedData.orgId, validatedData.skills);
      res.json(results);
    } catch (error) {
      console.error('Skills search error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`) 
        });
      }
      res.status(500).json({ error: 'Failed to search candidates by skills' });
    }
  });

  const jobApplicationParamsSchema = z.object({
    jobId: z.string().uuid("Invalid job ID format")
  });

  const jobApplicationSchema = z.object({
    firstName: z.string().min(1, "First name is required").max(50, "First name too long"),
    lastName: z.string().min(1, "Last name is required").max(50, "Last name too long"),
    email: z.string().email("Valid email is required").max(255, "Email too long"),
    phone: z.string().optional().refine(val => !val || val.length <= 20, "Phone number too long"),
    source: z.string().max(100, "Source too long").optional(),
    
    resumeUrl: z.string().optional(),
    coverLetter: z.string().max(2000, "Cover letter too long").optional(),
    
    education: z.string().optional().refine(val => {
      if (!val) return true;
      try { JSON.parse(val); return true; } catch { return false; }
    }, "Invalid education data"),
    employment: z.string().optional().refine(val => {
      if (!val) return true;
      try { JSON.parse(val); return true; } catch { return false; }
    }, "Invalid employment data"),
    
    linkedinUrl: z.string().url("Invalid LinkedIn URL").optional(),
    portfolioUrl: z.string().url("Invalid portfolio URL").optional(),
    
    workAuthorization: z.enum(['yes', 'no']).optional(),
    visaSponsorship: z.enum(['yes', 'no']).optional(),
    ageConfirmation: z.enum(['18-or-older', 'under-18']).optional(),
    previousEmployee: z.enum(['yes', 'no']).optional(),
    
    referralSource: z.enum(['career-page', 'linkedin', 'indeed', 'referral', 'other']).optional(),
    
    dataPrivacyAck: z.enum(['true', 'false']).optional(),
    aiAcknowledgment: z.enum(['true', 'false']).optional(),
    
    gender: z.enum(['male', 'female', 'non-binary', 'other', '']).optional(),
    raceEthnicity: z.enum(['asian', 'black', 'hispanic', 'white', 'two-or-more', 'other', '']).optional(),
    veteranStatus: z.enum(['veteran', 'disabled-veteran', 'recently-separated', '']).optional(),
    disabilityStatus: z.enum(['yes', 'no', '']).optional()
  });

  router.post("/api/jobs/:jobId/apply", publicJobLimiter, async (req, res) => {
    console.info('[API]', req.method, req.url);
    try {
      const paramsParse = jobApplicationParamsSchema.safeParse({ jobId: req.params.jobId });
      if (!paramsParse.success) {
        return res.status(400).json({ 
          error: "Invalid job ID", 
          details: paramsParse.error.errors.map(e => `${e.path.join('.')}: ${e.message}`) 
        });
      }

      const bodyParse = jobApplicationSchema.safeParse(req.body);
      if (!bodyParse.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: bodyParse.error.errors.map(e => `${e.path.join('.')}: ${e.message}`) 
        });
      }
      
      const { jobId } = paramsParse.data;
      const applicantData = bodyParse.data;

      const result = await storage.jobs.applyToJob({
        jobId,
        applicant: {
          firstName: applicantData.firstName,
          lastName: applicantData.lastName,
          email: applicantData.email,
          phone: applicantData.phone,
          source: applicantData.source,
          coverLetter: applicantData.coverLetter,
          resumeUrl: applicantData.resumeUrl
        }
      });

      if (applicantData.education || applicantData.linkedinUrl) {
        console.log('[APPLICATION] Comprehensive data received:', {
          candidateId: result.candidateId,
          hasEducation: !!applicantData.education,
          hasLinkedIn: !!applicantData.linkedinUrl,
          referralSource: applicantData.referralSource
        });
      }

      console.info('[API] POST /api/jobs/:jobId/apply →', { 
        success: true, 
        candidateId: result.candidateId,
        applicationId: result.applicationId
      });

      res.status(201).json({
        success: true,
        message: "Application submitted successfully",
        candidateId: result.candidateId,
        applicationId: result.applicationId
      });
    } catch (error) {
      console.error('Job application error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('duplicate') || errorMessage.includes('already applied')) {
        return res.status(409).json({ error: "You have already applied to this job", details: errorMessage });
      }
      if (errorMessage.includes('not found') || errorMessage.includes('Not found')) {
        return res.status(404).json({ error: "Job not found", details: errorMessage });
      }
      
      res.status(500).json({ error: "Failed to submit application", details: errorMessage });
    }
  });

  return router;
}
