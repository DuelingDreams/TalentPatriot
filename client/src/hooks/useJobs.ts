import { useQuery } from '@tanstack/react-query'
import { useGenericList, useGenericItem, useGenericCreate } from './useGenericCrud'
import { demoJobs } from '@/lib/demo-data-consolidated'
import { apiRequest } from '@/lib/queryClient'
import type { Job, InsertJob } from '@/../../shared/schema'

export function useJobs(options: { refetchInterval?: number } = {}) {
  const result = useGenericList<Job>({
    endpoint: '/api/jobs',
    queryKey: '/api/jobs',
    getDemoData: () => demoJobs,
    refetchInterval: options.refetchInterval || 30000, // Default 30 second refresh
    staleTime: 1 * 60 * 1000, // 1 minute for jobs (reduced for more responsiveness)
  })
  console.info('[RQ] useJobs', 'loading=', result.isLoading, 'error=', result.error)
  return result
}

export function useJob(id?: string) {
  return useGenericItem<Job>('/api/jobs', id)
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
  return useGenericCreate<Job, InsertJob>('/api/jobs', '/api/jobs')
}