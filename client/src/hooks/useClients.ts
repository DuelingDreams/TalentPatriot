import { useGenericList, useGenericItem, useGenericCreate } from './useGenericCrud'
import { demoClients } from '@/lib/demo-data-consolidated'
import type { Client, InsertClient } from '@/../../shared/schema'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'

export function useClients() {
  return useGenericList<Client>({
    endpoint: '/api/clients',
    queryKey: '/api/clients',
    getDemoData: () => demoClients
  })
}

export function useClient(id?: string) {
  return useGenericItem<Client>('/api/clients', id)
}

export function useCreateClient() {
  return useGenericCreate<Client, InsertClient>('/api/clients', '/api/clients')
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