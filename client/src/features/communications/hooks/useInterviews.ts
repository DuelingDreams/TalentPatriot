import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Interview, InsertInterview } from '@shared/schema'

export function useInterviews(orgId?: string) {
  return useQuery({
    queryKey: ['/api/interviews', orgId],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (orgId) params.append('orgId', orgId)
      
      const response = await fetch(`/api/interviews?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch interviews')
      }
      return response.json() as Promise<Interview[]>
    },
    enabled: !!orgId,
  })
}

export function useInterviewsByJobCandidate(jobCandidateId: string) {
  return useQuery({
    queryKey: ['/api/interviews', 'job-candidate', jobCandidateId],
    queryFn: async () => {
      const response = await fetch(`/api/interviews/job-candidate/${jobCandidateId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch interviews')
      }
      return response.json() as Promise<Interview[]>
    },
    enabled: !!jobCandidateId,
  })
}

export function useCreateInterview() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (interview: InsertInterview) => {
      const response = await fetch('/api/interviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(interview),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create interview')
      }
      
      return response.json() as Promise<Interview>
    },
    onSuccess: (data) => {
      // Invalidate and refetch interviews
      queryClient.invalidateQueries({ queryKey: ['/api/interviews'] })
      queryClient.invalidateQueries({ 
        queryKey: ['/api/interviews', 'job-candidate', data.jobCandidateId] 
      })
    },
  })
}

export function useUpdateInterview() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, interview }: { id: string; interview: Partial<InsertInterview> }) => {
      const response = await fetch(`/api/interviews/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(interview),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update interview')
      }
      
      return response.json() as Promise<Interview>
    },
    onSuccess: (data) => {
      // Invalidate and refetch interviews
      queryClient.invalidateQueries({ queryKey: ['/api/interviews'] })
      queryClient.invalidateQueries({ 
        queryKey: ['/api/interviews', 'job-candidate', data.jobCandidateId] 
      })
    },
  })
}