# TalentPatriot ATS - Database Schema Report
**Generated:** 2025-07-24T18:51:30.882Z
**Source:** Application Schema Definition + Database Analysis
**Database:** PostgreSQL (Supabase)

## Schema Overview

This report documents the complete database schema for the TalentPatriot ATS application, including all tables, relationships, and security policies.

## Tables & Columns

The TalentPatriot ATS database consists of **11 core tables** designed for multi-tenant operation with organization-based data isolation.

### user_profiles

**User profile information with role-based access**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | Primary key |
| role | user_role_enum | ✗ | - | User role (recruiter, bd, pm, demo_viewer, admin) |
| created_at | timestamp with time zone | ✗ | now() | undefined |
| updated_at | timestamp with time zone | ✗ | now() | undefined |

### organizations

**Organization/company entities for multi-tenant isolation**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | Primary key |
| name | text | ✗ | - | Organization name |
| slug | text | ✗ | - | Unique slug for organization |
| owner_id | uuid | ✗ | - | Organization owner user ID |
| created_at | timestamp with time zone | ✗ | now() | undefined |
| updated_at | timestamp with time zone | ✗ | now() | undefined |

**Foreign Keys:**
- `owner_id` → `user_profiles.id`

### user_organizations

**Many-to-many relationship between users and organizations with roles**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | Primary key |
| user_id | uuid | ✗ | - | User ID |
| org_id | uuid | ✗ | - | Organization ID |
| role | org_role_enum | ✗ | - | Role within organization |
| created_at | timestamp with time zone | ✗ | now() | undefined |
| updated_at | timestamp with time zone | ✗ | now() | undefined |

**Foreign Keys:**
- `user_id` → `user_profiles.id`
- `org_id` → `organizations.id`

### clients

**Client companies that post job opportunities**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | Primary key |
| name | text | ✗ | - | Client company name |
| org_id | uuid | ✗ | - | Organization ID for data isolation |
| industry | text | ✓ | - | Industry sector |
| location | text | ✓ | - | Client location |
| website | text | ✓ | - | Company website |
| contact_name | text | ✓ | - | Primary contact name |
| contact_email | text | ✓ | - | Primary contact email |
| contact_phone | text | ✓ | - | Primary contact phone |
| notes | text | ✓ | - | Internal notes |
| status | record_status_enum | ✗ | 'active' | Record status |
| created_by | uuid | ✓ | - | Created by user ID |
| created_at | timestamp with time zone | ✗ | now() | undefined |
| updated_at | timestamp with time zone | ✗ | now() | undefined |

**Foreign Keys:**
- `org_id` → `organizations.id`
- `created_by` → `user_profiles.id`

### jobs

**Job postings linked to client companies**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | Primary key |
| title | text | ✗ | - | Job title |
| description | text | ✓ | - | Job description |
| client_id | uuid | ✗ | - | Associated client ID |
| org_id | uuid | ✗ | - | Organization ID for data isolation |
| status | job_status_enum | ✗ | 'open' | Job status |
| assigned_to | uuid | ✓ | - | Assigned recruiter ID |
| record_status | record_status_enum | ✗ | 'active' | Record status |
| created_by | uuid | ✓ | - | Created by user ID |
| created_at | timestamp with time zone | ✗ | now() | undefined |
| updated_at | timestamp with time zone | ✗ | now() | undefined |

**Foreign Keys:**
- `client_id` → `clients.id`
- `org_id` → `organizations.id`
- `assigned_to` → `user_profiles.id`
- `created_by` → `user_profiles.id`

### candidates

**Candidate profiles and resumes**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | Primary key |
| name | text | ✗ | - | Candidate full name |
| email | text | ✗ | - | Candidate email |
| phone | text | ✓ | - | Candidate phone number |
| resume_url | text | ✓ | - | Resume file URL or link |
| org_id | uuid | ✗ | - | Organization ID for data isolation |
| status | record_status_enum | ✗ | 'active' | Record status |
| created_by | uuid | ✓ | - | Created by user ID |
| created_at | timestamp with time zone | ✗ | now() | undefined |
| updated_at | timestamp with time zone | ✗ | now() | undefined |

**Foreign Keys:**
- `org_id` → `organizations.id`
- `created_by` → `user_profiles.id`

### job_candidate

