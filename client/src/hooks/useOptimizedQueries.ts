import { useQuery, UseQueryOptions } from '@tanstack/react-query';

// Performance-optimized query hooks with intelligent caching

export function useDashboardData(options?: UseQueryOptions) {
  return useQuery({
    queryKey: ['/api/dashboard'],
    staleTime: 5 * 60 * 1000, // 5 minutes cache for dashboard
    gcTime: 10 * 60 * 1000, // Keep in memory for 10 minutes
    refetchOnWindowFocus: false,
    ...options
  });
}

export function usePipelineData(jobId?: string, options?: UseQueryOptions) {
  return useQuery({
    queryKey: ['/api/pipeline', jobId],
    staleTime: 2 * 60 * 1000, // 2 minutes cache for pipeline (more dynamic)
    gcTime: 5 * 60 * 1000,
    enabled: !!jobId,
    refetchOnWindowFocus: false,
    ...options
  });
}

export function useSearchResults(searchTerm: string, searchType: string, options?: UseQueryOptions) {
  return useQuery({
    queryKey: ['/api/search', searchType, searchTerm],
    staleTime: 30 * 1000, // 30 seconds cache for search (short-lived)
    gcTime: 2 * 60 * 1000,
    enabled: searchTerm.length > 2, // Only search if term is meaningful
    refetchOnWindowFocus: false,
    ...options
  });
}

export function useClientData(clientId?: string, options?: UseQueryOptions) {
  return useQuery({
    queryKey: ['/api/clients', clientId],
    staleTime: 10 * 60 * 1000, // 10 minutes cache for client data (less frequently changed)
    gcTime: 15 * 60 * 1000,
    enabled: !!clientId,
    refetchOnWindowFocus: false,
    ...options
  });
}

export function useCandidateData(candidateId?: string, options?: UseQueryOptions) {
  return useQuery({
    queryKey: ['/api/candidates', candidateId],
    staleTime: 5 * 60 * 1000, // 5 minutes cache for candidate data
    gcTime: 10 * 60 * 1000,
    enabled: !!candidateId,
    refetchOnWindowFocus: false,
    ...options
  });
}