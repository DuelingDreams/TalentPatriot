/**
 * Lightweight Error Handler for TalentPatriot ATS
 * Handles specific DOM exceptions and auth errors without interfering with development
 */

// Only run in browser environment
if (typeof window !== 'undefined') {
  // Targeted unhandled rejection handler - only handles specific production errors
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason
    
    // Handle Vite connection errors gracefully
    if (reason?.message && reason.message.includes('Failed to fetch dynamically imported module')) {
      console.warn('Module loading error handled - likely a hot reload issue')
      event.preventDefault()
      return
    }
    
    // Handle WebSocket connection errors from Vite
    if (reason?.message && (reason.message.includes('WebSocket') || reason.message.includes('vite'))) {
      console.warn('Vite WebSocket error handled')
      event.preventDefault()
      return
    }
    
    // Only handle specific DOM exceptions (not development errors)
    if (reason instanceof DOMException && 
        (reason.name === 'QuotaExceededError' || 
         reason.name === 'SecurityError' || 
         reason.name === 'NotAllowedError')) {
      console.warn('Storage/Security DOM exception handled:', reason.name)
      event.preventDefault()
      return
    }
    
    // Handle specific auth/network errors in production only
    if (reason?.message && 
        (reason.message.includes('Invalid session') ||
         reason.message.includes('User not found') ||
         reason.message.includes('Invalid JWT') ||
         reason.message.includes('Failed to fetch') ||
         reason.message.includes('NetworkError') ||
         reason.message.includes('AbortError'))) {
      console.warn('Auth/Network error handled:', reason.message)
      event.preventDefault()
      return
    }
    
    // Handle generic DOMException without specific name
    if (reason instanceof DOMException) {
      console.warn('DOMException handled:', reason.name, reason.message)
      event.preventDefault()
      return
    }
    
    // Let all other errors (including Vite/development errors) pass through normally
    // This prevents interference with development tools
  })
}

// Safe storage operations for production use
export const safeStorageOperation = (operation: () => void) => {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      operation()
    }
  } catch (error) {
    if (error instanceof DOMException) {
      console.warn('Storage operation failed safely:', error.name)
    }
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