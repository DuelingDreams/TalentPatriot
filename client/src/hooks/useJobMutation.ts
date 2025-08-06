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

      // Filter out fields that don't exist in the database schema
      const validJobData = {
        title: jobData.title,
        description: jobData.description,
        location: jobData.location,
        jobType: jobData.jobType,
        salaryRange: jobData.salaryRange,
        clientId: jobData.clientId,
        status: jobData.status,
        orgId: currentOrgId,
      }

      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validJobData),
      })

      if (!response.ok) {
        const error = await response.json()
        // Handle validation errors from new Zod validation
        if (error.details && Array.isArray(error.details)) {
          throw new Error(`${error.error}: ${error.details.join(', ')}`)
        }
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
        name: string, 
        email: string, 
        phone?: string,
        resumeUrl?: string 
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
        // Handle validation errors from new Zod validation
        if (error.details && Array.isArray(error.details)) {
          throw new Error(`${error.error}: ${error.details.join(', ')}`)
        }
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

// New hook for job publishing
export function usePublishJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (jobId: string) => {
      const response = await fetch(`/api/jobs/${jobId}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        if (error.details && Array.isArray(error.details)) {
          throw new Error(`${error.error}: ${error.details.join(', ')}`)
        }
        throw new Error(error.error || 'Failed to publish job')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch jobs list
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] })
      queryClient.invalidateQueries({ queryKey: ['/api/public/jobs'] })
    },
  })
}

// New hook for candidate creation
export function useCreateCandidate() {
  const queryClient = useQueryClient()
  const { currentOrgId } = useAuth()

  return useMutation({
    mutationFn: async (candidateData: {
      name: string,
      email: string,
      phone?: string,
      resumeUrl?: string
    }) => {
      if (!currentOrgId) {
        throw new Error('Organization ID is required')
      }

      const response = await fetch('/api/candidates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...candidateData,
          orgId: currentOrgId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        if (error.details && Array.isArray(error.details)) {
          throw new Error(`${error.error}: ${error.details.join(', ')}`)
        }
        throw new Error(error.error || 'Failed to create candidate')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch candidates list
      queryClient.invalidateQueries({ queryKey: ['/api/candidates'] })
    },
  })
}