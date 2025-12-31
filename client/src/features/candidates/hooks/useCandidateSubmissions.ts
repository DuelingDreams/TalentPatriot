import { useQuery, useMutation } from '@tanstack/react-query'
import { apiRequest, queryClient } from '@/lib/queryClient'
import type { ClientSubmission, InsertClientSubmission } from '@shared/schema'

export function useCandidateSubmissions(candidateId: string | undefined) {
  return useQuery<ClientSubmission[]>({
    queryKey: ['/api/candidates', candidateId, 'submissions'],
    enabled: !!candidateId,
  })
}

export function useCreateSubmission(candidateId: string) {
  return useMutation({
    mutationFn: async (data: Partial<InsertClientSubmission>) => {
      return apiRequest(`/api/candidates/${candidateId}/submissions`, {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/candidates', candidateId, 'submissions'] })
    },
  })
}

export function useUpdateSubmission(candidateId: string) {
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<InsertClientSubmission>) => {
      return apiRequest(`/api/candidates/${candidateId}/submissions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/candidates', candidateId, 'submissions'] })
    },
  })
}

export function useDeleteSubmission(candidateId: string) {
  return useMutation({
    mutationFn: async (submissionId: string) => {
      return apiRequest(`/api/candidates/${candidateId}/submissions/${submissionId}`, {
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/candidates', candidateId, 'submissions'] })
    },
  })
}
