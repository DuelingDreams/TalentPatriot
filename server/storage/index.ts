// Import all domain interfaces
import type { IAuthRepository } from './auth/interface';
import type { IJobsRepository } from './jobs/interface';
import type { ICandidatesRepository } from './candidates/interface';
import type { ICommunicationsRepository } from './communications/interface';
import type { IImportsRepository } from './imports/interface';
import type { IAnalyticsRepository } from './analytics/interface';
import type { IBetaRepository } from './beta/interface';
import type { IApprovalRepository } from './approvals/interface';

// Import all domain implementations
import { AuthRepository } from './auth/repository';
import { JobsRepository } from './jobs/repository';
import { CandidatesRepository } from './candidates/repository';
import { CommunicationsRepository } from './communications/repository';
import { ImportsRepository } from './imports/repository';
import { AnalyticsRepository } from './analytics/repository';
import { BetaRepository } from './beta/repository';
import { ApprovalRepository } from './approvals/repository';

// Main storage interface aggregating all domain repositories
export interface IStorage {
  // Domain repositories will be exposed through this interface
  auth: IAuthRepository;
  jobs: IJobsRepository;
  candidates: ICandidatesRepository;
  communications: ICommunicationsRepository;
  imports: IImportsRepository;
  analytics: IAnalyticsRepository;
  beta: IBetaRepository;
  approvals: IApprovalRepository;
}

// Re-export all domain interfaces
export type { IAuthRepository } from './auth/interface';
export type { IJobsRepository } from './jobs/interface';
export type { ICandidatesRepository } from './candidates/interface';
export type { ICommunicationsRepository } from './communications/interface';
export type { IImportsRepository } from './imports/interface';
export type { IAnalyticsRepository } from './analytics/interface';
export type { IBetaRepository } from './beta/interface';
export type { IApprovalRepository } from './approvals/interface';

// Re-export all domain implementations
export { AuthRepository } from './auth/repository';
export { JobsRepository } from './jobs/repository';
export { CandidatesRepository } from './candidates/repository';
export { CommunicationsRepository } from './communications/repository';
export { ImportsRepository } from './imports/repository';
export { AnalyticsRepository } from './analytics/repository';
export { BetaRepository } from './beta/repository';
export { ApprovalRepository } from './approvals/repository';

// Main DatabaseStorage implementation
export class DatabaseStorage implements IStorage {
  public readonly auth: IAuthRepository;
  public readonly jobs: IJobsRepository;
  public readonly candidates: ICandidatesRepository;
  public readonly communications: ICommunicationsRepository;
  public readonly imports: IImportsRepository;
  public readonly analytics: IAnalyticsRepository;
  public readonly beta: IBetaRepository;
  public readonly approvals: IApprovalRepository;

  constructor() {
    this.auth = new AuthRepository();
    this.jobs = new JobsRepository();
    this.candidates = new CandidatesRepository();
    this.communications = new CommunicationsRepository();
    this.imports = new ImportsRepository();
    this.analytics = new AnalyticsRepository();
    this.beta = new BetaRepository();
    this.approvals = new ApprovalRepository();
  }
}

// Export default instance for backward compatibility during migration
export const storage = new DatabaseStorage();