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
    - **Complete Onboarding Workflow**: Automated user signup → profile creation → organization setup → currentOrgId availability workflow with Supabase triggers and functions. Organization guards prevent operations until proper organization context is loaded.
    - **User-Organization Assignment API**: New REST endpoint `/api/organizations/:orgId/users` with automatic user metadata updates in Supabase Auth for seamless organization assignment during signup.
    - **User-Organization Management**: Comprehensive REST API endpoints for automatically assigning users to organizations, eliminating manual SQL operations. Includes role validation, duplicate prevention, and owner protection.
    - **Integrated Signup Workflow**: Complete integration of user-organization assignment endpoints into the signup workflow with OnboardingService, useUserOrganization hooks, and comprehensive error handling with database trigger fallbacks.
    - **Database Setup Complete**: Fully configured Supabase database with automated triggers, functions, and Row Level Security policies for user-organization assignments (January 2025).
- **Demo Mode Fix**: Resolved demo mode activation issue that was blocking legitimate user signups and organization creation (August 2025).
- **Production Build System**: Complete production deployment configuration with static file serving, build pipeline (`npm run build`), and compressed asset delivery. Server automatically detects environment and serves compiled client assets in production mode.
- **User-Organization Assignment**: Fully automated membership assignment endpoint `/api/organizations/:orgId/users` integrated into signup workflow with comprehensive error handling and auth metadata updates.
- **Deployment Ready (August 2025)**: Application prepared for production redeployment with optimized builds, validated environment variables, working health checks, and complete user-organization workflow testing.
- **Performance Fix (August 2025)**: Resolved subdomain resolver middleware causing excessive database queries and constant refresh issues by filtering out Replit development URLs and API requests from organization resolution.
- **UI/UX Consistency (August 2025)**: Standardized "Post New Job" button labels across all pages and components for consistent user experience.
- **Performance Optimization (August 2025)**: Implemented comprehensive performance improvements including enhanced query caching (2-5 minute stale times), reduced API polling intervals, intelligent server-side caching strategies, optimized query hooks with memoization, and virtualized components for large datasets.
- **Messages System Complete (August 2025)**: Fully functional messaging system with database schema alignment, proper enum values, thread support, and all required columns. Calendar interview scheduling form visibility fixed with enhanced z-index stacking and dialog positioning.
- **Job Application Flow Complete (August 2025)**: End-to-end application system working perfectly with automatic candidate creation, resume storage, pipeline placement in "Applied" stage, and complete database integration. Production build system ready with optimized assets and deployment configuration.
- **Email Notifications & Enhanced Search (August 2025)**: Implemented SendGrid email service for automated notifications (new applications, interview reminders, status updates) and advanced search capabilities with filtering for candidates (by stage, job, date range) and jobs (by status, experience level, remote option, client). Both features ready for beta testing.
- **AI Resume Parsing & Enhancement (August 2025)**: Complete OpenAI GPT-4o integration for intelligent resume parsing. Extracts skills, experience, education, and contact information automatically. Auto-populates candidate fields and enables advanced search by skills. Database schema updated with resume parsing fields. Production-ready with comprehensive error handling and validation.
- **Comprehensive Application Forms (August 2025)**: Enhanced job application system supporting professional-grade application forms with structured data capture including education history, employment details, legal/eligibility questions, diversity data, and external links (LinkedIn, portfolio). Backend updated with comprehensive validation and data processing. Database schema expanded to support all form fields with proper constraints and indexing.
- **Complete AI Integration Testing (August 2025)**: Comprehensive end-to-end testing of AI resume parsing system completed successfully. Verified OpenAI GPT-4o integration, structured data extraction, skills-based search, experience level detection, and automatic candidate field population. All AI features tested and validated for production deployment.
- **Database Schema Enhancement (August 2025)**: Successfully applied comprehensive database updates to support enhanced application forms. Added 15+ new candidate fields including LinkedIn/portfolio URLs, work authorization, diversity data, employment history, and comprehensive education details. Created application_metadata table and advanced search indexing. All database changes deployed and operational.
- **Deployment Analysis Complete (August 2025)**: Comprehensive deployment readiness analysis completed. Application is production-ready with successful builds, all AI features tested, enhanced search capabilities, email notifications, and comprehensive deployment documentation. Ready for beta testing with complete feature set.

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