**Many-to-many relationship between jobs and candidates with pipeline stage**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | Primary key |
| job_id | uuid | ✗ | - | Job ID |
| candidate_id | uuid | ✗ | - | Candidate ID |
| org_id | uuid | ✗ | - | Organization ID for data isolation |
| stage | candidate_stage_enum | ✗ | 'applied' | Pipeline stage |
| notes | text | ✓ | - | Application notes |
| assigned_to | uuid | ✓ | - | Assigned recruiter ID |
| status | record_status_enum | ✗ | 'active' | Record status |
| created_at | timestamp with time zone | ✗ | now() | undefined |
| updated_at | timestamp with time zone | ✗ | now() | undefined |

**Foreign Keys:**
- `job_id` → `jobs.id`
- `candidate_id` → `candidates.id`
- `org_id` → `organizations.id`
- `assigned_to` → `user_profiles.id`

### candidate_notes

**Detailed notes for candidate applications**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | Primary key |
| job_candidate_id | uuid | ✗ | - | Job-candidate relationship ID |
| org_id | uuid | ✗ | - | Organization ID for data isolation |
| author_id | uuid | ✗ | - | Note author user ID |
| content | text | ✗ | - | Note content |
| is_internal | boolean | ✗ | true | Internal note flag |
| created_at | timestamp with time zone | ✗ | now() | undefined |
| updated_at | timestamp with time zone | ✗ | now() | undefined |

**Foreign Keys:**
- `job_candidate_id` → `job_candidate.id`
- `org_id` → `organizations.id`
- `author_id` → `user_profiles.id`

### interviews

**Interview scheduling and management**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | Primary key |
| job_candidate_id | uuid | ✗ | - | Job-candidate relationship ID |
| org_id | uuid | ✗ | - | Organization ID for data isolation |
| title | text | ✗ | - | Interview title |
| type | interview_type_enum | ✗ | - | Interview type |
| status | interview_status_enum | ✗ | 'scheduled' | Interview status |
| scheduled_at | timestamp with time zone | ✗ | - | Scheduled date/time |
| duration | text | ✓ | - | Interview duration |
| location | text | ✓ | - | Interview location |
| interviewer_id | uuid | ✓ | - | Interviewer user ID |
| notes | text | ✓ | - | Interview notes |
| feedback | text | ✓ | - | Interview feedback |
| rating | text | ✓ | - | Interview rating |
| record_status | record_status_enum | ✗ | 'active' | Record status |
| created_at | timestamp with time zone | ✗ | now() | undefined |
| updated_at | timestamp with time zone | ✗ | now() | undefined |

**Foreign Keys:**
- `job_candidate_id` → `job_candidate.id`
- `org_id` → `organizations.id`
- `interviewer_id` → `user_profiles.id`

### messages

**Internal team messaging system**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | Primary key |
| type | message_type_enum | ✗ | - | Message type |
| org_id | uuid | ✗ | - | Organization ID for data isolation |
| priority | message_priority_enum | ✗ | 'normal' | Message priority |
| subject | text | ✗ | - | Message subject |
| content | text | ✗ | - | Message content |
| sender_id | uuid | ✗ | - | Sender user ID |
| recipient_id | uuid | ✓ | - | Direct recipient user ID |
| client_id | uuid | ✓ | - | Related client ID |
| job_id | uuid | ✓ | - | Related job ID |
| candidate_id | uuid | ✓ | - | Related candidate ID |
| is_read | boolean | ✗ | false | Read status |
| read_at | timestamp with time zone | ✓ | - | Read timestamp |
| is_archived | boolean | ✗ | false | Archived status |
| tags | text[] | ✓ | - | Message tags |
| record_status | record_status_enum | ✗ | 'active' | Record status |
| created_at | timestamp with time zone | ✗ | now() | undefined |
| updated_at | timestamp with time zone | ✗ | now() | undefined |

**Foreign Keys:**
- `org_id` → `organizations.id`
- `sender_id` → `user_profiles.id`
- `recipient_id` → `user_profiles.id`
- `client_id` → `clients.id`
- `job_id` → `jobs.id`
- `candidate_id` → `candidates.id`

### message_recipients

**Message delivery tracking for multiple recipients**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | ✗ | gen_random_uuid() | Primary key |
| message_id | uuid | ✗ | - | Message ID |
| user_id | uuid | ✗ | - | Recipient user ID |
| is_read | boolean | ✗ | false | Read status |
| read_at | timestamp with time zone | ✓ | - | Read timestamp |
| created_at | timestamp with time zone | ✗ | now() | undefined |

