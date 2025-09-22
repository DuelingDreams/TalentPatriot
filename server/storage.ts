import { 
  organizations,
  userOrganizations,
  userProfiles,
  userSettings,
  clients, 
  jobs, 
  candidates,
  jobCandidate, 
  candidateNotes,
  pipelineColumns,
  interviews,
  messages,
  messageRecipients,
  betaApplications,
  organizationEmailSettings,
  emailTemplates,
  emailEvents,
  type UserProfile,
  type UserSettings,
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
  type BetaApplication,
  type OrganizationEmailSettings,
  type EmailTemplate,
  type EmailEvent,
  type InsertUserProfile,
  type InsertUserSettings,
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
  type InsertMessageRecipient,
  type InsertBetaApplication,
  type InsertOrganizationEmailSettings,
  type InsertEmailTemplate,
  type InsertEmailEvent
} from "@shared/schema";
import { createClient } from '@supabase/supabase-js';
import { atsEmailService } from './emailService';
import { resumeParsingService, type ParsedResumeData } from './resumeParser';

// Dashboard stats return type
type DashboardStats = {
  totalJobs: number;
  totalCandidates: number;
  totalApplications: number;
  totalHires: number;
  jobsThisMonth: number;
  candidatesThisMonth: number;
  applicationsThisMonth: number;
  hiresThisMonth: number;
  averageTimeToHire?: number;
  conversionRate?: number;
  topSources?: Array<{ source: string; count: number }>;
  recentActivity?: Array<{ type: string; description: string; timestamp: Date }>;
};

