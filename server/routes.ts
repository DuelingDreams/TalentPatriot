import type { Express } from "express";
import rateLimit from "express-rate-limit";
import { createServer, type Server } from "http";
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

export async function registerRoutes(app: Express): Promise<Server> {
  console.log('📡 Registered all API routes');
  // Continue with existing implementation...
  // Clients routes
  app.get("/api/clients", async (req, res) => {
    try {
      const clients = await storage.getClients();
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
      res.status(400).json({ error: "Failed to create client", details: error.message });
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
      const jobs = await storage.getJobs();
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
      res.status(400).json({ error: "Failed to create job", details: error.message });
    }
  });

  // Candidates routes
  app.get("/api/candidates", async (req, res) => {
    try {
      const candidates = await storage.getCandidates();
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

  const httpServer = createServer(app);

  console.log("📡 Registered all API routes");

  return httpServer;
}
