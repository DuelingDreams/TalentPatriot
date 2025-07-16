import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'
import type { Message, InsertMessage } from '@/../../shared/schema'

export function useMessages(userId?: string) {
  return useQuery({
    queryKey: ['messages', userId],
    queryFn: () => apiRequest(`/api/messages${userId ? `?userId=${userId}` : ''}`),
  })
}

export function useMessagesByThread(threadId?: string) {
  return useQuery({
    queryKey: ['messages', 'thread', threadId],
    queryFn: () => apiRequest(`/api/messages/thread/${threadId}`),
    enabled: !!threadId,
  })
}

export function useMessagesByContext(params: { clientId?: string; jobId?: string; candidateId?: string }) {
  const queryParams = new URLSearchParams()
  if (params.clientId) queryParams.set('clientId', params.clientId)
  if (params.jobId) queryParams.set('jobId', params.jobId)
  if (params.candidateId) queryParams.set('candidateId', params.candidateId)
  
  return useQuery({
    queryKey: ['messages', 'context', params],
    queryFn: () => apiRequest(`/api/messages/context?${queryParams.toString()}`),
    enabled: !!(params.clientId || params.jobId || params.candidateId),
  })
}

export function useUnreadMessageCount(userId?: string) {
  return useQuery({
    queryKey: ['messages', 'unread-count', userId],
    queryFn: () => apiRequest(`/api/messages/unread-count${userId ? `?userId=${userId}` : ''}`),
    refetchInterval: 30000, // Refresh every 30 seconds
  })
}

export function useCreateMessage() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (message: InsertMessage) => 
      apiRequest('/api/messages', {
        method: 'POST',
        body: JSON.stringify(message),
      }),
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['messages'] })
    },
  })
}

export function useUpdateMessage() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, ...message }: { id: string } & Partial<InsertMessage>) =>
      apiRequest(`/api/messages/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(message),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] })
    },
  })
}

export function useMarkMessageAsRead() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ messageId, userId }: { messageId: string; userId: string }) =>
      apiRequest(`/api/messages/${messageId}/read`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] })
    },
  })
}

export function useArchiveMessage() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (messageId: string) =>
      apiRequest(`/api/messages/${messageId}/archive`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] })
    },
  })
}