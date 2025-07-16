/**
 * Optimized API Routes with Performance Enhancements
 * 
 * Features:
 * - Batch API endpoints
 * - Pagination support
 * - Search optimization
 * - Response caching
 * - Real-time WebSocket updates
 * - Performance monitoring
 */

import type { Express, Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { createServer, type Server } from "http";
import { WebSocketServer } from 'ws';
import { createOptimizedStorage } from "./optimized-storage";

// Enhanced rate limiters
const readLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 300, // 300 reads per minute per IP
  message: { error: "Too many read requests" },
  standardHeaders: true,
  legacyHeaders: false,
});

const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 writes per 15 minutes per IP
  message: { error: "Too many write operations" },
  standardHeaders: true,
  legacyHeaders: false,
});

const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 searches per minute per IP
  message: { error: "Too many search requests" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Performance monitoring middleware
const performanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(JSON.stringify({
      level: 'performance',
      method: req.method,
      path: req.path,
      duration,
      statusCode: res.statusCode,
      timestamp: new Date().toISOString()
    }));
  });
  
  next();
};

// Cache control middleware
const cacheMiddleware = (maxAge: number) => (req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'GET') {
    res.set('Cache-Control', `public, max-age=${maxAge}`);
  }
  next();
};

// Pagination helper
const parsePaginationParams = (req: Request) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100); // Max 100 items
  const cursor = req.query.cursor as string;
  const sortBy = req.query.sortBy as string || 'created_at';
  const sortOrder = (req.query.sortOrder as string) === 'asc' ? 'asc' : 'desc';
  
  return { limit, cursor, sortBy, sortOrder };
};

