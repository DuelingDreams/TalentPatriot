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
- **Internal Communication**: Team messaging system with Google integration.
- **Google Workspace Integration** (NEW):
  - Manual OAuth 2.0 implementation (not using Replit connectors per user preference)
  - Google Calendar API integration for creating events with Google Meet links
  - FreeBusy API for availability checking
  - Thread-based email messaging architecture
  - New database tables: `connected_accounts`, `calendar_events`, `message_threads`
  - Feature flag controlled rollout (`ENABLE_GOOGLE_INTEGRATION`)
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
- **OAuth Providers**: Google (manual OAuth 2.0), Microsoft
- **Email Service**: SendGrid
- **AI**: OpenAI GPT-4o
- **Google APIs**: googleapis npm package for Calendar and Meet integration

## Google Integration Setup Notes
**Required Environment Variables:**
- `GOOGLE_CLIENT_ID` - OAuth 2.0 client ID from Google Cloud Console
- `GOOGLE_CLIENT_SECRET` - OAuth 2.0 client secret
- `APP_JWT_SECRET` - Secret for signing OAuth state parameters (✅ CONFIGURED)

**Dynamic Redirect URI Implementation:**
✅ **Production Domain** - The OAuth flow automatically detects the redirect URI from the request host header. The app is deployed exclusively on `https://talentpatriot.com`, so Google OAuth redirects always return to the same domain, preventing cross-origin session issues.

**Security Allowlist:**
Only the production domain is permitted for OAuth redirects (hardcoded in `server/integrations/google/oauth.ts`):
- `talentpatriot.com`
- `www.talentpatriot.com`

**Google Cloud Console Setup:**
Add these redirect URIs to your OAuth 2.0 credentials:
- `https://talentpatriot.com/auth/google/callback`
- `https://www.talentpatriot.com/auth/google/callback`

**Important:** If you add new domains, you must:
1. Add the domain to `ALLOWED_REDIRECT_HOSTS` in `server/integrations/google/oauth.ts`
2. Add the redirect URI to Google Cloud Console OAuth credentials

**OAuth Scopes Used:**
- `https://www.googleapis.com/auth/calendar` - Create and manage calendar events
- `https://www.googleapis.com/auth/calendar.events` - Calendar events access
- `https://www.googleapis.com/auth/userinfo.email` - User email address
- `https://www.googleapis.com/auth/userinfo.profile` - Basic profile information

**Database Migration:**
✅ Completed - All tables created in Supabase:
- `connected_accounts` table (stores encrypted OAuth refresh tokens using AES-256-GCM)
- `calendar_events` table (tracks Google Calendar/Meet events)
- `message_threads` table (email conversation grouping)
- Updated `messages` table (added `thread_id`, `channel_type`, `external_message_id`)

**Security Implementation (Production-Ready):**
✅ **Authentication & Authorization:**
- Two-step OAuth flow: POST /auth/google/init (Bearer token) → signed cookie → GET /auth/google/login (browser redirect)
- Signed HTTP-only cookies (oauth_session) prevent forgery attacks using APP_JWT_SECRET
- Single-use cookie lifecycle with 10-minute expiration and automatic cleanup
- Organization context validated from trusted session data only
- No fallback to request parameters (query/body) for user/org identification
- Explicit org membership validation before all OAuth operations
- Account ownership verification on disconnect operations

✅ **Token Security:**
- AES-256-GCM authenticated encryption for refresh tokens
- PBKDF2 key derivation with 100,000 iterations
- Automatic token refresh with expiry checking
- Encrypted storage in database (never stored in plaintext)

✅ **OAuth State Protection:**
- HMAC-signed state parameters with 5-minute expiry
- No fallback to insecure default secrets (fails fast if APP_JWT_SECRET missing)
- State verification prevents CSRF and replay attacks

✅ **Cookie Security:**
- Cryptographically signed cookies using cookie-parser with APP_JWT_SECRET
- Signature verification via req.signedCookies prevents tampering
- Single-use cookies cleared after OAuth state generation
- Cookie cleanup on errors, expiration, and callback completion
- httpOnly, secure (production), sameSite:lax, path:/auth/google

**Testing Checklist:**
- [x] Configure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET in Replit Secrets
- [x] Add redirect URIs to Google Cloud Console (talentpatriot.com, www.talentpatriot.com)
- [x] Implement dynamic redirect URI detection from request host
- [ ] Test OAuth flow on talentpatriot.com: /settings/integrations → Connect Google → Callback success
- [ ] Verify no cross-domain session issues (user stays logged in after OAuth callback)
- [ ] Test Google Meet creation from Messages page
- [ ] Test availability checking with FreeBusy API
- [ ] Test token auto-refresh (expires_in > 0 check)
- [ ] Test disconnect flow with proper cleanup