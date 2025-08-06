import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'
import { InsertJob, Job } from '../../../shared/schema'
import { useAuth } from '@/contexts/AuthContext'

export function useCreateJob() {
  const queryClient = useQueryClient()
  const { currentOrgId } = useAuth()

  return useMutation({
    mutationFn: async (jobData: Omit<InsertJob, 'orgId'>) => {
      if (!currentOrgId) {
        throw new Error('Organization ID is required')
      }

      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...jobData,
          orgId: currentOrgId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create job')
      }

      return response.json() as Promise<Job>
    },
    onSuccess: () => {
      // Invalidate and refetch jobs list
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] })
    },
  })
}

export function useJobApplication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ jobId, candidateData }: { 
      jobId: string, 
      candidateData: { 
        candidateId?: string, 
        name?: string, 
        email?: string, 
        phone?: string 
      } 
    }) => {
      const response = await fetch(`/api/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(candidateData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to apply to job')
      }

      return response.json()
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/job-candidates', variables.jobId] })
      queryClient.invalidateQueries({ queryKey: ['/api/candidates'] })
    },
  })
}