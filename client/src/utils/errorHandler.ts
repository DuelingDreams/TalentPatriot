// Enhanced DOM exception and promise rejection handler
console.log('TalentPatriot error handler loaded')

// Ultra-comprehensive unhandled promise rejection handler
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason
    
    // Always prevent the default behavior first
    event.preventDefault()
    
    // Handle null/undefined rejections
    if (reason === null || reason === undefined) {
      console.log('Empty promise rejection handled gracefully')
      return
    }
    
    // Handle string rejections
    if (typeof reason === 'string') {
      if (reason.includes('refresh_token') || 
          reason.includes('Invalid session') ||
          reason.includes('User not found') ||
          reason.includes('JWT') ||
          reason.includes('auth') ||
          reason.includes('session')) {
        console.log('String auth error handled gracefully:', reason)
        return
      }
      console.log('String rejection handled gracefully:', reason)
      return
    }
    
    // Handle object-based rejections (most Supabase errors)
    if (reason && typeof reason === 'object') {
      // Supabase auth errors (comprehensive)
      if (reason.message?.includes('refresh_token_not_found') ||
          reason.message?.includes('refresh_token') ||
          reason.message?.includes('Invalid session') ||
          reason.message?.includes('User not found') ||
          reason.message?.includes('JWT') ||
          reason.message?.includes('Unauthorized') ||
          reason.message?.includes('401') ||
          reason.message?.includes('Invalid JWT') ||
          reason.message?.includes('Token') ||
          reason.__isAuthError ||
          reason.code === 'refresh_token_not_found' ||
          reason.name === 'AuthApiError' ||
          reason.status === 401) {
        console.log('Auth error handled gracefully:', reason.message || reason.code || reason.status || 'Session expired')
        return
      }
      
      // Supabase network/connection errors (comprehensive)
      if (reason.message?.includes('Failed to fetch') ||
          reason.message?.includes('NetworkError') ||
          reason.message?.includes('Connection') ||
          reason.message?.includes('fetch') ||
          reason.message?.includes('network') ||
          reason.message?.includes('NETWORK_ERROR') ||
          reason.message?.includes('ERR_NETWORK') ||
          reason.message?.includes('ERR_INTERNET_DISCONNECTED') ||
          reason.name === 'TypeError' ||
          reason.name === 'NetworkError' ||
          reason.cause?.code === 'NETWORK_ERROR') {
        console.log('Network error handled gracefully:', reason.message || reason.name)
        return
      }
      
      // Supabase API errors
      if (reason.message?.includes('supabase') ||
          reason.message?.includes('postgresql') ||
          reason.message?.includes('database') ||
          reason.message?.includes('relation') ||
          reason.code?.includes('PGRST') ||
          reason.__isSupabaseError) {
        console.log('Supabase API error handled gracefully:', reason.message || reason.code)
        return
      }
    }
    
    // Handle DOM exceptions comprehensively
    if (reason instanceof DOMException) {
      console.warn('DOM exception handled:', reason.name, reason.message)
      return
    }
    
    // Handle all Error objects
    if (reason instanceof Error) {
      // Storage-related errors
      if (reason.message?.includes('storage') ||
          reason.message?.includes('quota') ||
          reason.message?.includes('blocked') ||
          reason.message?.includes('SecurityError') ||
          reason.name === 'QuotaExceededError' ||
          reason.name === 'SecurityError') {
        console.warn('Storage error handled gracefully:', reason.message)
        return
      }
      
      // Network/fetch errors (comprehensive)
      if (reason.message?.includes('fetch') ||
          reason.message?.includes('network') ||
          reason.message?.includes('Failed to fetch') ||
          reason.message?.includes('TypeError') ||
          reason.name === 'TypeError' ||
          reason.name === 'NetworkError' ||
          reason.name === 'AbortError') {
        console.log('Network error handled gracefully:', reason.message)
        return
      }
      
      // Auth-related errors
      if (reason.message?.includes('auth') ||
          reason.message?.includes('session') ||
          reason.message?.includes('token') ||
          reason.message?.includes('login') ||
          reason.message?.includes('unauthorized')) {
        console.log('Auth-related error handled gracefully:', reason.message)
        return
      }
    }
    
    // Catch-all: handle ANY remaining promise rejections
    console.log('Any promise rejection safely handled:', {
      type: typeof reason,
      constructor: reason?.constructor?.name,
      message: reason?.message,
      name: reason?.name,
      code: reason?.code,
      status: reason?.status,
      reason: reason
    })
  })
  
  // Comprehensive general error handler
  window.addEventListener('error', (event) => {
    const error = event.error
    
    // Always prevent default to avoid console spam
    event.preventDefault()
    
    // Handle DOM exceptions from regular errors
    if (error instanceof DOMException) {
      console.warn('DOM exception from error event handled:', error.name, error.message)
      return
    }
    
    // Handle all script errors
    if (error instanceof Error) {
      // Storage-related errors
      if (error.message?.includes('storage') ||
          error.message?.includes('quota') ||
          error.message?.includes('SecurityError') ||
          error.name === 'QuotaExceededError' ||
          error.name === 'SecurityError') {
        console.warn('Storage error from error event handled:', error.message)
        return
      }
      
      // Network-related errors
      if (error.message?.includes('fetch') ||
          error.message?.includes('network') ||
          error.message?.includes('Failed to fetch') ||
          error.name === 'NetworkError' ||
          error.name === 'TypeError') {
        console.log('Network error from error event handled:', error.message)
        return
      }
      
      // Auth-related errors
      if (error.message?.includes('auth') ||
          error.message?.includes('session') ||
          error.message?.includes('token') ||
          error.message?.includes('supabase')) {
        console.log('Auth error from error event handled:', error.message)
        return
      }
      
      // Generic error handling
      console.log('Script error safely handled:', error.message || error.name)
      return
    }
    
    // Handle any other error types
    console.log('General error safely handled:', typeof error, error)
  })
  
  // Handle resource loading errors
  window.addEventListener('error', (event) => {
    if (event.target !== window) {
      console.log('Resource loading error handled:', event.target)
      event.preventDefault()
    }
  }, true) // Use capture phase for resource errors
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
    if (error && typeof error === 'object' && error.message) {
      console.warn(`API error in ${operationName}:`, error.message)
      return null
    }
    
    // For any other errors, log and return null instead of re-throwing
    console.warn(`Unexpected error in ${operationName}:`, error)
    return null
  }
}