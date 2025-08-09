# Subdomain-Based Organization Routing System

## Overview

The TalentPatriot ATS now supports subdomain-based organization routing, providing each organization with their own branded careers page URL: `{company-slug}.talentpatriot.app/careers`

## System Architecture

### Job Slug Generation and Publishing Workflow

1. **Job Creation**: Jobs are always created as drafts with server-generated unique slugs
2. **Job Publishing**: Publishing validates required fields and makes jobs publicly available
3. **Public Access**: Published jobs are accessible via subdomain careers pages

### Key Components

#### Backend Services (`lib/jobService.ts`)
- `createJob(data, userContext)`: Creates draft jobs with auto-generated unique slugs
- `publishJob(jobId, userContext)`: Validates and publishes jobs with backend validation
- `generateUniqueSlug(title, jobId)`: Creates URL-safe slugs from job titles

#### API Routes (`server/routes.ts`)
- `POST /api/jobs`: Creates draft jobs (always draft status)
- `POST /api/jobs/:jobId/publish`: Publishes jobs with validation
- User context validation for organization access control

#### Frontend Components
- `PostJobDialog`: Updated to remove slug field, all validation optional for drafts
- `usePublishJob`: Hook with proper error handling and public URL display
- `Jobs` page: Integrated publish workflow with canonical URL display

### Database Schema

Jobs table includes:
- `public_slug`: Unique slug for public URLs (generated at creation)
- `status`: Job status ('draft', 'open', 'closed', 'filled') 
- `published_at`: Publication timestamp (set on publish)
- Unique constraints and performance indexes for careers page queries

### Validation Rules

#### Draft Creation (Minimal Requirements)
- Job title (required)
- Organization access validation
- All other fields optional for draft state

#### Publishing Requirements (Backend Validation)
- Job title (required)
- Job description (required)  
- Job location (required)
- Job type (required)
- User organization access validation

### Security Features

- User context validation for all job operations
- Organization-scoped access control
- Idempotent publishing (safe to call multiple times)
- SQL injection protection with parameterized queries

## Implementation Status

✅ **Completed Features**
- Server-side slug generation with uniqueness guarantees
- Backend job creation and publishing services
- API validation using Zod schemas
- Frontend form updates with proper field mapping
- Publish workflow with canonical URL display
- Database constraints and performance indexes
- User context validation for organization access

⚠️ **Current Limitations**
- Database migration needs manual execution (connection issues)
- User authentication headers need middleware integration
- Subdomain middleware integration pending

## Usage Examples

### Creating a Draft Job
```javascript
// Frontend (automatically gets unique slug)
const jobData = {
  title: "Senior Software Engineer",
  description: "...", // optional for draft
  location: "San Francisco, CA", // optional for draft
  // ... other fields
}
```

### Publishing a Job
```javascript
// Validates all required fields before publishing
const result = await publishJob(jobId, userContext)
// Returns: { publicUrl: "/careers/senior-software-engineer-abc123", job: {...} }
```

### Public Career Page URL
```
https://acme-corp.talentpatriot.app/careers/senior-software-engineer-abc123
```

## Database Migration

To apply the job slug system constraints and indexes:

```sql
-- See job_slug_migration.sql for complete migration
-- Includes unique constraints, performance indexes, and triggers
```

## Next Steps

1. Execute database migration for production deployment
2. Integrate user authentication middleware for proper context
3. Deploy with subdomain routing enabled
4. Test end-to-end job creation and publishing workflow