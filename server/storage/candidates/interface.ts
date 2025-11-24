import type {
  Candidate,
  JobCandidate,
  CandidateNotes,
  Interview,
  InsertCandidate,
  InsertJobCandidate,
  InsertCandidateNotes,
  InsertInterview
} from "@shared/schema";

// Pipeline candidate return type
export type PipelineCandidate = {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  jobId: string;
  columnId: string;
  status: string;
  appliedAt: Date;
  resume?: {
    url: string;
    skills?: string[];
    experienceLevel?: string;
  };
};

// Candidates domain repository interface
export interface ICandidatesRepository {
  // Candidates
  getCandidate(id: string): Promise<Candidate | undefined>;
  getCandidates(): Promise<Candidate[]>;
  getCandidatesByOrg(orgId: string): Promise<Candidate[]>;
  getCandidateByEmail(email: string, orgId: string): Promise<Candidate | undefined>;
  createCandidate(candidate: InsertCandidate): Promise<Candidate>;
  updateCandidate(id: string, candidate: Partial<InsertCandidate>): Promise<Candidate>;
  deleteCandidate(id: string): Promise<void>;
  searchCandidates(searchTerm: string, orgId: string): Promise<Candidate[]>;
  
  // Job-Candidate relationships
  getJobCandidate(id: string): Promise<JobCandidate | undefined>;
  getJobCandidatesByJob(jobId: string): Promise<JobCandidate[]>;
  getJobCandidatesByCandidate(candidateId: string): Promise<JobCandidate[]>;
  getJobCandidatesByOrg(orgId: string): Promise<JobCandidate[]>;
  createJobCandidate(jobCandidate: InsertJobCandidate & { pipelineColumnId?: string }): Promise<JobCandidate>;
  updateJobCandidate(id: string, jobCandidate: Partial<InsertJobCandidate>): Promise<JobCandidate>;
  moveJobCandidate(jobCandidateId: string, newColumnId: string): Promise<JobCandidate>;
  rejectJobCandidate(jobCandidateId: string): Promise<JobCandidate>;
  getJobCandidateByJobAndCandidate(jobId: string, candidateId: string): Promise<JobCandidate | undefined>;
  
  // Candidate Notes
  getCandidateNotes(jobCandidateId: string): Promise<CandidateNotes[]>;
  getBatchedCandidateNotes(jobCandidateIds: string[]): Promise<Record<string, CandidateNotes[]>>;
  createCandidateNote(note: InsertCandidateNotes): Promise<CandidateNotes>;
  
  // Interviews
  getInterview(id: string): Promise<Interview | undefined>;
  getInterviews(): Promise<Interview[]>;
  getInterviewsByJobCandidate(jobCandidateId: string): Promise<Interview[]>;
  getInterviewsByDateRange(startDate: Date, endDate: Date): Promise<Interview[]>;
  createInterview(interview: InsertInterview): Promise<Interview>;
  updateInterview(id: string, interview: Partial<InsertInterview>): Promise<Interview>;
  deleteInterview(id: string): Promise<void>;
  
  // Pipeline operations
  getPipelineCandidates(jobId: string, orgId: string): Promise<PipelineCandidate[]>;
  
  // Job applications
  submitJobApplication(applicationData: {
    jobId: string;
    name: string;
    email: string;
    phone?: string;
    resumeUrl?: string;
  }): Promise<{ candidateId: string; applicationId: string }>;
  
  // Enhanced search capabilities
  searchCandidatesAdvanced(filters: {
    orgId: string;
    searchTerm?: string;
    jobId?: string;
    stage?: string;
    status?: string;
    skills?: string[];
    dateRange?: { start: Date; end: Date };
  }): Promise<Candidate[]>;
  
  // Resume parsing functionality
  parseAndUpdateCandidate(candidateId: string, resumeText?: string): Promise<Candidate>;
  parseAndUpdateCandidateFromStorage(candidateId: string, storagePath: string): Promise<Candidate>;
  searchCandidatesBySkills(orgId: string, skills: string[]): Promise<Candidate[]>;
  
  // Paginated methods
  getCandidatesPaginated(params: {
    orgId: string;
    limit?: number;
    cursor?: string;
    fields?: string[];
    jobId?: string;
    stage?: string;
    status?: string;
    search?: string;
  }): Promise<{
    data: Candidate[];
    pagination: {
      hasMore: boolean;
      nextCursor?: string;
      totalCount?: number;
      limit: number;
    };
  }>;
}