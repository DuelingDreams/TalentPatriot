# Overview

This full-stack Applicant Tracking System (ATS) web application is designed for small to mid-sized businesses (5-500 employees) to modernize recruitment. It provides a lightweight, candidate-friendly experience with features such as a modern dashboard, recruitment pipeline management, client and candidate tracking, and internal team communication, aiming to enhance collaboration and improve the recruitment process. The project envisions offering free beta access to early users for feedback and validation before a public launch.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend
- **Framework**: React with TypeScript, Wouter for routing.
- **UI**: Radix UI components with Tailwind CSS and Shadcn/ui.
- **State Management**: TanStack React Query.
- **Build Tool**: Vite.
- **Design**: Light mode, soft gray backgrounds, rounded cards, consistent TalentPatriot branding (Navy, Soft Blue, Light Gray, Inter font), focusing on professional UI/UX, modern analytics, enhanced popover/modal UX, and accessibility.

## Backend
- **Framework**: Express.js with TypeScript.
- **API**: RESTful endpoints with Zod validation, centralized error handling.
- **Authentication**: Mock user system for development, Supabase Auth for production with RBAC and RLS.

## Data Storage
- **ORM**: Drizzle ORM.
- **Database**: PostgreSQL via Supabase.
- **Schema**: ATS-specific tables, UUID primary keys, `org_id` foreign keys for multi-tenancy.
- **Migrations**: Drizzle-kit.
- **Key Decisions**: Multi-tenancy, RBAC with Row-Level Security, dynamic Kanban-style pipeline system, performance optimization (indexing, caching, materialized views, full-text search), UUID-based security, comprehensive onboarding workflow, and user-organization assignment API.

## Core Features
- Applicant Tracking (client, job, candidate management).
- Job-specific Kanban pipelines with Realtime updates.
- End-to-end recruitment workflow.
- Public careers portal with application forms and file upload.
- Candidate notes with privacy controls.
- Interview scheduling with Google Calendar integration (creating events with Meet links, FreeBusy API for availability).
- 5-step user onboarding.
- Internal team messaging.
- Dashboard with analytics.
- Resume management (upload, preview, private Supabase Storage with RLS and signed URLs).
- AI resume parsing & enhancement (OpenAI GPT-4o).
- AI Insights for recruitment recommendations.
- Comprehensive in-app documentation system (`/docs`).
- Professional About page and enhanced support infrastructure.

# External Dependencies

- **Database**: Supabase (PostgreSQL).
- **UI Components**: Radix UI, Shadcn/ui.
- **Styling**: Tailwind CSS.
- **Icons**: Lucide React.
- **Date Handling**: date-fns.
- **Charting**: Recharts.
- **Image Upload**: Multer.
- **Security**: HaveIBeenPwned.org.
- **OAuth Providers**: Google (manual OAuth 2.0), Microsoft.
- **Email Service**: SendGrid.
- **AI**: OpenAI GPT-4o.
- **Google APIs**: googleapis npm package for Calendar, Meet, and FreeBusy API.

# Recent Features & Fixes (November 2025)

## Resume Upload & Application Bug Fixes (Nov 24)
- **Critical Bugs Fixed**: Two-part failure preventing job applications from being submitted.
  1. Resume uploads failing with 403 "Job not available" error
  2. Application submission failing with 500 "Invalid resume URL" error after successful upload
- **Root Causes**: 
  1. Upload endpoint checked for non-existent `status='published'` when actual state is `status='open'`
  2. Validation function rejected new storage path format (`orgId/jobId/resume_xxx.ext`) expecting only full URLs
- **Solutions**: 
  1. Changed status check in `server/routes/upload.ts` line 188 to `job.status !== 'open'`
  2. Updated `validateResumeUrl()` in `server/storage/jobs/repository.ts` to accept storage paths via regex pattern matching
- **Impact**: End-to-end job application flow now works; backward compatible with legacy URL format.
- **Files**: `server/routes/upload.ts`, `server/storage/jobs/repository.ts`, `BUGFIX_RESUME_UPLOAD.md`

