import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'

export interface ApplicationHistoryEntry {
  id: string // This is the jobCandidate.id (UUID)
  jobId: string
  jobTitle: string
  clientName: string
  stage: string
  dateApplied: string
  dateUpdated: string
  notes?: string
  status: 'active' | 'hired' | 'rejected'
}

export function useCandidateApplicationHistory(candidateId: string) {
  const { currentOrgId } = useAuth()
  
  return useQuery({
    queryKey: ['candidate-applications', candidateId, currentOrgId],
    queryFn: async () => {
      if (!candidateId || !currentOrgId) return []
      
      const response = await fetch(`/api/candidates/${candidateId}/applications?orgId=${currentOrgId}`, {
        headers: {
          'x-org-id': currentOrgId
        }
      })
      
      if (!response.ok) {
        if (response.status === 400) {
          // Candidate might not have any applications yet
          return []
        }
        throw new Error('Failed to fetch candidate applications')
      }
      
      return await response.json() as ApplicationHistoryEntry[]
    },
    enabled: !!candidateId && !!currentOrgId,
    staleTime: 60000, // 1 minute
    gcTime: 120000, // 2 minutes  
    refetchOnWindowFocus: true
  })
}