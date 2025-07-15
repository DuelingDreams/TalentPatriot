# Project Overview

This is a full-stack ATS (Applicant Tracking System) web application built with React frontend and Express backend, featuring a modern dashboard interface for managing recruitment pipelines. The application uses TypeScript throughout and implements a clean, component-based architecture.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**July 15, 2025**: 
- Converted from generic dashboard to ATS (Applicant Tracking System)
- Updated navigation: Dashboard, Jobs, Clients, Candidates, Calendar, Messages
- Created comprehensive database schema with 5 tables (clients, jobs, candidates, job_candidate, candidate_notes)
- Implemented UUID-based primary keys with proper foreign key relationships
- Added job status and candidate stage enums
- Generated complete SQL schema for Supabase deployment
- Built complete client management system with full CRUD operations
- Created comprehensive clients listing page with search and detailed information display
- Added client detail page with tabbed interface (Overview, Jobs, Candidates, Notes, Files, Contacts)
- Implemented backend API endpoints for all client operations
- Fixed date parsing errors in client views
- Created demo data seed script with 8 sample clients, 5 jobs, and 6 candidates
- Successfully populated application with realistic sample data
- Generated comprehensive Supabase RLS policies for multi-role access control
- Created role-based security with recruiter, BD, PM, demo_viewer, and unauthenticated access levels
- Implemented fine-grained permissions including author-only candidate notes and assignment-based job access
- Built complete authentication flow with login/signup pages using Supabase Auth
- Added comprehensive form validation with real-time feedback and error handling
- Implemented password strength indicator and show/hide password functionality
- Created AuthProvider context for global user state management
- Added protected routes with role-based access control
- Built user profile component with role badges and sign-out functionality
- Updated sidebar navigation to show/hide links based on user roles
- Created demo user accounts for testing different role permissions
- Enhanced login form with "Remember Me" functionality and better UX
- Removed unauthenticated demo routes in favor of authenticated demo account
- Simplified login UI to single "Try Demo Account" button for better UX
- Authenticated demo provides full ATS experience with proper role-based restrictions
- Cleaned up unused demo components and files for simpler codebase
- Set up authenticated demo user in Supabase Auth (demo@yourapp.com)
- Enhanced login page with "Try Demo Account" button for immediate access
- Created security recommendations document for demo mode protection
- Built read-only Kanban pipeline dashboard for demo mode
- Added candidate pipeline visualization with 8 stages (Applied → Hired/Rejected)
- Implemented comprehensive candidate cards with skills, notes, and job information
- Added pipeline statistics and progress tracking
- Created navigation between demo dashboard and pipeline views
- Updated database schema to include status columns for proper demo filtering
- Enhanced RLS policies to use status='demo' for secure demo data access
- Created migration script and updated schemas for demo data isolation
- Verified demo user authentication with proper role metadata extraction
- Implemented proper data separation using auth.users.raw_user_meta_data.role and status field filtering
- Updated useJobs and useClients hooks to filter data based on user role: demo_viewer sees status='demo' records, while recruiter/bd/pm roles see status IS DISTINCT FROM 'demo' records
- Removed client-side demo data fallbacks from pages since hooks now handle proper filtering
- Created comprehensive demo data structures with proper status field values for database-level access control
- Enhanced security with role-based database filtering instead of client-side demo data switching
- Generated comprehensive Supabase Row-Level Security (RLS) policies for all ATS tables
- Created role-based access control policies supporting recruiter, bd, pm, demo_viewer, and admin roles
- Implemented assignment-based access for recruiters (job_candidate.assigned_to = auth.uid())
- Added author-only write access for candidate_notes (author_id = auth.uid())
- Created strict demo data protection preventing writes to demo records
- Established hierarchical permissions with admin override capabilities
- Created public RLS policies enabling unauthenticated read access to demo data (status='demo')
- Updated all SELECT policies to allow public demo access without authentication
- Maintained secure access control for production data requiring authentication
- Generated admin scripts for enabling anonymous access in Supabase
- Built comprehensive role-based navigation sidebar with organized sections
- Created role-specific navigation items for recruiter, BD, PM, and admin users
- Added recruiter-specific tools: Job Pipeline, My Assignments, Interview Schedule, Analytics
- Added BD-specific tools: Client Reports, Business Metrics, Lead Pipeline
- Added PM-specific tools: Project Dashboard, Contract Jobs, Resource Planning
- Created admin-only navigation section with Role Management and System Settings
- Implemented sectioned navigation with clear role-based access control
- **Enhanced Client Detail Page with comprehensive 6-tab interface**: Overview (company info, metrics, activity feed), Jobs (client job listings), Candidates (pipeline tracking), Notes (categorized internal notes), Files (drag-drop upload and document management), Contacts (detailed contact management)
- **Verified Clients page compliance with full specifications**: Proper routing (/clients → /clients/:id), complete table with all required columns (Company Name, Industry, Location, Contact, Active Jobs, Last Activity, Actions), comprehensive Add/Edit modal with all fields including new Tags & Classifications feature
- **Added Tags & Classifications system**: Implemented comprehensive tagging system with checkboxes for Small Business, 8(a), Veteran-Owned, Women-Owned, Minority-Owned, HUBZone, Service-Disabled Veteran-Owned, and other business classifications
- **Built comprehensive Calendar Integration with FullCalendar.io**: Complete interview scheduling system with month/week/day views, "Schedule Interview" workflow (job selection → candidate selection → date/time picker), interactive event clicking, role-based data filtering, and professional calendar styling
- **Created Dashboard Home Page with real-time metrics**: Time-based greeting, 4 key metrics cards (Open Jobs, Total Candidates, Average Days to Hire, Total Jobs), recent candidate activity feed with stage progression tracking, quick action modals for creating jobs and candidates, and navigation shortcuts to main sections
- **Enhanced Jobs Page with External Posting Capabilities**: Extended job creation form with comprehensive fields (location, salary, job type, experience level, remote work, requirements, benefits), added "Post Job" buttons on job cards, built external posting modal with platform selection (Indeed, LinkedIn, Monster, Glassdoor, ZipRecruiter), implemented simulated posting workflow with success/failure feedback, enhanced job display with detailed information (salary, location, job type), and role-based permissions for external posting features
- **Completed Comprehensive Security Analysis for Authenticated Users**: Verified multi-layered security with route protection, role-based access control, secure data filtering, and protected mutations. Confirmed complete isolation between demo and production data with enterprise-grade security measures. All authenticated users properly filtered from demo data with granular RBAC permissions enforced at route, hook, and mutation levels.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing  
- **UI Framework**: Radix UI components with Tailwind CSS styling
- **Component Library**: Shadcn/ui component system
- **State Management**: TanStack React Query for server state
- **Build Tool**: Vite with custom configuration
- **Design**: Light mode with soft gray backgrounds and rounded cards

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Development**: Hot reload with tsx
- **API Structure**: RESTful endpoints with `/api` prefix
- **Request Handling**: JSON and URL-encoded body parsing
- **Error Handling**: Centralized error middleware

