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

export const clearDemoModeForRealUsers = () => {
  if (typeof window !== 'undefined') {
    // Clear demo flag for real user signup flows
    const urlParams = new URLSearchParams(window.location.search)
    const isExplicitDemo = urlParams.get('demo') === 'true'
    
    if (!isExplicitDemo) {
      localStorage.removeItem('tp_demo')
      console.log('Demo mode cleared for real user signup')
    }
  }
}

export const isDemoEnabled = (): boolean => {
  if (typeof window === 'undefined') return false
  
  // Check URL parameter first - only enable if explicitly requested
  const urlParams = new URLSearchParams(window.location.search)
  if (urlParams.get('demo') === 'true') {
    // Only persist if it's explicitly requested via URL
    localStorage.setItem('tp_demo', 'true')
    return true
  }
  
  // Check localStorage - but allow easy override for real users
  const stored = localStorage.getItem('tp_demo')
  
  // If user is on signup/onboarding pages, disable demo mode unless explicitly set
  const isOnboardingFlow = window.location.pathname.includes('/signup') || 
                           window.location.pathname.includes('/onboarding')
  
  if (isOnboardingFlow && !urlParams.get('demo')) {
    // Clear demo flag during onboarding unless explicitly set
    localStorage.removeItem('tp_demo')
    return false
  }
  
  return stored === 'true'
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