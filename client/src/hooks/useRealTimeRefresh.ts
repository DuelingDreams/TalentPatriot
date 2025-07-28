import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

interface UseRealTimeRefreshOptions {
  interval?: number // in milliseconds
  enabled?: boolean
  queries?: string[] // specific query keys to refresh
}

export function useRealTimeRefresh(options: UseRealTimeRefreshOptions = {}) {
  const {
    interval = 30000, // 30 seconds default
    enabled = true,
    queries = []
  } = options

  const queryClient = useQueryClient()
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout>()

  const refreshData = async (showIndicator = true) => {
    if (showIndicator) {
      setIsRefreshing(true)
    }

    try {
      if (queries.length > 0) {
        // Refresh specific queries
        await Promise.all(
          queries.map(queryKey => 
            queryClient.invalidateQueries({ 
              queryKey: [queryKey],
              refetchType: 'active'
            })
          )
        )
      } else {
        // Refresh all active queries
        await queryClient.invalidateQueries({
          refetchType: 'active'
        })
      }
      
      setLastRefreshed(new Date())
    } catch (error) {
      console.error('Failed to refresh data:', error)
    } finally {
      if (showIndicator) {
        // Keep indicator visible for minimum time for better UX
        setTimeout(() => setIsRefreshing(false), 1000)
      }
    }
  }

  const manualRefresh = () => {
    refreshData(true)
  }

  useEffect(() => {
    if (!enabled) return

    // Initial refresh on mount
    refreshData(false)

    // Set up interval
    intervalRef.current = setInterval(() => {
      refreshData(false) // Background refresh without indicator
    }, interval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [enabled, interval])

  // Handle visibility change - refresh when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && enabled) {
        refreshData(false)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [enabled])

  return {
    lastRefreshed,
    isRefreshing,
    manualRefresh,
    refreshData
  }
}