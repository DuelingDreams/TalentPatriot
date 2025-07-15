import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Job, Candidate, Client } from '@/../../shared/schema'

// Hook to fetch all jobs
export function useJobs() {
  const { userRole } = useAuth()
  
  return useQuery({
    queryKey: ['jobs', userRole],
    queryFn: async () => {
      let query = supabase
        .from('jobs')
        .select(`
          *,
          clients (
            id,
            name,
            industry
          )
        `)
      
      // Filter based on user role
      if (userRole === 'demo_viewer') {
        query = query.eq('record_status', 'demo')
      } else {
        query = query.is('record_status', null).or('record_status.neq.demo')
      }
      
      query = query.order('created_at', { ascending: false })

      const { data, error } = await query

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
  const { userRole } = useAuth()
  
  return useQuery({
    queryKey: ['job-candidates', jobId, userRole],
    queryFn: async () => {
      if (!jobId) return []

      let query = supabase
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
      
      // Filter based on user role
      if (userRole === 'demo_viewer') {
        query = query.eq('status', 'demo')
      } else {
        query = query.is('status', null).or('status.neq.demo')
      }
      
      query = query.order('updated_at', { ascending: false })

      const { data, error } = await query

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
  const { userRole } = useAuth()
  
  return useQuery({
    queryKey: ['clients', userRole],
    queryFn: async () => {
      let query = supabase
        .from('clients')
        .select('*')
      
      // Filter based on user role
      if (userRole === 'demo_viewer') {
        query = query.eq('status', 'demo')
      } else {
        query = query.is('status', null).or('status.neq.demo')
      }
      
      query = query.order('name', { ascending: true })

      const { data, error } = await query

      if (error) {
        throw new Error(error.message)
      }

      return data as Client[]
    }
  })
}

// Hook to fetch all candidates
export function useCandidates() {
  const { userRole } = useAuth()
  
  return useQuery({
    queryKey: ['candidates', userRole],
    queryFn: async () => {
      let query = supabase
        .from('candidates')
        .select('*')
      
      // Filter based on user role
      if (userRole === 'demo_viewer') {
        query = query.eq('status', 'demo')
      } else {
        query = query.is('status', null).or('status.neq.demo')
      }
      
      query = query.order('created_at', { ascending: false })

      const { data, error } = await query

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
      // Get the current authenticated user
      const { data: { user } } = await supabase.auth.getUser()
      const authorId = user?.id || 'anonymous-user-' + Date.now().toString().slice(-4)

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