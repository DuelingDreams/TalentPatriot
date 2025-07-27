/**
 * Global error handling utilities to prevent DOM exceptions and unhandled promise rejections
 */

// Only add handlers in browser environment
if (typeof window !== 'undefined') {
  // Global error handler for unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.warn('Unhandled promise rejection intercepted:', event.reason)
    
    // Handle specific types of errors gracefully
    if (event.reason instanceof DOMException) {
      console.warn('DOM exception caught and handled:', event.reason.name, event.reason.message)
      event.preventDefault() // Prevent the error from being logged to console
      return
    }
    
    if (event.reason instanceof TypeError && event.reason.message?.includes('fetch')) {
      console.warn('Network error caught and handled:', event.reason.message)
      event.preventDefault()
      return
    }
    
    // Handle Supabase auth errors
    if (event.reason?.message?.includes('supabase') || 
        event.reason?.message?.includes('auth') ||
        event.reason?.message?.includes('session')) {
      console.warn('Auth error caught and handled:', event.reason.message)
      event.preventDefault()
      return
    }
    
    // Handle generic connection errors
    if (event.reason?.message?.includes('Failed to fetch') ||
        event.reason?.message?.includes('NetworkError') ||
        event.reason?.message?.includes('Load failed')) {
      console.warn('Connection error caught and handled:', event.reason.message)
      event.preventDefault()
      return
    }
  })

  // Global error handler for regular errors
  window.addEventListener('error', (event) => {
    console.warn('Global error intercepted:', event.error)
    
    if (event.error instanceof DOMException) {
      console.warn('DOM exception in global handler:', event.error.name, event.error.message)
      event.preventDefault()
      return
    }
    
    // Handle script loading errors
    if (event.message?.includes('Script error') || event.filename?.includes('script')) {
      console.warn('Script loading error caught and handled')
      event.preventDefault()
      return
    }
  })
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