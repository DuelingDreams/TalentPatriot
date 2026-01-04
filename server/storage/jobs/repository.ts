import { supabase } from '../../lib/supabase';
import type {
  Client,
  Job,
  PipelineColumn,
  InsertClient,
  InsertJob,
  InsertPipelineColumn
} from "@shared/schema";
import type { IJobsRepository, UserContext, ApplicantData, ApplicationResult, PublishResult } from './interface';
import { toCamelCase } from '@shared/utils/caseConversion';

// Helper functions migrated from lib/jobService.ts

// Resume URL validation function
function validateResumeUrl(resumeUrl: string): boolean {
  if (!resumeUrl) return true; // Optional field
  
  // Check if it's a Supabase Storage path (orgId/jobId/resume_xxx.ext)
  // Format: {uuid}/{uuid}/resume_{nanoid}.{ext}
  const storagePathPattern = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\/resume_[\w-]+\.\w+$/i;
  if (storagePathPattern.test(resumeUrl)) {
    return true;
  }
  
  // Check if it's a local file path
  if (resumeUrl.startsWith('/uploads/') || resumeUrl.startsWith('uploads/')) {
    return true;
  }
  
  // Try to parse as URL for legacy full URLs
  try {
    const url = new URL(resumeUrl);
    
    // Check if it's a Supabase storage URL
    if (url.hostname.includes('supabase')) {
      return true;
    }
    
    // Check if it's a valid HTTPS URL (for other cloud providers)
    if (url.protocol === 'https:') {
      return true;
    }
    
    // Check if it's a local file path (for development/uploads)
    if (url.protocol === 'http:' && (url.hostname === 'localhost' || url.hostname.includes('replit'))) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Invalid resume URL format:', resumeUrl);
    return false;
  }
}

// Generate unique slug for job
async function generateUniqueSlug(title: string, jobId?: string): Promise<string> {
  // Create base slug from title
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
  
  if (!baseSlug) {
    throw new Error('Invalid title - cannot generate slug');
  }
  
  // If we have a jobId, use it for uniqueness
  if (jobId) {
    const slugWithId = `${baseSlug}-${jobId.slice(0, 8)}`;
    return slugWithId;
  }
  
  // For new jobs, find next available slug
  let counter = 0;
  let slugCandidate = baseSlug;
  
  while (true) {
    const { data } = await supabase
      .from('jobs')
      .select('id')
      .eq('public_slug', slugCandidate)
      .limit(1);
    
    if (!data || data.length === 0) {
      return slugCandidate;
    }
    
    counter++;
    slugCandidate = `${baseSlug}-${counter}`;
    
    if (counter > 100) {
      throw new Error('Unable to generate unique slug');
    }
  }
}

