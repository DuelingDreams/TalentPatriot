import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Message, InsertMessage } from '@shared/schema'
import { useAuth } from '@/contexts/AuthContext'
import { apiRequest } from '@/lib/queryClient'

export function useMessages(userId?: string) {
  const { currentOrgId } = useAuth()
  
  return useQuery({
    queryKey: ['/api/messages', userId, currentOrgId],
    queryFn: async () => {
      try {
        const params = new URLSearchParams()
        if (userId) params.append('userId', userId)
        if (currentOrgId) params.append('org_id', currentOrgId) // Backend expects snake_case
        
        const response = await apiRequest<Message[]>(`/api/messages?${params}`)
        return response || []
      } catch (error) {
        console.warn('[useMessages] Failed to fetch messages:', error);
        return []; // Return empty array on error instead of throwing
      }
    },
    enabled: !!userId && !!currentOrgId,
    retry: 2,
    staleTime: 30 * 1000, // Cache for 30 seconds
  })
}

export function useUnreadMessageCount(userId?: string) {
  return useQuery({
    queryKey: ['/api/messages/unread-count', userId],
    queryFn: async () => {
      try {
        const params = new URLSearchParams()
        if (userId) params.append('userId', userId)
        
        const response = await apiRequest<{ count: number }>(`/api/messages/unread-count?${params}`)
        return response || { count: 0 }
      } catch (error) {
        console.warn('[useUnreadMessageCount] Failed to fetch unread count:', error);
        return { count: 0 }; // Return safe default on error
      }
    },
    enabled: !!userId,
    retry: 1,
    staleTime: 30 * 1000, // Cache for 30 seconds
  })
}

export function useCreateMessage() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (message: InsertMessage) => {
      const response = await apiRequest<Message>('/api/messages', {
        method: 'POST',
        body: JSON.stringify(message),
      })
      return response
    },
    onSuccess: () => {
      // Invalidate and refetch messages
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] })
      queryClient.invalidateQueries({ queryKey: ['/api/messages/unread-count'] })
    },
  })
}

export function useUpdateMessage() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, message }: { id: string; message: Partial<InsertMessage> }) => {
      const response = await apiRequest<Message>(`/api/messages/${id}`, {
        method: 'PUT',
        body: JSON.stringify(message),
      })
      return response
    },
    onSuccess: () => {
      // Invalidate and refetch messages
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] })
      queryClient.invalidateQueries({ queryKey: ['/api/messages/unread-count'] })
    },
  })
}

export function useMarkMessageAsRead() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ messageId, userId }: { messageId: string; userId: string }) => {
      const response = await apiRequest(`/api/messages/${messageId}/read`, {
        method: 'PATCH',
        body: JSON.stringify({ userId }),
      })
      return response
    },
    onSuccess: () => {
      // Invalidate and refetch messages
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] })
      queryClient.invalidateQueries({ queryKey: ['/api/messages/unread-count'] })
    },
  })
}

export function useArchiveMessage() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (messageId: string) => {
      const response = await apiRequest(`/api/messages/${messageId}/archive`, {
        method: 'PATCH',
        body: JSON.stringify({}), // Empty body but needed for apiRequest
      })
      return response
    },
    onSuccess: () => {
      // Invalidate and refetch messages
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] })
      queryClient.invalidateQueries({ queryKey: ['/api/messages/unread-count'] })
    },
  })
}