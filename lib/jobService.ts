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
}

export interface UserContext {
  userId: string;
  orgId: string;
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
}

// Enhanced interfaces for job application system
export interface ApplicantData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  coverLetter?: string;
  resumeUrl?: string;
}

// Resume URL validation function
function validateResumeUrl(resumeUrl: string): boolean {
  if (!resumeUrl) return true; // Optional field
  
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
    
    return false;
  } catch (error) {
    console.error('Invalid resume URL format:', resumeUrl);
    return false;
  }
}

// Validate file metadata if available
function validateFileMetadata(fileMetadata?: { type?: string; size?: number }): string | null {
  if (!fileMetadata) return null;
  
  const { type, size } = fileMetadata;
  
  // File type validation
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (type && !allowedTypes.includes(type)) {
    return 'Invalid file type. Only PDF, DOC, and DOCX files are allowed.';
  }
  
  // File size validation (10MB max)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (size && size > maxSize) {
    return 'File size exceeds 10MB limit.';
  }
  
  return null;
}

export interface ApplicationResult {
  candidateId: string;
  applicationId: string; // This will be the job_candidate record ID
  success: boolean;
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

export async function createJob(data: CreateJobData, userContext: UserContext) {
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
  
  if (!userOrg) {
    throw new Error('Access denied: User not authorized for this organization');
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
      created_by: userContext.userId
    }])
    .select()
    .single();
    
  if (error) {
    console.error('Job creation error:', error);
    throw new Error(`Failed to create job: ${error.message}`);
  }
  
  return result;
}

