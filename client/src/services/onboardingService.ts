import { inviteUserToOrganization, assignCurrentUserAsOwner } from '@/features/organization/hooks/useUserOrganization';

/**
 * Complete onboarding service that handles the full signup workflow
 * Uses the new user-organization assignment endpoints
 */
export class OnboardingService {
  /**
   * Handle new organization creation during onboarding
   */
  static async createOrganizationAndAssignUser(
    userId: string,
    companyName: string,
    companySize: string,
    userRole: string
  ): Promise<{ success: boolean; organization?: any; error?: string }> {
    try {
      // Step 1: Create organization
      const orgResponse = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: companyName.trim(),
          ownerId: userId,
          slug: companyName.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .substring(0, 50),
          metadata: {
            companySize,
            ownerRole: userRole,
            onboardingCompleted: true,
          }
        }),
      });

      if (!orgResponse.ok) {
        const errorData = await orgResponse.json();
        return {
          success: false,
          error: errorData.error || 'Failed to create organization'
        };
      }

      const organization = await orgResponse.json();

      // Step 2: Assign user as owner using new endpoint
      const assignmentResult = await assignCurrentUserAsOwner(organization.id, userId);

      if (!assignmentResult) {
        console.warn('User assignment failed, but organization was created');
        // Continue - the server triggers should handle this
      }

      return {
        success: true,
        organization
      };

    } catch (error) {
      console.error('Onboarding service error:', error);
      return {
        success: false,
        error: 'Network error during organization setup'
      };
    }
  }

  /**
   * Handle user invitation to existing organization
   */
  static async inviteUserToOrganization(
    orgId: string,
    userId: string,
    role: string = 'recruiter'
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    return await inviteUserToOrganization(orgId, userId, role);
  }

  /**
   * Handle team member signup (when invited by organization)
   */
  static async handleInvitedUserSignup(
    userId: string,
    invitationToken: string
  ): Promise<{ success: boolean; organization?: any; error?: string }> {
    try {
      // Validate invitation token and get organization details
      const invitationResponse = await fetch(`/api/invitations/validate/${invitationToken}`);
      
      if (!invitationResponse.ok) {
        return {
          success: false,
          error: 'Invalid or expired invitation'
        };
      }

      const invitation = await invitationResponse.json();

      // Assign user to organization with invited role
      const assignmentResult = await inviteUserToOrganization(
        invitation.orgId,
        userId,
        invitation.role
      );

      if (!assignmentResult.success) {
        return {
          success: false,
          error: assignmentResult.error
        };
      }

      // Mark invitation as used
      await fetch(`/api/invitations/${invitationToken}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      });

      return {
        success: true,
        organization: invitation.organization
      };

    } catch (error) {
      console.error('Invited user signup error:', error);
      return {
        success: false,
        error: 'Failed to process invitation signup'
      };
    }
  }

  /**
   * Get organization context for user
   */
  static async getUserOrganizationContext(userId: string) {
    try {
      const response = await fetch(`/api/users/${userId}/organizations`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user organizations');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user organization context:', error);
      return [];
    }
  }
}