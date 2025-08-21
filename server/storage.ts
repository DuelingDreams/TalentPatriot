import { 
  organizations,
  userOrganizations,
  userProfiles,
  clients, 
  jobs, 
  candidates,
  jobCandidate, 
  candidateNotes,
  pipelineColumns,
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
  type PipelineColumn,
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
  type InsertPipelineColumn,
  type InsertInterview,
  type InsertMessage,
  type InsertMessageRecipient
} from "@shared/schema";
import { createClient } from '@supabase/supabase-js';
import { atsEmailService } from './emailService';
import { resumeParsingService, type ParsedResumeData } from './resumeParser';

// Storage interface for ATS system
export interface IStorage {
  // User Profiles
  getUserProfile(id: string): Promise<UserProfile | undefined>;
  createUserProfile(userProfile: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(id: string, userProfile: Partial<InsertUserProfile>): Promise<UserProfile>;
  ensureUserProfile(userId: string): Promise<UserProfile>;
  
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
  publishJob(jobId: string): Promise<Job>;
  updateJob(id: string, data: Partial<InsertJob>): Promise<Job>;
  
  // Candidates
  getCandidate(id: string): Promise<Candidate | undefined>;
  getCandidates(): Promise<Candidate[]>;
  getCandidatesByOrg(orgId: string): Promise<Candidate[]>;
  getCandidateByEmail(email: string, orgId: string): Promise<Candidate | undefined>;
  createCandidate(candidate: InsertCandidate): Promise<Candidate>;
  updateCandidate(id: string, candidate: Partial<InsertCandidate>): Promise<Candidate>;
  deleteCandidate(id: string): Promise<void>;

  // Public job access (no authentication required)
  getPublicJobs(): Promise<Job[]>;
  getPublicJobsByOrg(orgId: string): Promise<Job[]>;
  getPublicJob(id: string): Promise<Job | undefined>;
  
  // Job-Candidate relationships
  getJobCandidate(id: string): Promise<JobCandidate | undefined>;
  getJobCandidatesByJob(jobId: string): Promise<JobCandidate[]>;
  getJobCandidatesByCandidate(candidateId: string): Promise<JobCandidate[]>;
  getJobCandidatesByOrg(orgId: string): Promise<JobCandidate[]>;
  createJobCandidate(jobCandidate: InsertJobCandidate & { pipelineColumnId?: string }): Promise<JobCandidate>;
  updateJobCandidate(id: string, jobCandidate: Partial<InsertJobCandidate>): Promise<JobCandidate>;
  moveJobCandidate(jobCandidateId: string, newColumnId: string): Promise<JobCandidate>;
  
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
  
  // Pipeline Columns
  getPipelineColumns(orgId: string): Promise<PipelineColumn[]>;
  createPipelineColumn(column: InsertPipelineColumn): Promise<PipelineColumn>;
  
  // Job applications
  submitJobApplication(applicationData: {
    jobId: string;
    name: string;
    email: string;
    phone?: string;
    resumeUrl?: string;
  }): Promise<{ candidateId: string; applicationId: string }>;
  getJobCandidateByJobAndCandidate(jobId: string, candidateId: string): Promise<JobCandidate | undefined>;
  
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
  searchJobsAdvanced(filters: {
    orgId: string;
    searchTerm?: string;
    status?: string;
    clientId?: string;
    experienceLevel?: string;
    remoteOption?: string;
  }): Promise<Job[]>;
  
  // Resume parsing functionality
  parseAndUpdateCandidate(candidateId: string, resumeText?: string): Promise<Candidate>;
  searchCandidatesBySkills(orgId: string, skills: string[]): Promise<Candidate[]>;
}

// Database storage implementation using Supabase only - no more in-memory Maps
const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

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
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

export class DatabaseStorage implements IStorage {
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

  async ensureUserProfile(userId: string): Promise<UserProfile> {
    // First try to get existing user profile
    const existing = await this.getUserProfile(userId);
    if (existing) {
      return existing;
    }

    // Check if user exists in auth.users table first
    // We can't directly query this, so we'll use the admin client to check
    console.log(`Attempting to ensure user profile for: ${userId}`);
    
    // Try to create user profile - if it fails due to FK constraint, 
    // it means the user doesn't exist in auth.users
    try {
      return await this.createUserProfile({
        id: userId,
        role: 'hiring_manager'
      });
    } catch (error: any) {
      console.warn('Failed to create user profile:', error?.message);
      
      // If it's a foreign key constraint error, the user doesn't exist in auth.users
      if (error?.message?.includes('foreign key constraint') || error?.message?.includes('violates foreign key')) {
        throw new Error(`User ${userId} does not exist in authentication system. User must be registered through Supabase Auth first.`);
      }
      
      // Try to get it again in case it was created by another process/trigger
      const retryProfile = await this.getUserProfile(userId);
      if (retryProfile) {
        return retryProfile;
      }
      
      throw new Error(`Failed to ensure user profile exists for user ${userId}: ${error?.message}`);
    }
  }

  // Performance methods
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
      if (error.code === 'PGRST116') return undefined
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

  // Clients
  async getClient(id: string): Promise<Client | undefined> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return undefined
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

