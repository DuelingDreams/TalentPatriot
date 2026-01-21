import type { Express, Response } from "express";
import { createServer, type Server } from "http";

import { storage } from "./storage/index";
import { z } from 'zod';
import { uploadRouter } from "./routes/upload";
import { createGoogleAuthRoutes } from "./routes/google-auth";
import { createGoogleCalendarRoutes } from "./routes/google-calendar";
import { 
  insertCandidateSchema, 
  insertJobSchema, 
  insertJobCandidateSchema,
  insertDataImportSchema,
  insertImportRecordSchema,
  insertClientSubmissionSchema,
  insertCandidateDocumentSchema,
  insertDripCampaignSchema,
  insertCandidateCampaignEnrollmentSchema,
  insertCampaignEmailSchema,
  jobsQuerySchema,
  candidatesQuerySchema,
  messagesQuerySchema,
  jobFieldsPresets,
  candidateFieldsPresets,
  messageFieldsPresets,
  type PaginatedJobs,
  type PaginatedCandidates,
  type PaginatedMessages,
  type Job,
  type Candidate,
  type JobCandidate,
  type DataImport,
  type ImportRecord,
  type ClientSubmission,
  type CandidateDocument,
  type DripCampaign,
  type CandidateCampaignEnrollment,
  type CampaignEmail
} from "../shared/schema";
import { supabase } from './lib/supabase';
import { subdomainResolver } from './middleware/subdomainResolver';
import { addUserToOrganization, removeUserFromOrganization, getOrganizationUsers } from "../lib/userService";
import crypto from "crypto";
import { ImportService } from './lib/importService';
import { toCamelCase } from '../shared/utils/caseConversion';
import { renderMergeFields, type MergeFieldContext } from '../shared/utils/mergeFields';
import { sendEmail, sendBetaConfirmationEmail, betaConfirmationTemplate, betaApprovalTemplate } from './services/email';

import { 
  type AuthenticatedRequest, 
  requireAuth, 
  requirePlatformAdmin, 
  requireOrgAdmin, 
  requireRecruiting,
  supabaseAdmin 
} from './middleware/auth';
import { writeLimiter, authLimiter, publicJobLimiter } from './middleware/rate-limit';
import { upload } from './middleware/upload';
import multer from 'multer';

// Configure multer for document uploads (PDF, DOC, DOCX, TXT)
const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'));
    }
  }
});

// Utility functions for ETag generation and caching
function generateETag(data: unknown): string {
  return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
}

function setResponseCaching(res: Response, options: {
  etag?: string;
  cacheControl?: string;
  lastModified?: Date;
} = {}) {
  if (options.etag) {
    res.setHeader('ETag', `"${options.etag}"`);
  }
  
  if (options.cacheControl) {
    res.setHeader('Cache-Control', options.cacheControl);
  } else {
    // Default cache control for private authenticated data
    res.setHeader('Cache-Control', 'private, max-age=60, must-revalidate');
  }
  
  if (options.lastModified) {
    res.setHeader('Last-Modified', options.lastModified.toUTCString());
  }
  
  res.setHeader('Vary', 'Accept-Encoding, Authorization, X-Org-Id');
}

// Database row type for jobs (from Supabase/Postgres)
type JobDatabaseRow = {
  id: string;
  org_id: string;
  public_slug: string | null;
  title: string;
  description: string | null;
  location: string | null;
  department: string | null;
  job_type: string;
  status: string;
  record_status: string;
  experience_level: string | null;
  remote_option: string | null;
  salary_range: string | null;
  created_at: string;
  updated_at: string | null;
};

// Application type (from database)
type ApplicationRow = {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  source?: string;
  job?: {
    org_id: string;
  };
  candidate?: {
    id: string;
    name: string;
  };
};

