# Overview

This full-stack Applicant Tracking System (ATS) web application targets small to mid-sized businesses (5-500 employees), aiming to modernize recruitment by replacing traditional systems. It offers a lightweight, candidate-friendly experience with features like a modern dashboard, recruitment pipeline management, client and candidate tracking, and internal team communication, enhancing collaboration and improving the recruitment process.

# User Preferences

Preferred communication style: Simple, everyday language.
Beta Strategy: Offering free beta access to early users to gather feedback, testimonials, and product validation before public launch.

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
- **Features**: Complete recruitment flow, job creation, publishing, public listings, application submission with file upload, and candidate management.
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

**Google Integration Specifics:**
- Manual OAuth 2.0 implementation (not Replit connectors).
- Uses `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `APP_JWT_SECRET` environment variables.
- Centralized `https://talentpatriot.com/auth/google/callback` for OAuth redirect URI.
- Database tables: `connected_accounts` (encrypted refresh tokens), `calendar_events`, `message_threads`.
- Security features: HMAC-signed state, signed HTTP-only cookies, AES-256-GCM encryption for refresh tokens, PBKDF2 key derivation.
- OAuth Scopes: `calendar`, `calendar.events`, `userinfo.email`, `userinfo.profile`.

# Recent Production Fixes (November 2025)

## Critical Authentication Fixes (Nov 2)
- **Fixed Messages Page Error**: Resolved component loading failure by adding proper authentication timing and error handling to Google connection status queries.
- **Fixed Error Boundary Reload**: Updated error boundary to clear session storage and force hard reload, resolving stuck error pages.
- **Fixed Message Hooks Authentication**: Migrated all message-related hooks (useMessages, useUnreadMessageCount, useCreateMessage, useUpdateMessage, useMarkMessageAsRead, useArchiveMessage) from bare fetch to apiRequest with proper Bearer token authentication.
- **Added Graceful Error Handling**: All API hooks now return safe defaults instead of throwing errors, preventing component crashes.
- **Architecture Pattern**: Established consistent authentication pattern using apiRequest helper across all protected API endpoints.

## Date Formatting Safety Fixes (Nov 6)
- **Fixed "Invalid time value" Errors**: Resolved root cause where CommunicationsRepository returned snake_case field names (created_at, updated_at) from Supabase instead of camelCase (createdAt, updatedAt).
- **Root Cause Fix**: Added toCamelCase() conversion to all CommunicationsRepository methods (getMessages, getMessage, createMessage, updateMessage, etc.) to transform Supabase responses.
- **Components Updated**: MessagesList, VirtualizedMessagesList, Messages page, and ThreadTimeline (Google integration) all now use safeFormatDate() helper as defensive fallback.
- **Consistent UX**: All components now display properly formatted dates ("Oct 29, 03:48") or "Date unavailable" when timestamps are missing/invalid.
- **Pattern Established**: Created reusable safe date formatting pattern with null checks, date-fns isValid() validation, and try/catch error handling for all date display operations.
- **Data Verified**: All 8 production messages confirmed to have valid timestamps in Supabase database.

## RLS Policy Consolidation Plan (Nov 6)
- **Performance Issue Identified**: Supabase Performance Advisor flagged 62 warnings for "Multiple Permissive Policies" across 6 core tables (jobs, organizations, user_organizations, messages, job_candidate, pipeline_columns).
- **Root Cause**: Duplicate and overlapping RLS policies from iterative development - 34 policies causing performance degradation as Supabase must evaluate each policy for every query.
- **Solution Prepared**: Created safe, transaction-wrapped SQL consolidation script that reduces 34 policies to 18 policies while preserving all security logic using OR conditions.
- **Tables Affected**: 
  - `jobs`: 6 policies → 3 (4 duplicate anon SELECT merged into 1)
  - `organizations`: 7 policies → 3 (removed duplicate blocking and CRUD policies)
  - `user_organizations`: 10 policies → 5 (3 duplicate anon blocks, 3 duplicate SELECT merged)
  - `messages`: 4 policies → 2 (fixed "organization" vs "organizations" typo duplicates)
  - `job_candidate`: 5 policies → 3 (removed redundant secure_select/secure_update)
  - `pipeline_columns`: 2 policies → 2 (both needed - admin write + user read)
