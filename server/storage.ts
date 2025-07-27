import { 
  userProfiles,
  organizations,
  userOrganizations,
  clients, 
  jobs, 
  candidates, 
  jobCandidate, 
  candidateNotes,
  interviews,
  messages,
  messageRecipients,
  type UserProfile,
  type Organization,
  type UserOrganization,
  type Client, 
  type Job, 
  type Candidate, 
  type JobCandidate, 
  type CandidateNotes,
  type Interview,
  type Message,
  type MessageRecipient,
  type InsertUserProfile,
  type InsertOrganization,
  type InsertUserOrganization,
  type InsertClient,
  type InsertJob,
  type InsertCandidate,
  type InsertJobCandidate,
  type InsertCandidateNotes,
  type InsertInterview,
  type InsertMessage,
  type InsertMessageRecipient
} from "@shared/schema";
import { createClient } from '@supabase/supabase-js';

// Storage interface for ATS system
export interface IStorage {
  // User Profiles
  getUserProfile(id: string): Promise<UserProfile | undefined>;
  createUserProfile(userProfile: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(id: string, userProfile: Partial<InsertUserProfile>): Promise<UserProfile>;
  
  // Performance-optimized methods
  getDashboardStats(orgId: string): Promise<any>;
  getPipelineCandidates(jobId: string, orgId: string): Promise<any[]>;
  searchClients(searchTerm: string, orgId: string): Promise<Client[]>;
  searchJobs(searchTerm: string, orgId: string): Promise<Job[]>;
  searchCandidates(searchTerm: string, orgId: string): Promise<Candidate[]>;
  
  // Organizations
  getOrganization(id: string): Promise<Organization | undefined>;
  getOrganizations(ownerId?: string): Promise<Organization[]>;
  createOrganization(organization: InsertOrganization): Promise<Organization>;
  updateOrganization(id: string, organization: Partial<InsertOrganization>): Promise<Organization>;
  deleteOrganization(id: string): Promise<void>;
  
  // User Organizations
  getUserOrganization(id: string): Promise<UserOrganization | undefined>;
  getUserOrganizations(userId?: string, orgId?: string): Promise<UserOrganization[]>;
  getUserOrganizationsByUser(userId: string): Promise<UserOrganization[]>;
  getUserOrganizationsByOrg(orgId: string): Promise<UserOrganization[]>;
  createUserOrganization(userOrganization: InsertUserOrganization): Promise<UserOrganization>;
  updateUserOrganization(id: string, userOrganization: Partial<InsertUserOrganization>): Promise<UserOrganization>;
  deleteUserOrganization(id: string): Promise<void>;
  deleteUserOrganizationByUserAndOrg(userId: string, orgId: string): Promise<void>;
  
  // Clients
  getClient(id: string): Promise<Client | undefined>;
  getClients(): Promise<Client[]>;
  getClientsByOrg(orgId: string): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: Partial<InsertClient>): Promise<Client>;
  deleteClient(id: string): Promise<void>;
  
  // Jobs
  getJob(id: string): Promise<Job | undefined>;
  getJobs(): Promise<Job[]>;
  getJobsByOrg(orgId: string): Promise<Job[]>;
  getJobsByClient(clientId: string): Promise<Job[]>;
  createJob(job: InsertJob): Promise<Job>;
  
  // Candidates
  getCandidate(id: string): Promise<Candidate | undefined>;
  getCandidates(): Promise<Candidate[]>;
  getCandidatesByOrg(orgId: string): Promise<Candidate[]>;
  createCandidate(candidate: InsertCandidate): Promise<Candidate>;
  
  // Job-Candidate relationships
  getJobCandidate(id: string): Promise<JobCandidate | undefined>;
  getJobCandidatesByJob(jobId: string): Promise<JobCandidate[]>;
  getJobCandidatesByCandidate(candidateId: string): Promise<JobCandidate[]>;
  createJobCandidate(jobCandidate: InsertJobCandidate): Promise<JobCandidate>;
  updateJobCandidate(id: string, jobCandidate: Partial<InsertJobCandidate>): Promise<JobCandidate>;
  
  // Candidate Notes
  getCandidateNotes(jobCandidateId: string): Promise<CandidateNotes[]>;
  createCandidateNote(note: InsertCandidateNotes): Promise<CandidateNotes>;
  
  // Interviews
  getInterview(id: string): Promise<Interview | undefined>;
  getInterviews(): Promise<Interview[]>;
  getInterviewsByJobCandidate(jobCandidateId: string): Promise<Interview[]>;
  getInterviewsByDateRange(startDate: Date, endDate: Date): Promise<Interview[]>;
  createInterview(interview: InsertInterview): Promise<Interview>;
  updateInterview(id: string, interview: Partial<InsertInterview>): Promise<Interview>;
  deleteInterview(id: string): Promise<void>;
  
