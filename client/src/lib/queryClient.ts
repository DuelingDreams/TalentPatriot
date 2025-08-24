import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  urlOrOptions: string | { method: string; url: string; body?: string },
  options?: { method?: string; body?: string }
): Promise<any> {
  let url: string;
  let method: string = 'GET';
  let body: string | undefined;

  // Handle both parameter styles
  if (typeof urlOrOptions === 'string') {
    url = urlOrOptions;
    if (options) {
      method = options.method || 'GET';
      body = options.body;
    }
  } else {
    url = urlOrOptions.url;
    method = urlOrOptions.method;
    body = urlOrOptions.body;
  }

  // Get organization ID from session storage
  const currentOrgId = getCurrentOrgId();
  
  // Get development user ID
  const getCurrentUserId = (): string | null => {
    if (typeof window !== 'undefined') {
      try {
        const devUserStr = sessionStorage.getItem('dev_user');
        if (devUserStr) {
          const devUser = JSON.parse(devUserStr);
          return devUser.id;
        }
      } catch (error) {
        console.warn('Failed to get user ID:', error);
      }
    }
    // Fallback to development user ID
    return 'b67bf044-fa88-4579-9c06-03f3026bab95';
  };
  
  const currentUserId = getCurrentUserId();
  
  try {
    const headers: Record<string, string> = {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(currentOrgId ? { "x-org-id": currentOrgId } : {}),
      ...(currentUserId ? { "x-user-id": currentUserId } : {})
    };

    // For POST/PUT/DELETE operations with JSON body, include orgId in the body
    let finalBody = body;
    if (body && currentOrgId && method !== 'GET') {
      try {
        const bodyData = JSON.parse(body);
        bodyData.orgId = currentOrgId;
        finalBody = JSON.stringify(bodyData);
      } catch (e) {
        // If body is not JSON, fall back to the original approach
        console.warn('Could not parse request body as JSON:', e);
      }
    }

    const res = await fetch(url, {
      method,
      headers,
      body: finalBody,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return await res.json();
  } catch (error) {
    // Handle network errors, CORS issues, and DOM exceptions
    if (error instanceof DOMException) {
      console.warn('Network DOM exception caught:', error.name, error.message);
      throw new Error(`Network error: ${error.message}`);
    }
    throw error;
  }
}

// Helper function to get current org ID
function getCurrentOrgId(): string | null {
  // Try to get from the auth context if available
  if (typeof window !== 'undefined') {
    try {
      // First try sessionStorage with safe access
      if (window.sessionStorage) {
        const orgId = sessionStorage.getItem('currentOrgId');
        if (orgId && orgId !== 'null' && orgId !== 'undefined') {
          return orgId;
        }
      }
      
      // Always use demo org ID in development as fallback
      const isDevelopment = window.location.hostname.includes('localhost') || 
                          window.location.hostname.includes('replit') ||
                          import.meta.env.MODE === 'development';
      
      if (isDevelopment) {
        console.log('[queryClient] Using demo organization for development');
        // Set it in sessionStorage for next time
        if (window.sessionStorage) {
          sessionStorage.setItem('currentOrgId', '90531171-d56b-4732-baba-35be47b0cb08');
        }
        return '90531171-d56b-4732-baba-35be47b0cb08';
      }
      
      // Fallback to extracting from DOM or global state
      const authDataElement = document.querySelector('[data-org-id]');
      if (authDataElement) {
        return authDataElement.getAttribute('data-org-id');
      }
    } catch (error) {
      // Handle DOM exceptions silently
      if (error instanceof DOMException) {
        console.warn('DOM exception accessing storage:', error.name);
      } else {
        console.warn('Failed to get org ID from storage:', error);
      }
    }
  }
  return null;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const currentOrgId = getCurrentOrgId();
      let url = queryKey.join("/") as string;
      
      // Get development user ID for API calls
      const getCurrentUserId = (): string | null => {
        if (typeof window !== 'undefined') {
          try {
            const devUserStr = sessionStorage.getItem('dev_user');
            if (devUserStr) {
              const devUser = JSON.parse(devUserStr);
              return devUser.id;
            }
          } catch (error) {
            console.warn('Failed to get user ID:', error);
          }
        }
        // Fallback to development user ID
        return 'b67bf044-fa88-4579-9c06-03f3026bab95';
      };
      
      const currentUserId = getCurrentUserId();
      
      // Add organization ID as query parameter for data fetching operations
      if (currentOrgId && (url.includes('/api/jobs') || url.includes('/api/candidates') || url.includes('/api/clients'))) {
        const separator = url.includes('?') ? '&' : '?';
        url += `${separator}orgId=${currentOrgId}`;
      }

      const headers: Record<string, string> = {
        ...(currentOrgId ? { "x-org-id": currentOrgId } : {}),
        ...(currentUserId ? { "x-user-id": currentUserId } : {})
      };

      const res = await fetch(url, {
        headers,
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      // Handle network errors and DOM exceptions in query functions
      if (error instanceof DOMException) {
        console.warn('Query network DOM exception caught:', error.name, error.message);
        throw new Error(`Network error: ${error.message}`);
      }
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      // Aggressive caching for performance - data is fresh for 2 minutes
      staleTime: 2 * 60 * 1000, // 2 minutes  
      // Keep data in cache for 15 minutes
      gcTime: 15 * 60 * 1000, // 15 minutes (renamed from cacheTime in v5)
      // Retry once on failure with exponential backoff
      retry: (failureCount, error: any) => {
        // Don't retry on authentication or authorization errors
        if (error?.message?.includes('401') || error?.message?.includes('403') || 
            error?.message?.includes('Unauthorized') || error?.message?.includes('Forbidden')) {
          return false;
        }
        // Only retry once for other errors
        return failureCount < 1;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000), // Shorter retry delays
    },
    mutations: {
      retry: 1,
      onError: (error) => {
        console.error('Mutation error:', error);
      },
    },
  },
});
