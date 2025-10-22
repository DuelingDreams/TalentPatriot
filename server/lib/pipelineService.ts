import { supabase } from './supabase'

// Default pipeline columns in order for each job
const DEFAULT_PIPELINE_COLUMNS = [
  'Applied',
  'Screen', 
  'Interview',
  'Offer',
  'Hired'
]

// Job-specific pipeline creation
export const ensureDefaultPipelineForJob = async ({ jobId, organizationId }: { jobId: string; organizationId: string }) => {
  console.log('[PipelineService] Ensuring default pipeline for job:', { jobId, organizationId });
  
  try {
    // Check if pipeline columns already exist for this job
    const { data: existingCols, error: fetchError } = await supabase
      .from('pipeline_columns')
      .select('*')
      .eq('job_id', jobId)
      .eq('org_id', organizationId)
      .order('position')

    if (fetchError) {
      console.error('Error fetching job pipeline columns:', fetchError)
      throw fetchError
    }

    // If no columns exist for this job, create the default set
    if (!existingCols || existingCols.length === 0) {
      const defaultCols = DEFAULT_PIPELINE_COLUMNS.map((title, index) => ({
        org_id: organizationId,
        job_id: jobId,
        title,
        position: index,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

      const { data: createdCols, error: insertError } = await supabase
        .from('pipeline_columns')
        .insert(defaultCols)
        .select()

      if (insertError) {
        console.error('Error creating default job pipeline columns:', insertError)
        throw insertError
      }

      console.log(`Created default pipeline columns for job ${jobId}:`, createdCols?.length);
      return createdCols || []
    }

    console.log(`Job ${jobId} already has ${existingCols.length} pipeline columns`);
    return existingCols
  } catch (error) {
    console.error('Error ensuring default pipeline for job:', error)
    throw error
  }
}

// Get the first column ID for a specific job
export const getFirstColumnId = async ({ jobId, organizationId }: { jobId: string; organizationId: string }): Promise<string> => {
  console.log('[PipelineService] Getting first column ID for job:', { jobId, organizationId });
  
  try {
    // Ensure default pipeline exists first
    await ensureDefaultPipelineForJob({ jobId, organizationId })
    
    // Get the first column by position
    const { data, error } = await supabase
      .from('pipeline_columns')
      .select('id, title, position')
      .eq('job_id', jobId)
      .eq('org_id', organizationId)
      .order('position', { ascending: true })
      .limit(1)
      .single()
    
    if (error) {
      console.error('Error fetching first pipeline column for job:', error)
      throw error
    }
    
    if (!data) {
      throw new Error(`No pipeline columns found for job ${jobId}`)
    }
    
    console.log(`First column for job ${jobId}:`, { id: data.id, title: data.title, position: data.position });
    return data.id
  } catch (error) {
    console.error('Error getting first column ID for job:', error)
    throw error
  }
}

// Deprecated org-based pipeline functions removed
// Use job-specific functions instead: ensureDefaultPipelineForJob, getFirstColumnId

export const moveJobCandidate = async (jobCandidateId: string, newStage: string) => {
  try {
    const { error } = await supabase
      .from('job_candidate')
      .update({ 
        stage: newStage,
        updated_at: new Date().toISOString() 
      })
      .eq('id', jobCandidateId)

    if (error) {
      console.error('Error moving job candidate:', error)
      throw error
    }

    return true
  } catch (error) {
    console.error('Error moving job candidate:', error)
    throw error
  }
}