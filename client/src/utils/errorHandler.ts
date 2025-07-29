// Minimal error handler - only handle critical DOM exceptions
console.log('TalentPatriot error handler loaded')

// Comprehensive unhandled promise rejection handler
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason
    
    // Handle all Supabase-related errors
    if (reason && typeof reason === 'object') {
      // Supabase auth errors
      if (reason.message?.includes('refresh_token_not_found') ||
          reason.message?.includes('Invalid session') ||
          reason.message?.includes('User not found') ||
          reason.message?.includes('JWT') ||
          reason.__isAuthError ||
          reason.code === 'refresh_token_not_found') {
        console.log('Auth error handled gracefully:', reason.message || reason.code || 'Session expired')
        event.preventDefault()
        return
      }
      
      // Supabase network/connection errors
      if (reason.message?.includes('Failed to fetch') ||
          reason.message?.includes('NetworkError') ||
          reason.message?.includes('Connection') ||
          reason.name === 'TypeError' && reason.message?.includes('fetch')) {
        console.log('Network error handled gracefully:', reason.message)
        event.preventDefault()
        return
      }
    }
    
    // Handle DOM exceptions comprehensively
    if (reason instanceof DOMException) {
      console.warn('DOM exception handled:', reason.name, reason.message)
      event.preventDefault()
      return
    }
    
    // Handle generic Error objects
    if (reason instanceof Error) {
      // Storage-related errors
      if (reason.message?.includes('storage') ||
          reason.message?.includes('quota') ||
          reason.message?.includes('blocked') ||
          reason.message?.includes('SecurityError')) {
        console.warn('Storage error handled gracefully:', reason.message)
        event.preventDefault()
        return
      }
      
      // Network/fetch errors
      if (reason.message?.includes('fetch') ||
          reason.message?.includes('network') ||
          reason.message?.includes('Failed to fetch') ||
          reason.message?.includes('TypeError')) {
        console.log('Network error handled gracefully:', reason.message)
        event.preventDefault()
        return
      }
    }
    
    // Handle any remaining promise rejections
    if (reason !== undefined && reason !== null) {
      console.log('Unhandled promise rejection safely handled:', typeof reason, reason)
      event.preventDefault()
      return
    }
  })
  
  // Also handle general errors
  window.addEventListener('error', (event) => {
    const error = event.error
    
    // Handle DOM exceptions from regular errors too
    if (error instanceof DOMException) {
      console.warn('DOM exception from error event handled:', error.name, error.message)
      event.preventDefault()
      return
    }
    
    // Handle storage-related errors
    if (error instanceof Error && 
        (error.message?.includes('storage') ||
         error.message?.includes('quota') ||
         error.message?.includes('SecurityError'))) {
      console.warn('Storage error from error event handled:', error.message)
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

// Simplified safe operation wrapper for critical auth operations only
export const safeAuthOperation = async <T>(
  operation: () => Promise<T>,
  operationName: string = 'auth_operation'
): Promise<T | null> => {
  try {
    return await operation()
  } catch (error) {
    // Only handle specific auth-related errors
    if (error instanceof Error && 
        (error.message?.includes('Invalid session') ||
         error.message?.includes('User not found') ||
         error.message?.includes('Invalid JWT'))) {
      console.warn(`Auth error in ${operationName}:`, error.message)
      return null
    }
    
    // Re-throw all other errors to maintain normal error handling
    throw error
  }
}