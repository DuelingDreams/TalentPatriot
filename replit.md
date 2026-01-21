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
- **Design Token System**: Centralized CSS custom properties with Tailwind integration:
  - Primary: #1E3A5F (navy), Secondary: #14B8A6 (teal), Accent: #3F88C5
  - Cyan: #0EA5E9 (logo/brand highlight color for CTAs and gradients)
  - Semantic tokens: success (green), warning (amber), error (red), info (sky blue) with full 50-900 scales
  - Neutral gray scale (50-950) for consistent typography and backgrounds
  - TalentPatriot-specific tokens: tp-primary, tp-secondary, tp-accent, tp-cyan, tp-page, tp-card-surface
  - CSS variables in index.css, Tailwind tokens in tailwind.config.ts
- **Feature-Based Architecture** (Monolith):
  - `client/src/features/candidates/` - Candidate management (components, hooks, pages)
  - `client/src/features/jobs/` - Job postings and pipelines
  - `client/src/features/communications/` - Email, campaigns, calendar, messaging
  - `client/src/features/organization/` - Clients, org management
  - `client/src/features/analytics/` - Dashboard analytics and reports
  - Each feature has barrel exports via `index.ts` for cleaner imports
  - Shared UI components remain in `client/src/components/ui/`

## Backend
- **Framework**: Express.js with TypeScript.
- **API**: RESTful endpoints with Zod validation, centralized error handling.
- **Authentication**: Supabase Auth with RBAC and RLS.
- **Middleware Architecture** (Modular):
  - `server/middleware/auth.ts`: Auth middleware (requireAuth, requirePlatformAdmin, requireOrgAdmin, requireRecruiting), supabaseAdmin client
  - `server/middleware/rate-limit.ts`: Rate limiters (writeLimiter, authLimiter, publicJobLimiter)
  - `server/middleware/upload.ts`: Multer file upload configuration
  - `server/middleware/subdomainResolver.ts`: Subdomain-based org resolution
- **Routes Architecture**:
  - `server/routes.ts`: Main routes file (to be incrementally split into feature modules)
  - `server/routes/google-auth.ts`: Google OAuth routes
  - `server/routes/google-calendar.ts`: Google Calendar integration routes
  - `server/routes/upload.ts`: File upload routes
  - See `server/routes/README.md` for migration plan to feature-based route modules

## Data Storage
- **ORM**: Drizzle ORM.
- **Database**: PostgreSQL via Supabase.
- **Schema Architecture** (Modular):
  - `shared/schema/index.ts`: Consolidated exports for all schema modules
  - `shared/schema/enums.ts`: PostgreSQL enums (status, roles, job types, etc.)
  - `shared/schema/users.ts`: Organizations, user profiles, user organizations
  - `shared/schema/clients.ts`: Client/company records
  - `shared/schema/jobs.ts`: Job postings
  - `shared/schema/candidates.ts`: Candidates, job candidates, notes, applications
  - `shared/schema/pipelines.ts`: Pipeline columns, ordering
  - `shared/schema/messages.ts`: Internal messaging system
  - `shared/schema/interviews.ts`: Interview scheduling
  - `shared/schema/oauth.ts`: OAuth sessions, connected accounts
  - `shared/schema/beta.ts`: Beta applications and signups
  - `shared/schema/analytics.ts`: AI insights, recommendations
  - `shared/schema/imports.ts`: Data import/export
  - `shared/schema/emails.ts`: Email settings, templates, events
  - `shared/schema/misc.ts`: Audit logs, activity tracking
  - `shared/schema/queries.ts`: Zod schemas for API query validation
  - Original `shared/schema.ts` re-exports all for backward compatibility
- **Migrations**: Drizzle-kit (`npm run db:push` to sync schema).
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

## Workflow Automation Infrastructure
Database-level workflow automation triggered by candidate stage changes. SQL files stored in `docs/workflows/`.

### Tables
- `workflow_triggers`: Configuration for automated actions (create_task, send_email, create_approval_workflow, trigger_onboarding, send_notification)
- `job_candidate_stage_history`: Audit trail of all stage changes
- `tasks`: Workflow tasks with assignment, due dates, priority, completion tracking
- `workflow_execution_log`: Execution audit log for debugging

### Stage-Based Automation
| Stage | Automated Actions |
|-------|-------------------|
| Applied | Review task, confirmation email |
| Phone Screen | Phone screen form task, scheduling email |
| Interview | Feedback task, interview email, hiring manager notification |
| Offer | Approval workflow, offer generation tasks |
| Hired | Onboarding tasks (HR, IT, Facilities), welcome email, team notification |
| Rejected | Rejection email, documentation task |

### Future Implementation
See Planned Features section below.

# Planned Features

## Email Composer Enhancements (~30-45 min)
Target: Template-driven email composer matching mockup design.

