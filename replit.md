# Overview

This full-stack Applicant Tracking System (ATS) web application aims to modernize recruitment for small to mid-sized businesses (5-500 employees). It provides a lightweight, candidate-friendly experience with features such as a modern dashboard, recruitment pipeline management, client and candidate tracking, and internal team communication. The project focuses on enhancing collaboration, improving the recruitment process, and offers free beta access to early users for feedback.

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
- **Authentication**: Supabase Auth with RBAC and RLS.

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
- Interview scheduling with Google Calendar integration.
- 5-step user onboarding.
- Internal team messaging.
- Dashboard with analytics.
- Resume management (upload, preview, private Supabase Storage with RLS and signed URLs).
- AI resume parsing & enhancement (OpenAI GPT-4o).
- AI Insights for recruitment recommendations.
- Comprehensive in-app documentation system (`/docs`).
- Skills analytics with categorized skills.

## Architecture Decisions
- **Case Conversion Strategy**: Frontend uses `camelCase`, database uses `snake_case`. Conversion handled by shared utilities in `shared/utils/caseConversion.ts` at the API boundary to maintain idiomatic conventions for each layer.
- **Org ID in Public Job Applications**: `org_id` derived from the job record for public applications. Legacy candidates with null `org_id` are auto-updated upon access.
- **OAuth Session Storage**: Migrated from in-memory to PostgreSQL-backed sessions in Supabase (`oauth_sessions` table) with hashed tokens, nonce for CSRF, and 10-minute TTL. `connected_accounts` table tracks health status of external integrations.

# External Dependencies

- **Database**: Supabase (PostgreSQL).
- **UI Components**: Radix UI, Shadcn/ui.
- **Styling**: Tailwind CSS.
- **Icons**: Lucide React.
- **Date Handling**: date-fns.
- **Charting**: Recharts.
- **Image Upload**: Multer.
- **Security**: HaveIBeenPwned.org.
- **OAuth Providers**: Google, Microsoft.
- **Email Service**: SendGrid.
- **AI**: OpenAI GPT-4o.
- **Google APIs**: googleapis npm package for Calendar, Meet, and FreeBusy API.