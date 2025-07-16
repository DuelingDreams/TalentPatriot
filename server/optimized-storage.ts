/**
 * Optimized Storage Layer with Performance Enhancements
 * 
 * Features:
 * - Query batching and caching
 * - Efficient field mapping
 * - Real-time updates
 * - Connection pooling
 * - Performance monitoring
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { eq, inArray, and, desc, sql, gt, lt } from 'drizzle-orm';
import { 
  clients, 
  jobs, 
  candidates, 
  jobCandidate, 
  candidateNotes,
  interviews,
  messages,
  messageRecipients,
  type Client, 
  type Job, 
  type Candidate, 
  type JobCandidate, 
  type CandidateNotes,
  type Interview,
  type Message,
  type MessageRecipient,
  type InsertClient,
  type InsertJob,
  type InsertCandidate,
  type InsertJobCandidate,
  type InsertCandidateNotes,
  type InsertInterview,
  type InsertMessage,
  type InsertMessageRecipient
} from "@shared/schema";
import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

// Cache manager for response caching
class CacheManager {
  private cache = new Map<string, { data: any; expiry: number }>();
  private defaultTTL = 300000; // 5 minutes

  async get<T>(key: string): Promise<T | null> {
    const cached = this.cache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  async set(key: string, data: any, ttlMs?: number): Promise<void> {
    this.cache.set(key, {
      data,
      expiry: Date.now() + (ttlMs || this.defaultTTL)
    });
  }

  generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((obj, key) => {
        obj[key] = params[key];
        return obj;
      }, {} as Record<string, any>);
    return `${prefix}:${JSON.stringify(sortedParams)}`;
  }

  invalidatePattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0 // TODO: Implement hit rate tracking
    };
  }
}

// Field mapping utility with caching
class FieldMapper {
  private static camelToSnakeCache = new Map<string, string>();
  private static snakeToCamelCache = new Map<string, string>();

  static camelToSnake(str: string): string {
    if (this.camelToSnakeCache.has(str)) {
      return this.camelToSnakeCache.get(str)!;
    }
    
    const result = str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    this.camelToSnakeCache.set(str, result);
    return result;
  }

  static snakeToCamel(str: string): string {
    if (this.snakeToCamelCache.has(str)) {
      return this.snakeToCamelCache.get(str)!;
    }
    
    const result = str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    this.snakeToCamelCache.set(str, result);
    return result;
  }

  static mapObjectKeys<T>(obj: T, mapper: (key: string) => string): T {
    if (obj === null || typeof obj !== 'object') return obj;
    
    const result = {} as T;
    for (const [key, value] of Object.entries(obj)) {
      const newKey = mapper(key);
      (result as any)[newKey] = value;
    }
    return result;
  }

  static mapArrayKeys<T>(arr: T[], mapper: (key: string) => string): T[] {
    return arr.map(obj => this.mapObjectKeys(obj, mapper));
  }
}

// Real-time manager for WebSocket updates
class RealtimeManager {
  private wss?: WebSocketServer;
  private subscriptions = new Map<string, Set<WebSocket>>();

  constructor(server?: Server) {
    if (server) {
      this.wss = new WebSocketServer({ server, path: '/ws' });
      this.setupConnection();
    }
  }

  private setupConnection(): void {
    if (!this.wss) return;

    this.wss.on('connection', (ws) => {
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleSubscription(ws, message);
        } catch (error) {
          console.error('Invalid WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        this.removeFromAllSubscriptions(ws);
      });
    });
  }

  private handleSubscription(ws: WebSocket, message: any): void {
    const { type, channel } = message;
    
    if (type === 'subscribe') {
      if (!this.subscriptions.has(channel)) {
        this.subscriptions.set(channel, new Set());
      }
      this.subscriptions.get(channel)!.add(ws);
    } else if (type === 'unsubscribe') {
      this.subscriptions.get(channel)?.delete(ws);
    }
  }

  private removeFromAllSubscriptions(ws: WebSocket): void {
    for (const subscribers of this.subscriptions.values()) {
      subscribers.delete(ws);
    }
  }

  broadcast(channel: string, data: any): void {
    const subscribers = this.subscriptions.get(channel);
    if (subscribers) {
      const message = JSON.stringify({ channel, data });
      subscribers.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
    }
  }
}

// Performance metrics collector
class MetricsCollector {
  private metrics = new Map<string, number[]>();
  private queryCount = 0;
  private cacheHits = 0;
  private cacheMisses = 0;

  recordResponseTime(operation: string, time: number): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    this.metrics.get(operation)!.push(time);
  }

  recordQuery(): void {
    this.queryCount++;
  }

  recordCacheHit(): void {
    this.cacheHits++;
  }

  recordCacheMiss(): void {
    this.cacheMisses++;
  }

  getAverageResponseTime(operation: string): number {
    const times = this.metrics.get(operation) || [];
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  }

  getPerformanceReport(): Record<string, any> {
    const report: Record<string, any> = {
      totalQueries: this.queryCount,
      cacheHitRate: this.cacheHits / (this.cacheHits + this.cacheMisses) || 0,
      operations: {}
    };
    
    for (const [operation, times] of this.metrics.entries()) {
      if (times.length > 0) {
        const sorted = [...times].sort((a, b) => a - b);
        report.operations[operation] = {
          count: times.length,
          average: this.getAverageResponseTime(operation),
          min: Math.min(...times),
          max: Math.max(...times),
          p50: sorted[Math.floor(sorted.length * 0.5)],
          p95: sorted[Math.floor(sorted.length * 0.95)]
        };
      }
    }
    
    return report;
  }
}

// Pagination interface
interface PaginationOptions {
  limit?: number;
  cursor?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

interface PaginatedResult<T> {
  data: T[];
  hasNextPage: boolean;
  nextCursor?: string;
  totalCount?: number;
}

// Dashboard statistics interface
interface DashboardStats {
  activeClients: number;
  demoClients: number;
  openJobs: number;
  filledJobs: number;
  demoJobs: number;
  activeCandidates: number;
  demoCandidates: number;
  appliedCount: number;
  screeningCount: number;
  interviewCount: number;
  technicalCount: number;
  finalCount: number;
  offerCount: number;
  hiredCount: number;
  rejectedCount: number;
  recentActivityCount: number;
  lastUpdated: Date;
}

// Enhanced storage interface
export interface IOptimizedStorage {
  // Enhanced methods with caching and batching
  getDashboardStats(): Promise<DashboardStats>;
  getJobsWithCandidateCounts(): Promise<(Job & { candidateCount: number })[]>;
  searchAll(query: string, options?: { type?: string; limit?: number; offset?: number }): Promise<any>;
  getJobsPaginated(options: PaginationOptions): Promise<PaginatedResult<Job>>;
  getCandidatesPaginated(options: PaginationOptions): Promise<PaginatedResult<Candidate>>;
  
  // Batch operations
  batchGetJobs(ids: string[]): Promise<Job[]>;
  batchGetCandidates(ids: string[]): Promise<Candidate[]>;
  batchGetClients(ids: string[]): Promise<Client[]>;
  
  // Cache management
  invalidateCache(pattern: string): void;
  getMetrics(): Record<string, any>;
}

// Optimized database storage implementation
export class OptimizedDatabaseStorage implements IOptimizedStorage {
  private db: any;
  private cache: CacheManager;
  private realtime: RealtimeManager;
  private metrics: MetricsCollector;

  constructor(server?: Server) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    // Optimized database connection with pooling
    const sql = neon(process.env.DATABASE_URL, {
      poolConfig: {
        max: 20,
        min: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      },
      fetchConnectionCache: true,
    });
    
    this.db = drizzle(sql);
    this.cache = new CacheManager();
    this.realtime = new RealtimeManager(server);
    this.metrics = new MetricsCollector();
  }

  private async measureOperation<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      this.metrics.recordResponseTime(operation, Date.now() - start);
      return result;
    } catch (error) {
      this.metrics.recordResponseTime(operation, Date.now() - start);
      throw error;
    }
  }

  private async executeWithCache<T>(
    cacheKey: string, 
    operation: string,
    fn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try cache first
    const cached = await this.cache.get<T>(cacheKey);
    if (cached !== null) {
      this.metrics.recordCacheHit();
      return cached;
    }

    this.metrics.recordCacheMiss();
    
    // Execute operation with metrics
    const result = await this.measureOperation(operation, fn);
    
    // Cache result
    await this.cache.set(cacheKey, result, ttl);
    
    return result;
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const cacheKey = 'dashboard_stats';
    
    return this.executeWithCache(
      cacheKey,
      'getDashboardStats',
      async () => {
        this.metrics.recordQuery();
        
        // Use materialized view if available, fallback to regular queries
        try {
          const result = await this.db.execute(sql`
            SELECT * FROM dashboard_stats LIMIT 1
          `);
          
          if (result.length > 0) {
            return result[0] as DashboardStats;
          }
        } catch (error) {
          console.warn('Materialized view not available, using regular queries');
        }

        // Fallback to individual queries
        const [
          activeClients,
          demoClients,
          openJobs,
          filledJobs,
          demoJobs,
          activeCandidates,
          demoCandidates,
          appliedCount,
          screeningCount,
          interviewCount,
          technicalCount,
          finalCount,
          offerCount,
          hiredCount,
          rejectedCount,
          recentActivityCount
        ] = await Promise.all([
          this.db.select({ count: sql<number>`count(*)` }).from(clients).where(eq(clients.status, 'active')),
          this.db.select({ count: sql<number>`count(*)` }).from(clients).where(eq(clients.status, 'demo')),
          this.db.select({ count: sql<number>`count(*)` }).from(jobs).where(and(eq(jobs.recordStatus, 'active'), eq(jobs.status, 'open'))),
          this.db.select({ count: sql<number>`count(*)` }).from(jobs).where(and(eq(jobs.recordStatus, 'active'), eq(jobs.status, 'filled'))),
          this.db.select({ count: sql<number>`count(*)` }).from(jobs).where(eq(jobs.recordStatus, 'demo')),
          this.db.select({ count: sql<number>`count(*)` }).from(candidates).where(eq(candidates.status, 'active')),
          this.db.select({ count: sql<number>`count(*)` }).from(candidates).where(eq(candidates.status, 'demo')),
          this.db.select({ count: sql<number>`count(*)` }).from(jobCandidate).where(and(eq(jobCandidate.status, 'active'), eq(jobCandidate.stage, 'applied'))),
          this.db.select({ count: sql<number>`count(*)` }).from(jobCandidate).where(and(eq(jobCandidate.status, 'active'), eq(jobCandidate.stage, 'screening'))),
          this.db.select({ count: sql<number>`count(*)` }).from(jobCandidate).where(and(eq(jobCandidate.status, 'active'), eq(jobCandidate.stage, 'interview'))),
          this.db.select({ count: sql<number>`count(*)` }).from(jobCandidate).where(and(eq(jobCandidate.status, 'active'), eq(jobCandidate.stage, 'technical'))),
          this.db.select({ count: sql<number>`count(*)` }).from(jobCandidate).where(and(eq(jobCandidate.status, 'active'), eq(jobCandidate.stage, 'final'))),
          this.db.select({ count: sql<number>`count(*)` }).from(jobCandidate).where(and(eq(jobCandidate.status, 'active'), eq(jobCandidate.stage, 'offer'))),
          this.db.select({ count: sql<number>`count(*)` }).from(jobCandidate).where(and(eq(jobCandidate.status, 'active'), eq(jobCandidate.stage, 'hired'))),
          this.db.select({ count: sql<number>`count(*)` }).from(jobCandidate).where(and(eq(jobCandidate.status, 'active'), eq(jobCandidate.stage, 'rejected'))),
          this.db.select({ count: sql<number>`count(*)` }).from(jobCandidate).where(and(eq(jobCandidate.status, 'active'), gt(jobCandidate.updatedAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))))
        ]);

        return {
          activeClients: activeClients[0]?.count || 0,
          demoClients: demoClients[0]?.count || 0,
          openJobs: openJobs[0]?.count || 0,
          filledJobs: filledJobs[0]?.count || 0,
          demoJobs: demoJobs[0]?.count || 0,
          activeCandidates: activeCandidates[0]?.count || 0,
          demoCandidates: demoCandidates[0]?.count || 0,
          appliedCount: appliedCount[0]?.count || 0,
          screeningCount: screeningCount[0]?.count || 0,
          interviewCount: interviewCount[0]?.count || 0,
          technicalCount: technicalCount[0]?.count || 0,
          finalCount: finalCount[0]?.count || 0,
          offerCount: offerCount[0]?.count || 0,
          hiredCount: hiredCount[0]?.count || 0,
          rejectedCount: rejectedCount[0]?.count || 0,
          recentActivityCount: recentActivityCount[0]?.count || 0,
          lastUpdated: new Date()
        };
      },
      60000 // 1 minute TTL
    );
  }

  async getJobsWithCandidateCounts(): Promise<(Job & { candidateCount: number })[]> {
    const cacheKey = 'jobs_with_candidate_counts';
    
    return this.executeWithCache(
      cacheKey,
      'getJobsWithCandidateCounts',
      async () => {
        this.metrics.recordQuery();
        
        const result = await this.db
          .select({
            id: jobs.id,
            title: jobs.title,
            description: jobs.description,
            clientId: jobs.clientId,
            status: jobs.status,
            recordStatus: jobs.recordStatus,
            createdAt: jobs.createdAt,
            updatedAt: jobs.updatedAt,
            createdBy: jobs.createdBy,
            assignedTo: jobs.assignedTo,
            candidateCount: sql<number>`count(${jobCandidate.id})`
          })
          .from(jobs)
          .leftJoin(jobCandidate, eq(jobs.id, jobCandidate.jobId))
          .groupBy(jobs.id)
          .orderBy(desc(jobs.createdAt));

        return result;
      },
      300000 // 5 minutes TTL
    );
  }

  async searchAll(query: string, options: { type?: string; limit?: number; offset?: number } = {}): Promise<any> {
    const { type, limit = 20, offset = 0 } = options;
    const cacheKey = this.cache.generateKey('search', { query, type, limit, offset });
    
    return this.executeWithCache(
      cacheKey,
      'searchAll',
      async () => {
        this.metrics.recordQuery();
        
        const searchTerm = query.trim().replace(/\s+/g, ' & ');
        const results: any = { clients: [], jobs: [], candidates: [] };

        if (!type || type === 'clients') {
          try {
            results.clients = await this.db
              .select()
              .from(clients)
              .where(sql`search_vector @@ to_tsquery('english', ${searchTerm})`)
              .limit(limit)
              .offset(offset);
          } catch (error) {
            // Fallback to ILIKE search if search_vector not available
            results.clients = await this.db
              .select()
              .from(clients)
              .where(sql`name ILIKE ${'%' + query + '%'}`)
              .limit(limit)
              .offset(offset);
          }
        }

        if (!type || type === 'candidates') {
          try {
            results.candidates = await this.db
              .select()
              .from(candidates)
              .where(sql`search_vector @@ to_tsquery('english', ${searchTerm})`)
              .limit(limit)
              .offset(offset);
          } catch (error) {
            // Fallback to ILIKE search
            results.candidates = await this.db
              .select()
              .from(candidates)
              .where(sql`name ILIKE ${'%' + query + '%'} OR email ILIKE ${'%' + query + '%'}`)
              .limit(limit)
              .offset(offset);
          }
        }

        if (!type || type === 'jobs') {
          results.jobs = await this.db
            .select()
            .from(jobs)
            .where(sql`title ILIKE ${'%' + query + '%'} OR description ILIKE ${'%' + query + '%'}`)
            .limit(limit)
            .offset(offset);
        }

        return results;
      },
      120000 // 2 minutes TTL
    );
  }

  async getJobsPaginated(options: PaginationOptions): Promise<PaginatedResult<Job>> {
    const { limit = 20, cursor, sortBy = 'created_at', sortOrder = 'desc', filters = {} } = options;
    const cacheKey = this.cache.generateKey('jobs_paginated', { limit, cursor, sortBy, sortOrder, filters });
    
    return this.executeWithCache(
      cacheKey,
      'getJobsPaginated',
      async () => {
        this.metrics.recordQuery();
        
        let query = this.db.select().from(jobs);
        
        // Apply filters
        if (filters.status) {
          query = query.where(eq(jobs.status, filters.status));
        }
        if (filters.clientId) {
          query = query.where(eq(jobs.clientId, filters.clientId));
        }
        if (filters.recordStatus) {
          query = query.where(eq(jobs.recordStatus, filters.recordStatus));
        }
        
        // Apply cursor pagination
        if (cursor) {
          const cursorDate = new Date(cursor);
          if (sortOrder === 'desc') {
            query = query.where(lt(jobs.createdAt, cursorDate));
          } else {
            query = query.where(gt(jobs.createdAt, cursorDate));
          }
        }
        
        // Apply sorting and limit
        query = query
          .orderBy(sortOrder === 'desc' ? desc(jobs.createdAt) : jobs.createdAt)
          .limit(limit + 1);
        
        const results = await query;
        const hasNextPage = results.length > limit;
        const data = hasNextPage ? results.slice(0, -1) : results;
        const nextCursor = hasNextPage ? data[data.length - 1].createdAt.toISOString() : undefined;
        
        return { data, hasNextPage, nextCursor };
      },
      180000 // 3 minutes TTL
    );
  }

  async getCandidatesPaginated(options: PaginationOptions): Promise<PaginatedResult<Candidate>> {
    const { limit = 20, cursor, sortBy = 'created_at', sortOrder = 'desc', filters = {} } = options;
    const cacheKey = this.cache.generateKey('candidates_paginated', { limit, cursor, sortBy, sortOrder, filters });
    
    return this.executeWithCache(
      cacheKey,
      'getCandidatesPaginated',
      async () => {
        this.metrics.recordQuery();
        
        let query = this.db.select().from(candidates);
        
        // Apply filters
        if (filters.status) {
          query = query.where(eq(candidates.status, filters.status));
        }
        
        // Apply cursor pagination
        if (cursor) {
          const cursorDate = new Date(cursor);
          if (sortOrder === 'desc') {
            query = query.where(lt(candidates.createdAt, cursorDate));
          } else {
            query = query.where(gt(candidates.createdAt, cursorDate));
          }
        }
        
        // Apply sorting and limit
        query = query
          .orderBy(sortOrder === 'desc' ? desc(candidates.createdAt) : candidates.createdAt)
          .limit(limit + 1);
        
        const results = await query;
        const hasNextPage = results.length > limit;
        const data = hasNextPage ? results.slice(0, -1) : results;
        const nextCursor = hasNextPage ? data[data.length - 1].createdAt.toISOString() : undefined;
        
        return { data, hasNextPage, nextCursor };
      },
      180000 // 3 minutes TTL
    );
  }

  async batchGetJobs(ids: string[]): Promise<Job[]> {
    if (ids.length === 0) return [];
    
    const cacheKey = this.cache.generateKey('batch_jobs', { ids: ids.sort() });
    
    return this.executeWithCache(
      cacheKey,
      'batchGetJobs',
      async () => {
        this.metrics.recordQuery();
        return await this.db.select().from(jobs).where(inArray(jobs.id, ids));
      },
      300000 // 5 minutes TTL
    );
  }

  async batchGetCandidates(ids: string[]): Promise<Candidate[]> {
    if (ids.length === 0) return [];
    
    const cacheKey = this.cache.generateKey('batch_candidates', { ids: ids.sort() });
    
    return this.executeWithCache(
      cacheKey,
      'batchGetCandidates',
      async () => {
        this.metrics.recordQuery();
        return await this.db.select().from(candidates).where(inArray(candidates.id, ids));
      },
      300000 // 5 minutes TTL
    );
  }

  async batchGetClients(ids: string[]): Promise<Client[]> {
    if (ids.length === 0) return [];
    
    const cacheKey = this.cache.generateKey('batch_clients', { ids: ids.sort() });
    
    return this.executeWithCache(
      cacheKey,
      'batchGetClients',
      async () => {
        this.metrics.recordQuery();
        return await this.db.select().from(clients).where(inArray(clients.id, ids));
      },
      300000 // 5 minutes TTL
    );
  }

  invalidateCache(pattern: string): void {
    this.cache.invalidatePattern(pattern);
  }

  getMetrics(): Record<string, any> {
    return {
      performance: this.metrics.getPerformanceReport(),
      cache: this.cache.getStats()
    };
  }

  // Helper method to broadcast real-time updates
  private broadcastUpdate(channel: string, data: any): void {
    this.realtime.broadcast(channel, {
      timestamp: new Date().toISOString(),
      ...data
    });
  }

  // Enhanced create methods with real-time updates and cache invalidation
  async createJobWithUpdates(job: InsertJob): Promise<Job> {
    const result = await this.measureOperation('createJob', async () => {
      this.metrics.recordQuery();
      const created = await this.db.insert(jobs).values(job).returning();
      return created[0];
    });

    // Invalidate related caches
    this.cache.invalidatePattern('jobs');
    this.cache.invalidatePattern('dashboard_stats');

    // Broadcast real-time update
    this.broadcastUpdate('job-updates', {
      type: 'job_created',
      data: result
    });

    return result;
  }

  async updateJobCandidateWithUpdates(id: string, updateData: Partial<InsertJobCandidate>): Promise<JobCandidate> {
    const result = await this.measureOperation('updateJobCandidate', async () => {
      this.metrics.recordQuery();
      const updated = await this.db
        .update(jobCandidate)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(jobCandidate.id, id))
        .returning();
      return updated[0];
    });

    // Invalidate related caches
    this.cache.invalidatePattern('pipeline');
    this.cache.invalidatePattern('dashboard_stats');

    // Broadcast pipeline update
    this.broadcastUpdate('pipeline-updates', {
      type: 'job_candidate_updated',
      data: result
    });

    return result;
  }
}

// Export the optimized storage instance
export const createOptimizedStorage = (server?: Server) => new OptimizedDatabaseStorage(server);