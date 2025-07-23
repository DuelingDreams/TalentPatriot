import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'
import { useAuth } from '@/contexts/AuthContext'
import type { Job, InsertJob } from '@/../../shared/schema'

export function useJobs() {
  const { currentOrgId, userRole } = useAuth()
  
  return useQuery({
    queryKey: ['/api/jobs', { orgId: currentOrgId }],
    queryFn: () => {
      if (userRole === 'demo_viewer') {
        // Return demo jobs data
        return [
          {
            id: 'demo-job-1',
            title: 'Senior Software Engineer',
            description: 'We are looking for an experienced software engineer to join our growing team.',
            requirements: 'React, TypeScript, Node.js experience required',
            clientId: 'demo-client-1',
            status: 'open',
            priority: 'high',
            location: 'San Francisco, CA',
            salaryMin: 120000,
            salaryMax: 180000,
            orgId: '550e8400-e29b-41d4-a716-446655440000',
            createdAt: new Date('2024-07-01').toISOString()
          },
          {
            id: 'demo-job-2',
            title: 'Product Manager',
            description: 'Lead product development for our clean energy platform.',
            requirements: 'Product management experience, energy sector knowledge preferred',
            clientId: 'demo-client-2',
            status: 'open',
            priority: 'medium',
            location: 'Austin, TX',
            salaryMin: 100000,
            salaryMax: 150000,
            orgId: '550e8400-e29b-41d4-a716-446655440000',
            createdAt: new Date('2024-07-10').toISOString()
          }
        ]
      }
      if (!currentOrgId) {
        return []
      }
      return apiRequest(`/api/jobs?orgId=${currentOrgId}`)
    },
    enabled: true,
  })
}

export function useJob(id?: string) {
  return useQuery({
    queryKey: ['/api/jobs', id],
    queryFn: () => apiRequest(`/api/jobs/${id}`),
    enabled: !!id,
  })
}

export function useJobsByClient(clientId?: string) {
  return useQuery({
    queryKey: ['/api/jobs', 'client', clientId],
    queryFn: () => apiRequest(`/api/clients/${clientId}/jobs`),
    enabled: !!clientId,
  })
}

export function useCreateJob() {
  const queryClient = useQueryClient()
  const { currentOrgId } = useAuth()
  
  return useMutation({
    mutationFn: (job: InsertJob) =>
      apiRequest('/api/jobs', {
        method: 'POST',
        body: JSON.stringify({
          ...job,
          orgId: currentOrgId,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] })
    },
  })
}