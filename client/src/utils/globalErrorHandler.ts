// Global error handler to catch unhandled promise rejections and DOM exceptions
export const setupGlobalErrorHandling = () => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.warn('Unhandled promise rejection:', event.reason)
    
    // Prevent the default handling which can cause crashes
    event.preventDefault()
    
    // Check if it's a DOM exception
    if (event.reason instanceof DOMException) {
      console.warn('DOM exception in unhandled promise:', event.reason.name, event.reason.message)
    }
    
    // Check if it's a network error
    if (event.reason instanceof TypeError && event.reason.message?.includes('fetch')) {
      console.warn('Network error in unhandled promise:', event.reason.message)
    }
    
    // Check if it's a Supabase auth error
    if (event.reason?.message?.includes('auth') || event.reason?.message?.includes('supabase')) {
      console.warn('Supabase error in unhandled promise:', event.reason.message)
    }
  })

  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    console.warn('Uncaught error:', event.error)
    
    // Check if it's a DOM exception
    if (event.error instanceof DOMException) {
      console.warn('DOM exception:', event.error.name, event.error.message)
      event.preventDefault()
    }
  })

  // Handle React error boundary fallback
  window.addEventListener('error', (event) => {
    if (event.message?.includes('React') || event.message?.includes('component')) {
      console.warn('React error caught:', event.message)
    }
  })
}

// Clean up global error handlers
export const cleanupGlobalErrorHandling = () => {
  // Remove event listeners when needed
  window.removeEventListener('unhandledrejection', () => {})
  window.removeEventListener('error', () => {})
}