### Email Composer Updates
- Template selector dropdown that auto-fills subject and body
- Merge field support: {{candidate.first_name}}, {{job.title}}, {{company.name}}, {{recruiter.name}}
- CC/BCC toggle fields
- Basic formatting toolbar (Bold, Italic, Lists, Links)
- "Insert Field" button for merge field insertion
- File attachment support (PDF, DOC, DOCX up to 10MB)
- Save Draft and Cancel buttons alongside Send

### Candidate Profile - Emails Tab
- Add "Emails" tab between Campaigns and Notes
- Display threaded email history (grouped by Gmail thread_id)
- Show sent/received indicator, date, template used, job context
- Filters: job, date range, direction (sent/received)
- "Send Email" primary CTA button

### Messages Page Consolidation
- Remove email functionality from Messages page
- Messages page becomes internal team communication only
- Candidate profile is single source of truth for email communication

### Backend
- API endpoint: GET /api/candidates/:id/emails (email history)
- API endpoint: GET /api/email-templates (list templates)
- Merge field rendering on send
- Store gmail_message_id and gmail_thread_id for threading

### Default Templates to Seed
- Application Received
- Phone Screen Request
- Interview Invitation
- Not Moving Forward

## Workflow Automation UI (~1.5-2 hours)
Target: UI to display and manage tasks created by database triggers.

### Tasks Page (~45-60 min)
- New /tasks route showing tasks assigned to current user
- Task cards with: title, description, priority badge, due date, candidate/job context
- Actions: Mark complete, Mark in-progress
- Filters: status (pending/in_progress/completed), task_type, due date, priority
- Empty state when no tasks

### Workflow Settings Admin (~30-40 min)
- Admin page at /settings/workflows
- List all workflow triggers by stage
- Toggle enable/disable per trigger
- Edit task assignments and due_days configuration
- Show execution_order for multiple triggers per stage

### Stage History on Candidate Profile (~15-20 min)
- Add timeline component to candidate profile
- Show stage change history from job_candidate_stage_history
- Display: from_stage → to_stage, changed_at, changed_by
- Link to related tasks created by automation

### Email Action Integration (~15-20 min)
- Connect workflow send_email triggers to SendGrid
- Render merge fields before sending
- Log to email_events table
- Update workflow_execution_log with success/failure

## TalentPatriot Capture Chrome Extension (~2-3 hours)
Target: Chrome extension to capture LinkedIn profiles and add candidates directly to TalentPatriot.
Build in separate Replit project.

### Extension Features (from mockup)
- Parse LinkedIn profile pages (name, title, company, location, LinkedIn URL)
- Show candidate preview before adding
- Job dropdown to assign candidate to specific job
- Stage dropdown (default: Sourced)
- Optional notes field
- One-click "Add to TalentPatriot" button
- Login status indicator

### Extension Structure
- `manifest.json` - Extension config with LinkedIn permissions
- `popup.html/js/css` - Popup UI matching mockup design
- `content.js` - Script to parse LinkedIn profile data
- `background.js` - Handle auth and API calls to TalentPatriot

### Backend API Additions (this project)
- `POST /api/extension/candidates` - Create candidate from extension
  - Body: `{ name, title, company, location, linkedinUrl, jobId, stage, notes }`
  - Returns: created candidate with job_candidate record
- `GET /api/extension/jobs` - List active jobs for dropdown
  - Returns: `[{ id, title, clientName }]`
- Extension token authentication via Supabase auth or API key

### Duplicate Detection
- Check if candidate with same LinkedIn URL or email already exists
- Return existing candidate info if duplicate found
- Option to update existing or skip

## Architecture Decisions
- **Case Conversion Strategy**: Frontend uses `camelCase`, database uses `snake_case`. Conversion handled by shared utilities in `shared/utils/caseConversion.ts` at the API boundary to maintain idiomatic conventions for each layer.
- **Org ID in Public Job Applications**: `org_id` derived from the job record for public applications. Legacy candidates with null `org_id` are auto-updated upon access.
- **OAuth Session Storage**: Migrated from in-memory to PostgreSQL-backed sessions in Supabase (`oauth_sessions` table) with hashed tokens, nonce for CSRF, and 10-minute TTL. `connected_accounts` table tracks health status of external integrations.
- **Pipeline Stage Synchronization**: `moveJobCandidate()` updates both `pipeline_column_id` and `stage` fields to ensure consistency when candidates move between columns.

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

# Recent Changes

## January 2026
- **Brand Color Update**: Added cyan (#0EA5E9) as official brand highlight color matching the TalentPatriot logo
- **Public Pages Refresh**: Updated Landing and About pages with modern gradient backgrounds, cyan accents, and consistent styling
- **Design Token Expansion**: Added tp-cyan tokens to CSS variables and Tailwind config
- **Documentation Updates**: Updated developer guide with feature-based architecture and design token system