import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'
import { useAuth } from '@/contexts/AuthContext'
import type { JobCandidate, InsertJobCandidate } from '@/../../shared/schema'

export function useJobCandidates() {
  const { currentOrgId } = useAuth()
  
  return useQuery({
    queryKey: ['/api/job-candidates', { orgId: currentOrgId }],
    queryFn: () => apiRequest(`/api/job-candidates?orgId=${currentOrgId}`),
    enabled: !!currentOrgId,
  })
}

export function useJobCandidate(id?: string) {
  return useQuery({
    queryKey: ['/api/job-candidates', id],
    queryFn: () => apiRequest(`/api/job-candidates/${id}`),
    enabled: !!id,
  })
}

export function useCandidatesForJob(jobId?: string) {
  const { currentOrgId } = useAuth()
  
  return useQuery({
    queryKey: ['/api/jobs', jobId, 'candidates', { orgId: currentOrgId }],
    queryFn: () => apiRequest(`/api/jobs/${jobId}/candidates?orgId=${currentOrgId}`),
    enabled: !!jobId && !!currentOrgId,
  })
}

export function useCreateJobCandidate() {
  const queryClient = useQueryClient()
  const { currentOrgId } = useAuth()
  
  return useMutation({
    mutationFn: (jobCandidate: InsertJobCandidate) =>
      apiRequest('/api/job-candidates', {
        method: 'POST',
        body: JSON.stringify({
          ...jobCandidate,
          orgId: currentOrgId,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/job-candidates'] })
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] })
    },
  })
}

export function useUpdateJobCandidate() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, ...jobCandidate }: { id: string } & Partial<InsertJobCandidate>) =>
      apiRequest(`/api/job-candidates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(jobCandidate),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/job-candidates'] })
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] })
    },
  })
}

export function useUpdateCandidateStage() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) =>
      apiRequest(`/api/job-candidates/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ stage }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/job-candidates'] })
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] })
    },
  })
}