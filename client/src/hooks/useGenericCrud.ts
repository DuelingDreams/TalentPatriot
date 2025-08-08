import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'
import { useAuth } from '@/contexts/AuthContext'

interface GenericCrudOptions<T, InsertT> {
  endpoint: string
  getDemoData?: (userRole: string) => T[]
  getDemoItem?: (id: string) => T | null
  queryKey: string
  refetchInterval?: number
  staleTime?: number
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
        console.warn(`No currentOrgId found for user role: ${userRole}`)
        return []
      }
      console.log(`Making API call to ${options.endpoint}?orgId=${currentOrgId}`)
      return apiRequest(`${options.endpoint}?orgId=${currentOrgId}`)
    },
    enabled: true,
    refetchInterval: options.refetchInterval || false,
    staleTime: options.staleTime || 5 * 60 * 1000, // 5 minutes default
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useGenericItem<T>(endpoint: string, id?: string, getDemoItem?: (id: string) => T | null) {
  const { currentOrgId, userRole } = useAuth()
  
  return useQuery({
    queryKey: [endpoint, id, { orgId: currentOrgId }],
    queryFn: () => {
      // Demo users get demo data for individual items
      if (userRole === 'demo_viewer') {
        if (getDemoItem && id) {
          const demoItem = getDemoItem(id)
          if (demoItem) {
            return demoItem
          }
        }
        // Return null if no demo item found rather than throwing error
        return null
      }
      return apiRequest(`${endpoint}/${id}?orgId=${currentOrgId}`)
    },
    enabled: !!id && (userRole === 'demo_viewer' || !!currentOrgId),
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