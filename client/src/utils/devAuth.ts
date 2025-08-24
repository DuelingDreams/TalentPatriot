// Development authentication utilities
// This creates a mock user session for development testing

export const DEV_ORG_ID = '90531171-d56b-4732-baba-35be47b0cb08' // MentalCastle
export const DEV_USER = {
  id: 'b67bf044-fa88-4579-9c06-03f3026bab95', // Owner of MentalCastle org
  email: 'dev@talentpatriot.com',
  name: 'Development User'
}

export function isDevelopment(): boolean {
  if (typeof window === 'undefined') return false
  return window.location.hostname.includes('localhost') || 
         window.location.hostname.includes('replit') ||
         import.meta.env.MODE === 'development'
}

export function setDevelopmentAuth() {
  if (isDevelopment()) {
    console.log('[DevAuth] Setting development authentication context')
    
    // Set organization ID in session storage
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.setItem('currentOrgId', DEV_ORG_ID)
        sessionStorage.setItem('dev_user', JSON.stringify(DEV_USER))
        console.log('[DevAuth] Set orgId:', DEV_ORG_ID)
      }
    } catch (error) {
      console.warn('[DevAuth] Storage error:', error)
    }
    
    return true
  }
  return false
}

export function getDevelopmentAuth() {
  if (!isDevelopment()) return null
  
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const orgId = sessionStorage.getItem('currentOrgId')
      const userStr = sessionStorage.getItem('dev_user')
      const user = userStr ? JSON.parse(userStr) : DEV_USER
      
      return {
        user,
        orgId: orgId || DEV_ORG_ID,
        userRole: 'hiring_manager'
      }
    }
  } catch (error) {
    console.warn('[DevAuth] Error reading dev auth:', error)
  }
  
  // Always return development auth in development
  return {
    user: DEV_USER,
    orgId: DEV_ORG_ID,
    userRole: 'hiring_manager'
  }
}