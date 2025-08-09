import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Message, InsertMessage } from '@shared/schema'

export function useMessages(userId?: string) {
  return useQuery({
    queryKey: ['/api/messages', userId],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (userId) params.append('userId', userId)
      
      const response = await fetch(`/api/messages?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch messages')
      }
      return response.json() as Promise<Message[]>
    },
    enabled: !!userId,
  })
}

export function useCreateMessage() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (message: InsertMessage) => {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create message')
      }
      
      return response.json() as Promise<Message>
    },
    onSuccess: () => {
      // Invalidate and refetch messages
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] })
    },
  })
}

export function useUpdateMessage() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, message }: { id: string; message: Partial<InsertMessage> }) => {
      const response = await fetch(`/api/messages/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update message')
      }
      
      return response.json() as Promise<Message>
    },
    onSuccess: () => {
      // Invalidate and refetch messages
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] })
    },
  })
}

export function useMarkMessageAsRead() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ messageId, userId }: { messageId: string; userId: string }) => {
      const response = await fetch(`/api/messages/${messageId}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to mark message as read')
      }
      
      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch messages
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] })
    },
  })
}