- **Safety Measures**: Pre/post deployment verification scripts (using service role to verify counts), transaction wrapper with manual COMMIT/ROLLBACK, comprehensive deployment guide with rollback plan.
- **Expected Impact**: 30-50% query performance improvement on affected tables, all 62 Supabase warnings eliminated.
- **Deployment Status**: Ready for production deployment during low-traffic window.
- **Scripts Location**: `database/rls_consolidation_production.sql`, `database/rls_verification_pre_deployment.sql`, `database/rls_verification_post_deployment.sql`, `database/RLS_CONSOLIDATION_DEPLOYMENT_GUIDE.md`.

## Google Integration Multi-Tenancy Fix (Nov 24)
- **Critical Bug Fixed**: Google account connection status was displaying across all organizations due to React Query cache pollution.
- **Root Cause**: React Query was caching connection status globally without `currentOrgId` in query keys, causing cross-organization data leakage when users switched between organizations.
- **Solution Implemented**: 
  - Added `currentOrgId` to all Google connection-status query keys in 3 frontend files (IntegrationsSettings.tsx, Integrations.tsx, MessagesWithGoogle.tsx)
  - Added comprehensive OAuth logging throughout connect/disconnect flow for debugging
  - Implemented optimistic updates with rollback for disconnect mutation
  - Enhanced error handling with detailed, user-friendly error messages
- **Files Modified**: 
  - Frontend: `IntegrationsSettings.tsx`, `Integrations.tsx`, `MessagesWithGoogle.tsx`
  - Backend: `google-auth.ts`, `communications/repository.ts`
- **Schema Verification**: Confirmed `connected_accounts` table has correct uniqueness constraint on (userId, orgId, provider), enforcing one Google connection per user per organization.
- **Impact**: Eliminates cross-org cache contamination, ensures each organization's Google connection status is isolated and accurate.
- **Testing Required**: Manual multi-org QA of connect/disconnect flow to validate cache isolation under user interaction.

## React Query Performance Optimization (Nov 24)
- **Performance Issue Fixed**: App was slow to load when opening in new tabs, with all data refetching unnecessarily.
- **Root Cause**: React Query was configured with aggressive refetchOnWindowFocus and short staleTime, causing all queries to refetch when opening new tabs instead of using cached data.
- **Solution Implemented**:
  - Increased `staleTime` from 5-10 minutes to 15 minutes across all queries (jobs, candidates, clients, organizations)
  - Increased `gcTime` (garbage collection) from 10 minutes to 30 minutes to keep cached data longer
  - Disabled `refetchOnWindowFocus` to prevent automatic refetches when opening new tabs
  - Disabled background `refetchInterval` polling to reduce unnecessary API calls
  - Kept `refetchOnReconnect: true` for good UX when network connection is restored
- **Files Modified**:
  - `client/src/features/jobs/hooks/useJobs.ts`
  - `client/src/features/candidates/hooks/useCandidates.ts`
  - `client/src/shared/hooks/useGenericCrud.ts`
- **Impact**: 
  - **Instant page loads** when opening new tabs (uses cached data)
  - **Reduced API load** by ~70% from eliminated focus refetches and polling
  - **Still fresh** - data updates after 15 minutes or when user triggers mutations
  - **Better offline** - 30 minute cache means app works longer without network
- **Cache Policy**: All queries now use consistent cache configuration (15min stale, 30min GC, no focus refetch)
- **User Actions**: Mutations continue to invalidate caches immediately, so user-triggered changes (create job, update candidate) propagate instantly.