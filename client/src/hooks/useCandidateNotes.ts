import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { CandidateNotes, InsertCandidateNotes } from '@shared/schema'

export function useCandidateNotes(candidateId: string) {
  return useQuery({
    queryKey: ['/api/candidate-notes', candidateId],
    queryFn: async () => {
      const response = await fetch(`/api/candidate-notes?candidateId=${candidateId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch candidate notes')
      }
      return response.json() as Promise<CandidateNotes[]>
    },
    enabled: !!candidateId,
  })
}

export function useCreateCandidateNote() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (note: InsertCandidateNotes) => {
      const response = await fetch('/api/candidate-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(note),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create candidate note')
      }
      
      return response.json() as Promise<CandidateNotes>
    },
    onSuccess: (data) => {
      // Invalidate and refetch candidate notes
      queryClient.invalidateQueries({ 
        queryKey: ['/api/candidate-notes', data.jobCandidateId] 
      })
    },
  })
}

export function useUpdateCandidateNote() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, note }: { id: string; note: Partial<InsertCandidateNotes> }) => {
      const response = await fetch(`/api/candidate-notes/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(note),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update candidate note')
      }
      
      return response.json() as Promise<CandidateNotes>
    },
    onSuccess: (data) => {
      // Invalidate and refetch candidate notes
      queryClient.invalidateQueries({ 
        queryKey: ['/api/candidate-notes', data.jobCandidateId] 
      })
    },
  })
}