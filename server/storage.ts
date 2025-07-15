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
import { createClient } from '@supabase/supabase-js';

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

// Database storage implementation using Supabase

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

class DatabaseStorage implements IStorage {
  async getClient(id: string): Promise<Client | undefined> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return undefined // Not found
      throw new Error(error.message)
    }
    
    return data as Client
  }

  async getClients(): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name', { ascending: true })
    
    if (error) {
      throw new Error(error.message)
    }
    
    return data as Client[]
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    // Map the camelCase fields to snake_case for database
    const dbClient = {
      name: insertClient.name,
      industry: insertClient.industry,
      location: insertClient.location,
      website: insertClient.website,
      contact_name: insertClient.contactName,
      contact_email: insertClient.contactEmail,
      notes: insertClient.notes,
    }
    
    const { data, error } = await supabase
      .from('clients')
      .insert(dbClient)
      .select()
      .single()
    
    if (error) {
      throw new Error(error.message)
    }
    
    return data as Client
  }

  async updateClient(id: string, updateData: Partial<InsertClient>): Promise<Client> {
    // Map the camelCase fields to snake_case for database
    const dbUpdate: any = {}
    if (updateData.name !== undefined) dbUpdate.name = updateData.name
    if (updateData.industry !== undefined) dbUpdate.industry = updateData.industry
    if (updateData.location !== undefined) dbUpdate.location = updateData.location
    if (updateData.website !== undefined) dbUpdate.website = updateData.website
    if (updateData.contactName !== undefined) dbUpdate.contact_name = updateData.contactName
    if (updateData.contactEmail !== undefined) dbUpdate.contact_email = updateData.contactEmail
    if (updateData.notes !== undefined) dbUpdate.notes = updateData.notes
    
    const { data, error } = await supabase
      .from('clients')
      .update(dbUpdate)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      throw new Error(error.message)
    }
    
    return data as Client
  }

  async deleteClient(id: string): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)
    
    if (error) {
      throw new Error(error.message)
    }
  }

  async getJob(id: string): Promise<Job | undefined> {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return undefined
      throw new Error(error.message)
    }
    
    return data as Job
  }

  async getJobs(): Promise<Job[]> {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      throw new Error(error.message)
    }
    
    return data as Job[]
  }

  async getJobsByClient(clientId: string): Promise<Job[]> {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
    
    if (error) {
      throw new Error(error.message)
    }
    
    return data as Job[]
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    // Map the camelCase fields to snake_case for database
    const dbJob = {
      title: insertJob.title,
      description: insertJob.description,
      client_id: insertJob.clientId,
    }
    
    const { data, error } = await supabase
      .from('jobs')
      .insert(dbJob)
      .select()
      .single()
    
    if (error) {
      throw new Error(error.message)
    }
    
    return data as Job
  }

  async getCandidate(id: string): Promise<Candidate | undefined> {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return undefined
      throw new Error(error.message)
    }
    
    return data as Candidate
  }

  async getCandidates(): Promise<Candidate[]> {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      throw new Error(error.message)
    }
    
    return data as Candidate[]
  }

  async createCandidate(insertCandidate: InsertCandidate): Promise<Candidate> {
    const { data, error } = await supabase
      .from('candidates')
      .insert(insertCandidate)
      .select()
      .single()
    
    if (error) {
      throw new Error(error.message)
    }
    
    return data as Candidate
  }

  async getJobCandidate(id: string): Promise<JobCandidate | undefined> {
    const { data, error } = await supabase
      .from('job_candidate')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return undefined
      throw new Error(error.message)
    }
    
    return data as JobCandidate
  }

  async getJobCandidatesByJob(jobId: string): Promise<JobCandidate[]> {
    const { data, error } = await supabase
      .from('job_candidate')
      .select('*')
      .eq('job_id', jobId)
      .order('updated_at', { ascending: false })
    
    if (error) {
      throw new Error(error.message)
    }
    
    return data as JobCandidate[]
  }

  async getJobCandidatesByCandidate(candidateId: string): Promise<JobCandidate[]> {
    const { data, error } = await supabase
      .from('job_candidate')
      .select('*')
      .eq('candidate_id', candidateId)
      .order('updated_at', { ascending: false })
    
    if (error) {
      throw new Error(error.message)
    }
    
    return data as JobCandidate[]
  }

  async createJobCandidate(insertJobCandidate: InsertJobCandidate): Promise<JobCandidate> {
    const { data, error } = await supabase
      .from('job_candidate')
      .insert(insertJobCandidate)
      .select()
      .single()
    
    if (error) {
      throw new Error(error.message)
    }
    
    return data as JobCandidate
  }

  async getCandidateNotes(jobCandidateId: string): Promise<CandidateNotes[]> {
    const { data, error } = await supabase
      .from('candidate_notes')
      .select('*')
      .eq('job_candidate_id', jobCandidateId)
      .order('created_at', { ascending: false })
    
    if (error) {
      throw new Error(error.message)
    }
    
    return data as CandidateNotes[]
  }

  async createCandidateNote(insertNote: InsertCandidateNotes): Promise<CandidateNotes> {
    const { data, error } = await supabase
      .from('candidate_notes')
      .insert(insertNote)
      .select()
      .single()
    
    if (error) {
      throw new Error(error.message)
    }
    
    return data as CandidateNotes
  }
}

export const storage = new DatabaseStorage();
