import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'
import { useAuth } from '@/contexts/AuthContext'
import type { Job, InsertJob } from '@/../../shared/schema'

export function useJobs() {
  const { currentOrgId, userRole } = useAuth()
  
  return useQuery({
    queryKey: ['/api/jobs', { orgId: currentOrgId }],
    queryFn: () => {
      if (userRole === 'demo_viewer' || !currentOrgId) {
        // Return empty array for demo users or users without org
        return []
      }
      return apiRequest(`/api/jobs?orgId=${currentOrgId}`)
    },
    enabled: true, // Always enabled, but conditional data fetching
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
  const { currentOrgId } = useAuth()
  
  return useMutation({
    mutationFn: (job: InsertJob) =>
      apiRequest('/api/jobs', {
        method: 'POST',
        body: JSON.stringify({
          ...job,
          orgId: currentOrgId,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] })
    },
  })
}