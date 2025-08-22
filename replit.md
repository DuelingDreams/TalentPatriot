# Project Overview

This is a full-stack Applicant Tracking System (ATS) web application for small and mid-sized businesses (5-500 employees). It offers a lightweight, candidate-friendly experience with essential recruitment management features like a modern dashboard, recruitment pipeline management, client and candidate tracking, and internal team communication. The vision is to replace traditional ATS and spreadsheet systems, enhancing team collaboration and improving the recruitment experience.

## User Preferences

Preferred communication style: Simple, everyday language.

**Beta Strategy**: Offering free beta access to early users to gather feedback, testimonials, and product validation before public launch.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter
- **UI Framework**: Radix UI components with Tailwind CSS styling and Shadcn/ui component library
- **State Management**: TanStack React Query for server state
- **Build Tool**: Vite
- **Design Principles**: Light mode with soft gray backgrounds, rounded cards, and a consistent TalentPatriot brand styling (Navy, Soft Blue, Light Gray, Inter font family). Focus on professional UI/UX, modern analytics, enhanced popover/modal UX, and comprehensive accessibility (UI contrast, high-contrast opaque colors for light/dark modes, accessible focus rings).

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Structure**: Clean RESTful endpoints with comprehensive Zod validation
- **Request Handling**: JSON and URL-encoded body parsing with strict input validation
- **Error Handling**: Centralized middleware with detailed Zod validation errors
- **API Endpoints**: Support for a complete recruitment flow including job creation, publishing, public listings, application submission with file upload, and candidate management.

### Data Storage
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL via Supabase
- **Schema**: ATS-specific tables with UUID primary keys and `org_id` foreign keys for multi-tenancy.
- **Migrations**: Drizzle-kit for schema migrations.
- **Key Schema Decisions**:
    - **Multi-tenancy**: Organizations table, `user_organizations` join table, and `org_id` foreign keys for data isolation. Subdomain-based organization routing for careers pages ensures secure multi-tenant isolation. Path-based routing (`/org/{orgSlug}/careers`) is also implemented for scalable career pages without DNS setup.
    - **Role-Based Access Control (RBAC)**: Comprehensive Row-Level Security (RLS) policies implemented for various user roles.
    - **Dynamic Pipeline System**: Configurable Kanban stages for job applications, with automatic creation of default columns for new jobs.
    - **Performance Optimization**: Extensive indexing, intelligent query caching, materialized views, and full-text search (GIN indexes).
    - **Security**: UUID-based primary keys, foreign key relationships, comprehensive form validation, rate limiting, secure authentication (Supabase Auth, OAuth for Google/Microsoft), anti-phishing security headers, and a demo mode architecture to prevent server writes.
    - **Complete Onboarding Workflow**: Automated user signup, profile creation, and organization setup with Supabase triggers and functions.
    - **User-Organization Assignment API**: Automated REST endpoint for assigning users to organizations during signup, including role validation and duplicate prevention.

### Core Features
- **Applicant Tracking**: Comprehensive client, job, and candidate management (CRUD).
- **Job-Specific Pipeline System**: Individual Kanban-style pipelines with drag-and-drop functionality and Supabase Realtime updates.
- **Complete Recruitment Workflow**: End-to-end job posting from draft to public listing and candidate application.
- **Public Careers Portal**: Dedicated public-facing job listings with professional application forms and file upload support, supporting branded experiences.
- **Candidate Notes System**: Comprehensive notes management for pipeline candidates with privacy controls.
- **Interview Scheduling**: Advanced calendar interface.
- **Onboarding Workflow**: 5-step user onboarding process.
- **Internal Communication**: Team messaging system.
- **Reporting & Analytics**: Dashboard with key statistics and performance overview.
- **Resume Management**: Upload, preview, and organization-based storage of resumes.
- **Dynamic Dashboard Quick Actions**: Live data computation for key metrics.
- **Email Notifications**: Automated notifications via SendGrid (new applications, interview reminders, status updates).
- **Enhanced Search**: Advanced filtering for candidates (by stage, job, date range) and jobs (by status, experience level, remote, client).
- **AI Resume Parsing & Enhancement**: OpenAI GPT-4o integration for intelligent resume parsing, extracting skills, experience, education, and contact information. Auto-populates candidate fields and enables advanced search by skills.
- **Comprehensive Application Forms**: Support for professional-grade application forms with structured data capture (education, employment, eligibility, diversity, external links).
- **AI Insights Integration**: OpenAI GPT-4o powered insights for recruitment recommendations, real-time analysis, and actionable insights for optimization.
- **Comprehensive Documentation System**: Interactive help center with 50+ pages of user guides, API documentation, FAQ, and developer resources accessible at `/docs`.
- **Professional About Page**: Company mission, vision, values, and growth story presented in a professionally designed page at `/about`.
- **Enhanced Support Infrastructure**: Dedicated support center at `/help` with multiple contact options, troubleshooting guides, and community resources.

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
- **Email Service**: SendGrid
- **AI**: OpenAI GPT-4o

## Recent Updates (January 2025)

### Documentation & User Experience Enhancement
- **Comprehensive Documentation System**: Added 50+ pages of documentation including user guides, API reference, developer documentation, and FAQ. Accessible via interactive help center at `/docs`.
- **Professional About Page**: Created compelling company page at `/about` featuring mission, vision, values, growth story, and key metrics.
- **Enhanced Support Infrastructure**: Developed dedicated support center at `/help` with multiple contact channels, troubleshooting guides, and community resources.
- **Improved Navigation**: Integrated documentation and support with existing sidebar navigation for seamless user experience.
- **Content Organization**: Structured documentation by user type (end users, administrators, developers) and content type (tutorials, references, troubleshooting).

### Technical Improvements
- **Route Architecture**: Added new public routes for `/about`, `/docs`, and `/help` with proper authentication handling.
- **Component Modularity**: Created reusable help and support components for better maintainability.
- **Build Optimization**: Verified successful production builds with optimized bundle splitting.
- **Performance**: Maintained fast loading times with efficient component lazy loading.

### Deployment Readiness
- **Build Verification**: Confirmed successful TypeScript compilation and production builds.
- **Dependency Management**: Verified all packages are properly installed and up to date.
- **Environment Configuration**: Documented all required environment variables for deployment.
- **Quality Assurance**: No LSP errors, clean code quality metrics, and comprehensive testing coverage.