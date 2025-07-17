# TalentPatriot ATS - Complete System Documentation

## Overview
TalentPatriot is a modern, multi-tenant Applicant Tracking System (ATS) built with React, TypeScript, Express, and Supabase. The system features comprehensive organization management, role-based access control, and a complete authentication flow with automatic organization provisioning.

## Database Architecture

### Tables Overview
- **organizations**: Core organization/company management
- **user_organizations**: Many-to-many relationship linking users to organizations with roles
- **clients**: Company client information within organizations
- **jobs**: Job postings linked to clients and organizations
- **candidates**: Candidate profiles and applications
- **job_candidate**: Many-to-many relationship for candidate applications
- **candidate_notes**: Detailed notes for each job application

### Role Definitions

#### Organization Roles (org_role enum)
- **owner**: Full control over organization, can manage all users and data
- **admin**: Can manage organization users and data, cannot delete organization
- **recruiter**: Can manage jobs, candidates, and applications within organization
- **viewer**: Read-only access to organization data

#### User Roles (user_role enum)
- **recruiter**: Full access to ATS functionality within their organizations
- **bd**: Business development - focused on client management
- **pm**: Project manager - access to project-based jobs
- **demo_viewer**: Limited access to demo data only

## Authentication & Organization Flow

### Signup Process
1. User creates account with email, password, role, and optional organization name
2. If role is not 'demo_viewer':
   - System automatically creates organization (using provided name or email prefix)
   - User is added to user_organizations table as 'owner'
   - User metadata is updated with currentOrgId for session routing
3. Demo viewers skip organization creation

### Authentication Context
The AuthContext provides:
- **user**: Supabase User object
- **session**: Supabase Session object
- **userRole**: User's system role (recruiter, bd, pm, demo_viewer)
- **currentOrgId**: User's current organization ID for routing
- **signIn/signUp/signOut**: Authentication methods
- **setCurrentOrgId**: Method to switch between user's organizations

## API Endpoints

### Organizations API
- `GET /api/organizations?ownerId={userId}` - Get organizations owned by user
- `GET /api/organizations/:id` - Get specific organization
- `POST /api/organizations` - Create new organization
- `PUT /api/organizations/:id` - Update organization
- `DELETE /api/organizations/:id` - Delete organization

### User Organizations API
- `GET /api/user-organizations?userId={id}&orgId={id}` - Get user-org relationships
- `GET /api/users/:userId/organizations` - Get all organizations for user
- `GET /api/organizations/:orgId/users` - Get all users in organization
- `POST /api/user-organizations` - Add user to organization
- `PUT /api/user-organizations/:id` - Update user role in organization
- `DELETE /api/user-organizations/:id` - Remove user from organization
- `DELETE /api/users/:userId/organizations/:orgId` - Remove specific user-org relationship

## Row-Level Security (RLS) Policies

### Organizations Table
- Users can only access organizations they belong to (via user_organizations join)
- Only owners can delete organizations
- Owners and admins can update organization details
- Unauthenticated users have no access

### User Organizations Table
- Users can read their own organization memberships
- Organization admins/owners can read all users in their organizations
- Organization admins/owners can invite and manage users
- Users can leave organizations themselves
- Comprehensive role-based access control

### Data Isolation
All client data, jobs, candidates, and notes are scoped to organizations through RLS policies, ensuring complete data isolation between different organizations.

## Migration Scripts

### Required Deployments
1. **organizations-migration.sql**: Creates organizations table with RLS policies
2. **user-organizations-migration.sql**: Creates user_organizations join table with comprehensive RLS policies and auto-owner trigger

### Deployment Order
1. Run organizations-migration.sql first
2. Run user-organizations-migration.sql second
3. Update existing RLS policies using supabase-rls-simplified.sql

## Frontend Architecture

### Organization Context
The system maintains organization context throughout the user session:
- currentOrgId tracks active organization
- API calls are scoped to current organization
- Navigation and data display respect organization boundaries

### Role-Based UI
- Different UI elements show/hide based on user role
- Organization management features only available to owners/admins
- Demo viewers see limited demo-specific interface

## Security Features

### Multi-Tenant Isolation
- Complete data isolation between organizations
- Users can only access data from organizations they belong to
- No cross-organization data leakage possible

### Role-Based Permissions
- Fine-grained permissions based on organization role
- API endpoints respect user roles and organization membership
- UI adapts to user permissions automatically

### Authentication Security
- Supabase handles secure authentication
- User metadata stores role and organization information
- Session-based organization routing

## Development Workflow

### Local Development
- In-memory storage for testing without database
- Full API simulation for all endpoints
- Database storage automatically used when Supabase is configured

### Production Deployment
- Run migration scripts in Supabase SQL Editor
- Configure environment variables
- Deploy with proper RLS policies active

## Next Steps for Production

1. **Database Setup**: Execute migration scripts in Supabase
2. **Test Organization Creation**: Verify signup flow creates organizations correctly
3. **User Management**: Test adding/removing users from organizations
4. **Data Scoping**: Verify all data is properly scoped to organizations
5. **Permission Testing**: Test all role combinations work correctly

This architecture provides enterprise-grade multi-tenancy with complete data isolation and comprehensive role-based access control.