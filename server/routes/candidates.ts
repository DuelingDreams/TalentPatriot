import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage/index';
import { supabase } from '../lib/supabase';
import { supabaseAdmin } from '../middleware/auth';
import { writeLimiter } from '../middleware/rate-limit';
import { documentUpload, generateETag, setResponseCaching } from './utils';
import { 
  insertClientSubmissionSchema,
  insertCandidateDocumentSchema,
  candidatesQuerySchema,
  candidateFieldsPresets,
  type PaginatedCandidates,
  type Candidate,
  type ClientSubmission,
  type CandidateDocument
} from '../../shared/schema';

export function createCandidateRoutes() {
  const router = Router();

  router.get("/api/candidates", async (req, res) => {
    try {
      const orgId = req.headers['x-org-id'] as string;
      
      if (!orgId) {
        return res.status(400).json({ error: "Organization context required" });
      }
      
      console.log(`[API] Fetching candidates for orgId: ${orgId}`);
      console.log(`[API] Headers received:`, {
        'x-org-id': req.headers['x-org-id'],
        'x-user-id': req.headers['x-user-id']
      });

      const queryWithOrgId = { ...req.query, orgId };
      
      const isPaginatedRequest = 'limit' in req.query || 'cursor' in req.query || 'include' in req.query;
      
      if (isPaginatedRequest) {
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

        const etag = generateETag(result);
        
        const clientETag = req.headers['if-none-match'];
        if (clientETag && clientETag === `"${etag}"`) {
          return res.status(304).end();
        }

        setResponseCaching(res, {
          etag,
          cacheControl: 'private, max-age=120, must-revalidate',
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
        const candidates = await storage.candidates.getCandidatesByOrg(orgId);
        
        const etag = generateETag(candidates);
        
        const clientETag = req.headers['if-none-match'];
        if (clientETag && clientETag === `"${etag}"`) {
          return res.status(304).end();
        }

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

  router.get("/api/candidates/:id", async (req, res) => {
    try {
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
      
      if (candidate.orgId && candidate.orgId !== orgId) {
        console.log(`[API] Candidate ${req.params.id} belongs to different org: ${candidate.orgId} vs ${orgId}`);
        return res.status(404).json({ error: "Candidate not found" });
      }
      
      console.log(`[API] Found candidate: ${candidate.name} (orgId: ${candidate.orgId})`);
      
      if (!candidate.orgId || candidate.orgId === null) {
        console.log(`[API] Updating candidate ${candidate.id} with orgId: ${orgId}`);
        try {
          const { data, error } = await supabaseAdmin
            .from('candidates')
            .update({ org_id: orgId })
            .eq('id', candidate.id)
            .select()
            .single();
          
          if (error) {
            console.warn(`[API] Database update error:`, error);
          } else {
            candidate.orgId = orgId;
            console.log(`[API] Successfully updated candidate ${candidate.id} with orgId: ${orgId}`);
          }
        } catch (updateError) {
          console.warn(`[API] Failed to update candidate orgId:`, updateError);
        }
      }
      
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

  router.put("/api/candidates/:id", writeLimiter, async (req, res) => {
    try {
      const candidate = await storage.candidates.updateCandidate(req.params.id, req.body);
      res.json(candidate);
    } catch (error) {
      console.error('Candidate update error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: "Failed to update candidate", details: errorMessage });
    }
  });

  router.get("/api/candidates/:id/proficiency", async (req, res) => {
    try {
      const { id: candidateId } = req.params;
      const orgId = req.headers['x-org-id'] as string;
      
      if (!orgId) {
        return res.status(400).json({ error: "Organization ID is required" });
      }

      const candidate = await storage.candidates.getCandidate(candidateId);
      if (!candidate) {
        return res.status(404).json({ error: "Candidate not found" });
      }
      
      if (!candidate.orgId) {
        candidate.orgId = orgId;
      }
      
      if (candidate.orgId !== orgId) {
        return res.status(404).json({ error: "Candidate not found" });
      }

      try {
        const { data, error } = await supabase
          .from('candidates')
          .select('skill_levels')
          .eq('id', candidateId)
          .single();

        if (error) {
          console.warn('Proficiency query error:', error.code, error.message);
          return res.json({});
        }

        res.json(data?.skill_levels || {});
      } catch (error) {
        console.warn('Proficiency fetch error:', error);
        res.json({});
      }
    } catch (error) {
      console.error('Proficiency fetch error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: "Failed to fetch proficiency data", details: errorMessage });
    }
  });

  router.put("/api/candidates/:id/proficiency", writeLimiter, async (req, res) => {
    try {
      const { id: candidateId } = req.params;
      const proficiencyMap = req.body;
      const orgId = req.headers['x-org-id'] as string;
      
      if (!orgId) {
        return res.status(400).json({ error: "Organization ID is required" });
      }

      const candidate = await storage.candidates.getCandidate(candidateId);
      if (!candidate) {
        return res.status(404).json({ error: "Candidate not found" });
      }
      
      if (!candidate.orgId) {
        candidate.orgId = orgId;
      }
      
      if (candidate.orgId !== orgId) {
        console.warn(`[PROFICIENCY-PUT] OrgId mismatch: candidate.orgId=${candidate.orgId}, request.orgId=${orgId}`);
        return res.status(404).json({ error: "Candidate not found" });
      }

      const { error } = await supabase
        .from('candidates')
        .update({ 
          skill_levels: proficiencyMap,
          updated_at: new Date().toISOString()
        })
        .eq('id', candidateId);

      if (error) {
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

  router.get("/api/candidates/:id/skills", async (req, res) => {
    try {
      const { id: candidateId } = req.params;
      const orgId = req.headers['x-org-id'] as string;
      
      if (!orgId) {
        return res.status(400).json({ error: "Organization ID is required" });
      }

      const candidate = await storage.candidates.getCandidate(candidateId);
      if (!candidate) {
        return res.status(404).json({ error: "Candidate not found" });
      }
      
      if (!candidate.orgId) {
        candidate.orgId = orgId;
      }
      
      if (candidate.orgId !== orgId) {
        console.warn(`[SKILLS-GET] OrgId mismatch: candidate.orgId=${candidate.orgId}, request.orgId=${orgId}`);
        return res.status(404).json({ error: "Candidate not found" });
      }

      const { data, error } = await supabase
        .from('candidates')
        .select('skills')
        .eq('id', candidateId)
        .single();

      if (error) {
        console.warn('Skills query error:', error.code, error.message);
        return res.json([]);
      }

      res.json(data?.skills || []);
    } catch (error) {
      console.error('Skills fetch error:', error);
      res.json([]);
    }
  });

  router.put("/api/candidates/:id/skills", writeLimiter, async (req, res) => {
    try {
      const { id: candidateId } = req.params;
      const skills = req.body.skills || req.body;
      const orgId = req.headers['x-org-id'] as string;
      
      if (!orgId) {
        return res.status(400).json({ error: "Organization ID is required" });
      }

      const candidate = await storage.candidates.getCandidate(candidateId);
      if (!candidate) {
        return res.status(404).json({ error: "Candidate not found" });
      }
      
      if (!candidate.orgId) {
        candidate.orgId = orgId;
      }
      
      if (candidate.orgId !== orgId) {
        console.warn(`[SKILLS-PUT] OrgId mismatch: candidate.orgId=${candidate.orgId}, request.orgId=${orgId}`);
        return res.status(404).json({ error: "Candidate not found" });
      }

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
  router.get("/api/candidates/:candidateId/submissions", async (req, res) => {
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

  router.post("/api/candidates/:candidateId/submissions", writeLimiter, async (req, res) => {
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

  router.patch("/api/candidates/:candidateId/submissions/:id", writeLimiter, async (req, res) => {
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

  router.delete("/api/candidates/:candidateId/submissions/:id", writeLimiter, async (req, res) => {
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
  router.get("/api/candidates/:candidateId/documents", async (req, res) => {
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

  router.post("/api/candidates/:candidateId/documents", writeLimiter, documentUpload.single('file'), async (req, res) => {
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
        await supabase.storage.from('resumes').remove([storagePath]);
        throw error;
      }

      const resumeMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      const isResume = resumeMimeTypes.includes(file.mimetype);
      
      if (isResume) {
        const { error: updateError } = await supabase
          .from('candidates')
          .update({ resume_url: storagePath })
          .eq('id', candidateId);

        if (updateError) {
          console.warn('Failed to update candidate resume_url (non-critical):', updateError);
        } else {
          console.log(`[DOCUMENT UPLOAD] Updated resume_url for candidate ${candidateId}`);
          
          const { DatabaseStorage: LegacyStorage } = await import('../storage.legacy');
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

  router.delete("/api/candidates/:candidateId/documents/:id", writeLimiter, async (req, res) => {
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

      if (existing.file_url && !existing.file_url.startsWith('http')) {
        const { error: storageError } = await supabase.storage
          .from('resumes')
          .remove([existing.file_url]);
        
        if (storageError) {
          console.error('Error deleting file from storage:', storageError);
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
  
  router.get("/api/candidates/:candidateId/documents/:id/url", async (req, res) => {
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

      if (doc.file_url.startsWith('http')) {
        return res.json({ url: doc.file_url });
      }

      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('resumes')
        .createSignedUrl(doc.file_url, 3600);

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

  return router;
}
