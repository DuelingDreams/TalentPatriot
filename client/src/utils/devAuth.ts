// Development authentication utilities
// This creates a mock user session for development testing

export const DEV_ORG_ID = '90531171-d56b-4732-baba-35be47b0cb08' // MentalCastle (default)
export const HILDEBRAND_ORG_ID = 'd0156d8c-939b-488d-b256-e3924349f427' // Hildebrand Enterprises

// Multiple development users for testing different organizations
export const DEV_USERS = {
  mentalcastle: {
    id: 'b67bf044-fa88-4579-9c06-03f3026bab95',
    email: 'dev@mentalcastle.com',
    name: 'MentalCastle User',
    orgId: DEV_ORG_ID
  },
  hildebrand: {
    id: '81a2aecb-4355-4b83-9b05-27ac4c3020ff',
    email: 'mentalcastlecoach@gmail.com',
    name: 'Hildebrand User',
    orgId: HILDEBRAND_ORG_ID
  }
}

export const DEV_USER = DEV_USERS.mentalcastle // Default user

export function isDevelopment(): boolean {
  if (typeof window === 'undefined') return false
  return window.location.hostname.includes('localhost') || 
         window.location.hostname.includes('replit') ||
         import.meta.env.MODE === 'development'
}

export function setDevelopmentAuth(userType: 'mentalcastle' | 'hildebrand' = 'hildebrand') {
  if (isDevelopment()) {
    const user = DEV_USERS[userType]
    
    // Set organization ID in session storage
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.setItem('currentOrgId', user.orgId)
        sessionStorage.setItem('dev_user', JSON.stringify(user))
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
      const user = userStr ? JSON.parse(userStr) : DEV_USERS.hildebrand // Default to Hildebrand for testing Emily Wright
      
      return {
        user,
        orgId: orgId || user.orgId || HILDEBRAND_ORG_ID,
        userRole: 'hiring_manager'
      }
    }
  } catch (error) {
    console.warn('[DevAuth] Error reading dev auth:', error)
  }
  
  // Always return Hildebrand development auth for testing Emily Wright
  return {
    user: DEV_USERS.hildebrand,
    orgId: HILDEBRAND_ORG_ID,
    userRole: 'hiring_manager'
  }
}