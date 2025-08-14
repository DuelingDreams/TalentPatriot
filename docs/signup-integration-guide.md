# Complete Signup Workflow Integration Guide

This guide explains how the user-organization assignment endpoints are now integrated into the TalentPatriot signup workflow, eliminating manual SQL operations.

## Integration Overview

The signup workflow now uses automated REST API endpoints for user-organization assignments, providing:

✅ **Automated user assignment** during organization creation  
✅ **Comprehensive error handling** with fallback mechanisms  
✅ **Clean separation of concerns** between services  
✅ **Reusable components** for team invitations  
✅ **Type-safe React hooks** for UI interactions  

## Prerequisites

1. **Database Setup**: Run the `safe_onboarding_setup.sql` script in Supabase SQL Editor
2. **Environment Variables**: Ensure `SUPABASE_SERVICE_ROLE_KEY` is configured
3. **Authentication**: Supabase Auth must be properly configured

## Integration Components

### 1. Server-Side Endpoints

**Location**: `server/routes.ts`

```typescript
// Automatically assign user to organization
POST /api/organizations/:orgId/users
{
  "userId": "user-uuid",
  "role": "owner|admin|hiring_manager|recruiter|interviewer|viewer"
}

// Remove user from organization
DELETE /api/organizations/:orgId/users/:userId

// List organization members
GET /api/organizations/:orgId/users/details
```

### 2. Helper Service

**Location**: `lib/userService.ts`

Core functions:
- `addUserToOrganization()` - Server-side user assignment with validation
- `removeUserFromOrganization()` - Safe user removal with owner protection
- `getOrganizationUsers()` - Fetch organization members

### 3. Frontend Integration

**Location**: `client/src/hooks/useUserOrganization.ts`

React hooks for UI interactions:
- `useUserOrganization()` - Mutation hooks with toast notifications
- `assignCurrentUserAsOwner()` - Helper for onboarding workflow
- `inviteUserToOrganization()` - Helper for user invitations

### 4. Onboarding Service

**Location**: `client/src/services/onboardingService.ts`

High-level service managing the complete workflow:
- `createOrganizationAndAssignUser()` - Full onboarding process
- `handleInvitedUserSignup()` - For invited team members
- `getUserOrganizationContext()` - Context management

## Updated Signup Workflow

### Previous Workflow (Manual SQL)

```javascript
// OLD: Manual user-organization relationship
await fetch('/api/user-organizations', {
  method: 'POST',
  body: JSON.stringify({
    userId: user.id,
    orgId: organization.id,
    role: 'owner'
  })
});
```

### New Integrated Workflow

```javascript
// NEW: Automated assignment with validation
const result = await OnboardingService.createOrganizationAndAssignUser(
  user.id,
  companyName,
  companySize,
  userRole
);
```

## Step-by-Step Integration

### 1. Organization Creation (OnboardingStep2.tsx)

```typescript
// Import the onboarding service
const { OnboardingService } = await import('@/services/onboardingService');

// Create organization and assign user automatically
const result = await OnboardingService.createOrganizationAndAssignUser(
  user.id,
  companyName.trim(),
  companySize,
  userRole
);

if (result.success) {
  // Update user metadata and continue onboarding
  await supabase.auth.updateUser({
    data: {
      currentOrgId: result.organization.id,
      // ... other metadata
    }
  });
}
```

### 2. Team Member Invitations

```typescript
// Use the invitation hook
const { assignUserToOrganization } = useUserOrganization();

// Invite a team member
await assignUserToOrganization.mutateAsync({
  orgId: currentOrgId,
  userId: newTeamMemberId,
  role: 'recruiter'
});
```

### 3. Organization Management UI

```tsx
// Display organization members
import { OrganizationUsers } from '@/components/forms/InviteUserForm';

<OrganizationUsers orgId={currentOrgId} />
```

## Error Handling & Fallbacks

The integration includes comprehensive error handling:

### Server-Side Validation
- UUID format validation
- Role validation against enum values
- Organization existence verification
- Duplicate membership prevention
- Owner protection (cannot remove organization owner)

### Client-Side Error Handling
- Toast notifications for user feedback
- Query cache invalidation for data consistency
- Graceful degradation if assignment fails
- Fallback to database triggers for critical operations

### Fallback Mechanisms
```typescript
// If API assignment fails, database triggers ensure data consistency
const ownerAssigned = await assignCurrentUserAsOwner(organization.id, user.id);

if (!ownerAssigned) {
  console.warn('Owner assignment failed, but continuing with onboarding');
  // Database triggers handle this as fallback
}
```

## Database Triggers (Fallback Safety)

The SQL setup includes triggers that automatically:
- Create user profiles on signup
- Assign organization owners when organizations are created
- Maintain data consistency even if API calls fail

## Testing the Integration

### 1. Test Signup Flow
1. Navigate to `/signup`
2. Create new account with email/password
3. Complete onboarding steps
4. Verify user is automatically assigned as organization owner

### 2. Test API Endpoints
```bash
# Test user assignment
curl -X POST "/api/organizations/{orgId}/users" \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-uuid", "role": "recruiter"}'

# Test user removal
curl -X DELETE "/api/organizations/{orgId}/users/{userId}"

# Test list members
curl -X GET "/api/organizations/{orgId}/users/details"
```

### 3. Test Error Cases
- Invalid UUID formats
- Non-existent organizations
- Invalid roles
- Duplicate assignments
- Removing organization owner (should fail)

## Migration Benefits

### Before Integration
- Manual SQL operations required
- No validation or error handling
- Inconsistent user assignment
- Risk of orphaned data
- No UI for team management

### After Integration
- Fully automated workflow
- Comprehensive validation
- Consistent error handling
- Built-in safety mechanisms
- User-friendly team management UI

## Security Considerations

### Rate Limiting
All write operations are rate-limited (100 operations per 15 minutes per IP).

### Access Control
- Row Level Security (RLS) policies enforced
- Organization-scoped data access
- User authentication required
- Role-based permissions

### Input Validation
- Server-side UUID validation
- Role enum validation
- Request body sanitization
- SQL injection prevention

## Performance Optimizations

### Query Caching
- React Query for client-side caching
- Automatic cache invalidation
- Optimistic updates for better UX

### Database Efficiency
- Indexed columns for fast lookups
- Minimal database roundtrips
- Bulk operations where possible

## Next Steps

1. **Team Invitations**: Implement email-based team invitations using the new endpoints
2. **Role Management**: Add UI for changing user roles within organizations
3. **Bulk Operations**: Add endpoints for bulk user assignments
4. **Audit Trail**: Add logging for user assignment operations
5. **SSO Integration**: Integrate with OAuth providers for seamless signup

## Support

If you encounter issues with the integration:

1. Check the browser console for detailed error messages
2. Verify database setup using the SQL verification queries
3. Ensure environment variables are properly configured
4. Check server logs for detailed error information
5. Validate that Supabase service role key has proper permissions