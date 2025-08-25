import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import { apiRequest } from '@/lib/queryClient'
import { useDemoFlag } from '@/lib/demoFlag'
import { demoAdapter } from '@/lib/dataAdapter'
import { InsertJob, Job } from '../../../shared/schema'

export function useJobsQuery() {
  const { currentOrgId } = useAuth()
  return useQuery({
    enabled: !!currentOrgId,
    queryKey: ['/api/jobs', currentOrgId],
    queryFn: async () => {
      if (!currentOrgId) throw new Error('Organization ID is required')
      const res = await fetch(`/api/jobs?orgId=${encodeURIComponent(currentOrgId)}`)
      if (!res.ok) throw new Error('Failed to load jobs')
      return res.json()
    },
  })
}

export function useCreateJob() {
  const qc = useQueryClient()
  const { currentOrgId, user } = useAuth()
  return useMutation({
    mutationFn: async (payload: any) => {
      if (!currentOrgId) throw new Error('Organization ID is required')
      if (!user?.id) throw new Error('User authentication required')
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'x-org-id': currentOrgId,
          'x-user-id': user.id
        },
        body: JSON.stringify({ ...payload, orgId: currentOrgId }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.details || err?.error || 'Failed to create job')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Job saved as draft')
      qc.invalidateQueries({ queryKey: ['/api/jobs'] })
      qc.invalidateQueries({ queryKey: ['/api/public/jobs'] })
    },
    onError: (e: any) => toast.error(e?.message || 'Failed to create job'),
  })
}

export function useJobApplication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ jobId, candidateData }: { 
      jobId: string, 
      candidateData: { 
        firstName: string,
        lastName: string,
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
      toast.success('Application submitted successfully! Your application will appear in the recruiter pipeline shortly.')
      queryClient.invalidateQueries({ queryKey: ['/api/job-candidates', variables.jobId] })
      queryClient.invalidateQueries({ queryKey: ['/api/candidates'] })
      // Invalidate pipeline queries to show new applicant immediately in "Applied" stage
      queryClient.invalidateQueries({ queryKey: ['job-pipeline', variables.jobId] })
      queryClient.invalidateQueries({ queryKey: ['/api/jobs', variables.jobId, 'pipeline'] })
      // Also invalidate organization pipeline for overall pipeline view
      queryClient.invalidateQueries({ queryKey: ['pipeline'] })
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to submit application')
    },
  })
}

export function usePublishJob() {
  const qc = useQueryClient()
  const { currentOrgId, user } = useAuth()
  return useMutation({
    mutationFn: async (jobId: string) => {
      if (!currentOrgId) throw new Error('Organization ID is required')
      if (!user?.id) throw new Error('User authentication required')
      const res = await fetch(`/api/jobs/${jobId}/publish`, {
        method: 'POST',
        headers: { 
          'x-org-id': currentOrgId,
          'x-user-id': user.id
        },
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.details || err?.error || 'Failed to publish job')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Job published')
      qc.invalidateQueries({ queryKey: ['/api/jobs'] })
      qc.invalidateQueries({ queryKey: ['/api/public/jobs'] })
    },
    onError: (e: any) => toast.error(e?.message || 'Failed to publish job'),
  })
}

export function useUpdateJob() {
  const qc = useQueryClient()
  const { currentOrgId, user } = useAuth()
  return useMutation({
    mutationFn: async (jobData: Partial<Job> & { id: string }) => {
      if (!currentOrgId) throw new Error('Organization ID is required')
      if (!user?.id) throw new Error('User authentication required')
      const { id, ...updateData } = jobData
      const res = await fetch(`/api/jobs/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-org-id': currentOrgId,
          'x-user-id': user.id
        },
        body: JSON.stringify(updateData),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.details || err?.error || 'Failed to update job')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/jobs'] })
      qc.invalidateQueries({ queryKey: ['/api/public/jobs'] })
    },
    onError: (e: any) => toast.error(e?.message || 'Failed to update job'),
  })
}

export function useDeleteJob() {
  const qc = useQueryClient()
  const { currentOrgId, user } = useAuth()
  return useMutation({
    mutationFn: async (jobId: string) => {
      if (!currentOrgId) throw new Error('Organization ID is required')
      if (!user?.id) throw new Error('User authentication required')
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Failed to delete job')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/jobs'] })
      qc.invalidateQueries({ queryKey: ['/api/public/jobs'] })
    },
  })
}

