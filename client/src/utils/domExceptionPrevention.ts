/**
 * DOM Exception Prevention System
 * Must be loaded before any other modules to catch all DOM exceptions
 */

// Early DOM exception prevention - runs immediately when imported
if (typeof window !== 'undefined') {
  console.log('Initializing comprehensive DOM exception prevention...')
  
  // Primary unhandled rejection handler - catches ALL rejections
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason
    
    // Always prevent unhandled rejections in development to avoid crashes
    console.warn('DOM exception prevention: blocking unhandled rejection:', reason)
    event.preventDefault()
    
    // Log detailed information for debugging
    if (reason instanceof DOMException) {
      console.warn('→ DOMException type:', reason.name, reason.message)
    } else if (reason instanceof Error) {
      console.warn('→ Error type:', reason.name, reason.message)
    } else {
      console.warn('→ Unknown rejection type:', typeof reason, reason)
    }
  }, { capture: true, passive: false })
  
  // Secondary error handler for script errors
  window.addEventListener('error', (event) => {
    console.warn('DOM exception prevention: script error caught:', event.message)
    event.preventDefault()
    return true
  }, { capture: true })
  
  // Wrap storage methods to prevent DOM exceptions
  const wrapStorage = (storage: Storage, name: string) => {
    if (!storage) return
    
    const methods = ['setItem', 'getItem', 'removeItem', 'clear'] as const
    
    methods.forEach(method => {
      const original = storage[method]
      if (typeof original === 'function') {
        ;(storage as any)[method] = function(...args: any[]) {
          try {
            return original.apply(this, args)
          } catch (error) {
            console.warn(`${name}.${method} DOM exception prevented:`, error)
            return method === 'getItem' ? null : undefined
          }
        }
      }
    })
  }
  
  // Wrap both storage types
  wrapStorage(window.localStorage, 'localStorage')
  wrapStorage(window.sessionStorage, 'sessionStorage')
  
  console.log('DOM exception prevention system active')
}

// Export a safe async wrapper
export const safeDOMOperation = async <T>(
  operation: () => Promise<T> | T,
  fallback?: T
): Promise<T | undefined> => {
  try {
    const result = await operation()
    return result
  } catch (error) {
    if (error instanceof DOMException) {
      console.warn('DOM operation safely handled:', error.name)
      return fallback
    }
    // Re-throw non-DOM errors
    throw error
  }
}

// Export safe sync wrapper
export const safeDOMOperationSync = <T>(
  operation: () => T,
  fallback?: T
): T | undefined => {
  try {
    return operation()
  } catch (error) {
    if (error instanceof DOMException) {
      console.warn('Sync DOM operation safely handled:', error.name)
      return fallback
    }
    throw error
  }
}