  async getClientsByOrg(orgId: string): Promise<Client[]> {
    try {
      console.log(`Fetching clients for orgId: ${orgId}`)
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('org_id', orgId)
        .order('name', { ascending: true })
      
      if (error) {
        console.error('Supabase error:', error)
        throw new Error(`Failed to fetch clients: ${error.message}`)
      }
      
      console.log(`Found ${data?.length || 0} clients for orgId: ${orgId}`)
      return data as Client[]
    } catch (err) {
      console.error('Exception in getClientsByOrg:', err)
      throw err
    }
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    try {
      const dbClient = {
        name: insertClient.name,
        org_id: insertClient.orgId,
        industry: insertClient.industry || null,
        location: insertClient.location || null,
        website: insertClient.website || null,
        contact_name: insertClient.contactName || null,
        contact_email: insertClient.contactEmail || null,
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
      const dbUpdate: any = {}
      if (updateData.name !== undefined) dbUpdate.name = updateData.name
      if (updateData.industry !== undefined) dbUpdate.industry = updateData.industry
      if (updateData.location !== undefined) dbUpdate.location = updateData.location
      if (updateData.website !== undefined) dbUpdate.website = updateData.website
      if (updateData.contactName !== undefined) dbUpdate.contact_name = updateData.contactName
      if (updateData.contactEmail !== undefined) dbUpdate.contact_email = updateData.contactEmail
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

  // Jobs  
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

  async getPublicJobs(): Promise<Job[]> {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('record_status', 'active')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
    
    if (error) {
      throw new Error(error.message)
    }
    
    return data as Job[]
  }

  async getPublicJobsByOrg(orgId: string): Promise<Job[]> {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('record_status', 'active')
      .eq('status', 'open')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
    
    if (error) {
      throw new Error(error.message)
    }
    
    return data as Job[]
  }

  async getPublicJob(id: string): Promise<Job | undefined> {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .eq('record_status', 'active')
      .eq('status', 'open')
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return undefined
      throw new Error(error.message)
    }
    
    return data as Job
  }

  async getJobsByOrg(orgId: string): Promise<Job[]> {
    try {
      console.log(`Fetching jobs for orgId: ${orgId}`)
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Supabase error:', error)
        throw new Error(`Failed to fetch jobs: ${error.message}`)
      }
      
      console.log(`Found ${data?.length || 0} jobs for orgId: ${orgId}`)
      return data as Job[]
    } catch (err) {
      console.error('Exception in getJobsByOrg:', err)
      throw err
    }
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
      console.log('Creating job with data:', insertJob);
      
      const { data, error } = await supabase
        .from('jobs')
        .insert({
          title: insertJob.title,
          description: insertJob.description ?? null,
          location: insertJob.location ?? null,
          job_type: insertJob.jobType ?? 'full-time',
          status: insertJob.status ?? 'draft', // Default to draft as requested
          record_status: insertJob.recordStatus ?? 'active',
          client_id: insertJob.clientId,
          org_id: insertJob.orgId,
          assigned_to: insertJob.assignedTo ?? null,
          created_by: insertJob.createdBy ?? null
        })
        .select()
        .single();
      
      if (error) {
        console.error('Database job creation error:', error);
        throw new Error(`Failed to create job: ${error.message}`);
      }
      
      return data as Job;
    } catch (err) {
      console.error('Job creation exception:', err);
      throw err;
    }
  }

  async updateJob(id: string, updateData: Partial<InsertJob>): Promise<Job> {
    try {
      const dbUpdate: any = {}
      if (updateData.title !== undefined) dbUpdate.title = updateData.title
      if (updateData.description !== undefined) dbUpdate.description = updateData.description
      if (updateData.status !== undefined) dbUpdate.status = updateData.status
      if (updateData.clientId !== undefined) dbUpdate.client_id = updateData.clientId
      if (updateData.assignedTo !== undefined) dbUpdate.assigned_to = updateData.assignedTo
      if (updateData.recordStatus !== undefined) dbUpdate.record_status = updateData.recordStatus
      
      const { data, error } = await supabase
        .from('jobs')
        .update(dbUpdate)
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        console.error('Database job update error:', error)
        throw new Error(`Failed to update job: ${error.message}`)
      }
      
      return data as Job
    } catch (err) {
      console.error('Job update exception:', err)
      throw err
    }
  }

  // Candidates
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
      .order('name', { ascending: true })
    
    if (error) {
      throw new Error(error.message)
    }
    
