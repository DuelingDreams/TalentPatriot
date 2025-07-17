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
- **FIXED DATA CONTAMINATION**: Switched from in-memory to persistent Supabase database storage
- **FIXED FIELD MAPPING**: Implemented proper camelCase to snake_case field mapping for database operations
- **CLEANED DATABASE**: Removed all duplicate test/seed data to ensure clean user experience
- **VERIFIED API FUNCTIONALITY**: Both client and job creation/retrieval now work correctly with proper data persistence
- **IMPLEMENTED RATE LIMITING**: Added comprehensive rate limiting for API protection with Express middleware
- **ENHANCED DATABASE CONNECTION**: Optimized Supabase connection with pooling and proper error handling
- **FIXED PROXY CONFIGURATION**: Configured Express trust proxy for Replit environment compatibility
- **IMPROVED SECURITY**: Write operations protected with stricter rate limits and validation
- **OPTIMIZED DATABASE SCHEMA**: Enhanced schema with comprehensive security, performance indexes, and demo data isolation
- **UPGRADED RLS POLICIES**: Implemented role-based security with function caching, targeted access control, and audit capabilities
- **ENHANCED DATA INTEGRITY**: Added UUID foreign keys, validation constraints, and automated maintenance procedures

**July 16, 2025**:
- **COMPLETED DATABASE OPTIMIZATION ANALYSIS**: Created enterprise-grade optimization framework with comprehensive security enhancements
- **BUILT MIGRATION INFRASTRUCTURE**: Developed safe 8-phase migration script with automated rollback capabilities
- **ENHANCED BACKEND STORAGE**: Improved error handling, validation, and field mapping in all database operations
- **CREATED PERFORMANCE TESTING SUITE**: Built comprehensive testing framework for API validation and performance monitoring
- **OPTIMIZED SCHEMA DESIGN**: Prepared enhanced schema with audit trails, status management, and performance indexes
- **IMPLEMENTED 6-TIER SECURITY**: Designed role-based RLS policies with admin, PM, recruiter, BD, demo_viewer, and public access levels
- **VERIFIED APPLICATION STABILITY**: Confirmed all CRUD operations working correctly with optimized backend layer
- **ESTABLISHED MONITORING FRAMEWORK**: Created tools for performance tracking, security auditing, and database maintenance
- **FIXED PIPELINE NAVIGATION UX**: Resolved "Job Not Found" error when clicking Pipeline from sidebar navigation
- **CREATED PIPELINE OVERVIEW PAGE**: Built intelligent job selection interface for `/pipeline` route with candidate counts
- **ENHANCED NAVIGATION FLOW**: Added bidirectional navigation between Pipeline Overview and specific job pipelines
- **IMPROVED USER EXPERIENCE**: Users can now seamlessly navigate between all jobs and individual pipeline views
- **RESOLVED AUTHENTICATION ISSUE**: Fixed demo_viewer role override by debugging authentication context and confirming proper role detection
- **BUILT TALENTPATRIOT LANDING PAGE**: Created modern, responsive marketing homepage with brand-compliant design, hero section, value propositions, and complete navigation structure
- **IMPLEMENTED COMPREHENSIVE MESSAGING SYSTEM**: Created complete team communication feature with database schema, API routes, and UI components
- **BUILT MESSAGING COMPONENTS**: Developed MessagesList, MessageComposer, and Messages page with filtering, priority management, and context linking
- **FIXED CRITICAL API BUGS**: Resolved apiRequest function parameter handling and SelectItem empty value errors
- **ENHANCED ERROR HANDLING**: Added comprehensive DOM exception handling for Supabase authentication and network operations
- **ORGANIZED HOOK ARCHITECTURE**: Created separate hook files for different data entities to prevent circular dependencies
- **CONDUCTED COMPREHENSIVE DATABASE REVIEW**: Completed full analysis of schema, RLS policies, and performance characteristics
- **CREATED OPTIMIZATION ROADMAP**: Developed detailed performance improvement plan with database and backend optimizations
- **IDENTIFIED KEY BOTTLENECKS**: Found critical issues in query patterns, indexing strategy, and caching implementation
- **DESIGNED IMPLEMENTATION PHASES**: Created 3-phase optimization plan targeting 70%+ performance improvements
- **RESOLVED APPLICATION CRASHES**: Fixed critical DOM exception errors and server instability issues
- **STREAMLINED ERROR HANDLING**: Removed conflicting error handlers that interfered with Vite development environment
- **ENHANCED SUPABASE INTEGRATION**: Improved authentication flow with robust error handling and graceful fallbacks
- **STABILIZED DEVELOPMENT ENVIRONMENT**: Application now runs consistently without unhandled promise rejections or crashes

