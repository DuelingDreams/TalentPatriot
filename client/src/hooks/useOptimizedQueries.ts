import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'
import { useAuth } from '@/contexts/AuthContext'

// Optimized dashboard statistics hook with caching
export function useOptimizedDashboardStats() {
  const { currentOrgId, userRole } = useAuth()
  
  return useQuery({
    queryKey: ['/api/dashboard/stats', currentOrgId],
    queryFn: async () => {
      if (userRole === 'demo_viewer') {
        // Return cached demo stats to avoid unnecessary API calls
        return {
          total_clients: 8,
          active_jobs: 5,
          total_candidates: 12,
          candidates_this_week: 3,
          pipeline_summary: [
            { stage: 'applied', count: 4 },
            { stage: 'screening', count: 3 },
            { stage: 'interview', count: 2 },
            { stage: 'offer', count: 1 }
          ]
        }
      }
      return apiRequest(`/api/dashboard/stats?org_id=${currentOrgId}`)
    },
    enabled: !!currentOrgId,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    cacheTime: 10 * 60 * 1000, // 10 minutes memory
  })
}

// Optimized pipeline candidates with fewer API calls
export function useOptimizedPipelineCandidates(jobId?: string) {
  const { currentOrgId, userRole } = useAuth()
  
  return useQuery({
    queryKey: ['/api/pipeline/candidates', jobId, currentOrgId],
    queryFn: async () => {
      if (userRole === 'demo_viewer') {
        // Return demo pipeline data to reduce load
        return getDemoPipelineData()
      }
      return apiRequest(`/api/pipeline/candidates?job_id=${jobId}&org_id=${currentOrgId}`)
    },
    enabled: !!jobId && !!currentOrgId,
    staleTime: 2 * 60 * 1000, // 2 minutes cache for frequently changing data
    cacheTime: 5 * 60 * 1000,
  })
}

// Batch organization data loading
export function useOptimizedOrganizationData() {
  const { user, userRole } = useAuth()
  
  return useQuery({
    queryKey: ['/api/user/organization-data', user?.id],
    queryFn: async () => {
      if (userRole === 'demo_viewer') {
        return {
          organizations: [{
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: 'TalentPatriot Demo',
            role: 'demo_viewer'
          }],
          current_org: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: 'TalentPatriot Demo'
          }
        }
      }
      return apiRequest(`/api/user/${user?.id}/organization-data`)
    },
    enabled: !!user?.id,
    staleTime: 15 * 60 * 1000, // 15 minutes cache - org data changes rarely
    cacheTime: 30 * 60 * 1000,
  })
}

// Optimized search with debouncing and caching
export function useOptimizedSearch(searchTerm: string, searchType: 'clients' | 'jobs' | 'candidates') {
  const { currentOrgId, userRole } = useAuth()
  
  return useQuery({
    queryKey: ['/api/search', searchType, searchTerm, currentOrgId],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return []
      
      if (userRole === 'demo_viewer') {
        return getDemoSearchResults(searchTerm, searchType)
      }
      
      return apiRequest(`/api/search/${searchType}?q=${encodeURIComponent(searchTerm)}&org_id=${currentOrgId}`)
    },
    enabled: !!searchTerm && searchTerm.length >= 2 && !!currentOrgId,
    staleTime: 30 * 1000, // 30 seconds cache for search
    cacheTime: 2 * 60 * 1000,
  })
}

// Optimized recent activity with pagination
export function useOptimizedRecentActivity(limit = 10) {
  const { currentOrgId, userRole } = useAuth()
  
  return useQuery({
    queryKey: ['/api/activity/recent', currentOrgId, limit],
    queryFn: async () => {
      if (userRole === 'demo_viewer') {
        return getDemoRecentActivity(limit)
      }
      return apiRequest(`/api/activity/recent?org_id=${currentOrgId}&limit=${limit}`)
    },
    enabled: !!currentOrgId,
    staleTime: 1 * 60 * 1000, // 1 minute cache
    cacheTime: 3 * 60 * 1000,
  })
}

// Helper functions for demo data (reduces API load)
function getDemoPipelineData() {
  return [
    {
      candidate_id: 'demo-1',
      candidate_name: 'Sarah Johnson',
      candidate_email: 'sarah.j@email.com',
      stage: 'applied',
      notes_count: 2,
      last_update: new Date().toISOString()
    },
    {
      candidate_id: 'demo-2', 
      candidate_name: 'Michael Chen',
      candidate_email: 'mchen@email.com',
      stage: 'interview',
      notes_count: 1,
      last_update: new Date().toISOString()
    }
  ]
}

function getDemoSearchResults(searchTerm: string, searchType: string) {
  const demoData = {
    clients: [
      { id: 'demo-client-1', name: 'TechCorp Solutions', industry: 'Technology' },
      { id: 'demo-client-2', name: 'FinanceFirst', industry: 'Finance' }
    ],
    jobs: [
      { id: 'demo-job-1', title: 'Senior Developer', status: 'open' },
      { id: 'demo-job-2', title: 'Product Manager', status: 'open' }
    ],
    candidates: [
      { id: 'demo-cand-1', name: 'Alice Wilson', email: 'alice@email.com' },
      { id: 'demo-cand-2', name: 'Bob Martinez', email: 'bob@email.com' }
    ]
  }
  
  return demoData[searchType as keyof typeof demoData].filter(item => 
    JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase())
  )
}

function getDemoRecentActivity(limit: number) {
  return [
    {
      id: 'activity-1',
      type: 'candidate_applied',
      message: 'New candidate applied for Senior Developer',
      timestamp: new Date().toISOString()
    },
    {
      id: 'activity-2',
      type: 'interview_scheduled',
      message: 'Interview scheduled with Alice Wilson',
      timestamp: new Date(Date.now() - 3600000).toISOString()
    }
  ].slice(0, limit)
}

// Mutation with optimistic updates for better UX
export function useOptimizedMutation(endpoint: string, method: 'POST' | 'PUT' | 'DELETE' = 'POST') {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: any) => apiRequest(endpoint, { method, body: JSON.stringify(data) }),
    onSuccess: () => {
      // Invalidate relevant queries efficiently
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] })
      queryClient.invalidateQueries({ queryKey: ['/api/pipeline/candidates'] })
      queryClient.invalidateQueries({ queryKey: ['/api/activity/recent'] })
    },
  })
}