import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'
import { InsertCandidate, Candidate } from '../../../shared/schema'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

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
        // Handle validation errors from Zod validation
        if (error.details && Array.isArray(error.details)) {
          throw new Error(`${error.error}: ${error.details.join(', ')}`)
        }
        throw new Error(error.error || 'Failed to create candidate')
      }

      return response.json() as Promise<Candidate>
    },
    onMutate: async (newCandidate) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/candidates'] })
      
      // Snapshot the previous value
      const previousCandidates = queryClient.getQueryData(['/api/candidates'])
      
      // Optimistically update to the new value
      queryClient.setQueryData(['/api/candidates'], (old: any) => {
        const optimisticCandidate = {
          id: `temp-${Date.now()}`,
          ...newCandidate,
          orgId: currentOrgId,
          status: 'active',
          createdAt: new Date().toISOString(),
        }
        return old ? [...old, optimisticCandidate] : [optimisticCandidate]
      })
      
      return { previousCandidates }
    },
    onError: (err, newCandidate, context) => {
      // Roll back on error
      queryClient.setQueryData(['/api/candidates'], context?.previousCandidates)
      toast.error(err.message || 'Failed to add candidate')
    },
    onSuccess: (data) => {
      toast.success('Candidate added successfully!')
      queryClient.invalidateQueries({ queryKey: ['/api/candidates'] })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/candidates'] })
    },
  })
}