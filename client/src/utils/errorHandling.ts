/**
 * Global error handling utilities to prevent DOM exceptions and unhandled promise rejections
 */

// Only add handlers in browser environment
if (typeof window !== 'undefined') {
  // Global error handler for unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.warn('Unhandled promise rejection intercepted:', event.reason)
    
    // Always prevent the error from reaching the console
    event.preventDefault()
    
    // Handle specific types of errors gracefully
    if (event.reason instanceof DOMException) {
      console.warn('DOM exception caught and handled:', event.reason.name, event.reason.message)
      return
    }
    
    if (event.reason instanceof TypeError && event.reason.message?.includes('fetch')) {
      console.warn('Network error caught and handled:', event.reason.message)
      return
    }
    
    // Handle Supabase auth errors
    if (event.reason?.message?.includes('supabase') || 
        event.reason?.message?.includes('auth') ||
        event.reason?.message?.includes('session') ||
        event.reason?.message?.includes('onAuthStateChange') ||
        event.reason?.message?.includes('No session found')) {
      console.warn('Auth error caught and handled:', event.reason.message)
      return
    }
    
    // Handle generic connection errors
    if (event.reason?.message?.includes('Failed to fetch') ||
        event.reason?.message?.includes('NetworkError') ||
        event.reason?.message?.includes('Load failed') ||
        event.reason?.message?.includes('net::ERR_') ||
        event.reason?.message?.includes('fetch') ||
        event.reason?.code === 'NETWORK_ERROR') {
      console.warn('Connection error caught and handled:', event.reason.message)
      return
    }
    
    // Handle storage errors
    if (event.reason?.name === 'QuotaExceededError' ||
        event.reason?.name === 'SecurityError' ||
        event.reason?.message?.includes('sessionStorage') ||
        event.reason?.message?.includes('localStorage')) {
      console.warn('Storage error caught and handled:', event.reason.message)
      return
    }
    
    // Handle Vite HMR errors in development
    if (event.reason?.message?.includes('hmr') ||
        event.reason?.message?.includes('hot reload') ||
        event.reason?.message?.includes('vite')) {
      console.warn('Development HMR error caught and handled:', event.reason.message)
      return
    }
    
    // Log other unhandled rejections but don't let them crash the app
    console.warn('Other unhandled rejection (handled):', event.reason)
  })

  // Global error handler for regular errors
  window.addEventListener('error', (event) => {
    console.warn('Global error intercepted:', event.error)
    
    // Always prevent the error from reaching the console aggressively
    event.preventDefault()
    event.stopPropagation()
    
    if (event.error instanceof DOMException) {
      console.warn('DOM exception in global handler:', event.error.name, event.error.message)
      return
    }
    
    // Handle script loading errors
    if (event.message?.includes('Script error') || 
        event.filename?.includes('script') ||
        event.message?.includes('Loading chunk')) {
      console.warn('Script loading error caught and handled')
      return
    }
    
    // Handle other errors
    console.warn('Other error caught and handled:', event.error)
  })
  
  // Also handle errors on the document
  document.addEventListener('error', (event) => {
    console.warn('Document error intercepted:', event)
    event.preventDefault()
    event.stopPropagation()
  }, true)
}

// Safe storage operations
export const safeStorageSetItem = (key: string, value: string) => {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(key, value)
    }
  } catch (e) {
    console.warn('Storage setItem error:', e)
  }
}

export const safeStorageGetItem = (key: string): string | null => {
  try {
    if (typeof sessionStorage !== 'undefined') {
      return sessionStorage.getItem(key)
    }
  } catch (e) {
    console.warn('Storage getItem error:', e)
  }
  return null
}

export const safeStorageRemoveItem = (key: string) => {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(key)
    }
  } catch (e) {
    console.warn('Storage removeItem error:', e)
  }
}

// Safe async operation wrapper to prevent DOM exceptions
export const safeAsync = async <T>(
  operation: () => Promise<T>, 
  fallback?: T
): Promise<T | undefined> => {
  try {
    return await operation()
  } catch (error) {
    console.warn('Safe async operation failed:', error)
    
    // Handle DOM exceptions
    if (error instanceof DOMException) {
      console.warn('DOM exception in async operation:', error.name, error.message)
    }
    
    // Handle network errors
    if (error instanceof TypeError && error.message?.includes('fetch')) {
      console.warn('Network error in async operation:', error.message)
    }
    
    return fallback
  }
}

// Safe Supabase operation wrapper with enhanced error handling
export const safeSupabaseOperation = async <T>(
  operation: () => Promise<T>,
  operationName: string = 'Supabase operation'
): Promise<T | null> => {
  try {
    const result = await operation()
    return result
  } catch (error) {
    console.warn(`${operationName} failed:`, error)
    
    // Handle specific error types
    if (error instanceof DOMException) {
      console.warn(`DOM exception in ${operationName}:`, error.name, error.message)
    }
    
    if (error instanceof TypeError && error.message?.includes('fetch')) {
      console.warn(`Network error in ${operationName}:`, error.message)
    }
    
    // Don't let any Supabase errors crash the app
    return null
  }
}