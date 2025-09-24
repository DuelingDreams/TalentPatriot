import { useQuery } from '@tanstack/react-query'

export interface CandidateInterview {
  id: string
  jobId: string
  jobTitle: string
  clientName: string
  type: 'phone' | 'video' | 'in-person' | 'technical'
  status: 'scheduled' | 'completed' | 'cancelled'
  dateTime: string
  duration: number
  interviewer: string
  feedback?: string
  rating?: number
  notes?: string
}

// Demo data for candidate interviews
const demoInterviews: Record<string, CandidateInterview[]> = {
  '44444444-4444-4444-4444-444444444444': [
    {
      id: 'int1',
      jobId: '11111111-1111-1111-1111-111111111111',
      jobTitle: 'Senior Software Engineer',
      clientName: 'TechCorp',
      type: 'video',
      status: 'completed',
      dateTime: '2024-01-20T14:00:00Z',
      duration: 60,
      interviewer: 'Sarah Johnson',
      feedback: 'Strong technical skills, excellent problem-solving approach',
      rating: 5,
      notes: 'Candidate demonstrated deep understanding of system design'
    },
    {
      id: 'int2',
      jobId: '11111111-1111-1111-1111-111111111111',
      jobTitle: 'Senior Software Engineer',
      clientName: 'TechCorp',
      type: 'technical',
      status: 'scheduled',
      dateTime: '2024-02-05T10:00:00Z',
      duration: 90,
      interviewer: 'Mike Chen',
      notes: 'Final technical interview - system design focus'
    }
  ],
  '55555555-5555-5555-5555-555555555555': [
    {
      id: 'int3',
      jobId: '33333333-3333-3333-3333-333333333333',
      jobTitle: 'Product Manager',
      clientName: 'Enterprise Co',
      type: 'video',
      status: 'completed',
      dateTime: '2024-01-25T13:00:00Z',
      duration: 45,
      interviewer: 'Lisa Park',
      feedback: 'Great product intuition and strategic thinking',
      rating: 4,
      notes: 'Strong background in user research and analytics'
    }
  ]
}

export function useCandidateInterviews(candidateId: string) {
  return useQuery({
    queryKey: ['/api/candidates', candidateId, 'interviews'],
    queryFn: async () => {
      // For demo purposes, return demo data
      if (candidateId && demoInterviews[candidateId]) {
        return demoInterviews[candidateId]
      }
      
      // In real implementation, this would fetch from API
      // const response = await fetch(`/api/candidates/${candidateId}/interviews`)
      // return response.json()
      
      return []
    },
    enabled: !!candidateId
  })
}