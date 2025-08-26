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

export interface PublicJobsResult {
  data: Job[] | null;
  error: string | null;
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
  } = useQuery<PublicJobsResult>({
    queryKey: ['/api/public/jobs', { q, filters, page, pageSize, sort, orgSlug }],
    queryFn: async () => {
      try {
        const response = await fetch(endpoint);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          return { 
            data: null, 
            error: errorData.error || `Failed to fetch jobs: ${response.status} ${response.statusText}` 
          };
        }
        const jobsData = await response.json();
        // API returns jobs array directly, not wrapped in an object
        return { data: Array.isArray(jobsData) ? jobsData : [], error: null };
      } catch (networkError) {
        return { 
          data: null, 
          error: networkError instanceof Error ? networkError.message : 'Network error occurred' 
        };
      }
    },
    enabled,
    staleTime: 60000, // 60 seconds
    gcTime: 120000, // 2 minutes (formerly cacheTime in v4)
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  // Transform data to consistent format
  const jobs = data?.data || [];
  const total = jobs.length;
  const fetchError = error || data?.error;

  return {
    jobs,
    total,
    isLoading,
    isFetching,
    error: fetchError,
    refetch,
    // Computed state
    isEmpty: !isLoading && jobs.length === 0,
    hasError: !!fetchError
  };
}