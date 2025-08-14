import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

interface AssignUserToOrgParams {
  orgId: string;
  userId: string;
  role?: 'owner' | 'admin' | 'hiring_manager' | 'recruiter' | 'interviewer' | 'viewer';
}

interface RemoveUserFromOrgParams {
  orgId: string;
  userId: string;
}

/**
 * Hook for managing user-organization assignments
 * Uses the new REST API endpoints for automated user assignment
 */
export function useUserOrganization() {
  const queryClient = useQueryClient();

  // Assign user to organization
  const assignUserToOrganization = useMutation({
    mutationFn: async ({ orgId, userId, role = 'recruiter' }: AssignUserToOrgParams) => {
      const response = await fetch(`/api/organizations/${orgId}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          role,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to assign user to organization');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "User Added",
        description: data.message || "User successfully added to organization",
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['organization-users'] });
      queryClient.invalidateQueries({ queryKey: ['user-organizations'] });
    },
    onError: (error: Error) => {
      console.error('Failed to assign user to organization:', error);
      toast({
        variant: "destructive",
        title: "Assignment Failed",
        description: error.message,
      });
    },
  });

  // Remove user from organization
  const removeUserFromOrganization = useMutation({
    mutationFn: async ({ orgId, userId }: RemoveUserFromOrgParams) => {
      const response = await fetch(`/api/organizations/${orgId}/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove user from organization');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "User Removed",
        description: data.message || "User successfully removed from organization",
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['organization-users'] });
      queryClient.invalidateQueries({ queryKey: ['user-organizations'] });
    },
    onError: (error: Error) => {
      console.error('Failed to remove user from organization:', error);
      toast({
        variant: "destructive",
        title: "Removal Failed",
        description: error.message,
      });
    },
  });

  return {
    assignUserToOrganization,
    removeUserFromOrganization,
    isAssigning: assignUserToOrganization.isPending,
    isRemoving: removeUserFromOrganization.isPending,
  };
}

/**
 * Helper function for onboarding workflow
 * Automatically assigns the current user as owner of their organization
 */
export async function assignCurrentUserAsOwner(orgId: string, userId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/organizations/${orgId}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        role: 'owner',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.warn('Owner assignment failed:', error);
      return false;
    }

    const result = await response.json();
    console.log('User successfully assigned as owner:', result);
    return true;
  } catch (error) {
    console.error('Error during owner assignment:', error);
    return false;
  }
}

/**
 * Helper function for inviting users to an organization
 * Can be used after user account creation or for existing users
 */
export async function inviteUserToOrganization(
  orgId: string,
  userId: string,
  role: string = 'recruiter'
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const response = await fetch(`/api/organizations/${orgId}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        role,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to invite user to organization',
      };
    }

    return {
      success: true,
      message: result.message,
    };
  } catch (error) {
    console.error('Error inviting user to organization:', error);
    return {
      success: false,
      error: 'Network error during user invitation',
    };
  }
}

/**
 * Fetch organization users with details
 */
export async function getOrganizationUsers(orgId: string) {
  try {
    const response = await fetch(`/api/organizations/${orgId}/users/details`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch organization users');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching organization users:', error);
    throw error;
  }
}