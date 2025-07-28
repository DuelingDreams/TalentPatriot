import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'
import { useAuth } from '@/contexts/AuthContext'

export function useCandidateApplicationHistory(candidateId?: string) {
  const { currentOrgId, userRole } = useAuth()
  
  return useQuery({
    queryKey: ['/api/candidates', candidateId, 'applications', { orgId: currentOrgId }],
    queryFn: () => {
      if (userRole === 'demo_viewer') {
        // Return demo application history
        if (candidateId === 'demo-candidate-1') {
          return [
            {
              id: 'demo-app-1',
              jobId: 'demo-job-1',
              candidateId: 'demo-candidate-1',
              stage: 'interview',
              notes: 'Strong technical skills, moving to final round. Excellent React knowledge.',
              createdAt: '2024-07-05T10:00:00Z',
              updatedAt: '2024-07-15T14:30:00Z',
              orgId: 'demo-org-fixed',
              job: {
                id: 'demo-job-1',
                title: 'Senior Frontend Developer',
                client: {
                  id: 'demo-client-1',
                  name: 'TechCorp Solutions'
                }
              }
            },
            {
              id: 'demo-app-2',
              jobId: 'demo-job-3',
              candidateId: 'demo-candidate-1',
              stage: 'rejected',
              notes: 'Not a good fit for this particular role, but strong candidate for future opportunities.',
              createdAt: '2024-06-20T10:00:00Z',
              updatedAt: '2024-06-25T16:00:00Z',
              orgId: 'demo-org-fixed',
              job: {
                id: 'demo-job-3',
                title: 'Full Stack Engineer',
                client: {
                  id: 'demo-client-2',
                  name: 'StartupXYZ'
                }
              }
            }
          ]
        }
        if (candidateId === 'demo-candidate-2') {
          return [
            {
              id: 'demo-app-3',
              jobId: 'demo-job-2',
              candidateId: 'demo-candidate-2',
              stage: 'offer',
              notes: 'Excellent product management experience. Making offer.',
              createdAt: '2024-07-12T10:00:00Z',
              updatedAt: '2024-07-20T11:00:00Z',
              orgId: 'demo-org-fixed',
              job: {
                id: 'demo-job-2',
                title: 'Product Manager',
                client: {
                  id: 'demo-client-1',
                  name: 'TechCorp Solutions'
                }
              }
            }
          ]
        }
        return []
      }
      
      if (!candidateId || !currentOrgId) {
        return []
      }
      return apiRequest(`/api/candidates/${candidateId}/applications?orgId=${currentOrgId}`)
    },
    enabled: !!candidateId,
  })
}