import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'

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

// Move application to different pipeline column (drag and drop)
export function useMoveApplication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ applicationId, columnId }: { applicationId: string; columnId: string }) => {
      return apiRequest(`/api/applications/${applicationId}/move`, {
        method: 'PATCH',
        body: JSON.stringify({ columnId })
      })
    },
    onSuccess: () => {
      // Invalidate pipeline queries to refresh the view
      queryClient.invalidateQueries({ queryKey: ['pipeline'] })
      queryClient.invalidateQueries({ queryKey: ['applications'] })
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