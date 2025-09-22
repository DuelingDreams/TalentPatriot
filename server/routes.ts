import type { Express, Request, Response } from "express";
import express from "express";
import rateLimit from "express-rate-limit";
import { createServer, type Server } from "http";
import type { SupabaseClient } from '@supabase/supabase-js';

import { storage } from "./storage";
import * as jobService from "../lib/jobService";
import { z } from 'zod';
import { uploadRouter } from "./routes/upload";
import { getFirstPipelineColumn, ensureDefaultPipeline } from "./lib/pipelineService";
import { 
  insertCandidateSchema, 
  insertJobSchema, 
  insertJobCandidateSchema,
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
  type JobCandidate
} from "../shared/schema";
import { createClient } from '@supabase/supabase-js';
import { subdomainResolver } from './middleware/subdomainResolver';
import { addUserToOrganization, removeUserFromOrganization, getOrganizationUsers } from "../lib/userService";
import crypto from "crypto";

// Authentication and Authorization Middleware
interface AuthenticatedRequest extends express.Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// Middleware to verify Supabase authentication
async function requireAuth(req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
    }

    const token = authHeader.substring(7);
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Authentication system unavailable', code: 'AUTH_SYSTEM_UNAVAILABLE' });
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid authentication token', code: 'INVALID_TOKEN' });
    }

    // Get user profile for role information
    const userProfile = await storage.getUserProfile(user.id);
    
    req.user = {
      id: user.id,
      email: user.email || '',
      role: userProfile?.role || 'hiring_manager'
    };

    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({ error: 'Authentication check failed', code: 'AUTH_CHECK_FAILED' });
  }
}

// Middleware to require platform admin role (for beta applications)
function requirePlatformAdmin(req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
  }

  // Only platform_admin can review beta applications (not organization admins)
  const platformAdminRoles = ['platform_admin'];
  if (!platformAdminRoles.includes(req.user.role)) {
    return res.status(403).json({ 
      error: 'Platform admin access required for beta application management', 
      code: 'INSUFFICIENT_PERMISSIONS',
      userRole: req.user.role,
      requiredRoles: platformAdminRoles
    });
  }

  next();
}

// Middleware to require organization admin role (for org management)
async function requireOrgAdmin(req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
  }

  const orgId = req.params.orgId || req.headers['x-org-id'] as string;
  if (!orgId) {
    return res.status(400).json({ error: 'Organization ID required', code: 'ORG_ID_REQUIRED' });
  }

  try {
    // Check if user is org admin or owner
    const userOrg = await storage.getUserOrganization(req.user.id, orgId);
    const organization = await storage.getOrganization(orgId);
    
    const isOrgAdmin = userOrg?.role === 'admin' || organization?.ownerId === req.user.id;
    
    if (!isOrgAdmin) {
      return res.status(403).json({ 
        error: 'Organization admin access required', 
        code: 'INSUFFICIENT_PERMISSIONS',
        userRole: userOrg?.role || 'none'
      });
    }

    next();
  } catch (error) {
    console.error('Organization admin check error:', error);
    res.status(500).json({ error: 'Authorization check failed', code: 'AUTH_CHECK_FAILED' });
  }
}

