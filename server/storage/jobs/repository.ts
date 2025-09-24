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
    // TODO: Extract from original storage.ts
    throw new Error('Method not implemented.');
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
    // TODO: Extract from original storage.ts
    throw new Error('Method not implemented.');
  }

  async getJobsByClient(clientId: string): Promise<Job[]> {
    // TODO: Extract from original storage.ts
    throw new Error('Method not implemented.');
  }

  async createJob(job: InsertJob): Promise<Job> {
    // TODO: Extract from original storage.ts
    throw new Error('Method not implemented.');
  }

  async publishJob(jobId: string): Promise<Job> {
    // TODO: Extract from original storage.ts
    throw new Error('Method not implemented.');
  }

  async updateJob(id: string, data: Partial<InsertJob>): Promise<Job> {
    // TODO: Extract from original storage.ts
    throw new Error('Method not implemented.');
  }

  async deleteJob(id: string): Promise<void> {
    // TODO: Extract from original storage.ts
    throw new Error('Method not implemented.');
  }

  async searchJobs(searchTerm: string, orgId: string): Promise<Job[]> {
    // TODO: Extract from original storage.ts
    throw new Error('Method not implemented.');
  }

  async getPublicJobs(): Promise<Job[]> {
    // TODO: Extract from original storage.ts
    throw new Error('Method not implemented.');
  }

  async getPublicJobsByOrg(orgId: string): Promise<Job[]> {
    // TODO: Extract from original storage.ts
    throw new Error('Method not implemented.');
  }

  async getPublicJob(id: string): Promise<Job | undefined> {
    // TODO: Extract from original storage.ts
    throw new Error('Method not implemented.');
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

  async searchJobsAdvanced(filters: any): Promise<Job[]> {
    // TODO: Extract from original storage.ts
    throw new Error('Method not implemented.');
  }

  async getJobsPaginated(params: any): Promise<any> {
    // TODO: Extract from original storage.ts
    throw new Error('Method not implemented.');
  }
}