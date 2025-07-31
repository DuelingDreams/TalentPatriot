import { supabase } from '../lib/supabase'

// Default pipeline columns in order
const DEFAULT_PIPELINE_COLUMNS = [
  'New',
  'Screening', 
  'Interview',
  'Offer',
  'Hired',
  'Rejected'
]

export const ensureDefaultPipeline = async (orgId: string) => {
  try {
    // Check if pipeline columns already exist for this org
    const { data: existingCols, error: fetchError } = await supabase
      .from('pipeline_columns')
      .select('*')
      .eq('org_id', orgId)
      .order('position')

    if (fetchError) {
      console.error('Error fetching pipeline columns:', fetchError)
      throw fetchError
    }

    // If no columns exist, create the default set
    if (!existingCols || existingCols.length === 0) {
      const defaultCols = DEFAULT_PIPELINE_COLUMNS.map((title, index) => ({
        org_id: orgId,
        title,
        position: index.toString()
      }))

      const { error: insertError } = await supabase
        .from('pipeline_columns')
        .insert(defaultCols)

      if (insertError) {
        console.error('Error creating default pipeline columns:', insertError)
        throw insertError
      }

      console.log(`Created default pipeline columns for org ${orgId}`)
    }

    return true
  } catch (error) {
    console.error('Error ensuring default pipeline:', error)
    throw error
  }
}

export const getFirstPipelineColumn = async (orgId: string) => {
  try {
    // Ensure default pipeline exists
    await ensureDefaultPipeline(orgId)

    // Get the first column (position 0)
    const { data: firstColumn, error } = await supabase
      .from('pipeline_columns')
      .select('*')
      .eq('org_id', orgId)
      .order('position')
      .limit(1)
      .single()

    if (error) {
      console.error('Error fetching first pipeline column:', error)
      throw error
    }

    return firstColumn
  } catch (error) {
    console.error('Error getting first pipeline column:', error)
    throw error
  }
}

export const getPipelineForOrg = async (orgId: string) => {
  try {
    // Ensure default pipeline exists
    await ensureDefaultPipeline(orgId)

    // Get all columns for the organization
    const { data: columns, error: columnsError } = await supabase
      .from('pipeline_columns')
      .select('id, title, position')
      .eq('org_id', orgId)
      .order('position')

    if (columnsError) {
      console.error('Error fetching pipeline columns:', columnsError)
      throw columnsError
    }

    // Get applications for each column
    const pipeline = await Promise.all(
      columns.map(async (col) => {
        const { data: apps, error: appsError } = await supabase
          .from('applications')
          .select(`
            id,
            status,
            applied_at,
            candidate:candidates (
              id,
              name,
              email,
              phone,
              resume_url
            ),
            job:jobs (
              id,
              title
            )
          `)
          .eq('column_id', col.id)
          .order('applied_at', { ascending: true })

        if (appsError) {
          console.error('Error fetching applications for column:', appsError)
          throw appsError
        }

        return {
          ...col,
          applications: apps || []
        }
      })
    )

    return pipeline
  } catch (error) {
    console.error('Error getting pipeline for org:', error)
    throw error
  }
}

export const moveApplication = async (applicationId: string, newColumnId: string) => {
  try {
    const { error } = await supabase
      .from('applications')
      .update({ column_id: newColumnId })
      .eq('id', applicationId)

    if (error) {
      console.error('Error moving application:', error)
      throw error
    }

    return true
  } catch (error) {
    console.error('Error moving application:', error)
    throw error
  }
}