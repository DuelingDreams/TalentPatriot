import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'
import { useAuth } from '@/contexts/AuthContext'
import type { Client, InsertClient } from '@/../../shared/schema'

export function useClients() {
  const { currentOrgId, userRole } = useAuth()
  
  return useQuery({
    queryKey: ['/api/clients', { orgId: currentOrgId }],
    queryFn: () => {
      if (userRole === 'demo_viewer') {
        // Return demo clients data
        return [
          {
            id: 'demo-client-1',
            name: 'TechCorp Solutions',
            industry: 'Technology',
            contactName: 'Sarah Johnson',
            contactEmail: 'sarah@techcorp.com',
            contactPhone: '+1-555-0123',
            website: 'https://techcorp.com',
            address: '123 Innovation Drive, Tech Valley, CA 94025',
            orgId: 'demo-org-fixed',
            createdAt: new Date('2024-01-15').toISOString()
          },
          {
            id: 'demo-client-2',
            name: 'Green Energy Inc',
            industry: 'Energy',
            contactName: 'Michael Chen',
            contactEmail: 'michael@greenenergy.com',
            contactPhone: '+1-555-0456',
            website: 'https://greenenergy.com',
            address: '456 Solar Plaza, Austin, TX 78701',
            orgId: 'demo-org-fixed',
            createdAt: new Date('2024-02-20').toISOString()
          }
        ]
      }
      if (!currentOrgId) {
        return []
      }
      return apiRequest(`/api/clients?orgId=${currentOrgId}`)
    },
    enabled: true,
  })
}

export function useClient(id?: string) {
  return useQuery({
    queryKey: ['/api/clients', id],
    queryFn: () => apiRequest(`/api/clients/${id}`),
    enabled: !!id,
  })
}

export function useCreateClient() {
  const queryClient = useQueryClient()
  const { currentOrgId } = useAuth()
  
  return useMutation({
    mutationFn: (client: InsertClient) =>
      apiRequest('/api/clients', {
        method: 'POST',
        body: JSON.stringify({
          ...client,
          orgId: currentOrgId,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] })
    },
  })
}

export function useUpdateClient() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, ...client }: { id: string } & Partial<InsertClient>) =>
      apiRequest(`/api/clients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(client),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] })
    },
  })
}

export function useDeleteClient() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/clients/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] })
    },
  })
}