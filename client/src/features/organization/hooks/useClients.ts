import { useGenericList, useGenericItem, useGenericCreate } from '@/shared/hooks/useGenericCrud'
import { demoClients } from '@/lib/demo-data-consolidated'
import { useDemoFlag } from '@/lib/demoFlag'
import { demoAdapter } from '@/lib/dataAdapter'
import type { Client, InsertClient } from '@/../../shared/schema'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'
import { useAuth } from '@/contexts/AuthContext'

export function useClients(options: { refetchInterval?: number } = {}) {
  const { isDemoUser } = useDemoFlag()
  const { currentOrgId } = useAuth()
  
  return useQuery({
    queryKey: ['/api/clients', currentOrgId],
    queryFn: async () => {
      if (isDemoUser) return demoAdapter.getClients()
      if (!currentOrgId) throw new Error('Organization context required')
      
      const result = await apiRequest(`/api/clients?orgId=${currentOrgId}`)
      
      // Handle auth-required state gracefully
      if ((result as any)?.authRequired) {
        return { authRequired: true, data: [] }
      }
      
      return result
    },
    enabled: isDemoUser || !!currentOrgId,
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