export async function registerOptimizedRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const optimizedStorage = createOptimizedStorage(httpServer);

  // Apply global middleware
  app.use(performanceMiddleware);

  // =============================================================================
  // BATCH API ENDPOINTS
  // =============================================================================

  // Dashboard batch endpoint
  app.get("/api/dashboard/batch", readLimiter, cacheMiddleware(60), async (req, res) => {
    try {
      const { include } = req.query;
      const includeList = (include as string)?.split(',') || [];
      
      const batchData: any = {};
      const promises: Promise<void>[] = [];
      
      if (includeList.includes('stats')) {
        promises.push(
          optimizedStorage.getDashboardStats().then(stats => batchData.stats = stats)
        );
      }
      
      if (includeList.includes('jobs_with_counts')) {
        promises.push(
          optimizedStorage.getJobsWithCandidateCounts().then(jobs => batchData.jobsWithCounts = jobs)
        );
      }
      
      await Promise.all(promises);
      res.json(batchData);
    } catch (error) {
      console.error('Dashboard batch error:', error);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });

  // Batch get entities
  app.post("/api/batch/jobs", readLimiter, async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids)) {
        return res.status(400).json({ error: "IDs must be an array" });
      }
      
      const jobs = await optimizedStorage.batchGetJobs(ids);
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ error: "Failed to batch fetch jobs" });
    }
  });

  app.post("/api/batch/candidates", readLimiter, async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids)) {
        return res.status(400).json({ error: "IDs must be an array" });
      }
      
      const candidates = await optimizedStorage.batchGetCandidates(ids);
      res.json(candidates);
    } catch (error) {
      res.status(500).json({ error: "Failed to batch fetch candidates" });
    }
  });

  app.post("/api/batch/clients", readLimiter, async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids)) {
        return res.status(400).json({ error: "IDs must be an array" });
      }
      
      const clients = await optimizedStorage.batchGetClients(ids);
      res.json(clients);
    } catch (error) {
      res.status(500).json({ error: "Failed to batch fetch clients" });
    }
  });

  // =============================================================================
  // SEARCH ENDPOINTS
  // =============================================================================

  app.get("/api/search", searchLimiter, cacheMiddleware(120), async (req, res) => {
    try {
      const { q, type, limit, offset } = req.query;
      
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: "Query parameter 'q' is required" });
      }
      
      const searchResults = await optimizedStorage.searchAll(q, {
        type: type as string,
        limit: parseInt(limit as string) || 20,
        offset: parseInt(offset as string) || 0
      });
      
      res.json(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: "Search failed" });
    }
  });

  // =============================================================================
  // PAGINATED ENDPOINTS
  // =============================================================================

  app.get("/api/jobs/paginated", readLimiter, cacheMiddleware(180), async (req, res) => {
    try {
      const paginationParams = parsePaginationParams(req);
      const filters = {
        status: req.query.status as string,
        clientId: req.query.clientId as string,
        recordStatus: req.query.recordStatus as string
      };
      
      // Remove undefined filters
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof typeof filters] === undefined) {
          delete filters[key as keyof typeof filters];
        }
      });
      
      const result = await optimizedStorage.getJobsPaginated({
        ...paginationParams,
        filters
      });
      
      res.json(result);
    } catch (error) {
      console.error('Jobs pagination error:', error);
      res.status(500).json({ error: "Failed to fetch paginated jobs" });
    }
  });

  app.get("/api/candidates/paginated", readLimiter, cacheMiddleware(180), async (req, res) => {
    try {
      const paginationParams = parsePaginationParams(req);
      const filters = {
        status: req.query.status as string
      };
      
      // Remove undefined filters
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof typeof filters] === undefined) {
          delete filters[key as keyof typeof filters];
        }
      });
      
      const result = await optimizedStorage.getCandidatesPaginated({
        ...paginationParams,
        filters
      });
      
      res.json(result);
    } catch (error) {
      console.error('Candidates pagination error:', error);
      res.status(500).json({ error: "Failed to fetch paginated candidates" });
    }
  });

  // =============================================================================
  // ENHANCED DASHBOARD ENDPOINTS
  // =============================================================================

  app.get("/api/dashboard/stats", readLimiter, cacheMiddleware(60), async (req, res) => {
    try {
      const stats = await optimizedStorage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({ error: "Failed to fetch dashboard statistics" });
    }
  });

  app.get("/api/dashboard/jobs-with-counts", readLimiter, cacheMiddleware(300), async (req, res) => {
    try {
      const jobsWithCounts = await optimizedStorage.getJobsWithCandidateCounts();
      res.json(jobsWithCounts);
    } catch (error) {
      console.error('Jobs with counts error:', error);
      res.status(500).json({ error: "Failed to fetch jobs with candidate counts" });
    }
  });

  // =============================================================================
  // CACHE MANAGEMENT ENDPOINTS
  // =============================================================================

  app.post("/api/cache/invalidate", writeLimiter, async (req, res) => {
    try {
      const { pattern } = req.body;
      
      if (!pattern || typeof pattern !== 'string') {
        return res.status(400).json({ error: "Pattern is required" });
      }
      
      optimizedStorage.invalidateCache(pattern);
      res.json({ message: `Cache invalidated for pattern: ${pattern}` });
    } catch (error) {
      res.status(500).json({ error: "Failed to invalidate cache" });
    }
  });

  // =============================================================================
  // PERFORMANCE MONITORING ENDPOINTS
  // =============================================================================

  app.get("/api/metrics", readLimiter, async (req, res) => {
    try {
      const metrics = optimizedStorage.getMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch metrics" });
    }
  });

  // =============================================================================
  // ENHANCED CREATE/UPDATE ENDPOINTS WITH REAL-TIME UPDATES
  // =============================================================================

  app.post("/api/jobs/enhanced", writeLimiter, async (req, res) => {
    try {
      const job = await optimizedStorage.createJobWithUpdates(req.body);
      res.status(201).json(job);
    } catch (error) {
      console.error('Enhanced job creation error:', error);
      res.status(400).json({ error: "Failed to create job", details: error.message });
    }
  });

  app.put("/api/job-candidates/:id/enhanced", writeLimiter, async (req, res) => {
    try {
      const jobCandidate = await optimizedStorage.updateJobCandidateWithUpdates(req.params.id, req.body);
      res.json(jobCandidate);
    } catch (error) {
      console.error('Enhanced job candidate update error:', error);
      res.status(400).json({ error: "Failed to update job candidate" });
    }
  });

  // =============================================================================
  // HEALTH AND STATUS ENDPOINTS
  // =============================================================================

  app.get("/api/health", async (req, res) => {
    try {
      const metrics = optimizedStorage.getMetrics();
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        metrics: {
          cacheSize: metrics.cache.size,
          performanceReport: Object.keys(metrics.performance.operations).length
        }
      };
      
      res.json(health);
    } catch (error) {
      res.status(500).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  });

  // =============================================================================
  // WebSocket SETUP FOR REAL-TIME UPDATES
  // =============================================================================

  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws, req) => {
    console.log('WebSocket client connected');

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('WebSocket message received:', message);
        
        // Handle subscription management
        if (message.type === 'subscribe') {
          ws.send(JSON.stringify({
            type: 'subscription_confirmed',
            channel: message.channel
          }));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'welcome',
      message: 'Connected to TalentPatriot real-time updates'
    }));
  });

  console.log('🚀 Optimized routes registered with WebSocket support');
  
  return httpServer;
}