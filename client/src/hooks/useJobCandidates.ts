import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'
import type { JobCandidate, InsertJobCandidate } from '@/../../shared/schema'

export function useJobCandidates() {
  return useQuery({
    queryKey: ['/api/job-candidates'],
    queryFn: () => apiRequest('/api/job-candidates'),
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
  return useQuery({
    queryKey: ['/api/jobs', jobId, 'candidates'],
    queryFn: () => apiRequest(`/api/jobs/${jobId}/candidates`),
    enabled: !!jobId,
  })
}

export function useCreateJobCandidate() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (jobCandidate: InsertJobCandidate) =>
      apiRequest('/api/job-candidates', {
        method: 'POST',
        body: JSON.stringify(jobCandidate),
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