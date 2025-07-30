// Simplified error handler focused on critical issues only
console.log('TalentPatriot error handler loaded')

// Targeted promise rejection handler
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason
    
    // Handle runtime error plugin failures
    if (reason && typeof reason === 'object' && reason.message) {
      if (reason.message.includes('Failed to fetch dynamically imported module') &&
          reason.message.includes('runtime-error-plugin')) {
        console.log('Suppressed runtime error plugin import error')
        event.preventDefault()
        return
      }
    }
    
    // Handle critical auth errors silently
    if (reason && typeof reason === 'object') {
      if (reason.message?.includes('refresh_token_not_found') ||
          reason.code === 'refresh_token_not_found' ||
          reason.name === 'AuthApiError') {
        console.log('Auth session expired (handled gracefully)')
        event.preventDefault()
        return
      }
    }
    
    // Handle string auth errors
    if (typeof reason === 'string' && 
        (reason.includes('refresh_token') || reason.includes('Invalid session'))) {
      console.log('Auth error handled gracefully:', reason)
      event.preventDefault()
      return
    }
    
    // Only log other errors for debugging, don't prevent default
    if (reason && typeof reason === 'object' && 'message' in reason) {
      console.log('Unhandled promise rejection:', (reason as any).message)
    } else if (typeof reason === 'string') {
      console.log('Unhandled promise rejection:', reason)
    } else {
      console.log('Unhandled promise rejection:', reason)
    }
  })
  
  // Minimal error handler for critical DOM exceptions only
  window.addEventListener('error', (event) => {
    const error = event.error
    
    // Handle runtime error plugin failures
    if (error && error.message) {
      if (error.message.includes('Failed to fetch dynamically imported module') &&
          error.message.includes('runtime-error-plugin')) {
        console.log('Suppressed runtime error plugin import error')
        event.preventDefault()
        return
      }
    }
    
    // Only handle critical storage errors that could break the app
    if (error instanceof DOMException && 
        (error.name === 'QuotaExceededError' || error.name === 'SecurityError')) {
      console.warn('Critical DOM exception handled:', error.name, error.message)
      event.preventDefault()
      return
    }
  })
}

// Safe storage operations with comprehensive DOM exception handling
export const safeStorageOperation = (operation: () => void) => {
  try {
    // Check browser environment first
    if (typeof window === 'undefined') return
    
    // Test storage availability
    if (!window.sessionStorage || !window.localStorage) return
    
    // Execute operation with additional safety checks
    operation()
  } catch (error) {
    // Handle all types of DOM exceptions
    if (error instanceof DOMException) {
      console.warn('Storage DOMException safely handled:', error.name, error.message)
      return
    }
    
    // Handle storage-related errors
    if (error instanceof Error) {
      if (error.message.includes('storage') || 
          error.message.includes('quota') ||
          error.message.includes('blocked')) {
        console.warn('Storage error safely handled:', error.message)
        return
      }
    }
    
    // Log unexpected storage errors
    console.warn('Unexpected storage error safely handled:', error)
  }
}

// Enhanced safe operation wrapper for all async operations
export const safeAuthOperation = async <T>(
  operation: () => Promise<T>,
  operationName: string = 'auth_operation'
): Promise<T | null> => {
  try {
    return await operation()
  } catch (error) {
    // Handle all possible auth-related errors
    if (error instanceof Error) {
      if (error.message?.includes('Invalid session') ||
          error.message?.includes('User not found') ||
          error.message?.includes('Invalid JWT') ||
          error.message?.includes('refresh_token') ||
          error.message?.includes('Unauthorized') ||
          error.message?.includes('401') ||
          error.message?.includes('auth') ||
          error.message?.includes('session') ||
          error.message?.includes('token')) {
        console.warn(`Auth error in ${operationName}:`, error.message)
        return null
      }
      
      // Handle network errors gracefully
      if (error.message?.includes('Failed to fetch') ||
          error.message?.includes('NetworkError') ||
          error.message?.includes('fetch') ||
          error.name === 'TypeError' ||
          error.name === 'NetworkError') {
        console.warn(`Network error in ${operationName}:`, error.message)
        return null
      }
      
      // Handle DOM exceptions
      if (error instanceof DOMException) {
        console.warn(`DOM exception in ${operationName}:`, error.name, error.message)
        return null
      }
    }
    
    // Handle object-based errors (Supabase API errors)
    if (error && typeof error === 'object' && 'message' in error) {
      console.warn(`API error in ${operationName}:`, (error as any).message)
      return null
    }
    
    // For any other errors, log and return null instead of re-throwing
    console.warn(`Unexpected error in ${operationName}:`, error)
    return null
  }
}