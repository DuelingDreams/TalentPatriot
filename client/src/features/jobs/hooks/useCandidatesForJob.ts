import { useEffect, useState, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { apiRequest } from '@/lib/queryClient'
import { useToast } from '@/shared/hooks/use-toast'
import { useDemoFlag } from '@/lib/demoFlag'
import { demoAdapter } from '@/lib/dataAdapter'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface JobCandidate {
  id: string
  jobId: string
  candidateId: string
  columnId: string | null
  status: string
  appliedAt: string
  candidate: {
    id: string
    name: string
    email: string
    phone: string | null
    resumeUrl: string | null
  }
}

interface UseJobCandidatesOptions {
  enableRealtime?: boolean
  pollingInterval?: number // in seconds, fallback when realtime is disabled
}

/**
 * Enhanced hook that fetches job candidates with Supabase Realtime support
 * Automatically falls back to polling if realtime connection fails
 */
export function useCandidatesForJob(
  jobId: string | undefined, 
  options: UseJobCandidatesOptions = {}
) {
  const { 
    enableRealtime = true, 
    pollingInterval = 30 // 30 seconds fallback polling
  } = options
  
  const { currentOrgId, userRole } = useAuth()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { isDemoUser } = useDemoFlag()
  
  // Realtime state management
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'disabled'>('disabled')
  const [lastRealtimeEvent, setLastRealtimeEvent] = useState<Date | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Query key for React Query caching
  const queryKey = ['/api/jobs', jobId, 'candidates', { orgId: currentOrgId }]

  // Main React Query for fetching candidates
  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<JobCandidate[]> => {
      // Demo data for demo viewer
      if (isDemoUser) {
        if (!jobId) return []
        return demoAdapter.getCandidatesForJob(jobId).then(candidates => 
          candidates.map((c: any) => ({
            id: c.id,
            jobId: jobId,
            candidateId: c.id,
            columnId: null,
            status: 'active' as const,
            appliedAt: c.createdAt || new Date().toISOString(),
            candidate: {
              id: c.id,
              name: c.name,
              email: c.email,
              phone: c.phone || null,
              resumeUrl: c.resumeUrl || null,
              createdAt: new Date(c.createdAt),
              updatedAt: new Date(c.updatedAt),
              orgId: c.orgId,
              status: 'demo' as const,
              resumeParsed: false,
              skills: [],
              experienceLevel: 'mid' as const,
              totalYearsExperience: null,
              educationLevel: null,
              currentJobTitle: null,
              searchableContent: null
            }
          }))
        )
      }
      
      if (!jobId || !currentOrgId) {
        return []
      }
      
      return apiRequest(`/api/jobs/${jobId}/candidates?orgId=${currentOrgId}`)
    },
    enabled: !!jobId && !!currentOrgId,
    staleTime: enableRealtime ? 10 * 60 * 1000 : 30 * 1000, // 10 minutes with realtime, 30s without
    gcTime: 15 * 60 * 1000, // 15 minutes
    // Disable refetch intervals when realtime is active
    refetchInterval: (!enableRealtime || realtimeStatus === 'disconnected') ? pollingInterval * 1000 : false,
  })

  // Setup Supabase Realtime subscriptions
  useEffect(() => {
    if (!enableRealtime || !jobId || !currentOrgId || isDemoUser) {
      setRealtimeStatus('disabled')
      return
    }

    // Temporarily disable realtime to fix subscription errors
    setRealtimeStatus('disabled')
    return

    let mounted = true
    setRealtimeStatus('connecting')

    const setupRealtime = async () => {
      try {
        // Clean up existing channel
        if (channelRef.current) {
          await supabase.removeChannel(channelRef.current)
          channelRef.current = null
        }

        // Create new channel for this specific job
        const channel = supabase
          .channel(`job_candidates_${jobId}`)
          .on(
            'postgres_changes',
            {
              event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
              schema: 'public',
              table: 'job_candidate',
              filter: `job_id=eq.${jobId}`
            },
            (payload) => {
              if (!mounted) return
              
              setLastRealtimeEvent(new Date())
              
              // Invalidate and refetch the query
              queryClient.invalidateQueries({ queryKey })
              
              // Show toast notification for new applications
              if (payload.eventType === 'INSERT') {
                toast({
                  title: "New Application",
                  description: "A new candidate has applied to this job",
                  duration: 3000
                })
              }
            }
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public', 
              table: 'pipeline_columns',
              filter: `job_id=eq.${jobId}`
            },
            (payload) => {
              if (!mounted) return
              
              setLastRealtimeEvent(new Date())
              
              // Invalidate related pipeline queries
              queryClient.invalidateQueries({ queryKey: ['job-pipeline', jobId] })
              queryClient.invalidateQueries({ queryKey })
            }
          )

        // Subscribe to the channel first
        await channel.subscribe((status: string, _err?: any, _callback?: () => void) => {
            if (!mounted) return
            
            if (status === 'SUBSCRIBED') {
              setRealtimeStatus('connected')
              // Clear any existing polling when realtime connects
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current)
                pollingIntervalRef.current = null
              }
            }
          })

        // Error handling is managed through subscription status callback
        // Realtime errors will trigger fallback polling automatically

        channelRef.current = channel

      } catch (error) {
        console.error('[Realtime] Setup failed:', error)
        if (mounted) {
          setRealtimeStatus('disconnected')
          setupFallbackPolling()
        }
      }
    }

    // Setup fallback polling for disconnected state
    const setupFallbackPolling = () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
      
      pollingIntervalRef.current = setInterval(() => {
        if (!mounted || realtimeStatus === 'connected') return
        
        queryClient.invalidateQueries({ queryKey })
      }, pollingInterval * 1000)
    }

    setupRealtime()

    return () => {
      mounted = false
      
      // Clean up realtime subscription
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      
      // Clear polling interval
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
  }, [jobId, currentOrgId, enableRealtime, userRole, pollingInterval, queryClient, toast, queryKey])

  // Connection health monitoring
  useEffect(() => {
    if (!enableRealtime || realtimeStatus !== 'connected') return

    const healthCheck = setInterval(() => {
      const now = new Date()
      const timeSinceLastEvent = lastRealtimeEvent 
        ? now.getTime() - lastRealtimeEvent.getTime()
        : Infinity

      // If no events for 2 minutes and we think we're connected, test the connection
      if (timeSinceLastEvent > 2 * 60 * 1000) {
        // This is a passive health check - we just refresh the query
        queryClient.invalidateQueries({ queryKey })
      }
    }, 60 * 1000) // Check every minute

    return () => clearInterval(healthCheck)
  }, [enableRealtime, realtimeStatus, lastRealtimeEvent, queryClient, queryKey])

  return {
    ...query,
    // Additional realtime-specific data
    realtimeStatus,
    lastRealtimeEvent,
    isRealtimeEnabled: enableRealtime,
    // Utility methods
    refresh: () => queryClient.invalidateQueries({ queryKey }),
    forceRefresh: () => queryClient.refetchQueries({ queryKey }),
  }
}

