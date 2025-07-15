import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { demoClients, demoCandidates, demoJobs, demoJobCandidates, getDemoJobCandidatesByJobId } from '@/lib/demo-data'
import type { Job, Candidate, Client } from '@/../../shared/schema'

// Hook to fetch all jobs
export function useJobs() {
  const { userRole } = useAuth()
  const isDemoMode = localStorage.getItem('demo_mode') === 'true'
  
  return useQuery({
    queryKey: ['jobs', userRole, isDemoMode],
    queryFn: async () => {
      // Always return demo data if in demo mode
      if (isDemoMode || userRole === 'demo_viewer') {
        return demoJobs.map(job => ({
          ...job,
          clients: demoClients.find(client => client.id === job.clientId) || demoClients[0]
        }))
      }

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
      
      // Filter for real users - exclude demo data
      query = query.neq('recordStatus', 'demo').or('recordStatus.is.null')
      query = query.order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) {
        console.warn('Supabase jobs query failed:', error.message)
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
  const isDemoMode = localStorage.getItem('demo_mode') === 'true'
  
  return useQuery({
    queryKey: ['job-candidates', jobId, userRole, isDemoMode],
    queryFn: async () => {
      if (!jobId) return []

      // Always return demo data if in demo mode
      if (isDemoMode || userRole === 'demo_viewer') {
        const demoJobCandidatesForJob = getDemoJobCandidatesByJobId(jobId)
        return demoJobCandidatesForJob.map(jc => ({
          id: jc.id,
          stage: jc.stage,
          notes: jc.notes,
          assigned_to: jc.assignedTo,
          updated_at: jc.updatedAt,
          candidates: demoCandidates.find(c => c.id === jc.candidateId) || demoCandidates[0]
        }))
      }

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
      
      // Filter for real users - exclude demo data
      query = query.neq('status', 'demo').or('status.is.null')
      query = query.order('updated_at', { ascending: false })

      const { data, error } = await query

      if (error) {
        console.warn('Supabase job candidates query failed:', error.message)
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
  const isDemoMode = localStorage.getItem('demo_mode') === 'true'
  
  return useQuery({
    queryKey: ['clients', userRole, isDemoMode],
    queryFn: async () => {
      // Always return demo data if in demo mode
      if (isDemoMode || userRole === 'demo_viewer') {
        return demoClients
      }

      let query = supabase
        .from('clients')
        .select('*')
      
      // Filter for real users - exclude demo data
      query = query.neq('status', 'demo').or('status.is.null')
      query = query.order('name', { ascending: true })

      const { data, error } = await query

      if (error) {
        console.warn('Supabase clients query failed:', error.message)
        throw new Error(error.message)
      }

      return data as Client[]
    }
  })
}

// Hook to fetch all candidates
export function useCandidates() {
  const { userRole } = useAuth()
  const isDemoMode = localStorage.getItem('demo_mode') === 'true'
  
  return useQuery({
    queryKey: ['candidates', userRole, isDemoMode],
    queryFn: async () => {
      // Always return demo data if in demo mode
      if (isDemoMode || userRole === 'demo_viewer') {
        return demoCandidates
      }

      let query = supabase
        .from('candidates')
        .select('*')
      
      // Filter for real users - exclude demo data
      query = query.neq('status', 'demo').or('status.is.null')
      query = query.order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) {
        console.warn('Supabase candidates query failed:', error.message)
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

// Hook to fetch interview events for calendar
export function useInterviewEvents() {
  const { userRole } = useAuth()
  
  return useQuery({
    queryKey: ['interview-events', userRole],
    queryFn: async () => {
      let query = supabase
        .from('job_candidate')
        .select(`
          id,
          interview_date,
          stage,
          candidates (
            id,
            name,
            email
          ),
          jobs (
            id,
            title,
            clients (
              id,
              name
            )
          )
        `)
        .not('interview_date', 'is', null)
      
      // Filter based on user role
      if (userRole === 'demo_viewer') {
        query = query.eq('status', 'demo')
      } else {
        query = query.is('status', null).or('status.neq.demo')
      }
      
      query = query.order('interview_date', { ascending: true })

      const { data, error } = await query

      if (error) {
        throw new Error(error.message)
      }

      return data as {
        id: string
        interview_date: string
        stage: string
        candidates: {
          id: string
          name: string
          email: string
        }
        jobs: {
          id: string
          title: string
          clients: {
            id: string
            name: string
          }
        }
      }[]
    }
  })
}

// Hook to schedule an interview
export function useScheduleInterview() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      jobCandidateId, 
      interviewDate, 
      stage 
    }: { 
      jobCandidateId: string
      interviewDate: string
      stage?: string 
    }) => {
      const { data, error } = await supabase
        .from('job_candidate')
        .update({ 
          interview_date: interviewDate,
          stage: stage || 'interview',
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interview-events'] })
      queryClient.invalidateQueries({ queryKey: ['job-candidates'] })
    }
  })
}

// Hook to fetch dashboard metrics
export function useDashboardMetrics() {
  const { userRole } = useAuth()
  
  return useQuery({
    queryKey: ['dashboard-metrics', userRole],
    queryFn: async () => {
      // Get jobs count
      let jobsQuery = supabase
        .from('jobs')
        .select('id, status', { count: 'exact' })
      
      // Get candidates count  
      let candidatesQuery = supabase
        .from('candidates')
        .select('id', { count: 'exact' })
        
      // Get recent hire data for average days calculation
      let hiredCandidatesQuery = supabase
        .from('job_candidate')
        .select(`
          updated_at,
          candidates!inner (
            created_at
          )
        `)
        .eq('stage', 'hired')
      
      // Filter based on user role
      if (userRole === 'demo_viewer') {
        jobsQuery = jobsQuery.eq('record_status', 'demo')
        candidatesQuery = candidatesQuery.eq('status', 'demo')
        hiredCandidatesQuery = hiredCandidatesQuery.eq('status', 'demo')
      } else {
        jobsQuery = jobsQuery.is('record_status', null).or('record_status.neq.demo')
        candidatesQuery = candidatesQuery.is('status', null).or('status.neq.demo')
        hiredCandidatesQuery = hiredCandidatesQuery.is('status', null).or('status.neq.demo')
      }

      const [jobsResult, candidatesResult, hiredResult] = await Promise.all([
        jobsQuery,
        candidatesQuery,
        hiredCandidatesQuery
      ])

      if (jobsResult.error || candidatesResult.error || hiredResult.error) {
        throw new Error('Failed to fetch dashboard metrics')
      }

      // Calculate metrics
      const totalJobs = jobsResult.count || 0
      const openJobs = jobsResult.data?.filter(job => job.status === 'open').length || 0
      const totalCandidates = candidatesResult.count || 0
      
      // Calculate average days to hire
      let averageDaysToHire = 0
      if (hiredResult.data && hiredResult.data.length > 0) {
        const daysTotals = hiredResult.data.map(hire => {
          const hiredDate = new Date(hire.updated_at)
          const applicationDate = new Date(hire.candidates.created_at)
          return Math.floor((hiredDate.getTime() - applicationDate.getTime()) / (1000 * 60 * 60 * 24))
        })
        averageDaysToHire = Math.round(daysTotals.reduce((sum, days) => sum + days, 0) / daysTotals.length)
      }

      return {
        totalJobs,
        openJobs,
        totalCandidates,
        averageDaysToHire
      }
    }
  })
}

// Hook to fetch recent candidate activity
export function useRecentActivity() {
  const { userRole } = useAuth()
  
  return useQuery({
    queryKey: ['recent-activity', userRole],
    queryFn: async () => {
      let query = supabase
        .from('job_candidate')
        .select(`
          id,
          stage,
          updated_at,
          candidates (
            id,
            name,
            email
          ),
          jobs (
            id,
            title,
            clients (
              name
            )
          )
        `)
        .order('updated_at', { ascending: false })
        .limit(10)
      
      // Filter based on user role
      if (userRole === 'demo_viewer') {
        query = query.eq('status', 'demo')
      } else {
        query = query.is('status', null).or('status.neq.demo')
      }

      const { data, error } = await query

      if (error) {
        throw new Error(error.message)
      }

      return data?.map(activity => ({
        id: activity.id,
        candidateName: activity.candidates.name,
        jobTitle: activity.jobs.title,
        clientName: activity.jobs.clients?.name,
        stage: activity.stage,
        timestamp: activity.updated_at
      })) || []
    }
  })
}