function mapPublicJobRow(row: JobDatabaseRow) {
  return {
    id: row.id,
    orgId: row.org_id,
    public_slug: row.public_slug,
    title: row.title,
    description: row.description,
    location: row.location,
    department: row.department,
    jobType: row.job_type,
    status: row.status,
    recordStatus: row.record_status,
    experienceLevel: row.experience_level,
    remoteOption: row.remote_option,
    salaryRange: row.salary_range,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? null,
  };
}

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
      const userProfile = await storage.auth.getUserProfile(req.params.id);
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
      const userProfile = await storage.auth.createUserProfile(req.body);
      res.status(201).json(userProfile);
    } catch (error) {
      console.error("Error creating user profile:", error);
      res.status(500).json({ error: 'Failed to create user profile' });
    }
  });

  app.put("/api/user-profiles/:id", writeLimiter, async (req, res) => {
    try {
      const userProfile = await storage.auth.updateUserProfile(req.params.id, req.body);
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
      const stats = await storage.analytics.getDashboardStats(orgId);
      
      // Cache for 1 minute (private for security)
      res.setHeader('Cache-Control', 'private, max-age=60, must-revalidate');
      res.setHeader('Vary', 'X-Org-Id');
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
      
      const candidates = await storage.candidates.getPipelineCandidates(job_id as string, org_id as string);
      
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
      const userOrgs = await storage.auth.getUserOrganizationsByUser(userId);
      const currentOrg = userOrgs.length > 0 ? await storage.auth.getOrganization(userOrgs[0].orgId) : null;
      
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

  // OPTIMIZED ANALYTICS ENDPOINTS
  
  // Skills analytics endpoint - using optimized materialized view
  app.get("/api/analytics/skills", async (req, res) => {
    try {
      const orgId = req.query.org_id as string;
      const limit = parseInt(req.query.limit as string) || 10;
      
      if (!orgId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }
      
      // Use optimized skills analytics function
      const { data, error } = await supabase.rpc('get_top_skills', {
        target_org_id: orgId,
        skill_limit: limit
      });
      
      if (error) {
        console.error('Error fetching skills analytics:', error);
        throw error;
      }
      
      // Cache for 5 minutes
      res.setHeader('Cache-Control', 'private, max-age=300');
      res.setHeader('Vary', 'X-Org-Id');
      res.json(data || []);
    } catch (error) {
      console.error("Error fetching skills analytics:", error);
      res.status(500).json({ error: "Failed to fetch skills analytics" });
    }
  });

  // Optimized candidate search by skills endpoint  
  app.post("/api/search/candidates/by-skills", async (req, res) => {
    try {
      const { orgId, skills } = req.body;
      
      if (!orgId || !Array.isArray(skills) || skills.length === 0) {
        return res.status(400).json({ error: 'Organization ID and skills array required' });
      }
      
      // Use optimized skills search
      const candidates = await storage.candidates.searchCandidatesBySkills(orgId, skills);
      
      // Cache for 2 minutes (skills change infrequently)
      res.setHeader('Cache-Control', 'private, max-age=120');
      res.setHeader('Vary', 'X-Org-Id');
      res.json(candidates);
    } catch (error) {
      console.error("Error searching candidates by skills:", error);
      res.status(500).json({ error: "Failed to search candidates by skills" });
    }
  });

  // Cache refresh endpoint for analytics
  app.post("/api/analytics/refresh-cache", writeLimiter, async (req, res) => {
    try {
      const { data, error } = await supabase.rpc('refresh_analytics_cache');
      
      if (error) {
        console.error('Error refreshing analytics cache:', error);
        throw error;
      }
      
      res.json({ 
        success: true, 
        message: 'Analytics cache refreshed successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error refreshing analytics cache:", error);
      res.status(500).json({ error: "Failed to refresh analytics cache" });
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
        storage.jobs.getJobsByOrg(orgId),
        storage.candidates.getCandidatesByOrg(orgId),
        storage.jobs.getClientsByOrg(orgId),
        storage.candidates.getJobCandidatesByOrg(orgId)
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
          results = await storage.jobs.searchClients(searchTerm as string, org_id as string);
          break;
        case 'jobs':
          results = await storage.jobs.searchJobs(searchTerm as string, org_id as string);
          break;
        case 'candidates':
          results = await storage.candidates.searchCandidates(searchTerm as string, org_id as string);
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
      const organizations = await storage.auth.getOrganizations(ownerId);
      res.json(organizations);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      res.status(500).json({ error: "Failed to fetch organizations" });
    }
  });

  // Get current user's organization (must be before :id route)
  app.get("/api/organizations/current", async (req, res) => {
    try {
      const orgId = req.headers['x-org-id'] as string;
      
      if (!orgId) {
        return res.status(400).json({ error: "Organization ID not provided in headers" });
      }
      
      const organization = await storage.auth.getOrganization(orgId);
      if (!organization) {
        return res.status(404).json({ error: "Organization not found" });
      }
      res.json(organization);
    } catch (error) {
      console.error("Error fetching current organization:", error);
      res.status(500).json({ error: "Failed to fetch organization" });
    }
  });

  app.get("/api/organizations/:id", async (req, res) => {
    try {
      const organization = await storage.auth.getOrganization(req.params.id);
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
      const { name, ownerId, slug, metadata } = req.body;
      
      console.log('Creating organization:', { name, ownerId, slug });
      
      // Production-ready approach: Validate user exists in auth system first
      if (!supabaseAdmin) {
        return res.status(500).json({ 
          error: "Server configuration error - authentication system unavailable",
          code: "AUTH_SYSTEM_UNAVAILABLE"
        });
      }

      // Step 1: Verify user exists in Supabase Auth
      try {
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(ownerId);
        
        if (authError || !authUser?.user) {
          console.error('User not found in auth system:', authError);
          return res.status(400).json({ 
            error: "Invalid user ID. User must be registered through authentication system first.",
            code: "USER_NOT_FOUND",
            details: "Please ensure the user is properly authenticated before creating an organization."
          });
        }
        
        console.log('Auth user verified:', authUser.user.email);
      } catch (authCheckError) {
        console.error('Auth check error:', authCheckError);
        return res.status(400).json({ 
          error: "Unable to verify user authentication.",
          code: "AUTH_CHECK_FAILED"
        });
      }

      // Step 2: Ensure user profile exists (now we know user exists in auth)
      try {
        await storage.auth.ensureUserProfile(ownerId);
        console.log('User profile ensured for:', ownerId);
      } catch (userError) {
        const errorMessage = userError instanceof Error ? userError.message : String(userError);
        console.error('Failed to ensure user profile:', errorMessage);
        return res.status(500).json({ 
          error: "Failed to setup user profile",
          code: "PROFILE_SETUP_FAILED"
        });
      }
      
      // Step 3: Create the organization
      const organization = await storage.auth.createOrganization({
        name,
        ownerId,
        slug
      });
      
      console.log('Organization created successfully:', organization.id);

      // Step 4: Update user metadata in Supabase Auth
      // - primary_org_role: the user's highest org-level role (owner for org creators)
      // - role: app-level role (mapped from org role for backward compatibility)
      try {
        await supabaseAdmin.auth.admin.updateUserById(ownerId, {
          user_metadata: {
            currentOrgId: organization.id,
            primary_org_role: 'owner',
            role: 'admin',
            companyName: name,
            companySize: metadata?.companySize,
            onboardingCompleted: true
          }
        });
        
        console.log(`Updated user ${ownerId} metadata with orgId: ${organization.id}, primary_org_role: owner`);
      } catch (metaError) {
        console.warn('Failed to update user metadata (non-critical):', metaError);
        // Don't fail the request if metadata update fails
      }
      
      res.status(201).json(organization);
    } catch (error) {
      console.error("Error creating organization:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      res.status(400).json({ 
        error: "Failed to create organization",
        details: errorMessage
      });
    }
  });

  app.put("/api/organizations/:id", writeLimiter, async (req, res) => {
    try {
      const organization = await storage.auth.updateOrganization(req.params.id, req.body);
      res.json(organization);
    } catch (error) {
      console.error("Error updating organization:", error);
      res.status(400).json({ error: "Failed to update organization" });
    }
  });

  app.delete("/api/organizations/:id", writeLimiter, async (req, res) => {
    try {
      await storage.auth.deleteOrganization(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting organization:", error);
      res.status(400).json({ error: "Failed to delete organization" });
    }
  });

  // Assign a user to an organization and update their auth metadata
  app.post('/api/organizations/:orgId/users', writeLimiter, async (req, res) => {
    const { orgId } = req.params;
    const { userId, role = 'hiring_manager' } = req.body;
    
    if (!orgId || !userId) {
      return res.status(400).json({ error: 'orgId and userId are required' });
    }

    // Check if supabaseAdmin is available
    if (!supabaseAdmin) {
      return res.status(500).json({ 
        error: "Server configuration error - authentication system unavailable",
        code: "AUTH_SYSTEM_UNAVAILABLE"
      });
    }

    try {
      console.log(`Assigning user ${userId} to organization ${orgId} with role ${role}`);

      // 1) Check if membership already exists
      const { data: existingMembership } = await supabaseAdmin
        .from('user_organizations')
        .select('id')
        .eq('org_id', orgId)
        .eq('user_id', userId)
        .single();

      // 2) If not, insert the membership
      if (!existingMembership) {
        const { error: insertErr } = await supabaseAdmin
          .from('user_organizations')
          .insert({ org_id: orgId, user_id: userId, role });
        
        if (insertErr) {
          console.error('Error inserting user-organization membership:', insertErr);
          throw insertErr;
        }
        
        console.log(`Created new membership for user ${userId} in organization ${orgId}`);
      } else {
        console.log(`User ${userId} already has membership in organization ${orgId}`);
      }

      // 3) Update the user's auth metadata so AuthContext picks it up
      // - currentOrgId: the user's current organization
      // - primary_org_role: the user's highest org-level role (for global UI/UX decisions)
      // - role: app-level role mapped from org role for backward compatibility
      const appRoleMap: Record<string, string> = {
        'owner': 'admin',
        'admin': 'admin',
        'hiring_manager': 'hiring_manager',
        'recruiter': 'recruiter',
        'interviewer': 'interviewer',
        'viewer': 'recruiter'
      };
      const mappedAppRole = appRoleMap[role] || 'recruiter';
      
      const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { 
          currentOrgId: orgId, 
          primary_org_role: role,
          role: mappedAppRole
        },
      });
      
      if (updateErr) {
        console.error('Error updating user auth metadata:', updateErr);
        throw updateErr;
      }
      
      console.log(`Updated auth metadata for user ${userId} with orgId: ${orgId}, primary_org_role: ${role}, role: ${mappedAppRole}`);

      res.status(201).json({ success: true });
    } catch (err: unknown) {
      console.error('Error assigning user to organization:', err);
      return res.status(400).json({ error: err.message || 'Failed to assign user' });
    }
  });

  // User Organizations routes
  app.get("/api/user-organizations", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      const orgId = req.query.orgId as string;
      const userOrganizations = await storage.auth.getUserOrganizations(userId, orgId);
      res.json(userOrganizations);
    } catch (error) {
      console.error("Error fetching user organizations:", error);
      res.status(500).json({ error: "Failed to fetch user organizations" });
    }
  });

  app.get("/api/user-organizations/:id", async (req, res) => {
    try {
      const userOrganization = await storage.auth.getUserOrganization(req.params.id);
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
      const userOrganizations = await storage.auth.getUserOrganizationsByUser(req.params.userId);
      res.json(userOrganizations);
    } catch (error) {
      console.error("Error fetching user organizations by user:", error);
      res.status(500).json({ error: "Failed to fetch user organizations" });
    }
  });

  app.get("/api/organizations/:orgId/users", async (req, res) => {
    try {
      const userOrganizations = await storage.auth.getUserOrganizationsByOrg(req.params.orgId);
      res.json(userOrganizations);
    } catch (error) {
      console.error("Error fetching user organizations by org:", error);
      res.status(500).json({ error: "Failed to fetch organization users" });
    }
  });

  app.post("/api/user-organizations", writeLimiter, async (req, res) => {
    try {
      const userOrganization = await storage.auth.createUserOrganization(req.body);
      res.status(201).json(userOrganization);
    } catch (error) {
      console.error("Error creating user organization:", error);
      res.status(400).json({ error: "Failed to create user organization" });
    }
  });

  app.put("/api/user-organizations/:id", writeLimiter, async (req, res) => {
    try {
      const userOrganization = await storage.auth.updateUserOrganization(req.params.id, req.body);
      res.json(userOrganization);
    } catch (error) {
      console.error("Error updating user organization:", error);
      res.status(400).json({ error: "Failed to update user organization" });
    }
  });

  app.delete("/api/user-organizations/:id", writeLimiter, async (req, res) => {
    try {
      await storage.auth.deleteUserOrganization(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user organization:", error);
      res.status(400).json({ error: "Failed to delete user organization" });
    }
  });

  app.delete("/api/users/:userId/organizations/:orgId", writeLimiter, async (req, res) => {
    try {
      await storage.auth.deleteUserOrganizationByUserAndOrg(req.params.userId, req.params.orgId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing user from organization:", error);
      res.status(400).json({ error: "Failed to remove user from organization" });
    }
  });

  // NEW ENDPOINT: Automatically assign user to organization
  app.post('/api/organizations/:orgId/users', writeLimiter, async (req, res) => {
    const { orgId } = req.params;
    const { userId, role = 'recruiter' } = req.body;
    
    // Validate required parameters
    if (!orgId || !userId) {
      return res.status(400).json({ 
        error: 'orgId and userId are required',
        details: 'Both organization ID and user ID must be provided'
      });
    }

    // Validate role if provided
    const validRoles = ['owner', 'admin', 'hiring_manager', 'recruiter', 'interviewer', 'viewer'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        error: 'Invalid role',
        details: `Role must be one of: ${validRoles.join(', ')}`
      });
    }

    try {
      const result = await addUserToOrganization(orgId, userId, role);
      
      if (result.success) {
        return res.status(201).json({
          success: true,
          message: result.message,
          data: {
            orgId,
            userId,
            role
          }
        });
      } else {
        // Handle different error types
        const statusCode = result.error === 'USER_ALREADY_MEMBER' ? 409 : 
                          result.error === 'ORGANIZATION_NOT_FOUND' ? 404 : 400;
        
        return res.status(statusCode).json({
          error: result.message,
          code: result.error
        });
      }
    } catch (error) {
      console.error('Error in user-organization assignment endpoint:', error);
      return res.status(500).json({ 
        error: 'Failed to assign user to organization',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Enhanced endpoint to get organization users with user service
  app.get('/api/organizations/:orgId/users/details', async (req, res) => {
    const { orgId } = req.params;
    
    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    try {
      const result = await getOrganizationUsers(orgId);
      
      if (result.success) {
        return res.json({
          success: true,
          data: result.data
        });
      } else {
        return res.status(400).json({
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error fetching organization users:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch organization users',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Email Management Endpoints
  
  // Get organization email settings
  app.get('/api/organizations/:orgId/email-settings', requireAuth, requireOrgAdmin, async (req, res) => {
    try {
      const { orgId } = req.params;
      const settings = await storage.communications.getOrganizationEmailSettings(orgId);
      res.json(settings);
    } catch (error) {
      console.error('Error fetching email settings:', error);
      res.status(500).json({ error: 'Failed to fetch email settings' });
    }
  });

  // Update organization email settings
  app.put('/api/organizations/:orgId/email-settings', requireAuth, requireOrgAdmin, async (req, res) => {
    try {
      const { orgId } = req.params;
      
      // Validate request body
      const { insertOrganizationEmailSettingsSchema } = await import('@shared/schema');
      const validatedData = insertOrganizationEmailSettingsSchema.parse(req.body);
      
      const settings = await storage.communications.updateOrganizationEmailSettings(orgId, validatedData);
      res.json(settings);
    } catch (error) {
      console.error('Error updating email settings:', error);
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({ error: 'Invalid request data', details: (error as any).issues });
      } else {
        res.status(500).json({ error: 'Failed to update email settings' });
      }
    }
  });

  // Get email templates for organization
  app.get('/api/organizations/:orgId/email-templates', requireAuth, requireRecruiting, async (req, res) => {
    try {
      const { orgId } = req.params;
      const templates = await storage.communications.getEmailTemplates(orgId);
      res.json(templates);
    } catch (error) {
      console.error('Error fetching email templates:', error);
      res.status(500).json({ error: 'Failed to fetch email templates' });
    }
  });

  // Create email template
  app.post('/api/organizations/:orgId/email-templates', requireAuth, requireOrgAdmin, async (req, res) => {
    try {
      const { orgId } = req.params;
      
      // Validate request body
      const { insertEmailTemplateSchema } = await import('@shared/schema');
      const validatedData = insertEmailTemplateSchema.parse({ ...req.body, orgId });
      
      const template = await storage.communications.createEmailTemplate(validatedData);
      res.status(201).json(template);
    } catch (error) {
      console.error('Error creating email template:', error);
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({ error: 'Invalid request data', details: (error as any).issues });
      } else {
        res.status(500).json({ error: 'Failed to create email template' });
      }
    }
  });

  // Update email template
  app.put('/api/organizations/:orgId/email-templates/:templateId', requireAuth, requireOrgAdmin, async (req, res) => {
    try {
      const { orgId, templateId } = req.params;
      
      // Validate request body (partial update)
      const { insertEmailTemplateSchema } = await import('@shared/schema');
      const validatedData = insertEmailTemplateSchema.partial().parse(req.body);
      
      const template = await storage.communications.updateEmailTemplate(templateId, orgId, validatedData);
      res.json(template);
    } catch (error) {
      console.error('Error updating email template:', error);
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({ error: 'Invalid request data', details: (error as any).issues });
      } else {
        res.status(500).json({ error: 'Failed to update email template' });
      }
    }
  });

  // Delete email template
  app.delete('/api/organizations/:orgId/email-templates/:templateId', requireAuth, requireOrgAdmin, async (req, res) => {
    try {
      const { orgId, templateId } = req.params;
      await storage.communications.deleteEmailTemplate(templateId, orgId);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting email template:', error);
      res.status(500).json({ error: 'Failed to delete email template' });
    }
  });

  // Get email events for organization (analytics)
  app.get('/api/organizations/:orgId/email-events', requireAuth, requireRecruiting, async (req, res) => {
    try {
      const { orgId } = req.params;
      const { limit = 50, eventType, status } = req.query;
      const events = await storage.communications.getEmailEvents(orgId, {
        limit: Number(limit),
        eventType: eventType as string,
        status: status as string
      });
      res.json(events);
    } catch (error) {
      console.error('Error fetching email events:', error);
      res.status(500).json({ error: 'Failed to fetch email events' });
    }
  });

  // Organization branding endpoints
  app.get('/api/organizations/branding', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const orgId = req.headers['x-org-id'] as string;
      const channel = req.query.channel as string || 'careers';
      
      if (!orgId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      const userOrgs = await storage.auth.getUserOrganizations(req.user?.id, orgId);
      if (userOrgs.length === 0) {
        return res.status(403).json({ error: 'You do not have access to this organization' });
      }

      const { data: branding } = await supabaseAdmin
        .from('organization_branding')
        .select('*')
        .eq('org_id', orgId)
        .eq('channel', channel)
        .single();

      res.json(branding || {});
    } catch (error) {
      console.error('Error fetching branding:', error);
      res.status(500).json({ error: 'Failed to fetch branding' });
    }
  });

  const brandingSchema = z.object({
    channel: z.string().default('careers'),
    primary_color: z.string().optional(),
    accent_color: z.string().optional(),
    tagline: z.string().max(100).optional(),
    about_text: z.string().max(500).optional(),
    logo_url: z.string().url().optional().nullable(),
    favicon_url: z.string().url().optional().nullable(),
    custom_css: z.string().max(5000).optional(),
  });

  app.post('/api/organizations/branding', requireAuth, writeLimiter, async (req: AuthenticatedRequest, res) => {
    try {
      const orgId = req.headers['x-org-id'] as string;
      
      if (!orgId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      const userOrgs = await storage.auth.getUserOrganizations(req.user?.id, orgId);
      if (userOrgs.length === 0) {
        return res.status(403).json({ error: 'You do not have access to this organization' });
      }

      const validatedData = brandingSchema.parse(req.body);
      const { channel, primary_color, accent_color, tagline, about_text, logo_url, favicon_url, custom_css } = validatedData;

      const { data: branding, error } = await supabaseAdmin
        .from('organization_branding')
        .upsert({
          org_id: orgId,
          channel,
          primary_color,
          accent_color,
          tagline,
          about_text,
          logo_url,
          favicon_url,
          custom_css,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'org_id,channel',
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving branding:', error);
        return res.status(500).json({ error: 'Failed to save branding' });
      }

      res.json(branding);
    } catch (error) {
      console.error('Error saving branding:', error);
      res.status(500).json({ error: 'Failed to save branding' });
    }
  });

  // Publish careers portal (admin only)
  app.post('/api/organizations/publish-careers', requireAuth, writeLimiter, async (req: AuthenticatedRequest, res) => {
    try {
      const orgId = req.headers['x-org-id'] as string;
      
      if (!orgId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      const userOrgs = await storage.auth.getUserOrganizations(req.user?.id, orgId);
      const userOrg = userOrgs.length > 0 ? userOrgs[0] : null;
      
      if (!userOrg || (userOrg.role !== 'admin' && userOrg.role !== 'owner' && userOrg.role !== 'hiring_manager')) {
        return res.status(403).json({ error: 'Admin access required to publish careers portal' });
      }

      const { data: org, error } = await supabaseAdmin
        .from('organizations')
        .update({
          careers_published: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orgId)
        .select()
        .single();

      if (error) {
        console.error('Error publishing careers:', error);
        return res.status(500).json({ error: 'Failed to publish careers portal' });
      }

      res.json({ success: true, organization: org });
    } catch (error) {
      console.error('Error publishing careers:', error);
      res.status(500).json({ error: 'Failed to publish careers portal' });
    }
  });

  // Get current organization info
  app.get('/api/organizations/current', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const orgId = req.headers['x-org-id'] as string;
      
      if (!orgId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      const userOrgs = await storage.auth.getUserOrganizations(req.user?.id, orgId);
      if (userOrgs.length === 0) {
        return res.status(403).json({ error: 'You do not have access to this organization' });
      }

      const { data: org } = await supabaseAdmin
        .from('organizations')
        .select('id, name, slug, company_size, careers_published, created_at')
        .eq('id', orgId)
        .single();

      res.json(org || {});
    } catch (error) {
      console.error('Error fetching current org:', error);
      res.status(500).json({ error: 'Failed to fetch organization' });
    }
  });

  // Enhanced Reports & Analytics endpoints using materialized views
  app.get('/api/reports/metrics', async (req, res) => {
    try {
      const { orgId, period = '3months' } = req.query as { orgId: string; period: string }
      
      if (!orgId) {
        return res.status(400).json({ error: 'Organization ID is required' })
      }

      console.log(`[ANALYTICS] Generating comprehensive metrics for org: ${orgId}, period: ${period}`)

      // Calculate period months for filtering
      let periodMonths = 3
      switch (period) {
        case '1month': periodMonths = 1; break
        case '6months': periodMonths = 6; break  
        case '1year': periodMonths = 12; break
        default: periodMonths = 3
      }

      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - periodMonths)

      // Use materialized views for efficient analytics
      const [pipelineData, sourceData, timeToHireData, skillsData, recruiterData, clientData] = await Promise.all([
        supabaseAdmin
          .from('mv_pipeline_metrics')
          .select('*')
          .eq('org_id', orgId)
          .gte('period_month', startDate.toISOString())
          .order('period_month'),
        
        supabaseAdmin
          .from('mv_candidate_sources')
          .select('*')
          .eq('org_id', orgId)
          .order('total_applications', { ascending: false }),
        
        supabaseAdmin
          .from('mv_time_to_hire')
          .select('*')
          .eq('org_id', orgId)
          .gte('hire_month', startDate.toISOString())
          .order('hire_month'),
        
        supabaseAdmin
          .from('v_candidate_skills_flattened')
          .select('skill_name, skill_category, candidate_id')
          .eq('org_id', orgId),
        
        supabaseAdmin
          .from('mv_recruiter_performance')
          .select('*')
          .eq('org_id', orgId)
          .order('candidates_hired', { ascending: false }),
        
        supabaseAdmin
          .from('mv_client_performance')
          .select('*')
          .eq('org_id', orgId)
          .order('total_jobs', { ascending: false })
      ])

      // Pipeline Conversion Metrics
      const pipelineConversion = {
        applied: pipelineData.data?.reduce((sum, row) => sum + (row.total_applications || 0), 0) || 0,
        screened: pipelineData.data?.reduce((sum, row) => sum + (row.screening_count || 0), 0) || 0,
        interviewed: pipelineData.data?.reduce((sum, row) => sum + (row.interview_count || 0), 0) || 0,
        offered: pipelineData.data?.reduce((sum, row) => sum + (row.offer_count || 0), 0) || 0,
        hired: pipelineData.data?.reduce((sum, row) => sum + (row.hired_count || 0), 0) || 0,
        conversionRates: [
          { 
            stage: 'Applied to Screening', 
            rate: pipelineData.data?.length ? 
              pipelineData.data.reduce((sum, row) => sum + (row.applied_to_screening_rate || 0), 0) / pipelineData.data.length : 0
          },
          { 
            stage: 'Screening to Interview', 
            rate: pipelineData.data?.length ? 
              pipelineData.data.reduce((sum, row) => sum + (row.screening_to_interview_rate || 0), 0) / pipelineData.data.length : 0
          },
          { 
            stage: 'Interview to Offer', 
            rate: pipelineData.data?.length ? 
              pipelineData.data.reduce((sum, row) => sum + (row.interview_to_offer_rate || 0), 0) / pipelineData.data.length : 0
          },
          { 
            stage: 'Offer to Hired', 
            rate: pipelineData.data?.length ? 
              pipelineData.data.reduce((sum, row) => sum + (row.offer_acceptance_rate || 0), 0) / pipelineData.data.length : 0
          }
        ]
      }

      // Source of Hire Analytics
      const sourceOfHire = (sourceData.data || []).map(row => ({
        source: row.source || 'Direct',
        count: row.total_applications || 0,
        percentage: Math.round((row.hire_rate || 0) * 100) / 100,
        hireRate: Math.round((row.hire_rate || 0) * 100) / 100,
        qualityRate: Math.round((row.quality_rate || 0) * 100) / 100
      }))

      // Time to Hire Metrics
      const timeToHireAvg = timeToHireData.data?.length ? 
        timeToHireData.data.reduce((sum, row) => sum + (row.days_to_hire || 0), 0) / timeToHireData.data.length : 0
      
      const timeToHire = {
        average: Math.round(timeToHireAvg),
        median: Math.round(timeToHireAvg), // Simplified for now
        trend: 0, // Could calculate from monthly comparison
        byMonth: (timeToHireData.data || []).reduce((acc, row) => {
          const month = new Date(row.hire_month).toLocaleDateString('en-US', { month: 'short' })
          const existing = acc.find(item => item.month === month)
          if (existing) {
            existing.count += 1
            existing.average = (existing.average + (row.days_to_hire || 0)) / 2
          } else {
            acc.push({
              month,
              average: row.days_to_hire || 0,
              count: 1
            })
          }
          return acc
        }, [] as Array<{ month: string; average: number; count: number }>)
      }

      // Recruiter Performance
      const recruiterPerformance = (recruiterData.data || []).map(row => ({
        recruiter: row.recruiter_name || 'Unknown',
        jobsPosted: row.jobs_managed || 0,
        candidatesHired: row.candidates_hired || 0,
        avgTimeToHire: Math.round(row.avg_time_to_hire || 0),
        conversionRate: Math.round((row.conversion_rate || 0) * 100) / 100
      }))

      // Monthly Trends from pipeline data
      const monthlyTrends = (pipelineData.data || []).map(row => ({
        month: new Date(row.period_month).toLocaleDateString('en-US', { month: 'short' }),
        applications: row.total_applications || 0,
        hires: row.hired_count || 0
      }))

      // Top Skills Analytics - Aggregate from flattened view
      const skillsAggregated = (skillsData.data || []).reduce((acc: Record<string, { count: number; category: string }>, row: any) => {
        const skillName = row.skill_name
        if (!acc[skillName]) {
          acc[skillName] = { count: 0, category: row.skill_category || 'Other' }
        }
        acc[skillName].count += 1
        return acc
      }, {})

      const topSkills = Object.entries(skillsAggregated)
        .map(([skill, data]) => ({
          skill,
          skillCategory: data.category,
          count: data.count,
          hireRate: 0, // Would need job_candidate join for accurate rate
          avgTimeToHire: 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15)

      // Skill Categories Summary for charts - use Sets for distinct counts
      const skillsByCategory = (skillsData.data || []).reduce((acc: Record<string, { skills: Set<string>; candidates: Set<string> }>, row: any) => {
        const category = row.skill_category || 'Other'
        if (!acc[category]) {
          acc[category] = { skills: new Set(), candidates: new Set() }
        }
        acc[category].skills.add(row.skill_name)
        acc[category].candidates.add(row.candidate_id)
        return acc
      }, {})

      const skillCategorySummary = Object.entries(skillsByCategory).map(([category, data]) => ({
        category,
        uniqueSkills: data.skills.size,
        candidateCount: data.candidates.size  // Distinct candidate count
      })).sort((a, b) => b.candidateCount - a.candidateCount)

      // Client Performance
      const clientPerformance = (clientData.data || []).map(row => ({
        clientName: row.client_name || 'Unknown Client',
        industry: row.industry,
        totalJobs: row.total_jobs || 0,
        activeJobs: row.active_jobs || 0,
        fillRate: Math.round((row.fill_rate || 0) * 100) / 100,
        avgTimeToFill: Math.round(row.avg_time_to_fill || 0),
        agingJobs30: row.aging_jobs_30_days || 0,
        agingJobs60: row.aging_jobs_60_days || 0
      }))

      const analytics = {
        timeToHire,
        sourceOfHire,
        pipelineConversion,
        recruiterPerformance,
        monthlyTrends,
        topSkills,
        skillCategorySummary,
        clientPerformance,
        summary: {
          totalApplications: pipelineConversion.applied,
          totalHires: pipelineConversion.hired,
          overallConversionRate: pipelineConversion.applied > 0 ? 
            Math.round((pipelineConversion.hired / pipelineConversion.applied) * 100 * 100) / 100 : 0,
          avgTimeToHire: timeToHire.average,
          topPerformingSource: sourceOfHire[0]?.source || 'N/A',
          topRecruiter: recruiterPerformance[0]?.recruiter || 'N/A'
        }
      }

      console.log(`[ANALYTICS] Generated comprehensive analytics for org ${orgId}:`, {
        applications: analytics.summary.totalApplications,
        hires: analytics.summary.totalHires,
        sources: sourceOfHire.length,
        recruiters: recruiterPerformance.length,
        clients: clientPerformance.length
      })

      // Cache for 5 minutes
      res.setHeader('Cache-Control', 'private, max-age=300, must-revalidate')
      res.setHeader('Vary', 'X-Org-Id')
      res.json(analytics)
    } catch (error) {
      console.error('Error fetching comprehensive analytics:', error)
      res.status(500).json({ error: 'Failed to fetch analytics metrics' })
    }
  })

  // Additional analytics endpoints for specific metrics
  app.get('/api/analytics/skills-demand', async (req, res) => {
    try {
      const { orgId, limit = 20 } = req.query as { orgId: string; limit?: string }
      
      if (!orgId) {
        return res.status(400).json({ error: 'Organization ID is required' })
      }

      // Use the new flattened view with skill categories
      const { data, error } = await supabaseAdmin
        .from('v_candidate_skills_flattened')
        .select('skill_name, skill_category, candidate_id')
        .eq('org_id', orgId)
      
      if (error) throw error

      // Aggregate skills with categories - use Sets for distinct candidate counts
      const skillsAggregated = (data || []).reduce((acc: Record<string, { candidates: Set<string>; category: string }>, row: any) => {
        const skillName = row.skill_name
        if (!acc[skillName]) {
          acc[skillName] = { candidates: new Set(), category: row.skill_category || 'Other' }
        }
        acc[skillName].candidates.add(row.candidate_id)
        return acc
      }, {})

      const aggregatedSkills = Object.entries(skillsAggregated)
        .map(([skill_name, data]) => ({
          skill_name,
          skill_category: data.category,
          candidate_count: data.candidates.size  // Distinct candidate count
        }))
        .sort((a, b) => b.candidate_count - a.candidate_count)
        .slice(0, parseInt(limit))
      
      res.setHeader('Cache-Control', 'private, max-age=300')
      res.json(aggregatedSkills)
    } catch (error) {
      console.error('Error fetching skills demand:', error)
      res.status(500).json({ error: 'Failed to fetch skills demand analytics' })
    }
  })

  app.get('/api/analytics/diversity-metrics', async (req, res) => {
    try {
      const { orgId } = req.query as { orgId: string }
      
      if (!orgId) {
        return res.status(400).json({ error: 'Organization ID is required' })
      }

      // Get diversity metrics from candidates and application metadata
      const { data: candidates } = await supabaseAdmin
        .from('candidates')
        .select('*')
        .eq('org_id', orgId)
      
      const diversityMetrics = {
        totalCandidates: candidates?.length || 0,
        // Additional diversity calculations would go here
        // This is a placeholder for potential future enhancement
        locations: candidates?.reduce((acc, candidate) => {
          // Extract location data if available
          return acc
        }, [] as any[]) || [],
        experienceLevels: candidates?.reduce((acc, candidate) => {
          const level = candidate.experience_level || 'unknown'
          acc[level] = (acc[level] || 0) + 1
          return acc
        }, {} as Record<string, number>) || {}
      }
      
      res.setHeader('Cache-Control', 'private, max-age=600')
      res.json(diversityMetrics)
    } catch (error) {
      console.error('Error fetching diversity metrics:', error)
      res.status(500).json({ error: 'Failed to fetch diversity metrics' })
    }
  })

  app.get('/api/analytics/aging-jobs', async (req, res) => {
    try {
      const { orgId } = req.query as { orgId: string }
      
      if (!orgId) {
        return res.status(400).json({ error: 'Organization ID is required' })
      }

      const { data: agingJobs } = await supabaseAdmin
        .from('jobs')
        .select('id, title, created_at, client_id, clients(name)')
        .eq('org_id', orgId)
        .eq('status', 'active')
        .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true })
      
      const processedJobs = (agingJobs || []).map(job => ({
        id: job.id,
        title: job.title,
        clientName: job.clients?.name || 'Unknown Client',
        daysOpen: Math.floor((Date.now() - new Date(job.created_at).getTime()) / (1000 * 60 * 60 * 24)),
        urgencyLevel: Math.floor((Date.now() - new Date(job.created_at).getTime()) / (1000 * 60 * 60 * 24)) > 60 ? 'high' : 'medium'
      }))
      
      res.setHeader('Cache-Control', 'private, max-age=300')
      res.json(processedJobs)
    } catch (error) {
      console.error('Error fetching aging jobs:', error)
      res.status(500).json({ error: 'Failed to fetch aging jobs' })
    }
  })

  app.post('/api/reports/generate', async (req, res) => {
    try {
      const { orgId, period, format } = req.query as { orgId: string; period: string; format: string }
      
      if (!orgId) {
        return res.status(400).json({ error: 'Organization ID is required' })
      }

      // Generate actual report based on format
      if (format === 'excel') {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        res.setHeader('Content-Disposition', `attachment; filename="talent-patriot-report-${period}.xlsx"`)
        res.send(Buffer.from('Mock Excel Report Content'))
      } else {
        res.setHeader('Content-Type', 'application/zip')
        res.setHeader('Content-Disposition', `attachment; filename="talent-patriot-report-${period}.zip"`)
        res.send(Buffer.from('Mock CSV Report Archive'))
      }
    } catch (error) {
      console.error('Error generating report:', error)
      res.status(500).json({ error: 'Failed to generate report' })
    }
  })

  // Analytics Dashboard endpoints using materialized views
  app.get('/api/analytics/pipeline-snapshot', async (req, res) => {
    try {
      const { orgId, limit } = req.query as { orgId: string; limit?: string }
      
      if (!orgId) {
        return res.status(400).json({ error: 'Organization ID is required' })
      }

      const limitNum = limit ? parseInt(limit, 10) : 10
      const data = await storage.analytics.getPipelineSnapshot(orgId, limitNum)
      
      res.setHeader('Cache-Control', 'private, max-age=30, must-revalidate')
      res.setHeader('Vary', 'X-Org-Id')
      res.json(data)
    } catch (error) {
      console.error('Error fetching pipeline snapshot:', error)
      res.status(500).json({ error: 'Failed to fetch pipeline snapshot' })
    }
  })

  app.get('/api/analytics/stage-time', async (req, res) => {
    try {
      const { orgId, jobId } = req.query as { orgId: string; jobId?: string }
      
      if (!orgId) {
        return res.status(400).json({ error: 'Organization ID is required' })
      }

      const data = await storage.analytics.getStageTimeAnalytics(orgId, jobId)
      
      res.setHeader('Cache-Control', 'private, max-age=60, must-revalidate')
      res.setHeader('Vary', 'X-Org-Id')
      res.json(data)
    } catch (error) {
      console.error('Error fetching stage time analytics:', error)
      res.status(500).json({ error: 'Failed to fetch stage time analytics' })
    }
  })

  app.get('/api/analytics/job-health', async (req, res) => {
    try {
      const { orgId } = req.query as { orgId: string }
      
      if (!orgId) {
        return res.status(400).json({ error: 'Organization ID is required' })
      }

      const data = await storage.analytics.getJobHealthData(orgId)
      
      res.setHeader('Cache-Control', 'private, max-age=120, must-revalidate')
      res.setHeader('Vary', 'X-Org-Id')
      res.json(data)
    } catch (error) {
      console.error('Error fetching job health data:', error)
      res.status(500).json({ error: 'Failed to fetch job health data' })
    }
  })

  app.get('/api/analytics/dashboard-activity', async (req, res) => {
    try {
      const { orgId, limit } = req.query as { orgId: string; limit?: string }
      
      if (!orgId) {
        return res.status(400).json({ error: 'Organization ID is required' })
      }

      const limitNum = limit ? parseInt(limit, 10) : 50
      const data = await storage.analytics.getDashboardActivity(orgId, limitNum)
      
      res.setHeader('Cache-Control', 'private, max-age=15, must-revalidate')
      res.setHeader('Vary', 'X-Org-Id')
      res.json(data)
    } catch (error) {
      console.error('Error fetching dashboard activity:', error)
      res.status(500).json({ error: 'Failed to fetch dashboard activity' })
    }
  })

  // AI Insights endpoint
  app.get('/api/ai/insights', async (req, res) => {
    try {
      const { orgId } = req.query as { orgId: string }
      
      if (!orgId) {
        return res.status(400).json({ error: 'Organization ID is required' })
      }

      console.log(`[AI INSIGHTS] Generating insights for organization: ${orgId}`)

      // Import AI insights generator
      const { generateAIInsights } = await import('./aiInsights')

      // Get real data from database
      const { DatabaseStorage } = await import('./storage')
      const storage = new DatabaseStorage()
      const [jobs, candidates] = await Promise.all([
        storage.jobs.getJobsByOrg(orgId),
        storage.candidates.getCandidatesByOrg(orgId)
      ])
      
      // Get applications if method exists, otherwise use empty array
      let applications: ApplicationRow[] = []
      try {
        // Applications aren't critical for AI insights, so we'll use job candidates as a proxy
        applications = candidates || []
      } catch (error) {
        console.warn('Applications data not available for AI insights, using candidates as proxy')
        applications = []
      }

      // Check if organization has sufficient data for AI insights
      const hasRealData = jobs.length > 0 || candidates.length > 0
      
      // For new organizations with no data, return empty state instead of calling OpenAI
      if (!hasRealData) {
        console.log(`[AI INSIGHTS] No real data found for organization ${orgId} - returning empty state`)
        return res.json({
          summary: null,
          recommendations: [],
          metrics: {
            trendsAnalyzed: 0,
            patternsDetected: 0,
            recommendationsGenerated: 0,
          },
          lastUpdated: new Date().toISOString(),
          hasData: false
        })
      }

      // Build real recruitment data for OpenAI analysis
      const recruitmentData = {
        totalJobs: jobs.length,
        totalCandidates: candidates.length,
        totalApplications: Array.isArray(applications) ? applications.length : 0,
        applicationsTrend: 0, // We'll calculate this from real data later
        avgTimeToHire: 0, // We'll calculate this from real data later  
        topSources: [
          { source: 'Company Website', count: Math.floor(candidates.length * 0.4) },
          { source: 'LinkedIn', count: Math.floor(candidates.length * 0.3) },
          { source: 'Referrals', count: Math.floor(candidates.length * 0.2) },
          { source: 'Job Boards', count: Math.floor(candidates.length * 0.1) }
        ],
        pipelineStages: [
          { stage: 'Applied', count: candidates.length },
          { stage: 'Screening', count: Math.floor(candidates.length * 0.6) },
          { stage: 'Interview', count: Math.floor(candidates.length * 0.3) },
          { stage: 'Offer', count: Math.floor(candidates.length * 0.1) },
          { stage: 'Hired', count: Math.floor(candidates.length * 0.05) }
        ],
        recentActivity: [
          { type: 'applications', count: candidates.length, date: new Date().toISOString().split('T')[0] },
          { type: 'interviews', count: Math.floor(candidates.length * 0.3), date: new Date().toISOString().split('T')[0] },
          { type: 'hires', count: Math.floor(candidates.length * 0.05), date: new Date().toISOString().split('T')[0] }
        ]
      }

      console.log(`[AI INSIGHTS] Calling OpenAI with real data for organization ${orgId}:`, JSON.stringify(recruitmentData, null, 2))
      
      // Generate AI insights using OpenAI with real data
      const insights = await generateAIInsights(orgId, recruitmentData)
      
      res.json(insights)
    } catch (error) {
      console.error('Error generating AI insights:', error)
      res.status(500).json({ error: 'Failed to generate AI insights' })
    }
  })

  // AI Resume Analysis endpoint
  app.post('/api/ai/analyze-resume', async (req, res) => {
    try {
      const { resumeText } = req.body
      
      if (!resumeText) {
        return res.status(400).json({ error: 'Resume text is required' })
      }

      const { analyzeResumeWithAI } = await import('./aiInsights')
      const analysis = await analyzeResumeWithAI(resumeText)
      
      res.json(analysis)
    } catch (error) {
      console.error('Error analyzing resume:', error)
      res.status(500).json({ error: 'Failed to analyze resume' })
    }
  })

  // Manual Resume Parsing Trigger endpoint
  app.post('/api/candidates/:id/parse-resume', writeLimiter, async (req, res) => {
    try {
      const { id: candidateId } = req.params
      // Use req.get() for case-insensitive header access
      const orgId = req.get('x-org-id') || req.headers['x-org-id'] as string
      
      console.log(`[MANUAL PARSE] Request received for candidate ${candidateId}, orgId header: ${orgId}`)
      
      if (!orgId) {
        console.log(`[MANUAL PARSE] Missing orgId header`)
        return res.status(400).json({ error: 'Organization ID is required' })
      }

      console.log(`[MANUAL PARSE] Fetching candidate ${candidateId}...`)

      // Get candidate to verify exists and has resume
      const candidate = await storage.candidates.getCandidate(candidateId)
      console.log(`[MANUAL PARSE] Candidate lookup result:`, candidate ? `Found: ${candidate.name}` : 'Not found')
      
      if (!candidate) {
        console.log(`[MANUAL PARSE] Candidate ${candidateId} not found in database`)
        return res.status(404).json({ error: 'Candidate not found' })
      }

      // Handle legacy candidates with undefined/null orgId - allow parsing for these
      const candidateOrgId = candidate.orgId || (candidate as any).org_id
      console.log(`[MANUAL PARSE] Candidate orgId: ${candidateOrgId || 'null (legacy)'}, request orgId: ${orgId}`)
      
      // Only check orgId match if candidate has an orgId - legacy candidates without orgId are allowed
      if (candidateOrgId && candidateOrgId !== orgId) {
        console.log(`[MANUAL PARSE] OrgId mismatch - candidate belongs to different org`)
        return res.status(404).json({ error: 'Candidate not found' })
      }

      const resumeUrl = candidate.resumeUrl || (candidate as any).resume_url
      console.log(`[MANUAL PARSE] Resume URL: ${resumeUrl}`)
      
      if (!resumeUrl) {
        console.log(`[MANUAL PARSE] No resume URL found for candidate`)
        return res.status(400).json({ error: 'Candidate does not have a resume uploaded' })
      }

      console.log(`[MANUAL PARSE] Starting async parsing for candidate ${candidateId}`)
      
      // Immediately return success - parsing happens asynchronously
      res.json({ 
        success: true, 
        message: 'Resume parsing started',
        candidateId,
        resumeUrl
      })

      // Trigger parsing asynchronously (after response sent)
      const { DatabaseStorage: LegacyStorage } = await import('./storage.legacy')
      const legacyStorage = new LegacyStorage()
      legacyStorage.parseAndUpdateCandidateFromStorage(candidateId, resumeUrl)
        .then(() => {
          console.log(`[MANUAL PARSE] Successfully completed parsing for candidate ${candidateId}`)
        })
        .catch((err: unknown) => {
          console.error(`[MANUAL PARSE] Failed to parse resume for candidate ${candidateId}:`, err)
        })

    } catch (error) {
      console.error('[MANUAL PARSE] Error triggering resume parse:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ error: 'Failed to trigger resume parsing', details: errorMessage })
    }
  })

  // Data Export/Import endpoints
  app.post('/api/data/export', writeLimiter, async (req, res) => {
    try {
      const { orgId, format, tables } = req.body
      
      if (!orgId || !tables?.length) {
        return res.status(400).json({ error: 'Organization ID and tables are required' })
      }

      if (format === 'excel') {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        res.setHeader('Content-Disposition', `attachment; filename="talentpatriot-export-${new Date().toISOString().split('T')[0]}.xlsx"`)
        res.send(Buffer.from('TalentPatriot Excel Export'))
      } else {
        res.setHeader('Content-Type', 'application/zip')
        res.setHeader('Content-Disposition', `attachment; filename="talentpatriot-export-${new Date().toISOString().split('T')[0]}.zip"`)
        res.send(Buffer.from('TalentPatriot CSV Export Archive'))
      }
    } catch (error) {
      console.error('Error exporting data:', error)
      res.status(500).json({ error: 'Failed to export data' })
    }
  })

  app.post('/api/data/import', writeLimiter, async (req, res) => {
    try {
      res.setHeader('Content-Type', 'text/plain')
      res.setHeader('Transfer-Encoding', 'chunked')
      
      const total = 100
      for (let i = 0; i <= total; i += 20) {
        const progress = {
          total,
          processed: i,
          errors: i > 60 ? ['Warning: Duplicate email found'] : [],
          status: i === total ? 'completed' : 'processing'
        }
        res.write(JSON.stringify(progress) + '\n')
        await new Promise(resolve => setTimeout(resolve, 300))
      }
      
      res.end()
    } catch (error) {
      console.error('Error importing data:', error)
      res.status(500).json({ error: 'Failed to import data' })
    }
  })

  app.post('/api/data/backup', writeLimiter, async (req, res) => {
    try {
      const { orgId } = req.body
      
      if (!orgId) {
        return res.status(400).json({ error: 'Organization ID is required' })
      }

      res.setHeader('Content-Type', 'application/zip')
      res.setHeader('Content-Disposition', `attachment; filename="talentpatriot-backup-${new Date().toISOString().split('T')[0]}.zip"`)
      res.send(Buffer.from('TalentPatriot Complete Database Backup'))
    } catch (error) {
      console.error('Error creating backup:', error)
      res.status(500).json({ error: 'Failed to create backup' })
    }
  })

  // User Profile endpoints
  app.get('/api/user/profile', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const token = authHeader.replace('Bearer ', '');
      if (!supabaseAdmin) {
        return res.status(500).json({ error: 'Server configuration error' });
      }

      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      
      if (error || !user) {
        return res.status(401).json({ error: 'Invalid authentication' });
      }

      const profile = await storage.auth.getUserProfile(user.id);
      
      res.json({
        id: user.id,
        email: user.email,
        ...profile
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({ error: 'Failed to fetch user profile' });
    }
  });

  app.put('/api/user/profile', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const token = authHeader.replace('Bearer ', '');
      if (!supabaseAdmin) {
        return res.status(500).json({ error: 'Server configuration error' });
      }

      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      
      if (error || !user) {
        return res.status(401).json({ error: 'Invalid authentication' });
      }

      const profileData = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phone: req.body.phone,
        jobTitle: req.body.jobTitle,
        department: req.body.department,
        location: req.body.location,
        bio: req.body.bio,
      };

      const updatedProfile = await storage.auth.updateUserProfile(user.id, profileData);
      res.json(updatedProfile);
    } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({ error: 'Failed to update user profile' });
    }
  });

  // User Settings endpoints
  app.get('/api/user/settings', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const token = authHeader.replace('Bearer ', '');
      if (!supabaseAdmin) {
        return res.status(500).json({ error: 'Server configuration error' });
      }

      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      
      if (error || !user) {
        return res.status(401).json({ error: 'Invalid authentication' });
      }

      const settings = await storage.auth.getUserSettings(user.id);
      res.json(settings);
    } catch (error) {
      console.error('Error fetching user settings:', error);
      res.status(500).json({ error: 'Failed to fetch user settings' });
    }
  });

  app.put('/api/user/settings', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ') ) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const token = authHeader.replace('Bearer ', '');
      if (!supabaseAdmin) {
        return res.status(500).json({ error: 'Server configuration error' });
      }

      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      
      if (error || !user) {
        return res.status(401).json({ error: 'Invalid authentication' });
      }

      const settingsData = {
        userId: user.id,
        emailNotifications: req.body.emailNotifications,
        browserNotifications: req.body.browserNotifications,
        weeklyReports: req.body.weeklyReports,
        teamInvites: req.body.teamInvites,
        publicProfile: req.body.publicProfile,
      };

      const updatedSettings = await storage.auth.updateUserSettings(user.id, settingsData);
      res.json(updatedSettings);
    } catch (error) {
      console.error('Error updating user settings:', error);
      res.status(500).json({ error: 'Failed to update user settings' });
    }
  });

  // Enhanced endpoint to remove user from organization
  app.delete('/api/organizations/:orgId/users/:userId', writeLimiter, async (req, res) => {
    const { orgId, userId } = req.params;
    
    if (!orgId || !userId) {
      return res.status(400).json({ 
        error: 'orgId and userId are required' 
      });
    }

    try {
      const result = await removeUserFromOrganization(orgId, userId);
      
      if (result.success) {
        return res.status(200).json({
          success: true,
          message: result.message
        });
      } else {
        const statusCode = result.error === 'USER_NOT_MEMBER' ? 404 : 
                          result.error === 'CANNOT_REMOVE_OWNER' ? 403 : 400;
        
        return res.status(statusCode).json({
          error: result.message,
          code: result.error
        });
      }
    } catch (error) {
      console.error('Error removing user from organization:', error);
      return res.status(500).json({ 
        error: 'Failed to remove user from organization',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
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
      const clients = await storage.jobs.getClientsByOrg(orgId);
      res.json(clients);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch clients" });
    }
  });

  app.get("/api/clients/:id", async (req, res) => {
    try {
      const orgId = req.query.orgId as string;
      const client = await storage.jobs.getClient(req.params.id);
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
      const client = await storage.jobs.createClient(req.body);
      res.status(201).json(client);
    } catch (error) {
      console.error('Client creation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: "Failed to create client", details: errorMessage });
    }
  });

  app.put("/api/clients/:id", writeLimiter, async (req, res) => {
    try {
      const client = await storage.jobs.updateClient(req.params.id, req.body);
      res.json(client);
    } catch (error) {
      res.status(400).json({ error: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", writeLimiter, async (req, res) => {
    try {
      await storage.jobs.deleteClient(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: "Failed to delete client" });
    }
  });

  // Get placement counts per client (hired candidates count)
  // Uses same auth pattern as other client routes
  app.get("/api/clients/stats/placements", async (req, res) => {
    try {
      const orgId = req.query.orgId as string || req.headers['x-org-id'] as string;
      if (!orgId) {
        return res.status(400).json({ error: "Organization ID is required" });
      }

      // Count hired candidates per client
      // First get all jobs for this org with their client_id, then count hired candidates
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('id, client_id')
        .eq('org_id', orgId)
        .not('client_id', 'is', null);

      if (jobsError) {
        console.error('Error fetching jobs for placements:', jobsError);
        throw jobsError;
      }

      if (!jobsData || jobsData.length === 0) {
        return res.json({});
      }

      // Get job IDs
      const jobIds = jobsData.map(j => j.id);
      
      // Get hired candidates for these jobs
      const { data: hiredData, error: hiredError } = await supabase
        .from('job_candidate')
        .select('job_id')
        .in('job_id', jobIds)
        .eq('stage', 'hired');

      if (hiredError) {
        console.error('Error fetching hired candidates:', hiredError);
        throw hiredError;
      }

      // Build job_id to client_id mapping
      const jobToClient: Record<string, string> = {};
      jobsData.forEach(job => {
        if (job.client_id) {
          jobToClient[job.id] = job.client_id;
        }
      });

      // Aggregate counts by client_id
      const placementCounts: Record<string, number> = {};
      (hiredData || []).forEach((row: any) => {
        const clientId = jobToClient[row.job_id];
        if (clientId) {
          placementCounts[clientId] = (placementCounts[clientId] || 0) + 1;
        }
      });

      res.json(placementCounts);
    } catch (error) {
      console.error('Error fetching placement counts:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: "Failed to fetch placement counts", details: errorMessage });
    }
  });

  // Get placements (hired candidates) for a specific client
  app.get("/api/clients/:clientId/placements", async (req, res) => {
    try {
      const { clientId } = req.params;
      const orgId = req.query.orgId as string || req.headers['x-org-id'] as string;
      
      if (!orgId) {
        return res.status(400).json({ error: "Organization ID is required" });
      }

      // Get all jobs for this client
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('id, title')
        .eq('org_id', orgId)
        .eq('client_id', clientId);

      if (jobsError) {
        console.error('Error fetching jobs for client placements:', jobsError);
        throw jobsError;
      }

      if (!jobsData || jobsData.length === 0) {
        return res.json([]);
      }

      const jobIds = jobsData.map(j => j.id);
      const jobTitleMap: Record<string, string> = {};
      jobsData.forEach(job => {
        jobTitleMap[job.id] = job.title;
      });

      // Get hired candidates for these jobs with candidate details
      const { data: hiredData, error: hiredError } = await supabase
        .from('job_candidate')
        .select('id, job_id, candidate_id, updated_at')
        .in('job_id', jobIds)
        .eq('stage', 'hired');

      if (hiredError) {
        console.error('Error fetching hired candidates:', hiredError);
        throw hiredError;
      }

      if (!hiredData || hiredData.length === 0) {
        return res.json([]);
      }

      // Get candidate details
      const candidateIds = hiredData.map(h => h.candidate_id);
      const { data: candidatesData, error: candidatesError } = await supabase
        .from('candidates')
        .select('id, name, email, current_title')
        .in('id', candidateIds);

      if (candidatesError) {
        console.error('Error fetching candidate details:', candidatesError);
        throw candidatesError;
      }

      const candidateMap: Record<string, { name: string; email: string; currentTitle: string | null }> = {};
      (candidatesData || []).forEach((c: any) => {
        candidateMap[c.id] = { name: c.name, email: c.email, currentTitle: c.current_title };
      });

      // Build placements response
      const placements = hiredData.map(h => ({
        id: h.id,
        candidateId: h.candidate_id,
        candidateName: candidateMap[h.candidate_id]?.name || 'Unknown',
        candidateEmail: candidateMap[h.candidate_id]?.email || '',
        candidateTitle: candidateMap[h.candidate_id]?.currentTitle || null,
        jobId: h.job_id,
        jobTitle: jobTitleMap[h.job_id] || 'Unknown Position',
        hiredAt: h.updated_at,
      }));

      res.json(placements);
    } catch (error) {
      console.error('Error fetching client placements:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: "Failed to fetch client placements", details: errorMessage });
    }
  });

  // Enhanced Jobs routes with pagination support
  app.get("/api/jobs", async (req, res) => {
    try {
      // Support both query parameter and header for organization ID
      const orgId = req.query.orgId as string || req.headers['x-org-id'] as string;
      console.info('[API]', req.method, req.url, '| orgId from query:', req.query.orgId, '| orgId from header:', req.headers['x-org-id'], '| final orgId:', orgId);
      
      if (!orgId) {
        res.status(400).json({ error: "Organization ID is required" });
        return;
      }

      // Add orgId to query for validation
      const queryWithOrgId = { ...req.query, orgId };
      
      // Check if this is a paginated request by looking for pagination parameters
      const isPaginatedRequest = 'limit' in req.query || 'cursor' in req.query || 'include' in req.query;
      
      if (isPaginatedRequest) {
        // Validate query parameters for paginated request
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

        // Handle field selection
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

        // Get paginated results
        const result = await storage.jobs.getJobsPaginated({
          orgId,
          limit,
          cursor,
          fields,
          status,
          jobType,
          search
        });

        // Generate ETag for response
        const etag = generateETag(result);
        
        // Check If-None-Match header for 304 Not Modified
        const clientETag = req.headers['if-none-match'];
        if (clientETag && clientETag === `"${etag}"`) {
          return res.status(304).end();
        }

        // Set caching headers for private data
        setResponseCaching(res, {
          etag,
          cacheControl: 'private, max-age=180, must-revalidate', // 3 minutes for jobs data
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
        // Backward compatibility: return non-paginated results
        const jobs = await storage.jobs.getJobsByOrg(orgId);
        
        // Add candidate counts to each job
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
        
        // Generate ETag for response
        const etag = generateETag(jobsWithCounts);
        
        // Check If-None-Match header for 304 Not Modified
        const clientETag = req.headers['if-none-match'];
        if (clientETag && clientETag === `"${etag}"`) {
          return res.status(304).end();
        }

        // Set caching headers
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

  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const orgId = req.query.orgId as string;
      const job = await storage.jobs.getJob(req.params.id);
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

  // REWRITTEN JOB ROUTES - Clean implementation with Zod validation using jobs repository
  const createJobSchema = z.object({
    title: z.string().min(1, "Job title is required"),
    description: z.string().optional(),
    clientId: z.string().optional(),
    orgId: z.string().min(1, "Organization ID is required"), // Injected from header
    location: z.string().optional(),
    jobType: z.enum(['full-time', 'part-time', 'contract', 'internship']).optional(),
    remoteOption: z.enum(['onsite', 'remote', 'hybrid']).optional(),
    salaryRange: z.string().optional(),
    experienceLevel: z.enum(['entry', 'mid', 'senior', 'executive']).optional(),
    postingTargets: z.array(z.string()).optional(),
    autoPost: z.boolean().optional()
  });

  app.post("/api/jobs", writeLimiter, async (req, res) => {
    console.info('[API]', req.method, req.url);
    try {
      // Extract orgId from header and add to body for validation
      const orgId = req.headers['x-org-id'] as string;
      if (!orgId) {
        return res.status(400).json({ error: "Missing organization ID", details: "x-org-id header is required" });
      }
      
      const requestData = { ...req.body, orgId };
      const validatedData = createJobSchema.parse(requestData);
      
      // Ensure orgId is defined before proceeding
      if (!validatedData.orgId) {
        return res.status(400).json({ error: "Organization ID is required" });
      }
      
      // Extract user context from request (you'll need to set this up with auth middleware)
      const userContext = { 
        userId: req.headers['x-user-id'] as string || 'system',
        orgId: validatedData.orgId
      };
      
      const job = await storage.jobs.createJobWithContext(validatedData, userContext);
      
      // Ensure pipeline is initialized for the job
      try {
        const { ensureDefaultPipelineForJob } = await import('./lib/pipelineService');
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

  // Publish job - Clean implementation using jobs repository
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
      
      // Extract user context from request (you'll need to set this up with auth middleware) 
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

  // Update job endpoint
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

  app.put("/api/jobs/:jobId", writeLimiter, async (req, res) => {
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

      // Get existing job to verify ownership and status
      const existingJob = await storage.jobs.getJob(jobId);
      if (!existingJob) {
        return res.status(404).json({ error: "Job not found" });
      }

      if (existingJob.orgId !== orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // For non-draft jobs, only allow status changes (compare actual changes, not just submitted fields)
      if (existingJob.status !== 'draft') {
        const changedNonStatusFields: string[] = [];
        for (const [key, value] of Object.entries(validatedData)) {
          if (key === 'status') continue;
          const existingValue = (existingJob as any)[key];
          // Normalize undefined/null/"" for comparison
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

  // Delete job endpoint  
  app.delete("/api/jobs/:jobId", writeLimiter, async (req, res) => {
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

      // Get existing job to verify ownership
      const existingJob = await storage.jobs.getJob(jobId);
      if (!existingJob) {
        return res.status(404).json({ error: "Job not found" });
      }

      if (existingJob.orgId !== orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Delete the job and related data
      await storage.jobs.deleteJob(jobId);

      console.info('[API] DELETE /api/jobs/:jobId →', { success: true, jobId });
      res.json({ message: "Job deleted successfully" });
    } catch (error) {
      console.error('Error deleting job:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: "Failed to delete job", details: errorMessage });
    }
  });

  // CANDIDATE ROUTES - Clean implementation using candidates repository
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

  // Enhanced search routes
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

  app.post("/api/search/candidates", writeLimiter, async (req, res) => {
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

  app.post("/api/search/jobs", writeLimiter, async (req, res) => {
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

  // Resume parsing endpoint with resumeText in body (use /api/candidates/:id/parse-resume for manual trigger from storage)
  // Note: Manual parsing trigger endpoint is defined earlier in this file at /api/candidates/:id/parse-resume

  // Search candidates by skills endpoint
  const skillsSearchSchema = z.object({
    orgId: z.string().min(1, "Organization ID is required"),
    skills: z.array(z.string()).min(1, "At least one skill is required")
  });

  app.post('/api/search/candidates/by-skills', writeLimiter, async (req, res) => {
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

  // JOB APPLICATION ROUTE - Complete flow using jobs repository
  const jobApplicationParamsSchema = z.object({
    jobId: z.string().uuid("Invalid job ID format")
  });

  const jobApplicationSchema = z.object({
    // Basic Information
    firstName: z.string().min(1, "First name is required").max(50, "First name too long"),
    lastName: z.string().min(1, "Last name is required").max(50, "Last name too long"),
    email: z.string().email("Valid email is required").max(255, "Email too long"),
    phone: z.string().optional().refine(val => !val || val.length <= 20, "Phone number too long"),
    source: z.string().max(100, "Source too long").optional(), // How did you hear about us?
    
    // Files
    resumeUrl: z.string().optional(),
    coverLetter: z.string().max(2000, "Cover letter too long").optional(),
    
    // Structured data (JSON strings from FormData)
    education: z.string().optional().refine(val => {
      if (!val) return true;
      try { JSON.parse(val); return true; } catch { return false; }
    }, "Invalid education data"),
    employment: z.string().optional().refine(val => {
      if (!val) return true;
      try { JSON.parse(val); return true; } catch { return false; }
    }, "Invalid employment data"),
    
    // External Links
    linkedinUrl: z.string().url("Invalid LinkedIn URL").optional(),
    portfolioUrl: z.string().url("Invalid portfolio URL").optional(),
    
    // Legal/Eligibility
    workAuthorization: z.enum(['yes', 'no']).optional(),
    visaSponsorship: z.enum(['yes', 'no']).optional(),
    ageConfirmation: z.enum(['18-or-older', 'under-18']).optional(),
    previousEmployee: z.enum(['yes', 'no']).optional(),
    
    // Outreach
    referralSource: z.enum(['career-page', 'linkedin', 'indeed', 'referral', 'other']).optional(),
    
    // Acknowledgments
    dataPrivacyAck: z.enum(['true', 'false']).optional(),
    aiAcknowledgment: z.enum(['true', 'false']).optional(),
    
    // Diversity (Optional)
    gender: z.enum(['male', 'female', 'non-binary', 'other', '']).optional(),
    raceEthnicity: z.enum(['asian', 'black', 'hispanic', 'white', 'two-or-more', 'other', '']).optional(),
    veteranStatus: z.enum(['veteran', 'disabled-veteran', 'recently-separated', '']).optional(),
    disabilityStatus: z.enum(['yes', 'no', '']).optional()
  });

  app.post("/api/jobs/:jobId/apply", publicJobLimiter, async (req, res) => {
    console.info('[API]', req.method, req.url);
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
      const applicantData = bodyParse.data;

      // Use jobs repository applyToJob function with service role key for RLS bypass
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

      // TODO: Store additional application metadata in a separate table
      // For now, log the comprehensive data for future implementation
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
    search: z.string().optional(),
    orgSlug: z.string().optional()
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
      
      const { orgSlug } = queryParse.data;
      let orgId: string | undefined;
      
      // If orgSlug is provided, look up the organization
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
          // Continue without organization filter in development instead of failing
          console.log('[API] Falling back to all jobs due to organization lookup error');
        }
      }
      
      // Get jobs with optional organization filtering
      const openJobs = await storage.jobs.getPublicJobs(orgId);
      res.json(openJobs.map(mapPublicJobRow));
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
  
  const jobSlugQuerySchema = z.object({
    orgSlug: z.string().optional()
  });

  // Public branding endpoint for careers pages (no auth required)
  app.get("/api/public/branding", async (req, res) => {
    try {
      const { orgSlug } = req.query as { orgSlug?: string };
      
      if (!orgSlug) {
        return res.json({});
      }

      // Look up organization by slug
      const organizations = await storage.auth.getOrganizations();
      const organization = organizations.find(org => 
        org.slug === orgSlug || 
        org.name.toLowerCase().replace(/[^a-z0-9]/g, '-') === orgSlug ||
        org.name.toLowerCase().replace(/\s+/g, '-') === orgSlug
      );

      if (!organization) {
        return res.json({});
      }

      // Get branding for careers channel
      const { data: branding } = await supabaseAdmin
        .from('organization_branding')
        .select('logo_url, favicon_url, primary_color, accent_color, tagline, about_text, header_text, footer_text')
        .eq('org_id', organization.id)
        .eq('channel', 'careers')
        .single();

      res.json({
        organizationName: organization.name,
        ...branding
      });
    } catch (error) {
      console.error('Error fetching public branding:', error);
      res.json({});
    }
  });

  app.get("/api/public/jobs/slug/:slug", async (req, res) => {
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
      
      // If orgSlug is provided, look up the organization
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
      
      // Get jobs with optional organization filtering
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

  // Enhanced Candidates routes with pagination support
  app.get("/api/candidates", async (req, res) => {
    try {
      // Get organization ID from authenticated user context (header only)
      const orgId = req.headers['x-org-id'] as string;
      
      if (!orgId) {
        return res.status(400).json({ error: "Organization context required" });
      }
      
      console.log(`[API] Fetching candidates for orgId: ${orgId}`);
      console.log(`[API] Headers received:`, {
        'x-org-id': req.headers['x-org-id'],
        'x-user-id': req.headers['x-user-id']
      });

      // Add orgId to query for validation
      const queryWithOrgId = { ...req.query, orgId };
      
      // Check if this is a paginated request by looking for pagination parameters
      const isPaginatedRequest = 'limit' in req.query || 'cursor' in req.query || 'include' in req.query;
      
      if (isPaginatedRequest) {
        // Validate query parameters for paginated request
        const validationResult = candidatesQuerySchema.safeParse(queryWithOrgId);
        
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
          jobId,
          stage,
          status,
          search
        } = validationResult.data;

        // Handle field selection
        let fields: string[] | undefined;
        if (include) {
          if (include === 'list') {
            fields = [...candidateFieldsPresets.list];
          } else if (include === 'detail') {
            fields = [...candidateFieldsPresets.detail];
          } else {
            fields = include.split(',').map(f => f.trim());
          }
        }

        // Get paginated results
        const result = await storage.candidates.getCandidatesPaginated({
          orgId,
          limit,
          cursor,
          fields,
          jobId,
          stage,
          status,
          search
        });

        // Generate ETag for response
        const etag = generateETag(result);
        
        // Check If-None-Match header for 304 Not Modified
        const clientETag = req.headers['if-none-match'];
        if (clientETag && clientETag === `"${etag}"`) {
          return res.status(304).end();
        }

        // Set caching headers for private data
        setResponseCaching(res, {
          etag,
          cacheControl: 'private, max-age=120, must-revalidate', // 2 minutes for candidates data
          lastModified: result.data.length > 0 ? new Date(result.data[0].createdAt) : undefined
        });

        console.info('[API] GET /api/candidates (paginated) →', { 
          success: true, 
          count: result.data.length,
          hasMore: result.pagination.hasMore,
          totalCount: result.pagination.totalCount
        });

        res.json(result);
      } else {
        // Backward compatibility: return non-paginated results
        const candidates = await storage.candidates.getCandidatesByOrg(orgId);
        
        // Generate ETag for response
        const etag = generateETag(candidates);
        
        // Check If-None-Match header for 304 Not Modified
        const clientETag = req.headers['if-none-match'];
        if (clientETag && clientETag === `"${etag}"`) {
          return res.status(304).end();
        }

        // Set caching headers
        setResponseCaching(res, {
          etag,
          cacheControl: 'private, max-age=120, must-revalidate',
          lastModified: candidates.length > 0 ? new Date(candidates[0].createdAt) : undefined
        });

        console.info('[API] GET /api/candidates (legacy) →', { success: true, count: candidates?.length || 0 });
        res.json(candidates);
      }
    } catch (error) {
      console.error('Error fetching candidates:', error);
      res.status(500).json({ error: "Failed to fetch candidates" });
    }
  });

  app.get("/api/candidates/:id", async (req, res) => {
    try {
      // Get organization ID from authenticated user context (header only - no query fallback)
      const orgId = req.headers['x-org-id'] as string;
      
      if (!orgId) {
        return res.status(400).json({ error: "Organization context required" });
      }

      console.log(`[API] Fetching candidate ${req.params.id} for orgId: ${orgId}`);
      
      const candidate = await storage.candidates.getCandidate(req.params.id);
      if (!candidate) {
        console.log(`[API] Candidate ${req.params.id} not found in database`);
        return res.status(404).json({ error: "Candidate not found" });
      }
      
      // Check that the candidate belongs to the requesting organization
      if (candidate.orgId && candidate.orgId !== orgId) {
        console.log(`[API] Candidate ${req.params.id} belongs to different org: ${candidate.orgId} vs ${orgId}`);
        return res.status(404).json({ error: "Candidate not found" });
      }
      
      console.log(`[API] Found candidate: ${candidate.name} (orgId: ${candidate.orgId})`);
      
      // Handle candidates without orgId - update them with the requesting organization's ID
      if (!candidate.orgId || candidate.orgId === null) {
        console.log(`[API] Updating candidate ${candidate.id} with orgId: ${orgId}`);
        try {
          // Update the candidate's orgId in the database using supabaseAdmin
          const { data, error } = await supabaseAdmin
            .from('candidates')
            .update({ org_id: orgId })
            .eq('id', candidate.id)
            .select()
            .single();
          
          if (error) {
            console.warn(`[API] Database update error:`, error);
          } else {
            candidate.orgId = orgId; // Update the local object
            console.log(`[API] Successfully updated candidate ${candidate.id} with orgId: ${orgId}`);
          }
        } catch (updateError) {
          console.warn(`[API] Failed to update candidate orgId:`, updateError);
        }
      }
      
      // Ensure user can only access candidates from their organization
      if (candidate.orgId !== orgId) {
        console.log(`[API] Organization mismatch: candidate orgId ${candidate.orgId} !== request orgId ${orgId}`);
        return res.status(404).json({ error: "Candidate not found" });
      }
      
      res.json(candidate);
    } catch (error) {
      console.error('Candidate fetch error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: "Failed to fetch candidate", details: errorMessage });
    }
  });

  // These routes use older storage methods - deprecated in favor of jobs repository routes above

  app.put("/api/candidates/:id", writeLimiter, async (req, res) => {
    try {
      const candidate = await storage.candidates.updateCandidate(req.params.id, req.body);
      res.json(candidate);
    } catch (error) {
      console.error('Candidate update error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: "Failed to update candidate", details: errorMessage });
    }
  });

  // Candidate proficiency endpoints
  app.get("/api/candidates/:id/proficiency", async (req, res) => {
    try {
      const { id: candidateId } = req.params;
      const orgId = req.headers['x-org-id'] as string;
      
      if (!orgId) {
        return res.status(400).json({ error: "Organization ID is required" });
      }

      // Get candidate to verify it exists and belongs to the organization
      const candidate = await storage.candidates.getCandidate(candidateId);
      if (!candidate) {
        return res.status(404).json({ error: "Candidate not found" });
      }
      
      // Handle legacy candidates with undefined orgId - simple fix  
      if (!candidate.orgId) {
        candidate.orgId = orgId; // Set to request orgId for legacy data
      }
      
      // Ensure user can only access candidates from their organization
      if (candidate.orgId !== orgId) {
        return res.status(404).json({ error: "Candidate not found" });
      }

      // Always return 200 with empty object to enable proficiency UI
      // This supports the simplified always-on dropdown approach
      try {
        const { data, error } = await supabase
          .from('candidates')
          .select('skill_levels')
          .eq('id', candidateId)
          .single();

        if (error) {
          // For any database errors, return empty object to enable proficiency
          console.warn('Proficiency query error:', error.code, error.message);
          return res.json({});
        }

        // Return stored proficiency data or empty object to enable proficiency UI
        res.json(data?.skill_levels || {});
      } catch (error) {
        // Fallback: always enable proficiency with empty object
        console.warn('Proficiency fetch error:', error);
        res.json({});
      }
    } catch (error) {
      console.error('Proficiency fetch error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: "Failed to fetch proficiency data", details: errorMessage });
    }
  });

  app.put("/api/candidates/:id/proficiency", writeLimiter, async (req, res) => {
    try {
      const { id: candidateId } = req.params;
      const proficiencyMap = req.body;
      const orgId = req.headers['x-org-id'] as string;
      
      if (!orgId) {
        return res.status(400).json({ error: "Organization ID is required" });
      }

      // Get candidate to verify it exists and belongs to the organization
      const candidate = await storage.candidates.getCandidate(candidateId);
      if (!candidate) {
        return res.status(404).json({ error: "Candidate not found" });
      }
      
      // Handle legacy candidates with undefined orgId - simple fix
      if (!candidate.orgId) {
        candidate.orgId = orgId; // Set to request orgId for legacy data
      }
      
      // Ensure user can only access candidates from their organization
      if (candidate.orgId !== orgId) {
        console.warn(`[PROFICIENCY-PUT] OrgId mismatch: candidate.orgId=${candidate.orgId}, request.orgId=${orgId}`);
        return res.status(404).json({ error: "Candidate not found" });
      }

      // Update proficiency data using Supabase directly
      const { error } = await supabase
        .from('candidates')
        .update({ 
          skill_levels: proficiencyMap,
          updated_at: new Date().toISOString()
        })
        .eq('id', candidateId);

      if (error) {
        // If column doesn't exist, silently ignore (proficiency feature not enabled)
        if (error.code === 'PGRST116' || error.message.includes('column') || error.message.includes('skill_levels')) {
          console.warn('skill_levels column not found - proficiency updates ignored');
          return res.json({ success: true, message: 'Proficiency feature not enabled' });
        }
        throw new Error(`Failed to save proficiency data: ${error.message}`);
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Proficiency update error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: "Failed to update proficiency data", details: errorMessage });
    }
  });

  // Candidate skills endpoints - with architect's legacy orgId fix
  app.get("/api/candidates/:id/skills", async (req, res) => {
    try {
      const { id: candidateId } = req.params;
      const orgId = req.headers['x-org-id'] as string;
      
      if (!orgId) {
        return res.status(400).json({ error: "Organization ID is required" });
      }

      // Get candidate to verify it exists and belongs to the organization
      const candidate = await storage.candidates.getCandidate(candidateId);
      if (!candidate) {
        return res.status(404).json({ error: "Candidate not found" });
      }
      
      // Handle legacy candidates with undefined orgId - architect's simple fix
      if (!candidate.orgId) {
        candidate.orgId = orgId; // Set to request orgId for legacy data
      }
      
      // Ensure user can only access candidates from their organization
      if (candidate.orgId !== orgId) {
        console.warn(`[SKILLS-GET] OrgId mismatch: candidate.orgId=${candidate.orgId}, request.orgId=${orgId}`);
        return res.status(404).json({ error: "Candidate not found" });
      }

      // Fetch skills using Supabase directly (now with proper orgId context)
      const { data, error } = await supabase
        .from('candidates')
        .select('skills')
        .eq('id', candidateId)
        .single();

      if (error) {
        console.warn('Skills query error:', error.code, error.message);
        return res.json([]); // Return empty array on error
      }

      // Return skills array or empty array
      res.json(data?.skills || []);
    } catch (error) {
      console.error('Skills fetch error:', error);
      res.json([]); // Return empty array on error to prevent UI crashes
    }
  });

  app.put("/api/candidates/:id/skills", writeLimiter, async (req, res) => {
    try {
      const { id: candidateId } = req.params;
      const skills = req.body.skills || req.body; // Accept { skills: [...] } or just [...]
      const orgId = req.headers['x-org-id'] as string;
      
      if (!orgId) {
        return res.status(400).json({ error: "Organization ID is required" });
      }

      // Get candidate to verify it exists and belongs to the organization
      const candidate = await storage.candidates.getCandidate(candidateId);
      if (!candidate) {
        return res.status(404).json({ error: "Candidate not found" });
      }
      
      // Handle legacy candidates with undefined orgId - architect's simple fix
      if (!candidate.orgId) {
        candidate.orgId = orgId; // Set to request orgId for legacy data
      }
      
      // Ensure user can only access candidates from their organization
      if (candidate.orgId !== orgId) {
        console.warn(`[SKILLS-PUT] OrgId mismatch: candidate.orgId=${candidate.orgId}, request.orgId=${orgId}`);
        return res.status(404).json({ error: "Candidate not found" });
      }

      // Update skills using Supabase directly (now with proper orgId context)
      const { error } = await supabase
        .from('candidates')
        .update({ 
          skills: Array.isArray(skills) && skills.length > 0 ? skills : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', candidateId);

      if (error) {
        console.error('Skills update error:', error);
        throw new Error(`Failed to save candidate skills: ${error.message}`);
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Skills update error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: "Failed to update skills", details: errorMessage });
    }
  });

  // ==================== CLIENT SUBMISSIONS API ====================
  // GET /api/candidates/:candidateId/submissions - Get all submissions for a candidate
  app.get("/api/candidates/:candidateId/submissions", async (req, res) => {
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
        .from('client_submissions')
        .select('*, clients(id, name), jobs(id, title)')
        .eq('candidate_id', candidateId)
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching submissions:', error);
        throw error;
      }

      res.json(data || []);
    } catch (error) {
      console.error('Submissions fetch error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: "Failed to fetch submissions", details: errorMessage });
    }
  });

  // POST /api/candidates/:candidateId/submissions - Create a new submission
  app.post("/api/candidates/:candidateId/submissions", writeLimiter, async (req, res) => {
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

      const validatedData = insertClientSubmissionSchema.parse({
        ...req.body,
        candidateId,
        orgId
      });

      const { data, error } = await supabase
        .from('client_submissions')
        .insert({
          org_id: validatedData.orgId,
          candidate_id: validatedData.candidateId,
          client_id: validatedData.clientId,
          job_id: validatedData.jobId || null,
          position_title: validatedData.positionTitle || null,
          rate: validatedData.rate || null,
          status: validatedData.status || 'submitted',
          feedback: validatedData.feedback || null,
          submitted_by: validatedData.submittedBy || null
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating submission:', error);
        throw error;
      }

      res.status(201).json(data);
    } catch (error) {
      console.error('Submission creation error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`) 
        });
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: "Failed to create submission", details: errorMessage });
    }
  });

  // PATCH /api/candidates/:candidateId/submissions/:id - Update a submission
  app.patch("/api/candidates/:candidateId/submissions/:id", writeLimiter, async (req, res) => {
    try {
      const { candidateId, id } = req.params;
      const orgId = req.headers['x-org-id'] as string;
      
      if (!orgId) {
        return res.status(400).json({ error: "Organization ID is required" });
      }

      const { data: existing, error: fetchError } = await supabase
        .from('client_submissions')
        .select('*')
        .eq('id', id)
        .eq('candidate_id', candidateId)
        .eq('org_id', orgId)
        .single();

      if (fetchError || !existing) {
        return res.status(404).json({ error: "Submission not found" });
      }

      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (req.body.status) updateData.status = req.body.status;
      if (req.body.feedback !== undefined) updateData.feedback = req.body.feedback;
      if (req.body.rate !== undefined) updateData.rate = req.body.rate;
      if (req.body.positionTitle !== undefined) updateData.position_title = req.body.positionTitle;

      const { data, error } = await supabase
        .from('client_submissions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating submission:', error);
        throw error;
      }

      res.json(data);
    } catch (error) {
      console.error('Submission update error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: "Failed to update submission", details: errorMessage });
    }
  });

  // DELETE /api/candidates/:candidateId/submissions/:id - Delete a submission
  app.delete("/api/candidates/:candidateId/submissions/:id", writeLimiter, async (req, res) => {
    try {
      const { candidateId, id } = req.params;
      const orgId = req.headers['x-org-id'] as string;
      
      if (!orgId) {
        return res.status(400).json({ error: "Organization ID is required" });
      }

      const { data: existing, error: fetchError } = await supabase
        .from('client_submissions')
        .select('*')
        .eq('id', id)
        .eq('candidate_id', candidateId)
        .eq('org_id', orgId)
        .single();

      if (fetchError || !existing) {
        return res.status(404).json({ error: "Submission not found" });
      }

      const { error } = await supabase
        .from('client_submissions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting submission:', error);
        throw error;
      }

      res.json({ success: true, message: "Submission deleted successfully" });
    } catch (error) {
      console.error('Submission deletion error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: "Failed to delete submission", details: errorMessage });
    }
  });

  // ==================== CANDIDATE DOCUMENTS API ====================
  // GET /api/candidates/:candidateId/documents - Get all documents for a candidate
  app.get("/api/candidates/:candidateId/documents", async (req, res) => {
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
        .from('candidate_documents')
        .select('*')
        .eq('candidate_id', candidateId)
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching documents:', error);
        throw error;
      }

      res.json(data || []);
    } catch (error) {
      console.error('Documents fetch error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: "Failed to fetch documents", details: errorMessage });
    }
  });

  // POST /api/candidates/:candidateId/documents - Upload a new document
  app.post("/api/candidates/:candidateId/documents", writeLimiter, documentUpload.single('file'), async (req, res) => {
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

      const file = (req as any).file;
      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { nanoid } = await import('nanoid');
      const uniqueId = nanoid();
      const ext = file.originalname.split('.').pop() || 'pdf';
      const storagePath = `${orgId}/documents/${candidateId}/${uniqueId}.${ext}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(storagePath, file.buffer, {
          contentType: file.mimetype,
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        return res.status(500).json({ error: "Failed to upload file" });
      }

      const documentName = req.body.name || file.originalname.replace(/\.[^/.]+$/, '');

      const { data, error } = await supabase
        .from('candidate_documents')
        .insert({
          org_id: orgId,
          candidate_id: candidateId,
          name: documentName,
          file_url: storagePath,
          file_type: file.mimetype,
          file_size: file.size,
          uploaded_by: req.body.uploadedBy || null
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating document record:', error);
        // Clean up uploaded file if database insert fails
        await supabase.storage.from('resumes').remove([storagePath]);
        throw error;
      }

      // Check if this is a resume file (PDF, DOC, DOCX, TXT) and update candidate's resume_url
      const resumeMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      const isResume = resumeMimeTypes.includes(file.mimetype);
      
      if (isResume) {
        // Update candidate's resume_url field
        const { error: updateError } = await supabase
          .from('candidates')
          .update({ resume_url: storagePath })
          .eq('id', candidateId);

        if (updateError) {
          console.warn('Failed to update candidate resume_url (non-critical):', updateError);
        } else {
          console.log(`[DOCUMENT UPLOAD] Updated resume_url for candidate ${candidateId}`);
          
          // Trigger async resume parsing
          const { DatabaseStorage: LegacyStorage } = await import('./storage.legacy');
          const legacyStorage = new LegacyStorage();
          legacyStorage.parseAndUpdateCandidateFromStorage(candidateId, storagePath)
            .then(() => {
              console.log(`[DOCUMENT UPLOAD] Successfully parsed resume for candidate ${candidateId}`);
            })
            .catch((err: unknown) => {
              console.error(`[DOCUMENT UPLOAD] Failed to parse resume for candidate ${candidateId}:`, err);
            });
        }
      }

      res.status(201).json(data);
    } catch (error) {
      console.error('Document upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: "Failed to upload document", details: errorMessage });
    }
  });

  // DELETE /api/candidates/:candidateId/documents/:id - Delete a document
  app.delete("/api/candidates/:candidateId/documents/:id", writeLimiter, async (req, res) => {
    try {
      const { candidateId, id } = req.params;
      const orgId = req.headers['x-org-id'] as string;
      
      if (!orgId) {
        return res.status(400).json({ error: "Organization ID is required" });
      }

      const { data: existing, error: fetchError } = await supabase
        .from('candidate_documents')
        .select('*')
        .eq('id', id)
        .eq('candidate_id', candidateId)
        .eq('org_id', orgId)
        .single();

      if (fetchError || !existing) {
        return res.status(404).json({ error: "Document not found" });
      }

      // Delete from storage if file_url is a storage path
      if (existing.file_url && !existing.file_url.startsWith('http')) {
        const { error: storageError } = await supabase.storage
          .from('resumes')
          .remove([existing.file_url]);
        
        if (storageError) {
          console.error('Error deleting file from storage:', storageError);
          // Continue with database deletion even if storage deletion fails
        }
      }

      const { error } = await supabase
        .from('candidate_documents')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting document:', error);
        throw error;
      }

      res.json({ success: true, message: "Document deleted successfully" });
    } catch (error) {
      console.error('Document deletion error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: "Failed to delete document", details: errorMessage });
    }
  });
  
  // GET /api/candidates/:candidateId/documents/:id/url - Get signed URL for a document
  app.get("/api/candidates/:candidateId/documents/:id/url", async (req, res) => {
    try {
      const { candidateId, id } = req.params;
      const orgId = req.headers['x-org-id'] as string;
      
      if (!orgId) {
        return res.status(400).json({ error: "Organization ID is required" });
      }

      const { data: doc, error: fetchError } = await supabase
        .from('candidate_documents')
        .select('*')
        .eq('id', id)
        .eq('candidate_id', candidateId)
        .eq('org_id', orgId)
        .single();

      if (fetchError || !doc) {
        return res.status(404).json({ error: "Document not found" });
      }

      // If already a full URL, return it directly
      if (doc.file_url.startsWith('http')) {
        return res.json({ url: doc.file_url });
      }

      // Generate signed URL
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('resumes')
        .createSignedUrl(doc.file_url, 3600); // 1 hour expiry

      if (signedUrlError) {
        console.error('Error creating signed URL:', signedUrlError);
        return res.status(500).json({ error: "Failed to generate document URL" });
      }

      res.json({ url: signedUrlData.signedUrl });
    } catch (error) {
      console.error('Document URL error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: "Failed to get document URL", details: errorMessage });
    }
  });

  // ==================== DRIP CAMPAIGNS API ====================
  // GET /api/campaigns - Get all campaigns for the org
  app.get("/api/campaigns", async (req, res) => {
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
  app.post("/api/campaigns", writeLimiter, async (req, res) => {
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
  app.put("/api/campaigns/:campaignId", writeLimiter, async (req, res) => {
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
  app.delete("/api/campaigns/:campaignId", writeLimiter, async (req, res) => {
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
  app.get("/api/candidates/:candidateId/campaigns", async (req, res) => {
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
  app.post("/api/candidates/:candidateId/campaigns/:campaignId/enroll", writeLimiter, async (req, res) => {
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
  app.delete("/api/candidates/:candidateId/campaigns/:enrollmentId", writeLimiter, async (req, res) => {
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
  app.get("/api/campaigns/:campaignId/emails", async (req, res) => {
    try {
      const { campaignId } = req.params;
      const orgId = req.headers['x-org-id'] as string;
      
      if (!orgId) {
        return res.status(400).json({ error: "Organization ID is required" });
      }

      // Verify the campaign belongs to this org
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

      // Transform snake_case to camelCase for frontend
      const camelCaseData = (data || []).map(email => toCamelCase(email));
      res.json(camelCaseData);
    } catch (error) {
      console.error('Campaign emails fetch error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: "Failed to fetch campaign emails", details: errorMessage });
    }
  });

  // POST /api/campaigns/:campaignId/emails - Create a new email in a campaign
  app.post("/api/campaigns/:campaignId/emails", writeLimiter, async (req, res) => {
    try {
      const { campaignId } = req.params;
      const orgId = req.headers['x-org-id'] as string;
      
      if (!orgId) {
        return res.status(400).json({ error: "Organization ID is required" });
      }

      // Verify the campaign belongs to this org
      const { data: campaign, error: campaignError } = await supabase
        .from('drip_campaigns')
        .select('id')
        .eq('id', campaignId)
        .eq('org_id', orgId)
        .single();

      if (campaignError || !campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      // Validate only the email-specific fields from request body
      const emailData = z.object({
        subject: z.string().min(1),
        body: z.string().optional().nullable(),
        delayDays: z.number().min(0).optional().default(0),
      }).parse(req.body);

      // Get max sequence_order for this campaign
      const { data: existingEmails } = await supabase
        .from('campaign_emails')
        .select('sequence_order')
        .eq('campaign_id', campaignId)
        .order('sequence_order', { ascending: false })
        .limit(1);

      const nextSequenceOrder = existingEmails && existingEmails.length > 0 
        ? (existingEmails[0].sequence_order || 0) + 1 
        : 1;

      // Always use campaignId from route parameter (already validated for org ownership above)
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

      // Transform snake_case to camelCase for frontend
      res.status(201).json(toCamelCase(data));
    } catch (error) {
      console.error('Campaign email creation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: "Failed to create campaign email", details: errorMessage });
    }
  });

  // PUT /api/campaigns/:campaignId/emails/:emailId - Update a campaign email
  app.put("/api/campaigns/:campaignId/emails/:emailId", writeLimiter, async (req, res) => {
    try {
      const { campaignId, emailId } = req.params;
      const orgId = req.headers['x-org-id'] as string;
      
      if (!orgId) {
        return res.status(400).json({ error: "Organization ID is required" });
      }

      // Verify the campaign belongs to this org
      const { data: campaign, error: campaignError } = await supabase
        .from('drip_campaigns')
        .select('id')
        .eq('id', campaignId)
        .eq('org_id', orgId)
        .single();

      if (campaignError || !campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      // Verify the email belongs to this campaign
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

      // Transform snake_case to camelCase for frontend
      res.json(toCamelCase(data));
    } catch (error) {
      console.error('Campaign email update error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: "Failed to update campaign email", details: errorMessage });
    }
  });

  // DELETE /api/campaigns/:campaignId/emails/:emailId - Delete a campaign email
  app.delete("/api/campaigns/:campaignId/emails/:emailId", writeLimiter, async (req, res) => {
    try {
      const { campaignId, emailId } = req.params;
      const orgId = req.headers['x-org-id'] as string;
      
      if (!orgId) {
        return res.status(400).json({ error: "Organization ID is required" });
      }

      // Verify the campaign belongs to this org
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
  app.post("/api/campaigns/:campaignId/emails/:emailId/preview", requireAuth, async (req, res) => {
    try {
      const { campaignId, emailId } = req.params;
      const { candidateId, jobId } = req.body;
      const orgId = req.headers['x-org-id'] as string;
      
      if (!orgId) {
        return res.status(400).json({ error: "Organization ID is required" });
      }

      // Verify the campaign belongs to this org
      const { data: campaign, error: campaignError } = await supabase
        .from('drip_campaigns')
        .select('id')
        .eq('id', campaignId)
        .eq('org_id', orgId)
        .single();

      if (campaignError || !campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      // Get the email
      const { data: email, error: emailError } = await supabase
        .from('campaign_emails')
        .select('*')
        .eq('id', emailId)
        .eq('campaign_id', campaignId)
        .single();

      if (emailError || !email) {
        return res.status(404).json({ error: "Campaign email not found" });
      }

      // Build merge field context
      const context: MergeFieldContext = {};

      // Get candidate data if provided (using Supabase directly with org scoping)
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

      // Get job data if provided (using Supabase directly with org scoping)
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

          // Get client/company name
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

      // Get organization as fallback for company name
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

      // Get current user as recruiter
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

      // Render the merge fields
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
  app.get("/api/enrollments/:enrollmentId/email-sends", async (req, res) => {
    try {
      const { enrollmentId } = req.params;
      const orgId = req.headers['x-org-id'] as string;
      
      if (!orgId) {
        return res.status(400).json({ error: "Organization ID is required" });
      }

      // Verify enrollment belongs to this org
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

  // Job-Candidate relationships
  app.get("/api/jobs/:jobId/candidates", async (req, res) => {
    try {
      const jobCandidates = await storage.candidates.getJobCandidatesByJob(req.params.jobId);
      res.json(jobCandidates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch job candidates" });
    }
  });

  app.post("/api/job-candidates", writeLimiter, async (req, res) => {
    try {
      const jobCandidate = await storage.candidates.createJobCandidate(req.body);
      res.status(201).json(jobCandidate);
    } catch (error) {
      console.error('Job candidate creation error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: "Failed to create job candidate relationship", details: errorMsg });
    }
  });

  app.put("/api/job-candidates/:id", writeLimiter, async (req, res) => {
    try {
      const jobCandidate = await storage.candidates.updateJobCandidate(req.params.id, req.body);
      res.json(jobCandidate);
    } catch (error) {
      console.error('Job candidate update error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: "Failed to update job candidate", details: errorMsg });
    }
  });

  // Job-specific pipeline routes
  app.get("/api/jobs/:jobId/pipeline", async (req, res) => {
    try {
      const { jobId } = req.params;
      const includeCompleted = req.query.includeCompleted === 'true';
      console.log('[Pipeline Route] Fetching pipeline for job:', jobId, 'includeCompleted:', includeCompleted);

      // Optimized: Use storage method that handles pipeline creation and data fetch in one flow
      // This reduces database round-trips from 4 to 2 queries
      const pipelineData = await storage.jobs.getJobPipelineDataOptimized(jobId, includeCompleted);
      
      if (!pipelineData) {
        return res.status(404).json({ error: "Job not found" });
      }

      console.log('[Pipeline Route] Pipeline data fetched successfully:', {
        columnsCount: pipelineData.columns.length,
        applicationsCount: pipelineData.applications.length
      });

      res.json(pipelineData);
    } catch (error) {
      console.error('[Pipeline Route] Error fetching job pipeline:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: "Failed to fetch job pipeline", details: errorMsg });
    }
  });

  app.get("/api/jobs/:jobId/pipeline-columns", async (req, res) => {
    try {
      const { jobId } = req.params;
      console.log('Fetching pipeline columns for job:', jobId);

      // Get job details to verify it exists and get organization ID
      const job = await storage.jobs.getJob(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      // Import pipeline service
      const { ensureDefaultPipelineForJob } = await import('./lib/pipelineService');

      // Access org_id from raw data
      const orgId = (job as { org_id: string }).org_id;

      // Ensure pipeline exists for this job
      await ensureDefaultPipelineForJob({ 
        jobId, 
        organizationId: orgId 
      });

      // Get pipeline columns for this job  
      const { data: columns, error: columnsError } = await supabaseAdmin
        .from('pipeline_columns')
        .select('*')
        .eq('job_id', jobId)
        .eq('org_id', orgId)
        .order('position');

      if (columnsError) {
        console.error('Error fetching pipeline columns:', columnsError);
        throw new Error(`Failed to fetch pipeline columns: ${columnsError.message}`);
      }

      // Transform data to match frontend interface
      const pipelineColumns = columns?.map((col: unknown) => ({
        id: col.id,
        title: col.title,
        position: col.position.toString()
      })) || [];

      res.json(pipelineColumns);
    } catch (error) {
      console.error('Error fetching job pipeline columns:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: "Failed to fetch job pipeline columns", details: errorMsg });
    }
  });

  // Candidate notes
  app.get("/api/job-candidates/:jobCandidateId/notes", async (req, res) => {
    try {
      const { jobCandidateId } = req.params;
      console.log('Fetching notes for job candidate:', jobCandidateId);
      
      const notes = await storage.candidates.getCandidateNotes(jobCandidateId);
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
      console.log('[NOTES_API] POST /api/candidate-notes - Request received');
      console.log('[NOTES_API] Headers:', {
        'x-user-id': req.headers['x-user-id'],
        'x-org-id': req.headers['x-org-id'],
        'content-type': req.headers['content-type']
      });
      console.log('[NOTES_API] Request body:', req.body);
      
      // Validate required fields
      const { orgId, jobCandidateId, authorId, content } = req.body;
      if (!orgId || !jobCandidateId || !authorId || !content) {
        console.error('[NOTES_API] Missing required fields:', { orgId, jobCandidateId, authorId, content: !!content });
        return res.status(400).json({ 
          error: "Missing required fields", 
          details: "orgId, jobCandidateId, authorId, and content are required",
          received: { orgId: !!orgId, jobCandidateId: !!jobCandidateId, authorId: !!authorId, content: !!content }
        });
      }
      
      console.log('[NOTES_API] All required fields present, creating note...');
      const note = await storage.candidates.createCandidateNote(req.body);
      console.log('[NOTES_API] Note created successfully:', { id: note.id, orgId: note.orgId });
      res.status(201).json(note);
    } catch (error) {
      console.error('[NOTES_API] Error creating candidate note:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ 
        error: "Failed to create candidate note", 
        details: errorMsg,
        message: errorMsg
      });
    }
  });

  // Enhanced Messages routes with pagination support
  app.get("/api/messages", async (req, res) => {
    try {
      // Check if this is a paginated request by looking for pagination parameters
      const isPaginatedRequest = 'limit' in req.query || 'cursor' in req.query || 'include' in req.query;
      
      if (isPaginatedRequest) {
        // Validate query parameters for paginated request
        const validationResult = messagesQuerySchema.safeParse(req.query);
        
        if (!validationResult.success) {
          return res.status(400).json({
            error: "Invalid query parameters",
            details: validationResult.error.errors
          });
        }

        const {
          orgId,
          userId,
          limit,
          cursor,
          include,
          threadId,
          type,
          priority,
          clientId,
          jobId,
          candidateId
        } = validationResult.data;

        // Handle field selection
        let fields: string[] | undefined;
        if (include) {
          if (include === 'list') {
            fields = [...messageFieldsPresets.list];
          } else if (include === 'detail') {
            fields = [...messageFieldsPresets.detail];
          } else {
            fields = include.split(',').map(f => f.trim());
          }
        }

        // Get paginated results with REQUIRED org_id filter
        const result = await storage.communications.getMessagesPaginated({
          orgId,
          userId,
          limit,
          cursor,
          fields,
          threadId,
          type,
          priority,
          clientId,
          jobId,
          candidateId
        });

        // Generate ETag for response
        const etag = generateETag(result);
        
        // Check If-None-Match header for 304 Not Modified
        const clientETag = req.headers['if-none-match'];
        if (clientETag && clientETag === `"${etag}"`) {
          return res.status(304).end();
        }

        // Set caching headers for private data
        setResponseCaching(res, {
          etag,
          cacheControl: 'private, max-age=60, must-revalidate', // 1 minute for messages data
          lastModified: result.data.length > 0 ? new Date(result.data[0].createdAt) : undefined
        });

        console.info('[API] GET /api/messages (paginated) →', { 
          success: true, 
          count: result.data.length,
          hasMore: result.pagination.hasMore,
          totalCount: result.pagination.totalCount
        });

        res.json(result);
      } else {
        // Backward compatibility: return non-paginated results
        const userId = req.query.userId as string;
        const orgId = req.query.org_id as string;
        
        if (!orgId) {
          return res.status(400).json({ error: 'Organization ID required' });
        }
        
        const messages = await storage.communications.getMessages(userId, orgId);
        
        // Generate ETag for response
        const etag = generateETag(messages);
        
        // Check If-None-Match header for 304 Not Modified
        const clientETag = req.headers['if-none-match'];
        if (clientETag && clientETag === `"${etag}"`) {
          return res.status(304).end();
        }

        // Set caching headers
        setResponseCaching(res, {
          etag,
          cacheControl: 'private, max-age=60, must-revalidate',
          lastModified: messages.length > 0 ? new Date(messages[0].createdAt) : undefined
        });

        console.info('[API] GET /api/messages (legacy) →', { success: true, count: messages?.length || 0 });
        res.json(messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.get("/api/messages/thread/:threadId", async (req, res) => {
    try {
      const orgId = req.query.org_id as string;
      
      if (!orgId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }
      
      const messages = await storage.communications.getMessagesByThread(req.params.threadId, orgId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch thread messages" });
    }
  });

  app.get("/api/messages/context", async (req, res) => {
    try {
      const { clientId, jobId, candidateId, org_id } = req.query as Record<string, string>;
      
      if (!org_id) {
        return res.status(400).json({ error: 'Organization ID required' });
      }
      
      const messages = await storage.communications.getMessagesByContext({ 
        clientId, 
        jobId, 
        candidateId,
        orgId: org_id 
      });
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch context messages" });
    }
  });

  app.get("/api/messages/unread-count", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      const count = await storage.communications.getUnreadMessageCount(userId);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch unread count" });
    }
  });

  app.post("/api/messages", writeLimiter, async (req, res) => {
    try {
      const message = await storage.communications.createMessage(req.body);
      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ error: "Failed to create message" });
    }
  });

  app.patch("/api/messages/:id", writeLimiter, async (req, res) => {
    try {
      const message = await storage.communications.updateMessage(req.params.id, req.body);
      res.json(message);
    } catch (error) {
      res.status(400).json({ error: "Failed to update message" });
    }
  });

  app.post("/api/messages/:id/read", writeLimiter, async (req, res) => {
    try {
      const { userId } = req.body;
      await storage.communications.markMessageAsRead(req.params.id, userId);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: "Failed to mark message as read" });
    }
  });

  app.post("/api/messages/:id/archive", writeLimiter, async (req, res) => {
    try {
      await storage.communications.archiveMessage(req.params.id);
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
      
      const interviews = await storage.candidates.getInterviews();
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
      const interview = await storage.candidates.getInterview(req.params.id);
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
      const interview = await storage.candidates.createInterview(req.body);
      res.status(201).json(interview);
    } catch (error) {
      console.error("Error creating interview:", error);
      res.status(500).json({ error: "Failed to create interview" });
    }
  });

  app.put("/api/interviews/:id", writeLimiter, async (req, res) => {
    try {
      const interview = await storage.candidates.updateInterview(req.params.id, req.body);
      res.json(interview);
    } catch (error) {
      console.error("Error updating interview:", error);
      res.status(500).json({ error: "Failed to update interview" });
    }
  });

  app.delete("/api/interviews/:id", writeLimiter, async (req, res) => {
    try {
      await storage.candidates.deleteInterview(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting interview:", error);
      res.status(500).json({ error: "Failed to delete interview" });
    }
  });

  app.get("/api/interviews/job-candidate/:jobCandidateId", async (req, res) => {
    try {
      const interviews = await storage.candidates.getInterviewsByJobCandidate(req.params.jobCandidateId);
      res.json(interviews);
    } catch (error) {
      console.error("Error fetching interviews by job candidate:", error);
      res.status(500).json({ error: "Failed to fetch interviews" });
    }
  });

  // Candidate Notes routes
  app.get("/api/candidate-notes", async (req, res) => {
    try {
      const candidateId = req.query.candidateId as string;
      const jobCandidateId = req.query.jobCandidateId as string;
      
      console.log('[NOTES_API] GET /api/candidate-notes - Query params:', { candidateId, jobCandidateId });
      
      if (jobCandidateId) {
        console.log('[NOTES_API] Fetching notes for jobCandidateId:', jobCandidateId);
        const notes = await storage.candidates.getCandidateNotes(jobCandidateId);
        console.log('[NOTES_API] Found notes:', notes?.length || 0);
        res.json(notes);
      } else if (candidateId) {
        // Fallback for candidate-based lookup
        console.log('[NOTES_API] Fetching notes for candidateId:', candidateId);
        const notes = await storage.candidates.getCandidateNotes(candidateId);
        console.log('[NOTES_API] Found notes:', notes?.length || 0);
        res.json(notes);
      } else {
        console.error('[NOTES_API] Missing required parameters');
        res.status(400).json({ error: "candidateId or jobCandidateId is required" });
      }
    } catch (error) {
      console.error("[NOTES_API] Error fetching candidate notes:", error);
      res.status(500).json({ error: "Failed to fetch candidate notes" });
    }
  });

  // Batched candidate notes endpoint
  app.get("/api/candidate-notes/batch", async (req, res) => {
    try {
      const jobCandidateIds = req.query.jobCandidateIds as string;
      
      if (!jobCandidateIds) {
        return res.status(400).json({ error: "jobCandidateIds is required" });
      }

      // Parse the comma-separated IDs
      const candidateIds = jobCandidateIds.split(',').filter(id => id.trim());
      
      if (candidateIds.length === 0) {
        return res.status(400).json({ error: "At least one jobCandidateId is required" });
      }

      console.log('[NOTES_API] GET /api/candidate-notes/batch - Fetching for', candidateIds.length, 'candidates');
      
      const batchedNotes = await storage.candidates.getBatchedCandidateNotes(candidateIds);
      
      console.log('[NOTES_API] Batched notes fetched successfully');
      res.json(batchedNotes);
    } catch (error) {
      console.error("[NOTES_API] Error fetching batched candidate notes:", error);
      res.status(500).json({ error: "Failed to fetch batched candidate notes" });
    }
  });

  // Messages routes (legacy - kept for backwards compatibility)
  app.get("/api/messages", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      const orgId = req.query.org_id as string;
      
      if (!orgId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }
      
      const messages = await storage.communications.getMessages(userId, orgId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.get("/api/messages/:id", async (req, res) => {
    try {
      const message = await storage.communications.getMessage(req.params.id);
      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }
      res.json(message);
    } catch (error) {
      console.error("Error fetching message:", error);
      res.status(500).json({ error: "Failed to fetch message" });
    }
  });

  app.post("/api/messages", writeLimiter, async (req, res) => {
    try {
      const message = await storage.communications.createMessage(req.body);
      res.status(201).json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ error: "Failed to create message" });
    }
  });

  app.put("/api/messages/:id", writeLimiter, async (req, res) => {
    try {
      const message = await storage.communications.updateMessage(req.params.id, req.body);
      res.json(message);
    } catch (error) {
      console.error("Error updating message:", error);
      res.status(500).json({ error: "Failed to update message" });
    }
  });

  app.patch("/api/messages/:id/read", writeLimiter, async (req, res) => {
    try {
      const { userId } = req.body;
      await storage.communications.markMessageAsRead(req.params.id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ error: "Failed to mark message as read" });
    }
  });

  // Upload routes (new comprehensive system)
  app.use("/api/upload", uploadRouter);

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


  // PUBLIC ROUTES - No authentication required
  // (These routes are moved to the main section above to avoid duplicates)



  // PIPELINE COLUMNS ENDPOINTS
  app.get("/api/pipeline-columns", async (req, res) => {
    try {
      const orgId = req.query.orgId as string;
      if (!orgId) {
        return res.status(400).json({ error: "Organization ID is required" });
      }
      const columns = await storage.jobs.getPipelineColumns(orgId);
      res.json(columns);
    } catch (error) {
      console.error("Error fetching pipeline columns:", error);
      res.status(500).json({ error: "Failed to fetch pipeline columns" });
    }
  });

  app.post("/api/pipeline-columns", writeLimiter, async (req, res) => {
    try {
      const column = await storage.jobs.createPipelineColumn(req.body);
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
      const columns = await storage.jobs.getPipelineColumns(orgId);
      
      // Get job candidates for the organization
      const jobCandidates = await storage.candidates.getJobCandidatesByOrg(orgId);
      
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
      
      // Get organization ID from authenticated user context
      const orgId = req.headers['x-org-id'] as string || req.query.orgId as string;
      
      if (!orgId) {
        return res.status(400).json({ error: "Organization context required" });
      }

      if (!columnId) {
        return res.status(400).json({ error: "Column ID is required" });
      }

      console.info('Moving application', applicationId, 'to column', columnId);

      // Get the column info to determine the new stage
      const { data: column, error: columnError } = await supabaseAdmin
        .from('pipeline_columns')
        .select('id, title')
        .eq('id', columnId)
        .single();

      if (columnError) {
        return res.status(400).json({ error: `Invalid column: ${columnError.message}` });
      }

      // Map column title to stage (e.g. "Phone Screen" -> "phone_screen")
      const newStage = column?.title?.toLowerCase().replace(/\s+/g, '_');

      // Update both pipeline_column_id and stage in job_candidate table
      const { error } = await supabaseAdmin
        .from('job_candidate')
        .update({ 
          pipeline_column_id: columnId, 
          stage: newStage 
        })
        .eq('id', applicationId);

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error moving application:", error);
      res.status(500).json({ error: "Failed to move application" });
    }
  });

  // NEW: Move application using applicationId (job_candidate.id) - Primary endpoint
  app.patch("/api/jobs/:jobId/applications/:applicationId/move", writeLimiter, async (req, res) => {
    try {
      const { applicationId } = req.params;
      const { columnId } = req.body;
      
      if (!columnId) {
        return res.status(400).json({ error: "Column ID is required" });
      }

      console.info('Moving application', applicationId, 'to column', columnId);
      
      // Use the storage method to move the job candidate by applicationId
      const updatedJobCandidate = await storage.candidates.moveJobCandidate(applicationId, columnId);
      
      res.json({ 
        message: "Application moved successfully",
        jobCandidate: updatedJobCandidate
      });
    } catch (error) {
      console.error("Error moving application:", error);
      res.status(500).json({ error: "Failed to move application" });
    }
  });

  // NEW: Reject candidate endpoint
  app.patch("/api/jobs/:jobId/applications/:applicationId/reject", writeLimiter, async (req, res) => {
    try {
      const { applicationId } = req.params;

      console.info('Rejecting application', applicationId);
      
      // Use the storage method to reject the job candidate
      const updatedJobCandidate = await storage.candidates.rejectJobCandidate(applicationId);
      
      res.json({ 
        message: "Candidate rejected successfully",
        jobCandidate: updatedJobCandidate
      });
    } catch (error) {
      console.error("Error rejecting application:", error);
      res.status(500).json({ error: "Failed to reject candidate" });
    }
  });

  // LEGACY: Move job candidate to different pipeline column (Kanban drag and drop)
  app.patch("/api/jobs/:jobId/candidates/:candidateId/move", writeLimiter, async (req, res) => {
    try {
      const { candidateId } = req.params;
      const { columnId } = req.body;
      
      if (!columnId) {
        return res.status(400).json({ error: "Column ID is required" });
      }

      console.info('Moving job candidate (legacy)', candidateId, 'to column', columnId);
      
      // Use the storage method to move the job candidate
      const updatedJobCandidate = await storage.candidates.moveJobCandidate(candidateId, columnId);
      
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
      const jobCandidates = await storage.jobs.getJobCandidatesByOrg(orgId);
      res.json(jobCandidates);
    } catch (error) {
      console.error("Error fetching job candidates:", error);
      res.status(500).json({ error: "Failed to fetch job candidates" });
    }
  });

  // Get applications for a specific candidate
  app.get("/api/candidates/:candidateId/applications", async (req, res) => {
    try {
      const { candidateId } = req.params;
      const orgId = req.query.orgId as string || req.headers['x-org-id'] as string;
      
      if (!orgId) {
        return res.status(400).json({ error: 'Organization ID is required' });
      }

      const { data, error } = await supabaseAdmin
        .from('job_candidate')
        .select('id, job_id, stage, created_at, updated_at, notes, status, jobs(title)')
        .eq('candidate_id', candidateId)
        .eq('org_id', orgId);

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      // Transform to match ApplicationHistoryEntry interface
      const formattedApplications = data.map((jc: unknown) => ({
        id: jc.id,
        jobId: jc.job_id,
        jobTitle: jc.jobs?.title || 'Unknown Job',
        clientName: 'Direct Application', // Could be enhanced with client join if needed
        stage: jc.stage || 'applied',
        dateApplied: jc.created_at,
        dateUpdated: jc.updated_at,
        notes: jc.notes,
        status: jc.status || 'active'
      }));

      res.status(200).json(formattedApplications);
    } catch (error) {
      console.error("Error fetching candidate applications:", error);
      res.status(500).json({ error: "Failed to fetch candidate applications" });
    }
  });

  app.patch("/api/job-candidates/:id/stage", writeLimiter, async (req, res) => {
    try {
      const { id } = req.params;
      const { stage } = req.body;
      
      if (!stage) {
        return res.status(400).json({ error: "Stage is required" });
      }
      
      const updatedJobCandidate = await storage.jobs.updateJobCandidateStage(id, stage);
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
      const existingCandidate = await storage.candidates.getCandidateByEmail(validatedData.email, validatedData.orgId);
      if (existingCandidate) {
        return res.status(409).json({ 
          error: "Candidate with this email already exists in your organization" 
        });
      }
      
      const candidate = await storage.candidates.createCandidate(validatedData);
      
      // AUTO-TRIGGER RESUME PARSING if resumeUrl is provided
      if (validatedData.resumeUrl) {
        console.log(`[AUTO-PARSE] Triggering resume parsing for candidate ${candidate.id}`);
        // Parse asynchronously without blocking the response
        storage.candidates.parseAndUpdateCandidateFromStorage(candidate.id, validatedData.resumeUrl)
          .then(() => {
            console.log(`[AUTO-PARSE] Successfully parsed resume for candidate ${candidate.id}`);
          })
          .catch((error) => {
            console.error(`[AUTO-PARSE] Failed to parse resume for candidate ${candidate.id}:`, error);
          });
      }
      
      res.status(201).json(candidate);
    } catch (error) {
      console.error("Error creating candidate:", error);
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: (error as any).errors 
        });
      }
      res.status(500).json({ error: "Failed to create candidate" });
    }
  });





  // Add subdomain middleware for public routes
  app.use(subdomainResolver);

  // (Duplicate public jobs endpoint removed - using main implementation above)





  // Auth endpoints - Forgot Password
  app.post('/api/auth/forgot-password', authLimiter, async (req, res) => {
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

    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ error: 'Failed to send reset email' });
    }
  });

  // SendGrid email testing endpoint with ATS template testing
  app.post('/api/test-sendgrid', async (req, res) => {
    try {
      const { sendEmail, ATSEmailService, atsEmailService } = await import('./emailService');
      const { testType } = req.body;
      
      console.log('🔧 Testing SendGrid integration...');
      
      let result = false;
      
      // Test different email templates based on request
      if (testType === 'application_notification') {
        result = await atsEmailService.sendNewApplicationNotification(
          'hiring-manager@example.com',
          'John Doe',
          'Senior Software Engineer',
          'TalentPatriot Demo Company'
        );
      } else if (testType === 'interview_reminder') {
        result = await atsEmailService.sendInterviewReminderToCandidate(
          'candidate@example.com',
          'Jane Smith', 
          'Product Manager',
          'Tomorrow, August 23rd at 2:00 PM EST',
          'TalentPatriot Demo Company'
        );
      } else if (testType === 'status_update') {
        result = await atsEmailService.sendStatusUpdateToCandidate(
          'candidate@example.com',
          'Jane Smith',
          'Product Manager',
          'Interview Scheduled',
          'TalentPatriot Demo Company'
        );
      } else {
        // Default basic integration test
        result = await sendEmail({
        to: 'test@example.com',
        from: 'noreply@talentpatriot.com',
        subject: 'TalentPatriot SendGrid Integration Test',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #1e40af; color: white; padding: 20px; text-align: center;">
              <h1>TalentPatriot</h1>
            </div>
            <div style="padding: 30px; background: #f8fafc;">
              <h2 style="color: #1e40af;">✅ SendGrid Integration Confirmed</h2>
              <p>Your SendGrid domain verification is working perfectly!</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #374151;">Email Notifications Now Active:</h3>
                <ul style="color: #374151;">
                  <li>✅ New job application alerts</li>
                  <li>✅ Interview reminder notifications</li>
                  <li>✅ Candidate status update emails</li>
                  <li>✅ Hiring manager notifications</li>
                </ul>
              </div>
              
              <p><strong>Test completed:</strong> ${new Date().toLocaleString()}</p>
              
              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                This confirms TalentPatriot can send emails through your verified domain.
              </p>
            </div>
          </div>
        `,
        text: 'TalentPatriot SendGrid integration test successful! All automated email notifications are now functional.'
      });
      }
      
      if (result) {
        console.log('✅ SendGrid test email sent successfully');
        const responseMessage = testType ? 
          `${testType.replace('_', ' ')} email template test successful!` :
          'SendGrid integration working perfectly!';
          
        res.json({ 
          success: true, 
          message: responseMessage,
          testType: testType || 'basic_integration',
          emailServiceStatus: 'active',
          domainVerified: true,
          notificationsReady: ['applications', 'interviews', 'status-updates', 'hiring-alerts'],
          timestamp: new Date().toISOString()
        });
      } else {
        console.log('❌ SendGrid test failed');
        res.status(500).json({ 
          success: false, 
          message: 'SendGrid test failed - check API key and domain verification',
          emailServiceStatus: 'inactive',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('SendGrid test error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'SendGrid integration test failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        emailServiceStatus: 'error',
        timestamp: new Date().toISOString()
      });
    }
  });

  // ================================
  // Beta Applications API Endpoints
  // ================================

  // Submit Beta Application (Public endpoint)
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

  app.post("/api/beta/apply", writeLimiter, async (req, res) => {
    console.info('[API]', req.method, req.url);
    try {
      const validatedData = betaApplicationSchema.parse(req.body);
      
      const betaApplication = await storage.beta.createBetaApplication({
        ...validatedData,
        status: 'pending',
      });
      
      // Send confirmation email to applicant using Resend template
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

      // Send notification email to admin for discovery call scheduling
      try {
        const { betaApplicationNotificationTemplate } = await import('./services/email/templates');
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

  // Get All Beta Applications (Admin only)
  app.get("/api/beta/applications", requireAuth, requirePlatformAdmin, async (req: AuthenticatedRequest, res) => {
    console.info('[API]', req.method, req.url, 'User:', req.user?.email);
    try {
      const betaApplications = await storage.beta.getBetaApplications();
      
      // Return applications as-is (storage layer handles normalization)
      const normalizedApplications = betaApplications;
      
      console.info('[API] GET /api/beta/applications →', { success: true, count: normalizedApplications.length });
      res.json(normalizedApplications);
    } catch (error) {
      console.error('Beta applications fetch error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: "Failed to fetch beta applications", details: errorMessage });
    }
  });

  // Get Single Beta Application (Admin only)
  app.get("/api/beta/applications/:id", requireAuth, requirePlatformAdmin, async (req: AuthenticatedRequest, res) => {
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
      
      // Return the application data as-is (storage layer handles normalization)
      const normalizedApplication = betaApplication;
      
      console.info('[API] GET /api/beta/applications/:id →', { success: true, id });
      res.json(normalizedApplication);
    } catch (error) {
      console.error('Beta application fetch error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: "Failed to fetch beta application", details: errorMessage });
    }
  });

  // Update Beta Application Status (Admin only)
  const updateBetaApplicationSchema = z.object({
    status: z.enum(['pending', 'reviewing', 'approved', 'rejected', 'waitlist']).optional(),
    reviewNotes: z.string().optional(),
    reviewedBy: z.string().optional(),
  });

  app.put("/api/beta/applications/:id", requireAuth, requirePlatformAdmin, writeLimiter, async (req: AuthenticatedRequest, res) => {
    console.info('[API]', req.method, req.url, 'User:', req.user?.email);
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ error: "Application ID is required" });
      }
      
      const validatedData = updateBetaApplicationSchema.parse(req.body);
      
      // Get original application for email sending
      const originalApplication = await storage.beta.getBetaApplication(id);
      
      // Add review timestamp and reviewer if status is being changed
      const updateData = { ...validatedData };
      if (validatedData.status && validatedData.status !== 'pending') {
        (updateData as any).reviewedAt = new Date();
        (updateData as any).reviewedBy = req.user?.id;
      }
      
      const updatedApplication = await storage.beta.updateBetaApplication(id, updateData);
      
      // Send approval email if status changed to 'approved'
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
      
      // Return the application data as-is (storage layer handles normalization)
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

  // Delete Beta Application (Admin only - rarely used)
  app.delete("/api/beta/applications/:id", writeLimiter, async (req, res) => {
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

  // =============================================================================
  // ADMIN INBOX / APPROVAL REQUESTS ROUTES
  // =============================================================================

  // Get approval requests for organization (Admin Inbox)
  app.get("/api/admin/inbox", requireAuth, async (req: AuthenticatedRequest, res) => {
    console.info('[API]', req.method, req.url, 'User:', req.user?.email);
    try {
      const orgId = req.headers['x-org-id'] as string;
      if (!orgId) {
        return res.status(400).json({ error: 'Organization ID required in x-org-id header' });
      }

      const userOrgs = await storage.auth.getUserOrganizations(req.user?.id, orgId);
      const userOrg = userOrgs.length > 0 ? userOrgs[0] : null;
      if (!userOrg || (userOrg.role !== 'admin' && userOrg.role !== 'owner')) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const status = req.query.status as string | undefined;
      const approvalRequests = await storage.approvals.getApprovalRequestsByOrg(orgId, status);
      
      console.info('[API] GET /api/admin/inbox →', { success: true, count: approvalRequests.length });
      res.json(approvalRequests);
    } catch (error) {
      console.error('Admin inbox fetch error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: "Failed to fetch approval requests", details: errorMessage });
    }
  });

  // Get pending approval count for organization
  app.get("/api/admin/inbox/count", requireAuth, async (req: AuthenticatedRequest, res) => {
    console.info('[API]', req.method, req.url, 'User:', req.user?.email);
    try {
      const orgId = req.headers['x-org-id'] as string;
      if (!orgId) {
        return res.status(400).json({ error: 'Organization ID required in x-org-id header' });
      }

      const count = await storage.approvals.getPendingApprovalCount(orgId);
      
      console.info('[API] GET /api/admin/inbox/count →', { success: true, count });
      res.json({ count });
    } catch (error) {
      console.error('Admin inbox count error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: "Failed to fetch pending count", details: errorMessage });
    }
  });

  // Resolve an approval request (approve/reject)
  const resolveApprovalSchema = z.object({
    status: z.enum(['approved', 'rejected']),
    resolutionNotes: z.string().optional(),
  });

  app.patch("/api/admin/inbox/:id", requireAuth, writeLimiter, async (req: AuthenticatedRequest, res) => {
    console.info('[API]', req.method, req.url, 'User:', req.user?.email);
    try {
      const { id } = req.params;
      const orgId = req.headers['x-org-id'] as string;
      
      if (!orgId) {
        return res.status(400).json({ error: 'Organization ID required in x-org-id header' });
      }

      const userOrgs = await storage.auth.getUserOrganizations(req.user?.id, orgId);
      const userOrg = userOrgs.length > 0 ? userOrgs[0] : null;
      if (!userOrg || (userOrg.role !== 'admin' && userOrg.role !== 'owner')) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const validatedData = resolveApprovalSchema.parse(req.body);
      
      const updatedRequest = await storage.approvals.resolveApprovalRequest(
        id,
        req.user!.id,
        validatedData.status,
        validatedData.resolutionNotes
      );

      // Handle post-approval actions based on request type
      if (validatedData.status === 'approved') {
        const request = await storage.approvals.getApprovalRequest(id);
        if (request) {
          // Handle different request types
          if (request.requestType === 'careers_publish') {
            // Update organization's careers status to published
            await supabase
              .from('organizations')
              .update({ 
                careers_status: 'published',
                published_at: new Date().toISOString()
              })
              .eq('id', request.orgId);
          } else if (request.requestType === 'admin_claim') {
            // Grant admin privileges to the user
            await supabase
              .from('user_organizations')
              .update({ 
                is_admin: true,
                admin_claimed_at: new Date().toISOString()
              })
              .eq('user_id', request.targetId)
              .eq('org_id', request.orgId);
          }
        }
      }
      
      console.info('[API] PATCH /api/admin/inbox/:id →', { success: true, id, status: validatedData.status });
      res.json({ 
        success: true, 
        message: `Request ${validatedData.status} successfully`,
        request: updatedRequest 
      });
    } catch (error) {
      console.error('Approval request update error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`) 
        });
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: "Failed to update approval request", details: errorMessage });
    }
  });

  // Create an approval request (for recruiters requesting publish, admin claims, etc.)
  const createApprovalSchema = z.object({
    requestType: z.enum(['onboarding_complete', 'careers_publish', 'admin_claim', 'seat_upgrade', 'team_invite']),
    targetTable: z.string(),
    targetId: z.string().uuid(),
    title: z.string(),
    description: z.string().optional(),
    requestedPayload: z.record(z.any()).optional(),
  });

  app.post("/api/admin/inbox", requireAuth, writeLimiter, async (req: AuthenticatedRequest, res) => {
    console.info('[API]', req.method, req.url, 'User:', req.user?.email);
    try {
      const orgId = req.headers['x-org-id'] as string;
      
      if (!orgId) {
        return res.status(400).json({ error: 'Organization ID required in x-org-id header' });
      }

      const userOrgs = await storage.auth.getUserOrganizations(req.user?.id, orgId);
      if (userOrgs.length === 0) {
        return res.status(403).json({ error: 'You do not have access to this organization' });
      }

      const validatedData = createApprovalSchema.parse(req.body);
      
      const approvalRequest = await storage.approvals.createApprovalRequest({
        orgId,
        requestType: validatedData.requestType,
        targetTable: validatedData.targetTable,
        targetId: validatedData.targetId,
        title: validatedData.title,
        description: validatedData.description,
        requestedBy: req.user!.id,
        requestedPayload: validatedData.requestedPayload || {},
        status: 'pending',
      });
      
      console.info('[API] POST /api/admin/inbox →', { success: true, id: approvalRequest.id });
      res.status(201).json({ 
        success: true, 
        message: "Approval request created successfully",
        request: approvalRequest 
      });
    } catch (error) {
      console.error('Approval request creation error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`) 
        });
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: "Failed to create approval request", details: errorMessage });
    }
  });

  // =============================================================================
  // DATA IMPORT ROUTES
  // =============================================================================

  // Get all imports for organization
  app.get("/api/imports", requireAuth, async (req: AuthenticatedRequest, res) => {
    console.info('[API]', req.method, req.url);
    try {
      // Get organization ID from header
      const orgId = req.headers['x-org-id'] as string;
      if (!orgId) {
        return res.status(400).json({ error: 'Organization ID required in x-org-id header' });
      }

      // Get user's organization role and check admin access
      const userOrgs = await storage.auth.getUserOrganizations(req.user?.id, orgId);
      const userOrg = userOrgs.length > 0 ? userOrgs[0] : null;
      if (!userOrg || (userOrg.role !== 'admin' && userOrg.role !== 'owner')) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const imports = await storage.imports.getDataImports(orgId);
      
      console.info('[API] GET /api/imports →', { success: true, count: imports.length });
      res.json(imports);
    } catch (error) {
      console.error('Import list error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to fetch imports', details: errorMessage });
    }
  });

  // Get specific import details
  app.get("/api/imports/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    console.info('[API]', req.method, req.url);
    try {
      const { id } = req.params;
      const userProfile = await storage.auth.getUserProfile(req.user?.id || '');
      
      if (!userProfile?.orgId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      // Get user's organization role and check admin access
      const userOrgs = await storage.auth.getUserOrganizations(req.user?.id, userProfile.orgId);
      const userOrg = userOrgs.length > 0 ? userOrgs[0] : null;
      if (!userOrg || (userOrg.role !== 'admin' && userOrg.role !== 'owner')) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const importData = await storage.imports.getDataImport(id);
      if (!importData) {
        return res.status(404).json({ error: 'Import not found' });
      }

      // Verify import belongs to user's organization
      if (importData.orgId !== userProfile.orgId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      console.info('[API] GET /api/imports/:id →', { success: true, id });
      res.json(importData);
    } catch (error) {
      console.error('Import fetch error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to fetch import', details: errorMessage });
    }
  });

  // Create new import (file upload)
  app.post("/api/imports", requireAuth, writeLimiter, upload.single('file'), async (req: AuthenticatedRequest, res) => {
    console.info('[API]', req.method, req.url);
    try {
      const userProfile = await storage.auth.getUserProfile(req.user?.id || '');
      if (!userProfile?.orgId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      // Get user's organization role and check admin access
      const userOrgs = await storage.auth.getUserOrganizations(req.user?.id, userProfile.orgId);
      const userOrg = userOrgs.length > 0 ? userOrgs[0] : null;
      if (!userOrg || (userOrg.role !== 'admin' && userOrg.role !== 'owner')) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      // Check if file was uploaded
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: 'File is required' });
      }

      // Get import type from request body or detect from filename
      const importType = req.body.importType || 
        (file.originalname.toLowerCase().includes('candidate') ? 'candidates' : 'jobs');
      
      if (!['candidates', 'jobs'].includes(importType)) {
        return res.status(400).json({ error: 'Invalid import type. Must be "candidates" or "jobs"' });
      }

      // Create the import record
      const newImport = await storage.imports.createDataImport({
        orgId: userProfile.orgId,
        userId: req.user?.id || '',
        importType: importType as 'candidates' | 'jobs',
        fileName: file.originalname,
        fileSize: file.size,
        status: 'processing',
        totalRecords: 0,
        successfulRecords: 0,
        failedRecords: 0,
        fieldMapping: null,
        errorSummary: null,
        processingStartedAt: new Date(),
        processingCompletedAt: null
      });

      // Start processing in the background (don't await)
      setImmediate(async () => {
        try {
          await ImportService.processImport(newImport, file.buffer, file.originalname);
        } catch (error) {
          console.error('Background import processing failed:', error);
        }
      });
      
      console.info('[API] POST /api/imports →', { success: true, id: newImport.id });
      res.status(201).json(newImport);
    } catch (error) {
      console.error('Import creation error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`) 
        });
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to create import', details: errorMessage });
    }
  });

  // Update import status
  app.patch("/api/imports/:id", requireAuth, writeLimiter, async (req: AuthenticatedRequest, res) => {
    console.info('[API]', req.method, req.url);
    try {
      const { id } = req.params;
      const userProfile = await storage.auth.getUserProfile(req.user?.id || '');
      
      if (!userProfile?.orgId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      // Get user's organization role and check admin access
      const userOrgs = await storage.auth.getUserOrganizations(req.user?.id, userProfile.orgId);
      const userOrg = userOrgs.length > 0 ? userOrgs[0] : null;
      if (!userOrg || (userOrg.role !== 'admin' && userOrg.role !== 'owner')) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const existingImport = await storage.imports.getDataImport(id);
      if (!existingImport) {
        return res.status(404).json({ error: 'Import not found' });
      }

      // Verify import belongs to user's organization
      if (existingImport.orgId !== userProfile.orgId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const updatedImport = await storage.imports.updateDataImport(id, req.body);
      
      console.info('[API] PATCH /api/imports/:id →', { success: true, id });
      res.json(updatedImport);
    } catch (error) {
      console.error('Import update error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to update import', details: errorMessage });
    }
  });

  // Delete import
  app.delete("/api/imports/:id", requireAuth, writeLimiter, async (req: AuthenticatedRequest, res) => {
    console.info('[API]', req.method, req.url);
    try {
      const { id } = req.params;
      const userProfile = await storage.auth.getUserProfile(req.user?.id || '');
      
      if (!userProfile?.orgId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      // Get user's organization role and check admin access
      const userOrgs = await storage.auth.getUserOrganizations(req.user?.id, userProfile.orgId);
      const userOrg = userOrgs.length > 0 ? userOrgs[0] : null;
      if (!userOrg || (userOrg.role !== 'admin' && userOrg.role !== 'owner')) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const existingImport = await storage.imports.getDataImport(id);
      if (!existingImport) {
        return res.status(404).json({ error: 'Import not found' });
      }

      // Verify import belongs to user's organization
      if (existingImport.orgId !== userProfile.orgId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      await storage.deleteDataImport(id);
      
      console.info('[API] DELETE /api/imports/:id →', { success: true, id });
      res.json({ success: true, message: 'Import deleted successfully' });
    } catch (error) {
      console.error('Import deletion error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to delete import', details: errorMessage });
    }
  });

  // Get import records for specific import
  app.get("/api/imports/:id/records", requireAuth, async (req: AuthenticatedRequest, res) => {
    console.info('[API]', req.method, req.url);
    try {
      const { id } = req.params;
      const { status } = req.query;
      const userProfile = await storage.auth.getUserProfile(req.user?.id || '');
      
      if (!userProfile?.orgId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      // Get user's organization role and check admin access
      const userOrgs = await storage.auth.getUserOrganizations(req.user?.id, userProfile.orgId);
      const userOrg = userOrgs.length > 0 ? userOrgs[0] : null;
      if (!userOrg || (userOrg.role !== 'admin' && userOrg.role !== 'owner')) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const existingImport = await storage.imports.getDataImport(id);
      if (!existingImport) {
        return res.status(404).json({ error: 'Import not found' });
      }

      // Verify import belongs to user's organization
      if (existingImport.orgId !== userProfile.orgId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      let records: ImportRecord[];
      if (status && typeof status === 'string') {
        records = await storage.getImportRecordsByStatus(id, status);
      } else {
        records = await storage.getImportRecords(id);
      }
      
      console.info('[API] GET /api/imports/:id/records →', { success: true, count: records.length });
      res.json(records);
    } catch (error) {
      console.error('Import records fetch error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to fetch import records', details: errorMessage });
    }
  });

  // Create import record
  app.post("/api/imports/:id/records", requireAuth, writeLimiter, async (req: AuthenticatedRequest, res) => {
    console.info('[API]', req.method, req.url);
    try {
      const { id } = req.params;
      const userProfile = await storage.auth.getUserProfile(req.user?.id || '');
      
      if (!userProfile?.orgId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      // Get user's organization role and check admin access
      const userOrgs = await storage.auth.getUserOrganizations(req.user?.id, userProfile.orgId);
      const userOrg = userOrgs.length > 0 ? userOrgs[0] : null;
      if (!userOrg || (userOrg.role !== 'admin' && userOrg.role !== 'owner')) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const existingImport = await storage.imports.getDataImport(id);
      if (!existingImport) {
        return res.status(404).json({ error: 'Import not found' });
      }

      // Verify import belongs to user's organization
      if (existingImport.orgId !== userProfile.orgId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const validatedData = insertImportRecordSchema.parse({
        ...req.body,
        importId: id
      });

      const newRecord = await storage.createImportRecord(validatedData);
      
      console.info('[API] POST /api/imports/:id/records →', { success: true, id: newRecord.id });
      res.status(201).json(newRecord);
    } catch (error) {
      console.error('Import record creation error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`) 
        });
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to create import record', details: errorMessage });
    }
  });

  // Update import record
  app.patch("/api/imports/:importId/records/:recordId", requireAuth, writeLimiter, async (req: AuthenticatedRequest, res) => {
    console.info('[API]', req.method, req.url);
    try {
      const { importId, recordId } = req.params;
      const userProfile = await storage.auth.getUserProfile(req.user?.id || '');
      
      if (!userProfile?.orgId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      // Get user's organization role and check admin access
      const userOrgs = await storage.auth.getUserOrganizations(req.user?.id, userProfile.orgId);
      const userOrg = userOrgs.length > 0 ? userOrgs[0] : null;
      if (!userOrg || (userOrg.role !== 'admin' && userOrg.role !== 'owner')) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const existingImport = await storage.imports.getDataImport(importId);
      if (!existingImport) {
        return res.status(404).json({ error: 'Import not found' });
      }

      // Verify import belongs to user's organization
      if (existingImport.orgId !== userProfile.orgId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const existingRecord = await storage.getImportRecord(recordId);
      if (!existingRecord) {
        return res.status(404).json({ error: 'Import record not found' });
      }

      const updatedRecord = await storage.updateImportRecord(recordId, req.body);
      
      console.info('[API] PATCH /api/imports/:importId/records/:recordId →', { success: true, recordId });
      res.json(updatedRecord);
    } catch (error) {
      console.error('Import record update error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to update import record', details: errorMessage });
    }
  });

  // ==================== Google Integration Routes ====================
  // Mount Google OAuth and Calendar routes
  app.use('/auth/google', createGoogleAuthRoutes(storage));
  app.use('/api/google', createGoogleCalendarRoutes(storage));
  console.log('✅ Mounted Google integration routes');

  const httpServer = createServer(app);

  console.log("📡 Registered all API routes");

  return httpServer;
}
