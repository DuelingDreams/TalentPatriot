import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// Clean Supabase service layer for job/candidate/application operations
// Replaces old mixed in-memory storage and broken applications table references

export async function createJob(data: {
  title: string;
  description: string;
  clientId: string;
  orgId: string;
  location?: string;
  jobType?: string;
  status?: string;
}) {
  const { data: result, error } = await supabase
    .from('jobs')
    .insert([{ 
      title: data.title,
      description: data.description,
      location: data.location || null,
      job_type: data.jobType || 'full-time',
      client_id: data.clientId,
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
  const { data, error } = await supabase
    .from('jobs')
    .update({ 
      status: 'open', 
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

export async function createCandidate(data: {
  name: string;
  email: string;
  phone?: string;
  orgId: string;
  resumeUrl?: string;
}) {
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