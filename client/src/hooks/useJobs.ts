import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Job, Candidate, Client } from '@/../../shared/schema'

// Hook to fetch all jobs
export function useJobs() {
  return useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          clients (
            id,
            name,
            industry
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(error.message)
      }

      return data as (Job & {
        clients: {
          id: string
          name: string
          industry: string | null
        }
      })[]
    }
  })
}

// Hook to fetch candidates for a specific job
export function useCandidatesForJob(jobId: string | null) {
  return useQuery({
    queryKey: ['job-candidates', jobId],
    queryFn: async () => {
      if (!jobId) return []

      const { data, error } = await supabase
        .from('job_candidate')
        .select(`
          id,
          stage,
          notes,
          assigned_to,
          updated_at,
          candidates (
            id,
            name,
            email,
            phone,
            resume_url,
            created_at
          )
        `)
        .eq('job_id', jobId)
        .order('updated_at', { ascending: false })

      if (error) {
        throw new Error(error.message)
      }

      return data as {
        id: string
        stage: string
        notes: string | null
        assigned_to: string | null
        updated_at: string
        candidates: Candidate
      }[]
    },
    enabled: !!jobId // Only run query if jobId is provided
  })
}

// Hook to fetch all clients
export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        throw new Error(error.message)
      }

      return data as Client[]
    }
  })
}

// Hook to fetch all candidates
export function useCandidates() {
  return useQuery({
    queryKey: ['candidates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(error.message)
      }

      return data as Candidate[]
    }
  })
}

// Hook to create a new job
export function useCreateJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newJob: { title: string; description?: string; client_id: string; status?: string }) => {
      const { data, error } = await supabase
        .from('jobs')
        .insert(newJob)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
    },
    onSuccess: () => {
      // Invalidate and refetch jobs list
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    }
  })
}

// Hook to create a new candidate
export function useCreateCandidate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newCandidate: { name: string; email: string; phone?: string; resume_url?: string }) => {
      const { data, error } = await supabase
        .from('candidates')
        .insert(newCandidate)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
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
      const { data, error } = await supabase
        .from('job_candidate')
        .update({ 
          stage, 
          notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobCandidateId)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
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
      const { data, error } = await supabase
        .from('candidate_notes')
        .select('*')
        .eq('job_candidate_id', jobCandidateId)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(error.message)
      }

      return data as {
        id: string
        job_candidate_id: string
        author_id: string
        content: string
        created_at: string
      }[]
    },
    enabled: !!jobCandidateId
  })
}

// Hook to create a new candidate note
export function useCreateCandidateNote() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ jobCandidateId, content }: { jobCandidateId: string, content: string }) => {
      // For now, use a placeholder author ID since auth isn't set up yet
      // In a real app, this would get the authenticated user ID
      const authorId = 'recruiter-user-' + Date.now().toString().slice(-4)

      const { data, error } = await supabase
        .from('candidate_notes')
        .insert({
          job_candidate_id: jobCandidateId,
          author_id: authorId,
          content
        })
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['candidate-notes', variables.jobCandidateId] })
    }
  })
}