import { 
  clients, 
  jobs, 
  candidates, 
  jobCandidate, 
  candidateNotes,
  type Client, 
  type Job, 
  type Candidate, 
  type JobCandidate, 
  type CandidateNotes,
  type InsertClient,
  type InsertJob,
  type InsertCandidate,
  type InsertJobCandidate,
  type InsertCandidateNotes
} from "@shared/schema";

// Storage interface for ATS system
export interface IStorage {
  // Clients
  getClient(id: string): Promise<Client | undefined>;
  getClients(): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: Partial<InsertClient>): Promise<Client>;
  deleteClient(id: string): Promise<void>;
  
  // Jobs
  getJob(id: string): Promise<Job | undefined>;
  getJobs(): Promise<Job[]>;
  getJobsByClient(clientId: string): Promise<Job[]>;
  createJob(job: InsertJob): Promise<Job>;
  
  // Candidates
  getCandidate(id: string): Promise<Candidate | undefined>;
  getCandidates(): Promise<Candidate[]>;
  createCandidate(candidate: InsertCandidate): Promise<Candidate>;
  
  // Job-Candidate relationships
  getJobCandidate(id: string): Promise<JobCandidate | undefined>;
  getJobCandidatesByJob(jobId: string): Promise<JobCandidate[]>;
  getJobCandidatesByCandidate(candidateId: string): Promise<JobCandidate[]>;
  createJobCandidate(jobCandidate: InsertJobCandidate): Promise<JobCandidate>;
  
  // Candidate Notes
  getCandidateNotes(jobCandidateId: string): Promise<CandidateNotes[]>;
  createCandidateNote(note: InsertCandidateNotes): Promise<CandidateNotes>;
}

export class MemStorage implements IStorage {
  private clients: Map<string, Client>;
  private jobs: Map<string, Job>;
  private candidates: Map<string, Candidate>;
  private jobCandidates: Map<string, JobCandidate>;
  private candidateNotes: Map<string, CandidateNotes>;

  constructor() {
    this.clients = new Map();
    this.jobs = new Map();
    this.candidates = new Map();
    this.jobCandidates = new Map();
    this.candidateNotes = new Map();
  }

  // Clients
  async getClient(id: string): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async getClients(): Promise<Client[]> {
    return Array.from(this.clients.values());
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const id = crypto.randomUUID();
    const now = new Date();
    const client: Client = { 
      ...insertClient,
      industry: insertClient.industry ?? null,
      location: insertClient.location ?? null,
      website: insertClient.website ?? null,
      contactName: insertClient.contactName ?? null,
      contactEmail: insertClient.contactEmail ?? null,
      contactPhone: insertClient.contactPhone ?? null,
      notes: insertClient.notes ?? null,
      id, 
      createdAt: now,
      updatedAt: now
    };
    this.clients.set(id, client);
    return client;
  }

  async updateClient(id: string, updateData: Partial<InsertClient>): Promise<Client> {
    const existingClient = this.clients.get(id);
    if (!existingClient) {
      throw new Error(`Client with id ${id} not found`);
    }
    
    const updatedClient: Client = {
      ...existingClient,
      ...updateData,
      industry: updateData.industry ?? existingClient.industry,
      location: updateData.location ?? existingClient.location,
      website: updateData.website ?? existingClient.website,
      contactName: updateData.contactName ?? existingClient.contactName,
      contactEmail: updateData.contactEmail ?? existingClient.contactEmail,
      contactPhone: updateData.contactPhone ?? existingClient.contactPhone,
      notes: updateData.notes ?? existingClient.notes,
      updatedAt: new Date()
    };
    
    this.clients.set(id, updatedClient);
    return updatedClient;
  }

  async deleteClient(id: string): Promise<void> {
    if (!this.clients.has(id)) {
      throw new Error(`Client with id ${id} not found`);
    }
    this.clients.delete(id);
  }

  // Jobs
  async getJob(id: string): Promise<Job | undefined> {
    return this.jobs.get(id);
  }

  async getJobs(): Promise<Job[]> {
    return Array.from(this.jobs.values());
  }

  async getJobsByClient(clientId: string): Promise<Job[]> {
    return Array.from(this.jobs.values()).filter(job => job.clientId === clientId);
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const id = crypto.randomUUID();
    const job: Job = { 
      ...insertJob,
      status: insertJob.status ?? 'open',
      description: insertJob.description ?? null,
      id, 
      createdAt: new Date() 
    };
    this.jobs.set(id, job);
    return job;
  }

  // Candidates
  async getCandidate(id: string): Promise<Candidate | undefined> {
    return this.candidates.get(id);
  }

  async getCandidates(): Promise<Candidate[]> {
    return Array.from(this.candidates.values());
  }

  async createCandidate(insertCandidate: InsertCandidate): Promise<Candidate> {
    const id = crypto.randomUUID();
    const candidate: Candidate = { 
      ...insertCandidate,
      phone: insertCandidate.phone ?? null,
      resumeUrl: insertCandidate.resumeUrl ?? null,
      id, 
      createdAt: new Date() 
    };
    this.candidates.set(id, candidate);
    return candidate;
  }

  // Job-Candidate relationships
  async getJobCandidate(id: string): Promise<JobCandidate | undefined> {
    return this.jobCandidates.get(id);
  }

  async getJobCandidatesByJob(jobId: string): Promise<JobCandidate[]> {
    return Array.from(this.jobCandidates.values()).filter(jc => jc.jobId === jobId);
  }

  async getJobCandidatesByCandidate(candidateId: string): Promise<JobCandidate[]> {
    return Array.from(this.jobCandidates.values()).filter(jc => jc.candidateId === candidateId);
  }

  async createJobCandidate(insertJobCandidate: InsertJobCandidate): Promise<JobCandidate> {
    const id = crypto.randomUUID();
    const jobCandidate: JobCandidate = { 
      ...insertJobCandidate,
      stage: insertJobCandidate.stage ?? 'applied',
      notes: insertJobCandidate.notes ?? null,
      assignedTo: insertJobCandidate.assignedTo ?? null,
      id, 
      updatedAt: new Date() 
    };
    this.jobCandidates.set(id, jobCandidate);
    return jobCandidate;
  }

  // Candidate Notes
  async getCandidateNotes(jobCandidateId: string): Promise<CandidateNotes[]> {
    return Array.from(this.candidateNotes.values()).filter(note => note.jobCandidateId === jobCandidateId);
  }

  async createCandidateNote(insertNote: InsertCandidateNotes): Promise<CandidateNotes> {
    const id = crypto.randomUUID();
    const note: CandidateNotes = { 
      ...insertNote, 
      id, 
      createdAt: new Date() 
    };
    this.candidateNotes.set(id, note);
    return note;
  }
}

export const storage = new MemStorage();