export async function publishJob(jobId: string, userContext: UserContext) {
  // First, get the job and verify access
  const { data: job, error: fetchError } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single();
  
  if (fetchError || !job) {
    throw new Error('Job not found');
  }
  
  // Verify user has access to this job's organization
  const { data: userOrg } = await supabase
    .from('user_organizations')
    .select('id')
    .eq('user_id', userContext.userId)
    .eq('org_id', job.org_id)
    .single();
  
  if (!userOrg) {
    throw new Error('Access denied: User not authorized for this organization');
  }
  
  // Validate required fields for publishing
  const validationErrors: string[] = [];
  
  if (!job.title?.trim()) {
    validationErrors.push('Job title is required');
  }
  if (!job.description?.trim()) {
    validationErrors.push('Job description is required');
  }
  if (!job.location?.trim()) {
    validationErrors.push('Job location is required');
  }
  if (!job.job_type) {
    validationErrors.push('Job type is required');
  }
  
  if (validationErrors.length > 0) {
    const error = new Error('Validation failed');
    (error as any).validationErrors = validationErrors;
    throw error;
  }
  
  // Check if job is already published (idempotent)
  if (job.status === 'open' && job.published_at) {
    return {
      publicUrl: `/careers/${job.public_slug}`,
      job: {
        id: job.id,
        slug: job.public_slug,
        status: job.status,
        published_at: job.published_at
      }
    };
  }
  
  // Ensure slug exists (re-generate if needed)
  let slug = job.public_slug;
  if (!slug) {
    slug = await generateUniqueSlug(job.title, job.id);
  }
  
  // Update job to published state
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
    console.error('Job publish error:', updateError);
    throw new Error(`Failed to publish job: ${updateError.message}`);
  }

  // Import here to avoid circular dependency
  const { ensureDefaultPipelineForJob } = await import('../server/lib/pipelineService');
  
  // Ensure default pipeline exists for this job (idempotent)
  try {
    await ensureDefaultPipelineForJob({ 
      jobId: updatedJob.id, 
      organizationId: updatedJob.org_id 
    });
    console.log('Default pipeline ensured for published job:', updatedJob.id);
  } catch (pipelineError) {
    console.warn('Failed to create pipeline for job, but job published successfully:', pipelineError);
    // Don't fail job publishing if pipeline creation fails
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



// New comprehensive job application function
export async function applyToJob(
  { jobId, applicant }: { jobId: string; applicant: ApplicantData }, 
  requestContext?: { orgId?: string }
): Promise<ApplicationResult> {
  console.log('[JobService] Starting job application process', { jobId, email: applicant.email });
  
  // Server-side validation
  if (!applicant.firstName || !applicant.lastName || !applicant.email) {
    throw new Error('Missing required fields: firstName, lastName, and email are required');
  }
  
  // Validate resume URL if provided
  if (applicant.resumeUrl && !validateResumeUrl(applicant.resumeUrl)) {
    console.error('[JobService] Invalid resume URL:', applicant.resumeUrl);
    throw new Error('Invalid resume URL. Please upload your resume through the provided interface.');
  }
  
  console.log('[JobService] Validation passed for application:', { 
    jobId, 
    email: applicant.email,
    hasResume: !!applicant.resumeUrl 
  });
  
  // Start a transaction using RPC function or manual transaction handling
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
    console.error('[JobService] Job validation failed:', jobError);
    throw new Error('Job not found or not available for applications');
  }

  const orgId = jobData.org_id;
  console.log('[JobService] Job validated for org:', orgId);

  try {
    // Step 1: Check if candidate already exists for this organization
    let candidateId: string;
    const fullName = `${applicant.firstName} ${applicant.lastName}`.trim();

    const { data: existingCandidate, error: candidateCheckError } = await supabase
      .from('candidates')
      .select('id, name, email')
      .eq('org_id', orgId)
      .eq('email', applicant.email.toLowerCase())
      .single();

    if (candidateCheckError && candidateCheckError.code !== 'PGRST116') {
      console.error('[JobService] Error checking existing candidate:', candidateCheckError);
      throw new Error('Database error during candidate lookup');
    }

    if (existingCandidate) {
      // Candidate exists, reuse
      candidateId = existingCandidate.id;
      console.log('[JobService] Reusing existing candidate:', candidateId);
      
      // Optionally update candidate info if provided
      if (applicant.resumeUrl || applicant.phone) {
        const updates: any = { updated_at: new Date().toISOString() };
        if (applicant.resumeUrl) updates.resume_url = applicant.resumeUrl;
        if (applicant.phone) updates.phone = applicant.phone;
        
        await supabase
          .from('candidates')
          .update(updates)
          .eq('id', candidateId);
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
          resume_url: applicant.resumeUrl,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (createCandidateError) {
        console.error('[JobService] Error creating candidate:', createCandidateError);
        throw new Error('Failed to create candidate profile');
      }

      candidateId = newCandidate.id;
      console.log('[JobService] Created new candidate:', candidateId);
    }

    // Step 2: Check if application already exists
    const { data: existingApplication, error: applicationCheckError } = await supabase
      .from('job_candidate')
      .select('id')
      .eq('job_id', jobId)
      .eq('candidate_id', candidateId)
      .single();

    if (applicationCheckError && applicationCheckError.code !== 'PGRST116') {
      console.error('[JobService] Error checking existing application:', applicationCheckError);
      throw new Error('Database error during application lookup');
    }

    if (existingApplication) {
      console.log('[JobService] Application already exists:', existingApplication.id);
      return {
        candidateId,
        applicationId: existingApplication.id,
        success: true
      };
    }

    // Step 3: Get first pipeline column for this specific job
    // Import here to avoid circular dependency
    const { getFirstColumnId } = await import('../server/lib/pipelineService');
    
    let firstColumnId: string;
    try {
      firstColumnId = await getFirstColumnId({ 
        jobId, 
        organizationId: orgId 
      });
      console.log('[JobService] Got first column ID for job application:', firstColumnId);
    } catch (columnError) {
      console.error('[JobService] Error getting first column for job:', columnError);
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
        notes: applicant.coverLetter || null,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (applicationError) {
      console.error('[JobService] Error creating application:', applicationError);
      throw new Error('Failed to submit job application');
    }

    console.log('[JobService] Job application completed successfully', {
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
    console.error('[JobService] Job application transaction failed:', error);
    throw error;
  }
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

// This duplicate function is removed - using the enhanced version above

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