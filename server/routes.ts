import type { Express } from "express";
import express from "express";
import rateLimit from "express-rate-limit";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";


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

// Authentication rate limiter (if we add auth endpoints)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 auth attempts per windowMs
  message: {
    error: "Too many authentication attempts from this IP, please try again later."
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
      const clients = await storage.getClients({ orgId });
      res.json(clients);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch clients" });
    }
  });

  app.get("/api/clients/:id", async (req, res) => {
    try {
      const client = await storage.getClient(req.params.id);
      if (!client) {
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
    try {
      const orgId = req.query.orgId as string;
      if (!orgId) {
        res.status(400).json({ error: "Organization ID is required" });
        return;
      }
      const jobs = await storage.getJobs({ orgId });
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
  });

  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const job = await storage.getJob(req.params.id);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch job" });
    }
  });

  app.post("/api/jobs", writeLimiter, async (req, res) => {
    try {
      const job = await storage.createJob(req.body);
      res.status(201).json(job);
    } catch (error) {
      console.error('Job creation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: "Failed to create job", details: errorMessage });
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
      const candidates = await storage.getCandidates({ orgId });
      res.json(candidates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch candidates" });
    }
  });

  app.post("/api/candidates", writeLimiter, async (req, res) => {
    try {
      const candidate = await storage.createCandidate(req.body);
      res.status(201).json(candidate);
    } catch (error) {
      res.status(400).json({ error: "Failed to create candidate" });
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
      res.status(400).json({ error: "Failed to create job candidate relationship", details: error.message });
    }
  });

  app.put("/api/job-candidates/:id", writeLimiter, async (req, res) => {
    try {
      const jobCandidate = await storage.updateJobCandidate(req.params.id, req.body);
      res.json(jobCandidate);
    } catch (error) {
      console.error('Job candidate update error:', error);
      res.status(400).json({ error: "Failed to update job candidate", details: error.message });
    }
  });

  // Candidate notes
  app.get("/api/job-candidates/:jobCandidateId/notes", async (req, res) => {
    try {
      const notes = await storage.getCandidateNotes(req.params.jobCandidateId);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch candidate notes" });
    }
  });

  app.post("/api/candidate-notes", writeLimiter, async (req, res) => {
    try {
      const note = await storage.createCandidateNote(req.body);
      res.status(201).json(note);
    } catch (error) {
      res.status(400).json({ error: "Failed to create candidate note" });
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

  // File upload endpoint
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
        error: error.message
      });
    }
  });

  // Serve uploaded files statically
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  const httpServer = createServer(app);

  console.log("📡 Registered all API routes");

  return httpServer;
}
