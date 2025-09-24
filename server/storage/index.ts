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
}

// Re-export all domain interfaces
export type { IAuthRepository } from './auth/interface';
export type { IJobsRepository } from './jobs/interface';
export type { ICandidatesRepository } from './candidates/interface';
export type { ICommunicationsRepository } from './communications/interface';
export type { IImportsRepository } from './imports/interface';
export type { IAnalyticsRepository } from './analytics/interface';
export type { IBetaRepository } from './beta/interface';

// Re-export all domain implementations
export { AuthRepository } from './auth/repository';
export { JobsRepository } from './jobs/repository';
export { CandidatesRepository } from './candidates/repository';
export { CommunicationsRepository } from './communications/repository';
export { ImportsRepository } from './imports/repository';
export { AnalyticsRepository } from './analytics/repository';
export { BetaRepository } from './beta/repository';

// Main DatabaseStorage implementation
export class DatabaseStorage implements IStorage {
  public readonly auth: IAuthRepository;
  public readonly jobs: IJobsRepository;
  public readonly candidates: ICandidatesRepository;
  public readonly communications: ICommunicationsRepository;
  public readonly imports: IImportsRepository;
  public readonly analytics: IAnalyticsRepository;
  public readonly beta: IBetaRepository;

  constructor() {
    this.auth = new AuthRepository();
    this.jobs = new JobsRepository();
    this.candidates = new CandidatesRepository();
    this.communications = new CommunicationsRepository();
    this.imports = new ImportsRepository();
    this.analytics = new AnalyticsRepository();
    this.beta = new BetaRepository();
  }
}

// Export default instance for backward compatibility during migration
export const storage = new DatabaseStorage();