    return data as Candidate[]
  }

  async getCandidatesByOrg(orgId: string): Promise<Candidate[]> {
    try {
      console.log(`Fetching candidates for orgId: ${orgId}`)
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .eq('org_id', orgId)
        .order('name', { ascending: true })
      
      if (error) {
        console.error('Supabase error:', error)
        throw new Error(`Failed to fetch candidates: ${error.message}`)
      }
      
      console.log(`Found ${data?.length || 0} candidates for orgId: ${orgId}`)
      return data as Candidate[]
    } catch (err) {
      console.error('Exception in getCandidatesByOrg:', err)
      throw err
    }
  }





  async moveJobCandidate(jobCandidateId: string, newColumnId: string): Promise<JobCandidate> {
    const { data, error } = await supabase
      .from('job_candidate')
      .update({
        pipeline_column_id: newColumnId
      })
      .eq('id', jobCandidateId)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to move job candidate: ${error.message}`);
    return data as JobCandidate;
  }

  async getCandidateByEmail(email: string, orgId: string): Promise<Candidate | undefined> {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('email', email)
      .eq('org_id', orgId)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return undefined
      throw new Error(error.message)
    }
    
    return data as Candidate
  }

  async createCandidate(insertCandidate: InsertCandidate): Promise<Candidate> {
    try {
      const dbCandidate = {
        name: insertCandidate.name,
        email: insertCandidate.email,
        phone: insertCandidate.phone || null,
        resume_url: insertCandidate.resumeUrl || null,
        org_id: insertCandidate.orgId,
        status: insertCandidate.status || 'active',
        created_by: insertCandidate.createdBy || null,
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

  async updateCandidate(id: string, updateData: Partial<InsertCandidate>): Promise<Candidate> {
    try {
      const dbUpdate: any = {}
      if (updateData.name !== undefined) dbUpdate.name = updateData.name
      if (updateData.email !== undefined) dbUpdate.email = updateData.email
      if (updateData.phone !== undefined) dbUpdate.phone = updateData.phone
      if (updateData.resumeUrl !== undefined) dbUpdate.resume_url = updateData.resumeUrl
      if (updateData.status !== undefined) dbUpdate.status = updateData.status
      
      const { data, error } = await supabase
        .from('candidates')
        .update(dbUpdate)
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        console.error('Database candidate update error:', error)
        throw new Error(`Failed to update candidate: ${error.message}`)
      }
      
      return data as Candidate
    } catch (err) {
      console.error('Candidate update exception:', err)
      throw err
    }
  }

  async deleteCandidate(id: string): Promise<void> {
    const { error } = await supabase
      .from('candidates')
      .update({ status: 'deleted' })
      .eq('id', id)
    
    if (error) {
      throw new Error(error.message)
    }
  }

  // Job-Candidate relationships using job_candidate table (not old applications)
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
      .order('created_at', { ascending: false })
    
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
      .order('created_at', { ascending: false })
    
    if (error) {
      throw new Error(error.message)
    }
    
    return data as JobCandidate[]
  }

  async getJobCandidatesByOrg(orgId: string): Promise<JobCandidate[]> {
    try {
      console.log(`Fetching job candidates for orgId: ${orgId}`)
      const { data, error } = await supabase
        .from('job_candidate')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Supabase error:', error)
        throw new Error(`Failed to fetch job candidates: ${error.message}`)
      }
      
      console.log(`Found ${data?.length || 0} job candidates for orgId: ${orgId}`)
      return data as JobCandidate[]
    } catch (err) {
      console.error('Exception in getJobCandidatesByOrg:', err)
      throw err
    }
  }

  async createJobCandidate(insertJobCandidate: InsertJobCandidate & { pipelineColumnId?: string }): Promise<JobCandidate> {
    try {
      const dbJobCandidate = {
        org_id: insertJobCandidate.orgId,
        job_id: insertJobCandidate.jobId,
        candidate_id: insertJobCandidate.candidateId,
        stage: insertJobCandidate.stage || 'applied',
        notes: insertJobCandidate.notes || null,
        assigned_to: insertJobCandidate.assignedTo || null,
        status: insertJobCandidate.status || 'active',
        pipeline_column_id: insertJobCandidate.pipelineColumnId || null,
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
      const dbUpdate: any = {}
      if (updateData.stage !== undefined) dbUpdate.stage = updateData.stage
      if (updateData.notes !== undefined) dbUpdate.notes = updateData.notes
      if (updateData.assignedTo !== undefined) dbUpdate.assigned_to = updateData.assignedTo
      if (updateData.status !== undefined) dbUpdate.status = updateData.status
      
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



  // Candidate notes implementations
  async getCandidateNotes(jobCandidateId: string): Promise<CandidateNotes[]> {
    try {
      const { data, error } = await supabase
        .from('candidate_notes')
        .select(`
          id,
          org_id,
          job_candidate_id,
          author_id,
          content,
          is_private,
          created_at,
          updated_at
        `)
        .eq('job_candidate_id', jobCandidateId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Database candidate notes fetch error:', error)
        throw new Error(`Failed to fetch candidate notes: ${error.message}`)
      }

      return (data || []).map(note => ({
        id: note.id,
        orgId: note.org_id,
        jobCandidateId: note.job_candidate_id,
        authorId: note.author_id,
        content: note.content,
        isPrivate: note.is_private,
        createdAt: note.created_at,
        updatedAt: note.updated_at
      })) as CandidateNotes[]
    } catch (err) {
      console.error('Candidate notes fetch exception:', err)
      throw err
    }
  }

  async createCandidateNote(note: InsertCandidateNotes): Promise<CandidateNotes> {
    try {
      const dbNote = {
        org_id: note.orgId,
        job_candidate_id: note.jobCandidateId,
        author_id: note.authorId,
        content: note.content,
        is_private: note.isPrivate || 'false',
        updated_at: new Date().toISOString()
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

      return {
        id: data.id,
        orgId: data.org_id,
        jobCandidateId: data.job_candidate_id,
        authorId: data.author_id,
        content: data.content,
        isPrivate: data.is_private,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      } as CandidateNotes
    } catch (err) {
      console.error('Candidate note creation exception:', err)
      throw err
    }
  }

  async getInterview(id: string): Promise<Interview | undefined> {
    try {
      const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return undefined // Not found
        console.error('Database interview fetch error:', error)
        throw new Error(`Failed to fetch interview: ${error.message}`)
      }

      return {
        id: data.id,
        orgId: data.org_id,
        jobCandidateId: data.job_candidate_id,
        interviewerId: data.interviewer_id,
        title: data.title,
        scheduledAt: data.scheduled_at,
        duration: data.duration,
        location: data.location,
        type: data.type,
        status: data.status,
        notes: data.notes,
        feedback: data.feedback,
        rating: data.rating,
        recordStatus: data.record_status || 'active',
        createdAt: data.created_at,
        updatedAt: data.updated_at
      } as Interview
    } catch (err) {
      console.error('Interview fetch exception:', err)
      throw err
    }
  }

  async getInterviews(orgId?: string): Promise<Interview[]> {
    try {
      let query = supabase
        .from('interviews')
        .select('*')
        .order('scheduled_at', { ascending: true })

      if (orgId) {
        query = query.eq('org_id', orgId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Database interviews fetch error:', error)
        throw new Error(`Failed to fetch interviews: ${error.message}`)
      }

      return (data || []).map(interview => ({
        id: interview.id,
        orgId: interview.org_id,
        jobCandidateId: interview.job_candidate_id,
        interviewerId: interview.interviewer_id,
        title: interview.title,
        scheduledAt: interview.scheduled_at,
        duration: interview.duration,
        location: interview.location,
        type: interview.type,
        status: interview.status,
        notes: interview.notes,
        feedback: interview.feedback,
        rating: interview.rating,
        recordStatus: interview.record_status || 'active',
        createdAt: interview.created_at,
        updatedAt: interview.updated_at
      })) as Interview[]
    } catch (err) {
      console.error('Interviews fetch exception:', err)
      throw err
    }
  }

  async getInterviewsByJobCandidate(jobCandidateId: string): Promise<Interview[]> {
    try {
      const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .eq('job_candidate_id', jobCandidateId)
        .order('scheduled_at', { ascending: true })

      if (error) {
        console.error('Database interviews by job candidate fetch error:', error)
        throw new Error(`Failed to fetch interviews by job candidate: ${error.message}`)
      }

      return (data || []).map(interview => ({
        id: interview.id,
        orgId: interview.org_id,
        jobCandidateId: interview.job_candidate_id,
        interviewerId: interview.interviewer_id,
        title: interview.title,
        scheduledAt: interview.scheduled_at,
        duration: interview.duration,
        location: interview.location,
        type: interview.type,
        status: interview.status,
        notes: interview.notes,
        feedback: interview.feedback,
        rating: interview.rating,
        recordStatus: interview.record_status || 'active',
        createdAt: interview.created_at,
        updatedAt: interview.updated_at
      })) as Interview[]
    } catch (err) {
      console.error('Interviews by job candidate fetch exception:', err)
      throw err
    }
  }

  async getInterviewsByDateRange(startDate: Date, endDate: Date): Promise<Interview[]> {
    try {
      const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .gte('scheduled_at', startDate.toISOString())
        .lte('scheduled_at', endDate.toISOString())
        .order('scheduled_at', { ascending: true })

      if (error) {
        console.error('Database interviews by date range fetch error:', error)
        throw new Error(`Failed to fetch interviews by date range: ${error.message}`)
      }

      return (data || []).map(interview => ({
        id: interview.id,
        orgId: interview.org_id,
        jobCandidateId: interview.job_candidate_id,
        interviewerId: interview.interviewer_id,
        title: interview.title,
        scheduledAt: interview.scheduled_at,
        duration: interview.duration,
        location: interview.location,
        type: interview.type,
        status: interview.status,
        notes: interview.notes,
        feedback: interview.feedback,
        rating: interview.rating,
        recordStatus: interview.record_status || 'active',
        createdAt: interview.created_at,
        updatedAt: interview.updated_at
      })) as Interview[]
    } catch (err) {
      console.error('Interviews by date range fetch exception:', err)
      throw err
    }
  }

  async createInterview(interview: InsertInterview): Promise<Interview> {
    try {
      const dbInterview = {
        org_id: interview.orgId,
        job_candidate_id: interview.jobCandidateId,
        interviewer_id: interview.interviewerId,
        title: interview.title,
        scheduled_at: interview.scheduledAt,
        duration: interview.duration,
        location: interview.location,
        type: interview.type,
        status: interview.status || 'scheduled',
        notes: interview.notes,
        feedback: interview.feedback,
        rating: interview.rating,
        record_status: interview.recordStatus || 'active',
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('interviews')
        .insert(dbInterview)
        .select()
        .single()

      if (error) {
        console.error('Database interview creation error:', error)
        throw new Error(`Failed to create interview: ${error.message}`)
      }

      return {
        id: data.id,
        orgId: data.org_id,
        jobCandidateId: data.job_candidate_id,
        interviewerId: data.interviewer_id,
        title: data.title,
        scheduledAt: data.scheduled_at,
        duration: data.duration,
        location: data.location,
        type: data.type,
        status: data.status,
        notes: data.notes,
        feedback: data.feedback,
        rating: data.rating,
        recordStatus: data.record_status || 'active',
        createdAt: data.created_at,
        updatedAt: data.updated_at
      } as Interview
    } catch (err) {
      console.error('Interview creation exception:', err)
      throw err
    }
  }

  async updateInterview(id: string, interview: Partial<InsertInterview>): Promise<Interview> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      }

      if (interview.title !== undefined) updateData.title = interview.title
      if (interview.scheduledAt !== undefined) updateData.scheduled_at = interview.scheduledAt
      if (interview.duration !== undefined) updateData.duration = interview.duration
      if (interview.location !== undefined) updateData.location = interview.location
      if (interview.type !== undefined) updateData.type = interview.type
      if (interview.status !== undefined) updateData.status = interview.status
      if (interview.notes !== undefined) updateData.notes = interview.notes
      if (interview.feedback !== undefined) updateData.feedback = interview.feedback
      if (interview.rating !== undefined) updateData.rating = interview.rating
      if (interview.recordStatus !== undefined) updateData.record_status = interview.recordStatus
      if (interview.interviewerId !== undefined) updateData.interviewer_id = interview.interviewerId

      const { data, error } = await supabase
        .from('interviews')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Database interview update error:', error)
        throw new Error(`Failed to update interview: ${error.message}`)
      }

      return {
        id: data.id,
        orgId: data.org_id,
        jobCandidateId: data.job_candidate_id,
        interviewerId: data.interviewer_id,
        title: data.title,
        scheduledAt: data.scheduled_at,
        duration: data.duration,
        location: data.location,
        type: data.type,
        status: data.status,
        notes: data.notes,
        feedback: data.feedback,
        rating: data.rating,
        recordStatus: data.record_status || 'active',
        createdAt: data.created_at,
        updatedAt: data.updated_at
      } as Interview
    } catch (err) {
      console.error('Interview update exception:', err)
      throw err
    }
  }

  async deleteInterview(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('interviews')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Database interview deletion error:', error)
        throw new Error(`Failed to delete interview: ${error.message}`)
      }
    } catch (err) {
      console.error('Interview deletion exception:', err)
      throw err
    }
  }

  async getMessage(id: string): Promise<Message | undefined> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return undefined // Not found
        console.error('Database message fetch error:', error)
        throw new Error(`Failed to fetch message: ${error.message}`)
      }

      return {
        id: data.id,
        orgId: data.org_id,
        type: data.type,
        priority: data.priority,
        subject: data.subject,
        content: data.content,
        senderId: data.sender_id,
        recipientId: data.recipient_id,
        clientId: data.client_id,
        jobId: data.job_id,
        candidateId: data.candidate_id,
        jobCandidateId: data.job_candidate_id,
        isRead: data.is_read,
        readAt: data.read_at,
        isArchived: data.is_archived,
        threadId: data.thread_id,
        replyToId: data.reply_to_id,
        attachments: data.attachments,
        tags: data.tags,
        recordStatus: data.record_status,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      } as Message
    } catch (err) {
      console.error('Message fetch exception:', err)
      throw err
    }
  }

  async getMessages(userId?: string): Promise<Message[]> {
    try {
      let query = supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })

      if (userId) {
        query = query.or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      }

      const { data, error } = await query

      if (error) {
        console.error('Database messages fetch error:', error)
        throw new Error(`Failed to fetch messages: ${error.message}`)
      }

      return (data || []).map(message => ({
        id: message.id,
        orgId: message.org_id,
        type: message.type,
        priority: message.priority,
        subject: message.subject,
        content: message.content,
        senderId: message.sender_id,
        recipientId: message.recipient_id,
        clientId: message.client_id,
        jobId: message.job_id,
        candidateId: message.candidate_id,
        jobCandidateId: message.job_candidate_id,
        isRead: message.is_read,
        readAt: message.read_at,
        isArchived: message.is_archived || false,
        threadId: message.thread_id,
        replyToId: message.reply_to_id,
        attachments: message.attachments,
        tags: message.tags,
        recordStatus: message.record_status || 'active',
        createdAt: message.created_at,
        updatedAt: message.updated_at
      })) as Message[]
    } catch (err) {
      console.error('Messages fetch exception:', err)
      throw err
    }
  }

  async getMessagesByThread(threadId: string): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('thread_id', threadId)
        .eq('record_status', 'active')
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Database messages by thread fetch error:', error)
        throw new Error(`Failed to fetch messages by thread: ${error.message}`)
      }

      return (data || []).map(message => ({
        id: message.id,
        orgId: message.org_id,
        type: message.type,
        priority: message.priority,
        subject: message.subject,
        content: message.content,
        senderId: message.sender_id,
        recipientId: message.recipient_id,
        clientId: message.client_id,
        jobId: message.job_id,
        candidateId: message.candidate_id,
        jobCandidateId: message.job_candidate_id,
        isRead: message.is_read,
        readAt: message.read_at,
        isArchived: message.is_archived,
        threadId: message.thread_id,
        replyToId: message.reply_to_id,
        attachments: message.attachments,
        tags: message.tags,
        recordStatus: message.record_status,
        createdAt: message.created_at,
        updatedAt: message.updated_at
      })) as Message[]
    } catch (err) {
      console.error('Messages by thread fetch exception:', err)
      throw err
    }
  }

  async getMessagesByContext(params: { clientId?: string; jobId?: string; candidateId?: string }): Promise<Message[]> {
    try {
      let query = supabase
        .from('messages')
        .select('*')
        .eq('record_status', 'active')
        .order('created_at', { ascending: false })

      if (params.clientId) {
        query = query.eq('client_id', params.clientId)
      }
      if (params.jobId) {
        query = query.eq('job_id', params.jobId)
      }
      if (params.candidateId) {
        query = query.eq('candidate_id', params.candidateId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Database messages by context fetch error:', error)
        throw new Error(`Failed to fetch messages by context: ${error.message}`)
      }

      return (data || []).map(message => ({
        id: message.id,
        orgId: message.org_id,
        type: message.type,
        priority: message.priority,
        subject: message.subject,
        content: message.content,
        senderId: message.sender_id,
        recipientId: message.recipient_id,
        clientId: message.client_id,
        jobId: message.job_id,
        candidateId: message.candidate_id,
        jobCandidateId: message.job_candidate_id,
        isRead: message.is_read,
        readAt: message.read_at,
        isArchived: message.is_archived,
        threadId: message.thread_id,
        replyToId: message.reply_to_id,
        attachments: message.attachments,
        tags: message.tags,
        recordStatus: message.record_status,
        createdAt: message.created_at,
        updatedAt: message.updated_at
      })) as Message[]
    } catch (err) {
      console.error('Messages by context fetch exception:', err)
      throw err
    }
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    try {
      const dbMessage = {
        org_id: message.orgId,
        type: message.type,
        priority: message.priority || 'normal',
        subject: message.subject,
        content: message.content,
        sender_id: message.senderId,
        recipient_id: message.recipientId,
        client_id: message.clientId,
        job_id: message.jobId,
        candidate_id: message.candidateId,
        job_candidate_id: message.jobCandidateId,
        is_read: message.isRead || false,
        thread_id: message.threadId,
        reply_to_id: message.replyToId,
        attachments: message.attachments,
        tags: message.tags
      }

      const { data, error } = await supabase
        .from('messages')
        .insert(dbMessage)
        .select()
        .single()

      if (error) {
        console.error('Database message creation error:', error)
        throw new Error(`Failed to create message: ${error.message}`)
      }

      return {
        id: data.id,
        orgId: data.org_id,
        type: data.type,
        priority: data.priority,
        subject: data.subject,
        content: data.content,
        senderId: data.sender_id,
        recipientId: data.recipient_id,
        clientId: data.client_id,
        jobId: data.job_id,
        candidateId: data.candidate_id,
        jobCandidateId: data.job_candidate_id,
        isRead: data.is_read,
        readAt: data.read_at,
        isArchived: data.is_archived || false,
        threadId: data.thread_id,
        replyToId: data.reply_to_id,
        attachments: data.attachments,
        tags: data.tags,
        recordStatus: data.record_status || 'active',
        createdAt: data.created_at,
        updatedAt: data.updated_at
      } as Message
    } catch (err) {
      console.error('Message creation exception:', err)
      throw err
    }
  }

  async updateMessage(id: string, message: Partial<InsertMessage>): Promise<Message> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      }

      if (message.subject !== undefined) updateData.subject = message.subject
      if (message.content !== undefined) updateData.content = message.content
      if (message.priority !== undefined) updateData.priority = message.priority
      if (message.isRead !== undefined) updateData.is_read = message.isRead
      if (message.isArchived !== undefined) updateData.is_archived = message.isArchived
      if (message.tags !== undefined) updateData.tags = message.tags

      const { data, error } = await supabase
        .from('messages')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Database message update error:', error)
        throw new Error(`Failed to update message: ${error.message}`)
      }

      return {
        id: data.id,
        orgId: data.org_id,
        type: data.type,
        priority: data.priority,
        subject: data.subject,
        content: data.content,
        senderId: data.sender_id,
        recipientId: data.recipient_id,
        clientId: data.client_id,
        jobId: data.job_id,
        candidateId: data.candidate_id,
        jobCandidateId: data.job_candidate_id,
        isRead: data.is_read,
        readAt: data.read_at,
        isArchived: data.is_archived,
        threadId: data.thread_id,
        replyToId: data.reply_to_id,
        attachments: data.attachments,
        tags: data.tags,
        recordStatus: data.record_status,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      } as Message
    } catch (err) {
      console.error('Message update exception:', err)
      throw err
    }
  }

  async markMessageAsRead(messageId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('messages')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .eq('recipient_id', userId)

      if (error) {
        console.error('Database mark message as read error:', error)
        throw new Error(`Failed to mark message as read: ${error.message}`)
      }
    } catch (err) {
      console.error('Mark message as read exception:', err)
      throw err
    }
  }

  async archiveMessage(messageId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('messages')
        .update({
          is_archived: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId)

      if (error) {
        console.error('Database archive message error:', error)
        throw new Error(`Failed to archive message: ${error.message}`)
      }
    } catch (err) {
      console.error('Archive message exception:', err)
      throw err
    }
  }

  async addMessageRecipients(messageId: string, recipientIds: string[]): Promise<MessageRecipient[]> {
    try {
      const recipients = recipientIds.map(recipientId => ({
        message_id: messageId,
        recipient_id: recipientId,
        is_read: false
      }))

      const { data, error } = await supabase
        .from('message_recipients')
        .insert(recipients)
        .select()

      if (error) {
        console.error('Database add message recipients error:', error)
        throw new Error(`Failed to add message recipients: ${error.message}`)
      }

      return (data || []).map(recipient => ({
        id: recipient.id,
        orgId: recipient.org_id,
        messageId: recipient.message_id,
        recipientId: recipient.recipient_id,
        isRead: recipient.is_read,
        readAt: recipient.read_at,
        createdAt: recipient.created_at
      })) as MessageRecipient[]
    } catch (err) {
      console.error('Add message recipients exception:', err)
      throw err
    }
  }

  async getUnreadMessageCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', userId)
        .eq('is_read', false)

      if (error) {
        console.error('Database unread message count error:', error)
        throw new Error(`Failed to get unread message count: ${error.message}`)
      }

      return count || 0
    } catch (err) {
      console.error('Unread message count exception:', err)
      throw err
    }
  }

  // Pipeline Columns
  async getPipelineColumns(orgId: string): Promise<PipelineColumn[]> {
    try {
      const { data, error } = await supabase
        .from('pipeline_columns')
        .select('*')
        .eq('org_id', orgId)
        .order('position', { ascending: true })
      
      if (error) {
        console.error('Database pipeline columns fetch error:', error)
        throw new Error(`Failed to fetch pipeline columns: ${error.message}`)
      }
      
      return data as PipelineColumn[] || []
    } catch (err) {
      console.error('Pipeline columns fetch exception:', err)
      throw err
    }
  }

  async createPipelineColumn(column: InsertPipelineColumn): Promise<PipelineColumn> {
    try {
      const dbColumn = {
        title: column.title,
        position: column.position,
        org_id: column.orgId,
        updated_at: new Date()
      }
      
      const { data, error } = await supabase
        .from('pipeline_columns')
        .insert(dbColumn)
        .select()
        .single()
      
      if (error) {
        console.error('Database pipeline column creation error:', error)
        throw new Error(`Failed to create pipeline column: ${error.message}`)
      }
      
      return data as PipelineColumn
    } catch (err) {
      console.error('Pipeline column creation exception:', err)
      throw err
    }
  }

  async publishJob(jobId: string): Promise<Job> {
    const { data, error } = await supabase
      .from('jobs')
      .update({ 
        status: 'open',
        published_at: new Date().toISOString()
      })
      .eq('id', jobId)
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to publish job: ${error.message}`)
    }
    
    return data as Job
  }

  async submitJobApplication(applicationData: {
    jobId: string;
    name: string;
    email: string;
    phone?: string;
    resumeUrl?: string;
  }): Promise<{ candidateId: string; applicationId: string }> {
    try {
      // First get the job to determine orgId
      const job = await this.getJob(applicationData.jobId);
      if (!job) {
        throw new Error('Job not found');
      }

      // Check if candidate already exists by email in this org
      let candidate = await this.getCandidateByEmail(applicationData.email, job.orgId);

      if (!candidate) {
        // Create new candidate
        candidate = await this.createCandidate({
          name: applicationData.name,
          email: applicationData.email,
          phone: applicationData.phone || null,
          resumeUrl: applicationData.resumeUrl || null,
          orgId: job.orgId,
          status: 'active'
        });
      } else {
        // Update existing candidate with new resume if provided
        if (applicationData.resumeUrl) {
          candidate = await this.updateCandidate(candidate.id, {
            resumeUrl: applicationData.resumeUrl
          });
        }
      }

      // Check if application already exists
      const existingApplication = await this.getJobCandidateByJobAndCandidate(
        applicationData.jobId, 
        candidate.id
      );

      if (existingApplication) {
        throw new Error('You have already applied to this job');
      }

      // Get the "Applied" pipeline column for this job's org
      const pipelineColumns = await this.getPipelineColumns(job.orgId);
      let appliedColumn = pipelineColumns.find(col => 
        col.title.toLowerCase().includes('applied') || 
        col.title.toLowerCase().includes('application')
      );

      // If no "Applied" column exists, use the first column or create default pipeline
      if (!appliedColumn && pipelineColumns.length > 0) {
        appliedColumn = pipelineColumns[0]; // Use first column as fallback
      }

      if (!appliedColumn) {
        // Create default pipeline columns if none exist
        appliedColumn = await this.createPipelineColumn({
          title: 'Applied',
          position: 0,
          orgId: job.orgId
        });
        
        // Create other default columns
        await this.createPipelineColumn({
          title: 'Screen',
          position: 1,
          orgId: job.orgId
        });
        
        await this.createPipelineColumn({
          title: 'Interview',
          position: 2,
          orgId: job.orgId
        });
        
        await this.createPipelineColumn({
          title: 'Offer',
          position: 3,
          orgId: job.orgId
        });
        
        await this.createPipelineColumn({
          title: 'Hired',
          position: 4,
          orgId: job.orgId
        });
      }

      // Create job-candidate relationship and place in "Applied" column
      const jobCandidate = await this.createJobCandidate({
        orgId: job.orgId,
        jobId: applicationData.jobId,
        candidateId: candidate.id,
        pipelineColumnId: appliedColumn.id,
        stage: 'applied'
      });

      // Send email notification to hiring managers/recruiters
      try {
        // Get organization details
        const organization = await this.getOrganization(job.orgId);
        if (organization) {
          // Get team members who should be notified (hiring managers, recruiters, admins)
          const teamMembers = await this.getUserOrganizations(job.orgId);
          const notificationRecipients = teamMembers.filter((member: any) => 
            ['hiring_manager', 'recruiter', 'admin'].includes(member.role || '')
          );

          // Send notification emails
          for (const recipient of notificationRecipients) {
            const userProfile = await this.getUserProfile(recipient.userId);
            if (userProfile?.id) {
              // For now, use a placeholder email until user profile includes email
              const email = userProfile.id + '@example.com'; // Temporary - should be real email from auth
              await atsEmailService.sendNewApplicationNotification(
                email,
                candidate.name,
                job.title,
                organization.name
              );
            }
          }
        }
      } catch (emailError) {
        console.warn('Failed to send application notification email:', emailError);
        // Don't fail the application if email fails
      }

      return {
        candidateId: candidate.id,
        applicationId: jobCandidate.id
      };
    } catch (err) {
      console.error('Job application submission exception:', err);
      throw err;
    }
  }

  async getJobCandidateByJobAndCandidate(jobId: string, candidateId: string): Promise<JobCandidate | undefined> {
    try {
      const { data, error } = await supabase
        .from('job_candidate')
        .select('*')
        .eq('job_id', jobId)
        .eq('candidate_id', candidateId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return undefined; // Not found
        console.error('Database job candidate fetch error:', error);
        throw new Error(`Failed to fetch job candidate: ${error.message}`);
      }

      return data as JobCandidate;
    } catch (err) {
      console.error('Job candidate by job and candidate exception:', err);
      throw err;
    }
  }

  // Enhanced search for candidates with advanced filtering
  async searchCandidatesAdvanced(filters: {
    orgId: string;
    searchTerm?: string;
    jobId?: string;
    stage?: string;
    status?: string;
    skills?: string[];
    dateRange?: { start: Date; end: Date };
  }): Promise<Candidate[]> {
    try {
      let query = supabase
        .from('candidates')
        .select(`
          *,
          job_candidate!inner(
            stage,
            status,
            job_id,
            created_at
          )
        `)
        .eq('org_id', filters.orgId);

      // Filter by search term (name, email)
      if (filters.searchTerm) {
        query = query.or(`name.ilike.%${filters.searchTerm}%,email.ilike.%${filters.searchTerm}%`);
      }

      // Filter by specific job
      if (filters.jobId) {
        query = query.eq('job_candidate.job_id', filters.jobId);
      }

      // Filter by pipeline stage
      if (filters.stage) {
        query = query.eq('job_candidate.stage', filters.stage);
      }

      // Filter by status
      if (filters.status) {
        query = query.eq('job_candidate.status', filters.status);
      }

      // Filter by date range
      if (filters.dateRange) {
        query = query
          .gte('job_candidate.created_at', filters.dateRange.start.toISOString())
          .lte('job_candidate.created_at', filters.dateRange.end.toISOString());
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Advanced candidate search error:', error);
        throw new Error(`Failed to search candidates: ${error.message}`);
      }

      return data as Candidate[];
    } catch (err) {
      console.error('Advanced candidate search exception:', err);
      throw err;
    }
  }

  // Enhanced search for jobs with advanced filtering
  async searchJobsAdvanced(filters: {
    orgId: string;
    searchTerm?: string;
    status?: string;
    clientId?: string;
    experienceLevel?: string;
    remoteOption?: string;
  }): Promise<Job[]> {
    try {
      let query = supabase
        .from('jobs')
        .select('*')
        .eq('org_id', filters.orgId);

      // Filter by search term (title, description, location)
      if (filters.searchTerm) {
        query = query.or(`title.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%,location.ilike.%${filters.searchTerm}%`);
      }

      // Filter by status
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      // Filter by client
      if (filters.clientId) {
        query = query.eq('client_id', filters.clientId);
      }

      // Filter by experience level
      if (filters.experienceLevel) {
        query = query.eq('experience_level', filters.experienceLevel);
      }

      // Filter by remote option
      if (filters.remoteOption) {
        query = query.eq('remote_option', filters.remoteOption);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Advanced job search error:', error);
        throw new Error(`Failed to search jobs: ${error.message}`);
      }

      return data as Job[];
    } catch (err) {
      console.error('Advanced job search exception:', err);
      throw err;
    }
  }

  // Resume parsing functionality
  async parseAndUpdateCandidate(candidateId: string, resumeText?: string): Promise<Candidate> {
    try {
      // Get the current candidate
      const { data: candidateData, error: candidateError } = await this.supabase
        .from('candidates')
        .select('*')
        .eq('id', candidateId)
        .single();

      if (candidateError || !candidateData) {
        throw new Error('Candidate not found');
      }

      const candidate = candidateData as Candidate;

      let parsedData: ParsedResumeData | null = null;

      // Parse resume text if provided
      if (resumeText) {
        try {
          parsedData = await resumeParsingService.parseResumeText(resumeText);
        } catch (error) {
          console.error('Resume parsing failed:', error);
          // Continue without parsing rather than failing completely
        }
      }

      // Update candidate with parsed data
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (parsedData) {
        // Extract all skills for searchable array
        const allSkills = [
          ...parsedData.skills.technical,
          ...parsedData.skills.soft,
          ...parsedData.skills.certifications,
        ];

        updateData.resume_parsed = true;
        updateData.skills = allSkills;
        updateData.experience_level = parsedData.experienceLevel;
        updateData.total_years_experience = parsedData.totalYearsExperience;
        updateData.education = JSON.stringify(parsedData.education);
        updateData.summary = parsedData.summary;
        updateData.searchable_content = resumeParsingService.extractSearchableContent(parsedData);

        // Update name and contact info if parsed and not already set
        if (parsedData.personalInfo.name && !candidate.name.trim()) {
          updateData.name = parsedData.personalInfo.name;
        }
        if (parsedData.personalInfo.email && !candidate.email.trim()) {
          updateData.email = parsedData.personalInfo.email;
        }
        if (parsedData.personalInfo.phone && !candidate.phone) {
          updateData.phone = parsedData.personalInfo.phone;
        }
      }

      // Update the candidate
      const { data, error } = await this.supabase
        .from('candidates')
        .update(updateData)
        .eq('id', candidateId)
        .select()
        .single();

      if (error) {
        console.error('Error updating candidate with parsed data:', error);
        throw error;
      }

      return data as Candidate;
    } catch (error) {
      console.error('Error in parseAndUpdateCandidate:', error);
      throw error;
    }
  }

  async searchCandidatesBySkills(orgId: string, skills: string[]): Promise<Candidate[]> {
    try {
      if (!skills.length) {
        return [];
      }

      // Search candidates by skills array or searchable content
      let query = supabase
        .from('candidates')
        .select('*')
        .eq('org_id', orgId)
        .eq('status', 'active');

      // Build skill search conditions using OR for multiple skills
      const skillSearchConditions = skills.map(skill => {
        const cleanSkill = skill.toLowerCase().trim();
        return `skills.cs.{${cleanSkill}},searchable_content.ilike.%${cleanSkill}%`;
      });

      // Combine all skill conditions with OR
      query = query.or(skillSearchConditions.join(','));

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error searching candidates by skills:', error);
        throw error;
      }

      return (data || []) as Candidate[];
    } catch (error) {
      console.error('Error in searchCandidatesBySkills:', error);
      throw error;
    }
  }
}

// Export the clean DatabaseStorage instance - no more MemStorage
export const storage: IStorage = new DatabaseStorage();