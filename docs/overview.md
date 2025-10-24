# TalentPatriot - Project Overview

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Development Workflow](#development-workflow)
- [Key Features](#key-features)

## Architecture Overview

TalentPatriot is a full-stack Applicant Tracking System (ATS) built with modern web technologies. It follows a multi-tenant SaaS architecture with organization-based data isolation and role-based access control.

### Core Architectural Principles

1. **Multi-Tenant by Design**: Every data table includes `org_id` for strict organization-level data isolation
2. **Frontend-Heavy**: Business logic lives in the frontend; backend serves as API layer and data persistence
3. **Type Safety**: Shared TypeScript types between frontend and backend via `shared/schema.ts`
4. **Repository Pattern**: Storage layer abstraction with domain-specific repositories
5. **Performance-First**: Materialized views, query caching, and optimized database indexes

## Project Structure

```
talentpatriot/
├── client/                    # Frontend React application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   └── ui/           # Shadcn/ui components
│   │   ├── features/         # Feature-specific modules
│   │   │   ├── admin/        # Admin features
│   │   │   ├── analytics/    # Reporting & analytics
│   │   │   ├── auth/         # Authentication pages
│   │   │   ├── candidates/   # Candidate management
│   │   │   ├── communications/ # Messaging & email
│   │   │   ├── jobs/         # Job management & postings
│   │   │   ├── onboarding/   # User onboarding flow
│   │   │   ├── organization/ # Org settings
│   │   │   ├── public/       # Public careers portal
│   │   │   └── settings/     # User settings
│   │   ├── lib/              # Utilities & helpers
│   │   ├── hooks/            # Custom React hooks
│   │   └── App.tsx           # Main app component with routing
│   └── index.html
│
├── server/                    # Backend Express application
│   ├── routes/               # API route handlers
│   │   ├── analytics.ts      # Analytics endpoints
│   │   ├── auth.ts           # Authentication endpoints
│   │   ├── beta.ts           # Beta program endpoints
│   │   ├── candidates.ts     # Candidate endpoints
│   │   ├── clients.ts        # Client endpoints
│   │   ├── communications.ts # Messaging endpoints
│   │   ├── imports.ts        # Data import endpoints
│   │   ├── jobs.ts           # Job endpoints
│   │   ├── pipeline.ts       # Pipeline management
│   │   └── upload.ts         # File upload handling
│   ├── storage/              # Data access layer
│   │   ├── analytics/        # Analytics repository
│   │   ├── auth/             # Auth repository
│   │   ├── beta/             # Beta repository
│   │   ├── candidates/       # Candidates repository
│   │   ├── communications/   # Communications repository
│   │   ├── imports/          # Imports repository
│   │   ├── jobs/             # Jobs repository
│   │   └── index.ts          # Storage interface aggregation
│   ├── integrations/         # Third-party integrations
│   │   └── google/           # Google Workspace integration
│   ├── middleware/           # Express middleware
│   ├── lib/                  # Backend utilities
│   ├── routes.ts             # Main route registration
│   ├── index.ts              # Server entry point
│   ├── aiInsights.ts         # OpenAI integration
│   ├── emailService.ts       # SendGrid integration
│   └── resumeParser.ts       # AI resume parsing
│
├── shared/                    # Shared code between client & server
│   └── schema.ts             # Drizzle ORM schema & Zod types
│
├── docs/                      # Documentation
│   ├── overview.md           # This file
│   ├── routes.md             # Routing documentation
│   ├── dashboard.md          # Dashboard documentation
│   ├── auth.md               # Authentication flows
│   └── data-model.md         # Data model & API reference
│
└── attached_assets/           # User-uploaded assets

```

## Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight alternative to React Router)
- **UI Components**: Shadcn/ui (Radix UI + Tailwind CSS)
- **State Management**: TanStack React Query v5
- **Forms**: React Hook Form + Zod validation
- **Styling**: Tailwind CSS with custom TalentPatriot theme
- **Icons**: Lucide React
- **Build Tool**: Vite

### Backend
- **Framework**: Express.js with TypeScript
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth + Google OAuth 2.0
- **File Storage**: Supabase Storage (private buckets)
- **Email**: SendGrid
- **AI**: OpenAI GPT-4o (resume parsing, insights)
- **Validation**: Zod schemas
- **Rate Limiting**: express-rate-limit

### Development
- **Language**: TypeScript 5.x
- **Package Manager**: npm
- **Database Migrations**: Drizzle Kit (schema-first approach)
- **Environment**: Replit (cloud-based development)

## Development Workflow

### Running the Application

```bash
npm run dev
```

This single command:
1. Starts the Express backend server
2. Starts the Vite development server
3. Serves frontend and backend on the same port (no CORS issues)

### Database Migrations

```bash
# Push schema changes directly to database (recommended)
npm run db:push

# Force push if there are data-loss warnings
npm run db:push --force
```

**Important**: Never manually write SQL migrations. Drizzle Kit handles schema synchronization automatically.

### Project Organization

1. **Feature-Based Organization**: Frontend code is organized by feature (candidates, jobs, analytics, etc.)
2. **Repository Pattern**: Backend uses domain repositories for data access abstraction
3. **Type Sharing**: `shared/schema.ts` exports Drizzle tables AND Zod schemas for type consistency
4. **Route Co-location**: Each feature has its own routes in `server/routes/`

## Key Features

### Core ATS Functionality
- **Multi-Client Management**: Track multiple client companies and their job openings
- **Job Pipeline**: Customizable Kanban-style pipeline per job with drag-and-drop
- **Candidate Tracking**: Comprehensive candidate profiles with resume parsing
- **Interview Scheduling**: Google Calendar integration with Meet links
- **Team Communication**: Internal messaging with thread support

### Advanced Features
- **AI Resume Parsing**: OpenAI GPT-4o automatically extracts candidate data
- **Source Tracking**: Track where applicants come from (LinkedIn, Indeed, referrals, etc.)
- **Analytics & Reporting**: Materialized views for fast dashboard metrics
- **Public Careers Portal**: Organization-branded job listings with subdomains
- **Google Workspace Integration**: Calendar, Meet, Gmail integration
- **Multi-Tenant Architecture**: Organization-based data isolation with RLS policies

### Security Features
- **Row-Level Security (RLS)**: Supabase RLS policies enforce org_id isolation
- **Encrypted Token Storage**: AES-256-GCM encryption for OAuth refresh tokens
- **HMAC-Signed OAuth State**: Prevents CSRF and replay attacks
- **Private Resume Storage**: Supabase Storage with signed URLs (24-hour expiry)
- **Rate Limiting**: API endpoint protection against abuse
- **Secure Authentication**: JWT-based auth with httpOnly cookies

## Next Steps

- **[Routing Documentation](./routes.md)**: Learn how routing works with Wouter
- **[Dashboard Documentation](./dashboard.md)**: Understand dashboard components and analytics
- **[Authentication Documentation](./auth.md)**: Deep dive into auth flows
- **[Data Model Documentation](./data-model.md)**: Explore database schema and API endpoints
