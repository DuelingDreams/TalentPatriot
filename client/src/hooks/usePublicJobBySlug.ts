import { useQuery } from '@tanstack/react-query';
import type { Job } from '@shared/schema';

export interface UsePublicJobBySlugOptions {
  enabled?: boolean;
  orgSlug?: string;
}

export interface PublicJobResult {
  data: Job | null;
  error: string | null;
}

/**
 * Hook for fetching a single public job by slug with caching
 * Used by both PublicJobDetail and CareersBySlug pages to ensure consistency
 */
export function usePublicJobBySlug(
  slug: string | undefined,
  options: UsePublicJobBySlugOptions = {}
) {
  const { enabled = true, orgSlug } = options;

  const {
    data,
    isLoading,
    error,
    refetch,
    isFetching
  } = useQuery<PublicJobResult>({
    queryKey: ['/api/public/jobs/slug', slug, orgSlug],
    queryFn: async () => {
      if (!slug) {
        return { data: null, error: 'Job slug is required' };
      }

      try {
        const url = orgSlug 
          ? `/api/public/jobs/slug/${slug}?orgSlug=${orgSlug}`
          : `/api/public/jobs/slug/${slug}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          if (response.status === 404) {
            return { data: null, error: 'Job not found' };
          }
          const errorData = await response.json().catch(() => ({}));
          return { 
            data: null, 
            error: errorData.error || `Failed to fetch job: ${response.status} ${response.statusText}` 
          };
        }
        
        const jobData = await response.json();
        return { data: jobData, error: null };
      } catch (networkError) {
        return { 
          data: null, 
          error: networkError instanceof Error ? networkError.message : 'Network error occurred' 
        };
      }
    },
    enabled: enabled && !!slug,
    staleTime: 60000, // 60 seconds
    gcTime: 120000, // 2 minutes (formerly cacheTime in v4)
    retry: (failureCount, error) => {
      // Don't retry on 404 errors (now handled in data)
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  const job = data?.data || null;
  const fetchError = error || data?.error;

  return {
    job,
    isLoading,
    isFetching,
    error: fetchError,
    refetch,
    // Computed state
    notFound: data?.error === 'Job not found',
    hasError: !!fetchError
  };
}