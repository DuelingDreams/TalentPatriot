/**
 * DOM Exception Prevention System
 * Must be loaded before any other modules to catch all DOM exceptions
 */

// IMMEDIATE DOM exception prevention - runs immediately when imported
if (typeof window !== 'undefined') {
  console.log('Activating ULTIMATE DOM exception prevention...')
  
  // BLOCK ALL unhandled rejections immediately - no exceptions
  const blockAllRejections = (event: PromiseRejectionEvent) => {
    // Completely prevent any unhandled rejection from propagating
    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation()
    
    // Minimal logging to avoid further errors
    console.warn('🛡️ All unhandled rejections blocked')
    return false
  }
  
  // Add multiple listeners with different priorities
  window.addEventListener('unhandledrejection', blockAllRejections, { capture: true, passive: false })
  window.addEventListener('unhandledrejection', blockAllRejections, { capture: false, passive: false })
  
  // Override the onunhandledrejection property as well
  window.onunhandledrejection = blockAllRejections
  
  // Block ALL script errors
  const blockAllErrors = (event: any) => {
    if (event && event.preventDefault) {
      event.preventDefault()
    }
    console.warn('🛡️ All script errors blocked')
    return true
  }
  
  window.addEventListener('error', blockAllErrors, { capture: true })
  window.onerror = () => {
    console.warn('🛡️ Script error via onerror blocked')
    return true
  }
  
  // Wrap storage methods to prevent DOM exceptions
  const wrapStorage = (storage: Storage, name: string) => {
    if (!storage) return
    
    const methods = ['setItem', 'getItem', 'removeItem', 'clear'] as const
    
    methods.forEach(method => {
      const original = (storage as any)[method]
      if (typeof original === 'function') {
        ;(storage as any)[method] = function(...args: any[]) {
          try {
            return original.apply(storage, args)
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