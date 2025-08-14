import { apiRequest } from '@/lib/queryClient'

export interface AssignUserToOrganizationRequest {
  userId: string
  role: 'owner' | 'admin' | 'hiring_manager' | 'recruiter' | 'interviewer' | 'viewer'
}

export interface AssignUserToOrganizationResponse {
  success: boolean
  message: string
  data: {
    orgId: string
    userId: string
    role: string
  }
}

/**
 * Assigns a user to an organization with the specified role
 * @param orgId The organization ID
 * @param request The user assignment request
 * @returns Promise with the assignment result
 */
export async function assignUserToOrganization(
  orgId: string, 
  request: AssignUserToOrganizationRequest
): Promise<AssignUserToOrganizationResponse> {
  if (!orgId) {
    throw new Error('Organization ID is required')
  }
  
  if (!request.userId) {
    throw new Error('User ID is required')
  }

  const response = await fetch(`/api/organizations/${orgId}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId: request.userId,
      role: request.role,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to assign user to organization' }))
    
    // Handle specific error cases
    if (response.status === 409) {
      throw new Error('User is already a member of this organization')
    } else if (response.status === 404) {
      throw new Error('Organization not found')
    } else if (response.status === 400) {
      throw new Error(error.error || 'Invalid request data')
    }
    
    throw new Error(error.error || 'Failed to assign user to organization')
  }

  return response.json()
}

/**
 * Utility function to automatically assign new users to an organization
 * This is typically called after user creation or invitation
 * @param orgId Organization ID
 * @param userId New user ID  
 * @param role Role to assign (defaults to 'recruiter')
 */
export async function autoAssignNewUser(
  orgId: string, 
  userId: string, 
  role: 'hiring_manager' | 'recruiter' | 'admin' = 'recruiter'
): Promise<void> {
  try {
    await assignUserToOrganization(orgId, {
      userId,
      role,
    })
    console.log(`Successfully assigned user ${userId} to organization ${orgId} with role ${role}`)
  } catch (error: any) {
    // Don't throw if user is already a member
    if (error.message.includes('already a member')) {
      console.log(`User ${userId} is already a member of organization ${orgId}`)
      return
    }
    
    console.error('Failed to auto-assign user to organization:', error)
    throw error
  }
}