**July 17, 2025**:
- **CREATED COMPREHENSIVE SYSTEM DOCUMENTATION**: Built complete technical documentation covering database schema, role definitions, authentication, and data fetching examples
- **PREPARED RLS POLICIES FOR DEPLOYMENT**: Created ready-to-execute SQL scripts for all 8 tables with proper UUID handling and ENUM casting
- **FIXED ENUM CASTING ISSUES**: Resolved record_status ENUM mismatches by implementing ::TEXT casting in all demo_viewer policies
- **VERIFIED ROLE ACCESS MATRIX**: Confirmed BD, PM, and RECRUITER roles have appropriate access to messages and calendar functions
- **CORRECTED TABLE REFERENCES**: Clarified that "candidate_notes" is the correct table name (not "notes") preventing relation errors
- **DELIVERED COMPLETE RLS SCRIPT**: Provided supabase-final-rls-policies.sql with all policies ready for copy-paste deployment
- **ENHANCED DRAG AND DROP FUNCTIONALITY**: Fixed pipeline kanban drag and drop with touch sensor support, visual feedback, and mobile responsiveness
- **CREATED REUSABLE POST JOB DIALOG**: Built PostJobDialog component with full form validation, client selection, and status management
- **FIXED POST NEW JOB BUTTON**: Integrated PostJobDialog into Dashboard, making the Post New Job button fully functional for authenticated users
- **BUILT PROFESSIONAL DEMO MODE**: Created comprehensive demo experience with interactive pipeline, dedicated demo components, and proper access restrictions
- **IMPLEMENTED DEMO DASHBOARD**: Built DemoDashboard with statistics, feature exploration, and performance metrics
- **CREATED DEMO VIEWS**: Added DemoClients and DemoCandidates components with search functionality and realistic sample data
- **ENHANCED DEMO PIPELINE**: Built DemoPipelineKanban with full drag-and-drop functionality that works in demo mode
- **UPDATED NAVIGATION**: Integrated demo-specific views into all main pages with appropriate role-based rendering
- **FIXED CANDIDATE NOTES FOR AUTHENTICATED USERS**: Added proper authorId field extraction from auth context when creating notes
- **RESOLVED HOOKS ORDER VIOLATION**: Fixed JobPipeline component by calling all hooks before conditional returns
- **ENHANCED NOTE AUTHOR DISPLAY**: Improved author name formatting to show "You" for current user and email usernames appropriately
- **INITIATED PROFESSIONAL UI/UX OVERHAUL**: Began comprehensive redesign with enhanced branding, modern analytics, and professional appearance
- **UPGRADED SIDEBAR DESIGN**: Enhanced with TalentPatriot branding, gradient header, wider layout (w-72), and shadow effects
- **CREATED DASHBOARD ANALYTICS COMPONENTS**: Built StatCard, RecentActivity, PipelineOverview, and JobsChart components with Recharts integration
- **IMPLEMENTED DATA VISUALIZATION**: Added interactive charts for pipeline stages and job status distribution with professional tooltips
- **REDESIGNED CANDIDATES PAGE**: Created ProfessionalCandidates page with advanced filtering, card-based layout, and skill badges
- **ENHANCED DASHBOARD LAYOUT**: Replaced basic stats with animated stat cards showing trends, added real-time data from all hooks

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