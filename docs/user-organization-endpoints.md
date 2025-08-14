# User-Organization Assignment API Endpoints

This document describes the new API endpoints for automatically assigning users to organizations, eliminating the need for manual SQL operations.

## Overview

The new endpoints provide a clean REST API for managing user-organization relationships, including assignment, removal, and listing organization members.

## Endpoints

### 1. Assign User to Organization

**POST** `/api/organizations/:orgId/users`

Automatically assigns a user to an organization with the specified role.

#### Parameters
- `orgId` (path parameter): UUID of the organization
- `userId` (request body): UUID of the user to assign
- `role` (request body, optional): Role to assign (defaults to 'recruiter')

#### Valid Roles
- `owner` - Organization owner (full permissions)
- `admin` - Administrator (manage users and settings)
- `hiring_manager` - Can manage jobs and candidates
- `recruiter` - Can work with candidates and applications
- `interviewer` - Can conduct and manage interviews
- `viewer` - Read-only access

#### Request Example
```bash
curl -X POST "http://localhost:5000/api/organizations/3eaf74e7-eda2-415a-a6ca-2556a9425ae2/users" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "role": "recruiter"
  }'
```

#### Success Response (201 Created)
```json
{
  "success": true,
  "message": "User successfully added to organization \"Demo Company\" with role: recruiter",
  "data": {
    "orgId": "3eaf74e7-eda2-415a-a6ca-2556a9425ae2",
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "role": "recruiter"
  }
}
```

#### Error Responses
- **400 Bad Request**: Missing required parameters or invalid role
- **404 Not Found**: Organization not found
- **409 Conflict**: User already member of organization

### 2. Remove User from Organization

**DELETE** `/api/organizations/:orgId/users/:userId`

Removes a user from an organization.

#### Parameters
- `orgId` (path parameter): UUID of the organization
- `userId` (path parameter): UUID of the user to remove

#### Request Example
```bash
curl -X DELETE "http://localhost:5000/api/organizations/3eaf74e7-eda2-415a-a6ca-2556a9425ae2/users/123e4567-e89b-12d3-a456-426614174000"
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "User successfully removed from organization"
}
```

#### Error Responses
- **400 Bad Request**: Missing required parameters
- **403 Forbidden**: Cannot remove organization owner
- **404 Not Found**: User not a member of organization

### 3. List Organization Users

**GET** `/api/organizations/:orgId/users/details`

Retrieves all users in an organization with their roles and join dates.

#### Parameters
- `orgId` (path parameter): UUID of the organization

#### Request Example
```bash
curl -X GET "http://localhost:5000/api/organizations/3eaf74e7-eda2-415a-a6ca-2556a9425ae2/users/details"
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": "user-org-relation-id",
      "user_id": "123e4567-e89b-12d3-a456-426614174000",
      "role": "recruiter",
      "joined_at": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

## Integration with Signup Flow

### Automatic User Assignment During Onboarding

After creating a user account and organization during onboarding, use the assignment endpoint to automatically add users:

```javascript
// During organization creation in OnboardingStep2.tsx
const orgResponse = await fetch('/api/organizations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: companyName,
    ownerId: user.id,
    slug: companySlug
  })
});

const organization = await orgResponse.json();

// Automatically assign the user as owner
await fetch(`/api/organizations/${organization.id}/users`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: user.id,
    role: 'owner'
  })
});
```

### User Invitations

When inviting new users to an existing organization:

```javascript
// After user accepts invitation
const inviteResponse = await fetch(`/api/organizations/${orgId}/users`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: newUserId,
    role: 'recruiter' // or other appropriate role
  })
});
```

## Rate Limiting

All write operations (POST, DELETE) are protected by rate limiting:
- 100 operations per 15 minutes per IP address
- Prevents abuse and ensures system stability

## Security Features

### Input Validation
- UUID format validation for all IDs
- Role validation against allowed values
- Duplicate membership prevention

### Access Control
- Organization owner protection (cannot be removed)
- Proper error handling for unauthorized access
- Row Level Security (RLS) policies in database

### Error Handling
- Comprehensive error messages with specific error codes
- Detailed logging for debugging
- Graceful handling of edge cases

## Database Integration

The endpoints use the `userService.ts` helper functions which:
- Interact directly with Supabase using service role credentials
- Handle database transactions safely
- Provide consistent error handling
- Validate data integrity

## Testing

Use the provided curl examples or integrate into your frontend. The endpoints handle:
- Valid UUID formats required
- Proper role validation
- Organization existence verification
- Duplicate assignment detection
- Safe user removal (protecting owners)

## Migration from Manual SQL

Instead of manually running SQL to add users:
```sql
-- Old way (manual SQL)
INSERT INTO user_organizations (user_id, org_id, role)
VALUES ('user-id', 'org-id', 'recruiter');
```

Use the API endpoint:
```bash
# New way (API endpoint)
curl -X POST "/api/organizations/org-id/users" \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-id", "role": "recruiter"}'
```

This ensures consistency, validation, and proper error handling.