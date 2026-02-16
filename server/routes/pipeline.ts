import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage/index';
import { supabase } from '../lib/supabase';
import { writeLimiter } from '../middleware/rate-limit';
import { type AuthenticatedRequest, requireAuth, supabaseAdmin } from '../middleware/auth';
import { insertJobCandidateSchema, insertCandidateSchema, type JobCandidate } from '../../shared/schema';
import { triggerDeferredRefresh } from '../lib/analyticsRefresh';

export function createPipelineRoutes() {
  const router = Router();

  router.get("/api/jobs/:jobId/candidates", async (req, res) => {
    try {
      const jobCandidates = await storage.candidates.getJobCandidatesByJob(req.params.jobId);
      res.json(jobCandidates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch job candidates" });
    }
  });

  router.post("/api/job-candidates", writeLimiter, async (req, res) => {
    try {
      const jobCandidate = await storage.candidates.createJobCandidate(req.body);
      res.status(201).json(jobCandidate);
    } catch (error) {
      console.error('Job candidate creation error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: "Failed to create job candidate relationship", details: errorMsg });
    }
  });

  router.put("/api/job-candidates/:id", writeLimiter, async (req, res) => {
    try {
      const jobCandidate = await storage.candidates.updateJobCandidate(req.params.id, req.body);
      if (req.body.stage || req.body.pipelineColumnId) {
        triggerDeferredRefresh();
      }
      res.json(jobCandidate);
    } catch (error) {
      console.error('Job candidate update error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: "Failed to update job candidate", details: errorMsg });
    }
  });

  router.get("/api/jobs/:jobId/pipeline", async (req, res) => {
    try {
      const { jobId } = req.params;
      const includeCompleted = req.query.includeCompleted === 'true';
      console.log('[Pipeline Route] Fetching pipeline for job:', jobId, 'includeCompleted:', includeCompleted);

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

  router.get("/api/jobs/:jobId/pipeline-columns", async (req, res) => {
    try {
      const { jobId } = req.params;
      console.log('Fetching pipeline columns for job:', jobId);

      const job = await storage.jobs.getJob(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      const { ensureDefaultPipelineForJob } = await import('../lib/pipelineService');

      const orgId = (job as { org_id: string }).org_id;

      await ensureDefaultPipelineForJob({ 
        jobId, 
        organizationId: orgId 
      });

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

  router.get("/api/job-candidates/:jobCandidateId/notes", async (req, res) => {
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

  router.post("/api/candidate-notes", writeLimiter, async (req, res) => {
    try {
      console.log('[NOTES_API] POST /api/candidate-notes - Request received');
      console.log('[NOTES_API] Headers:', {
        'x-user-id': req.headers['x-user-id'],
        'x-org-id': req.headers['x-org-id'],
        'content-type': req.headers['content-type']
      });
      console.log('[NOTES_API] Request body:', req.body);
      
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

  router.get("/api/candidate-notes", async (req, res) => {
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

  router.get("/api/candidate-notes/batch", async (req, res) => {
    try {
      const jobCandidateIds = req.query.jobCandidateIds as string;
      
      if (!jobCandidateIds) {
        return res.status(400).json({ error: "jobCandidateIds is required" });
      }

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

  router.get("/api/pipeline-columns", async (req, res) => {
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

  router.post("/api/pipeline-columns", writeLimiter, async (req, res) => {
    try {
      const column = await storage.jobs.createPipelineColumn(req.body);
      res.status(201).json(column);
    } catch (error) {
      console.error("Error creating pipeline column:", error);
      res.status(400).json({ error: "Failed to create pipeline column" });
    }
  });

  router.get("/api/pipeline/:orgId", async (req, res) => {
    try {
      const { orgId } = req.params;
      
      const columns = await storage.jobs.getPipelineColumns(orgId);
      
      const jobCandidates = await storage.candidates.getJobCandidatesByOrg(orgId);
      
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

  router.patch("/api/applications/:applicationId/move", writeLimiter, async (req, res) => {
    try {
      const { applicationId } = req.params;
      const { columnId } = req.body;
      
      const orgId = req.headers['x-org-id'] as string || req.query.orgId as string;
      
      if (!orgId) {
        return res.status(400).json({ error: "Organization context required" });
      }

      if (!columnId) {
        return res.status(400).json({ error: "Column ID is required" });
      }

      console.info('Moving application', applicationId, 'to column', columnId);

      const { data: column, error: columnError } = await supabaseAdmin
        .from('pipeline_columns')
        .select('id, title')
        .eq('id', columnId)
        .single();

      if (columnError) {
        return res.status(400).json({ error: `Invalid column: ${columnError.message}` });
      }

      const newStage = column?.title?.toLowerCase().replace(/\s+/g, '_');

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

  router.patch("/api/jobs/:jobId/applications/:applicationId/move", writeLimiter, async (req, res) => {
    try {
      const { applicationId } = req.params;
      const { columnId } = req.body;
      
      if (!columnId) {
        return res.status(400).json({ error: "Column ID is required" });
      }

      console.info('Moving application', applicationId, 'to column', columnId);
      
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

  router.patch("/api/jobs/:jobId/applications/:applicationId/reject", writeLimiter, async (req, res) => {
    try {
      const { applicationId } = req.params;

      console.info('Rejecting application', applicationId);
      
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

  router.patch("/api/jobs/:jobId/candidates/:candidateId/move", writeLimiter, async (req, res) => {
    try {
      const { candidateId } = req.params;
      const { columnId } = req.body;
      
      if (!columnId) {
        return res.status(400).json({ error: "Column ID is required" });
      }

      console.info('Moving job candidate (legacy)', candidateId, 'to column', columnId);
      
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

  router.get("/api/job-candidates/:orgId", async (req, res) => {
    try {
      const { orgId } = req.params;
      const jobCandidates = await storage.jobs.getJobCandidatesByOrg(orgId);
      res.json(jobCandidates);
    } catch (error) {
      console.error("Error fetching job candidates:", error);
      res.status(500).json({ error: "Failed to fetch job candidates" });
    }
  });

  router.get("/api/candidates/:candidateId/applications", async (req, res) => {
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

      const formattedApplications = data.map((jc: unknown) => ({
        id: jc.id,
        jobId: jc.job_id,
        jobTitle: jc.jobs?.title || 'Unknown Job',
        clientName: 'Direct Application',
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

  router.patch("/api/job-candidates/:id/stage", writeLimiter, async (req, res) => {
    try {
      const { id } = req.params;
      const { stage } = req.body;
      
      if (!stage) {
        return res.status(400).json({ error: "Stage is required" });
      }
      
      const updatedJobCandidate = await storage.jobs.updateJobCandidateStage(id, stage);
      triggerDeferredRefresh();
      res.json(updatedJobCandidate);
    } catch (error) {
      console.error("Error updating job candidate stage:", error);
      res.status(500).json({ error: "Failed to update job candidate stage" });
    }
  });

  router.post("/api/candidates", writeLimiter, async (req, res) => {
    try {
      const createCandidateSchema = insertCandidateSchema.extend({
        orgId: z.string().min(1, "Organization ID is required")
      });
      
      const validatedData = createCandidateSchema.parse(req.body);
      
      const existingCandidate = await storage.candidates.getCandidateByEmail(validatedData.email, validatedData.orgId);
      if (existingCandidate) {
        return res.status(409).json({ 
          error: "Candidate with this email already exists in your organization" 
        });
      }
      
      const candidate = await storage.candidates.createCandidate(validatedData);
      
      if (validatedData.resumeUrl) {
        console.log(`[AUTO-PARSE] Triggering resume parsing for candidate ${candidate.id}`);
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

  return router;
}