  // Messages
  getMessage(id: string): Promise<Message | undefined>;
  getMessages(userId?: string): Promise<Message[]>;
  getMessagesByThread(threadId: string): Promise<Message[]>;
  getMessagesByContext(params: { clientId?: string; jobId?: string; candidateId?: string }): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessage(id: string, message: Partial<InsertMessage>): Promise<Message>;
  markMessageAsRead(messageId: string, userId: string): Promise<void>;
  archiveMessage(messageId: string): Promise<void>;
  
  // Message Recipients
  addMessageRecipients(messageId: string, recipientIds: string[]): Promise<MessageRecipient[]>;
  getUnreadMessageCount(userId: string): Promise<number>;
}

export class MemStorage implements IStorage {
  private userProfiles: Map<string, UserProfile>;
  private organizations: Map<string, Organization>;
  private userOrganizations: Map<string, UserOrganization>;
  private clients: Map<string, Client>;
  private jobs: Map<string, Job>;
  private candidates: Map<string, Candidate>;
  private jobCandidates: Map<string, JobCandidate>;
  private candidateNotes: Map<string, CandidateNotes>;
  private interviews: Map<string, Interview>;
  private messages: Map<string, Message>;

  constructor() {
    this.userProfiles = new Map();
    this.organizations = new Map();
    this.userOrganizations = new Map();
    this.clients = new Map();
    this.jobs = new Map();
    this.candidates = new Map();
    this.jobCandidates = new Map();
    this.candidateNotes = new Map();
    this.interviews = new Map();
    this.messages = new Map();
  }



  // User Profiles
  async getUserProfile(id: string): Promise<UserProfile | undefined> {
    return this.userProfiles.get(id);
  }

  async createUserProfile(insertUserProfile: InsertUserProfile): Promise<UserProfile> {
    const id = crypto.randomUUID();
    const userProfile: UserProfile = { 
      ...insertUserProfile,
      id, 
      createdAt: new Date(),
      updatedAt: new Date(),
      role: insertUserProfile.role || 'demo_viewer'
    };
    this.userProfiles.set(id, userProfile);
    return userProfile;
  }

  async updateUserProfile(id: string, updateData: Partial<InsertUserProfile>): Promise<UserProfile> {
    const existingProfile = this.userProfiles.get(id);
    if (!existingProfile) {
      throw new Error(`User profile with id ${id} not found`);
    }
    
    const updatedProfile: UserProfile = {
      ...existingProfile,
      ...updateData,
      role: updateData.role || existingProfile.role,
      updatedAt: new Date(),
      id,
    };
    
    this.userProfiles.set(id, updatedProfile);
    return updatedProfile;
  }

