import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { CandidateNotes, InsertCandidateNotes } from '@shared/schema'
import { apiRequest } from '@/lib/queryClient'

// Extended type to include authorEmail that gets enriched by storage layer
export type EnrichedCandidateNotes = CandidateNotes & {
  authorEmail: string
}

export function useCandidateNotes(jobCandidateId: string) {
  return useQuery({
    queryKey: ['/api/candidate-notes', jobCandidateId],
    queryFn: async () => {
      const response = await fetch(`/api/candidate-notes?jobCandidateId=${jobCandidateId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch candidate notes')
      }
      return response.json() as Promise<EnrichedCandidateNotes[]>
    },
    enabled: !!jobCandidateId,
  })
}

export function useCreateCandidateNote() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (note: InsertCandidateNotes) => {
      console.log('[useCandidateNotes] Creating note with data:', note)
      
      try {
        const result = await apiRequest('/api/candidate-notes', {
          method: 'POST',
          body: JSON.stringify(note),
        })
        
        console.log('[useCandidateNotes] Note created successfully:', result)
        return result as EnrichedCandidateNotes
      } catch (error: any) {
        console.error('[useCandidateNotes] Error creating note:', error)
        throw new Error(error.message || 'Failed to create candidate note')
      }
    },
    onSuccess: (data) => {
      console.log('[useCandidateNotes] Note creation success, invalidating cache for:', data.jobCandidateId)
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
      console.log('[useCandidateNotes] Updating note:', id, note)
      
      try {
        const result = await apiRequest(`/api/candidate-notes/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(note),
        })
        
        console.log('[useCandidateNotes] Note updated successfully:', result)
        return result as EnrichedCandidateNotes
      } catch (error: any) {
        console.error('[useCandidateNotes] Error updating note:', error)
        throw new Error(error.message || 'Failed to update candidate note')
      }
    },
    onSuccess: (data) => {
      console.log('[useCandidateNotes] Note update success, invalidating cache for:', data.jobCandidateId)
      // Invalidate and refetch candidate notes
      queryClient.invalidateQueries({ 
        queryKey: ['/api/candidate-notes', data.jobCandidateId] 
      })
    },
  })
}