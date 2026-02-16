import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage/index';
import { type AuthenticatedRequest, requireAuth } from '../middleware/auth';
import { writeLimiter } from '../middleware/rate-limit';
import { insertOfferLetterSchema, type OfferLetter } from '../../shared/schema';

export function createOfferLetterRoutes() {
  const router = Router();

  const updateOfferLetterSchema = insertOfferLetterSchema.partial();

  async function getAuthOrgId(req: AuthenticatedRequest): Promise<string | null> {
    const userProfile = await storage.auth.getUserProfile(req.user?.id || '');
    return userProfile?.orgId || null;
  }

  router.get("/api/offer-letters", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const orgId = await getAuthOrgId(req);
      if (!orgId) {
        return res.status(400).json({ error: "Organization ID required" });
      }
      const offerLetters = await storage.offerLetters.getOfferLettersByOrg(orgId);
      res.json(offerLetters);
    } catch (error) {
      console.error('Error fetching offer letters:', error);
      res.status(500).json({ error: "Failed to fetch offer letters" });
    }
  });

  router.get("/api/offer-letters/by-job/:jobId", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const orgId = await getAuthOrgId(req);
      if (!orgId) return res.status(400).json({ error: "Organization ID required" });
      const offerLetters = await storage.offerLetters.getOfferLettersByJob(req.params.jobId);
      const filtered = offerLetters.filter(o => o.organizationId === orgId);
      res.json(filtered);
    } catch (error) {
      console.error('Error fetching offer letters by job:', error);
      res.status(500).json({ error: "Failed to fetch offer letters" });
    }
  });

  router.get("/api/offer-letters/by-candidate/:candidateId", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const orgId = await getAuthOrgId(req);
      if (!orgId) return res.status(400).json({ error: "Organization ID required" });
      const offerLetters = await storage.offerLetters.getOfferLettersByCandidate(req.params.candidateId);
      const filtered = offerLetters.filter(o => o.organizationId === orgId);
      res.json(filtered);
    } catch (error) {
      console.error('Error fetching offer letters by candidate:', error);
      res.status(500).json({ error: "Failed to fetch offer letters" });
    }
  });

  router.get("/api/offer-letters/by-client/:clientId", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const orgId = await getAuthOrgId(req);
      if (!orgId) return res.status(400).json({ error: "Organization ID required" });
      const offerLetters = await storage.offerLetters.getOfferLettersByClient(req.params.clientId);
      const filtered = offerLetters.filter(o => o.organizationId === orgId);
      res.json(filtered);
    } catch (error) {
      console.error('Error fetching offer letters by client:', error);
      res.status(500).json({ error: "Failed to fetch offer letters" });
    }
  });

  router.get("/api/offer-letters/accepted", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const orgId = await getAuthOrgId(req);
      if (!orgId) return res.status(400).json({ error: "Organization ID required" });
      const offerLetters = await storage.offerLetters.getAcceptedOfferLettersByOrg(orgId);
      res.json(offerLetters);
    } catch (error) {
      console.error('Error fetching accepted offer letters:', error);
      res.status(500).json({ error: "Failed to fetch accepted offer letters" });
    }
  });

  router.get("/api/offer-letters/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const orgId = await getAuthOrgId(req);
      if (!orgId) return res.status(400).json({ error: "Organization ID required" });
      const offerLetter = await storage.offerLetters.getOfferLetter(req.params.id);
      if (!offerLetter) {
        return res.status(404).json({ error: "Offer letter not found" });
      }
      if (offerLetter.organizationId !== orgId) {
        return res.status(403).json({ error: "Access denied" });
      }
      res.json(offerLetter);
    } catch (error) {
      console.error('Error fetching offer letter:', error);
      res.status(500).json({ error: "Failed to fetch offer letter" });
    }
  });

  router.post("/api/offer-letters", requireAuth, writeLimiter, async (req: AuthenticatedRequest, res) => {
    try {
      const orgId = await getAuthOrgId(req);
      if (!orgId) return res.status(400).json({ error: "Organization ID required" });
      const parsed = insertOfferLetterSchema.parse({ ...req.body, organizationId: orgId, createdBy: req.user?.id });
      const offerLetter = await storage.offerLetters.createOfferLetter(parsed);
      res.status(201).json(offerLetter);
    } catch (error) {
      console.error('Error creating offer letter:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: "Failed to create offer letter", details: errorMessage });
    }
  });

  router.put("/api/offer-letters/:id", requireAuth, writeLimiter, async (req: AuthenticatedRequest, res) => {
    try {
      const orgId = await getAuthOrgId(req);
      if (!orgId) return res.status(400).json({ error: "Organization ID required" });
      const existing = await storage.offerLetters.getOfferLetter(req.params.id);
      if (!existing) return res.status(404).json({ error: "Offer letter not found" });
      if (existing.organizationId !== orgId) return res.status(403).json({ error: "Access denied" });
      const parsed = updateOfferLetterSchema.parse(req.body);
      const offerLetter = await storage.offerLetters.updateOfferLetter(req.params.id, parsed);
      res.json(offerLetter);
    } catch (error) {
      console.error('Error updating offer letter:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: "Failed to update offer letter", details: errorMessage });
    }
  });

  router.delete("/api/offer-letters/:id", requireAuth, writeLimiter, async (req: AuthenticatedRequest, res) => {
    try {
      const orgId = await getAuthOrgId(req);
      if (!orgId) return res.status(400).json({ error: "Organization ID required" });
      const existing = await storage.offerLetters.getOfferLetter(req.params.id);
      if (!existing) return res.status(404).json({ error: "Offer letter not found" });
      if (existing.organizationId !== orgId) return res.status(403).json({ error: "Access denied" });
      await storage.offerLetters.deleteOfferLetter(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting offer letter:', error);
      res.status(400).json({ error: "Failed to delete offer letter" });
    }
  });

  router.get("/api/clients/stats/financials", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const orgId = await getAuthOrgId(req);
      if (!orgId) return res.status(400).json({ error: "Organization ID required" });

      const acceptedOffers = await storage.offerLetters.getAcceptedOfferLettersByOrg(orgId);

      const financials: Record<string, { revenue: number; grossProfit: number; placements: number }> = {};

      for (const offer of acceptedOffers) {
        if (!offer.clientId) continue;

        if (!financials[offer.clientId]) {
          financials[offer.clientId] = { revenue: 0, grossProfit: 0, placements: 0 };
        }

        const salary = parseFloat(offer.salaryAmount) || 0;
        const billRate = parseFloat(offer.billRate as string) || 0;
        const feeAmount = parseFloat(offer.feeAmount as string) || 0;
        const salaryType = offer.salaryType || 'per year';

        let annualizedSalary = salary;
        if (salaryType === 'per hour') {
          annualizedSalary = salary * 2080;
        }

        let revenue = 0;
        let profit = 0;

        if (offer.feeType === 'percentage') {
          revenue = annualizedSalary * (feeAmount / 100);
          profit = revenue;
        } else if (offer.feeType === 'flat') {
          revenue = feeAmount;
          profit = feeAmount;
        } else if (billRate > 0) {
          const annualBillRate = salaryType === 'per hour' ? billRate * 2080 : billRate;
          revenue = annualBillRate;
          profit = annualBillRate - annualizedSalary;
        }

        financials[offer.clientId].revenue += revenue;
        financials[offer.clientId].grossProfit += profit;
        financials[offer.clientId].placements += 1;
      }

      res.json(financials);
    } catch (error) {
      console.error('Error fetching client financials:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: "Failed to fetch client financials", details: errorMessage });
    }
  });

  return router;
}