## AI-Powered Resume Parsing (Nov 24)
- **Comprehensive Data Extraction**: Implemented OpenAI GPT-4o resume parsing to extract structured data including work experience history, projects, languages, and certifications.
- **Text Extraction Service**: Created service to extract text from PDF and DOCX files using pdf-parse and mammoth libraries.
- **Database Schema Expansion**: Added new JSONB fields (work_experience, projects) and array fields (languages, certifications) to candidates table.
- **Parsing Status Tracking**: Implemented status enum ('pending', 'processing', 'completed', 'failed') with error message storage.
- **Auto-Parsing Trigger**: Automatically parses resumes when candidates are created with resumeUrl, running asynchronously without blocking responses.
- **Enhanced Search**: Generates searchable_content field for full-text candidate search across all resume data.
- **Repository Integration**: Moved parseAndUpdateCandidateFromStorage() from legacy to modular repository architecture.
- **Files**: `server/textExtraction.ts`, `server/resumeParser.ts`, `server/storage/candidates/repository.ts`, `database/resume_parsing_upgrade.sql`, `RESUME_PARSING_IMPLEMENTATION.md`, `TESTING_RESUME_PARSING.md`

## Resume Insights UI & PDF Viewer Enhancements (Nov 24)
- **ResumeInsights Component**: Created comprehensive UI to display all AI-parsed resume data on candidate profiles.
  - Professional summary card
  - Work experience timeline with achievements
  - Projects portfolio with technologies
  - Skills, languages, and certifications badges
  - Parsing status indicators (pending, processing, completed, failed)
  - Empty states and error handling
- **Defensive Data Parsing**: Implemented comprehensive error handling to prevent UI crashes.
  - All JSON fields wrapped in try/catch blocks
  - Array.isArray() validation for all parsed arrays
  - Nested array validation (achievements, technologies)
  - Dual field access for camelCase/snake_case compatibility
  - Console warnings for debugging malformed data
- **PDF Viewer Improvements**: Enhanced resume preview component with auto-refresh for expired signed URLs.
  - Storage path guard before refresh attempt
  - Force re-render with document key increment
  - Page number reset on URL refresh
  - Proper error states with fallback actions
- **CandidateProfile Integration**: Added Resume Insights section to Overview tab below resume upload/preview.
  - All resume consumers support both camelCase and snake_case data formats
  - Download, preview, and upload components work across API response formats
- **Files**: `client/src/components/candidates/ResumeInsights.tsx`, `client/src/features/candidates/pages/CandidateProfile.tsx`, `client/src/components/resume/ResumePreview.tsx`

## Case Conversion Utilities Centralization (Nov 24)
- **Shared Utility Creation** (`shared/utils/caseConversion.ts`):
  - Centralized `toCamelCase()` and `toSnakeCase()` functions
  - Recursive conversion for nested objects and arrays
  - Plain object detection to preserve Date, RegExp, and other special objects
  - Batch conversion helpers: `arrayToCamelCase()` and `arrayToSnakeCase()`
- **Backend Refactoring**:
  - Removed duplicated conversion functions from `server/storage/auth/repository.ts`
  - Removed duplicated conversion functions from `server/storage/communications/repository.ts`
  - Both now import from shared utility for consistency
- **Frontend Refactoring**:
  - Updated `ResumeInsights` component to use `toCamelCase()` for data normalization
  - Updated `CandidateProfile` component to normalize candidate data once at the top
  - Eliminated all manual dual-field access patterns (`candidate?.resume_url || (candidate as any)?.resumeUrl`)
  - Cleaner code with proper destructuring and no type assertions
- **Benefits**: Single source of truth for case conversion, eliminated code duplication, cleaner and more maintainable code
- **Files**: `shared/utils/caseConversion.ts`, `server/storage/auth/repository.ts`, `server/storage/communications/repository.ts`, `client/src/components/candidates/ResumeInsights.tsx`, `client/src/features/candidates/pages/CandidateProfile.tsx`

## Manual Resume Parsing & Org ID Fixes (Nov 25)
- **Manual Resume Parsing Endpoint**: Created POST `/api/candidates/:id/parse-resume` for manually triggering resume parsing
  - Fixed duplicate route conflict (removed conflicting route at line 2447)
  - Added detailed logging for debugging
  - Fixed header access to use `req.get('x-org-id')` for case-insensitive access
  - Legacy candidates with null org_id are now allowed to trigger parsing
