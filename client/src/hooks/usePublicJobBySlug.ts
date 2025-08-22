import { useQuery } from '@tanstack/react-query';
import type { Job } from '@shared/schema';

export interface UsePublicJobBySlugOptions {
  enabled?: boolean;
  orgSlug?: string;
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
    data: job,
    isLoading,
    error,
    refetch,
    isFetching
  } = useQuery<Job>({
    queryKey: ['/api/public/jobs/slug', slug, orgSlug],
    queryFn: async () => {
      if (!slug) {
        throw new Error('Job slug is required');
      }

      const url = orgSlug 
        ? `/api/public/jobs/slug/${slug}?orgSlug=${orgSlug}`
        : `/api/public/jobs/slug/${slug}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Job not found');
        }
        throw new Error(`Failed to fetch job: ${response.status} ${response.statusText}`);
      }
      
      return response.json();
    },
    enabled: enabled && !!slug,
    staleTime: 60000, // 60 seconds
    gcTime: 120000, // 2 minutes (formerly cacheTime in v4)
    retry: (failureCount, error) => {
      // Don't retry on 404 errors
      if (error.message === 'Job not found') {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  return {
    job,
    isLoading,
    isFetching,
    error,
    refetch,
    // Computed state
    notFound: error?.message === 'Job not found',
    hasError: !!error
  };
}