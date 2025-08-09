import { useGenericList, useGenericItem, useGenericCreate } from './useGenericCrud'
import { demoClients } from '@/lib/demo-data-consolidated'
import { useDemoFlag } from '@/lib/demoFlag'
import { dataAdapter } from '@/lib/dataAdapter'
import type { Client, InsertClient } from '@/../../shared/schema'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'

export function useClients(options: { refetchInterval?: number } = {}) {
  const { isDemoUser } = useDemoFlag()
  
  return useQuery({
    queryKey: ['/api/clients'],
    queryFn: () => dataAdapter.getClients(isDemoUser ? 'demo_viewer' : undefined),
    refetchInterval: isDemoUser ? false : options.refetchInterval,
    staleTime: isDemoUser ? 60000 : (5 * 60 * 1000),
    refetchOnWindowFocus: !isDemoUser,
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