**Foreign Keys:**
- `message_id` → `messages.id`
- `user_id` → `user_profiles.id`

## ENUM Types

The database uses several ENUM types for data validation and consistency:

### user_role_enum
- `recruiter` - Standard recruiter access
- `bd` - Business development role
- `pm` - Project manager role
- `demo_viewer` - Demo account with restricted access
- `admin` - Administrative access

### org_role_enum
- `owner` - Organization owner
- `admin` - Organization administrator
- `recruiter` - Organization recruiter
- `viewer` - Read-only access

### job_status_enum
- `open` - Job is actively recruiting
- `closed` - Job is no longer recruiting
- `on_hold` - Job recruitment is paused
- `filled` - Job has been filled

### candidate_stage_enum
- `applied` - Initial application
- `screening` - Phone/initial screening
- `interview` - In-person/video interview
- `technical` - Technical assessment
- `final` - Final round interview
- `offer` - Offer extended
- `hired` - Candidate hired
- `rejected` - Candidate rejected

### record_status_enum
- `active` - Active record
- `demo` - Demo data record
- `archived` - Archived record

## Row Level Security (RLS) Policies

The TalentPatriot ATS implements comprehensive Row Level Security policies to ensure multi-tenant data isolation and role-based access control.

### Security Model

**Multi-Tenant Architecture:**
- All core tables include `org_id` for organization-based data isolation
- Users can only access data from organizations they belong to via `user_organizations` table
- Demo users have special access to demo-specific data only

**Role-Based Access Control:**
- **Owner/Admin:** Full CRUD access to all organization data
- **Recruiter:** Full access to candidates, jobs, and clients
- **BD (Business Development):** Access to clients and jobs, limited candidate access
- **PM (Project Manager):** Read access to most data, limited write access
- **Demo Viewer:** Read-only access to demo data only

### Policy Implementation

Each table has RLS policies that:
1. **Organization Filtering:** Users only see data from their organizations
2. **Role-Based Permissions:** Different access levels based on user role
3. **Demo Data Isolation:** Demo users see only demo data, real users don't see demo data
4. **Author-Based Access:** Some tables (like candidate_notes) restrict access to authors

## Database Features

### Performance Optimizations
- **Indexes:** Strategic indexes on org_id, foreign keys, and frequently queried fields
- **Query Optimization:** Optimized queries for dashboard analytics and search
- **Connection Pooling:** Supabase connection pooling for scalability

### Security Features
- **Row Level Security:** Comprehensive RLS policies on all tables
- **Role-Based Access:** Fine-grained permissions based on user roles
- **Data Isolation:** Complete separation between organizations and demo data
- **Audit Trail:** Created/updated timestamps and author tracking

### Multi-Tenant Support
- **Organization Scoping:** All data scoped to organizations
- **User-Organization Mapping:** Flexible many-to-many user-organization relationships
- **Demo Mode:** Isolated demo environment with sample data

## Migration & Deployment

### Required Migration Scripts
1. **supabase-complete-migration.sql** - Complete database schema setup
2. **supabase-security-fixes.sql** - Enable Row Level Security
3. **Performance indexes** - Already included in migration scripts

### Deployment Checklist
- ✅ Run complete migration script in Supabase SQL Editor
- ✅ Apply RLS policies via security fixes script
- ✅ Verify demo organization and data setup
- ✅ Test role-based access with different user types
- ✅ Confirm organization data isolation

## Summary

The TalentPatriot ATS database is designed as an enterprise-grade, multi-tenant system with:

- **11 Core Tables** for complete ATS functionality
- **Multi-Tenant Architecture** with organization-based data isolation
- **Role-Based Security** with 5 different access levels
- **Demo Mode Support** with isolated sample data
- **Performance Optimizations** including strategic indexing
- **Comprehensive Security** via Row Level Security policies
- **Scalable Design** supporting multiple organizations and users

### Key Relationships
- **User → Organizations:** Many-to-many via user_organizations
- **Organization → Clients:** One-to-many
- **Clients → Jobs:** One-to-many
- **Jobs ↔ Candidates:** Many-to-many via job_candidate
- **Candidates → Notes:** One-to-many candidate_notes
- **Applications → Interviews:** One-to-many
- **Users → Messages:** Many-to-many via message_recipients

---
*Schema report generated by TalentPatriot ATS Database Analyzer*
