import type { Express } from "express";
import express from "express";
import rateLimit from "express-rate-limit";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import * as jobService from "../lib/jobService";
import { z } from 'zod';
import { uploadRouter } from "./routes/upload";
import { getFirstPipelineColumn, ensureDefaultPipeline } from "./lib/pipelineService";
import { insertCandidateSchema, insertJobSchema, insertJobCandidateSchema } from "../shared/schema";
import { createClient } from '@supabase/supabase-js';


// Write operation rate limiter
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 write operations per windowMs
  message: {
    error: "Too many write operations from this IP, please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Supabase client for server-side operations
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create service role client for server-side auth operations
let supabaseAdmin: any = null;
if (supabaseUrl && supabaseServiceKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
}

// Authentication rate limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 auth attempts per windowMs
  message: {
    error: "Too many authentication attempts from this IP, please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public job application rate limiter
const publicJobLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 job applications per windowMs
  message: {
    error: "Too many job applications from this IP, please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Configure multer for file uploads
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    const orgId = req.body.orgId || 'general';
    const orgUploadsDir = path.join(uploadsDir, orgId);
    if (!fs.existsSync(orgUploadsDir)) {
      fs.mkdirSync(orgUploadsDir, { recursive: true });
    }
    cb(null, orgUploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'resume-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  // Check file type
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF and Word documents are allowed.'), false);
  }
};

const upload = multer({
  storage: storage_multer,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter
});

export async function registerRoutes(app: Express): Promise<Server> {
  console.log('📡 Registered all API routes');
  
  // BUSINESS VERIFICATION ENDPOINTS FOR SECURITY SOFTWARE
  app.get('/api/business-info', (_req, res) => {
    res.json({
      businessName: 'TalentPatriot',
      businessType: 'Human Resources Software Provider',
      applicationName: 'TalentPatriot ATS',
      applicationPurpose: 'Applicant Tracking System for businesses',
      category: 'Enterprise HR Software',
      legitimateBusiness: true,
      notPhishing: true,
      securityContact: 'security@talentpatriot.com',
      supportContact: 'support@talentpatriot.com',
      description: 'Professional HR software for recruitment and hiring management',
      features: [
        'Applicant tracking',
        'Resume management',
        'Interview scheduling',
        'Pipeline management',
        'Team collaboration'
      ],
      targetAudience: 'HR professionals, recruiters, and hiring managers',
      dataHandling: 'Secure business data for recruitment purposes only',
      compliance: 'Following industry security best practices'
    });
  });

  app.get('/api/security-info', (_req, res) => {
    res.json({
      isLegitimate: true,
      isPhishing: false,
      businessCategory: 'HR Software',
      securityLevel: 'Enterprise',
      dataProtection: 'Encrypted and secure',
      purpose: 'Business recruitment management',
      falsePositiveReport: 'security@talentpatriot.com',
      whitelistRequest: 'This is legitimate HR software - please whitelist'
    });
  });

  app.get('/security.txt', (_req, res) => {
    res.type('text/plain');
    res.send(`# TalentPatriot Security Information
Contact: mailto:security@talentpatriot.com
Contact: mailto:support@talentpatriot.com
Expires: 2026-12-31T23:59:59.000Z
Canonical: https://talentpatriot.com/.well-known/security.txt
Acknowledgments: https://talentpatriot.com/security-acknowledgments

# This is legitimate HR software - NOT a phishing site
# Domain: talentpatriot.com
# Report false positives to: security@talentpatriot.com`);
  });

  app.get('/api/health', (_req, res) => {
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0'
    });
  });
  
  // User Profile routes
  app.get("/api/user-profiles/:id", async (req, res) => {
    try {
      const userProfile = await storage.getUserProfile(req.params.id);
      if (!userProfile) {
        return res.status(404).json({ error: 'User profile not found' });
      }
      res.json(userProfile);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ error: 'Failed to fetch user profile' });
    }
  });

  app.post("/api/user-profiles", writeLimiter, async (req, res) => {
    try {
      const userProfile = await storage.createUserProfile(req.body);
      res.status(201).json(userProfile);
    } catch (error) {
      console.error("Error creating user profile:", error);
      res.status(500).json({ error: 'Failed to create user profile' });
    }
  });

  app.put("/api/user-profiles/:id", writeLimiter, async (req, res) => {
    try {
      const userProfile = await storage.updateUserProfile(req.params.id, req.body);
      res.json(userProfile);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ error: 'Failed to update user profile' });
    }
  });
  
  // Performance-optimized dashboard stats endpoint
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const orgId = req.query.org_id as string;
      if (!orgId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }
      
      // Use optimized single-query function
      const stats = await storage.getDashboardStats(orgId);
      
      // Cache for 5 minutes
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Optimized pipeline candidates endpoint
  app.get("/api/pipeline/candidates", async (req, res) => {
    try {
      const { job_id, org_id } = req.query;
      if (!job_id || !org_id) {
        return res.status(400).json({ error: 'Job ID and Organization ID required' });
      }
      
      const candidates = await storage.getPipelineCandidates(job_id as string, org_id as string);
      
      // Cache for 2 minutes
      res.setHeader('Cache-Control', 'public, max-age=120');
      res.json(candidates);
    } catch (error) {
      console.error("Error fetching pipeline candidates:", error);
      res.status(500).json({ error: "Failed to fetch pipeline candidates" });
    }
  });

  // Batch user organization data endpoint
  app.get("/api/user/:id/organization-data", async (req, res) => {
    try {
      const userId = req.params.id;
      const userOrgs = await storage.getUserOrganizationsByUser(userId);
      const currentOrg = userOrgs.length > 0 ? await storage.getOrganization(userOrgs[0].orgId) : null;
      
      // Cache for 15 minutes
      res.setHeader('Cache-Control', 'public, max-age=900');
      res.json({
        organizations: userOrgs,
        current_org: currentOrg
      });
    } catch (error) {
      console.error("Error fetching user organization data:", error);
      res.status(500).json({ error: "Failed to fetch organization data" });
    }
  });

  // Batch data endpoint for dashboard
  app.get("/api/batch/dashboard-data", async (req, res) => {
    try {
      const orgId = req.query.org_id as string;
      if (!orgId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }
      
      const [jobs, candidates, clients, jobCandidates] = await Promise.all([
        storage.getJobsByOrg(orgId),
        storage.getCandidatesByOrg(orgId),
        storage.getClientsByOrg(orgId),
        storage.getJobCandidatesByOrg(orgId)
      ]);
      
      res.setHeader('Cache-Control', 'public, max-age=60'); // 1 minute cache
      res.json({
        jobs,
        candidates,
        clients,
        jobCandidates,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error fetching batch dashboard data:", error);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });

  // Optimized search endpoint with full-text search
  app.get("/api/search/:type", async (req, res) => {
    try {
      const { type } = req.params;
      const { q: searchTerm, org_id } = req.query;
      
      if (!searchTerm || !org_id) {
        return res.status(400).json({ error: 'Search term and organization ID required' });
      }
      
      let results = [];
      switch (type) {
        case 'clients':
          results = await storage.searchClients(searchTerm as string, org_id as string);
          break;
        case 'jobs':
          results = await storage.searchJobs(searchTerm as string, org_id as string);
          break;
        case 'candidates':
          results = await storage.searchCandidates(searchTerm as string, org_id as string);
          break;
        default:
          return res.status(400).json({ error: 'Invalid search type' });
      }
      
      // Cache for 30 seconds
      res.setHeader('Cache-Control', 'public, max-age=30');
      res.json(results);
    } catch (error) {
      console.error("Error performing search:", error);
      res.status(500).json({ error: "Search failed" });
    }
  });

  // Organizations routes
  app.get("/api/organizations", async (req, res) => {
    try {
      const ownerId = req.query.ownerId as string;
      const organizations = await storage.getOrganizations(ownerId);
      res.json(organizations);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      res.status(500).json({ error: "Failed to fetch organizations" });
    }
  });

  app.get("/api/organizations/:id", async (req, res) => {
    try {
      const organization = await storage.getOrganization(req.params.id);
      if (!organization) {
        res.status(404).json({ error: "Organization not found" });
        return;
      }
      res.json(organization);
    } catch (error) {
      console.error("Error fetching organization:", error);
      res.status(500).json({ error: "Failed to fetch organization" });
    }
  });

  app.post("/api/organizations", writeLimiter, async (req, res) => {
    try {
      const organization = await storage.createOrganization(req.body);
      res.status(201).json(organization);
    } catch (error) {
      console.error("Error creating organization:", error);
      res.status(400).json({ error: "Failed to create organization" });
    }
  });

  app.put("/api/organizations/:id", writeLimiter, async (req, res) => {
    try {
      const organization = await storage.updateOrganization(req.params.id, req.body);
      res.json(organization);
    } catch (error) {
      console.error("Error updating organization:", error);
      res.status(400).json({ error: "Failed to update organization" });
    }
  });

  app.delete("/api/organizations/:id", writeLimiter, async (req, res) => {
    try {
      await storage.deleteOrganization(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting organization:", error);
      res.status(400).json({ error: "Failed to delete organization" });
    }
  });

  // User Organizations routes
  app.get("/api/user-organizations", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      const orgId = req.query.orgId as string;
      const userOrganizations = await storage.getUserOrganizations(userId, orgId);
      res.json(userOrganizations);
    } catch (error) {
      console.error("Error fetching user organizations:", error);
      res.status(500).json({ error: "Failed to fetch user organizations" });
    }
  });

  app.get("/api/user-organizations/:id", async (req, res) => {
    try {
      const userOrganization = await storage.getUserOrganization(req.params.id);
      if (!userOrganization) {
        res.status(404).json({ error: "User organization not found" });
        return;
      }
      res.json(userOrganization);
    } catch (error) {
      console.error("Error fetching user organization:", error);
      res.status(500).json({ error: "Failed to fetch user organization" });
    }
  });

  app.get("/api/users/:userId/organizations", async (req, res) => {
    try {
      const userOrganizations = await storage.getUserOrganizationsByUser(req.params.userId);
      res.json(userOrganizations);
    } catch (error) {
      console.error("Error fetching user organizations by user:", error);
      res.status(500).json({ error: "Failed to fetch user organizations" });
    }
  });

  app.get("/api/organizations/:orgId/users", async (req, res) => {
    try {
      const userOrganizations = await storage.getUserOrganizationsByOrg(req.params.orgId);
      res.json(userOrganizations);
    } catch (error) {
      console.error("Error fetching user organizations by org:", error);
      res.status(500).json({ error: "Failed to fetch organization users" });
    }
  });

  app.post("/api/user-organizations", writeLimiter, async (req, res) => {
    try {
      const userOrganization = await storage.createUserOrganization(req.body);
      res.status(201).json(userOrganization);
    } catch (error) {
      console.error("Error creating user organization:", error);
      res.status(400).json({ error: "Failed to create user organization" });
    }
  });

  app.put("/api/user-organizations/:id", writeLimiter, async (req, res) => {
    try {
      const userOrganization = await storage.updateUserOrganization(req.params.id, req.body);
      res.json(userOrganization);
    } catch (error) {
      console.error("Error updating user organization:", error);
      res.status(400).json({ error: "Failed to update user organization" });
    }
  });

  app.delete("/api/user-organizations/:id", writeLimiter, async (req, res) => {
    try {
      await storage.deleteUserOrganization(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user organization:", error);
      res.status(400).json({ error: "Failed to delete user organization" });
    }
  });

  app.delete("/api/users/:userId/organizations/:orgId", writeLimiter, async (req, res) => {
    try {
      await storage.deleteUserOrganizationByUserAndOrg(req.params.userId, req.params.orgId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing user from organization:", error);
      res.status(400).json({ error: "Failed to remove user from organization" });
    }
  });

  // Clients routes
  app.get("/api/clients", async (req, res) => {
    try {
      const orgId = req.query.orgId as string;
      if (!orgId) {
        res.status(400).json({ error: "Organization ID is required" });
        return;
      }
      const clients = await storage.getClientsByOrg(orgId);
      res.json(clients);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch clients" });
    }
  });

  app.get("/api/clients/:id", async (req, res) => {
    try {
      const orgId = req.query.orgId as string;
      const client = await storage.getClient(req.params.id);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      // Ensure user can only access clients from their organization
      if (orgId && client.orgId !== orgId) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch client" });
    }
  });

  app.post("/api/clients", writeLimiter, async (req, res) => {
    try {
      const client = await storage.createClient(req.body);
      res.status(201).json(client);
    } catch (error) {
      console.error('Client creation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: "Failed to create client", details: errorMessage });
    }
  });

  app.put("/api/clients/:id", writeLimiter, async (req, res) => {
    try {
      const client = await storage.updateClient(req.params.id, req.body);
      res.json(client);
    } catch (error) {
      res.status(400).json({ error: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", writeLimiter, async (req, res) => {
    try {
      await storage.deleteClient(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: "Failed to delete client" });
    }
  });

  // Jobs routes
  app.get("/api/jobs", async (req, res) => {
    console.info('[API]', req.method, req.url, '| orgId:', req.query.orgId);
    try {
      const orgId = req.query.orgId as string;
      if (!orgId) {
        res.status(400).json({ error: "Organization ID is required" });
        return;
      }
      const jobs = await storage.getJobsByOrg(orgId);
      console.info('[API] GET /api/jobs →', { success: true, count: jobs?.length || 0 });
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
  });

  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const orgId = req.query.orgId as string;
      const job = await storage.getJob(req.params.id);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      // Ensure user can only access jobs from their organization
      if (orgId && job.orgId !== orgId) {
        return res.status(404).json({ error: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch job" });
    }
  });

  // REWRITTEN JOB ROUTES - Clean implementation with Zod validation using jobService
  
  const createJobSchema = z.object({
    title: z.string().min(1, "Job title is required"),
    description: z.string().min(1, "Job description is required"),
    clientId: z.string().optional(),
    orgId: z.string().min(1, "Organization ID is required"),
    location: z.string().optional(),
    jobType: z.enum(['full-time', 'part-time', 'contract', 'internship']).optional(),
    status: z.enum(['draft', 'open', 'closed', 'filled']).optional(),
    remoteOption: z.enum(['onsite', 'remote', 'hybrid']).optional(),
    salaryRange: z.string().optional(),
    experienceLevel: z.enum(['entry', 'mid', 'senior', 'executive']).optional(),
    postingTargets: z.array(z.string()).optional(),
    autoPost: z.boolean().optional()
  });

  app.post("/api/jobs", writeLimiter, async (req, res) => {
    console.info('[API]', req.method, req.url);
    try {
      const validatedData = createJobSchema.parse(req.body);
      const job = await jobService.createJob(validatedData);
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

  // Publish job - Clean implementation using jobService
  const publishJobSchema = z.object({
    jobId: z.string().uuid("Invalid job ID format")
  });

  app.post("/api/jobs/:jobId/publish", writeLimiter, async (req, res) => {
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
      const publishedJob = await jobService.publishJob(jobId);
      console.info('[API] POST /api/jobs/:jobId/publish →', { success: true, jobId, status: publishedJob.status });
      res.json(publishedJob);
    } catch (error) {
      console.error('Error publishing job:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('not found') || errorMessage.includes('Not found')) {
        return res.status(404).json({ error: "Job not found", details: errorMessage });
      }
      res.status(500).json({ error: "Failed to publish job", details: errorMessage });
    }
  });

  // CANDIDATE ROUTES - Clean implementation using jobService
  const createCandidateSchema = z.object({
    name: z.string().min(1, "Candidate name is required"),
    email: z.string().email("Valid email is required"),
    phone: z.string().optional(),
    orgId: z.string().min(1, "Organization ID is required"),
    resumeUrl: z.string().optional()
  });

  app.post("/api/candidates", writeLimiter, async (req, res) => {
    console.info('[API]', req.method, req.url);
    try {
      const validatedData = createCandidateSchema.parse(req.body);
      const candidate = await jobService.createCandidate(validatedData);
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

  // JOB APPLICATION ROUTE - Complete flow using jobService
  const jobApplicationParamsSchema = z.object({
    jobId: z.string().uuid("Invalid job ID format")
  });

  const jobApplicationSchema = z.object({
    name: z.string().min(1, "Name is required").max(100, "Name too long"),
    email: z.string().email("Valid email is required").max(255, "Email too long"),
    phone: z.string().optional().refine(val => !val || val.length <= 20, "Phone number too long"),
    resumeUrl: z.string().url("Invalid resume URL").optional(),
    coverLetter: z.string().max(2000, "Cover letter too long").optional()
  });

  app.post("/api/jobs/:jobId/apply", publicJobLimiter, async (req, res) => {
    try {
      // Validate path parameters
      const paramsParse = jobApplicationParamsSchema.safeParse({ jobId: req.params.jobId });
      if (!paramsParse.success) {
        return res.status(400).json({ 
          error: "Invalid job ID", 
          details: paramsParse.error.errors.map(e => `${e.path.join('.')}: ${e.message}`) 
        });
      }

      // Validate request body
      const bodyParse = jobApplicationSchema.safeParse(req.body);
      if (!bodyParse.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: bodyParse.error.errors.map(e => `${e.path.join('.')}: ${e.message}`) 
        });
      }
      
      const { jobId } = paramsParse.data;
      const validatedData = bodyParse.data;

      // Get the job first to get its organization ID
      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      
      if (job.status !== 'open') {
        return res.status(400).json({ error: "Job is not accepting applications" });
      }
      
      console.log('Job object:', JSON.stringify(job, null, 2));
      
      // Get first pipeline column for the org
      const jobOrgId = job.orgId;
      if (!jobOrgId) {
        return res.status(400).json({ error: "Job organization ID not found" });
      }
      
      const firstColumn = await jobService.getFirstPipelineColumn(jobOrgId);
      
      const applicationResult = await jobService.applyToJob({
        jobId,
        candidateEmail: validatedData.email,
        candidateName: validatedData.name,
        candidatePhone: validatedData.phone,
        resumeUrl: validatedData.resumeUrl,
        orgId: jobOrgId
      });

      res.status(201).json(applicationResult);
    } catch (error) {
      console.error('Job application error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Handle specific error types
      if (errorMessage.includes('duplicate') || errorMessage.includes('already applied')) {
        return res.status(409).json({ error: "You have already applied to this job", details: errorMessage });
      }
      if (errorMessage.includes('not found') || errorMessage.includes('Not found')) {
        return res.status(404).json({ error: "Job not found", details: errorMessage });
      }
      
      res.status(500).json({ error: "Failed to submit application", details: errorMessage });
    }
  });

  // Public endpoints for careers page
  const publicJobsQuerySchema = z.object({
    limit: z.string().optional().refine(val => !val || !isNaN(Number(val)), "Limit must be a number"),
    offset: z.string().optional().refine(val => !val || !isNaN(Number(val)), "Offset must be a number"),
    location: z.string().optional(),
    search: z.string().optional()
  });

  app.get("/api/public/jobs", async (req, res) => {
    try {
      const queryParse = publicJobsQuerySchema.safeParse(req.query);
      if (!queryParse.success) {
        return res.status(400).json({ 
          error: "Invalid query parameters", 
          details: queryParse.error.errors.map(e => `${e.path.join('.')}: ${e.message}`) 
        });
      }
      
      // Get all open jobs with public slugs using jobService
      const openJobs = await jobService.getPublicJobs();
      res.json(openJobs);
    } catch (error) {
      console.error('Error fetching public jobs:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: "Failed to fetch job listings", details: errorMessage });
    }
  });

  // Get public job by slug
  const jobSlugSchema = z.object({
    slug: z.string().min(1, "Job slug is required").max(100, "Job slug too long")
  });

  app.get("/api/public/jobs/slug/:slug", async (req, res) => {
    try {
      const paramsParse = jobSlugSchema.safeParse({ slug: req.params.slug });
      if (!paramsParse.success) {
        return res.status(400).json({ 
          error: "Invalid slug parameter", 
          details: paramsParse.error.errors.map(e => `${e.path.join('.')}: ${e.message}`) 
        });
      }
      
      const { slug } = paramsParse.data;
      const allJobs = await storage.getJobs();
      const job = allJobs.find(job => job.publicSlug === slug && job.status === 'open');
      
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      
      res.json(job);
    } catch (error) {
      console.error('Error fetching job by slug:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: "Failed to fetch job", details: errorMessage });
    }
  });

  // This route is deprecated - use /api/jobs/:jobId/apply instead
  app.post("/api/public/apply", writeLimiter, async (req, res) => {
    try {
      res.status(410).json({ 
        error: "This endpoint is deprecated", 
        message: "Please use POST /api/jobs/:jobId/apply instead" 
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Candidates routes
  app.get("/api/candidates", async (req, res) => {
    try {
      const orgId = req.query.orgId as string;
      if (!orgId) {
        res.status(400).json({ error: "Organization ID is required" });
        return;
      }
      const candidates = await storage.getCandidatesByOrg(orgId);
      res.json(candidates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch candidates" });
    }
  });

  app.get("/api/candidates/:id", async (req, res) => {
    try {
      const orgId = req.query.orgId as string;
      const candidate = await storage.getCandidate(req.params.id);
      if (!candidate) {
        return res.status(404).json({ error: "Candidate not found" });
      }
      // Ensure user can only access candidates from their organization
      if (orgId && candidate.orgId !== orgId) {
        return res.status(404).json({ error: "Candidate not found" });
      }
      res.json(candidate);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch candidate" });
    }
  });

  // These routes use older storage methods - deprecated in favor of jobService routes above

  app.put("/api/candidates/:id", writeLimiter, async (req, res) => {
    try {
      const candidate = await storage.updateCandidate(req.params.id, req.body);
      res.json(candidate);
    } catch (error) {
      console.error('Candidate update error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: "Failed to update candidate", details: errorMessage });
    }
  });

  // Job-Candidate relationships
  app.get("/api/jobs/:jobId/candidates", async (req, res) => {
    try {
      const jobCandidates = await storage.getJobCandidatesByJob(req.params.jobId);
      res.json(jobCandidates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch job candidates" });
    }
  });

  app.post("/api/job-candidates", writeLimiter, async (req, res) => {
    try {
      const jobCandidate = await storage.createJobCandidate(req.body);
      res.status(201).json(jobCandidate);
    } catch (error) {
      console.error('Job candidate creation error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: "Failed to create job candidate relationship", details: errorMsg });
    }
  });

  app.put("/api/job-candidates/:id", writeLimiter, async (req, res) => {
    try {
      const jobCandidate = await storage.updateJobCandidate(req.params.id, req.body);
      res.json(jobCandidate);
    } catch (error) {
      console.error('Job candidate update error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: "Failed to update job candidate", details: errorMsg });
    }
  });

  // Candidate notes
  app.get("/api/job-candidates/:jobCandidateId/notes", async (req, res) => {
    try {
      const { jobCandidateId } = req.params;
      console.log('Fetching notes for job candidate:', jobCandidateId);
      
      const notes = await storage.getCandidateNotes(jobCandidateId);
      console.log('Found notes:', notes?.length || 0);
      
      res.json(notes || []);
    } catch (error) {
      console.error('Error fetching candidate notes:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: "Failed to fetch candidate notes", details: errorMsg });
    }
  });

  app.post("/api/candidate-notes", writeLimiter, async (req, res) => {
    try {
      console.log('Creating candidate note:', req.body);
      const note = await storage.createCandidateNote(req.body);
      console.log('Created note:', note);
      res.status(201).json(note);
    } catch (error) {
      console.error('Error creating candidate note:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: "Failed to create candidate note", details: errorMsg });
    }
  });

  // Messages routes
  app.get("/api/messages", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      const messages = await storage.getMessages(userId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.get("/api/messages/thread/:threadId", async (req, res) => {
    try {
      const messages = await storage.getMessagesByThread(req.params.threadId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch thread messages" });
    }
  });

  app.get("/api/messages/context", async (req, res) => {
    try {
      const { clientId, jobId, candidateId } = req.query as Record<string, string>;
      const messages = await storage.getMessagesByContext({ clientId, jobId, candidateId });
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch context messages" });
    }
  });

  app.get("/api/messages/unread-count", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      const count = await storage.getUnreadMessageCount(userId);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch unread count" });
    }
  });

  app.post("/api/messages", writeLimiter, async (req, res) => {
    try {
      const message = await storage.createMessage(req.body);
      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ error: "Failed to create message" });
    }
  });

  app.patch("/api/messages/:id", writeLimiter, async (req, res) => {
    try {
      const message = await storage.updateMessage(req.params.id, req.body);
      res.json(message);
    } catch (error) {
      res.status(400).json({ error: "Failed to update message" });
    }
  });

  app.post("/api/messages/:id/read", writeLimiter, async (req, res) => {
    try {
      const { userId } = req.body;
      await storage.markMessageAsRead(req.params.id, userId);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: "Failed to mark message as read" });
    }
  });

  app.post("/api/messages/:id/archive", writeLimiter, async (req, res) => {
    try {
      await storage.archiveMessage(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: "Failed to archive message" });
    }
  });

  // Interview endpoints
  app.get("/api/interviews", async (req, res) => {
    try {
      const { org_id } = req.query;
      if (!org_id) {
        return res.status(400).json({ error: 'Organization ID is required' });
      }
      
      const interviews = await storage.getInterviews();
      // Filter by organization (interviews should have orgId field)
      const orgInterviews = interviews.filter(interview => interview.orgId === org_id);
      res.json(orgInterviews);
    } catch (error) {
      console.error("Error fetching interviews:", error);
      res.status(500).json({ error: "Failed to fetch interviews" });
    }
  });

  app.get("/api/interviews/:id", async (req, res) => {
    try {
      const interview = await storage.getInterview(req.params.id);
      if (!interview) {
        return res.status(404).json({ error: 'Interview not found' });
      }
      res.json(interview);
    } catch (error) {
      console.error("Error fetching interview:", error);
      res.status(500).json({ error: "Failed to fetch interview" });
    }
  });

  app.post("/api/interviews", writeLimiter, async (req, res) => {
    try {
      const interview = await storage.createInterview(req.body);
      res.status(201).json(interview);
    } catch (error) {
      console.error("Error creating interview:", error);
      res.status(500).json({ error: "Failed to create interview" });
    }
  });

  app.put("/api/interviews/:id", writeLimiter, async (req, res) => {
    try {
      const interview = await storage.updateInterview(req.params.id, req.body);
      res.json(interview);
    } catch (error) {
      console.error("Error updating interview:", error);
      res.status(500).json({ error: "Failed to update interview" });
    }
  });

  app.delete("/api/interviews/:id", writeLimiter, async (req, res) => {
    try {
      await storage.deleteInterview(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting interview:", error);
      res.status(500).json({ error: "Failed to delete interview" });
    }
  });

  // Upload routes (new comprehensive system)
  app.use("/api/upload", uploadRouter);

  // File upload endpoint (legacy)
  app.post("/api/upload/resume", writeLimiter, upload.single('resume'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const orgId = req.body.orgId || 'general';
      const fileUrl = `/uploads/${orgId}/${req.file.filename}`;
      
      res.status(200).json({
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
      });
    } catch (error) {
      console.error('File upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'File upload failed';
      res.status(500).json({ error: errorMessage });
    }
  });

  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0'
      });
    } catch (error) {
      res.status(500).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // ANTI-PHISHING AND LEGITIMACY ENDPOINTS
  // These endpoints help security software recognize this as a legitimate business application
  app.get("/api/business-info", (req, res) => {
    res.json({
      name: "TalentPatriot",
      type: "Human Resources Software - Applicant Tracking System",
      category: "Enterprise Software",
      purpose: "Legitimate HR software for recruitment management",
      contact: "support@talentpatriot.com",
      security_contact: "security@talentpatriot.com",
      version: "1.0.0",
      license: "Commercial Software",
      legitimate_business: true,
      not_phishing: true,
      verification: "official-talentpatriot-application"
    });
  });
  
  app.get("/api/security-info", (req, res) => {
    res.json({
      security_contact: "security@talentpatriot.com",
      business_type: "HR Software Provider",
      application_purpose: "Recruitment and hiring management",
      data_handling: "Secure business data for HR purposes",
      compliance: "Enterprise security best practices",
      verification: {
        legitimate_business: true,
        not_phishing_site: true,
        business_category: "Human Resources Technology",
        target_users: "HR professionals, recruiters, hiring managers"
      }
    });
  });
  
  app.get("/security.txt", (req, res) => {
    res.type('text/plain');
    res.send(`Contact: security@talentpatriot.com
Contact: support@talentpatriot.com
Expires: 2025-12-31T23:59:59.000Z

# TalentPatriot Security Information
# This is a legitimate business application for Human Resources
# Application Type: Applicant Tracking System (ATS)
# NOT a phishing site - Official business software
# Security Contact: security@talentpatriot.com`);
  });

  // Serve uploaded files statically
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // PUBLIC ROUTES - No authentication required

  // Public job listings
  app.get("/api/public/jobs", async (req, res) => {
    try {
      const jobs = await storage.getPublicJobs();
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching public jobs:", error);
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
  });

  // Public single job details
  app.get("/api/public/jobs/:id", async (req, res) => {
    try {
      const job = await storage.getPublicJob(req.params.id);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      console.error("Error fetching public job:", error);
      res.status(500).json({ error: "Failed to fetch job" });
    }
  });

  // This route uses older storage methods - deprecated in favor of jobService route above

  app.post("/api/jobs/:jobId/apply-old", publicJobLimiter, async (req, res) => {
    try {
      const { jobId } = req.params;
      const validatedData = jobApplicationSchema.parse(req.body);
      
      // Get the job to find its organization
      const job = await storage.getJob(jobId);
      if (!job || job.status !== 'open') {
        return res.status(404).json({ error: "Job not available for applications" });
      }
      
      // Find or create candidate with RLS-compliant storage
      let candidate = await storage.getCandidateByEmail(validatedData.email, job.orgId);
      if (!candidate) {
        candidate = await storage.createCandidate({
          name: validatedData.name,
          email: validatedData.email,
          phone: validatedData.phone || null,
          resumeUrl: validatedData.resumeUrl || null,
          orgId: job.orgId
        });
      }
      
      // Check if already applied
      const existingJobCandidates = await storage.getJobCandidatesByJob(job.id);
      const existingApplication = existingJobCandidates.find(jc => jc.candidateId === candidate.id);
      if (existingApplication) {
        return res.status(409).json({ error: "You have already applied to this job" });
      }
      
      // Create job candidate relationship
      const jobCandidate = await storage.createJobCandidate({
        orgId: job.orgId,
        jobId: job.id,
        candidateId: candidate.id,
        stage: 'applied',
        status: 'active',
        notes: 'Applied via public careers page'
      });
      
      const applicationResult = {
        candidate,
        jobCandidate,
        message: 'Application submitted successfully'
      };
      
      res.status(201).json(applicationResult);
    } catch (error) {
      console.error("Error submitting application:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`) 
        });
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('already applied')) {
        return res.status(409).json({ error: errorMessage });
      }
      res.status(500).json({ error: "Failed to submit application", details: errorMessage });
    }
  });

  // PIPELINE COLUMNS ENDPOINTS
  app.get("/api/pipeline-columns", async (req, res) => {
    try {
      const orgId = req.query.orgId as string;
      if (!orgId) {
        return res.status(400).json({ error: "Organization ID is required" });
      }
      const columns = await storage.getPipelineColumns(orgId);
      res.json(columns);
    } catch (error) {
      console.error("Error fetching pipeline columns:", error);
      res.status(500).json({ error: "Failed to fetch pipeline columns" });
    }
  });

  app.post("/api/pipeline-columns", writeLimiter, async (req, res) => {
    try {
      const column = await storage.createPipelineColumn(req.body);
      res.status(201).json(column);
    } catch (error) {
      console.error("Error creating pipeline column:", error);
      res.status(400).json({ error: "Failed to create pipeline column" });
    }
  });

  // PIPELINE ENDPOINTS - New Kanban system

  // Get pipeline for organization (all columns with applications)
  app.get("/api/pipeline/:orgId", async (req, res) => {
    try {
      const { orgId } = req.params;
      
      // Get pipeline columns
      const columns = await storage.getPipelineColumns(orgId);
      
      // Get job candidates for the organization
      const jobCandidates = await storage.getJobCandidatesByOrg(orgId);
      
      // Organize the pipeline data
      const pipeline = {
        columns,
        applications: jobCandidates
      };
      
      res.json(pipeline);
    } catch (error) {
      console.error("Error fetching pipeline:", error);
      res.status(500).json({ error: "Failed to fetch pipeline" });
    }
  });

  // Move application to different pipeline column (drag and drop)
  app.patch("/api/applications/:applicationId/move", writeLimiter, async (req, res) => {
    try {
      const { applicationId } = req.params;
      const { columnId } = req.body;
      
      const { moveApplication } = require('./lib/pipelineService');
      await moveApplication(applicationId, columnId);
      
      res.json({ message: "Application moved successfully" });
    } catch (error) {
      console.error("Error moving application:", error);
      res.status(500).json({ error: "Failed to move application" });
    }
  });

  // Move job candidate to different pipeline column (Kanban drag and drop)
  app.patch("/api/jobs/:jobId/candidates/:candidateId/move", writeLimiter, async (req, res) => {
    try {
      const { candidateId } = req.params;
      const { columnId } = req.body;
      
      if (!columnId) {
        return res.status(400).json({ error: "Column ID is required" });
      }

      console.info('Moving job candidate', candidateId, 'to column', columnId);
      
      // Use the storage method to move the job candidate
      const updatedJobCandidate = await storage.moveJobCandidate(candidateId, columnId);
      
      res.json({ 
        message: "Job candidate moved successfully",
        jobCandidate: updatedJobCandidate
      });
    } catch (error) {
      console.error("Error moving job candidate:", error);
      res.status(500).json({ error: "Failed to move job candidate" });
    }
  });

  // Job candidates API endpoints (replaces old applications endpoints)
  app.get("/api/job-candidates/:orgId", async (req, res) => {
    try {
      const { orgId } = req.params;
      const jobCandidates = await jobService.getJobCandidatesByOrg(orgId);
      res.json(jobCandidates);
    } catch (error) {
      console.error("Error fetching job candidates:", error);
      res.status(500).json({ error: "Failed to fetch job candidates" });
    }
  });

  app.patch("/api/job-candidates/:id/stage", writeLimiter, async (req, res) => {
    try {
      const { id } = req.params;
      const { stage } = req.body;
      
      if (!stage) {
        return res.status(400).json({ error: "Stage is required" });
      }
      
      const updatedJobCandidate = await jobService.updateJobCandidateStage(id, stage);
      res.json(updatedJobCandidate);
    } catch (error) {
      console.error("Error updating job candidate stage:", error);
      res.status(500).json({ error: "Failed to update job candidate stage" });
    }
  });

  // CRUD API Endpoints with Zod validation

  // POST /api/candidates - Create a new candidate
  app.post("/api/candidates", writeLimiter, async (req, res) => {
    try {
      // Validate request body with Zod
      const createCandidateSchema = insertCandidateSchema.extend({
        orgId: z.string().min(1, "Organization ID is required")
      });
      
      const validatedData = createCandidateSchema.parse(req.body);
      
      // Check if candidate already exists
      const existingCandidate = await storage.getCandidateByEmail(validatedData.email, validatedData.orgId);
      if (existingCandidate) {
        return res.status(409).json({ 
          error: "Candidate with this email already exists in your organization" 
        });
      }
      
      const candidate = await storage.createCandidate(validatedData);
      res.status(201).json(candidate);
    } catch (error: any) {
      console.error("Error creating candidate:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "Failed to create candidate" });
    }
  });

  // POST /api/jobs - Create a new job
  app.post("/api/jobs", writeLimiter, async (req, res) => {
    try {
      // Validate request body with Zod
      const createJobSchema = insertJobSchema.extend({
        orgId: z.string().min(1, "Organization ID is required"),
        clientId: z.string().optional() // Make clientId optional since clients are optional
      });
      
      const validatedData = createJobSchema.parse(req.body);
      
      const job = await storage.createJob(validatedData);
      
      // Create default pipeline columns for this job's organization if they don't exist
      await ensureDefaultPipeline(validatedData.orgId);
      
      res.status(201).json(job);
    } catch (error: any) {
      console.error("Error creating job:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "Failed to create job" });
    }
  });

  // POST /api/jobs/:jobId/publish - Publish a job
  app.post("/api/jobs/:jobId/publish", writeLimiter, async (req, res) => {
    try {
      const { jobId } = req.params;
      const job = await storage.publishJob(jobId);
      res.json(job);
    } catch (error: any) {
      console.error('Error publishing job:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/public/jobs - Get published jobs for careers page
  app.get('/api/public/jobs', async (req, res) => {
    console.info('[API]', req.method, req.url);
    try {
      const orgId = req.query.orgId as string;
      const jobs = await storage.getPublicJobs(orgId);
      console.info('[API] GET /api/public/jobs →', { success: true, count: jobs?.length || 0, orgId: orgId || 'all' });
      res.json(jobs);
    } catch (error: any) {
      console.error('Error fetching public jobs:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/jobs/:jobId/apply - Apply to a job
  app.post('/api/jobs/:jobId/apply', publicJobLimiter, upload.single('resume'), async (req, res) => {
    try {
      const { jobId } = req.params;
      const { name, email, phone, candidateId } = req.body;
      
      // Get job to get org_id
      const job = await storage.getJob(jobId);
      if (!job || job.status !== 'open') {
        return res.status(404).json({ error: 'Job not found or not accepting applications' });
      }

      let candidate;
      
      // If candidateId provided, use existing candidate
      if (candidateId) {
        candidate = await storage.getCandidate(candidateId);
        if (!candidate) {
          return res.status(404).json({ error: 'Candidate not found' });
        }
      } else {
        // Create new candidate or find existing by email
        const existingCandidate = await storage.getCandidateByEmail ? 
          await storage.getCandidateByEmail(email, job.orgId) : null;
        if (existingCandidate) {
          candidate = existingCandidate;
        } else {
          candidate = await storage.createCandidate({
            name,
            email,
            phone,
            orgId: job.orgId,
            status: 'active',
            resumeUrl: req.file ? `/uploads/${job.orgId}/${req.file.filename}` : null
          });
        }
      }

      // Get first pipeline column
      const firstColumn = await getFirstPipelineColumn(job.orgId);
      
      // Create job-candidate relationship
      const jobCandidate = await storage.createJobCandidate({
        jobId,
        candidateId: candidate.id,
        orgId: job.orgId,
        stage: 'applied',
        status: 'active',
        pipelineColumnId: firstColumn.id
      });

      res.json({ success: true, jobCandidate, candidate });
    } catch (error: any) {
      console.error('Error processing job application:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/jobs/:jobId/apply - Apply to a job
  app.post("/api/jobs/:jobId/apply", writeLimiter, async (req, res) => {
    try {
      const { jobId } = req.params;
      
      // Validate job exists
      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      
      // Validate request body
      const applySchema = z.object({
        candidateId: z.string().optional(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
      }).refine(data => data.candidateId || (data.name && data.email), {
        message: "Either candidateId or both name and email are required"
      });
      
      const validatedData = applySchema.parse(req.body);
      
      let candidateId = validatedData.candidateId;
      
      // If no candidateId provided, find or create candidate
      if (!candidateId) {
        let candidate = await storage.getCandidateByEmail(validatedData.email!, job.orgId);
        
        if (!candidate) {
          // Create new candidate
          candidate = await storage.createCandidate({
            name: validatedData.name!,
            email: validatedData.email!,
            phone: validatedData.phone || null,
            orgId: job.orgId,
            status: 'active'
          });
        }
        candidateId = candidate.id;
      }
      
      // Check if candidate already applied to this job
      const existingApplications = await storage.getJobCandidatesByJob(jobId);
      const alreadyApplied = existingApplications.some(app => app.candidateId === candidateId);
      
      if (alreadyApplied) {
        return res.status(409).json({ 
          error: "Candidate has already applied to this job" 
        });
      }
      
      // Get first pipeline column for this organization
      const firstColumn = await getFirstPipelineColumn(job.orgId);
      if (!firstColumn) {
        await ensureDefaultPipeline(job.orgId);
        const newFirstColumn = await getFirstPipelineColumn(job.orgId);
        if (!newFirstColumn) {
          return res.status(500).json({ error: "Unable to create pipeline for job applications" });
        }
      }
      
      // Create job candidate record
      const jobCandidate = await storage.createJobCandidate({
        jobId: jobId,
        candidateId: candidateId,
        orgId: job.orgId,
        stage: 'applied',
        status: 'active',
        pipelineColumnId: firstColumn?.id || null,
        notes: null,
        assignedTo: null
      });
      
      res.status(201).json(jobCandidate);
    } catch (error: any) {
      console.error("Error processing job application:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "Failed to process job application" });
    }
  });

  // Auth endpoints - Forgot Password
  app.post('/api/auth/forgot-password', authLimiter, async (req: express.Request, res: express.Response) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Please enter a valid email address' });
      }

      if (!supabaseAdmin) {
        console.error('Supabase admin client not available - missing environment variables');
        return res.status(500).json({ error: 'Password reset service unavailable' });
      }

      // Get the current domain for the redirect URL
      const protocol = req.get('X-Forwarded-Proto') || (req.secure ? 'https' : 'http');
      const host = req.get('Host');
      const redirectUrl = `${protocol}://${host}/reset-password`;

      const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        console.error('Supabase reset password error:', error);
        return res.status(500).json({ error: 'Failed to send reset email' });
      }

      // Always return success for security (don't reveal if email exists)
      res.status(200).json({ 
        message: 'If that email is registered, you\'ll receive a password reset link shortly.' 
      });

    } catch (error: any) {
      console.error('Forgot password error:', error);
      res.status(500).json({ error: 'Failed to send reset email' });
    }
  });

  const httpServer = createServer(app);

  console.log("📡 Registered all API routes");

  return httpServer;
}
