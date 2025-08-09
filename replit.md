# Project Overview

This is a full-stack Applicant Tracking System (ATS) web application designed for small and mid-sized businesses (teams of 5-500 employees). It aims to be a lightweight, candidate-friendly ATS offering essential recruitment management features without unnecessary complexity. Key capabilities include a modern dashboard, recruitment pipeline management, client and candidate tracking, and internal team communication. The project's vision is to replace traditional ATS and spreadsheet-based systems, enhancing team collaboration in hiring and improving the overall recruitment experience.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter
- **UI Framework**: Radix UI components with Tailwind CSS styling
- **Component Library**: Shadcn/ui
- **State Management**: TanStack React Query for server state
- **Build Tool**: Vite
- **Design Principles**: Light mode with soft gray backgrounds, rounded cards, and a consistent TalentPatriot brand styling system (Navy, Soft Blue, Light Gray, Inter font family). Professional UI/UX with modern analytics and appearance. Enhanced popover/modal UX with proper z-index stacking and collision detection. Implemented complete UI contrast and accessibility improvements with high-contrast opaque color values for light and dark modes, and accessible focus rings.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Structure**: Clean RESTful endpoints with comprehensive Zod validation
- **Request Handling**: JSON and URL-encoded body parsing with strict input validation
- **Error Handling**: Centralized error middleware with detailed Zod validation errors and refined error handling for stability.
- **API Endpoints**: Support for a complete recruitment flow including job creation, publishing, public listings, application submission with file upload, and candidate management.
- **Validation**: Comprehensive Zod schemas for all inputs.

### Data Storage
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL via Supabase
- **Schema**: ATS-specific tables with UUID primary keys and `org_id` foreign keys for multi-tenancy.
- **Migrations**: Drizzle-kit for schema migrations.
- **Key Schema Decisions**:
    - **Multi-tenancy**: Organizations table, `user_organizations` join table for role-based access, and `org_id` foreign keys across all core tables for complete data isolation. Subdomain-based organization routing for careers pages ensures secure multi-tenant isolation.
    - **Role-Based Access Control (RBAC)**: Comprehensive Row-Level Security (RLS) policies implemented for `hiring_manager`, `recruiter`, `admin`, `interviewer`, and `demo_viewer` roles.
    - **Dynamic Pipeline System**: `pipeline_columns` table for configurable Kanban stages and `applications` table for job-candidate relationships with dynamic column assignments. Job-specific pipelines are automatically created with default columns (Applied → Screen → Interview → Offer → Hired) upon job publishing.
    - **Performance Optimization**: Extensive indexing, intelligent query caching (React Query), materialized views, and full-text search (GIN indexes).
    - **Security**: UUID-based primary keys, proper foreign key relationships, comprehensive form validation, rate limiting, secure authentication (Supabase Auth, OAuth for Google/Microsoft), and anti-phishing security headers. Comprehensive demo mode architecture implemented to prevent server writes when `isDemoUser` is true.

### Core Features
- **Applicant Tracking**: Comprehensive client, job, and candidate management with full CRUD operations.
- **Job-Specific Pipeline System**: Individual Kanban-style pipelines for each job posting with drag-and-drop functionality and job-specific candidate management. Supabase Realtime provides live pipeline updates with automatic fallback to polling.
- **Complete Recruitment Workflow**: End-to-end job posting flow from draft creation → publishing → public careers listing → candidate application → job-specific pipeline placement.
- **Public Careers Portal**: Dedicated public-facing job listings at `/public/careers` with professional application forms and file upload support, supporting subdomain-based routing for branded experiences.
- **Candidate Notes System**: Comprehensive notes management for pipeline candidates with privacy controls and user authentication.
- **Interview Scheduling**: Advanced calendar interface with improved popover handling.
- **Onboarding Workflow**: 5-step user onboarding process.
- **Job Board Integration**: UI for various job boards with cost estimates.
- **Internal Communication**: Team messaging system.
- **Reporting & Analytics**: Dashboard with key statistics and performance overview.
- **Resume Management**: Upload, preview, and organization-based storage of resumes.
- **Dynamic Dashboard Quick Actions**: Live data computation for "pending review" and "new in last 24h" counts for authenticated users.

## External Dependencies

- **Database**: Supabase (PostgreSQL)
- **UI Components**: Radix UI, Shadcn/ui
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Charting**: Recharts
- **Image Upload**: Multer (backend)
- **Security**: HaveIBeenPwned.org
- **OAuth Providers**: Google, Microsoft