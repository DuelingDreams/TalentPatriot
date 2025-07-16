import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'
import type { Client, InsertClient } from '@/../../shared/schema'

export function useClients() {
  return useQuery({
    queryKey: ['/api/clients'],
    queryFn: () => apiRequest('/api/clients'),
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
  
  return useMutation({
    mutationFn: (client: InsertClient) =>
      apiRequest('/api/clients', {
        method: 'POST',
        body: JSON.stringify(client),
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