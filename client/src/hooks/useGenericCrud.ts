import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'
import { useAuth } from '@/contexts/AuthContext'

interface GenericCrudOptions<T, InsertT> {
  endpoint: string
  getDemoData?: (userRole: string) => T[]
  queryKey: string
}

export function useGenericList<T>(options: GenericCrudOptions<T, any>) {
  const { currentOrgId, userRole } = useAuth()
  
  return useQuery({
    queryKey: [options.queryKey, { orgId: currentOrgId }],
    queryFn: () => {
      if (userRole === 'demo_viewer' && options.getDemoData) {
        return options.getDemoData(userRole)
      }
      if (!currentOrgId) {
        return []
      }
      return apiRequest(`${options.endpoint}?orgId=${currentOrgId}`)
    },
    enabled: true,
  })
}

export function useGenericItem<T>(endpoint: string, id?: string) {
  return useQuery({
    queryKey: [endpoint, id],
    queryFn: () => apiRequest(`${endpoint}/${id}`),
    enabled: !!id,
  })
}

export function useGenericCreate<T, InsertT>(
  endpoint: string, 
  queryKey: string,
  additionalData?: Record<string, any>
) {
  const queryClient = useQueryClient()
  const { currentOrgId } = useAuth()
  
  return useMutation({
    mutationFn: (data: InsertT) =>
      apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          orgId: currentOrgId,
          ...additionalData,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] })
    },
  })
}

export function useGenericUpdate<T, UpdateT>(
  endpoint: string,
  queryKey: string
) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateT }) =>
      apiRequest(`${endpoint}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] })
    },
  })
}

export function useGenericDelete(endpoint: string, queryKey: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest(`${endpoint}/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] })
    },
  })
}