### Data Storage
- **ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL via Supabase
- **Schema**: ATS-specific tables with UUID primary keys
- **Migrations**: Drizzle-kit for schema migrations
- **Development Storage**: In-memory storage interface for ATS entities

### Database Schema
- **clients**: Company information with contact details
- **jobs**: Job postings linked to clients with status tracking
- **candidates**: Candidate profiles with contact and resume information
- **job_candidate**: Many-to-many relationship with application stage and notes
- **candidate_notes**: Detailed notes for each job application
- **Constraints**: Unique constraint on (job_id, candidate_id) pairs

## Key Components

### Frontend Components
- **Layout System**: Dashboard layout with responsive sidebar and top navigation
- **UI Components**: Complete set of Radix UI-based components (buttons, forms, dialogs, etc.)
- **Pages**: Dashboard, Users, Projects, Analytics, Settings with placeholder content
- **Routing**: File-based routing with 404 handling

### Backend Components
- **Routes**: Modular route registration system
- **Storage Interface**: Abstracted storage layer with in-memory implementation
- **Development Server**: Vite integration for development mode
- **Logging**: Request/response logging with timing

### Database Schema
- **Users Table**: Basic user model with id, username, password fields
- **Validation**: Zod schemas for type validation
- **Types**: Fully typed with Drizzle's type inference

## Data Flow

1. **Client Requests**: React components make API calls using TanStack Query
2. **API Layer**: Express routes handle requests with error handling
3. **Storage Layer**: Abstract storage interface allows for different implementations
4. **Database**: Drizzle ORM manages PostgreSQL interactions
5. **Response**: JSON responses with proper error handling and logging

## External Dependencies

### Core Dependencies
- **Database**: Neon Database (PostgreSQL serverless)
- **UI Components**: Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables
- **Icons**: Lucide React icons
- **Date Handling**: date-fns for date utilities

### Development Tools
- **Build**: Vite with React plugin
- **Database Tools**: Drizzle Kit for migrations
- **Type Checking**: TypeScript with strict configuration
- **Replit Integration**: Custom plugins for development environment

## Deployment Strategy

### Build Process
1. **Frontend Build**: Vite builds React app to `dist/public`
2. **Backend Build**: esbuild bundles server code to `dist/index.js`
3. **Database**: Drizzle pushes schema changes to PostgreSQL

### Environment Configuration
- **Development**: Uses tsx for hot reload and Vite dev server
- **Production**: Serves static files and runs bundled Express server
- **Database**: Requires `DATABASE_URL` environment variable

### File Structure
- **Client**: Frontend code in `client/` directory
- **Server**: Backend code in `server/` directory  
- **Shared**: Common schemas and types in `shared/` directory
- **Configuration**: Root-level config files for tools

The application is designed to be easily extensible with a clear separation of concerns between frontend, backend, and data layers. The storage interface pattern allows for easy switching between development and production database implementations.