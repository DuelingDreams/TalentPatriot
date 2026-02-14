import type { OfferLetter, InsertOfferLetter } from "@shared/schema";

export interface IOfferLettersRepository {
  getOfferLetter(id: string): Promise<OfferLetter | undefined>;
  getOfferLettersByOrg(orgId: string): Promise<OfferLetter[]>;
  getOfferLettersByJob(jobId: string): Promise<OfferLetter[]>;
  getOfferLettersByCandidate(candidateId: string): Promise<OfferLetter[]>;
  getOfferLettersByClient(clientId: string): Promise<OfferLetter[]>;
  getAcceptedOfferLettersByOrg(orgId: string): Promise<OfferLetter[]>;
  createOfferLetter(data: InsertOfferLetter): Promise<OfferLetter>;
  updateOfferLetter(id: string, data: Partial<InsertOfferLetter>): Promise<OfferLetter>;
  deleteOfferLetter(id: string): Promise<void>;
}
