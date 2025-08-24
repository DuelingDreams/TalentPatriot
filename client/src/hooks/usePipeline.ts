import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'
import type { JobCandidate } from '@shared/schema'
import { useDemoFlag } from '@/lib/demoFlag'
import { demoAdapter } from '@/lib/dataAdapter'

export interface PipelineColumn {
  id: string
  title: string
  position: string
}

export interface PipelineApplication {
  id: string
  jobId: string
  candidateId: string
  columnId: string | null
  status: string
  appliedAt: string
  candidate: {
    id: string
    name: string
    email: string
    phone: string | null
    resumeUrl: string | null
  }
}

export interface PipelineData {
  columns: PipelineColumn[]
  applications: PipelineApplication[]
}

// Get pipeline data for an organization
export function usePipeline(orgId: string | undefined) {
  return useQuery({
    queryKey: ['pipeline', orgId],
    queryFn: async (): Promise<PipelineData> => {
      if (!orgId) throw new Error('Organization ID is required')
      return apiRequest(`/api/pipeline/${orgId}`)
    },
    enabled: !!orgId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000  // 5 minutes
  })
}

// Get pipeline data for a specific job
export function useJobPipeline(jobId: string | undefined) {
  const { isDemoUser } = useDemoFlag()

  return useQuery({
    queryKey: ['job-pipeline', jobId],
    queryFn: async (): Promise<PipelineData> => {
      if (!jobId) throw new Error('Job ID is required')
      
      if (isDemoUser) {
        // Return demo pipeline data
        return {
          columns: [
            { id: 'applied', title: 'Applied', position: '1' },
            { id: 'screen', title: 'Screen', position: '2' },
            { id: 'interview', title: 'Interview', position: '3' },
            { id: 'offer', title: 'Offer', position: '4' },
            { id: 'hired', title: 'Hired', position: '5' },
          ],
          applications: await demoAdapter.getCandidatesForJob(jobId).then(candidates =>
            candidates.map((c: any) => ({
              id: c.id,
              jobId: jobId,
              candidateId: c.id,
              columnId: 'applied', // Default demo candidates to applied stage
              status: 'active',
              appliedAt: c.createdAt || new Date().toISOString(),
              candidate: {
                id: c.id,
                name: c.name,
                email: c.email,
                phone: c.phone,
                resumeUrl: c.resumeUrl
              }
            }))
          )
        }
      }
      
      return apiRequest(`/api/jobs/${jobId}/pipeline`)
    },
    enabled: !!jobId,
    staleTime: isDemoUser ? 60000 : 2 * 60 * 1000, // 1 minute for demo, 2 minutes for live
    gcTime: 5 * 60 * 1000  // 5 minutes
  })
}

// Get pipeline columns for an organization
export function usePipelineColumns(orgId: string | undefined) {
  return useQuery({
    queryKey: ['pipeline-columns', orgId],
    queryFn: async (): Promise<PipelineColumn[]> => {
      if (!orgId) throw new Error('Organization ID is required')
      return apiRequest(`/api/pipeline-columns/${orgId}`)
    },
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000, // 5 minutes - columns don't change often
    gcTime: 10 * 60 * 1000 // 10 minutes
  })
}

// Get pipeline columns for a specific job
export function useJobPipelineColumns(jobId: string | undefined) {
  return useQuery({
    queryKey: ['job-pipeline-columns', jobId],
    queryFn: async (): Promise<PipelineColumn[]> => {
      if (!jobId) throw new Error('Job ID is required')
      return apiRequest(`/api/jobs/${jobId}/pipeline-columns`)
    },
    enabled: !!jobId,
    staleTime: 5 * 60 * 1000, // 5 minutes - columns don't change often
    gcTime: 10 * 60 * 1000 // 10 minutes
  })
}

// Move application to different pipeline column (drag and drop)
export function useMoveApplication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ applicationId, columnId, jobId }: { applicationId: string; columnId: string; jobId?: string }) => {
      return apiRequest({
        url: `/api/applications/${applicationId}/move`,
        method: 'PATCH',
        body: JSON.stringify({ columnId })
      })
    },
    onSuccess: (_, variables) => {
      // Invalidate all pipeline-related queries
      queryClient.invalidateQueries({ queryKey: ['job-pipeline'] })
      queryClient.invalidateQueries({ queryKey: ['pipeline'] })
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      // Invalidate specific job pipeline if jobId is provided
      if (variables.jobId) {
        queryClient.invalidateQueries({ queryKey: ['pipeline', variables.jobId] })
        queryClient.invalidateQueries({ queryKey: ['job-pipeline', variables.jobId] })
      }
    }
  })
}

// Helper function to organize applications by column
export function organizeApplicationsByColumn(applications: PipelineApplication[], columns: PipelineColumn[]) {
  const columnMap = new Map<string, PipelineApplication[]>()
  
  // Initialize columns
  columns.forEach(column => {
    columnMap.set(column.id, [])
  })
  
  // Add applications to their respective columns
  applications.forEach(application => {
    const columnId = application.columnId || columns[0]?.id // Default to first column if no columnId
    if (columnId && columnMap.has(columnId)) {
      columnMap.get(columnId)!.push(application)
    }
  })
  
  return columnMap
}