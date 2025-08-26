import { useQuery } from '@tanstack/react-query'
import { useGenericList, useGenericItem, useGenericCreate } from './useGenericCrud'
import { demoJobs } from '@/lib/demo-data-consolidated'
import { apiRequest } from '@/lib/queryClient'
import { useDemoFlag } from '@/lib/demoFlag'
import { demoAdapter } from '@/lib/dataAdapter'
import { useAuth } from '@/contexts/AuthContext'
import type { Job, InsertJob } from '@/../../shared/schema'

export function useJobs(options: { refetchInterval?: number } = {}) {
  const { isDemoUser } = useDemoFlag()
  const { currentOrgId } = useAuth()
  
  return useQuery({
    queryKey: ['/api/jobs'],
    queryFn: async () => {
      if (isDemoUser) return demoAdapter.getJobs()
      if (!currentOrgId) throw new Error('Organization context required')
      
      const result = await apiRequest(`/api/jobs?orgId=${currentOrgId}`)
      
      // Handle auth-required state gracefully
      if (result?.authRequired) {
        return { authRequired: true, data: [] }
      }
      
      return result
    },
    enabled: isDemoUser || !!currentOrgId, // Only fetch when we have org context
    refetchInterval: isDemoUser ? false : (options.refetchInterval || 60000), // 1 minute for performance
    staleTime: isDemoUser ? 120000 : (3 * 60 * 1000), // 3 minutes for better performance
    refetchOnWindowFocus: false, // Disable for better performance
  })
}

export function useJob(id?: string) {
  const { isDemoUser } = useDemoFlag()
  
  return useQuery({
    queryKey: ['/api/jobs', id],
    queryFn: async () => {
      if (isDemoUser) {
        const jobs = await demoAdapter.getJobs()
        return jobs.find(job => job.id === id) || null
      }
      return apiRequest(`/api/jobs/${id}`)
    },
    enabled: !!id,
    staleTime: isDemoUser ? 60000 : (1 * 60 * 1000),
  })
}

export function useJobsByClient(clientId?: string) {
  const result = useQuery({
    queryKey: ['/api/jobs', 'client', clientId],
    queryFn: () => apiRequest(`/api/clients/${clientId}/jobs`),
    enabled: !!clientId,
  })

  return result
}

export function useCreateJob() {
  const { isDemoUser } = useDemoFlag()
  const { currentOrgId } = useAuth()
  
  if (isDemoUser) {
    return useGenericCreate<Job, InsertJob>('/api/jobs', '/api/jobs', {
      mutationFn: (jobData: InsertJob) => demoAdapter.createJob(jobData)
    })
  }
  
  return useGenericCreate<Job, InsertJob>('/api/jobs', '/api/jobs', {
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
        if (error.details && Array.isArray(error.details)) {
          throw new Error(`${error.error}: ${error.details.join(', ')}`)
        }
        throw new Error(error.error || 'Failed to create job')
      }
      
      return response.json() as Promise<Job>
    }
  })
}