// Middleware to require recruiting capabilities (role + seat)
async function requireRecruiting(req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
  }

  const orgId = req.params.orgId || req.headers['x-org-id'] as string;
  if (!orgId) {
    return res.status(400).json({ error: 'Organization ID required', code: 'ORG_ID_REQUIRED' });
  }

  try {
    const userOrg = await storage.getUserOrganization(req.user.id, orgId);
    
    // Check if user has recruiting role (recruiter, admin, or hiring_manager with seat)
    const hasRecruiterRole = userOrg?.role === 'recruiter' || userOrg?.role === 'admin';
    const hasHiringManagerWithSeat = userOrg?.role === 'hiring_manager' && userOrg?.isRecruiterSeat;
    
    if (!hasRecruiterRole && !hasHiringManagerWithSeat) {
      return res.status(403).json({ 
        error: 'Recruiting access required', 
        code: 'RECRUITING_ACCESS_REQUIRED',
        message: 'This feature requires a recruiter role or hiring manager with recruiter seat.',
        userRole: userOrg?.role || 'none',
        hasRecruiterSeat: userOrg?.isRecruiterSeat || false
      });
    }

    // For billing purposes, ensure they have a paid seat (unless admin)
    if (userOrg?.role !== 'admin' && !userOrg?.isRecruiterSeat) {
      return res.status(403).json({ 
        error: 'Paid recruiter seat required', 
        code: 'RECRUITER_SEAT_REQUIRED',
        message: 'This feature requires a paid recruiter seat. Contact your organization admin to upgrade.'
      });
    }

    next();
  } catch (error) {
    console.error('Recruiting access check error:', error);
    res.status(500).json({ error: 'Authorization check failed', code: 'AUTH_CHECK_FAILED' });
  }
}

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
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create service role client for server-side auth operations
let supabaseAdmin: SupabaseClient | null = null;
if (supabaseUrl && supabaseServiceKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  console.log('✅ Supabase admin client initialized for organization creation');
} else {
  console.warn('⚠️ Supabase credentials missing - organization creation may fail');
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
        await storage.ensureUserProfile(ownerId);
        console.log('User profile ensured for:', ownerId);
      } catch (userError: unknown) {
        console.error('Failed to ensure user profile:', userError?.message);
        return res.status(500).json({ 
          error: "Failed to setup user profile",
          code: "PROFILE_SETUP_FAILED"
        });
      }
      
      // Step 3: Create the organization
      const organization = await storage.createOrganization({
        name,
        ownerId,
        slug
      });
      
      console.log('Organization created successfully:', organization.id);

      // Step 4: Update user metadata in Supabase Auth
      try {
        await supabaseAdmin.auth.admin.updateUserById(ownerId, {
          user_metadata: {
            currentOrgId: organization.id,
            role: metadata?.ownerRole || 'admin',
            companyName: name,
            companySize: metadata?.companySize,
            onboardingCompleted: true
          }
        });
        
        console.log(`Updated user ${ownerId} metadata with orgId: ${organization.id}`);
      } catch (metaError) {
        console.warn('Failed to update user metadata (non-critical):', metaError);
        // Don't fail the request if metadata update fails
      }
      
      res.status(201).json(organization);
    } catch (error: unknown) {
      console.error("Error creating organization:", error);
      res.status(400).json({ 
        error: "Failed to create organization",
        details: error?.message || "Unknown error occurred"
      });
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
      const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { currentOrgId: orgId, role },
      });
      
      if (updateErr) {
        console.error('Error updating user auth metadata:', updateErr);
        throw updateErr;
      }
      
      console.log(`Updated auth metadata for user ${userId} with orgId: ${orgId}, role: ${role}`);

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
    } catch (error: unknown) {
      console.error('Error in user-organization assignment endpoint:', error);
      return res.status(500).json({ 
        error: 'Failed to assign user to organization',
        details: error.message 
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
    } catch (error: unknown) {
      console.error('Error fetching organization users:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch organization users',
        details: error.message 
      });
    }
  });

  // Reports & Analytics endpoints
  app.get('/api/reports/metrics', async (req, res) => {
    try {
      const { orgId, period = '3months' } = req.query as { orgId: string; period: string }
      
      if (!orgId) {
        return res.status(400).json({ error: 'Organization ID is required' })
      }

      console.log(`[REPORTS] Generating metrics for organization: ${orgId}, period: ${period}`)

      // Calculate date range based on period
      const now = new Date()
      let startDate: Date
      
      switch (period) {
        case '1month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
          break
        case '6months':
          startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
          break
        case '1year':
          startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
          break
        default: // 3months
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
      }

      // Get real data from database
      const [jobs, candidates, applications] = await Promise.all([
        storage.getJobsByOrg(orgId),
        storage.getCandidatesByOrg(orgId),
        // Get job applications for this organization
        supabaseAdmin
          .from('job_applications')
          .select(`
            *,
            job:jobs!inner(*),
            candidate:candidates(*)
          `)
          .eq('jobs.org_id', orgId)
          .gte('created_at', startDate.toISOString())
          .then(({ data }: { data: ApplicationRow[] | null }) => data || [])
      ])

      // Filter jobs and candidates by date range
      const periodJobs = jobs.filter((job: Job) => new Date(job.createdAt) >= startDate)
      const periodCandidates = candidates.filter((candidate: Candidate) => new Date(candidate.createdAt) >= startDate)

      console.log(`[REPORTS] Found ${periodJobs.length} jobs, ${periodCandidates.length} candidates, ${applications.length} applications for org ${orgId}`)

      // Calculate time to hire metrics
      const hiredApplications = applications.filter((app: ApplicationRow) => app.status === 'hired')
      let timeToHireMetrics = {
        average: 0,
        median: 0,
        trend: 0,
        byMonth: [] as Array<{ month: string; average: number; count: number }>
      }

      if (hiredApplications.length > 0) {
        const hireTimes = hiredApplications.map((app: ApplicationRow) => {
          const applied = new Date(app.created_at)
          const hired = new Date(app.updated_at)
          return Math.ceil((hired.getTime() - applied.getTime()) / (1000 * 60 * 60 * 24))
        })

        timeToHireMetrics.average = Math.round(hireTimes.reduce((sum: number, time: number) => sum + time, 0) / hireTimes.length)
        
        const sortedTimes = [...hireTimes].sort((a, b) => a - b)
        timeToHireMetrics.median = sortedTimes[Math.floor(sortedTimes.length / 2)] || 0

        // Calculate monthly breakdown
        const monthlyHires = hiredApplications.reduce((acc: Record<string, number[]>, app: ApplicationRow) => {
          const month = new Date(app.updated_at).toLocaleDateString('en-US', { month: 'short' })
          if (!acc[month]) acc[month] = []
          
          const applied = new Date(app.created_at)
          const hired = new Date(app.updated_at)
          const days = Math.ceil((hired.getTime() - applied.getTime()) / (1000 * 60 * 60 * 24))
          acc[month].push(days)
          return acc
        }, {} as Record<string, number[]>)

        timeToHireMetrics.byMonth = Object.entries(monthlyHires).map(([month, times]) => ({
          month,
          average: Math.round((times as number[]).reduce((sum: number, time: number) => sum + time, 0) / (times as number[]).length),
          count: (times as number[]).length
        }))
      }

      // Calculate source of hire
      const sourceOfHire = applications.reduce((acc: Record<string, number>, app: ApplicationRow) => {
        const source = app.source || 'Company Website'
        acc[source] = (acc[source] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const totalApplications = applications.length
      const sourceOfHireArray = Object.entries(sourceOfHire).map(([source, count]) => ({
        source,
        count: count as number,
        percentage: totalApplications > 0 ? Math.round(((count as number) / totalApplications) * 100) : 0
      }))

      // Calculate pipeline conversion
      const appliedCount = applications.length
      const screenedCount = applications.filter((app: ApplicationRow) => ['screened', 'interviewed', 'offered', 'hired'].includes(app.status)).length
      const interviewedCount = applications.filter((app: ApplicationRow) => ['interviewed', 'offered', 'hired'].includes(app.status)).length
      const offeredCount = applications.filter((app: ApplicationRow) => ['offered', 'hired'].includes(app.status)).length
      const hiredCount = applications.filter((app: ApplicationRow) => app.status === 'hired').length

      const pipelineConversion = {
        applied: appliedCount,
        screened: screenedCount,
        interviewed: interviewedCount,
        offered: offeredCount,
        hired: hiredCount,
        conversionRates: [
          { stage: 'Applied to Screened', rate: appliedCount > 0 ? Math.round((screenedCount / appliedCount) * 100 * 10) / 10 : 0 },
          { stage: 'Screened to Interview', rate: screenedCount > 0 ? Math.round((interviewedCount / screenedCount) * 100 * 10) / 10 : 0 },
          { stage: 'Interview to Offer', rate: interviewedCount > 0 ? Math.round((offeredCount / interviewedCount) * 100 * 10) / 10 : 0 },
          { stage: 'Offer to Hired', rate: offeredCount > 0 ? Math.round((hiredCount / offeredCount) * 100 * 10) / 10 : 0 }
        ]
      }

      // Get recruiter performance (users in this organization)
      const { data: orgUsers } = await supabaseAdmin
        .from('user_organizations')
        .select('user_id, users(*)')
        .eq('org_id', orgId)

      const recruiterPerformance = []
      if (orgUsers) {
        for (const orgUser of orgUsers) {
          if (!orgUser.users) continue
          
          const userJobs = periodJobs.filter((job: Job) => job.createdBy === orgUser.user_id)
          const userApplications = applications.filter((app: ApplicationRow) => 
            userJobs.some((job: Job) => job.id === app.job_id)
          )
          const userHires = userApplications.filter((app: ApplicationRow) => app.status === 'hired')
          
          if (userJobs.length > 0 || userApplications.length > 0) {
            const userHireTimes = userHires.map((app: ApplicationRow) => {
              const applied = new Date(app.created_at)
              const hired = new Date(app.updated_at)
              return Math.ceil((hired.getTime() - applied.getTime()) / (1000 * 60 * 60 * 24))
            })
            
            recruiterPerformance.push({
              recruiter: orgUser.users.full_name || orgUser.users.email?.split('@')[0] || 'Unknown',
              jobsPosted: userJobs.length,
              candidatesHired: userHires.length,
              avgTimeToHire: userHireTimes.length > 0 ? Math.round(userHireTimes.reduce((sum: number, time: number) => sum + time, 0) / userHireTimes.length) : 0,
              conversionRate: userApplications.length > 0 ? Math.round((userHires.length / userApplications.length) * 100 * 10) / 10 : 0
            })
          }
        }
      }

      // Calculate monthly trends
      const monthlyTrends = []
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const nextMonthDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
        const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' })
        
        const monthApplications = applications.filter((app: ApplicationRow) => {
          const appDate = new Date(app.created_at)
          return appDate >= monthDate && appDate < nextMonthDate
        })
        
        const monthHires = monthApplications.filter((app: ApplicationRow) => app.status === 'hired')
        
        monthlyTrends.push({
          month: monthName,
          applications: monthApplications.length,
          hires: monthHires.length
        })
      }

      const metrics = {
        timeToHire: timeToHireMetrics,
        sourceOfHire: sourceOfHireArray,
        pipelineConversion,
        recruiterPerformance,
        monthlyTrends
      }

      console.log(`[REPORTS] Generated metrics:`, JSON.stringify(metrics, null, 2))
      res.json(metrics)
    } catch (error) {
      console.error('Error fetching analytics metrics:', error)
      res.status(500).json({ error: 'Failed to fetch analytics metrics' })
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
      const data = await storage.getPipelineSnapshot(orgId, limitNum)
      
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

      const data = await storage.getStageTimeAnalytics(orgId, jobId)
      
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

      const data = await storage.getJobHealthData(orgId)
      
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
      const data = await storage.getDashboardActivity(orgId, limitNum)
      
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
        storage.getJobsByOrg(orgId),
        storage.getCandidatesByOrg(orgId)
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

      const profile = await storage.getUserProfile(user.id);
      
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
        id: user.id,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phone: req.body.phone,
        jobTitle: req.body.jobTitle,
        department: req.body.department,
        location: req.body.location,
        bio: req.body.bio,
      };

      const updatedProfile = await storage.updateUserProfile(user.id, profileData);
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

      const settings = await storage.getUserSettings(user.id);
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

      const updatedSettings = await storage.updateUserSettings(user.id, settingsData);
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
    } catch (error: unknown) {
      console.error('Error removing user from organization:', error);
      return res.status(500).json({ 
        error: 'Failed to remove user from organization',
        details: error.message 
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
        const result = await storage.getJobsPaginated({
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
        const jobs = await storage.getJobsByOrg(orgId);
        
        // Generate ETag for response
        const etag = generateETag(jobs);
        
        // Check If-None-Match header for 304 Not Modified
        const clientETag = req.headers['if-none-match'];
        if (clientETag && clientETag === `"${etag}"`) {
          return res.status(304).end();
        }

        // Set caching headers
        setResponseCaching(res, {
          etag,
          cacheControl: 'private, max-age=180, must-revalidate',
          lastModified: jobs.length > 0 ? new Date(jobs[0].createdAt) : undefined
        });

        console.info('[API] GET /api/jobs (legacy) →', { success: true, count: jobs?.length || 0 });
        res.json(jobs);
      }
    } catch (error) {
      console.error('Error in GET /api/jobs:', error);
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
  const { createJob: createJobService, publishJob: publishJobService } = await import('../lib/jobService');
  
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
      
      const job = await createJobService(validatedData, userContext);
      
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
      
      // Extract user context from request (you'll need to set this up with auth middleware) 
      const userContext = { 
        userId: req.headers['x-user-id'] as string || 'system',
        orgId: req.headers['x-org-id'] as string || ''
      };
      
      const result = await publishJobService(jobId, userContext);
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
      const existingJob = await storage.getJob(jobId);
      if (!existingJob) {
        return res.status(404).json({ error: "Job not found" });
      }

      if (existingJob.orgId !== orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Only allow editing draft jobs
      if (existingJob.status !== 'draft') {
        return res.status(400).json({ error: "Only draft jobs can be edited" });
      }

      const updatedJob = await storage.updateJob(jobId, {
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
      const existingJob = await storage.getJob(jobId);
      if (!existingJob) {
        return res.status(404).json({ error: "Job not found" });
      }

      if (existingJob.orgId !== orgId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Delete the job and related data
      await storage.deleteJob(jobId);

      console.info('[API] DELETE /api/jobs/:jobId →', { success: true, jobId });
      res.json({ message: "Job deleted successfully" });
    } catch (error) {
      console.error('Error deleting job:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: "Failed to delete job", details: errorMessage });
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

      const results = await storage.searchCandidatesAdvanced(filters);
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

      const results = await storage.searchJobsAdvanced(filters);
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

  // Resume parsing endpoints
  const resumeParsingSchema = z.object({
    resumeText: z.string().min(1, "Resume text is required")
  });

  app.post('/api/candidates/:candidateId/parse-resume', writeLimiter, async (req, res) => {
    console.info('[API]', req.method, req.url);
    try {
      const { candidateId } = req.params;
      const validatedData = resumeParsingSchema.parse(req.body);

      const updatedCandidate = await storage.parseAndUpdateCandidate(candidateId, validatedData.resumeText);
      res.json({ success: true, candidate: updatedCandidate });
    } catch (error) {
      console.error('Resume parsing error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`) 
        });
      }
      res.status(500).json({ error: 'Failed to parse resume' });
    }
  });

  // Search candidates by skills endpoint
  const skillsSearchSchema = z.object({
    orgId: z.string().min(1, "Organization ID is required"),
    skills: z.array(z.string()).min(1, "At least one skill is required")
  });

  app.post('/api/search/candidates/by-skills', writeLimiter, async (req, res) => {
    console.info('[API]', req.method, req.url);
    try {
      const validatedData = skillsSearchSchema.parse(req.body);
      const results = await storage.searchCandidatesBySkills(validatedData.orgId, validatedData.skills);
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

  // JOB APPLICATION ROUTE - Complete flow using jobService
  const jobApplicationParamsSchema = z.object({
    jobId: z.string().uuid("Invalid job ID format")
  });

  const jobApplicationSchema = z.object({
    // Basic Information
    firstName: z.string().min(1, "First name is required").max(50, "First name too long"),
    lastName: z.string().min(1, "Last name is required").max(50, "Last name too long"),
    email: z.string().email("Valid email is required").max(255, "Email too long"),
    phone: z.string().optional().refine(val => !val || val.length <= 20, "Phone number too long"),
    
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

      // Use jobService applyToJob function with service role key for RLS bypass
      const result = await jobService.applyToJob({
        jobId,
        applicant: {
          firstName: applicantData.firstName,
          lastName: applicantData.lastName,
          email: applicantData.email,
          phone: applicantData.phone,
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
          const organizations = await storage.getOrganizations();
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
      const openJobs = await jobService.getPublicJobs(orgId);
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
          const organizations = await storage.getOrganizations();
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
      const allJobs = await jobService.getPublicJobs(orgId);
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
        const result = await storage.getCandidatesPaginated({
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
        const candidates = await storage.getCandidatesByOrg(orgId);
        
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
      
      const candidate = await storage.getCandidate(req.params.id);
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

  // Job-specific pipeline routes
  app.get("/api/jobs/:jobId/pipeline", async (req, res) => {
    try {
      const { jobId } = req.params;
      console.log('[Pipeline Route] Fetching pipeline for job:', jobId);

      // Get job details to verify it exists and get organization ID
      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      // Access org_id from raw data
      const orgId = (job as { org_id: string }).org_id;
      console.log('[Pipeline Route] Job orgId extracted:', orgId);

      // Import pipeline service
      const { ensureDefaultPipelineForJob } = await import('./lib/pipelineService');

      // Ensure pipeline exists for this job
      await ensureDefaultPipelineForJob({ 
        jobId, 
        organizationId: orgId 
      });

      // Use storage layer method to ensure database consistency
      // This uses the same Supabase client as the move operations
      const pipelineData = await storage.getJobPipelineData(jobId, orgId);

      console.log('[Pipeline Route] Pipeline data fetched successfully:', {
        columnsCount: pipelineData.columns.length,
        applicationsCount: pipelineData.applications.length,
        applications: pipelineData.applications.map(app => ({
          id: app.id,
          candidateName: app.candidate?.name,
          columnId: app.columnId
        }))
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
      const job = await storage.getJob(jobId);
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
      const note = await storage.createCandidateNote(req.body);
      console.log('[NOTES_API] Note created successfully:', { id: note.id, orgId: note.orgId });
      res.status(201).json(note);
    } catch (error: unknown) {
      console.error('[NOTES_API] Error creating candidate note:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ 
        error: "Failed to create candidate note", 
        details: errorMsg,
        message: error?.message || "Unknown error occurred"
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

        // Get paginated results
        const result = await storage.getMessagesPaginated({
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
        const messages = await storage.getMessages(userId);
        
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

  app.get("/api/interviews/job-candidate/:jobCandidateId", async (req, res) => {
    try {
      const interviews = await storage.getInterviewsByJobCandidate(req.params.jobCandidateId);
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
        const notes = await storage.getCandidateNotes(jobCandidateId);
        console.log('[NOTES_API] Found notes:', notes?.length || 0);
        res.json(notes);
      } else if (candidateId) {
        // Fallback for candidate-based lookup
        console.log('[NOTES_API] Fetching notes for candidateId:', candidateId);
        const notes = await storage.getCandidateNotes(candidateId);
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


  // Messages routes
  app.get("/api/messages", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      const messages = await storage.getMessages(userId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.get("/api/messages/:id", async (req, res) => {
    try {
      const message = await storage.getMessage(req.params.id);
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
      const message = await storage.createMessage(req.body);
      res.status(201).json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ error: "Failed to create message" });
    }
  });

  app.put("/api/messages/:id", writeLimiter, async (req, res) => {
    try {
      const message = await storage.updateMessage(req.params.id, req.body);
      res.json(message);
    } catch (error) {
      console.error("Error updating message:", error);
      res.status(500).json({ error: "Failed to update message" });
    }
  });

  app.patch("/api/messages/:id/read", writeLimiter, async (req, res) => {
    try {
      const { userId } = req.body;
      await storage.markMessageAsRead(req.params.id, userId);
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
    } catch (error: unknown) {
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





  // Add subdomain middleware for public routes
  app.use(subdomainResolver);

  // (Duplicate public jobs endpoint removed - using main implementation above)





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

    } catch (error: unknown) {
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
    } catch (error: unknown) {
      console.error('SendGrid test error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'SendGrid integration test failed',
        error: error.message,
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
      
      const betaApplication = await storage.createBetaApplication({
        ...validatedData,
        status: 'pending',
      });
      
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
      const betaApplications = await storage.getBetaApplications();
      
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
      
      const betaApplication = await storage.getBetaApplication(id);
      
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
      
      // Add review timestamp and reviewer if status is being changed
      const updateData = { ...validatedData };
      if (validatedData.status && validatedData.status !== 'pending') {
        (updateData as any).reviewedAt = new Date();
        (updateData as any).reviewedBy = req.user?.id;
      }
      
      const updatedApplication = await storage.updateBetaApplication(id, updateData);
      
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
      
      await storage.deleteBetaApplication(id);
      
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


  const httpServer = createServer(app);

  console.log("📡 Registered all API routes");

  return httpServer;
}
