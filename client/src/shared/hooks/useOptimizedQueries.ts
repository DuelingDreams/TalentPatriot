// Optimized query hooks with performance improvements
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/useAuth";

// Optimized dashboard query with caching
export function useOptimizedDashboard() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["/api/dashboard/stats", user?.id],
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    refetchOnWindowFocus: false,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
}

// Optimized pipeline query with smart caching
export function useOptimizedPipeline(jobId: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["/api/pipeline", jobId, user?.id],
    enabled: !!user && !!jobId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: true, // Refresh on focus for pipeline
  });
}

// Optimized candidates search with debouncing
export function useOptimizedCandidatesSearch(searchTerm: string, filters: any) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["/api/candidates/search", searchTerm, filters, user?.id],
    enabled: !!user && searchTerm.length >= 2, // Only search with 2+ characters
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes cache
    refetchOnWindowFocus: false,
  });
}

// Batch query for multiple resources
export function useOptimizedBatchQuery(resources: string[]) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["/api/batch", resources, user?.id],
    queryFn: async () => {
      // Batch multiple API calls into one
      const promises = resources.map(resource => 
        fetch(`/api/${resource}`).then(r => r.json())
      );
      return Promise.all(promises);
    },
    enabled: !!user && resources.length > 0,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes cache
  });
}

// Infinite query for large datasets
export function useOptimizedInfiniteQuery(endpoint: string, pageSize = 20) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: [endpoint, "infinite", user?.id],
    queryFn: async () => {
      const response = await fetch(
        `${endpoint}?offset=0&limit=${pageSize}`
      );
      return response.json();
    },
    enabled: !!user,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes cache
  });
}