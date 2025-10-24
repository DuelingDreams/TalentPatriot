# TalentPatriot - Data Model & API Documentation

## Table of Contents
- [Data Model Overview](#data-model-overview)
- [Core Entities](#core-entities)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Data Relationships](#data-relationships)
- [Type System](#type-system)

## Data Model Overview

TalentPatriot uses a **multi-tenant PostgreSQL database** with strict organization-based data isolation. The schema is managed using **Drizzle ORM** with automatic type generation.

### Key Architectural Decisions

1. **Multi-Tenancy**: Every table includes `org_id` for organization isolation
2. **UUID Primary Keys**: All entities use UUID for primary keys
3. **Type Safety**: Shared TypeScript types between frontend and backend
4. **Materialized Views**: Pre-computed aggregations for analytics
5. **Row-Level Security**: Supabase RLS policies enforce data access

## Core Entities

### 1. Organizations

The root entity for multi-tenancy. Every user belongs to one or more organizations.

**Table**: `organizations`

```typescript
{
  id: uuid,
  name: string,
  ownerId: uuid,  // References auth.users
  slug: string,  // For subdomain routing
  seatsPurchased: number,
  planTier: 'starter' | 'professional' | 'enterprise',
  createdAt: timestamp
}
```

**Relationships**:
- One organization has many users (via `user_organizations`)
- One organization has many jobs, candidates, clients

### 2. Users

Users are managed by Supabase Auth with extended profiles.

**Table**: `user_profiles`

```typescript
{
  id: uuid,  // References auth.users(id)
  role: 'user' | 'admin' | 'platform_admin',  // Platform-level role
  firstName: string,
  lastName: string,
  phone: string,
  jobTitle: string,
  department: string,
  location: string,
  bio: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Table**: `user_organizations`

```typescript
{
  id: uuid,
  userId: uuid,
  orgId: uuid,
  role: 'owner' | 'admin' | 'hiring_manager' | 'recruiter' | 'interviewer' | 'viewer',
  isRecruiterSeat: boolean,  // Drives billing
  joinedAt: timestamp
}
```

### 3. Clients

Companies or organizations that the recruiting firm works with.

**Table**: `clients`

```typescript
{
  id: uuid,
  orgId: uuid,
  name: string,
  industry: string,
  location: string,
  website: string,
  contactName: string,
  contactEmail: string,
  notes: string,
  status: 'active' | 'inactive' | 'demo',
  createdAt: timestamp,
  updatedAt: timestamp,
  createdBy: uuid
}
```

### 4. Jobs

Job openings with lifecycle management (draft → open → filled/closed).

**Table**: `jobs`

```typescript
{
  id: uuid,
  orgId: uuid,
  title: string,
  description: string,
  location: string,
  jobType: 'full-time' | 'part-time' | 'contract' | 'freelance' | 'internship',
  department: string,
  salaryRange: string,
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive',
  remoteOption: 'onsite' | 'remote' | 'hybrid',
  clientId: uuid,
  status: 'draft' | 'open' | 'closed' | 'on_hold' | 'filled',
  recordStatus: 'active' | 'inactive' | 'demo',
  public_slug: string,  // For public URLs
  publishedAt: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp,
  createdBy: uuid,
  assignedTo: uuid
}
```

### 5. Candidates

Individuals applying for jobs with extended profile data.

**Table**: `candidates`

```typescript
{
  id: uuid,
  orgId: uuid,
  name: string,
  email: string,
  phone: string,
  resumeUrl: string,  // Signed URL from Supabase Storage
  status: 'active' | 'inactive' | 'demo',
  
  // AI Resume Parsing Fields
  resumeParsed: boolean,
  skills: string[],  // Array of skill names
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive',
  totalYearsExperience: number,
  education: string,  // JSON string
  summary: string,
  searchableContent: string,  // Full-text search
  
  // Extended Profile Fields
  linkedinUrl: string,
  portfolioUrl: string,
  workAuthorization: string,
  visaSponsorship: string,
  ageConfirmation: string,
  previousEmployee: string,
  referralSource: string,
  employmentHistory: string,
  comprehensiveEducation: string,
  dataPrivacyAck: boolean,
  aiAcknowledgment: boolean,
  
  // Demographics (optional)
  gender: string,
  raceEthnicity: string,
  veteranStatus: string,
  disabilityStatus: string,
  
  // Skills with proficiency levels
  skillLevels: jsonb,  // { "React": 5, "TypeScript": 4 }
  
  // Source tracking
  source: string,  // How did you hear about us?
  
  createdAt: timestamp,
  updatedAt: timestamp,
  createdBy: uuid
}
```

### 6. Job-Candidate Relationship

Links candidates to jobs with pipeline stage tracking.

**Table**: `job_candidate`

```typescript
{
  id: uuid,
  orgId: uuid,
  jobId: uuid,
  candidateId: uuid,
  pipelineColumnId: uuid,  // Current Kanban column
  stage: 'applied' | 'phone_screen' | 'interview' | 'technical' | 'final' | 'offer' | 'hired' | 'rejected',
  notes: string,
  assignedTo: uuid,
  status: 'active' | 'inactive' | 'demo',
  source: string,  // Application source
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Unique Constraint**: `(jobId, candidateId)` - One candidate can only apply once per job

### 7. Pipeline Columns

Customizable Kanban columns per job.

**Table**: `pipeline_columns`

```typescript
{
  id: uuid,
  orgId: uuid,
  jobId: uuid,  // Job-specific pipeline
  title: string,
  position: number,  // Sort order (0, 1, 2, ...)
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 8. Application Metadata

Extended application data for analytics.

**Table**: `application_metadata`

```typescript
{
  id: uuid,
  orgId: uuid,
  candidateId: uuid,
  jobId: uuid,
  educationDetails: string,
  employmentDetails: string,
  applicationSource: string,  // "Company Website", "LinkedIn", "Indeed", etc.
  submissionTimestamp: timestamp,
  formVersion: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 9. Interviews

Interview scheduling and tracking.

**Table**: `interviews`

```typescript
{
  id: uuid,
  orgId: uuid,
  jobCandidateId: uuid,
  title: string,
  type: 'phone' | 'video' | 'in_person' | 'technical',
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show',
  scheduledAt: timestamp,
  duration: string,  // Minutes
  location: string,  // Meeting room or video link
  interviewerId: uuid,
  notes: string,
  feedback: string,
  rating: string,
  recordStatus: 'active' | 'inactive' | 'demo',
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 10. Messages

Internal team communication and email threads.

**Table**: `messages`

```typescript
{
  id: uuid,
  orgId: uuid,
  type: 'general' | 'interview' | 'application' | 'team' | 'internal' | 'client' | 'candidate' | 'system',
  priority: 'low' | 'normal' | 'high' | 'urgent',
  subject: string,
  content: string,
  senderId: uuid,
  recipientId: uuid,
  
  // Context References
  clientId: uuid,
  jobId: uuid,
  candidateId: uuid,
  jobCandidateId: uuid,
  
  isRead: boolean,
  readAt: timestamp,
  isArchived: boolean,
  
  // Thread Support
  threadId: uuid,
  replyToId: uuid,
  
  // Google Integration
  channelType: 'internal' | 'email' | 'client_portal',
  externalMessageId: string,  // Gmail message ID
  
  // Metadata
  attachments: string[],
  tags: string[],
  
  recordStatus: 'active' | 'inactive' | 'demo',
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 11. Connected Accounts

OAuth provider connections (Google, Microsoft).

**Table**: `connected_accounts`

```typescript
{
  id: uuid,
  userId: uuid,
  orgId: uuid,
  provider: 'google' | 'microsoft' | 'zoom',
  providerEmail: string,
  scopes: string[],
  connectorAccountId: string,
  encryptedRefreshToken: string,  // AES-256-GCM encrypted
  accessTokenExpiresAt: timestamp,
  lastUsedAt: timestamp,
  isActive: boolean,
  connectedAt: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Unique Constraint**: `(userId, orgId, provider)`

## Database Schema

### Materialized Views

#### v_dashboard_pipeline_snapshot

Pre-computed pipeline metrics for all jobs.

```sql
CREATE MATERIALIZED VIEW v_dashboard_pipeline_snapshot AS
SELECT
  j.id AS job_id,
  j.title AS job_title,
  j.org_id,
  j.status AS job_status,
  COUNT(CASE WHEN jc.stage = 'applied' THEN 1 END) AS applied,
  COUNT(CASE WHEN jc.stage = 'phone_screen' THEN 1 END) AS phone_screen,
  COUNT(CASE WHEN jc.stage = 'interview' THEN 1 END) AS interview,
  COUNT(CASE WHEN jc.stage = 'technical' THEN 1 END) AS technical,
  COUNT(CASE WHEN jc.stage = 'final' THEN 1 END) AS final,
  COUNT(CASE WHEN jc.stage = 'offer' THEN 1 END) AS offer,
  COUNT(CASE WHEN jc.stage = 'hired' THEN 1 END) AS hired,
  COUNT(CASE WHEN jc.stage = 'rejected' THEN 1 END) AS rejected,
  COUNT(jc.id) AS total_candidates
FROM jobs j
LEFT JOIN job_candidate jc ON j.id = jc.job_id
GROUP BY j.id, j.title, j.org_id, j.status;
```

#### mv_candidate_sources

Application source breakdown with hire conversion.

```sql
CREATE MATERIALIZED VIEW mv_candidate_sources AS
SELECT
  org_id,
  application_source AS source,
  COUNT(*) AS applications,
  COUNT(CASE WHEN hired = true THEN 1 END) AS hires
FROM application_metadata
GROUP BY org_id, application_source;
```

### Database Indexes

Critical indexes for query performance:

```sql
-- Job queries
CREATE INDEX idx_jobs_org_status ON jobs(org_id, status);
CREATE INDEX idx_jobs_public_slug ON jobs(public_slug);

-- Candidate queries
CREATE INDEX idx_candidates_org ON candidates(org_id);
CREATE INDEX idx_candidates_email ON candidates(email);

-- Job-Candidate queries
CREATE INDEX idx_job_candidate_org ON job_candidate(org_id);
CREATE INDEX idx_job_candidate_job ON job_candidate(job_id);
CREATE INDEX idx_job_candidate_candidate ON job_candidate(candidate_id);

-- Pipeline queries
CREATE INDEX idx_pipeline_cols_job_pos ON pipeline_columns(job_id, position);

-- Application metadata
CREATE INDEX idx_app_metadata_org_source ON application_metadata(org_id, application_source);
```

## API Endpoints

### Authentication

#### POST /api/auth/signup
Register new user.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response**:
```json
{
  "user": { "id": "uuid", "email": "user@example.com" },
  "session": { "access_token": "jwt", "refresh_token": "jwt" }
}
```

#### POST /api/auth/login
Authenticate user.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response**:
```json
{
  "user": { "id": "uuid", "email": "user@example.com" },
  "session": { "access_token": "jwt", "refresh_token": "jwt" }
}
```

### Candidates

#### GET /api/candidates
List candidates for organization.

**Headers**:
- `Authorization: Bearer {token}`
- `X-Org-Id: {orgId}`

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20)
- `search` (optional): Search term

**Response**:
```json
{
  "candidates": [
    {
      "id": "uuid",
      "orgId": "uuid",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "phone": "+1234567890",
      "resumeUrl": "https://...",
      "skills": ["React", "TypeScript"],
      "experienceLevel": "mid",
      "totalYearsExperience": 5
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

#### GET /api/candidates/:id
Get single candidate.

**Headers**:
- `Authorization: Bearer {token}`
- `X-Org-Id: {orgId}`

**Response**:
```json
{
  "id": "uuid",
  "orgId": "uuid",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "resumeUrl": "https://...",
  "skills": ["React", "TypeScript", "Node.js"],
  "skillLevels": { "React": 5, "TypeScript": 4, "Node.js": 4 },
  "experienceLevel": "mid",
  "totalYearsExperience": 5,
  "summary": "Experienced full-stack developer...",
  "linkedinUrl": "https://linkedin.com/in/janedoe",
  "createdAt": "2025-10-01T10:00:00Z"
}
```

#### POST /api/candidates
Create candidate.

**Headers**:
- `Authorization: Bearer {token}`
- `X-Org-Id: {orgId}`
- `X-User-Id: {userId}`

**Request**:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "resumeUrl": "https://...",
  "skills": ["React", "TypeScript"],
  "experienceLevel": "mid"
}
```

**Response**:
```json
{
  "id": "uuid",
  "orgId": "uuid",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "createdAt": "2025-10-24T10:00:00Z"
}
```

#### PUT /api/candidates/:id
Update candidate.

**Headers**:
- `Authorization: Bearer {token}`
- `X-Org-Id: {orgId}`
- `X-User-Id: {userId}`

**Request**:
```json
{
  "name": "Jane Smith",
  "phone": "+1987654321",
  "skills": ["React", "TypeScript", "Python"]
}
```

### Jobs

#### GET /api/jobs
List jobs for organization.

**Headers**:
- `Authorization: Bearer {token}`
- `X-Org-Id: {orgId}`

**Query Parameters**:
- `page` (optional): Page number
- `limit` (optional): Results per page
- `status` (optional): Filter by status

**Response**:
```json
{
  "jobs": [
    {
      "id": "uuid",
      "orgId": "uuid",
      "title": "Senior React Developer",
      "location": "San Francisco, CA",
      "jobType": "full-time",
      "status": "open",
      "public_slug": "senior-react-developer-abc123",
      "publishedAt": "2025-10-01T00:00:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 25 }
}
```

#### POST /api/jobs
Create job.

**Headers**:
- `Authorization: Bearer {token}`
- `X-Org-Id: {orgId}`
- `X-User-Id: {userId}`

**Request**:
```json
{
  "title": "Senior React Developer",
  "description": "We are looking for...",
  "location": "San Francisco, CA",
  "jobType": "full-time",
  "remoteOption": "hybrid",
  "salaryRange": "$120k - $180k",
  "experienceLevel": "senior",
  "clientId": "uuid"
}
```

**Response**:
```json
{
  "id": "uuid",
  "orgId": "uuid",
  "title": "Senior React Developer",
  "status": "draft",
  "createdAt": "2025-10-24T10:00:00Z"
}
```

#### POST /api/jobs/:id/publish
Publish job to public careers page.

**Headers**:
- `Authorization: Bearer {token}`
- `X-Org-Id: {orgId}`
- `X-User-Id: {userId}`

**Response**:
```json
{
  "publicUrl": "https://hildebrand.talentpatriot.com/careers/senior-react-developer-abc123",
  "job": {
    "id": "uuid",
    "slug": "senior-react-developer-abc123",
    "status": "open",
    "published_at": "2025-10-24T10:00:00Z"
  }
}
```

### Pipeline

#### GET /api/pipeline/:orgId/:jobId
Get pipeline for specific job.

**Headers**:
- `Authorization: Bearer {token}`
- `X-Org-Id: {orgId}`

**Response**:
```json
{
  "columns": [
    {
      "id": "uuid",
      "title": "Applied",
      "position": 0,
      "candidates": [
        {
          "id": "uuid",
          "candidateId": "uuid",
          "candidateName": "Jane Doe",
          "candidateEmail": "jane@example.com",
          "stage": "applied",
          "createdAt": "2025-10-20T10:00:00Z"
        }
      ]
    },
    {
      "id": "uuid",
      "title": "Phone Screen",
      "position": 1,
      "candidates": []
    }
  ]
}
```

#### POST /api/pipeline/move
Move candidate to different stage.

**Headers**:
- `Authorization: Bearer {token}`
- `X-Org-Id: {orgId}`
- `X-User-Id: {userId}`

**Request**:
```json
{
  "jobCandidateId": "uuid",
  "newStage": "phone_screen",
  "newColumnId": "uuid"
}
```

**Response**:
```json
{
  "success": true,
  "jobCandidate": {
    "id": "uuid",
    "stage": "phone_screen",
    "pipelineColumnId": "uuid",
    "updatedAt": "2025-10-24T10:00:00Z"
  }
}
```

### Analytics

#### GET /api/analytics/dashboard-stats
Get dashboard statistics.

**Headers**:
- `Authorization: Bearer {token}`
- `X-Org-Id: {orgId}`

**Response**:
```json
{
  "totalJobs": 25,
  "totalCandidates": 150,
  "totalApplications": 200,
  "totalHires": 12,
  "jobsThisMonth": 5,
  "candidatesThisMonth": 30,
  "applicationsThisMonth": 45,
  "hiresThisMonth": 3
}
```

#### GET /api/reports/metrics
Get source tracking metrics.

**Headers**:
- `Authorization: Bearer {token}`
- `X-Org-Id: {orgId}`

**Response**:
```json
{
  "sources": [
    {
      "source": "Company Website",
      "applications": 45,
      "hires": 12
    },
    {
      "source": "LinkedIn",
      "applications": 35,
      "hires": 8
    },
    {
      "source": "Indeed",
      "applications": 35,
      "hires": 5
    }
  ]
}
```

### Public APIs (No Auth Required)

#### GET /api/public/jobs/:orgSlug
Get public job listings for organization.

**Response**:
```json
{
  "organization": {
    "name": "Hildebrand Consulting Services",
    "slug": "hildebrand"
  },
  "jobs": [
    {
      "id": "uuid",
      "title": "Senior React Developer",
      "location": "San Francisco, CA",
      "jobType": "full-time",
      "remoteOption": "hybrid",
      "salaryRange": "$120k - $180k",
      "public_slug": "senior-react-developer-abc123"
    }
  ]
}
```

#### POST /api/public/jobs/:jobId/apply
Submit job application (public).

**Request**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "resumeUrl": "https://...",
  "coverLetter": "I am excited to apply...",
  "source": "LinkedIn"
}
```

**Response**:
```json
{
  "success": true,
  "candidateId": "uuid",
  "applicationId": "uuid"
}
```

## Data Relationships

```
organizations (1) ─── (M) user_organizations (M) ─── (1) user_profiles
      │                                                        │
      ├─── (M) clients                                        │
      ├─── (M) jobs ─── (M) job_candidate (M) ─── candidates─┘
      ├─── (M) pipeline_columns                     │
      ├─── (M) messages                             │
      ├─── (M) interviews ──────────────────────────┘
      ├─── (M) application_metadata
      └─── (M) connected_accounts
```

## Type System

### Shared Types

All types are exported from `shared/schema.ts` for frontend-backend consistency.

#### Select Types (Database Rows)

```typescript
import type { 
  Candidate,
  Job,
  Client,
  Organization,
  UserProfile
} from '@shared/schema';

// Usage
const candidate: Candidate = await storage.candidates.getCandidate(id);
```

#### Insert Types (For Creating Records)

```typescript
import type { 
  InsertCandidate,
  InsertJob,
  InsertClient
} from '@shared/schema';

// Usage
const newCandidate: InsertCandidate = {
  orgId: 'uuid',
  name: 'Jane Doe',
  email: 'jane@example.com',
  skills: ['React', 'TypeScript']
};
```

#### Zod Validation Schemas

```typescript
import { 
  insertCandidateSchema,
  insertJobSchema,
  insertClientSchema
} from '@shared/schema';

// Validate request body
const validatedData = insertCandidateSchema.parse(req.body);
```

### Custom Schemas

Extend base schemas for specific use cases:

```typescript
import { insertCandidateSchema } from '@shared/schema';
import { z } from 'zod';

// Add custom validation
const candidateFormSchema = insertCandidateSchema.extend({
  password: z.string().min(8),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});
```

## Related Documentation

- [Overview Documentation](./overview.md) - Project architecture
- [Routes Documentation](./routes.md) - API routing
- [Dashboard Documentation](./dashboard.md) - Analytics queries
- [Authentication Documentation](./auth.md) - User and organization context
