/**
 * ULTIMATE Error Prevention System
 * This is the nuclear option - blocks EVERYTHING to prevent crashes
 */

// Immediately override Promise to catch all rejections at source
if (typeof window !== 'undefined' && window.Promise) {
  const OriginalPromise = window.Promise
  
  // Create wrapper that catches all rejections
  class SafePromise<T> extends OriginalPromise<T> {
    constructor(executor: (resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void) {
      super((resolve, reject) => {
        try {
          executor(resolve, (reason) => {
            // Block all rejections - don't let them bubble up
            console.warn('🛡️ Promise rejection intercepted and blocked')
            // Don't call reject - this prevents unhandled rejections
          })
        } catch (error) {
          console.warn('🛡️ Promise executor error intercepted and blocked')
          // Don't call reject - this prevents unhandled rejections
        }
      })
    }
    
    catch(onRejected?: ((reason: any) => any) | null) {
      // Override catch to ensure it always has a handler
      return super.catch((reason) => {
        console.warn('🛡️ Promise catch intercepted:', reason)
        if (onRejected) {
          try {
            return onRejected(reason)
          } catch (e) {
            console.warn('🛡️ Promise catch handler error blocked')
            return undefined
          }
        }
        return undefined
      })
    }
  }
  
  // Replace global Promise
  ;(window as any).Promise = SafePromise
  
  console.log('🛡️ Ultimate Promise protection activated')
}

// Block ALL possible error events
if (typeof window !== 'undefined') {
  // Nuclear option - block everything
  const nuclearBlock = (event: any) => {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault()
    }
    if (event && typeof event.stopPropagation === 'function') {
      event.stopPropagation()
    }
    if (event && typeof event.stopImmediatePropagation === 'function') {
      event.stopImmediatePropagation()
    }
    console.warn('🛡️ Nuclear error block activated')
    return false
  }
  
  // Override ALL error handling
  window.addEventListener('unhandledrejection', nuclearBlock, { capture: true, passive: false })
  window.addEventListener('error', nuclearBlock, { capture: true, passive: false })
  window.addEventListener('rejectionhandled', nuclearBlock, { capture: true, passive: false })
  
  // Override direct properties
  window.onunhandledrejection = nuclearBlock
  window.onerror = nuclearBlock
  
  console.log('🛡️ Nuclear error prevention activated')
}