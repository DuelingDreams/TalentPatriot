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