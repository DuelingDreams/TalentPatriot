import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'
import { useAuth, useDemoFlag } from '@/contexts/AuthContext'
import { dataAdapter } from '@/lib/dataAdapter'
import type { JobCandidate, InsertJobCandidate } from '@/../../shared/schema'

export function useJobCandidates(options: { refetchInterval?: number } = {}) {
  const { currentOrgId, userRole } = useAuth()
  const { isDemoUser } = useDemoFlag()
  
  return useQuery({
    queryKey: ['/api/job-candidates', { orgId: currentOrgId }],
    refetchInterval: isDemoUser ? false : (options.refetchInterval || false),
    staleTime: isDemoUser ? 60000 : (2 * 60 * 1000),
    gcTime: 10 * 60 * 1000,
    queryFn: () => {
      if (isDemoUser) {
        return dataAdapter.getJobCandidates('demo_viewer')
      }
      if (!currentOrgId) {
        return []
      }
      return apiRequest(`/api/job-candidates?orgId=${currentOrgId}`)
    },
    enabled: true,
    refetchOnWindowFocus: !isDemoUser,
  })
}

export function useJobCandidate(id?: string) {
  return useQuery({
    queryKey: ['/api/job-candidates', id],
    queryFn: () => apiRequest(`/api/job-candidates/${id}`),
    enabled: !!id,
  })
}

export function useCandidatesForJob(jobId?: string, options?: { enableRealtime?: boolean; pollingInterval?: number }) {
  const { currentOrgId, userRole } = useAuth()
  
  // Fallback to original implementation for demo users
  return useQuery({
    queryKey: ['/api/jobs', jobId, 'candidates', { orgId: currentOrgId }],
    queryFn: () => {
      if (userRole === 'demo_viewer') {
        // Return demo candidates for specific job
        if (jobId === 'demo-job-1') {
          return [
            {
              id: 'demo-job-candidate-1',
              jobId: 'demo-job-1',
              candidateId: 'demo-candidate-1',
              stage: 'interview',
              notes: 'Strong technical skills, moving to final round',
              appliedAt: new Date('2024-07-05').toISOString(),
              orgId: 'demo-org-fixed',
              candidate: {
                id: 'demo-candidate-1',
                firstName: 'Emily',
                lastName: 'Rodriguez',
                email: 'emily.rodriguez@email.com',
                skills: ['React', 'TypeScript', 'Node.js', 'Python']
              }
            }
          ]
        }
        if (jobId === 'demo-job-2') {
          return [
            {
              id: 'demo-job-candidate-2',
              jobId: 'demo-job-2',
              candidateId: 'demo-candidate-2',
              stage: 'phone_screen',
              notes: 'Great product experience, scheduling technical interview',
              appliedAt: new Date('2024-07-12').toISOString(),
              orgId: 'demo-org-fixed',
              candidate: {
                id: 'demo-candidate-2',
                firstName: 'James',
                lastName: 'Wilson',
                email: 'james.wilson@email.com',
                skills: ['Product Management', 'Agile', 'Data Analysis']
              }
            }
          ]
        }
        return []
      }
      if (!jobId || !currentOrgId) {
        return []
      }
      return apiRequest(`/api/jobs/${jobId}/candidates?orgId=${currentOrgId}`)
    },
    enabled: true,
  })
}

export function useCreateJobCandidate() {
  const queryClient = useQueryClient()
  const { currentOrgId } = useAuth()
  
  return useMutation({
    mutationFn: (jobCandidate: InsertJobCandidate) =>
      apiRequest('/api/job-candidates', {
        method: 'POST',
        body: JSON.stringify({
          ...jobCandidate,
          orgId: currentOrgId,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/job-candidates'] })
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] })
    },
  })
}

export function useUpdateJobCandidate() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, ...jobCandidate }: { id: string } & Partial<InsertJobCandidate>) =>
      apiRequest(`/api/job-candidates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(jobCandidate),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/job-candidates'] })
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] })
    },
  })
}

export function useUpdateCandidateStage() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) =>
      apiRequest(`/api/job-candidates/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ stage }),
      }),
    onSuccess: (updatedCandidate, variables) => {
      // Invalidate all related queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ['/api/job-candidates'] })
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] })
      
      // Invalidate specific job candidates queries with all possible patterns
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey
          return (key[0] === '/api/jobs' && key.includes('candidates')) ||
                 (key[0] === '/api/job-candidates')
        }
      })
    },
  })
}