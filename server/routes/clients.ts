import { Router } from 'express';
import { storage } from '../storage/index';
import { writeLimiter } from '../middleware/rate-limit';
import { supabase } from '../lib/supabase';

export function createClientRoutes() {
  const router = Router();

  router.get("/api/clients", async (req, res) => {
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

  router.get("/api/clients/:id", async (req, res) => {
    try {
      const orgId = req.query.orgId as string;
      const client = await storage.jobs.getClient(req.params.id);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      if (orgId && client.orgId !== orgId) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch client" });
    }
  });

  router.post("/api/clients", writeLimiter, async (req, res) => {
    try {
      const client = await storage.jobs.createClient(req.body);
      res.status(201).json(client);
    } catch (error) {
      console.error('Client creation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: "Failed to create client", details: errorMessage });
    }
  });

  router.put("/api/clients/:id", writeLimiter, async (req, res) => {
    try {
      const client = await storage.jobs.updateClient(req.params.id, req.body);
      res.json(client);
    } catch (error) {
      res.status(400).json({ error: "Failed to update client" });
    }
  });

  router.delete("/api/clients/:id", writeLimiter, async (req, res) => {
    try {
      await storage.jobs.deleteClient(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: "Failed to delete client" });
    }
  });

  router.get("/api/clients/stats/placements", async (req, res) => {
    try {
      const orgId = req.query.orgId as string || req.headers['x-org-id'] as string;
      if (!orgId) {
        return res.status(400).json({ error: "Organization ID is required" });
      }

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

      const jobIds = jobsData.map(j => j.id);
      
      const { data: hiredData, error: hiredError } = await supabase
        .from('job_candidate')
        .select('job_id')
        .in('job_id', jobIds)
        .eq('stage', 'hired');

      if (hiredError) {
        console.error('Error fetching hired candidates:', hiredError);
        throw hiredError;
      }

      const jobToClient: Record<string, string> = {};
      jobsData.forEach(job => {
        if (job.client_id) {
          jobToClient[job.id] = job.client_id;
        }
      });

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

  router.get("/api/clients/:clientId/placements", async (req, res) => {
    try {
      const { clientId } = req.params;
      const orgId = req.query.orgId as string || req.headers['x-org-id'] as string;
      
      if (!orgId) {
        return res.status(400).json({ error: "Organization ID is required" });
      }

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

  return router;
}
