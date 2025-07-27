import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'
import type { CandidateNotes, InsertCandidateNotes } from '@/../../shared/schema'

export function useCandidateNotes(jobCandidateId?: string) {
  return useQuery({
    queryKey: ['/api/job-candidates', jobCandidateId, 'notes'],
    queryFn: () => apiRequest(`/api/job-candidates/${jobCandidateId}/notes`),
    enabled: !!jobCandidateId,
  })
}

export function useCreateCandidateNote() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (note: InsertCandidateNotes) =>
      apiRequest('/api/candidate-notes', {
        method: 'POST',
        body: JSON.stringify(note),
      }),
    onSuccess: (createdNote, variables) => {
      // Invalidate the specific notes query for this job candidate
      queryClient.invalidateQueries({ 
        queryKey: ['/api/job-candidates', variables.jobCandidateId, 'notes'] 
      })
      // Also invalidate general job candidates queries
      queryClient.invalidateQueries({ queryKey: ['/api/job-candidates'] })
    },
  })
}