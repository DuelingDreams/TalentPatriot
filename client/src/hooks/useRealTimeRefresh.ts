import { useEffect, useRef, useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../supabaseClient'

interface UseRealTimeRefreshOptions {
  interval?: number // in milliseconds
  enabled?: boolean
  queries?: string[] // specific query keys to refresh
}

export function useRealTimeRefresh({
  interval = 30000,
  enabled = true,
  queries = []
}: UseRealTimeRefreshOptions) {
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const queryClient = useQueryClient()
  const { currentOrgId } = useAuth()

  const manualRefresh = useCallback(async () => {
    if (isRefreshing) return

    setIsRefreshing(true)
    try {
      await Promise.all(
        queries.map(queryKey => queryClient.invalidateQueries({ queryKey: [queryKey] }))
      )
      setLastRefreshed(new Date())
    } finally {
      setIsRefreshing(false)
    }
  }, [isRefreshing, queries, queryClient])

  // Enhanced with Supabase real-time subscriptions
  useEffect(() => {
    if (!enabled || !currentOrgId) return

    const subscriptions: any[] = []

    // Subscribe to database changes for real-time updates
    const tables = ['jobs', 'candidates', 'job_candidates', 'applications']

    tables.forEach(table => {
      const subscription = supabase
        .channel(`${table}_changes`)
        .on('postgres_changes', 
          { event: '*', schema: 'public', table, filter: `org_id=eq.${currentOrgId}` },
          (payload) => {
            console.log(`Real-time update on ${table}:`, payload)
            // Invalidate related queries
            queryClient.invalidateQueries({ queryKey: [`/api/${table}`] })
            setLastRefreshed(new Date())
          }
        )
        .subscribe()

      subscriptions.push(subscription)
    })

    // Fallback polling interval
    const intervalId = setInterval(manualRefresh, interval)

    return () => {
      clearInterval(intervalId)
      subscriptions.forEach(sub => sub.unsubscribe())
    }
  }, [enabled, interval, manualRefresh, currentOrgId])

  return {
    lastRefreshed,
    isRefreshing,
    manualRefresh
  }
}