// Pipeline candidate return type
type PipelineCandidate = {
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

// Analytics types from the database views
type PipelineSnapshotData = {
  job_id: string;
  job_title: string;
  org_id: string;
  job_status: string;
  applied: number;
  phone_screen: number;
  interview: number;
  technical: number;
  final: number;
  offer: number;
  hired: number;
  rejected: number;
  total_candidates: number;
  created_at: string;
  updated_at: string;
};

type StageTimeData = {
  job_id: string;
  stage: string;
  avg_hours_in_stage: number;
  sample_size: number;
};

type JobHealthData = {
  job_id: string;
  title: string;
  org_id: string;
  job_status: string;
  applied_count: number;
  phone_screen_count: number;
  interview_count: number;
  technical_count: number;
  final_count: number;
  offer_count: number;
  hired_count: number;
  rejected_count: number;
  total_candidates: number;
  health_status: 'Healthy' | 'Needs Attention' | 'Stale' | 'Closed' | 'No Candidates';
  last_active_move: string | null;
  last_any_move: string | null;
};

type DashboardActivityData = {
  changed_at: string;
  job_id: string;
  job_title: string;
  candidate_id: string;
  candidate_name: string;
  from_stage: string | null;
  to_stage: string;
  from_stage_display: string | null;
  to_stage_display: string;
  org_id: string;
};

// Storage interface for ATS system
export interface IStorage {
  // User Profiles
  getUserProfile(id: string): Promise<UserProfile | undefined>;
  createUserProfile(userProfile: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(id: string, userProfile: Partial<InsertUserProfile>): Promise<UserProfile>;
  ensureUserProfile(userId: string): Promise<UserProfile>;
  
  // User Settings
  getUserSettings(userId: string): Promise<UserSettings | undefined>;
  updateUserSettings(userId: string, settings: Partial<InsertUserSettings>): Promise<UserSettings>;
  
  // Performance-optimized methods
  getDashboardStats(orgId: string): Promise<DashboardStats>;
  getPipelineCandidates(jobId: string, orgId: string): Promise<PipelineCandidate[]>;
  searchClients(searchTerm: string, orgId: string): Promise<Client[]>;
  searchJobs(searchTerm: string, orgId: string): Promise<Job[]>;
  searchCandidates(searchTerm: string, orgId: string): Promise<Candidate[]>;
  
  // Analytics methods for new dashboard views
  getPipelineSnapshot(orgId: string, limit?: number): Promise<PipelineSnapshotData[]>;
  getStageTimeAnalytics(orgId: string, jobId?: string): Promise<StageTimeData[]>;
  getJobHealthData(orgId: string): Promise<JobHealthData[]>;
  getDashboardActivity(orgId: string, limit?: number): Promise<DashboardActivityData[]>;
  
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
  deleteJob(id: string): Promise<void>;
  
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
  
  // Job Pipeline Data (unified fetch for consistency)
  getJobPipelineData(jobId: string, orgId: string): Promise<{
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
  
  // Paginated methods with field selection support
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
  
  getMessagesPaginated(params: {
    userId?: string;
    limit?: number;
    cursor?: string;
    fields?: string[];
    threadId?: string;
    type?: string;
    priority?: string;
    clientId?: string;
    jobId?: string;
    candidateId?: string;
  }): Promise<{
    data: Message[];
    pagination: {
      hasMore: boolean;
      nextCursor?: string;
      totalCount?: number;
      limit: number;
    };
  }>;
  
  // Beta Applications
  getBetaApplication(id: string): Promise<BetaApplication | undefined>;
  getBetaApplications(): Promise<BetaApplication[]>;
  createBetaApplication(betaApplication: InsertBetaApplication): Promise<BetaApplication>;
  updateBetaApplication(id: string, betaApplication: Partial<InsertBetaApplication>): Promise<BetaApplication>;
  deleteBetaApplication(id: string): Promise<void>;
  
  // Email Management
  getOrganizationEmailSettings(orgId: string): Promise<OrganizationEmailSettings | undefined>;
  updateOrganizationEmailSettings(orgId: string, settings: Partial<InsertOrganizationEmailSettings>): Promise<OrganizationEmailSettings>;
  getEmailTemplates(orgId: string): Promise<EmailTemplate[]>;
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  updateEmailTemplate(templateId: string, orgId: string, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate>;
  deleteEmailTemplate(templateId: string, orgId: string): Promise<void>;
  getEmailEvents(orgId: string, options?: { limit?: number; eventType?: string; status?: string }): Promise<EmailEvent[]>;
  createEmailEvent(event: InsertEmailEvent): Promise<EmailEvent>;
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
    } catch (error: unknown) {
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

  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No settings found, create default settings
          const defaultSettings = {
            userId,
            emailNotifications: true,
            browserNotifications: true,
            weeklyReports: false,
            teamInvites: true,
            publicProfile: false,
          };
          return await this.updateUserSettings(userId, defaultSettings);
        }
        throw new Error(error.message);
      }

      return data as UserSettings;
    } catch (error) {
      console.error('Error fetching user settings:', error);
      return undefined;
    }
  }

  async updateUserSettings(userId: string, settings: Partial<InsertUserSettings>): Promise<UserSettings> {
    try {
      const dbSettings = {
        user_id: userId,
        email_notifications: settings.emailNotifications,
        browser_notifications: settings.browserNotifications,
        weekly_reports: settings.weeklyReports,
        team_invites: settings.teamInvites,
        public_profile: settings.publicProfile,
      };

      const { data, error } = await supabase
        .from('user_settings')
        .upsert(dbSettings, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) {
        console.error('Database user settings update error:', error);
        throw new Error(`Failed to update user settings: ${error.message}`);
      }

      return data as UserSettings;
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw error;
    }
  }

  // Performance methods
  async getDashboardStats(orgId: string): Promise<DashboardStats> {
    // For now return empty stats, should be implemented with real data later
    return {
      totalJobs: 0,
      totalCandidates: 0, 
      totalApplications: 0,
      totalHires: 0,
      jobsThisMonth: 0,
      candidatesThisMonth: 0,
      applicationsThisMonth: 0,
      hiresThisMonth: 0
    };
  }

  async getPipelineCandidates(jobId: string, orgId: string): Promise<PipelineCandidate[]> {
    // For now return empty array, should be implemented with real data later
    console.log(`Getting pipeline candidates for job ${jobId} in org ${orgId}`);
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
      const dbUpdate: Partial<Record<string, unknown>> = {}
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

  async deleteJob(id: string): Promise<void> {
    const { error } = await supabase
      .from('jobs')
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
      const dbUpdate: Partial<Record<string, unknown>> = {}
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
      const dbUpdate: Partial<Record<string, unknown>> = {}
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
      .eq('status', 'open')
      .not('published_at', 'is', null)
      .eq('record_status', 'active')
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
      .eq('org_id', orgId)
      .eq('status', 'open')
      .not('published_at', 'is', null)
      .eq('record_status', 'active')
      .order('created_at', { ascending: false })
    
    if (error) {
      throw new Error(error.message)
    }
    
    return data as Job[]
  }

  async getPublicJob(id: string): Promise<Job | undefined> {
    const { data, error } = await supabase
      .from('public_jobs')
      .select('*')
      .eq('id', id)
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
      const dbUpdate: Partial<Record<string, unknown>> = {}
      if (updateData.title !== undefined) dbUpdate.title = updateData.title
      if (updateData.description !== undefined) dbUpdate.description = updateData.description
      if (updateData.status !== undefined) dbUpdate.status = updateData.status
      if (updateData.clientId !== undefined) dbUpdate.client_id = updateData.clientId
      if (updateData.assignedTo !== undefined) dbUpdate.assigned_to = updateData.assignedTo
      if (updateData.recordStatus !== undefined) dbUpdate.record_status = updateData.recordStatus
      if (updateData.location !== undefined) dbUpdate.location = updateData.location
      if (updateData.jobType !== undefined) dbUpdate.job_type = updateData.jobType
      if (updateData.remoteOption !== undefined) dbUpdate.remote_option = updateData.remoteOption
      if (updateData.salaryRange !== undefined) dbUpdate.salary_range = updateData.salaryRange
      if (updateData.experienceLevel !== undefined) dbUpdate.experience_level = updateData.experienceLevel
      if (updateData.updatedAt !== undefined) dbUpdate.updated_at = updateData.updatedAt
      
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





  async moveJobCandidate(applicationOrCandidateId: string, newColumnId: string): Promise<JobCandidate> {
    console.log(`[moveJobCandidate] Starting transactional move: applicationOrCandidateId=${applicationOrCandidateId}, newColumnId=${newColumnId}`);
    
    // Try the RPC transaction first, fall back to direct method if RPC doesn't exist
    try {
      const { data: transactionResult, error: transactionError } = await supabase.rpc('move_job_candidate_transaction', {
        p_application_or_candidate_id: applicationOrCandidateId,
        p_new_column_id: newColumnId
      });

      if (transactionError) {
        // If RPC function doesn't exist, fall back to direct method
        if (transactionError.message?.includes('function') && transactionError.message?.includes('does not exist')) {
          console.log(`[moveJobCandidate] RPC function not available, using direct method`);
          return await this.moveJobCandidateDirect(applicationOrCandidateId, newColumnId);
        }
        
        console.error(`[moveJobCandidate] Transaction failed:`, transactionError);
        
        // Handle specific error types for better user feedback
        if (transactionError.message?.includes('not found')) {
          throw new Error(`Application not found. It may have been removed or archived.`);
        } else if (transactionError.message?.includes('invalid column')) {
          throw new Error(`Invalid target column. The pipeline stage may have been deleted.`);
        } else if (transactionError.message?.includes('permission')) {
          throw new Error(`Permission denied. You don't have access to move this application.`);
        } else if (transactionError.message?.includes('concurrent')) {
          throw new Error(`Concurrent modification detected. Please refresh and try again.`);
        } else {
          throw new Error(`Move operation failed: ${transactionError.message}`);
        }
      }

      if (!transactionResult) {
        throw new Error(`Move operation completed but no data returned.`);
      }

      console.log(`[moveJobCandidate] Transaction completed successfully:`, transactionResult);
      return transactionResult as JobCandidate;
    } catch (error) {
      // If any error with RPC, fall back to direct method
      console.log(`[moveJobCandidate] RPC failed, falling back to direct method:`, error);
      return await this.moveJobCandidateDirect(applicationOrCandidateId, newColumnId);
    }
  }

  // Fallback method for direct database operations when RPC is not available
  private async moveJobCandidateDirect(applicationOrCandidateId: string, newColumnId: string): Promise<JobCandidate> {
    console.log(`[moveJobCandidateDirect] Starting move: applicationOrCandidateId=${applicationOrCandidateId}, newColumnId=${newColumnId}`);
    
    // Try to find the job_candidate record - first try by ID (application ID)
    let jobCandidateData;
    let findError;
    
    // First attempt: Try by job_candidate.id (application ID)
    const { data: byIdData, error: byIdError } = await supabase
      .from('job_candidate')
      .select('id, pipeline_column_id, stage, candidate_id, job_id, org_id, updated_at')
      .eq('id', applicationOrCandidateId)
      .single();
    
    if (byIdData && !byIdError) {
      jobCandidateData = byIdData;
      console.log(`[moveJobCandidateDirect] Found by application ID: ${applicationOrCandidateId}`);
    } else {
      // Second attempt: Try by candidate_id
      const { data: byCandidateData, error: byCandidateError } = await supabase
        .from('job_candidate')
        .select('id, pipeline_column_id, stage, candidate_id, job_id, org_id, updated_at')
        .eq('candidate_id', applicationOrCandidateId)
        .single();
      
      if (byCandidateData && !byCandidateError) {
        jobCandidateData = byCandidateData;
        console.log(`[moveJobCandidateDirect] Found by candidate ID: ${applicationOrCandidateId}`);
      } else {
        findError = byCandidateError;
      }
    }
    
    if (!jobCandidateData) {
      console.error(`[moveJobCandidateDirect] Job candidate lookup failed:`, {
        applicationOrCandidateId,
        byIdError,
        byCandidateError: findError
      });
      throw new Error(`Job candidate not found for ID: ${applicationOrCandidateId}`);
    }
    
    const jobCandidateId = jobCandidateData.id;
    console.log(`[moveJobCandidateDirect] Using job_candidate ID: ${jobCandidateId} for input ID: ${applicationOrCandidateId}`);
    
    // Verify column exists and get its title for stage mapping
    const { data: columnData, error: columnError } = await supabase
      .from('pipeline_columns')
      .select('title, org_id, job_id')
      .eq('id', newColumnId)
      .single();
    
    if (columnError) {
      console.error(`[moveJobCandidateDirect] Column lookup failed:`, columnError);
      throw new Error(`Failed to get column info: ${columnError.message}`);
    }

    // Security check: Verify organization and job ownership
    if (columnData.org_id !== jobCandidateData.org_id) {
      throw new Error(`Permission denied: Column belongs to different organization`);
    }
    
    if (columnData.job_id && columnData.job_id !== jobCandidateData.job_id) {
      throw new Error(`Permission denied: Column belongs to different job`);
    }
    
    // Map column title to stage with correct enum values
    // Valid enum values: ['applied', 'phone_screen', 'interview', 'technical', 'final', 'offer', 'hired', 'rejected']
    const stageMapping: Record<string, string> = {
      'applied': 'applied',
      'screen': 'phone_screen', // Map "Screen" column to 'phone_screen' enum
      'phone_screen': 'phone_screen', // Direct mapping
      'phone screen': 'phone_screen', // Handle spaces
      'screening': 'phone_screen', // Legacy support for 'screening'
      'interview': 'interview',
      'technical': 'technical',
      'final': 'final',
      'offer': 'offer',
      'hired': 'hired',
      'rejected': 'rejected'
    };
    
    const normalizedTitle = columnData.title.toLowerCase().replace(/\s+/g, '_');
    const directTitle = columnData.title.toLowerCase();
    const stage = stageMapping[normalizedTitle] || stageMapping[directTitle] || 'applied';
    
    // Validate the stage is a valid enum value - Use correct database enum values
    const validStages = ['applied', 'phone_screen', 'interview', 'technical', 'final', 'offer', 'hired', 'rejected'];
    if (!validStages.includes(stage)) {
      console.error(`[moveJobCandidateDirect] Invalid stage mapping: "${stage}" for column "${columnData.title}"`);
      throw new Error(`Invalid stage value: ${stage}. Valid stages are: ${validStages.join(', ')}`);
    }
    
    console.log(`[moveJobCandidateDirect] Column "${columnData.title}" (normalized: "${normalizedTitle}", direct: "${directTitle}") mapped to stage "${stage}"`);
    
    // Atomic update with conflict detection - ensure we use correct field names
    console.log(`[moveJobCandidateDirect] Attempting update with:`, {
      jobCandidateId,
      newColumnId,
      stage,
      targetStage: stage
    });
    
    // Database update with proper error handling
    const { data, error } = await supabase
      .from('job_candidate')
      .update({
        pipeline_column_id: newColumnId,
        stage: stage,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobCandidateId)
      .select()
      .single();
    
    if (error) {
      console.error(`[moveJobCandidateDirect] Update failed:`, error);
      
      // Provide specific error messages for common issues
      if (error.message?.includes('invalid input value for enum')) {
        throw new Error(`Invalid stage value. Please contact support if this error persists.`);
      } else if (error.message?.includes('foreign key')) {
        throw new Error(`Invalid column reference. The pipeline column may have been deleted.`);
      } else if (error.message?.includes('not found')) {
        throw new Error(`Application not found. It may have been removed or archived.`);
      } else {
        throw new Error(`Failed to move application: ${error.message}`);
      }
    }

    // Check if the update actually affected any rows
    if (!data) {
      console.warn(`[moveJobCandidateDirect] No rows updated - record may have been deleted`);
      throw new Error(`Application not found or may have been deleted. Please refresh and try again.`);
    }
    
    console.log(`[moveJobCandidateDirect] Successfully updated:`, {
      id: data.id,
      pipeline_column_id: data.pipeline_column_id,
      stage: data.stage,
      updated_at: data.updated_at
    });
    
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
      const dbUpdate: Partial<Record<string, unknown>> = {}
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
      const dbUpdate: Partial<Record<string, unknown>> = {}
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
      console.log('[STORAGE] Fetching candidate notes for jobCandidateId:', jobCandidateId);
      
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

      console.log('[STORAGE] Raw notes data:', data?.length || 0, 'notes found');

      // Get author emails for the notes
      const notes = data || [];
      const authorIds = Array.from(new Set(notes.map(note => note.author_id)));
      
      let authorEmails: Record<string, string> = {};
      
      if (authorIds.length > 0) {
        try {
          // First try to get emails from user_profiles table
          const { data: profiles } = await supabase
            .from('user_profiles')
            .select('id, first_name, last_name')
            .in('id', authorIds);
          
          // Then try to get emails from auth.users (requires special handling)
          // For now, we'll create a mock email from the author ID
          authorIds.forEach(authorId => {
            const profile = profiles?.find(p => p.id === authorId);
            if (profile && profile.first_name && profile.last_name) {
              // Create email-like string from name
              const name = `${profile.first_name} ${profile.last_name}`.toLowerCase().replace(/\s+/g, '');
              authorEmails[authorId] = `${name}@company.com`;
            } else {
              // Fallback: create email from ID
              authorEmails[authorId] = `user_${authorId.split('-')[0]}@company.com`;
            }
          });
          
          console.log('[STORAGE] Author emails resolved:', Object.keys(authorEmails).length);
        } catch (emailError) {
          console.warn('[STORAGE] Failed to fetch author emails, using fallback:', emailError);
          // Fallback: create emails from author IDs
          authorIds.forEach(authorId => {
            authorEmails[authorId] = `user_${authorId.split('-')[0]}@company.com`;
          });
        }
      }

      const enrichedNotes = notes.map(note => ({
        id: note.id,
        orgId: note.org_id,
        jobCandidateId: note.job_candidate_id,
        authorId: note.author_id,
        authorEmail: authorEmails[note.author_id] || `user_${note.author_id.split('-')[0]}@company.com`,
        content: note.content,
        isPrivate: note.is_private === true || note.is_private === 'true',
        createdAt: note.created_at,
        updatedAt: note.updated_at
      })) as (CandidateNotes & { authorEmail: string })[];

      console.log('[STORAGE] Returning enriched notes:', enrichedNotes.length);
      return enrichedNotes;
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
        is_private: Boolean(note.isPrivate),
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
        isPrivate: data.is_private === true || data.is_private === 'true',
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
      const updateData: Partial<Record<string, unknown>> = {
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
      const updateData: Partial<Record<string, unknown>> = {
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

  // Job Pipeline Data (unified fetch for consistency)
  async getJobPipelineData(jobId: string, orgId: string): Promise<{
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
  }> {
    console.log(`[getJobPipelineData] Fetching pipeline data for job: ${jobId}, org: ${orgId}`);
    
    try {
      // Get pipeline columns for this job (using same client as move operations)
      const { data: columns, error: columnsError } = await supabase
        .from('pipeline_columns')
        .select('*')
        .eq('job_id', jobId)
        .eq('org_id', orgId)
        .order('position');

      if (columnsError) {
        console.error('[getJobPipelineData] Error fetching pipeline columns:', columnsError);
        throw new Error(`Failed to fetch pipeline columns: ${columnsError.message}`);
      }

      // Get applications for this job (using same client as move operations)
      const { data: applications, error: applicationsError } = await supabase
        .from('job_candidate')
        .select(`
          id,
          job_id,
          candidate_id,
          pipeline_column_id,
          status,
          created_at,
          stage,
          notes,
          candidate:candidates(id, name, email, phone, resume_url)
        `)
        .eq('job_id', jobId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (applicationsError) {
        console.error('[getJobPipelineData] Error fetching applications:', applicationsError);
        throw new Error(`Failed to fetch applications: ${applicationsError.message}`);
      }

      console.log(`[getJobPipelineData] Found ${columns?.length || 0} columns and ${applications?.length || 0} applications`);
      
      // Log applications for debugging
      applications?.forEach((app: unknown) => {
        console.log(`[getJobPipelineData] Application ${app.id}: candidateName="${app.candidate?.name}", columnId="${app.pipeline_column_id}"`);
      });

      // Transform data to match frontend interface
      const pipelineData = {
        columns: columns?.map((col: unknown) => ({
          id: col.id,
          title: col.title,
          position: col.position.toString()
        })) || [],
        applications: applications?.map((app: unknown) => ({
          id: app.id,
          jobId: app.job_id,
          candidateId: app.candidate_id,
          columnId: app.pipeline_column_id,
          status: app.status,
          appliedAt: app.created_at,
          candidate: app.candidate ? {
            id: app.candidate.id,
            name: app.candidate.name,
            email: app.candidate.email,
            phone: app.candidate.phone,
            resumeUrl: app.candidate.resume_url
          } : null
        })) || []
      };

      console.log(`[getJobPipelineData] Returning pipeline data:`, {
        columnsCount: pipelineData.columns.length,
        applicationsCount: pipelineData.applications.length
      });

      return pipelineData;
    } catch (error) {
      console.error(`[getJobPipelineData] Error fetching job pipeline data:`, error);
      throw error;
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
          const notificationRecipients = teamMembers.filter((member: unknown) => 
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
      const { data: candidateData, error: candidateError } = await supabase
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
      const updateData: Partial<Record<string, unknown>> = {
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
      const { data, error } = await supabase
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

  // Paginated methods implementation
  async getJobsPaginated(params: {
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
  }> {
    try {
      const limit = Math.min(params.limit || 50, 100);
      const selectFields = params.fields?.join(', ') || '*';
      
      let query = supabase
        .from('jobs')
        .select(selectFields)
        .eq('org_id', params.orgId)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(limit + 1); // Get one extra to check if there are more

      // Add filters
      if (params.status) {
        query = query.eq('status', params.status);
      }
      if (params.jobType) {
        query = query.eq('job_type', params.jobType);
      }
      if (params.search) {
        query = query.or(`title.ilike.%${params.search}%,description.ilike.%${params.search}%`);
      }

      // Cursor-based pagination with deterministic ordering
      if (params.cursor) {
        try {
          const decodedCursor = JSON.parse(Buffer.from(params.cursor, 'base64').toString('utf8'));
          if (decodedCursor.id) {
            // Use composite cursor for deterministic ordering
            query = query.or(`created_at.lt.${decodedCursor.created_at},and(created_at.eq.${decodedCursor.created_at},id.lt.${decodedCursor.id})`);
          } else {
            // Fallback for old cursor format
            query = query.lt('created_at', decodedCursor.created_at);
          }
        } catch (e) {
          console.warn('Invalid cursor format, ignoring:', e instanceof Error ? e.message : 'unknown error');
        }
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error in getJobsPaginated:', error);
        throw error;
      }

      if (!data) {
        console.warn('No data returned from getJobsPaginated query');
        return {
          data: [],
          pagination: {
            hasMore: false,
            totalCount: count || 0,
            limit
          }
        };
      }

      // Type guard to ensure data is valid Job array
      if (!Array.isArray(data) || (data.length > 0 && typeof data[0] !== 'object')) {
        console.warn('Invalid data format returned from jobs query');
        return {
          data: [],
          pagination: {
            hasMore: false,
            totalCount: count || 0,
            limit
          }
        };
      }
      
      const jobs = (data as unknown) as Job[];
      const hasMore = jobs.length > limit;
      
      // Remove the extra item if present
      if (hasMore) {
        jobs.pop();
      }

      // Generate next cursor with composite key for deterministic ordering
      let nextCursor: string | undefined;
      if (hasMore && jobs.length > 0) {
        const lastJob = jobs[jobs.length - 1];
        nextCursor = Buffer.from(JSON.stringify({
          created_at: lastJob.createdAt,
          id: lastJob.id
        })).toString('base64');
      }

      return {
        data: jobs,
        pagination: {
          hasMore,
          nextCursor,
          totalCount: count || undefined,
          limit
        }
      };
    } catch (error) {
      console.error('Error in getJobsPaginated:', error);
      throw error;
    }
  }

  async getCandidatesPaginated(params: {
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
  }> {
    try {
      const limit = Math.min(params.limit || 50, 100);
      const selectFields = params.fields?.join(', ') || '*';
      
      let query = supabase
        .from('candidates')
        .select(selectFields)
        .eq('org_id', params.orgId)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(limit + 1);

      // Add filters
      if (params.stage) {
        query = query.eq('stage', params.stage);
      }
      if (params.status) {
        query = query.eq('status', params.status);
      }
      if (params.search) {
        query = query.or(`name.ilike.%${params.search}%,email.ilike.%${params.search}%`);
      }

      // If jobId is provided, filter through job_candidate junction
      if (params.jobId) {
        const { data: jobCandidates } = await supabase
          .from('job_candidate')
          .select('candidate_id')
          .eq('job_id', params.jobId);
        
        if (jobCandidates && jobCandidates.length > 0) {
          const candidateIds = jobCandidates.map(jc => jc.candidate_id);
          query = query.in('id', candidateIds);
        } else {
          // No candidates for this job
          return {
            data: [],
            pagination: { hasMore: false, limit, totalCount: 0 }
          };
        }
      }

      // Cursor-based pagination with deterministic ordering
      if (params.cursor) {
        try {
          const decodedCursor = JSON.parse(Buffer.from(params.cursor, 'base64').toString('utf8'));
          if (decodedCursor.id) {
            // Use composite cursor for deterministic ordering
            query = query.or(`created_at.lt.${decodedCursor.created_at},and(created_at.eq.${decodedCursor.created_at},id.lt.${decodedCursor.id})`);
          } else {
            // Fallback for old cursor format
            query = query.lt('created_at', decodedCursor.created_at);
          }
        } catch (e) {
          console.warn('Invalid cursor format, ignoring:', e instanceof Error ? e.message : 'unknown error');
        }
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error in getCandidatesPaginated:', error);
        throw error;
      }

      if (!data) {
        console.warn('No data returned from getCandidatesPaginated query');
        return {
          data: [],
          pagination: {
            hasMore: false,
            totalCount: count || 0,
            limit
          }
        };
      }

      // Type guard to ensure data is valid Candidate array
      if (!Array.isArray(data) || (data.length > 0 && typeof data[0] !== 'object')) {
        console.warn('Invalid data format returned from candidates query');
        return {
          data: [],
          pagination: {
            hasMore: false,
            totalCount: count || 0,
            limit
          }
        };
      }
      
      const candidates = (data as unknown) as Candidate[];
      const hasMore = candidates.length > limit;
      
      if (hasMore) {
        candidates.pop();
      }

      // Generate next cursor with composite key for deterministic ordering
      let nextCursor: string | undefined;
      if (hasMore && candidates.length > 0) {
        const lastCandidate = candidates[candidates.length - 1];
        nextCursor = Buffer.from(JSON.stringify({
          created_at: lastCandidate.createdAt,
          id: lastCandidate.id
        })).toString('base64');
      }

      return {
        data: candidates,
        pagination: {
          hasMore,
          nextCursor,
          totalCount: count || undefined,
          limit
        }
      };
    } catch (error) {
      console.error('Error in getCandidatesPaginated:', error);
      throw error;
    }
  }

  async getMessagesPaginated(params: {
    userId?: string;
    limit?: number;
    cursor?: string;
    fields?: string[];
    threadId?: string;
    type?: string;
    priority?: string;
    clientId?: string;
    jobId?: string;
    candidateId?: string;
  }): Promise<{
    data: Message[];
    pagination: {
      hasMore: boolean;
      nextCursor?: string;
      totalCount?: number;
      limit: number;
    };
  }> {
    try {
      const limit = Math.min(params.limit || 50, 100);
      const selectFields = params.fields?.join(', ') || '*';
      
      let query = supabase
        .from('messages')
        .select(selectFields)
        .eq('record_status', 'active')
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(limit + 1);

      // Add filters
      if (params.userId) {
        query = query.or(`sender_id.eq.${params.userId},recipient_id.eq.${params.userId}`);
      }
      if (params.threadId) {
        query = query.eq('thread_id', params.threadId);
      }
      if (params.type) {
        query = query.eq('type', params.type);
      }
      if (params.priority) {
        query = query.eq('priority', params.priority);
      }
      if (params.clientId) {
        query = query.eq('client_id', params.clientId);
      }
      if (params.jobId) {
        query = query.eq('job_id', params.jobId);
      }
      if (params.candidateId) {
        query = query.eq('candidate_id', params.candidateId);
      }

      // Cursor-based pagination with deterministic ordering
      if (params.cursor) {
        try {
          const decodedCursor = JSON.parse(Buffer.from(params.cursor, 'base64').toString('utf8'));
          if (decodedCursor.id) {
            // Use composite cursor for deterministic ordering
            query = query.or(`created_at.lt.${decodedCursor.created_at},and(created_at.eq.${decodedCursor.created_at},id.lt.${decodedCursor.id})`);
          } else {
            // Fallback for old cursor format
            query = query.lt('created_at', decodedCursor.created_at);
          }
        } catch (e) {
          console.warn('Invalid cursor format, ignoring:', e instanceof Error ? e.message : 'unknown error');
        }
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error in getMessagesPaginated:', error);
        throw error;
      }

      if (!data) {
        console.warn('No data returned from getMessagesPaginated query');
        return {
          data: [],
          pagination: {
            hasMore: false,
            totalCount: count || 0,
            limit
          }
        };
      }

      // Type guard to ensure data is valid Message array
      if (!Array.isArray(data) || (data.length > 0 && typeof data[0] !== 'object')) {
        console.warn('Invalid data format returned from messages query');
        return {
          data: [],
          pagination: {
            hasMore: false,
            totalCount: count || 0,
            limit
          }
        };
      }
      
      const messages = (data as unknown) as Message[];
      const hasMore = messages.length > limit;
      
      if (hasMore) {
        messages.pop();
      }

      // Generate next cursor with composite key for deterministic ordering
      let nextCursor: string | undefined;
      if (hasMore && messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        nextCursor = Buffer.from(JSON.stringify({
          created_at: lastMessage.createdAt,
          id: lastMessage.id
        })).toString('base64');
      }

      return {
        data: messages,
        pagination: {
          hasMore,
          nextCursor,
          totalCount: count || undefined,
          limit
        }
      };
    } catch (error) {
      console.error('Error in getMessagesPaginated:', error);
      throw error;
    }
  }

  // Beta Applications
  async getBetaApplication(id: string): Promise<BetaApplication | undefined> {
    const { data, error } = await supabase
      .from('beta_applications')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return undefined; // Record not found
      }
      console.error('Database beta application fetch error:', error)
      throw new Error(`Failed to fetch beta application: ${error.message}`)
    }
    
    return data as BetaApplication
  }

  async getBetaApplications(): Promise<BetaApplication[]> {
    const { data, error } = await supabase
      .from('beta_applications')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Database beta applications fetch error:', error)
      throw new Error(`Failed to fetch beta applications: ${error.message}`)
    }
    
    return data as BetaApplication[]
  }

  async createBetaApplication(betaApplication: InsertBetaApplication): Promise<BetaApplication> {
    try {
      const dbBetaApplication = {
        company_name: betaApplication.companyName,
        contact_name: betaApplication.contactName,
        email: betaApplication.email,
        phone: betaApplication.phone,
        website: betaApplication.website,
        company_size: betaApplication.companySize,
        current_ats: betaApplication.currentAts,
        pain_points: betaApplication.painPoints,
        expectations: betaApplication.expectations,
        status: betaApplication.status || 'pending',
        notes: betaApplication.reviewNotes,
        processed_at: betaApplication.reviewedAt,
        processed_by: betaApplication.reviewedBy,
      }
      
      const { data, error } = await supabase
        .from('beta_applications')
        .insert(dbBetaApplication)
        .select()
        .single()
      
      if (error) {
        console.error('Database beta application creation error:', error)
        throw new Error(`Failed to create beta application: ${error.message}`)
      }
      
      return data as BetaApplication
    } catch (err) {
      console.error('Beta application creation exception:', err)
      throw err
    }
  }

  async updateBetaApplication(id: string, updateData: Partial<InsertBetaApplication>): Promise<BetaApplication> {
    try {
      const dbUpdate: Partial<Record<string, unknown>> = {}
      if (updateData.companyName !== undefined) dbUpdate.company_name = updateData.companyName
      if (updateData.contactName !== undefined) dbUpdate.contact_name = updateData.contactName
      if (updateData.email !== undefined) dbUpdate.email = updateData.email
      if (updateData.phone !== undefined) dbUpdate.phone = updateData.phone
      if (updateData.website !== undefined) dbUpdate.website = updateData.website
      if (updateData.companySize !== undefined) dbUpdate.company_size = updateData.companySize
      if (updateData.currentAts !== undefined) dbUpdate.current_ats = updateData.currentAts
      if (updateData.painPoints !== undefined) dbUpdate.pain_points = updateData.painPoints
      if (updateData.expectations !== undefined) dbUpdate.expectations = updateData.expectations
      if (updateData.status !== undefined) dbUpdate.status = updateData.status
      if (updateData.reviewNotes !== undefined) dbUpdate.notes = updateData.reviewNotes
      if (updateData.reviewedAt !== undefined) dbUpdate.processed_at = updateData.reviewedAt
      if (updateData.reviewedBy !== undefined) dbUpdate.processed_by = updateData.reviewedBy
      
      // Always update the updated_at timestamp
      dbUpdate.updated_at = new Date().toISOString()
      
      const { data, error } = await supabase
        .from('beta_applications')
        .update(dbUpdate)
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        console.error('Database beta application update error:', error)
        throw new Error(`Failed to update beta application: ${error.message}`)
      }
      
      return data as BetaApplication
    } catch (err) {
      console.error('Beta application update exception:', err)
      throw err
    }
  }

  async deleteBetaApplication(id: string): Promise<void> {
    const { error } = await supabase
      .from('beta_applications')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Database beta application deletion error:', error)
      throw new Error(`Failed to delete beta application: ${error.message}`)
    }
  }

  // Analytics methods implementation
  async getPipelineSnapshot(orgId: string, limit: number = 10): Promise<PipelineSnapshotData[]> {
    try {
      let query = supabase
        .from('v_dashboard_pipeline_snapshot')
        .select('*')
        .eq('org_id', orgId)
        .eq('job_status', 'open')
        .order('total_candidates', { ascending: false })

      if (limit > 0) {
        query = query.limit(limit)
      }

      const { data, error } = await query

      if (error) {
        console.error('Database pipeline snapshot fetch error:', error)
        throw new Error(`Failed to fetch pipeline snapshot: ${error.message}`)
      }

      return (data || []) as PipelineSnapshotData[]
    } catch (err) {
      console.error('Pipeline snapshot fetch exception:', err)
      throw err
    }
  }

  async getStageTimeAnalytics(orgId: string, jobId?: string): Promise<StageTimeData[]> {
    try {
      let query = supabase
        .from('v_pipeline_stage_avg_time')
        .select('*')

      // Join with jobs to filter by org_id
      const { data: jobs } = await supabase
        .from('jobs')
        .select('id')
        .eq('org_id', orgId)

      if (!jobs || jobs.length === 0) {
        return []
      }

      const jobIds = jobs.map(job => job.id)
      query = query.in('job_id', jobIds)

      if (jobId) {
        query = query.eq('job_id', jobId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Database stage time analytics fetch error:', error)
        throw new Error(`Failed to fetch stage time analytics: ${error.message}`)
      }

      return (data || []) as StageTimeData[]
    } catch (err) {
      console.error('Stage time analytics fetch exception:', err)
      throw err
    }
  }

  async getJobHealthData(orgId: string): Promise<JobHealthData[]> {
    try {
      const { data, error } = await supabase
        .from('v_job_health')
        .select('*')
        .eq('org_id', orgId)
        .order('total_candidates', { ascending: false })

      if (error) {
        console.error('Database job health fetch error:', error)
        throw new Error(`Failed to fetch job health data: ${error.message}`)
      }

      return (data || []) as JobHealthData[]
    } catch (err) {
      console.error('Job health fetch exception:', err)
      throw err
    }
  }

  async getDashboardActivity(orgId: string, limit: number = 50): Promise<DashboardActivityData[]> {
    try {
      const { data, error } = await supabase
        .from('v_dashboard_activity')
        .select('*')
        .eq('org_id', orgId)
        .order('changed_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Database dashboard activity fetch error:', error)
        throw new Error(`Failed to fetch dashboard activity: ${error.message}`)
      }

      return (data || []) as DashboardActivityData[]
    } catch (err) {
      console.error('Dashboard activity fetch exception:', err)
      throw err
    }
  }

  // Email Management Methods
  
  async getOrganizationEmailSettings(orgId: string): Promise<OrganizationEmailSettings | undefined> {
    try {
      const { data, error } = await supabase
        .from('organization_email_settings')
        .select('*')
        .eq('org_id', orgId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return undefined
        throw new Error(`Failed to fetch email settings: ${error.message}`)
      }

      return data as OrganizationEmailSettings
    } catch (err) {
      console.error('Error fetching organization email settings:', err)
      throw err
    }
  }

  async updateOrganizationEmailSettings(orgId: string, settings: Partial<InsertOrganizationEmailSettings>): Promise<OrganizationEmailSettings> {
    try {
      const { data, error } = await supabase
        .from('organization_email_settings')
        .upsert({
          org_id: orgId,
          from_email: settings.fromEmail,
          from_name: settings.fromName,
          reply_to_email: settings.replyToEmail,
          company_logo_url: settings.companyLogoUrl,
          brand_color: settings.brandColor,
          brand_secondary_color: settings.brandSecondaryColor,
          company_website: settings.companyWebsite,
          company_address: settings.companyAddress,
          enabled_events: settings.enabledEvents,
          email_signature: settings.emailSignature,
        }, { onConflict: 'org_id' })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update email settings: ${error.message}`)
      }

      return data as OrganizationEmailSettings
    } catch (err) {
      console.error('Error updating organization email settings:', err)
      throw err
    }
  }

  async getEmailTemplates(orgId: string): Promise<EmailTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('org_id', orgId)
        .order('template_type', { ascending: true })

      if (error) {
        throw new Error(`Failed to fetch email templates: ${error.message}`)
      }

      return (data || []) as EmailTemplate[]
    } catch (err) {
      console.error('Error fetching email templates:', err)
      throw err
    }
  }

  async createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .insert({
          org_id: template.orgId,
          template_type: template.templateType,
          template_name: template.templateName,
          sendgrid_template_id: template.sendgridTemplateId,
          fallback_subject: template.fallbackSubject,
          fallback_html: template.fallbackHtml,
          fallback_text: template.fallbackText,
          template_variables: template.templateVariables,
          is_active: template.isActive,
          is_default: template.isDefault,
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create email template: ${error.message}`)
      }

      return data as EmailTemplate
    } catch (err) {
      console.error('Error creating email template:', err)
      throw err
    }
  }

  async updateEmailTemplate(templateId: string, orgId: string, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate> {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .update({
          template_name: template.templateName,
          sendgrid_template_id: template.sendgridTemplateId,
          fallback_subject: template.fallbackSubject,
          fallback_html: template.fallbackHtml,
          fallback_text: template.fallbackText,
          template_variables: template.templateVariables,
          is_active: template.isActive,
        })
        .eq('id', templateId)
        .eq('org_id', orgId) // Verify template belongs to organization
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update email template: ${error.message}`)
      }

      if (!data) {
        throw new Error('Email template not found or access denied')
      }

      return data as EmailTemplate
    } catch (err) {
      console.error('Error updating email template:', err)
      throw err
    }
  }

  async deleteEmailTemplate(templateId: string, orgId: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', templateId)
        .eq('org_id', orgId) // Verify template belongs to organization
        .select()

      if (error) {
        throw new Error(`Failed to delete email template: ${error.message}`)
      }

      if (!data || data.length === 0) {
        throw new Error('Email template not found or access denied')
      }
    } catch (err) {
      console.error('Error deleting email template:', err)
      throw err
    }
  }

  async getEmailEvents(orgId: string, options: {
    limit?: number;
    eventType?: string;
    status?: string;
  } = {}): Promise<EmailEvent[]> {
    try {
      let query = supabase
        .from('email_events')
        .select('*')
        .eq('org_id', orgId)
        .order('sent_at', { ascending: false })

      if (options.eventType) {
        query = query.eq('event_type', options.eventType)
      }

      if (options.status) {
        query = query.eq('status', options.status)
      }

      if (options.limit) {
        query = query.limit(options.limit)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(`Failed to fetch email events: ${error.message}`)
      }

      return (data || []) as EmailEvent[]
    } catch (err) {
      console.error('Error fetching email events:', err)
      throw err
    }
  }

  async createEmailEvent(event: InsertEmailEvent): Promise<EmailEvent> {
    try {
      const { data, error } = await supabase
        .from('email_events')
        .insert({
          org_id: event.orgId,
          event_type: event.eventType,
          recipient_email: event.recipientEmail,
          recipient_name: event.recipientName,
          sendgrid_message_id: event.sendgridMessageId,
          template_id: event.templateId,
          job_id: event.jobId,
          candidate_id: event.candidateId,
          status: event.status,
          error_message: event.errorMessage,
          template_data: event.templateData,
          metadata: event.metadata,
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create email event: ${error.message}`)
      }

      return data as EmailEvent
    } catch (err) {
      console.error('Error creating email event:', err)
      throw err
    }
  }
}

// Export the clean DatabaseStorage instance - no more MemStorage
export const storage: IStorage = new DatabaseStorage();