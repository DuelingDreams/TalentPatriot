import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'
import { useAuth } from '@/contexts/AuthContext'
import type { Candidate, InsertCandidate } from '@/../../shared/schema'

export function useCandidates() {
  const { currentOrgId, userRole } = useAuth()
  
  return useQuery({
    queryKey: ['/api/candidates', { orgId: currentOrgId }],
    queryFn: () => {
      if (userRole === 'demo_viewer') {
        // Return demo candidates data
        return [
          {
            id: 'demo-candidate-1',
            firstName: 'Emily',
            lastName: 'Rodriguez',
            email: 'emily.rodriguez@email.com',
            phone: '+1-555-0789',
            resumeUrl: null,
            linkedinUrl: 'https://linkedin.com/in/emilyrodriguez',
            skills: ['React', 'TypeScript', 'Node.js', 'Python'],
            experience: 'Senior',
            location: 'San Francisco, CA',
            orgId: 'demo-org-fixed',
            createdAt: new Date('2024-07-05').toISOString()
          },
          {
            id: 'demo-candidate-2',
            firstName: 'James',
            lastName: 'Wilson',
            email: 'james.wilson@email.com',
            phone: '+1-555-0321',
            resumeUrl: null,
            linkedinUrl: 'https://linkedin.com/in/jameswilson',
            skills: ['Product Management', 'Agile', 'Data Analysis'],
            experience: 'Mid',
            location: 'Austin, TX',
            orgId: 'demo-org-fixed',
            createdAt: new Date('2024-07-12').toISOString()
          }
        ]
      }
      if (!currentOrgId) {
        return []
      }
      return apiRequest(`/api/candidates?orgId=${currentOrgId}`)
    },
    enabled: true,
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