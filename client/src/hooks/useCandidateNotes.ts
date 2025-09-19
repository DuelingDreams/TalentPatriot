import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { CandidateNotes, InsertCandidateNotes } from '@shared/schema'

export function useCandidateNotes(jobCandidateId: string) {
  return useQuery({
    queryKey: ['/api/candidate-notes', jobCandidateId],
    queryFn: async () => {
      const response = await fetch(`/api/candidate-notes?jobCandidateId=${jobCandidateId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch candidate notes')
      }
      return response.json() as Promise<CandidateNotes[]>
    },
    enabled: !!jobCandidateId,
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