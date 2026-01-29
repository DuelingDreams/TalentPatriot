# Overview

This full-stack Applicant Tracking System (ATS) web application modernizes recruitment for small to mid-sized businesses (5-500 employees). It offers a candidate-friendly experience with features like a modern dashboard, recruitment pipeline management, client and candidate tracking, and internal team communication. The project aims to enhance collaboration, streamline recruitment processes, and offers free beta access.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend
- **Framework**: React with TypeScript, Wouter for routing.
- **UI**: Radix UI components with Tailwind CSS and Shadcn/ui.
- **State Management**: TanStack React Query.
- **Design**: Light mode with soft gray backgrounds, rounded cards, and consistent TalentPatriot branding (Navy, Soft Blue, Light Gray, Inter font), focusing on professional UI/UX and accessibility.
- **Design Token System**: Centralized CSS custom properties and Tailwind integration for colors (Primary: #1E3A5F, Secondary: #14B8A6, Accent: #3F88C5, Cyan: #0EA5E9) and semantic tokens.
- **Feature-Based Architecture**: Organized by features (candidates, jobs, communications, organization, analytics) with shared UI components.

## Backend
- **Framework**: Express.js with TypeScript.
- **API**: RESTful endpoints with Zod validation and centralized error handling.
- **Authentication**: Supabase Auth with Role-Based Access Control (RBAC) and Row-Level Security (RLS).
- **Middleware Architecture**: Modular middleware for authentication, rate limiting, file uploads, and subdomain resolution.
- **Routes Architecture**: Centralized routes with a plan for future feature-based modularization.

## Data Storage
- **ORM**: Drizzle ORM.
- **Database**: PostgreSQL via Supabase.
- **Schema Architecture**: Modular schema definitions for users, clients, jobs, candidates, pipelines, messages, interviews, OAuth, beta, analytics, imports, emails, and miscellaneous entities.
- **Migrations**: Drizzle-kit for schema synchronization.
- **Key Decisions**: Multi-tenancy, RBAC with RLS, dynamic Kanban pipelines, performance optimization, UUID-based security, comprehensive onboarding, and user-organization assignment API.

## Core Features
- Applicant Tracking (client, job, candidate management).
- Job-specific Kanban pipelines with real-time updates.
- Public careers portal with application forms.
- Candidate notes with privacy controls.
- Interview scheduling with Google Calendar integration.
- 5-step user onboarding.
- Internal team messaging and dashboard analytics.
- Resume management with secure storage.
- AI resume parsing & enhancement (OpenAI GPT-4o) and AI insights.
- In-app documentation system.
- Skills analytics.

## Workflow Automation Infrastructure
- Database-level workflow automation triggered by candidate stage changes.
- Tables: `workflow_triggers`, `job_candidate_stage_history`, `tasks`, `workflow_execution_log`.
- Stage-based automation for actions like creating tasks, sending emails, and notifications.

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
- **Email Service**: Resend (noreply@support.talentpatriot.com).
- **AI**: OpenAI GPT-4o.
- **Google APIs**: googleapis npm package for Calendar, Meet, and FreeBusy API.