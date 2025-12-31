import { useQuery, useMutation } from '@tanstack/react-query'
import { apiRequest, queryClient } from '@/lib/queryClient'
import type { CandidateDocument, InsertCandidateDocument } from '@shared/schema'

export function useCandidateDocuments(candidateId: string | undefined) {
  return useQuery<CandidateDocument[]>({
    queryKey: ['/api/candidates', candidateId, 'documents'],
    enabled: !!candidateId,
  })
}

export function useCreateDocument(candidateId: string) {
  return useMutation({
    mutationFn: async (data: Partial<InsertCandidateDocument>) => {
      return apiRequest(`/api/candidates/${candidateId}/documents`, {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/candidates', candidateId, 'documents'] })
    },
  })
}

export function useDeleteDocument(candidateId: string) {
  return useMutation({
    mutationFn: async (documentId: string) => {
      return apiRequest(`/api/candidates/${candidateId}/documents/${documentId}`, {
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/candidates', candidateId, 'documents'] })
    },
  })
}
