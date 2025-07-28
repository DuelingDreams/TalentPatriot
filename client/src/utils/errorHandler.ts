// Minimal error handler - only handle critical DOM exceptions
console.log('TalentPatriot error handler loaded')

// Only handle critical storage-related DOM exceptions
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason
    
    // Only handle specific storage-related DOM exceptions
    if (reason instanceof DOMException && 
        (reason.name === 'QuotaExceededError' || 
         reason.name === 'SecurityError' || 
         reason.name === 'NotAllowedError')) {
      console.warn('Storage DOM exception handled:', reason.name)
      event.preventDefault()
      return
    }
    
    // Let all other errors through for normal handling
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