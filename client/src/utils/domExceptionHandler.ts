/**
 * Simplified DOM Exception Handler for TalentPatriot ATS
 * Prevents DOM exceptions without interfering with Vite development environment
 */

// Only run in browser environment
if (typeof window !== 'undefined') {
  // Simple, focused unhandled rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    // Only handle DOM exceptions and auth-related errors silently
    if (event.reason instanceof DOMException) {
      console.warn('DOM exception prevented:', {
        name: event.reason.name,
        message: event.reason.message,
        code: event.reason.code
      })
      event.preventDefault()
      return
    }
    
    // Handle Supabase authentication errors silently
    if (event.reason?.message?.includes('supabase') || 
        event.reason?.message?.includes('auth') ||
        event.reason?.message?.includes('session')) {
      console.warn('Auth error handled:', event.reason.message)
      event.preventDefault()
      return
    }
    
    // Handle storage quota errors
    if (event.reason?.name === 'QuotaExceededError' || 
        event.reason?.name === 'SecurityError') {
      console.warn('Storage error handled:', event.reason.name)
      event.preventDefault()
      return
    }
    
    // Let other errors pass through normally for Vite HMR
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

// Safe Supabase operation wrapper
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
    
    if (error instanceof Error && error.message?.includes('auth')) {
      console.warn(`Auth error in ${operationName}:`, error.message)
      return null
    }
    
    // Re-throw other errors
    throw error
  }
}