import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'
import { useAuth } from '@/contexts/AuthContext'

export function useCandidateInterviews(candidateId?: string) {
  const { currentOrgId, userRole } = useAuth()
  
  return useQuery({
    queryKey: ['/api/candidates', candidateId, 'interviews', { orgId: currentOrgId }],
    queryFn: () => {
      if (userRole === 'demo_viewer') {
        // Return demo interviews
        if (candidateId === 'demo-candidate-1') {
          return [
            {
              id: 'demo-interview-1',
              candidateId: 'demo-candidate-1',
              title: 'Initial Phone Screen',
              type: 'phone',
              status: 'completed',
              scheduledAt: '2024-07-05T14:00:00Z',
              duration: '30',
              location: 'Phone call',
              interviewerId: 'demo-user-1',
              notes: 'Candidate showed strong technical knowledge and communication skills. Ready for technical round.',
              createdAt: '2024-07-03T10:00:00Z',
              updatedAt: '2024-07-05T15:00:00Z'
            },
            {
              id: 'demo-interview-2',
              candidateId: 'demo-candidate-1',
              title: 'Technical Interview',
              type: 'technical',
              status: 'completed',
              scheduledAt: '2024-07-15T10:00:00Z',
              duration: '90',
              location: 'Google Meet',
              interviewerId: 'demo-user-2',
              notes: 'Excellent coding skills demonstrated. Solved algorithmic problems efficiently. Strong understanding of React patterns.',
              createdAt: '2024-07-10T09:00:00Z',
              updatedAt: '2024-07-15T11:30:00Z'
            },
            {
              id: 'demo-interview-3',
              candidateId: 'demo-candidate-1',
              title: 'Final Round - Team Fit',
              type: 'cultural',
              status: 'scheduled',
              scheduledAt: '2024-07-25T15:00:00Z',
              duration: '60',
              location: 'Office - Conference Room A',
              interviewerId: 'demo-user-3',
              notes: null,
              createdAt: '2024-07-16T14:00:00Z',
              updatedAt: '2024-07-16T14:00:00Z'
            }
          ]
        }
        if (candidateId === 'demo-candidate-2') {
          return [
            {
              id: 'demo-interview-4',
              candidateId: 'demo-candidate-2',
              title: 'Product Management Interview',
              type: 'video',
              status: 'completed',
              scheduledAt: '2024-07-18T11:00:00Z',
              duration: '75',
              location: 'Zoom',
              interviewerId: 'demo-user-4',
              notes: 'Impressive product strategy knowledge. Great examples from previous roles. Team is excited to make an offer.',
              createdAt: '2024-07-15T10:00:00Z',
              updatedAt: '2024-07-18T12:15:00Z'
            }
          ]
        }
        return []
      }
      
      if (!candidateId || !currentOrgId) {
        return []
      }
      return apiRequest(`/api/candidates/${candidateId}/interviews?orgId=${currentOrgId}`)
    },
    enabled: !!candidateId,
  })
}