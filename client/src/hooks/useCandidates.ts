import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'
import type { Candidate, InsertCandidate } from '@/../../shared/schema'

export function useCandidates() {
  return useQuery({
    queryKey: ['/api/candidates'],
    queryFn: () => apiRequest('/api/candidates'),
  })
}

export function useCandidate(id?: string) {
  return useQuery({
    queryKey: ['/api/candidates', id],
    queryFn: () => apiRequest(`/api/candidates/${id}`),
    enabled: !!id,
  })
}

export function useCreateCandidate() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (candidate: InsertCandidate) =>
      apiRequest('/api/candidates', {
        method: 'POST',
        body: JSON.stringify(candidate),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/candidates'] })
    },
  })
}