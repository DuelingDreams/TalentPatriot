import type {
  Client,
  Job,
  PipelineColumn,
  InsertClient,
  InsertJob,
  InsertPipelineColumn
} from "@shared/schema";

// Additional types for lib/jobService compatibility
export interface UserContext {
  userId: string;
  orgId: string;
}

export interface ApplicantData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  source?: string; // How did you hear about us?
  coverLetter?: string;
  resumeUrl?: string;
}

export interface ApplicationResult {
  candidateId: string;
  applicationId: string;
  success: boolean;
}

export interface PublishResult {
  publicUrl: string;
  job: {
    id: string;
    slug: string | null;
    status: string;
    published_at: string | null;
  };
}

// Jobs domain repository interface
export interface IJobsRepository {
  // Clients
  getClient(id: string): Promise<Client | undefined>;
  getClients(): Promise<Client[]>;
  getClientsByOrg(orgId: string): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: Partial<InsertClient>): Promise<Client>;
  deleteClient(id: string): Promise<void>;
  searchClients(searchTerm: string, orgId: string): Promise<Client[]>;
  
  // Jobs - Basic CRUD
  getJob(id: string): Promise<Job | undefined>;
  getJobs(): Promise<Job[]>;
  getJobsByOrg(orgId: string): Promise<Job[]>;
  getJobsByClient(clientId: string): Promise<Job[]>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: string, data: Partial<InsertJob>): Promise<Job>;
  deleteJob(id: string): Promise<void>;
  searchJobs(searchTerm: string, orgId: string): Promise<Job[]>;
  
  // Jobs - Advanced operations (from lib/jobService)
  createJobWithContext(data: {
    title: string;
    description?: string;
    clientId?: string;
    orgId: string;
    location?: string;
    jobType?: string;
    remoteOption?: string;
    salaryRange?: string;
    experienceLevel?: string;
    postingTargets?: string[];
    autoPost?: boolean;
  }, userContext: UserContext): Promise<Job>;
  publishJob(jobId: string, userContext?: UserContext): Promise<PublishResult>;
  applyToJob(params: { jobId: string; applicant: ApplicantData }, requestContext?: { orgId?: string }): Promise<ApplicationResult>;
  
  // Public job access (no authentication required)
  getPublicJobs(orgId?: string): Promise<Job[]>;
  getPublicJobsByOrg(orgId: string): Promise<Job[]>;
  getPublicJob(id: string): Promise<Job | undefined>;
  
  // Job Candidates (from lib/jobService - candidate management)
  getJobCandidatesByOrg(orgId: string): Promise<any[]>;
  updateJobCandidateStage(jobCandidateId: string, newStage: string): Promise<any>;
  
  // Pipeline Columns
  getPipelineColumns(orgId: string): Promise<PipelineColumn[]>;
  createPipelineColumn(column: InsertPipelineColumn): Promise<PipelineColumn>;
  
  // Pipeline data fetch with auto org-lookup and default column creation
  getJobPipelineDataOptimized(jobId: string, includeCompleted?: boolean): Promise<{
    columns: Array<{ id: string; title: string; position: string }>;
    applications: Array<{
      id: string;
      jobId: string;
      candidateId: string;
      columnId: string;
      status: string;
      appliedAt: string;
      candidate: {
        id: string;
        name: string;
        email: string;
        phone: string | null;
        resumeUrl: string | null;
      } | null;
    }>;
  } | null>;
  
  // Advanced search
  searchJobsAdvanced(filters: {
    orgId: string;
    searchTerm?: string;
    status?: string;
    clientId?: string;
    experienceLevel?: string;
    remoteOption?: string;
  }): Promise<Job[]>;
  
  // Paginated methods
  getJobsPaginated(params: {
    orgId: string;
    limit?: number;
    cursor?: string;
    fields?: string[];
    status?: string;
    jobType?: string;
    search?: string;
  }): Promise<{
    data: Job[];
    pagination: {
      hasMore: boolean;
      nextCursor?: string;
      totalCount?: number;
      limit: number;
    };
  }>;
}