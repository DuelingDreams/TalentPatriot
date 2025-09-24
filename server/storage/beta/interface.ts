import type {
  BetaApplication,
  InsertBetaApplication
} from "@shared/schema";

// Beta domain repository interface
export interface IBetaRepository {
  // Beta Applications
  getBetaApplication(id: string): Promise<BetaApplication | undefined>;
  getBetaApplications(): Promise<BetaApplication[]>;
  createBetaApplication(betaApplication: InsertBetaApplication): Promise<BetaApplication>;
  updateBetaApplication(id: string, betaApplication: Partial<InsertBetaApplication>): Promise<BetaApplication>;
  deleteBetaApplication(id: string): Promise<void>;
}