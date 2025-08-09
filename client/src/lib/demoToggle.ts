// Demo toggle utilities for development and testing

export const enableDemo = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('tp_demo', 'true')
    console.log('Demo mode enabled via localStorage')
  }
}

export const disableDemo = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('tp_demo')
    console.log('Demo mode disabled')
  }
}

export const isDemoEnabled = (): boolean => {
  if (typeof window === 'undefined') return false
  
  // Check URL parameter first
  const urlParams = new URLSearchParams(window.location.search)
  if (urlParams.get('demo') === 'true') {
    // Persist to localStorage for future visits
    localStorage.setItem('tp_demo', 'true')
    return true
  }
  
  // Check localStorage
  return localStorage.getItem('tp_demo') === 'true'
}

// Demo toggle utilities - no JSX to avoid TypeScript issues
export const getDemoToggleState = () => {
  return {
    isDemoEnabled: isDemoEnabled(),
    toggle: () => {
      if (isDemoEnabled()) {
        disableDemo()
      } else {
        enableDemo()
      }
      window.location.reload()
    }
  }
}