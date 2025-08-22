import { useQuery } from '@tanstack/react-query';
import type { Job } from '@shared/schema';

export interface PublicJobsParams {
  q?: string;
  filters?: {
    location?: string;
    jobType?: string;
    [key: string]: any;
  };
  page?: number;
  pageSize?: number;
  sort?: string;
}

export interface UsePublicJobsOptions extends PublicJobsParams {
  enabled?: boolean;
  orgSlug?: string;
}

export interface PublicJobsResponse {
  jobs: Job[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Hook for fetching public jobs with caching and filtering support
 * Provides consistent data shape across all public job components
 */
export function usePublicJobs(options: UsePublicJobsOptions = {}) {
  const {
    q,
    filters = {},
    page = 1,
    pageSize = 50,
    sort = 'created_desc',
    enabled = true,
    orgSlug
  } = options;

  const queryParams = new URLSearchParams();
  
  if (q) queryParams.append('q', q);
  if (filters.location) queryParams.append('location', filters.location);
  if (filters.jobType) queryParams.append('jobType', filters.jobType);
  if (page > 1) queryParams.append('page', page.toString());
  if (pageSize !== 50) queryParams.append('pageSize', pageSize.toString());
  if (sort !== 'created_desc') queryParams.append('sort', sort);
  if (orgSlug) queryParams.append('orgSlug', orgSlug);

  const queryString = queryParams.toString();
  const endpoint = `/api/public/jobs${queryString ? `?${queryString}` : ''}`;

  const {
    data,
    isLoading,
    error,
    refetch,
    isFetching
  } = useQuery<Job[]>({
    queryKey: ['/api/public/jobs', { q, filters, page, pageSize, sort, orgSlug }],
    queryFn: async () => {
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`Failed to fetch jobs: ${response.status} ${response.statusText}`);
      }
      return response.json();
    },
    enabled,
    staleTime: 60000, // 60 seconds
    gcTime: 120000, // 2 minutes (formerly cacheTime in v4)
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  // Transform data to consistent format
  const jobs = data || [];
  const total = jobs.length;

  return {
    jobs,
    total,
    isLoading,
    isFetching,
    error,
    refetch,
    // Computed state
    isEmpty: !isLoading && jobs.length === 0,
    hasError: !!error
  };
}