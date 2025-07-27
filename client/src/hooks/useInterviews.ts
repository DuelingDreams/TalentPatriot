import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'
import type { Interview, InsertInterview } from '@shared/schema'

// Hook to fetch all interviews for an organization
export function useInterviews(orgId?: string) {
  return useQuery({
    queryKey: ['/api/interviews', orgId],
    queryFn: () => apiRequest(`/api/interviews?org_id=${orgId}`),
    enabled: !!orgId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Hook to fetch a specific interview
export function useInterview(interviewId: string) {
  return useQuery({
    queryKey: ['/api/interviews', interviewId],
    queryFn: () => apiRequest(`/api/interviews/${interviewId}`),
    enabled: !!interviewId,
  })
}

// Hook to create a new interview
export function useCreateInterview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (interview: InsertInterview) => 
      apiRequest('/api/interviews', {
        method: 'POST',
        body: JSON.stringify(interview),
      }),
    onSuccess: (newInterview) => {
      // Invalidate the interviews list for this organization
      queryClient.invalidateQueries({ queryKey: ['/api/interviews', newInterview.orgId] })
      queryClient.invalidateQueries({ queryKey: ['/api/interviews'] })
    },
  })
}

// Hook to update an interview
export function useUpdateInterview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...interview }: Partial<Interview> & { id: string }) =>
      apiRequest(`/api/interviews/${id}`, {
        method: 'PUT',
        body: JSON.stringify(interview),
      }),
    onSuccess: (updatedInterview) => {
      // Invalidate both the specific interview and the interviews list
      queryClient.invalidateQueries({ queryKey: ['/api/interviews', updatedInterview.id] })
      queryClient.invalidateQueries({ queryKey: ['/api/interviews', updatedInterview.orgId] })
      queryClient.invalidateQueries({ queryKey: ['/api/interviews'] })
    },
  })
}

// Hook to delete an interview
export function useDeleteInterview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (interviewId: string) =>
      apiRequest(`/api/interviews/${interviewId}`, {
        method: 'DELETE',
      }),
    onSuccess: (_, interviewId) => {
      // Invalidate the interviews list
      queryClient.invalidateQueries({ queryKey: ['/api/interviews'] })
      // Remove the specific interview from cache
      queryClient.removeQueries({ queryKey: ['/api/interviews', interviewId] })
    },
  })
}

// Hook to get interviews for a specific date range  
export function useInterviewsByDateRange(startDate: Date, endDate: Date, orgId?: string) {
  return useQuery({
    queryKey: ['/api/interviews', 'date-range', startDate.toISOString(), endDate.toISOString(), orgId],
    queryFn: async () => {
      const interviews = await apiRequest(`/api/interviews?org_id=${orgId}`)
      // Filter interviews by date range on the client side
      return interviews.filter((interview: Interview) => {
        const scheduledAt = new Date(interview.scheduledAt)
        return scheduledAt >= startDate && scheduledAt <= endDate
      })
    },
    enabled: !!orgId,
    staleTime: 1 * 60 * 1000, // 1 minute for date-specific queries
  })
}