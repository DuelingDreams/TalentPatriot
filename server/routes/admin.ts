import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage/index';
import { supabase } from '../lib/supabase';
import { writeLimiter } from '../middleware/rate-limit';
import { type AuthenticatedRequest, requireAuth } from '../middleware/auth';

export function createAdminRoutes() {
  const router = Router();

  router.get("/api/admin/inbox", requireAuth, async (req: AuthenticatedRequest, res) => {
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

  router.get("/api/admin/inbox/count", requireAuth, async (req: AuthenticatedRequest, res) => {
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

  const resolveApprovalSchema = z.object({
    status: z.enum(['approved', 'rejected']),
    resolutionNotes: z.string().optional(),
  });

  router.patch("/api/admin/inbox/:id", requireAuth, writeLimiter, async (req: AuthenticatedRequest, res) => {
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

      if (validatedData.status === 'approved') {
        const request = await storage.approvals.getApprovalRequest(id);
        if (request) {
          if (request.requestType === 'careers_publish') {
            await supabase
              .from('organizations')
              .update({ 
                careers_status: 'published',
                published_at: new Date().toISOString()
              })
              .eq('id', request.orgId);
          } else if (request.requestType === 'admin_claim') {
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

  const createApprovalSchema = z.object({
    requestType: z.enum(['onboarding_complete', 'careers_publish', 'admin_claim', 'seat_upgrade', 'team_invite']),
    targetTable: z.string(),
    targetId: z.string().uuid(),
    title: z.string(),
    description: z.string().optional(),
    requestedPayload: z.record(z.any()).optional(),
  });

  router.post("/api/admin/inbox", requireAuth, writeLimiter, async (req: AuthenticatedRequest, res) => {
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

  return router;
}