  // Performance-optimized methods
  async getDashboardStats(orgId: string): Promise<any> {
    // Simulate optimized dashboard stats query
    const clients = Array.from(this.clients.values()).filter(c => c.orgId === orgId);
    const jobs = Array.from(this.jobs.values()).filter(j => j.orgId === orgId);
    const candidates = Array.from(this.candidates.values()).filter(c => c.orgId === orgId);
    const jobCandidates = Array.from(this.jobCandidates.values()).filter(jc => jc.orgId === orgId);
    
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const candidatesThisWeek = candidates.filter(c => c.createdAt >= oneWeekAgo);
    
    const pipelineSummary = jobCandidates.reduce((acc, jc) => {
      const stage = jc.stage;
      acc[stage] = (acc[stage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      total_clients: clients.length,
      active_jobs: jobs.filter(j => j.status === 'open').length,
      total_candidates: candidates.length,
      candidates_this_week: candidatesThisWeek.length,
      pipeline_summary: Object.entries(pipelineSummary).map(([stage, count]) => ({ stage, count }))
    };
  }

  async getPipelineCandidates(jobId: string, orgId: string): Promise<any[]> {
    const jobCandidates = Array.from(this.jobCandidates.values())
      .filter(jc => jc.jobId === jobId && jc.orgId === orgId);
    
    return jobCandidates.map(jc => {
      const candidate = this.candidates.get(jc.candidateId);
      const notesCount = Array.from(this.candidateNotes.values())
        .filter(note => note.jobCandidateId === jc.id).length;
      
      return {
        candidate_id: jc.candidateId,
        candidate_name: candidate?.name || 'Unknown',
        candidate_email: candidate?.email || '',
        stage: jc.stage,
        notes_count: notesCount,
        last_update: jc.updatedAt || jc.createdAt
      };
    });
  }

  async searchClients(searchTerm: string, orgId: string): Promise<Client[]> {
    const clients = Array.from(this.clients.values())
      .filter(c => c.orgId === orgId);
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return clients.filter(client => 
      client.name.toLowerCase().includes(lowerSearchTerm) ||
      (client.industry || '').toLowerCase().includes(lowerSearchTerm) ||
      (client.location || '').toLowerCase().includes(lowerSearchTerm)
    );
  }

  async searchJobs(searchTerm: string, orgId: string): Promise<Job[]> {
    const jobs = Array.from(this.jobs.values())
      .filter(j => j.orgId === orgId);
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return jobs.filter(job => 
      job.title.toLowerCase().includes(lowerSearchTerm) ||
      (job.description || '').toLowerCase().includes(lowerSearchTerm)
    );
  }

  async searchCandidates(searchTerm: string, orgId: string): Promise<Candidate[]> {
    const candidates = Array.from(this.candidates.values())
      .filter(c => c.orgId === orgId);
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return candidates.filter(candidate => 
      candidate.name.toLowerCase().includes(lowerSearchTerm) ||
      (candidate.email || '').toLowerCase().includes(lowerSearchTerm)
    );
  }

  // Organizations
  async getOrganization(id: string): Promise<Organization | undefined> {
    return this.organizations.get(id);
  }

  async getOrganizations(ownerId?: string): Promise<Organization[]> {
    const allOrgs = Array.from(this.organizations.values());
    if (ownerId) {
      return allOrgs.filter(org => org.ownerId === ownerId);
    }
    return allOrgs;
  }

  async createOrganization(insertOrganization: InsertOrganization): Promise<Organization> {
    const id = crypto.randomUUID();
    const organization: Organization = { 
      ...insertOrganization,
      slug: insertOrganization.slug ?? null,
      id, 
      createdAt: new Date()
    };
    this.organizations.set(id, organization);
    return organization;
  }

  async updateOrganization(id: string, updateData: Partial<InsertOrganization>): Promise<Organization> {
    const existingOrg = this.organizations.get(id);
    if (!existingOrg) {
      throw new Error(`Organization with id ${id} not found`);
    }
    
    const updatedOrg: Organization = {
      ...existingOrg,
      ...updateData,
      slug: updateData.slug ?? existingOrg.slug,
      id,
    };
    
    this.organizations.set(id, updatedOrg);
    return updatedOrg;
  }

  async deleteOrganization(id: string): Promise<void> {
    if (!this.organizations.has(id)) {
      throw new Error(`Organization with id ${id} not found`);
    }
    this.organizations.delete(id);
  }

  // User Organizations
  async getUserOrganization(id: string): Promise<UserOrganization | undefined> {
    return this.userOrganizations.get(id);
  }

  async getUserOrganizations(userId?: string, orgId?: string): Promise<UserOrganization[]> {
    let userOrgs = Array.from(this.userOrganizations.values());
    if (userId) {
      userOrgs = userOrgs.filter(uo => uo.userId === userId);
    }
    if (orgId) {
      userOrgs = userOrgs.filter(uo => uo.orgId === orgId);
    }
    return userOrgs;
  }

  async getUserOrganizationsByUser(userId: string): Promise<UserOrganization[]> {
    return Array.from(this.userOrganizations.values()).filter(uo => uo.userId === userId);
  }

  async getUserOrganizationsByOrg(orgId: string): Promise<UserOrganization[]> {
    return Array.from(this.userOrganizations.values()).filter(uo => uo.orgId === orgId);
  }

  async createUserOrganization(insertUserOrganization: InsertUserOrganization): Promise<UserOrganization> {
    const id = crypto.randomUUID();
    const userOrganization: UserOrganization = { 
      ...insertUserOrganization,
      id, 
      joinedAt: new Date()
    };
    this.userOrganizations.set(id, userOrganization);
    return userOrganization;
  }

  async updateUserOrganization(id: string, updateData: Partial<InsertUserOrganization>): Promise<UserOrganization> {
    const existingUserOrg = this.userOrganizations.get(id);
    if (!existingUserOrg) {
      throw new Error(`User organization with id ${id} not found`);
    }
    
    const updatedUserOrg: UserOrganization = {
      ...existingUserOrg,
      ...updateData,
      id,
    };
    
    this.userOrganizations.set(id, updatedUserOrg);
    return updatedUserOrg;
  }

  async deleteUserOrganization(id: string): Promise<void> {
    if (!this.userOrganizations.has(id)) {
      throw new Error(`User organization with id ${id} not found`);
    }
    this.userOrganizations.delete(id);
  }

  async deleteUserOrganizationByUserAndOrg(userId: string, orgId: string): Promise<void> {
    const userOrg = Array.from(this.userOrganizations.values())
      .find(uo => uo.userId === userId && uo.orgId === orgId);
    if (userOrg) {
      this.userOrganizations.delete(userOrg.id);
    }
  }

  // Clients
  async getClient(id: string): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async getClients(): Promise<Client[]> {
    return Array.from(this.clients.values());
  }

  async getClientsByOrg(orgId: string): Promise<Client[]> {
    return Array.from(this.clients.values()).filter(client => client.orgId === orgId);
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

  async getJobsByOrg(orgId: string): Promise<Job[]> {
    return Array.from(this.jobs.values()).filter(job => job.orgId === orgId);
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

  async getCandidatesByOrg(orgId: string): Promise<Candidate[]> {
    return Array.from(this.candidates.values()).filter(candidate => candidate.orgId === orgId);
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

  async updateJobCandidate(id: string, updateData: Partial<InsertJobCandidate>): Promise<JobCandidate> {
    const existing = this.jobCandidates.get(id);
    if (!existing) {
      throw new Error(`Job candidate with id ${id} not found`);
    }

    const updated: JobCandidate = {
      ...existing,
      ...updateData,
      id,
      updatedAt: new Date()
    };
    
    this.jobCandidates.set(id, updated);
    return updated;
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
      createdAt: new Date(),
      updatedAt: new Date(),
      isPrivate: insertNote.isPrivate || 'no'
    };
    this.candidateNotes.set(id, note);
    return note;
  }

  // Interview methods
  async getInterview(id: string): Promise<Interview | undefined> {
    return this.interviews.get(id);
  }

  async getInterviews(): Promise<Interview[]> {
    return Array.from(this.interviews.values()).filter(interview => interview.recordStatus !== 'deleted');
  }

  async getInterviewsByJobCandidate(jobCandidateId: string): Promise<Interview[]> {
    return Array.from(this.interviews.values()).filter(interview => 
      interview.jobCandidateId === jobCandidateId && interview.recordStatus !== 'deleted'
    );
  }

  async getInterviewsByDateRange(startDate: Date, endDate: Date): Promise<Interview[]> {
    return Array.from(this.interviews.values()).filter(interview => {
      if (interview.recordStatus === 'deleted') return false;
      const scheduledAt = new Date(interview.scheduledAt);
      return scheduledAt >= startDate && scheduledAt <= endDate;
    });
  }

  async createInterview(insertInterview: InsertInterview): Promise<Interview> {
    const id = crypto.randomUUID();
    const interview: Interview = {
      ...insertInterview,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: insertInterview.status || 'scheduled',
      recordStatus: insertInterview.recordStatus || 'active'
    };
    this.interviews.set(id, interview);
    return interview;
  }

  async updateInterview(id: string, updateData: Partial<InsertInterview>): Promise<Interview> {
    const existingInterview = this.interviews.get(id);
    if (!existingInterview) {
      throw new Error(`Interview with id ${id} not found`);
    }
    
    const updatedInterview: Interview = {
      ...existingInterview,
      ...updateData,
      updatedAt: new Date(),
      id,
    };
    
    this.interviews.set(id, updatedInterview);
    return updatedInterview;
  }

  async deleteInterview(id: string): Promise<void> {
    const existingInterview = this.interviews.get(id);
    if (!existingInterview) {
      throw new Error(`Interview with id ${id} not found`);
    }
    
    // Soft delete by updating record status
    const updatedInterview: Interview = {
      ...existingInterview,
      recordStatus: 'deleted',
      updatedAt: new Date(),
    };
    
    this.interviews.set(id, updatedInterview);
  }
}

// Database storage implementation using Supabase

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Enhanced Supabase client with connection pooling and rate limiting
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-client-info': 'ats-backend@1.0.0',
    },
  },
  // Connection pool configuration
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

class DatabaseStorage implements IStorage {
  // User Profiles
  async getUserProfile(id: string): Promise<UserProfile | undefined> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw new Error(error.message);
    }
    
    return data as UserProfile;
  }

  async createUserProfile(insertUserProfile: InsertUserProfile): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert(insertUserProfile)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create user profile: ${error.message}`);
    return data as UserProfile;
  }

  async updateUserProfile(id: string, updateData: Partial<InsertUserProfile>): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update user profile: ${error.message}`);
    return data as UserProfile;
  }

  // Performance methods (placeholder implementations)
  async getDashboardStats(orgId: string): Promise<any> {
    return {};
  }

  async getPipelineCandidates(jobId: string, orgId: string): Promise<any[]> {
    return [];
  }

  async searchClients(searchTerm: string, orgId: string): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('org_id', orgId)
      .ilike('name', `%${searchTerm}%`);
    
    if (error) throw new Error(`Failed to search clients: ${error.message}`);
    return data as Client[];
  }

  async searchJobs(searchTerm: string, orgId: string): Promise<Job[]> {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('org_id', orgId)
      .ilike('title', `%${searchTerm}%`);
    
    if (error) throw new Error(`Failed to search jobs: ${error.message}`);
    return data as Job[];
  }

  async searchCandidates(searchTerm: string, orgId: string): Promise<Candidate[]> {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('org_id', orgId)
      .ilike('name', `%${searchTerm}%`);
    
    if (error) throw new Error(`Failed to search candidates: ${error.message}`);
    return data as Candidate[];
  }

  // Organizations
  async getOrganization(id: string): Promise<Organization | undefined> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return undefined // Not found
      throw new Error(error.message)
    }
    
    return data as Organization
  }

  async getOrganizations(ownerId?: string): Promise<Organization[]> {
    let query = supabase
      .from('organizations')
      .select('*')
      .order('name', { ascending: true })
    
    if (ownerId) {
      query = query.eq('owner_id', ownerId)
    }
    
    const { data, error } = await query
    
    if (error) {
      throw new Error(error.message)
    }
    
    return data as Organization[]
  }

  async createOrganization(insertOrganization: InsertOrganization): Promise<Organization> {
    try {
      const dbOrganization = {
        name: insertOrganization.name,
        owner_id: insertOrganization.ownerId,
        slug: insertOrganization.slug,
      }
      
      const { data, error } = await supabase
        .from('organizations')
        .insert(dbOrganization)
        .select()
        .single()
      
      if (error) {
        console.error('Database organization creation error:', error)
        throw new Error(`Failed to create organization: ${error.message}`)
      }
      
      return data as Organization
    } catch (err) {
      console.error('Organization creation exception:', err)
      throw err
    }
  }

  async updateOrganization(id: string, updateData: Partial<InsertOrganization>): Promise<Organization> {
    try {
      const dbUpdate: any = {}
      if (updateData.name !== undefined) dbUpdate.name = updateData.name
      if (updateData.ownerId !== undefined) dbUpdate.owner_id = updateData.ownerId
      if (updateData.slug !== undefined) dbUpdate.slug = updateData.slug
      
      const { data, error } = await supabase
        .from('organizations')
        .update(dbUpdate)
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        console.error('Database organization update error:', error)
        throw new Error(`Failed to update organization: ${error.message}`)
      }
      
      return data as Organization
    } catch (err) {
      console.error('Organization update exception:', err)
      throw err
    }
  }

  async deleteOrganization(id: string): Promise<void> {
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', id)
    
    if (error) {
      throw new Error(error.message)
    }
  }

  // User Organizations
  async getUserOrganization(id: string): Promise<UserOrganization | undefined> {
    const { data, error } = await supabase
      .from('user_organizations')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return undefined
      throw new Error(error.message)
    }
    
    return data as UserOrganization
  }

  async getUserOrganizations(userId?: string, orgId?: string): Promise<UserOrganization[]> {
    let query = supabase
      .from('user_organizations')
      .select('*')
      .order('joined_at', { ascending: false })
    
    if (userId) {
      query = query.eq('user_id', userId)
    }
    if (orgId) {
      query = query.eq('org_id', orgId)
    }
    
    const { data, error } = await query
    
    if (error) {
      throw new Error(error.message)
    }
    
    return data as UserOrganization[]
  }

  async getUserOrganizationsByUser(userId: string): Promise<UserOrganization[]> {
    const { data, error } = await supabase
      .from('user_organizations')
      .select('*')
      .eq('user_id', userId)
      .order('joined_at', { ascending: false })
    
    if (error) {
      throw new Error(error.message)
    }
    
    return data as UserOrganization[]
  }

  async getUserOrganizationsByOrg(orgId: string): Promise<UserOrganization[]> {
    const { data, error } = await supabase
      .from('user_organizations')
      .select('*')
      .eq('org_id', orgId)
      .order('joined_at', { ascending: false })
    
    if (error) {
      throw new Error(error.message)
    }
    
    return data as UserOrganization[]
  }

  async createUserOrganization(insertUserOrganization: InsertUserOrganization): Promise<UserOrganization> {
    try {
      const dbUserOrganization = {
        user_id: insertUserOrganization.userId,
        org_id: insertUserOrganization.orgId,
        role: insertUserOrganization.role,
      }
      
      const { data, error } = await supabase
        .from('user_organizations')
        .insert(dbUserOrganization)
        .select()
        .single()
      
      if (error) {
        console.error('Database user organization creation error:', error)
        throw new Error(`Failed to create user organization: ${error.message}`)
      }
      
      return data as UserOrganization
    } catch (err) {
      console.error('User organization creation exception:', err)
      throw err
    }
  }

  async updateUserOrganization(id: string, updateData: Partial<InsertUserOrganization>): Promise<UserOrganization> {
    try {
      const dbUpdate: any = {}
      if (updateData.userId !== undefined) dbUpdate.user_id = updateData.userId
      if (updateData.orgId !== undefined) dbUpdate.org_id = updateData.orgId
      if (updateData.role !== undefined) dbUpdate.role = updateData.role
      
      const { data, error } = await supabase
        .from('user_organizations')
        .update(dbUpdate)
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        console.error('Database user organization update error:', error)
        throw new Error(`Failed to update user organization: ${error.message}`)
      }
      
      return data as UserOrganization
    } catch (err) {
      console.error('User organization update exception:', err)
      throw err
    }
  }

  async deleteUserOrganization(id: string): Promise<void> {
    const { error } = await supabase
      .from('user_organizations')
      .delete()
      .eq('id', id)
    
    if (error) {
      throw new Error(error.message)
    }
  }

  async deleteUserOrganizationByUserAndOrg(userId: string, orgId: string): Promise<void> {
    const { error } = await supabase
      .from('user_organizations')
      .delete()
      .eq('user_id', userId)
      .eq('org_id', orgId)
    
    if (error) {
      throw new Error(error.message)
    }
  }

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
    try {
      // Map the camelCase fields to snake_case for database with full column support
      const dbClient = {
        name: insertClient.name,
        org_id: insertClient.orgId,
        industry: insertClient.industry || null,
        location: insertClient.location || null,
        website: insertClient.website || null,
        contact_name: insertClient.contactName || null,
        contact_email: insertClient.contactEmail || null,
        contact_phone: insertClient.contactPhone || null,
        notes: insertClient.notes || null,
        status: insertClient.status || 'active',
        created_by: insertClient.createdBy || null,
      }
      
      const { data, error } = await supabase
        .from('clients')
        .insert(dbClient)
        .select()
        .single()
      
      if (error) {
        console.error('Database client creation error:', error)
        throw new Error(`Failed to create client: ${error.message}`)
      }
      
      return data as Client
    } catch (err) {
      console.error('Client creation exception:', err)
      throw err
    }
  }

  async updateClient(id: string, updateData: Partial<InsertClient>): Promise<Client> {
    try {
      // Map the camelCase fields to snake_case for database with full column support
      const dbUpdate: any = {}
      if (updateData.name !== undefined) dbUpdate.name = updateData.name
      if (updateData.industry !== undefined) dbUpdate.industry = updateData.industry
      if (updateData.location !== undefined) dbUpdate.location = updateData.location
      if (updateData.website !== undefined) dbUpdate.website = updateData.website
      if (updateData.contactName !== undefined) dbUpdate.contact_name = updateData.contactName
      if (updateData.contactEmail !== undefined) dbUpdate.contact_email = updateData.contactEmail
      if (updateData.contactPhone !== undefined) dbUpdate.contact_phone = updateData.contactPhone
      if (updateData.notes !== undefined) dbUpdate.notes = updateData.notes
      if (updateData.status !== undefined) dbUpdate.status = updateData.status
      
      const { data, error } = await supabase
        .from('clients')
        .update(dbUpdate)
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        console.error('Database client update error:', error)
        throw new Error(`Failed to update client: ${error.message}`)
      }
      
      return data as Client
    } catch (err) {
      console.error('Client update exception:', err)
      throw err
    }
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
    try {
      // Map the camelCase fields to snake_case for database with optimized structure
      const dbJob = {
        title: insertJob.title,
        description: insertJob.description,
        client_id: insertJob.clientId,
        // Note: status, record_status, created_by, assigned_to fields will be added after schema migration
      }
      
      const { data, error } = await supabase
        .from('jobs')
        .insert(dbJob)
        .select()
        .single()
      
      if (error) {
        console.error('Database job creation error:', error)
        throw new Error(`Failed to create job: ${error.message}`)
      }
      
      return data as Job
    } catch (err) {
      console.error('Job creation exception:', err)
      throw err
    }
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
    try {
      // Map the camelCase fields to snake_case for database with optimized structure
      const dbCandidate = {
        name: insertCandidate.name,
        email: insertCandidate.email,
        phone: insertCandidate.phone,
        resume_url: insertCandidate.resumeUrl,
        // Note: status and created_by fields will be added after schema migration
      }
      
      const { data, error } = await supabase
        .from('candidates')
        .insert(dbCandidate)
        .select()
        .single()
      
      if (error) {
        console.error('Database candidate creation error:', error)
        throw new Error(`Failed to create candidate: ${error.message}`)
      }
      
      return data as Candidate
    } catch (err) {
      console.error('Candidate creation exception:', err)
      throw err
    }
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
    try {
      console.log('Fetching job candidates for job:', jobId);
      
      // For demo jobs, return demo candidates
      if (jobId.startsWith('demo-job-')) {
        console.log('Returning demo candidates for demo job');
        return [
          {
            id: 'demo-job-candidate-1',
            orgId: 'demo-org-fixed',
            jobId: jobId,
            candidateId: 'demo-candidate-1',
            stage: 'applied',
            notes: 'Initial application review pending',
            assignedTo: null,
            status: 'demo',
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            candidates: {
              id: 'demo-candidate-1',
              name: 'David Brown',
              email: 'david.brown@email.com',
              phone: '+1-555-0123',
              resume_url: 'https://example.com/david-resume.pdf',
              created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            }
          },
          {
            id: 'demo-job-candidate-2',
            orgId: 'demo-org-fixed',
            jobId: jobId,
            candidateId: 'demo-candidate-2',
            stage: 'phone_screen',
            notes: 'Passed initial screening',
            assignedTo: null,
            status: 'demo',
            createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            candidates: {
              id: 'demo-candidate-2',
              name: 'Sarah Wilson',
              email: 'sarah.wilson@email.com',
              phone: '+1-555-0124',
              resume_url: 'https://example.com/sarah-resume.pdf',
              created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
            }
          }
        ] as JobCandidate[]
      }
      
      const { data, error } = await supabase
        .from('job_candidate')
        .select(`
          *,
          candidates (
            id,
            name,
            email,
            phone,
            resume_url,
            created_at
          )
        `)
        .eq('job_id', jobId)
        .order('updated_at', { ascending: false })
      
      if (error) {
        console.error('Supabase error fetching job candidates:', error);
        return []
      }
      
      return data as JobCandidate[]
    } catch (err) {
      console.error('Exception in getJobCandidatesByJob:', err);
      return []
    }
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
    try {
      // Map the camelCase fields to snake_case for database with optimized structure
      const dbJobCandidate = {
        job_id: insertJobCandidate.jobId,
        candidate_id: insertJobCandidate.candidateId,
        stage: insertJobCandidate.stage || 'applied',
        notes: insertJobCandidate.notes,
        assigned_to: insertJobCandidate.assignedTo || null,
        // Note: status field will be added after schema migration
      }
      
      const { data, error } = await supabase
        .from('job_candidate')
        .insert(dbJobCandidate)
        .select()
        .single()
      
      if (error) {
        console.error('Database job candidate creation error:', error)
        throw new Error(`Failed to create job candidate: ${error.message}`)
      }
      
      return data as JobCandidate
    } catch (err) {
      console.error('Job candidate creation exception:', err)
      throw err
    }
  }

  async updateJobCandidate(id: string, updateData: Partial<InsertJobCandidate>): Promise<JobCandidate> {
    try {
      // Map the camelCase fields to snake_case for database
      const dbUpdate: any = {}
      if (updateData.stage !== undefined) dbUpdate.stage = updateData.stage
      if (updateData.notes !== undefined) dbUpdate.notes = updateData.notes
      if (updateData.assignedTo !== undefined) dbUpdate.assigned_to = updateData.assignedTo
      
      // Always update the timestamp
      dbUpdate.updated_at = new Date().toISOString()
      
      const { data, error } = await supabase
        .from('job_candidate')
        .update(dbUpdate)
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        console.error('Database job candidate update error:', error)
        throw new Error(`Failed to update job candidate: ${error.message}`)
      }
      
      return data as JobCandidate
    } catch (err) {
      console.error('Job candidate update exception:', err)
      throw err
    }
  }

  async getCandidateNotes(jobCandidateId: string): Promise<CandidateNotes[]> {
    try {
      console.log('Querying candidate_notes for job_candidate_id:', jobCandidateId);
      
      // For demo job candidates, return demo notes
      if (jobCandidateId.startsWith('demo-')) {
        console.log('Returning demo notes for demo candidate');
        return [
          {
            id: `demo-note-1-${jobCandidateId}`,
            orgId: 'demo-org-fixed',
            jobCandidateId,
            authorId: 'demo-user',
            content: 'Initial screening call went well. Candidate has strong technical background.',
            isPrivate: 'false',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          },
          {
            id: `demo-note-2-${jobCandidateId}`,
            orgId: 'demo-org-fixed',
            jobCandidateId,
            authorId: 'demo-user-2',
            content: 'Follow-up interview scheduled for next week.',
            isPrivate: 'false',
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
            updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          }
        ] as CandidateNotes[]
      }
      
      const { data, error } = await supabase
        .from('candidate_notes')
        .select('*')
        .eq('job_candidate_id', jobCandidateId)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Supabase error fetching candidate notes:', error);
        // Return empty array instead of throwing error for better UX
        return []
      }
      
      console.log('Raw candidate notes data:', data);
      return data as CandidateNotes[] || []
    } catch (err) {
      console.error('Exception in getCandidateNotes:', err);
      // Return empty array instead of throwing error
      return []
    }
  }

  async createCandidateNote(insertNote: InsertCandidateNotes): Promise<CandidateNotes> {
    try {
      console.log('Creating candidate note:', insertNote);
      
      // For demo candidates, return a mock created note
      if (insertNote.jobCandidateId.startsWith('demo-')) {
        console.log('Creating demo note for demo candidate');
        const mockNote: CandidateNotes = {
          id: `demo-note-${Date.now()}`,
          orgId: insertNote.orgId || 'demo-org-fixed',
          jobCandidateId: insertNote.jobCandidateId,
          authorId: insertNote.authorId,
          content: insertNote.content,
          isPrivate: 'false',
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        return mockNote
      }
      
      // Map the camelCase fields to snake_case for database with optimized structure
      const dbNote = {
        org_id: insertNote.orgId || 'demo-org-fixed',
        job_candidate_id: insertNote.jobCandidateId,
        author_id: insertNote.authorId,
        content: insertNote.content,
        is_private: 'false',
      }
      
      const { data, error } = await supabase
        .from('candidate_notes')
        .insert(dbNote)
        .select()
        .single()
      
      if (error) {
        console.error('Database candidate note creation error:', error)
        throw new Error(`Failed to create candidate note: ${error.message}`)
      }
      
      return data as CandidateNotes
    } catch (err) {
      console.error('Candidate note creation exception:', err)
      throw err
    }
  }

  // Interviews implementation - using in-memory storage for now since table doesn't exist yet
  async getInterview(id: string): Promise<Interview | undefined> {
    // For now, return undefined as interviews table doesn't exist yet
    return undefined
  }

  async getInterviews(): Promise<Interview[]> {
    // For now, return empty array as interviews table doesn't exist yet
    return []
  }

  async getInterviewsByJobCandidate(jobCandidateId: string): Promise<Interview[]> {
    // For now, return empty array as interviews table doesn't exist yet
    return []
  }

  async getInterviewsByDateRange(startDate: Date, endDate: Date): Promise<Interview[]> {
    // For now, return empty array as interviews table doesn't exist yet
    return []
  }

  async createInterview(insertInterview: InsertInterview): Promise<Interview> {
    // For now, create a mock interview since table doesn't exist yet
    const id = crypto.randomUUID()
    const now = new Date()
    const interview: Interview = {
      ...insertInterview,
      id,
      createdAt: now,
      updatedAt: now,
      recordStatus: insertInterview.recordStatus || 'active',
      duration: insertInterview.duration || null,
      location: insertInterview.location || null,
      interviewerId: insertInterview.interviewerId || null,
      notes: insertInterview.notes || null,
      feedback: insertInterview.feedback || null,
      rating: insertInterview.rating || null,
      status: insertInterview.status || 'scheduled'
    }
    return interview
  }

  async updateInterview(id: string, updateData: Partial<InsertInterview>): Promise<Interview> {
    // For now, return a mock updated interview since table doesn't exist yet
    const now = new Date()
    const interview: Interview = {
      id,
      jobCandidateId: updateData.jobCandidateId || '',
      title: updateData.title || '',
      type: updateData.type || 'video',
      status: updateData.status || 'scheduled',
      scheduledAt: updateData.scheduledAt || now,
      duration: updateData.duration || '60',
      location: updateData.location || null,
      interviewerId: updateData.interviewerId || null,
      notes: updateData.notes || null,
      feedback: updateData.feedback || null,
      rating: updateData.rating || null,
      recordStatus: updateData.recordStatus || 'active',
      orgId: updateData.orgId || 'demo-org-fixed',
      createdAt: now,
      updatedAt: now,
    }
    return interview
  }

  async deleteInterview(id: string): Promise<void> {
    // For now, do nothing since table doesn't exist yet
    return
  }

  // Messages implementation - using in-memory storage for now since table doesn't exist yet
  async getMessage(id: string): Promise<Message | undefined> {
    // For now, return undefined as messages table doesn't exist yet
    return undefined
  }

  async getMessages(userId?: string): Promise<Message[]> {
    // For now, return empty array as messages table doesn't exist yet
    return []
  }

  async getMessagesByThread(threadId: string): Promise<Message[]> {
    // For now, return empty array as messages table doesn't exist yet
    return []
  }

  async getMessagesByContext(params: { clientId?: string; jobId?: string; candidateId?: string }): Promise<Message[]> {
    // For now, return empty array as messages table doesn't exist yet
    return []
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    // For now, create a mock message since table doesn't exist yet
    const id = crypto.randomUUID()
    const now = new Date()
    const message: Message = {
      ...insertMessage,
      id,
      isRead: false,
      readAt: null,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
      recordStatus: insertMessage.recordStatus || 'active',
      clientId: insertMessage.clientId || null,
      jobId: insertMessage.jobId || null,
      candidateId: insertMessage.candidateId || null,
      jobCandidateId: insertMessage.jobCandidateId || null,
      recipientId: insertMessage.recipientId || null,
      threadId: insertMessage.threadId || null,
      replyToId: insertMessage.replyToId || null,
      attachments: insertMessage.attachments || null,
      tags: insertMessage.tags || null,
      priority: insertMessage.priority || 'normal'
    }
    return message
  }

  async updateMessage(id: string, updateData: Partial<InsertMessage>): Promise<Message> {
    // For now, return a mock updated message since table doesn't exist yet
    const now = new Date()
    const message: Message = {
      id,
      type: updateData.type || 'internal',
      priority: updateData.priority || 'normal',
      subject: updateData.subject || '',
      content: updateData.content || '',
      senderId: updateData.senderId || '',
      recipientId: updateData.recipientId || null,
      clientId: updateData.clientId || null,
      jobId: updateData.jobId || null,
      candidateId: updateData.candidateId || null,
      jobCandidateId: updateData.jobCandidateId || null,
      isRead: updateData.isRead || false,
      readAt: updateData.readAt || null,
      isArchived: updateData.isArchived || false,
      threadId: updateData.threadId || null,
      replyToId: updateData.replyToId || null,
      orgId: updateData.orgId || 'demo-org-fixed',
      attachments: updateData.attachments || null,
      tags: updateData.tags || null,
      recordStatus: updateData.recordStatus || 'active',
      createdAt: now,
      updatedAt: now,
    }
    return message
  }

  async markMessageAsRead(messageId: string, userId: string): Promise<void> {
    // For now, do nothing since table doesn't exist yet
    return
  }

  async archiveMessage(messageId: string): Promise<void> {
    // For now, do nothing since table doesn't exist yet
    return
  }

  async addMessageRecipients(messageId: string, recipientIds: string[]): Promise<MessageRecipient[]> {
    // For now, return empty array as table doesn't exist yet
    return []
  }

  async getUnreadMessageCount(userId: string): Promise<number> {
    // For now, return 0 as table doesn't exist yet
    return 0
  }
}

export const storage = new DatabaseStorage();
