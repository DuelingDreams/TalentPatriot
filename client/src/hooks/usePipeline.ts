import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'
import type { JobCandidate } from '@shared/schema'
import { useDemoFlag } from '@/lib/demoFlag'
import { demoAdapter } from '@/lib/dataAdapter'
import { useAuth } from '@/contexts/AuthContext'

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
export function useJobPipeline(jobId: string | undefined, options?: { enableRealTime?: boolean }) {
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
            { id: 'screening', title: 'Screen', position: '2' }, // Fixed: use 'screening' ID to match enum
            { id: 'interview', title: 'Interview', position: '3' },
            { id: 'offer', title: 'Offer', position: '4' },
            { id: 'hired', title: 'Hired', position: '5' },
          ],
          applications: await demoAdapter.getCandidatesForJob(jobId).then(candidates =>
            candidates.map((c: any) => ({
              id: c.id,
              jobId: jobId,
              candidateId: c.id,
              columnId: 'applied', // Default demo candidates to applied stage (matches enum)
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
      
      const result = await apiRequest(`/api/jobs/${jobId}/pipeline`)
      return result as PipelineData
    },
    enabled: !!jobId,
    // Optimized for real-time pipeline updates
    staleTime: options?.enableRealTime ? 1000 : (2 * 60 * 1000), // 1 second for real-time, 2 minutes otherwise
    refetchInterval: isDemoUser ? false : (options?.enableRealTime ? 10000 : false), // 10 seconds for real-time updates
    refetchOnWindowFocus: !isDemoUser,
    refetchOnReconnect: true,
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
// Track pending moves to prevent concurrent operations on the same card
const pendingMoves = new Set<string>();

export function useMoveApplication(jobId: string) {
  const queryClient = useQueryClient()
  const { currentOrgId } = useAuth()

  return useMutation({
    mutationFn: async ({ applicationId, columnId }: { applicationId: string; columnId: string }) => {
      
      // Validate required parameters
      if (!applicationId || !columnId || !jobId || !currentOrgId) {
        throw new Error(`Missing required parameters: applicationId=${!!applicationId}, columnId=${!!columnId}, jobId=${!!jobId}, orgId=${!!currentOrgId}`);
      }

      // Prevent concurrent moves of the same application
      if (pendingMoves.has(applicationId)) {
        throw new Error(`Move already in progress for this application`);
      }

      // Add to pending moves
      pendingMoves.add(applicationId);
      
      try {
        console.log('[useMoveApplication] API call with:', { 
          applicationId, 
          columnId, 
          jobId, 
          orgId: currentOrgId,
          endpoint: `/api/jobs/${jobId}/applications/${applicationId}/move`
        });
        
        // Use applicationId-based endpoint for consistency with drag identifiers
        const response = await apiRequest(`/api/jobs/${jobId}/applications/${applicationId}/move`, {
          method: 'PATCH',
          body: JSON.stringify({ columnId })
        });
        
        console.log('[useMoveApplication] API response:', response);
        return response;
      } finally {
        // Always remove from pending moves
        pendingMoves.delete(applicationId);
      }
    },
    
    // Optimistic update: immediately update UI before API call completes
    onMutate: async ({ applicationId, columnId }) => {
      console.log('[useMoveApplication] Starting optimistic update:', { applicationId, columnId });
      
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['job-pipeline', jobId] });
      
      // Snapshot the previous value for rollback
      const previousData = queryClient.getQueryData(['job-pipeline', jobId]);
      
      // Optimistically update the data
      queryClient.setQueryData(['job-pipeline', jobId], (old: any) => {
        if (!old || !old.applications) return old;
        
        const updatedApplications = old.applications.map((app: any) => {
          // Match by applicationId (job_candidate.id) directly
          if (app.id === applicationId) {
            console.log('[Optimistic Update] Found matching application:', { 
              applicationId, 
              oldColumnId: app.columnId, 
              newColumnId: columnId 
            });
            return { ...app, columnId: columnId };
          }
          return app;
        });
        
        return { ...old, applications: updatedApplications };
      });
      
      // Return context object with the snapshotted value
      return { previousData };
    },
    
    onSuccess: (data: any) => {
      console.log('[useMoveApplication] Move successful - data updated in database');
      
      // Directly update the cache with the returned data to ensure UI stays consistent
      queryClient.setQueryData(['job-pipeline', jobId], (old: any) => {
        if (!old || !old.applications) return old;
        
        const updatedApplications = old.applications.map((app: any) => {
          if (app.id === data.jobCandidate?.id) {
            console.log('[useMoveApplication] Updating cache with server response:', {
              oldColumnId: app.columnId,
              newColumnId: data.jobCandidate.pipeline_column_id,
              stage: data.jobCandidate.stage
            });
            return { 
              ...app, 
              columnId: data.jobCandidate.pipeline_column_id,
              stage: data.jobCandidate.stage,
              updatedAt: data.jobCandidate.updated_at
            };
          }
          return app;
        });
        
        console.log('[useMoveApplication] Cache updated successfully');
        return { ...old, applications: updatedApplications };
      });
      
      // Also invalidate to trigger background refresh
      queryClient.invalidateQueries({ queryKey: ['job-pipeline', jobId] });
    },
    
    onError: (error, { applicationId }, context) => {
      console.error('[useMoveApplication] Move failed:', error);
      
      // Rollback optimistic update
      if (context?.previousData) {
        console.log('[useMoveApplication] Rolling back optimistic update');
        queryClient.setQueryData(['job-pipeline', jobId], context.previousData);
      }
      
      // Re-throw error for the component to handle with user-friendly messages
      throw error;
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

// Hook for rejecting candidates
export function useRejectCandidate(jobId: string) {
  const queryClient = useQueryClient()
  const { currentOrgId } = useAuth()

  return useMutation({
    mutationFn: async ({ applicationId }: { applicationId: string }) => {
      
      // Validate required parameters
      if (!applicationId || !jobId || !currentOrgId) {
        throw new Error(`Missing required parameters: applicationId=${!!applicationId}, jobId=${!!jobId}, orgId=${!!currentOrgId}`);
      }

      console.log('[useRejectCandidate] API call with:', { 
        applicationId, 
        jobId, 
        orgId: currentOrgId,
        endpoint: `/api/jobs/${jobId}/applications/${applicationId}/reject`
      });
      
      const response = await apiRequest(`/api/jobs/${jobId}/applications/${applicationId}/reject`, {
        method: 'PATCH'
      });
      
      console.log('[useRejectCandidate] API response:', response);
      return response;
    },
    
    onSuccess: (data: any) => {
      console.log('[useRejectCandidate] Reject successful - removing from pipeline');
      
      // Remove rejected candidate from pipeline view
      queryClient.setQueryData(['job-pipeline', jobId], (old: any) => {
        if (!old || !old.applications) return old;
        
        const filteredApplications = old.applications.filter((app: any) => 
          app.id !== data.jobCandidate?.id
        );
        
        console.log('[useRejectCandidate] Candidate removed from pipeline view');
        return { ...old, applications: filteredApplications };
      });
      
      // Invalidate to trigger background refresh
      queryClient.invalidateQueries({ queryKey: ['job-pipeline', jobId] });
    },
    
    onError: (error) => {
      console.error('[useRejectCandidate] Reject failed:', error);
    }
  })
}