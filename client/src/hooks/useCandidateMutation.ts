import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'
import { InsertCandidate, Candidate } from '../../../shared/schema'
import { useAuth } from '@/contexts/AuthContext'

export function useCreateCandidate() {
  const queryClient = useQueryClient()
  const { currentOrgId } = useAuth()

  return useMutation({
    mutationFn: async (candidateData: Omit<InsertCandidate, 'orgId'>) => {
      if (!currentOrgId) {
        throw new Error('Organization ID is required')
      }

      const response = await fetch('/api/candidates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...candidateData,
          orgId: currentOrgId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create candidate')
      }

      return response.json() as Promise<Candidate>
    },
    onSuccess: () => {
      // Invalidate and refetch candidates list
      queryClient.invalidateQueries({ queryKey: ['/api/candidates'] })
    },
  })
}