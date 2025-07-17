import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'
import { useAuth } from '@/contexts/AuthContext'
import type { Organization, UserOrganization } from '@/../../shared/schema'

export function useUserOrganizations() {
  const { user, userRole } = useAuth()
  
  return useQuery({
    queryKey: ['/api/users', user?.id, 'organizations'],
    queryFn: () => {
      if (userRole === 'demo_viewer' || !user?.id) {
        // Return empty array for demo users
        return []
      }
      return apiRequest(`/api/users/${user?.id}/organizations`)
    },
    enabled: true, // Always enabled, but conditional data fetching
  })
}

export function useCurrentOrganization() {
  const { currentOrgId, userRole } = useAuth()
  
  return useQuery({
    queryKey: ['/api/organizations', currentOrgId],
    queryFn: () => {
      if (userRole === 'demo_viewer' || !currentOrgId) {
        // Return mock org for demo users or users without org
        return {
          id: 'demo-org',
          name: 'Demo Organization',
          ownerId: 'demo-user',
          slug: 'demo-org',
          createdAt: new Date().toISOString()
        }
      }
      return apiRequest(`/api/organizations/${currentOrgId}`)
    },
    enabled: true, // Always enabled, but conditional data fetching
  })
}

export function useOrganization(id?: string) {
  return useQuery({
    queryKey: ['/api/organizations', id],
    queryFn: () => apiRequest(`/api/organizations/${id}`),
    enabled: !!id,
  })
}

export function useCreateOrganization() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  return useMutation({
    mutationFn: (org: { name: string; slug?: string }) =>
      apiRequest('/api/organizations', {
        method: 'POST',
        body: JSON.stringify({
          ...org,
          ownerId: user?.id,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', user?.id, 'organizations'] })
      queryClient.invalidateQueries({ queryKey: ['/api/organizations'] })
    },
  })
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  return useMutation({
    mutationFn: ({ id, ...org }: { id: string } & Partial<Organization>) =>
      apiRequest(`/api/organizations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(org),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', user?.id, 'organizations'] })
      queryClient.invalidateQueries({ queryKey: ['/api/organizations'] })
    },
  })
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/organizations/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', user?.id, 'organizations'] })
      queryClient.invalidateQueries({ queryKey: ['/api/organizations'] })
    },
  })
}