import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { getDemoJobStats, getDemoPipelineData } from '@/lib/demo-data'
import { apiRequest } from '@/lib/queryClient'
import type { Job, Candidate, Client } from '@/../../shared/schema'

// Hook to fetch all jobs
export function useJobs() {
  const { userRole } = useAuth()
  
  return useQuery({
    queryKey: ['jobs', userRole],
    queryFn: async () => {
      // Return demo data for demo users
      if (userRole === 'demo_viewer') {
        return getDemoJobStats() as any[]
      }
      
      const response = await fetch('/api/jobs')
      if (!response.ok) {
        throw new Error('Failed to fetch jobs')
      }
      
      return await response.json()
    }
  })
}

// Hook to fetch candidates for a specific job
export function useCandidatesForJob(jobId: string | null) {
  const { userRole } = useAuth()
  
  return useQuery({
    queryKey: ['job-candidates', jobId, userRole],
    queryFn: async () => {
      if (!jobId) return []

      // Return demo data for demo users
      if (userRole === 'demo_viewer') {
        const pipelineData = getDemoPipelineData()
        const allCandidates = pipelineData.flatMap(stage => stage.candidates)
        return allCandidates
      }

      // Use backend API instead of direct Supabase
      const response = await fetch(`/api/jobs/${jobId}/candidates`)
      if (!response.ok) {
        throw new Error('Failed to fetch job candidates')
      }
      
      return await response.json()
    },
    enabled: !!jobId // Only run query if jobId is provided
  })
}

// Hook to fetch all clients
export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const response = await fetch('/api/clients')
      if (!response.ok) {
        throw new Error('Failed to fetch clients')
      }
      
      return await response.json()
    }
  })
}

// Hook to fetch all candidates
export function useCandidates() {
  const { userRole } = useAuth()
  
  return useQuery({
    queryKey: ['candidates', userRole],
    queryFn: async () => {
      // Return demo data for demo users
      if (userRole === 'demo_viewer') {
        const pipelineData = getDemoPipelineData()
        const allCandidates = pipelineData.flatMap(stage => 
          stage.candidates.map(c => c.candidates)
        )
        return allCandidates
      }
      
      const response = await fetch('/api/candidates')
      if (!response.ok) {
        throw new Error('Failed to fetch candidates')
      }
      
      return await response.json()
    }
  })
}

// Hook to create a new job
export function useCreateJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newJob: { title: string; description?: string; client_id: string; status?: string }) => {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newJob.title,
          description: newJob.description,
          clientId: newJob.client_id, // Map client_id to clientId for backend API
          status: newJob.status || 'open'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create job')
      }

      return await response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch jobs list and clients (for job counts)
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    }
  })
}

// Hook to create a new candidate
export function useCreateCandidate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newCandidate: { name: string; email: string; phone?: string; resume_url?: string }) => {
      const response = await apiRequest('POST', '/api/candidates', newCandidate)
      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch candidates list
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
    }
  })
}

// Hook to update candidate stage in a job
export function useUpdateCandidateStage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      jobCandidateId, 
      stage, 
      notes 
    }: { 
      jobCandidateId: string
      stage: string
      notes?: string 
    }) => {
      const response = await apiRequest('PUT', `/api/job-candidates/${jobCandidateId}`, {
        stage,
        notes,
        updated_at: new Date().toISOString()
      })
      return response.json()
    },
    onSuccess: (_, variables) => {
      // Invalidate job candidates queries
      queryClient.invalidateQueries({ queryKey: ['job-candidates'] })
    }
  })
}

// Hook to fetch candidate notes for a specific job candidate
export function useCandidateNotes(jobCandidateId: string | null) {
  return useQuery({
    queryKey: ['candidate-notes', jobCandidateId],
    queryFn: async () => {
      const response = await fetch(`/api/candidate-notes/${jobCandidateId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch candidate notes')
      }
      
      return await response.json()
    },
    enabled: !!jobCandidateId
  })
}

// Hook to create a new job candidate assignment
export function useCreateJobCandidate() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      jobId, 
      candidateId, 
      stage = 'applied' 
    }: { 
      jobId: string
      candidateId: string
      stage?: string 
    }) => {
      const response = await apiRequest('POST', '/api/job-candidates', {
        jobId,
        candidateId, 
        stage
      })
      return response.json()
    },
    onSuccess: () => {
      // Invalidate job candidates queries
      queryClient.invalidateQueries({ queryKey: ['job-candidates'] })
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
    }
  })
}

// Hook to create a new candidate note
export function useCreateCandidateNote() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ jobCandidateId, content }: { jobCandidateId: string, content: string }) => {
      const response = await apiRequest('POST', '/api/candidate-notes', {
        job_candidate_id: jobCandidateId,
        author_id: 'recruiter-user-' + Date.now().toString().slice(-4),
        content
      })
      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['candidate-notes', variables.jobCandidateId] })
    }
  })
}