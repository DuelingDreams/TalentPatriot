import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'

export interface ApplicationHistoryEntry {
  id: string
  jobId: string
  jobTitle: string
  clientName: string
  stage: string
  dateApplied: string
  dateUpdated: string
  notes?: string
  status: 'active' | 'hired' | 'rejected'
}

// Demo data for candidate application history
const demoApplicationHistory: Record<string, ApplicationHistoryEntry[]> = {
  '44444444-4444-4444-4444-444444444444': [
    {
      id: 'app1',
      jobId: '11111111-1111-1111-1111-111111111111',
      jobTitle: 'Senior Software Engineer',
      clientName: 'TechCorp',
      stage: 'offer',
      dateApplied: '2024-01-15',
      dateUpdated: '2024-01-25',
      notes: 'Strong technical interview, excellent problem-solving skills',
      status: 'active'
    },
    {
      id: 'app2',
      jobId: '22222222-2222-2222-2222-222222222222',
      jobTitle: 'Full Stack Developer',
      clientName: 'StartupXYZ',
      stage: 'interview',
      dateApplied: '2024-01-10',
      dateUpdated: '2024-01-20',
      notes: 'Completed technical assessment, awaiting final interview',
      status: 'active'
    }
  ],
  '55555555-5555-5555-5555-555555555555': [
    {
      id: 'app3',
      jobId: '33333333-3333-3333-3333-333333333333',
      jobTitle: 'Product Manager',
      clientName: 'Enterprise Co',
      stage: 'hired',
      dateApplied: '2024-01-05',
      dateUpdated: '2024-01-30',
      notes: 'Excellent cultural fit, strong product vision',
      status: 'hired'
    }
  ]
}

export function useCandidateApplicationHistory(candidateId: string) {
  const { currentOrgId } = useAuth()
  
  return useQuery({
    queryKey: ['candidate-applications', candidateId, currentOrgId],
    queryFn: async () => {
      if (!candidateId || !currentOrgId) return []
      
      const response = await fetch(`/api/candidates/${candidateId}/applications?orgId=${currentOrgId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch candidate applications')
      }
      
      return await response.json() as ApplicationHistoryEntry[]
    },
    enabled: !!candidateId && !!currentOrgId
  })
}