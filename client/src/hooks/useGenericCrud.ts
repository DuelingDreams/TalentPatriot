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
  const { currentOrgId, userRole, loading } = useAuth()
  
  return useQuery({
    queryKey: [options.queryKey, { orgId: currentOrgId }],
    queryFn: () => {
      // Demo users get demo data
      if (userRole === 'demo_viewer' && options.getDemoData) {
        console.log(`[CRUD] Using demo data for ${options.endpoint}`)
        return options.getDemoData(userRole)
      }
      
      // For authenticated users, require organization context
      if (!currentOrgId) {
        console.error(`[CRUD] No organization ID for ${options.endpoint}, userRole: ${userRole}`)
        throw new Error(`Organization context not loaded for user role: ${userRole}`)
      }
      
      console.log(`[CRUD] API call: ${options.endpoint}?orgId=${currentOrgId}`)
      return apiRequest(`${options.endpoint}?orgId=${currentOrgId}`)
    },
    enabled: !loading && (userRole === 'demo_viewer' || !!currentOrgId), // Wait for auth to load and require org context
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
      return apiRequest(`${endpoint}/${id}`)
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
    onSuccess: (newItem) => {
      // More selective invalidation - invalidate list queries with orgId context
      queryClient.invalidateQueries({ 
        queryKey: [queryKey], 
        exact: false // Allow matching with orgId variations
      })
      // If the new item has an ID, set up the specific item query cache
      if (newItem?.id) {
        queryClient.setQueryData([queryKey, newItem.id, { orgId: currentOrgId }], newItem)
      }
    },
  })
}

export function useGenericUpdate<T, UpdateT>(
  endpoint: string,
  queryKey: string
) {
  const queryClient = useQueryClient()
  const { currentOrgId } = useAuth()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateT }) =>
      apiRequest(`${endpoint}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (updatedItem, variables) => {
      // Invalidate list queries
      queryClient.invalidateQueries({ 
        queryKey: [queryKey], 
        exact: false // Allow matching with orgId variations
      })
      // Invalidate and update the specific item query
      queryClient.invalidateQueries({ queryKey: [queryKey, variables.id] })
      // Optimistically update the specific item cache if we have the updated data
      if (updatedItem) {
        queryClient.setQueryData([queryKey, variables.id, { orgId: currentOrgId }], updatedItem)
      }
    },
  })
}

export function useGenericDelete(endpoint: string, queryKey: string) {
  const queryClient = useQueryClient()
  const { currentOrgId } = useAuth()
  
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest(`${endpoint}/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: (_, deletedId) => {
      // Invalidate list queries to remove the deleted item
      queryClient.invalidateQueries({ 
        queryKey: [queryKey], 
        exact: false // Allow matching with orgId variations
      })
      // Remove the specific item from cache
      queryClient.removeQueries({ queryKey: [queryKey, deletedId] })
      queryClient.removeQueries({ queryKey: [queryKey, deletedId, { orgId: currentOrgId }] })
    },
  })
}