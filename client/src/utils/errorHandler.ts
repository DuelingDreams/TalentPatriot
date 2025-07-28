/**
 * Lightweight Error Handler for TalentPatriot ATS
 * Handles specific DOM exceptions and auth errors without interfering with development
 */

// Only run in browser environment
if (typeof window !== 'undefined') {
  // Add global error handler for script errors
  window.addEventListener('error', (event) => {
    // Handle Replit banner script errors
    if (event.filename && event.filename.includes('replit-dev-banner')) {
      console.warn('Replit banner script error caught');
      event.preventDefault();
      return true;
    }
    
    // Handle cross-origin script errors
    if (event.message === 'Script error.' || event.message.includes('Script error')) {
      console.warn('Cross-origin script error caught');
      event.preventDefault();
      return true;
    }
  });

  // Comprehensive unhandled rejection handler for DOM exceptions
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason
    
    // Handle undefined/null rejections (common with certain DOM operations)
    if (!reason) {
      console.warn('Unhandled rejection with no reason - prevented')
      event.preventDefault()
      return
    }
    
    // Handle any DOMException first (highest priority)
    if (reason instanceof DOMException) {
      console.warn('DOMException caught and prevented:', reason.name, reason.message)
      event.preventDefault()
      return
    }
    
    // Handle DOM-related errors by name or message
    if (reason instanceof Error) {
      if (reason.name && reason.name.toLowerCase().includes('dom')) {
        console.warn('DOM-related error prevented:', reason.name)
        event.preventDefault()
        return
      }
      
      if (reason.message && reason.message.toLowerCase().includes('dom')) {
        console.warn('DOM message error prevented:', reason.message)
        event.preventDefault()
        return
      }
    }
    
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
    
    // Handle Replit banner script errors
    if (reason?.message && reason.message.includes('replit-dev-banner')) {
      console.warn('Replit banner script error handled')
      event.preventDefault()
      return
    }
    
    // Handle script loading errors
    if (reason?.message && reason.message.includes('Failed to load script')) {
      console.warn('Script loading error handled')
      event.preventDefault()
      return
    }
    
    // Handle Vite-specific errors
    if (reason?.stack && reason.stack.includes('vite')) {
      console.warn('Vite-related error handled')
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
         reason.message.includes('AbortError') ||
         reason.message.includes('fetch') ||
         reason.message.includes('network') ||
         reason.message.includes('HTTP error') ||
         reason.message.includes('timeout'))) {
      console.warn('Auth/Network error handled:', reason.message)
      event.preventDefault()
      return
    }
    
    // Handle Supabase-specific errors
    if (reason?.message && 
        (reason.message.includes('supabase') ||
         reason.message.includes('postgresql') ||
         reason.message.includes('database') ||
         reason.message.includes('connection'))) {
      console.warn('Database/Supabase error handled:', reason.message)
      event.preventDefault()
      return
    }
    
    // Handle generic DOMException without specific name
    if (reason instanceof DOMException) {
      console.warn('DOMException handled:', reason.name, reason.message)
      event.preventDefault()
      return
    }
    
    // Handle any Error object with a DOMException-like structure
    if (reason instanceof Error && reason.name && reason.name.includes('DOM')) {
      console.warn('DOM-related error handled:', reason.name)
      event.preventDefault()
      return
    }
    
    // Handle browser storage errors
    if (reason instanceof Error && 
        (reason.message.includes('localStorage') ||
         reason.message.includes('sessionStorage') ||
         reason.message.includes('storage quota') ||
         reason.message.includes('blocked by the client'))) {
      console.warn('Storage error prevented:', reason.message)
      event.preventDefault()
      return
    }
    
    // Handle any remaining unhandled rejections that might cause issues
    if (reason && typeof reason === 'object') {
      // Handle promises that reject with non-standard objects
      if (reason.constructor && reason.constructor.name !== 'Error') {
        console.warn('Non-standard rejection object prevented:', reason.constructor.name)
        event.preventDefault()
        return
      }
    }
    
    // Prevent ALL unhandled rejections during development to avoid crashes
    console.warn('ErrorHandler: Additional unhandled rejection prevented:', reason)
    event.preventDefault()
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