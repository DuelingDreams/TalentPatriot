import type {
  Client,
  Job,
  PipelineColumn,
  InsertClient,
  InsertJob,
  InsertPipelineColumn
} from "@shared/schema";

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
  
  // Jobs
  getJob(id: string): Promise<Job | undefined>;
  getJobs(): Promise<Job[]>;
  getJobsByOrg(orgId: string): Promise<Job[]>;
  getJobsByClient(clientId: string): Promise<Job[]>;
  createJob(job: InsertJob): Promise<Job>;
  publishJob(jobId: string): Promise<Job>;
  updateJob(id: string, data: Partial<InsertJob>): Promise<Job>;
  deleteJob(id: string): Promise<void>;
  searchJobs(searchTerm: string, orgId: string): Promise<Job[]>;
  
  // Public job access (no authentication required)
  getPublicJobs(): Promise<Job[]>;
  getPublicJobsByOrg(orgId: string): Promise<Job[]>;
  getPublicJob(id: string): Promise<Job | undefined>;
  
  // Pipeline Columns
  getPipelineColumns(orgId: string): Promise<PipelineColumn[]>;
  createPipelineColumn(column: InsertPipelineColumn): Promise<PipelineColumn>;
  
  // Job Pipeline Data (unified fetch for consistency)
  getJobPipelineData(jobId: string, orgId: string, includeCompleted?: boolean): Promise<{
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
  }>;
  
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