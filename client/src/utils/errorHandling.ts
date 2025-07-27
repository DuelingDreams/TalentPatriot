/**
 * Global error handling utilities to prevent DOM exceptions and unhandled promise rejections
 */

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.warn('Unhandled promise rejection:', event.reason)
  
  // Handle specific types of errors gracefully
  if (event.reason instanceof DOMException) {
    console.warn('DOM exception caught:', event.reason.name, event.reason.message)
    event.preventDefault() // Prevent the error from being logged to console
  }
  
  if (event.reason instanceof TypeError && event.reason.message.includes('fetch')) {
    console.warn('Network error caught:', event.reason.message)
    event.preventDefault()
  }
  
  // Handle Supabase auth errors
  if (event.reason?.message?.includes('supabase') || event.reason?.message?.includes('auth')) {
    console.warn('Auth error caught:', event.reason.message)
    event.preventDefault()
  }
})

// Global error handler for regular errors
window.addEventListener('error', (event) => {
  console.warn('Global error caught:', event.error)
  
  if (event.error instanceof DOMException) {
    console.warn('DOM exception in global handler:', event.error.name, event.error.message)
    event.preventDefault()
  }
})

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