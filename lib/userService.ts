import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Add a user to an organization with the specified role
 * @param orgId - Organization ID
 * @param userId - User ID to add to the organization
 * @param role - Role to assign (defaults to 'recruiter')
 * @returns Promise with success/error result
 */
export async function addUserToOrganization(
  orgId: string, 
  userId: string, 
  role: string = 'recruiter'
): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    // Validate inputs
    if (!orgId || !userId) {
      return {
        success: false,
        message: 'Organization ID and User ID are required',
        error: 'INVALID_INPUT'
      };
    }

    // Check if user is already in the organization
    const { data: existing, error: selectError } = await supabaseAdmin
      .from('user_organizations')
      .select('id, role')
      .eq('org_id', orgId)
      .eq('user_id', userId)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      // PGRST116 means "no rows found", which is expected if user isn't in org
      throw new Error(`Failed to check existing membership: ${selectError.message}`);
    }

    if (existing) {
      return {
        success: false,
        message: `User is already a member of this organization with role: ${existing.role}`,
        error: 'USER_ALREADY_MEMBER'
      };
    }

    // Verify organization exists
    const { data: orgExists, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id, name')
      .eq('id', orgId)
      .single();

    if (orgError || !orgExists) {
      return {
        success: false,
        message: 'Organization not found',
        error: 'ORGANIZATION_NOT_FOUND'
      };
    }

    // Add user to organization
    const { error: insertError } = await supabaseAdmin
      .from('user_organizations')
      .insert([{ 
        org_id: orgId, 
        user_id: userId, 
        role: role as any // Cast to satisfy enum type
      }]);

    if (insertError) {
      throw new Error(`Failed to add user to organization: ${insertError.message}`);
    }

    return {
      success: true,
      message: `User successfully added to organization "${orgExists.name}" with role: ${role}`
    };

  } catch (error: any) {
    console.error('Error in addUserToOrganization:', error);
    return {
      success: false,
      message: 'Failed to add user to organization',
      error: error.message
    };
  }
}

/**
 * Remove a user from an organization
 * @param orgId - Organization ID
 * @param userId - User ID to remove from the organization
 * @returns Promise with success/error result
 */
export async function removeUserFromOrganization(
  orgId: string, 
  userId: string
): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    if (!orgId || !userId) {
      return {
        success: false,
        message: 'Organization ID and User ID are required',
        error: 'INVALID_INPUT'
      };
    }

    // Check if user is in the organization
    const { data: existing, error: selectError } = await supabaseAdmin
      .from('user_organizations')
      .select('id, role')
      .eq('org_id', orgId)
      .eq('user_id', userId)
      .single();

    if (selectError || !existing) {
      return {
        success: false,
        message: 'User is not a member of this organization',
        error: 'USER_NOT_MEMBER'
      };
    }

    // Don't allow removing organization owner
    if (existing.role === 'owner') {
      return {
        success: false,
        message: 'Cannot remove organization owner. Transfer ownership first.',
        error: 'CANNOT_REMOVE_OWNER'
      };
    }

    // Remove user from organization
    const { error: deleteError } = await supabaseAdmin
      .from('user_organizations')
      .delete()
      .eq('org_id', orgId)
      .eq('user_id', userId);

    if (deleteError) {
      throw new Error(`Failed to remove user from organization: ${deleteError.message}`);
    }

    return {
      success: true,
      message: 'User successfully removed from organization'
    };

  } catch (error: any) {
    console.error('Error in removeUserFromOrganization:', error);
    return {
      success: false,
      message: 'Failed to remove user from organization',
      error: error.message
    };
  }
}

/**
 * Get all users in an organization
 * @param orgId - Organization ID
 * @returns Promise with list of organization members
 */
export async function getOrganizationUsers(
  orgId: string
): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    if (!orgId) {
      return {
        success: false,
        error: 'Organization ID is required'
      };
    }

    const { data, error } = await supabaseAdmin
      .from('user_organizations')
      .select(`
        id,
        role,
        joined_at,
        user_id
      `)
      .eq('org_id', orgId)
      .order('joined_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch organization users: ${error.message}`);
    }

    return {
      success: true,
      data: data || []
    };

  } catch (error: any) {
    console.error('Error in getOrganizationUsers:', error);
    return {
      success: false,
      error: error.message
    };
  }
}