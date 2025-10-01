# Overview

This is a full-stack Applicant Tracking System (ATS) web application designed for small and mid-sized businesses (5-500 employees). It aims to offer a lightweight, candidate-friendly experience with essential recruitment management features such as a modern dashboard, recruitment pipeline management, client and candidate tracking, and internal team communication. The project's vision is to replace traditional ATS and spreadsheet systems, thereby enhancing team collaboration and improving the overall recruitment experience.

# User Preferences

Preferred communication style: Simple, everyday language.
Beta Strategy: Offering free beta access to early users to gather feedback, testimonials, and product validation before public launch.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter
- **UI Framework**: Radix UI components with Tailwind CSS styling and Shadcn/ui component library
- **State Management**: TanStack React Query for server state
- **Build Tool**: Vite
- **Design Principles**: Light mode with soft gray backgrounds, rounded cards, and a consistent TalentPatriot brand styling (Navy, Soft Blue, Light Gray, Inter font family). Focus on professional UI/UX, modern analytics, enhanced popover/modal UX, and comprehensive accessibility.

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Structure**: Clean RESTful endpoints with comprehensive Zod validation
- **Request Handling**: JSON and URL-encoded body parsing with strict input validation
- **Error Handling**: Centralized middleware with detailed Zod validation errors
- **API Endpoints**: Support for a complete recruitment flow including job creation, publishing, public listings, application submission with file upload, and candidate management.
- **Development Authentication**: Mock user system for local testing, bypassing Supabase auth while maintaining authorization controls.

## Data Storage
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL via Supabase
- **Schema**: ATS-specific tables with UUID primary keys and `org_id` foreign keys for multi-tenancy.
- **Migrations**: Drizzle-kit for schema migrations.
- **Key Schema Decisions**:
    - **Multi-tenancy**: Organizations table, `user_organizations` join table, and `org_id` foreign keys for data isolation. Subdomain-based and path-based routing for careers pages.
    - **Role-Based Access Control (RBAC)**: Comprehensive Row-Level Security (RLS) policies implemented for various user roles.
    - **Dynamic Pipeline System**: Configurable Kanban stages for job applications.
    - **Performance Optimization**: Extensive indexing, intelligent query caching, materialized views, and full-text search.
    - **Security**: UUID-based primary keys, foreign key relationships, comprehensive form validation, rate limiting, secure authentication (Supabase Auth, OAuth), anti-phishing security headers, and a demo mode.
    - **Complete Onboarding Workflow**: Automated user signup, profile creation, and organization setup with Supabase triggers and functions.
    - **User-Organization Assignment API**: Automated REST endpoint for assigning users to organizations during signup.

## Core Features
- **Applicant Tracking**: Comprehensive client, job, and candidate management (CRUD).
- **Job-Specific Pipeline System**: Individual Kanban-style pipelines with drag-and-drop functionality and Supabase Realtime updates.
- **Complete Recruitment Workflow**: End-to-end job posting from draft to public listing and candidate application.
- **Public Careers Portal**: Dedicated public-facing job listings with professional application forms and file upload support.
- **Candidate Notes System**: Comprehensive notes management for pipeline candidates with privacy controls.
- **Interview Scheduling**: Advanced calendar interface.
- **Onboarding Workflow**: 5-step user onboarding process.
- **Internal Communication**: Team messaging system.
- **Reporting & Analytics**: Dashboard with key statistics and performance overview.
- **Resume Management**: Upload, preview, and organization-based storage of resumes.
- **Dynamic Dashboard Quick Actions**: Live data computation for key metrics.
- **Email Notifications**: Automated notifications via SendGrid.
- **Enhanced Search**: Advanced filtering for candidates and jobs.
- **AI Resume Parsing & Enhancement**: OpenAI GPT-4o integration for intelligent resume parsing and auto-population of candidate fields.
- **Comprehensive Application Forms**: Support for professional-grade application forms with structured data capture.
- **AI Insights Integration**: OpenAI GPT-4o powered insights for recruitment recommendations and real-time analysis.
- **Comprehensive Documentation System**: Interactive help center at `/docs` with user guides, API documentation, FAQ, and developer resources.
- **Professional About Page**: Company mission, vision, values, and growth story at `/about`.
- **Enhanced Support Infrastructure**: Dedicated support center at `/help` with multiple contact options and troubleshooting guides.

# External Dependencies

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