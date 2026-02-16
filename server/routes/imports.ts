import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage/index';
import { type AuthenticatedRequest, requireAuth } from '../middleware/auth';
import { writeLimiter } from '../middleware/rate-limit';
import { upload } from '../middleware/upload';
import { ImportService } from '../lib/importService';
import { insertDataImportSchema, insertImportRecordSchema, type DataImport, type ImportRecord } from '../../shared/schema';

export function createImportRoutes() {
  const router = Router();

  router.get("/api/imports", requireAuth, async (req: AuthenticatedRequest, res) => {
    console.info('[API]', req.method, req.url);
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

      const imports = await storage.imports.getDataImports(orgId);
      
      console.info('[API] GET /api/imports →', { success: true, count: imports.length });
      res.json(imports);
    } catch (error) {
      console.error('Import list error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to fetch imports', details: errorMessage });
    }
  });

  router.get("/api/imports/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    console.info('[API]', req.method, req.url);
    try {
      const { id } = req.params;
      const userProfile = await storage.auth.getUserProfile(req.user?.id || '');
      
      if (!userProfile?.orgId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      const userOrgs = await storage.auth.getUserOrganizations(req.user?.id, userProfile.orgId);
      const userOrg = userOrgs.length > 0 ? userOrgs[0] : null;
      if (!userOrg || (userOrg.role !== 'admin' && userOrg.role !== 'owner')) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const importData = await storage.imports.getDataImport(id);
      if (!importData) {
        return res.status(404).json({ error: 'Import not found' });
      }

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

  router.post("/api/imports", requireAuth, writeLimiter, upload.single('file'), async (req: AuthenticatedRequest, res) => {
    console.info('[API]', req.method, req.url);
    try {
      const userProfile = await storage.auth.getUserProfile(req.user?.id || '');
      if (!userProfile?.orgId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      const userOrgs = await storage.auth.getUserOrganizations(req.user?.id, userProfile.orgId);
      const userOrg = userOrgs.length > 0 ? userOrgs[0] : null;
      if (!userOrg || (userOrg.role !== 'admin' && userOrg.role !== 'owner')) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: 'File is required' });
      }

      const importType = req.body.importType || 
        (file.originalname.toLowerCase().includes('candidate') ? 'candidates' : 'jobs');
      
      if (!['candidates', 'jobs'].includes(importType)) {
        return res.status(400).json({ error: 'Invalid import type. Must be "candidates" or "jobs"' });
      }

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

  router.patch("/api/imports/:id", requireAuth, writeLimiter, async (req: AuthenticatedRequest, res) => {
    console.info('[API]', req.method, req.url);
    try {
      const { id } = req.params;
      const userProfile = await storage.auth.getUserProfile(req.user?.id || '');
      
      if (!userProfile?.orgId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      const userOrgs = await storage.auth.getUserOrganizations(req.user?.id, userProfile.orgId);
      const userOrg = userOrgs.length > 0 ? userOrgs[0] : null;
      if (!userOrg || (userOrg.role !== 'admin' && userOrg.role !== 'owner')) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const existingImport = await storage.imports.getDataImport(id);
      if (!existingImport) {
        return res.status(404).json({ error: 'Import not found' });
      }

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

  router.delete("/api/imports/:id", requireAuth, writeLimiter, async (req: AuthenticatedRequest, res) => {
    console.info('[API]', req.method, req.url);
    try {
      const { id } = req.params;
      const userProfile = await storage.auth.getUserProfile(req.user?.id || '');
      
      if (!userProfile?.orgId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      const userOrgs = await storage.auth.getUserOrganizations(req.user?.id, userProfile.orgId);
      const userOrg = userOrgs.length > 0 ? userOrgs[0] : null;
      if (!userOrg || (userOrg.role !== 'admin' && userOrg.role !== 'owner')) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const existingImport = await storage.imports.getDataImport(id);
      if (!existingImport) {
        return res.status(404).json({ error: 'Import not found' });
      }

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

  router.get("/api/imports/:id/records", requireAuth, async (req: AuthenticatedRequest, res) => {
    console.info('[API]', req.method, req.url);
    try {
      const { id } = req.params;
      const { status } = req.query;
      const userProfile = await storage.auth.getUserProfile(req.user?.id || '');
      
      if (!userProfile?.orgId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      const userOrgs = await storage.auth.getUserOrganizations(req.user?.id, userProfile.orgId);
      const userOrg = userOrgs.length > 0 ? userOrgs[0] : null;
      if (!userOrg || (userOrg.role !== 'admin' && userOrg.role !== 'owner')) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const existingImport = await storage.imports.getDataImport(id);
      if (!existingImport) {
        return res.status(404).json({ error: 'Import not found' });
      }

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

  router.post("/api/imports/:id/records", requireAuth, writeLimiter, async (req: AuthenticatedRequest, res) => {
    console.info('[API]', req.method, req.url);
    try {
      const { id } = req.params;
      const userProfile = await storage.auth.getUserProfile(req.user?.id || '');
      
      if (!userProfile?.orgId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      const userOrgs = await storage.auth.getUserOrganizations(req.user?.id, userProfile.orgId);
      const userOrg = userOrgs.length > 0 ? userOrgs[0] : null;
      if (!userOrg || (userOrg.role !== 'admin' && userOrg.role !== 'owner')) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const existingImport = await storage.imports.getDataImport(id);
      if (!existingImport) {
        return res.status(404).json({ error: 'Import not found' });
      }

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

  router.patch("/api/imports/:importId/records/:recordId", requireAuth, writeLimiter, async (req: AuthenticatedRequest, res) => {
    console.info('[API]', req.method, req.url);
    try {
      const { importId, recordId } = req.params;
      const userProfile = await storage.auth.getUserProfile(req.user?.id || '');
      
      if (!userProfile?.orgId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      const userOrgs = await storage.auth.getUserOrganizations(req.user?.id, userProfile.orgId);
      const userOrg = userOrgs.length > 0 ? userOrgs[0] : null;
      if (!userOrg || (userOrg.role !== 'admin' && userOrg.role !== 'owner')) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const existingImport = await storage.imports.getDataImport(importId);
      if (!existingImport) {
        return res.status(404).json({ error: 'Import not found' });
      }

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

  return router;
}