// Demo data generator for demo viewer
function getDemoJobCandidates(jobId?: string): JobCandidate[] {
  if (jobId === 'demo-job-1') {
    return [
      {
        id: 'demo-job-candidate-1',
        jobId: 'demo-job-1',
        candidateId: 'demo-candidate-1',
        columnId: 'demo-column-interview',
        status: 'active',
        appliedAt: new Date('2024-07-05').toISOString(),
        candidate: {
          id: 'demo-candidate-1',
          name: 'Emily Rodriguez',
          email: 'emily.rodriguez@email.com',
          phone: '+1 (555) 123-4567',
          resumeUrl: null
        }
      },
      {
        id: 'demo-job-candidate-1b',
        jobId: 'demo-job-1',
        candidateId: 'demo-candidate-1b',
        columnId: 'demo-column-applied',
        status: 'active',
        appliedAt: new Date('2024-07-08').toISOString(),
        candidate: {
          id: 'demo-candidate-1b',
          name: 'Michael Chen',
          email: 'michael.chen@email.com',
          phone: null,
          resumeUrl: null
        }
      }
    ]
  }
  
  if (jobId === 'demo-job-2') {
    return [
      {
        id: 'demo-job-candidate-2',
        jobId: 'demo-job-2',
        candidateId: 'demo-candidate-2',
        columnId: 'demo-column-screen',
        status: 'active',
        appliedAt: new Date('2024-07-12').toISOString(),
        candidate: {
          id: 'demo-candidate-2',
          name: 'James Wilson',
          email: 'james.wilson@email.com',
          phone: '+1 (555) 987-6543',
          resumeUrl: null
        }
      }
    ]
  }
  
  return []
}

