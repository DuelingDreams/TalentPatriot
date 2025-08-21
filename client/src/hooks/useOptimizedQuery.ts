import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useMemo, useRef } from 'react';

// Optimized query hook with memoization and selective updates
export function useOptimizedQuery<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options: Omit<UseQueryOptions<T, Error, T, string[]>, 'queryKey' | 'queryFn'> & {
    // Custom options for optimization
    memoizeBy?: (data: T) => any; // Memoize data by specific field
    updateOnlyWhen?: (prev: T | undefined, next: T) => boolean; // Only update when condition is true
  } = {}
) {
  const { memoizeBy, updateOnlyWhen, ...queryOptions } = options;
  const previousDataRef = useRef<T | undefined>();

  const query = useQuery({
    queryKey,
    queryFn,
    staleTime: 3 * 60 * 1000, // 3 minutes default
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    ...queryOptions,
  });

  // Store previous data in ref
  if (query.data && query.data !== previousDataRef.current) {
    previousDataRef.current = query.data;
  }

  // Memoize data to prevent unnecessary re-renders
  const memoizedData = useMemo(() => {
    if (!query.data) return query.data;
    
    if (memoizeBy && typeof memoizeBy === 'function') {
      return memoizeBy(query.data);
    }
    
    return query.data;
  }, [query.data, memoizeBy]);

  // Only update when condition is met (if provided)
  const shouldUpdate = useMemo(() => {
    if (!updateOnlyWhen || !query.data) return true;
    return updateOnlyWhen(previousDataRef.current, query.data);
  }, [query.data, updateOnlyWhen]);

  return {
    ...query,
    data: shouldUpdate ? memoizedData : previousDataRef.current || memoizedData,
  };
}