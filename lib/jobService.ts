import { createClient } from '@supabase/supabase-js';

// Create Supabase client for server-side operations with service role key
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
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
  }
);

// Clean Supabase service layer for job/candidate/application operations
// Replaces old mixed in-memory storage and broken applications table references

export interface CreateJobData {
  title: string;
  description: string;
  clientId?: string;
  orgId: string;
  location?: string;
  jobType?: string;
  status?: string;
  remoteOption?: string;
  salaryRange?: string;
  experienceLevel?: string;
  postingTargets?: string[];
  autoPost?: boolean;
}

export interface CreateCandidateData {
  name: string;
  email: string;
  phone?: string;
  orgId: string;
  resumeUrl?: string;
}

export interface JobApplicationData {
  jobId: string;
  candidateEmail: string;
  candidateName: string;
  candidatePhone?: string;
  resumeUrl?: string;
  orgId: string;
}

export async function createJob(data: CreateJobData) {
  const { data: result, error } = await supabase
    .from('jobs')
    .insert([{ 
      title: data.title,
      description: data.description,
      location: data.location || null,
      job_type: data.jobType || 'full-time',
      client_id: data.clientId || null,
      org_id: data.orgId,
      status: data.status || 'draft',
      record_status: 'active'
    }])
    .select()
    .single();
    
  if (error) {
    console.error('Job creation error:', error);
    throw new Error(`Failed to create job: ${error.message}`);
  }
  
  return result;
}

export async function publishJob(jobId: string) {
  // Generate a public slug based on job title and id
  const { data: jobData, error: fetchError } = await supabase
    .from('jobs')
    .select('title')
    .eq('id', jobId)
    .single();
    
  if (fetchError) {
    console.error('Error fetching job for slug generation:', fetchError);
    throw new Error(`Failed to fetch job: ${fetchError.message}`);
  }
  
  const slug = jobData.title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 50) + '-' + jobId.slice(0, 8);

  const { data, error } = await supabase
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
    
  if (error) {
    console.error('Job publish error:', error);
    throw new Error(`Failed to publish job: ${error.message}`);
  }
  
  return data;
}

export async function createCandidate(data: CreateCandidateData) {
  const { data: result, error } = await supabase
    .from('candidates')
    .insert([{ 
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      resume_url: data.resumeUrl || null,
      org_id: data.orgId,
      status: 'active'
    }])
    .select()
    .single();
    
  if (error) {
    console.error('Candidate creation error:', error);
    throw new Error(`Failed to create candidate: ${error.message}`);
  }
  
  return result;
}

export async function createJobCandidate(data: {
  jobId: string;
  candidateId: string;
  orgId: string;
  pipelineColumnId?: string;
  stage?: string;
  notes?: string;
}) {
  const { data: result, error } = await supabase
    .from('job_candidate')
    .insert([{ 
      job_id: data.jobId,
      candidate_id: data.candidateId,
      org_id: data.orgId,
      stage: data.stage || 'applied',
      status: 'active',
      notes: data.notes || null
    }])
    .select()
    .single();
    
  if (error) {
    console.error('Job candidate creation error:', error);
    throw new Error(`Failed to create job candidate: ${error.message}`);
  }
  
  return result;
}

export async function getJobsByOrg(orgId: string) {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('org_id', orgId)
    .eq('record_status', 'active')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Jobs fetch error:', error);
    throw new Error(`Failed to fetch jobs: ${error.message}`);
  }
  
  return data;
}

export async function getCandidatesByOrg(orgId: string) {
  const { data, error } = await supabase
    .from('candidates')
    .select('*')
    .eq('org_id', orgId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Candidates fetch error:', error);
    throw new Error(`Failed to fetch candidates: ${error.message}`);
  }
  
  return data;
}

export async function getJobCandidatesByOrg(orgId: string) {
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

export async function getPublicJobs() {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('status', 'open')
    .neq('public_slug', null)
    .eq('record_status', 'active')
    .order('published_at', { ascending: false });
    
  if (error) {
    console.error('Public jobs fetch error:', error);
    throw new Error(`Failed to fetch public jobs: ${error.message}`);
  }
  
  return data || [];
}

export async function updateJobCandidateStage(jobCandidateId: string, newStage: string) {
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

export async function deleteJob(jobId: string) {
  const { error } = await supabase
    .from('jobs')
    .update({ record_status: 'deleted' })
    .eq('id', jobId);
    
  if (error) {
    console.error('Job deletion error:', error);
    throw new Error(`Failed to delete job: ${error.message}`);
  }
}

export async function deleteCandidate(candidateId: string) {
  const { error } = await supabase
    .from('candidates')
    .update({ status: 'deleted' })
    .eq('id', candidateId);
    
  if (error) {
    console.error('Candidate deletion error:', error);
    throw new Error(`Failed to delete candidate: ${error.message}`);
  }
}

// Get candidate by email or create if not exists (upsert logic)
export async function findOrCreateCandidate(data: CreateCandidateData) {
  // First, try to find existing candidate by email in the org
  const { data: existingCandidate, error: findError } = await supabase
    .from('candidates')
    .select('*')
    .eq('email', data.email)
    .eq('org_id', data.orgId)
    .eq('status', 'active')
    .single();
    
  if (findError && findError.code !== 'PGRST116') {
    console.error('Candidate search error:', findError);
    throw new Error(`Failed to search for candidate: ${findError.message}`);
  }
  
  if (existingCandidate) {
    return existingCandidate;
  }
  
  // Create new candidate if not found
  return await createCandidate(data);
}

// Complete job application flow
export async function applyToJob(data: JobApplicationData) {
  try {
    // 1. Find or create candidate
    const candidate = await findOrCreateCandidate({
      name: data.candidateName,
      email: data.candidateEmail,
      phone: data.candidatePhone,
      orgId: data.orgId,
      resumeUrl: data.resumeUrl
    });

    // 2. Check if already applied to this job
    const { data: existingJobCandidate, error: checkError } = await supabase
      .from('job_candidate')
      .select('*')
      .eq('job_id', data.jobId)
      .eq('candidate_id', candidate.id)
      .eq('status', 'active')
      .single();
      
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Job candidate check error:', checkError);
      throw new Error(`Failed to check existing application: ${checkError.message}`);
    }
    
    if (existingJobCandidate) {
      throw new Error('You have already applied to this job');
    }

    // 3. Create job candidate relationship
    const jobCandidate = await createJobCandidate({
      jobId: data.jobId,
      candidateId: candidate.id,
      orgId: data.orgId,
      stage: 'applied',
      notes: 'Applied via public careers page'
    });

    return {
      candidate,
      jobCandidate,
      message: 'Application submitted successfully'
    };
  } catch (error) {
    console.error('Job application error:', error);
    throw error;
  }
}

// Get the first pipeline column for new applications
export async function getFirstPipelineColumn(orgId: string) {
  const { data, error } = await supabase
    .from('pipeline_columns')
    .select('*')
    .eq('org_id', orgId)
    .order('position', { ascending: true })
    .limit(1);
    
  if (error) {
    console.error('First pipeline column error:', error);
    throw new Error(`Failed to get first pipeline column: ${error.message}`);
  }
  
  if (!data || data.length === 0) {
    throw new Error('No pipeline columns found for organization');
  }
  
  return data[0];
}