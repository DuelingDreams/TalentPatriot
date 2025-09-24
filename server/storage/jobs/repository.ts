import { supabase } from '../../lib/supabase';
import type {
  Client,
  Job,
  PipelineColumn,
  InsertClient,
  InsertJob,
  InsertPipelineColumn
} from "@shared/schema";
import type { IJobsRepository } from './interface';

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
    
    return data as Client;
  }

  async getClients(): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data as Client[];
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
    
    return data as Client[];
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const { data, error } = await supabase
      .from('clients')
      .insert(insertClient)
      .select()
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data as Client;
  }

  async updateClient(id: string, client: Partial<InsertClient>): Promise<Client> {
    const { data, error } = await supabase
      .from('clients')
      .update(client)
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
    
    return data as Job;
  }

  async getJobs(): Promise<Job[]> {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data as Job[];
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
      return data as Job[];
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
    
    return data as Job[];
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

  async publishJob(jobId: string): Promise<Job> {
    const { data, error } = await supabase
      .from('jobs')
      .update({ 
        status: 'open',
        published_at: new Date().toISOString()
      })
      .eq('id', jobId)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to publish job: ${error.message}`);
    }
    
    return data as Job;
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

  async getPublicJobs(): Promise<Job[]> {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'open')
      .not('published_at', 'is', null)
      .eq('record_status', 'active')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data as Job[];
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
      const jobs = hasMore ? data.slice(0, limit) : data;

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
        data: jobs as Job[],
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
}