# Project Overview

This is a full-stack Applicant Tracking System (ATS) web application, designed for small and mid-sized businesses (teams of 5-500 employees). It aims to be a lightweight, candidate-friendly ATS that provides essential recruitment management features without unnecessary complexity. Key capabilities include a modern dashboard, recruitment pipeline management, client and candidate tracking, and internal team communication. The project envisions replacing traditional ATS, spreadsheet-based systems, and improving team collaboration in hiring.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**August 9, 2025 - Supabase Realtime Pipeline System Implementation**
- Implemented comprehensive Supabase Realtime system for live pipeline updates with automatic fallback
- Created useCandidatesForJob hook with realtime subscriptions on job_candidate and pipeline_columns tables
- Added intelligent connection health monitoring and exponential backoff retry logic for realtime failures
- Built fallback polling system (30s intervals) when realtime connections are unavailable
- Integrated realtime status indicators in JobPipeline UI with live connection status badges
- Enhanced job application notifications with toast alerts for new candidates arriving in pipeline
- Established automatic React Query cache invalidation on INSERT/UPDATE/DELETE database events
- Implemented clean subscription management with proper mount/unmount lifecycle handling
- Added comprehensive error handling and logging for realtime connection issues
- Candidates now appear instantly in pipeline without manual refresh when realtime is active

**August 9, 2025 - Job-Specific Pipeline System Implementation**
- Implemented complete job-specific pipeline system with individual pipelines per job posting
- Added job_id field to pipeline_columns table with proper database migration and indexing
- Created ensureDefaultPipelineForJob service with automatic 5-column creation (Applied → Screen → Interview → Offer → Hired)
- Built job-specific API endpoints: GET /api/jobs/:jobId/pipeline and GET /api/jobs/:jobId/pipeline-columns
- Integrated pipeline creation with job publishing workflow for seamless recruitment flow
- Implemented idempotent pipeline operations preventing duplicate column creation
- Fixed database field mapping issues between snake_case (database) and camelCase (TypeScript)
- Added comprehensive error handling and validation throughout pipeline services
- Established complete end-to-end testing verification with successful job application placement
- All job applications now automatically place candidates in the "Applied" column

**August 8, 2025 - Subdomain-Based Organization Routing Implementation**
- Implemented professional subdomain-based careers pages for multi-tenant organization isolation
- Created subdomain middleware that automatically detects organization from hostname
- Updated careers API to serve organization-specific job listings with complete data isolation
- Added SQL migration system to generate unique URL-safe slugs for all organizations
- Enhanced careers page header to dynamically display company name from subdomain
- Established secure multi-tenant routing: company-name.talentpatriot.app/careers
- Complete security implementation preventing cross-organization data leakage
- Professional branded experience for job seekers with organization-specific contexts
- Application ready for redeployment with subdomain routing functionality

**August 8, 2025 - Candidate Notes System Implementation**
- Enhanced pipeline candidate cards to match demo design with fully functional Notes buttons
- Implemented comprehensive candidate notes system with create/view/privacy functionality
- Added CandidateNotesDialog component with professional UI and user authentication
- Created complete backend storage methods for candidate notes with Supabase integration
- Set up candidate_notes database table with RLS policies and performance indexes
- Fixed API endpoints to use correct jobCandidateId parameter structure

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter
- **UI Framework**: Radix UI components with Tailwind CSS styling
- **Component Library**: Shadcn/ui
- **State Management**: TanStack React Query for server state
- **Build Tool**: Vite
- **Design Principles**: Light mode with soft gray backgrounds, rounded cards, and a consistent TalentPatriot brand styling system (Navy, Soft Blue, Light Gray, Inter font family). Professional UI/UX overhaul with modern analytics and professional appearance. Enhanced popover/modal UX with proper z-index stacking (z-[100]) and collision detection.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Structure**: Clean RESTful endpoints with comprehensive Zod validation
- **Request Handling**: JSON and URL-encoded body parsing with strict input validation
- **Error Handling**: Centralized error middleware with detailed Zod validation errors, comprehensive DOM exception prevention, and refined error handling for stability.
- **API Endpoints**: Complete recruitment flow implementation:
  - `POST /api/jobs` - Job creation with validation (default draft status)
  - `POST /api/jobs/:jobId/publish` - Job publishing endpoint
  - `GET /api/public/jobs` - Public job listings for careers page
  - `POST /api/jobs/:jobId/apply` - Job application with file upload
  - `POST /api/candidates` - Candidate creation with duplicate checking
  - Pipeline integration with automatic column assignment
- **Validation**: Comprehensive Zod schemas for all inputs with detailed error messages

### Data Storage
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL via Supabase
- **Schema**: ATS-specific tables with UUID primary keys and `org_id` foreign keys for multi-tenancy.
- **Migrations**: Drizzle-kit for schema migrations.
- **Key Schema Decisions**:
    - **Multi-tenancy**: Organizations table, `user_organizations` join table for role-based access, and `org_id` foreign keys across all core tables for complete data isolation.
    - **Role-Based Access Control (RBAC)**: Comprehensive Row-Level Security (RLS) policies implemented for `hiring_manager`, `recruiter`, `admin`, `interviewer`, and `demo_viewer` roles. User roles are securely stored in a `user_profiles` table.
    - **Dynamic Pipeline System**: `pipeline_columns` table for configurable Kanban stages and `applications` table for job-candidate relationships with dynamic column assignments.
    - **Performance Optimization**: Extensive indexing (15+ indexes for `org_id`, status, search), intelligent query caching (React Query), materialized views, and full-text search (GIN indexes).
    - **Security**: UUID-based primary keys, proper foreign key relationships, comprehensive form validation, rate limiting, secure authentication (Supabase Auth, OAuth for Google/Microsoft), and anti-phishing security headers.

### Core Features
- **Applicant Tracking**: Comprehensive client, job, and candidate management with full CRUD operations.
- **Job-Specific Pipeline System**: Individual Kanban-style pipelines for each job posting with automatic 5-column creation (Applied → Screen → Interview → Offer → Hired). Complete isolation between job pipelines with seamless candidate progression tracking.
- **Recruitment Pipeline**: Enhanced pipeline dashboard with dynamic columns, drag-and-drop functionality, and job-specific candidate management.
- **Complete Recruitment Workflow**: End-to-end job posting flow from draft creation → publishing → public careers listing → candidate application → job-specific pipeline placement.
- **Public Careers Portal**: Dedicated public-facing job listings at `/public/careers` with professional application forms and file upload support.
- **Candidate Notes System**: Comprehensive notes management for pipeline candidates with privacy controls, user authentication, and team collaboration features.
- **Interview Scheduling**: Advanced calendar interface with improved popover handling - fixed clipping issues on mobile and desktop with proper z-index stacking, collision detection, and responsive design.
- **Onboarding Workflow**: 5-step user onboarding including account creation, company setup, goal-based personalization, guided job creation/candidate import, and success celebration.
- **Job Board Integration**: UI for various job boards (LinkedIn, Indeed, etc.) with cost estimates and multi-platform distribution.
- **Internal Communication**: Team messaging system.
- **Reporting & Analytics**: Dashboard with key statistics, performance overview, and data visualizations.
- **Resume Management**: Upload, preview (PDF/Word), and organization-based storage of resumes.

## External Dependencies

- **Database**: Supabase (PostgreSQL)
- **UI Components**: Radix UI, Shadcn/ui
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Charting**: Recharts
- **Image Upload**: Multer (backend)
- **Security**: HaveIBeenPwned.org (for password security checks)
- **OAuth Providers**: Google, Microsoft