- **UI Button**: Added "Analyze Resume" button to ResumeInsights component for pending/failed parsing states
  - Uses apiRequest which auto-includes x-org-id from session storage
  - Shows loading state and auto-refreshes page after 5 seconds
- **Files**: `server/routes.ts`, `client/src/components/candidates/ResumeInsights.tsx`

## Skills Analytics with Categories (Nov 26)
- **New Database View**: `v_candidate_skills_flattened` replaces `mv_skills_analytics`
  - Directly queries `candidates` table for real skill data
  - Uses `LATERAL unnest(c.skills)` to flatten skills array
  - Assigns skill categories: Programming Language, Cloud/DevOps, Framework/Library, Other
  - Includes `org_id` for multi-tenant filtering
- **Backend Updates**: 
  - `/api/reports/metrics` aggregates skills by name and category
  - Returns `topSkills` with `skillCategory` field and `skillCategorySummary` array
  - `/api/analytics/skills-demand` also updated for new view
- **Frontend Enhancements**:
  - Top Skills in Demand: Shows skill name with color-coded category badge
  - Skills by Category: Horizontal bar chart showing candidate count per category
  - Category Summary: Grid of cards with total candidates and unique skills per category
  - Empty states when no skill data available
- **Files**: `server/routes.ts`, `client/src/features/analytics/pages/Reports.tsx`, `database/v_candidate_skills_flattened.sql`

## Dashboard Redesign (Nov 26)
- **Sidebar Redesign**: Dark navy background (#1F2937) with simplified navigation
  - Removed Calendar, Email Settings, Help, Integrations from main nav
  - Added Settings to main navigation
  - Active state uses lighter background (#3B5068)
  - White text with gray-300 for inactive items
- **Two-Column Dashboard Layout**: Responsive grid layout
  - Left column: Today's Work, Quick Actions, Recent Activity
  - Right column: Pipeline Snapshot, Insights & Trends
- **Today's Work**: Simplified to 2 metrics (Review Candidates, Interviews Today)
- **Quick Actions**: Clean 2x2 grid with icons (Schedule Interview, Review Applications, Send Updates, Generate Report)
- **Pipeline Snapshot**: Horizontal progress bars per job with colored indicators
- **Insights & Trends**: New component with 4 stat cards (Open Positions, Total Candidates, Active Candidates, Hired This Month) with percentage indicators
- **Recent Activity**: Updated styling with smaller avatars, compact layout
- **Header**: "See All Pipelines" button replaces Post New Job and Refresh indicator
- **Removed**: Smart Alerts, Smart Hiring Tips, Jobs Chart sections
- **Files**: `client/src/components/layout/Sidebar.tsx`, `client/src/features/analytics/pages/Dashboard.tsx`, `client/src/features/analytics/components/TodaysWork.tsx`, `client/src/features/analytics/components/SimpleQuickActions.tsx`, `client/src/features/analytics/components/PipelineSnapshot.tsx`, `client/src/features/analytics/components/InsightsTrends.tsx`, `client/src/features/analytics/components/RecentActivity.tsx`

# Architecture Decisions

## Case Conversion Strategy (camelCase ↔ snake_case)
- **Frontend**: Uses camelCase (JavaScript/TypeScript convention)
- **Database**: Uses snake_case (PostgreSQL convention)
- **Conversion Layer**: Shared utilities in `shared/utils/caseConversion.ts`
- **Rationale**: 
  - JavaScript convention is camelCase (variables, props, functions)
  - SQL/PostgreSQL convention is snake_case (column names)
  - Converting at API boundary is cleaner than forcing one convention everywhere
  - npm libraries expect camelCase - using snake_case would create friction
  - Drizzle ORM types in `shared/schema.ts` use camelCase for TypeScript compatibility
  - Single conversion layer is minimal cost for keeping each layer idiomatic

## Org ID in Public Job Applications
- **Current Behavior**: `applyToJob()` in `server/storage/jobs/repository.ts` correctly derives `org_id` from the job record (line 946)
- **Flow**: Public applicant → job lookup by ID → extract `job.org_id` → create candidate with that org_id
- **Legacy Issue**: Earlier candidates may have null org_id if created before this logic was implemented
- **Auto-Fix**: GET candidate endpoints auto-update candidates with null org_id when accessed with valid header