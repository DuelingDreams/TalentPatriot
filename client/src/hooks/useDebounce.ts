import { useState, useEffect } from 'react';

// Custom hook for debouncing values to reduce API calls
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Hook for debouncing search queries specifically  
export function useSearchDebounce(searchTerm: string, delay: number = 300) {
  return useDebounce(searchTerm, delay);
}