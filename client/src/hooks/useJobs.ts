import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'
import type { Job, InsertJob } from '@/../../shared/schema'

export function useJobs() {
  return useQuery({
    queryKey: ['/api/jobs'],
    queryFn: () => apiRequest('/api/jobs'),
  })
}

export function useJob(id?: string) {
  return useQuery({
    queryKey: ['/api/jobs', id],
    queryFn: () => apiRequest(`/api/jobs/${id}`),
    enabled: !!id,
  })
}

export function useJobsByClient(clientId?: string) {
  return useQuery({
    queryKey: ['/api/jobs', 'client', clientId],
    queryFn: () => apiRequest(`/api/clients/${clientId}/jobs`),
    enabled: !!clientId,
  })
}

export function useCreateJob() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (job: InsertJob) =>
      apiRequest('/api/jobs', {
        method: 'POST',
        body: JSON.stringify(job),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] })
    },
  })
}