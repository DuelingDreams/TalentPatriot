import { useQuery } from '@tanstack/react-query'
import { useGenericList, useGenericItem, useGenericCreate } from './useGenericCrud'
import { demoJobs } from '@/lib/demo-data-consolidated'
import { apiRequest } from '@/lib/queryClient'
import type { Job, InsertJob } from '@/../../shared/schema'

export function useJobs(options: { refetchInterval?: number } = {}) {
  return useGenericList<Job>({
    endpoint: '/api/jobs',
    queryKey: '/api/jobs',
    getDemoData: () => demoJobs,
    refetchInterval: options.refetchInterval,
    staleTime: 2 * 60 * 1000, // 2 minutes for jobs
  })
}

export function useJob(id?: string) {
  return useGenericItem<Job>('/api/jobs', id)
}

export function useJobsByClient(clientId?: string) {
  return useQuery({
    queryKey: ['/api/jobs', 'client', clientId],
    queryFn: () => apiRequest(`/api/clients/${clientId}/jobs`),
    enabled: !!clientId,
  })
}

export function useCreateJob() {
  return useGenericCreate<Job, InsertJob>('/api/jobs', '/api/jobs')
}