export class JobsRepository implements IJobsRepository {
  // Placeholder implementation - will extract methods from original storage.ts
  async getClient(id: string): Promise<Client | undefined> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw new Error(error.message);
    }
    
    return toCamelCase(data) as Client;
  }

  async getClients(): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return (data || []).map(client => toCamelCase(client)) as Client[];
  }

  async getClientsByOrg(orgId: string): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return (data || []).map(client => toCamelCase(client)) as Client[];
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    // Map camelCase fields to snake_case for Supabase
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
      priority: insertClient.priority || null,
      payment_terms: insertClient.paymentTerms || null,
    };

    const { data, error } = await supabase
      .from('clients')
      .insert(dbClient)
      .select()
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data as Client;
  }

  async updateClient(id: string, client: Partial<InsertClient>): Promise<Client> {
    // Map camelCase fields to snake_case for Supabase
    const dbUpdate: Record<string, unknown> = {};
    if (client.name !== undefined) dbUpdate.name = client.name;
    if (client.industry !== undefined) dbUpdate.industry = client.industry;
    if (client.location !== undefined) dbUpdate.location = client.location;
    if (client.website !== undefined) dbUpdate.website = client.website;
    if (client.contactName !== undefined) dbUpdate.contact_name = client.contactName;
    if (client.contactEmail !== undefined) dbUpdate.contact_email = client.contactEmail;
    if (client.contactPhone !== undefined) dbUpdate.contact_phone = client.contactPhone;
    if (client.notes !== undefined) dbUpdate.notes = client.notes;
    if (client.status !== undefined) dbUpdate.status = client.status;
    if (client.priority !== undefined) dbUpdate.priority = client.priority;
    if (client.paymentTerms !== undefined) dbUpdate.payment_terms = client.paymentTerms;

    const { data, error } = await supabase
      .from('clients')
      .update(dbUpdate)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data as Client;
  }

  async deleteClient(id: string): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(error.message);
    }
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

  async getJob(id: string): Promise<Job | undefined> {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw new Error(error.message);
    }
    
    return data ? toCamelCase(data) as Job : undefined;
  }

  async getJobs(): Promise<Job[]> {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data ? data.map(job => toCamelCase(job) as Job) : [];
  }

  async getJobsByOrg(orgId: string): Promise<Job[]> {
    try {
      console.log(`Fetching jobs for orgId: ${orgId}`);
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Failed to fetch jobs: ${error.message}`);
      }
      
      console.log(`Found ${data?.length || 0} jobs for orgId: ${orgId}`);
      return data ? data.map(job => toCamelCase(job) as Job) : [];
    } catch (err) {
      console.error('Exception in getJobsByOrg:', err);
      throw err;
    }
  }

  async getJobsByClient(clientId: string): Promise<Job[]> {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data ? data.map(job => toCamelCase(job) as Job) : [];
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
      const dbUpdate: Partial<Record<string, unknown>> = {};
      if (updateData.title !== undefined) dbUpdate.title = updateData.title;
      if (updateData.description !== undefined) dbUpdate.description = updateData.description;
      if (updateData.status !== undefined) dbUpdate.status = updateData.status;
      if (updateData.clientId !== undefined) dbUpdate.client_id = updateData.clientId;
      if (updateData.assignedTo !== undefined) dbUpdate.assigned_to = updateData.assignedTo;
      if (updateData.recordStatus !== undefined) dbUpdate.record_status = updateData.recordStatus;
      if (updateData.location !== undefined) dbUpdate.location = updateData.location;
      if (updateData.jobType !== undefined) dbUpdate.job_type = updateData.jobType;
      if (updateData.remoteOption !== undefined) dbUpdate.remote_option = updateData.remoteOption;
      if (updateData.salaryRange !== undefined) dbUpdate.salary_range = updateData.salaryRange;
      if (updateData.experienceLevel !== undefined) dbUpdate.experience_level = updateData.experienceLevel;
      if (updateData.updatedAt !== undefined) dbUpdate.updated_at = updateData.updatedAt;
      
      const { data, error } = await supabase
        .from('jobs')
        .update(dbUpdate)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Database job update error:', error);
        throw new Error(`Failed to update job: ${error.message}`);
      }
      
      return data as Job;
    } catch (err) {
      console.error('Job update exception:', err);
      throw err;
    }
  }

  async deleteJob(id: string): Promise<void> {
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(error.message);
    }
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

  async getPublicJobs(orgId?: string): Promise<Job[]> {
    let query = supabase
      .from('jobs')
      .select('*')
      .eq('status', 'open')
      .not('published_at', 'is', null);

    // Filter by organization if orgId is provided
    if (orgId) {
      query = query.eq('org_id', orgId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Public jobs fetch error:', error);
      throw new Error(`Failed to fetch public jobs: ${error.message}`);
    }
    
    console.log(`[JobsRepository] getPublicJobs found ${data?.length || 0} jobs${orgId ? ` for org ${orgId}` : ''}`);
    
    return data || [];
  }

  async getPublicJobsByOrg(orgId: string): Promise<Job[]> {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('org_id', orgId)
      .eq('status', 'open')
      .not('published_at', 'is', null)
      .eq('record_status', 'active')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data as Job[];
  }

  async getPublicJob(id: string): Promise<Job | undefined> {
    const { data, error } = await supabase
      .from('public_jobs')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw new Error(error.message);
    }
    
    return data as Job;
  }

  async getPipelineColumns(orgId: string): Promise<PipelineColumn[]> {
    try {
      const { data, error } = await supabase
        .from('pipeline_columns')
        .select('*')
        .eq('org_id', orgId)
        .order('position', { ascending: true });
      
      if (error) {
        console.error('Database pipeline columns fetch error:', error);
        throw new Error(`Failed to fetch pipeline columns: ${error.message}`);
      }
      
      return data as PipelineColumn[] || [];
    } catch (err) {
      console.error('Pipeline columns fetch exception:', err);
      throw err;
    }
  }

  async createPipelineColumn(column: InsertPipelineColumn): Promise<PipelineColumn> {
    try {
      const dbColumn = {
        title: column.title,
        position: column.position,
        org_id: column.orgId,
        updated_at: new Date()
      };
      
      const { data, error } = await supabase
        .from('pipeline_columns')
        .insert(dbColumn)
        .select()
        .single();
      
      if (error) {
        console.error('Database pipeline column creation error:', error);
        throw new Error(`Failed to create pipeline column: ${error.message}`);
      }
      
      return data as PipelineColumn;
    } catch (err) {
      console.error('Pipeline column creation exception:', err);
      throw err;
    }
  }

  async getJobPipelineData(jobId: string, orgId: string, includeCompleted: boolean = false): Promise<{
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
    console.log(`[getJobPipelineData] Fetching pipeline data for job: ${jobId}, org: ${orgId}, includeCompleted: ${includeCompleted}`);
    
    try {
      // Get pipeline columns for this job
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

      // Build the query for applications
      let query = supabase
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
        .eq('status', 'active');

      // Filter out completed candidates if not requested
      if (!includeCompleted) {
        query = query.not('stage', 'in', '(hired,rejected)');
      }

      const { data: applications, error: applicationsError } = await query
        .order('created_at', { ascending: false });

      if (applicationsError) {
        console.error('[getJobPipelineData] Error fetching applications:', applicationsError);
        throw new Error(`Failed to fetch applications: ${applicationsError.message}`);
      }

      console.log(`[getJobPipelineData] Found ${columns?.length || 0} columns and ${applications?.length || 0} applications`);
      
      const pipelineData = {
        columns: (columns || []).map((col: any) => ({
          id: col.id,
          title: col.title,
          position: col.position
        })),
        applications: (applications || []).map((app: any) => ({
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
        }))
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

  async getJobPipelineDataOptimized(jobId: string, includeCompleted: boolean = false): Promise<{
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
  } | null> {
    console.log(`[getJobPipelineDataOptimized] Fetching pipeline for job: ${jobId}, includeCompleted: ${includeCompleted}`);
    
    try {
      // Parallel fetch: Get job details and pipeline columns in parallel
      const [jobResult, columnsResult] = await Promise.all([
        supabase.from('jobs').select('org_id').eq('id', jobId).single(),
        supabase.from('pipeline_columns').select('*').eq('job_id', jobId).order('position')
      ]);

      if (jobResult.error || !jobResult.data) {
        console.log(`[getJobPipelineDataOptimized] Job not found: ${jobId}`);
        return null;
      }

      if (columnsResult.error) {
        console.error('[getJobPipelineDataOptimized] Error fetching pipeline columns:', columnsResult.error);
        throw new Error(`Failed to fetch pipeline columns: ${columnsResult.error.message}`);
      }

      const orgId = jobResult.data.org_id;
      let columns = columnsResult.data || [];

      // Create default pipeline columns if none exist (first-time setup)
      if (columns.length === 0) {
        console.log(`[getJobPipelineDataOptimized] Creating default pipeline for job: ${jobId}`);
        const defaultColumns = ['Applied', 'Screen', 'Interview', 'Offer', 'Hired'].map((title, index) => ({
          org_id: orgId,
          job_id: jobId,
          title,
          position: index,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        const { data: createdColumns, error: createError } = await supabase
          .from('pipeline_columns')
          .insert(defaultColumns)
          .select();

        if (createError) {
          console.error('[getJobPipelineDataOptimized] Error creating default columns:', createError);
          throw new Error(`Failed to create default pipeline: ${createError.message}`);
        }
        columns = createdColumns || [];
      }

      // Fetch applications with candidate data
      let query = supabase
        .from('job_candidate')
        .select(`
          id,
          job_id,
          candidate_id,
          pipeline_column_id,
          status,
          created_at,
          stage,
          candidate:candidates(id, name, email, phone, resume_url)
        `)
        .eq('job_id', jobId)
        .eq('status', 'active');

      if (!includeCompleted) {
        query = query.not('stage', 'in', '(hired,rejected)');
      }

      const { data: applications, error: appError } = await query.order('created_at', { ascending: false });

      if (appError) {
        console.error('[getJobPipelineDataOptimized] Error fetching applications:', appError);
        throw new Error(`Failed to fetch applications: ${appError.message}`);
      }

      console.log(`[getJobPipelineDataOptimized] Found ${columns.length} columns and ${applications?.length || 0} applications`);

      return {
        columns: columns.map((col: any) => ({
          id: col.id,
          title: col.title,
          position: col.position
        })),
        applications: (applications || []).map((app: any) => ({
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
        }))
      };
    } catch (error) {
      console.error(`[getJobPipelineDataOptimized] Error:`, error);
      throw error;
    }
  }

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

      return data ? data.map(job => toCamelCase(job) as Job) : [];
    } catch (err) {
      console.error('Advanced job search exception:', err);
      throw err;
    }
  }

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
        console.warn('Invalid data format returned from getJobsPaginated');
        return {
          data: [],
          pagination: {
            hasMore: false,
            totalCount: count || 0,
            limit
          }
        };
      }

      const hasMore = data.length > limit;
      const rawJobs = hasMore ? data.slice(0, limit) : data;
      
      // Convert snake_case to camelCase for frontend consumption
      const jobs = rawJobs.map(job => toCamelCase(job) as Job);

      let nextCursor: string | undefined;
      if (hasMore && jobs.length > 0) {
        const lastJob = jobs[jobs.length - 1];
        const cursorData = {
          created_at: lastJob.createdAt,
          id: lastJob.id
        };
        nextCursor = Buffer.from(JSON.stringify(cursorData)).toString('base64');
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

  // Migrated from lib/jobService.ts - Advanced job operations with UserContext

  async createJobWithContext(data: {
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
  }, userContext: UserContext): Promise<Job> {
    // Validate required fields for creation
    if (!data.title?.trim()) {
      throw new Error('Job title is required');
    }
    
    if (!data.orgId) {
      throw new Error('Organization ID is required');
    }
    
    // Verify user has access to organization
    const { data: userOrg } = await supabase
      .from('user_organizations')
      .select('id')
      .eq('user_id', userContext.userId)
      .eq('org_id', data.orgId)
      .single();
    
    // If not found, also check if user is the organization owner (fallback for development)
    if (!userOrg) {
      const { data: orgOwner } = await supabase
        .from('organizations')
        .select('owner_id')
        .eq('id', data.orgId)
        .single();
      
      if (!orgOwner || orgOwner.owner_id !== userContext.userId) {
        throw new Error('Access denied: User not authorized for this organization');
      }
    }
    
    // Generate unique slug
    const slug = await generateUniqueSlug(data.title);
    
    const { data: result, error } = await supabase
      .from('jobs')
      .insert([{ 
        title: data.title.trim(),
        description: data.description?.trim() || null,
        location: data.location?.trim() || null,
        job_type: data.jobType || 'full-time',
        remote_option: data.remoteOption || 'onsite',
        salary_range: data.salaryRange?.trim() || null,
        experience_level: data.experienceLevel || 'mid',
        client_id: data.clientId || null,
        org_id: data.orgId,
        status: 'draft', // Always create as draft
        record_status: 'active',
        public_slug: slug,
        created_by: userContext.userId,
        assigned_to: userContext.userId // Auto-assign job to creator
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Job creation error:', error);
      throw new Error(`Failed to create job: ${error.message}`);
    }
    
    return result as Job;
  }

  async publishJob(jobId: string, userContext?: UserContext): Promise<PublishResult> {
    // Fetch job and validate ownership/access
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select(`
        *,
        organization:organizations(id, name, slug)
      `)
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      throw new Error('Job not found');
    }

    // Verify user has access if userContext provided
    if (userContext) {
      if (job.org_id !== userContext.orgId) {
        throw new Error('Access denied: Job does not belong to user organization');
      }
    }

    // Validate required fields for publishing
    if (!job.title) {
      throw new Error('Cannot publish: Job title is required');
    }

    // Only allow publishing draft jobs
    if (job.status !== 'draft') {
      throw new Error('Job is already published or closed');
    }

    // Ensure slug exists
    let slug = job.public_slug;
    if (!slug) {
      slug = await generateUniqueSlug(job.title, job.id);
    }

    // Update job status to 'open' and set published_at timestamp
    const { data: updatedJob, error: updateError } = await supabase
      .from('jobs')
      .update({
        status: 'open',
        published_at: new Date().toISOString(),
        public_slug: slug,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)
      .select()
      .single();

    if (updateError) {
      console.error('Job publishing error:', updateError);
      throw new Error(`Failed to publish job: ${updateError.message}`);
    }

    // Try to post to external job boards if configured
    try {
      if (updatedJob.posting_targets && updatedJob.posting_targets.length > 0) {
        const org = job.organization;
        if (org) {
          const { postJobToTargets } = await import('../../integrations/jobBoards');
          await postJobToTargets({
            job: { 
              id: updatedJob.id, 
              title: updatedJob.title, 
              description: updatedJob.description, 
              location: updatedJob.location, 
              slug: updatedJob.public_slug 
            },
            org,
            targets: updatedJob.posting_targets || [],
          });
        }
      }
    } catch (externalPostError) {
      console.warn('External job board posting failed, but job published successfully:', externalPostError);
    }
    
    return {
      publicUrl: `/careers/${updatedJob.public_slug}`,
      job: {
        id: updatedJob.id,
        slug: updatedJob.public_slug,
        status: updatedJob.status,
        published_at: updatedJob.published_at
      }
    };
  }

  async applyToJob(
    { jobId, applicant }: { jobId: string; applicant: ApplicantData }, 
    requestContext?: { orgId?: string }
  ): Promise<ApplicationResult> {
    console.log('[JobsRepository] Starting job application process', { jobId, email: applicant.email });
    
    // Server-side validation
    if (!applicant.firstName || !applicant.lastName || !applicant.email) {
      console.error('[JobsRepository] Missing required fields:', { 
        firstName: applicant.firstName, 
        lastName: applicant.lastName, 
        email: applicant.email 
      });
      throw new Error('Missing required fields: firstName, lastName, and email are required');
    }
    
    // Validate that firstName and lastName are not just whitespace
    if (!applicant.firstName.trim() || !applicant.lastName.trim()) {
      console.error('[JobsRepository] Empty name fields after trim');
      throw new Error('First name and last name cannot be empty');
    }
    
    // Validate resume URL if provided
    if (applicant.resumeUrl && !validateResumeUrl(applicant.resumeUrl)) {
      console.error('[JobsRepository] Invalid resume URL:', applicant.resumeUrl);
      throw new Error('Invalid resume URL. Please upload your resume through the provided interface.');
    }
    
    console.log('[JobsRepository] Validation passed for application:', { 
      jobId, 
      email: applicant.email,
      hasResume: !!applicant.resumeUrl 
    });
    
    // Validate job exists and is open for applications
    const { data: jobData, error: jobError } = await supabase
      .from('jobs')
      .select(`
        id,
        org_id,
        title,
        status,
        published_at,
        organization:organizations(id, name)
      `)
      .eq('id', jobId)
      .eq('status', 'open')
      .not('published_at', 'is', null)
      .single();

    if (jobError || !jobData) {
      console.error('[JobsRepository] Job validation failed:', jobError);
      throw new Error('Job not found or not available for applications');
    }

    const orgId = jobData.org_id;
    console.log('[JobsRepository] Job validated for org:', orgId);

    try {
      // Step 1: Check if candidate already exists for this organization
      let candidateId: string;
      const fullName = `${applicant.firstName.trim()} ${applicant.lastName.trim()}`.trim();
      
      console.log('[JobsRepository] Creating candidate with name:', {
        firstName: applicant.firstName,
        lastName: applicant.lastName,
        fullName: fullName,
        fullNameLength: fullName.length
      });

      const { data: existingCandidate, error: candidateCheckError } = await supabase
        .from('candidates')
        .select('id, name, email')
        .eq('org_id', orgId)
        .eq('email', applicant.email.toLowerCase())
        .single();

      if (candidateCheckError && candidateCheckError.code !== 'PGRST116') {
        console.error('[JobsRepository] Error checking existing candidate:', candidateCheckError);
        throw new Error('Database error during candidate lookup');
      }

      if (existingCandidate) {
        // Candidate exists, reuse
        candidateId = existingCandidate.id;
        console.log('[JobsRepository] Reusing existing candidate:', candidateId);
        
        // Optionally update candidate info if provided
        if (applicant.resumeUrl || applicant.phone || applicant.source) {
          const updates: any = { updated_at: new Date().toISOString() };
          const hasNewResume = applicant.resumeUrl;
          if (applicant.resumeUrl) updates.resume_url = applicant.resumeUrl;
          if (applicant.phone) updates.phone = applicant.phone;
          if (applicant.source) updates.source = applicant.source;
          
          await supabase
            .from('candidates')
            .update(updates)
            .eq('id', candidateId);
          
          // Create candidate_documents record for the resume
          if (hasNewResume) {
            // Extract filename from storage path
            const pathParts = applicant.resumeUrl!.split('/');
            const fileName = pathParts[pathParts.length - 1] || 'resume.pdf';
            
            // Check if document already exists to avoid duplicates
            const { data: existingDoc } = await supabase
              .from('candidate_documents')
              .select('id')
              .eq('candidate_id', candidateId)
              .eq('file_url', applicant.resumeUrl!)
              .single();
            
            if (!existingDoc) {
              const { error: docError } = await supabase
                .from('candidate_documents')
                .insert({
                  org_id: orgId,
                  candidate_id: candidateId,
                  name: fileName,
                  file_url: applicant.resumeUrl!,
                  file_type: 'resume'
                });
              
              if (docError) {
                console.warn('[JobsRepository] Failed to create document record (non-critical):', docError);
              } else {
                console.log('[JobsRepository] Created candidate_documents record for resume');
              }
            }
            
            console.log(`[AUTO-PARSE] Triggering resume parsing for updated candidate ${candidateId}`);
            const { CandidatesRepository } = await import('../candidates/repository');
            const candidatesRepo = new CandidatesRepository();
            candidatesRepo.parseAndUpdateCandidateFromStorage(candidateId, applicant.resumeUrl!)
              .then(() => {
                console.log(`[AUTO-PARSE] Successfully triggered parsing for candidate ${candidateId}`);
              })
              .catch((error) => {
                console.error(`[AUTO-PARSE] Failed to parse resume for candidate ${candidateId}:`, error);
              });
          }
        }
      } else {
        // Create new candidate
        const { data: newCandidate, error: createCandidateError } = await supabase
          .from('candidates')
          .insert({
            org_id: orgId,
            name: fullName,
            email: applicant.email.toLowerCase(),
            phone: applicant.phone,
            source: applicant.source,
            resume_url: applicant.resumeUrl,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('id')
          .single();

        if (createCandidateError) {
          console.error('[JobsRepository] Error creating candidate:', createCandidateError);
          throw new Error('Failed to create candidate profile');
        }

        candidateId = newCandidate.id;
        console.log('[JobsRepository] Created new candidate:', {
          candidateId: candidateId,
          nameSet: fullName,
          email: applicant.email.toLowerCase()
        });
        
        // Create candidate_documents record and trigger parsing for new candidate with resume
        if (applicant.resumeUrl) {
          // Extract filename from storage path
          const pathParts = applicant.resumeUrl.split('/');
          const fileName = pathParts[pathParts.length - 1] || 'resume.pdf';
          
          // Create document record
          const { error: docError } = await supabase
            .from('candidate_documents')
            .insert({
              org_id: orgId,
              candidate_id: candidateId,
              name: fileName,
              file_url: applicant.resumeUrl,
              file_type: 'resume'
            });
          
          if (docError) {
            console.warn('[JobsRepository] Failed to create document record (non-critical):', docError);
          } else {
            console.log('[JobsRepository] Created candidate_documents record for new candidate resume');
          }
          
          console.log(`[AUTO-PARSE] Triggering resume parsing for new candidate ${candidateId}`);
          const { CandidatesRepository } = await import('../candidates/repository');
          const candidatesRepo = new CandidatesRepository();
          candidatesRepo.parseAndUpdateCandidateFromStorage(candidateId, applicant.resumeUrl)
            .then(() => {
              console.log(`[AUTO-PARSE] Successfully triggered parsing for candidate ${candidateId}`);
            })
            .catch((error) => {
              console.error(`[AUTO-PARSE] Failed to parse resume for candidate ${candidateId}:`, error);
            });
        }
      }

      // Step 2: Check if application already exists
      const { data: existingApplication, error: applicationCheckError } = await supabase
        .from('job_candidate')
        .select('id')
        .eq('job_id', jobId)
        .eq('candidate_id', candidateId)
        .single();

      if (applicationCheckError && applicationCheckError.code !== 'PGRST116') {
        console.error('[JobsRepository] Error checking existing application:', applicationCheckError);
        throw new Error('Database error during application lookup');
      }

      if (existingApplication) {
        console.log('[JobsRepository] Application already exists:', existingApplication.id);
        return {
          candidateId,
          applicationId: existingApplication.id,
          success: true
        };
      }

      // Step 3: Get first pipeline column for this specific job
      const { getFirstColumnId } = await import('../../lib/pipelineService');
      
      let firstColumnId: string;
      try {
        firstColumnId = await getFirstColumnId({ 
          jobId, 
          organizationId: orgId 
        });
        console.log('[JobsRepository] Got first column ID for job application:', firstColumnId);
      } catch (columnError) {
        console.error('[JobsRepository] Error getting first column for job:', columnError);
        throw new Error('Failed to initialize job pipeline for application');
      }

      // Step 4: Create job_candidate application record
      const { data: application, error: applicationError } = await supabase
        .from('job_candidate')
        .insert({
          org_id: orgId,
          job_id: jobId,
          candidate_id: candidateId,
          pipeline_column_id: firstColumnId,
          stage: 'applied',
          source: applicant.source,
          notes: applicant.coverLetter || null,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (applicationError) {
        console.error('[JobsRepository] Error creating application:', applicationError);
        throw new Error('Failed to submit job application');
      }

      console.log('[JobsRepository] Job application completed successfully', {
        candidateId,
        applicationId: application.id,
        firstColumnId
      });

      return {
        candidateId,
        applicationId: application.id,
        success: true
      };

    } catch (error) {
      console.error('[JobsRepository] Job application transaction failed:', error);
      throw error;
    }
  }

  async getJobCandidatesByOrg(orgId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('job_candidate')
      .select(`
        *,
        job:jobs(*),
        candidate:candidates(*)
      `)
      .eq('org_id', orgId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Job candidates fetch error:', error);
      throw new Error(`Failed to fetch job candidates: ${error.message}`);
    }
    
    return data;
  }

  async updateJobCandidateStage(jobCandidateId: string, newStage: string): Promise<any> {
    const { data, error } = await supabase
      .from('job_candidate')
      .update({ 
        stage: newStage,
        updated_at: new Date().toISOString() 
      })
      .eq('id', jobCandidateId)
      .select()
      .single();
      
    if (error) {
      console.error('Job candidate stage update error:', error);
      throw new Error(`Failed to update job candidate stage: ${error.message}`);
    }
    
    return data;
  }
}