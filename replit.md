# Project Overview

This is a full-stack Applicant Tracking System (ATS) web application, designed for small and mid-sized businesses (teams of 5-500 employees). It aims to be a lightweight, candidate-friendly ATS that provides essential recruitment management features without unnecessary complexity. Key capabilities include a modern dashboard, recruitment pipeline management, client and candidate tracking, and internal team communication. The project envisions replacing traditional ATS, spreadsheet-based systems, and improving team collaboration in hiring.

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
- **Design Principles**: Light mode with soft gray backgrounds, rounded cards, and a consistent TalentPatriot brand styling system (Navy, Soft Blue, Light Gray, Inter font family). Professional UI/UX overhaul with modern analytics and professional appearance. Enhanced popover/modal UX with proper z-index stacking (z-[100]) and collision detection.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Structure**: RESTful endpoints with `/api` prefix
- **Request Handling**: JSON and URL-encoded body parsing
- **Error Handling**: Centralized error middleware, comprehensive DOM exception prevention, and refined error handling for stability.

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
- **Recruitment Pipeline**: Kanban-style pipeline dashboard with dynamic columns, drag-and-drop functionality, and candidate progression tracking.
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