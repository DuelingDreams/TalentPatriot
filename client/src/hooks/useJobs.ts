import { useQuery } from '@tanstack/react-query'
import { useGenericList, useGenericItem, useGenericCreate } from './useGenericCrud'
import { demoJobs } from '@/lib/demo-data-consolidated'
import { apiRequest } from '@/lib/queryClient'
import { useDemoFlag } from '@/lib/demoFlag'
import { demoAdapter } from '@/lib/dataAdapter'
import type { Job, InsertJob } from '@/../../shared/schema'

export function useJobs(options: { refetchInterval?: number } = {}) {
  const { isDemoUser } = useDemoFlag()
  
  return useQuery({
    queryKey: ['/api/jobs'],
    queryFn: () => isDemoUser ? demoAdapter.getJobs() : apiRequest('/api/jobs'),
    refetchInterval: isDemoUser ? false : (options.refetchInterval || 30000),
    staleTime: isDemoUser ? 60000 : (1 * 60 * 1000),
    refetchOnWindowFocus: !isDemoUser,
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
  console.info('[RQ] useJobsByClient', 'loading=', result.isLoading, 'error=', result.error)
  return result
}

export function useCreateJob() {
  const { isDemoUser } = useDemoFlag()
  
  if (isDemoUser) {
    return useGenericCreate<Job, InsertJob>('/api/jobs', '/api/jobs', {
      mutationFn: (jobData: InsertJob) => dataAdapter.createJob(jobData, 'demo_viewer')
    })
  }
  return useGenericCreate<Job, InsertJob>('/api/jobs', '/api/jobs')
}