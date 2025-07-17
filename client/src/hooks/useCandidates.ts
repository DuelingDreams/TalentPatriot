import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'
import { useAuth } from '@/contexts/AuthContext'
import type { Candidate, InsertCandidate } from '@/../../shared/schema'

export function useCandidates() {
  const { currentOrgId, userRole } = useAuth()
  
  return useQuery({
    queryKey: ['/api/candidates', { orgId: currentOrgId }],
    queryFn: () => {
      if (userRole === 'demo_viewer' || !currentOrgId) {
        // Return empty array for demo users or users without org
        return []
      }
      return apiRequest(`/api/candidates?orgId=${currentOrgId}`)
    },
    enabled: true, // Always enabled, but conditional data fetching
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
  const { currentOrgId } = useAuth()
  
  return useMutation({
    mutationFn: (candidate: InsertCandidate) =>
      apiRequest('/api/candidates', {
        method: 'POST',
        body: JSON.stringify({
          ...candidate,
          orgId: currentOrgId,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/candidates'] })
    },
  })
}