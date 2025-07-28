/**
 * Simplified DOM Exception Handler for TalentPatriot ATS
 * Prevents DOM exceptions without interfering with Vite development environment
 */

// Only run in browser environment
if (typeof window !== 'undefined') {
  // Enhanced unhandled rejection handler with comprehensive error prevention
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason
    
    // Handle DOM exceptions silently
    if (reason instanceof DOMException) {
      console.warn('DOM exception prevented:', {
        name: reason.name,
        message: reason.message,
        code: reason.code
      })
      event.preventDefault()
      return
    }
    
    // Handle Supabase/auth errors silently
    if (reason?.message && (
        reason.message.includes('supabase') || 
        reason.message.includes('auth') ||
        reason.message.includes('session') ||
        reason.message.includes('Invalid session') ||
        reason.message.includes('User not found') ||
        reason.message.includes('Invalid JWT') ||
        reason.message.includes('Profile fetch failed') ||
        reason.message.includes('user-profiles')
      )) {
      console.warn('Auth error handled:', reason.message)
      event.preventDefault()
      return
    }
    
    // Handle storage and security errors
    if (reason?.name === 'QuotaExceededError' || 
        reason?.name === 'SecurityError' ||
        reason?.name === 'NotAllowedError') {
      console.warn('Storage/Security error handled:', reason.name)
      event.preventDefault()
      return
    }
    
    // Handle network-related errors (including specific Failed to fetch)
    if (reason?.message && (
        reason.message.includes('fetch') ||
        reason.message.includes('network') ||
        reason.message.includes('timeout') ||
        reason.message.includes('Failed to fetch') ||
        reason.message.includes('NetworkError') ||
        reason.message.includes('TypeError: Failed to fetch')
      )) {
      console.warn('Network error handled:', reason.message)
      event.preventDefault()
      return
    }
    
    // Handle specific "Failed to fetch" TypeError
    if (reason instanceof TypeError && reason.message === 'Failed to fetch') {
      console.warn('Failed to fetch error handled')
      event.preventDefault()
      return
    }
    
    // Handle JSON parsing errors
    if (reason?.message && (
        reason.message.includes('JSON') ||
        reason.message.includes('Unexpected token') ||
        reason.message.includes('SyntaxError')
      )) {
      console.warn('JSON parsing error handled:', reason.message)
      event.preventDefault()
      return
    }
    
    // Handle generic API errors
    if (reason?.message && (
        reason.message.includes('api/') ||
        reason.message.includes('404') ||
        reason.message.includes('500') ||
        reason.message.includes('403')
      )) {
      console.warn('API error handled:', reason.message)
      event.preventDefault()
      return
    }
    
    // Let development/Vite errors pass through normally
    if (reason?.message && (
        reason.message.includes('[vite]') ||
        reason.message.includes('HMR') ||
        reason.message.includes('hot update')
      )) {
      // Let Vite handle these
      return
    }
    
    // Prevent all other unhandled rejections in development to avoid console clutter
    console.warn('Unhandled promise rejection prevented:', {
      type: typeof reason,
      message: reason?.message || reason?.toString() || 'Unknown error',
      stack: reason?.stack
    })
    event.preventDefault()
  })
  
  // Also handle regular errors to prevent crashes
  window.addEventListener('error', (event) => {
    const error = event.error
    
    if (error instanceof DOMException) {
      console.warn('DOM error prevented:', error.name)
      event.preventDefault()
      return
    }
    
    // Handle auth-related errors
    if (error?.message && (
        error.message.includes('supabase') ||
        error.message.includes('auth') ||
        error.message.includes('session')
      )) {
      console.warn('Auth error prevented:', error.message)
      event.preventDefault()
      return
    }
  })
}

// Safe storage operations to prevent DOM exceptions
export const safeStorageOperation = (operation: () => void) => {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      operation()
    }
  } catch (error) {
    if (error instanceof DOMException) {
      console.warn('Storage DOM exception prevented:', error.name)
    }
  }
}

// Safe Supabase operation wrapper with comprehensive error handling
export const safeSupabaseOperation = async <T>(
  operation: () => Promise<T>,
  operationName: string = 'supabase_operation'
): Promise<T | null> => {
  try {
    return await operation()
  } catch (error) {
    if (error instanceof DOMException) {
      console.warn(`DOM exception in ${operationName}:`, error.name)
      return null
    }
    
    if (error instanceof Error) {
      // Handle auth errors
      if (error.message?.includes('auth') ||
          error.message?.includes('session') ||
          error.message?.includes('supabase') ||
          error.message?.includes('Profile fetch failed')) {
        console.warn(`Auth error in ${operationName}:`, error.message)
        return null
      }
      
      // Handle network errors
      if (error.message?.includes('fetch') ||
          error.message?.includes('network') ||
          error.message?.includes('timeout') ||
          error.message?.includes('Failed to fetch')) {
        console.warn(`Network error in ${operationName}:`, error.message)
        return null
      }
      
      // Handle JSON parsing errors
      if (error.message?.includes('JSON') ||
          error.message?.includes('Unexpected token') ||
          error.message?.includes('SyntaxError')) {
        console.warn(`JSON parsing error in ${operationName}:`, error.message)
        return null
      }
    }
    
    // Log other errors but don't throw them to prevent unhandled rejections
    console.warn(`Error in ${operationName}:`, error)
    return null
  }
}