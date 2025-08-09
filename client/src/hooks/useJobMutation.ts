import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'
import { InsertJob, Job } from '../../../shared/schema'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

export function useCreateJob() {
  const queryClient = useQueryClient()
  const { currentOrgId } = useAuth()

  return useMutation({
    mutationFn: async (jobData: Omit<InsertJob, 'orgId'>) => {
      if (!currentOrgId) {
        throw new Error('Organization ID is required')
      }

      // Send all job data fields to API
      const validJobData = {
        ...jobData,
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
    onMutate: async (newJob) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/jobs'] })
      
      // Snapshot the previous value
      const previousJobs = queryClient.getQueryData(['/api/jobs'])
      
      // Optimistically update to the new value with placeholder slug
      queryClient.setQueryData(['/api/jobs'], (old: any) => {
        const optimisticJob = {
          id: `temp-${Date.now()}`,
          ...newJob,
          orgId: currentOrgId,
          status: 'draft',
          publicSlug: `temp-slug-${Date.now()}`, // Placeholder slug
          createdAt: new Date().toISOString(),
        }
        return old ? [...old, optimisticJob] : [optimisticJob]
      })
      
      return { previousJobs }
    },
    onError: (err, newJob, context) => {
      // If the mutation fails, use the context to roll back
      queryClient.setQueryData(['/api/jobs'], context?.previousJobs)
      toast.error(err.message || 'Failed to create job')
    },
    onSuccess: (data) => {
      toast.success('Job created successfully!')
      // Immediately refetch to get server-generated slug
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] })
    },
    onSettled: () => {
      // Always refetch to sync with server state
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
      toast.success('Application submitted successfully!')
      queryClient.invalidateQueries({ queryKey: ['/api/job-candidates', variables.jobId] })
      queryClient.invalidateQueries({ queryKey: ['/api/candidates'] })
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to submit application')
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

      return response.json() as Promise<{
        publicUrl: string;
        job: {
          id: string;
          slug: string;
          status: string;
          published_at: string;
        };
      }>
    },
    onMutate: async (jobId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/jobs'] })
      
      // Snapshot the previous value
      const previousJobs = queryClient.getQueryData(['/api/jobs'])
      
      // Optimistically update the job status
      queryClient.setQueryData(['/api/jobs'], (old: any) => {
        if (!old) return old
        return old.map((job: any) => 
          job.id === jobId ? { ...job, status: 'open' } : job
        )
      })
      
      return { previousJobs }
    },
    onError: (err, jobId, context) => {
      // Roll back on error
      queryClient.setQueryData(['/api/jobs'], context?.previousJobs)
      toast.error(err.message || 'Failed to publish job')
    },
    onSuccess: (result) => {
      toast.success(`Job published successfully! View at: ${result.publicUrl}`)
      // Invalidate queries to sync state
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] })
      queryClient.invalidateQueries({ queryKey: ['/api/public/jobs'] })
      return result
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
    onMutate: async (newCandidate) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/candidates'] })
      
      // Snapshot the previous value
      const previousCandidates = queryClient.getQueryData(['/api/candidates'])
      
      // Optimistically update to the new value
      queryClient.setQueryData(['/api/candidates'], (old: any) => {
        const optimisticCandidate = {
          id: `temp-${Date.now()}`,
          ...newCandidate,
          orgId: currentOrgId,
          status: 'active',
          createdAt: new Date().toISOString(),
        }
        return old ? [...old, optimisticCandidate] : [optimisticCandidate]
      })
      
      return { previousCandidates }
    },
    onError: (err, newCandidate, context) => {
      // Roll back on error
      queryClient.setQueryData(['/api/candidates'], context?.previousCandidates)
      toast.error(err.message || 'Failed to add candidate')
    },
    onSuccess: (data) => {
      toast.success('Candidate added successfully!')
      queryClient.invalidateQueries({ queryKey: ['/api/candidates'] })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/candidates'] })
    },
  })
}