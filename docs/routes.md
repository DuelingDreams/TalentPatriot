# TalentPatriot - Routing Documentation

## Table of Contents
- [Routing Overview](#routing-overview)
- [Frontend Routes](#frontend-routes)
- [Route Configuration](#route-configuration)
- [Navigation Patterns](#navigation-patterns)
- [Public vs Authenticated Routes](#public-vs-authenticated-routes)

## Routing Overview

TalentPatriot uses **Wouter** for client-side routing. Wouter is a lightweight alternative to React Router with a similar API but smaller bundle size (1.5kb vs 40kb).

### Why Wouter?

- **Lightweight**: Only 1.5kb gzipped
- **React Router-like API**: Familiar `<Route>`, `<Link>`, and `useLocation()` hooks
- **No Dependencies**: Works with React 16.8+
- **TypeScript Support**: Full type safety

## Frontend Routes

All routes are defined in `client/src/App.tsx`. The application uses **lazy loading** for code splitting and performance optimization.

### Route Structure

```typescript
// Lazy-loaded page components
const Dashboard = lazy(() => import('./features/admin/pages/Dashboard'));
const Candidates = lazy(() => import('./features/candidates/pages/Candidates'));
const Jobs = lazy(() => import('./features/jobs/pages/Jobs'));
// ... etc

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Route path="/" component={Dashboard} />
      <Route path="/candidates" component={Candidates} />
      <Route path="/jobs" component={Jobs} />
      {/* ... more routes */}
    </Suspense>
  );
}
```

### Complete Route Mapping

| Path | Component | Description | Auth Required |
|------|-----------|-------------|---------------|
| `/` | Dashboard | Main dashboard with analytics | Yes |
| `/candidates` | Candidates | Candidate management list | Yes |
| `/candidates/:id` | CandidateDetail | Individual candidate profile | Yes |
| `/jobs` | Jobs | Job listings management | Yes |
| `/jobs/:id` | JobDetail | Individual job details | Yes |
| `/jobs/:id/pipeline` | JobPipeline | Kanban pipeline for specific job | Yes |
| `/clients` | Clients | Client company management | Yes |
| `/messages` | Messages | Team communication & messaging | Yes |
| `/calendar` | Calendar | Interview scheduling | Yes |
| `/reports` | Reports | Analytics & reporting dashboard | Yes |
| `/settings` | Settings | User & organization settings | Yes |
| `/settings/integrations` | Integrations | Google Workspace integration setup | Yes |
| `/onboarding` | Onboarding | 5-step user onboarding flow | Yes (new users) |
| `/careers/:orgSlug` | CareersPortal | Public job listings by organization | No |
| `/careers/:orgSlug/:jobSlug` | JobApplicationForm | Public job application form | No |
| `/login` | Login | Authentication page | No |
| `/signup` | Signup | User registration | No |
| `/about` | About | Company information | No |
| `/help` | Help | Support center | No |
| `/docs` | Documentation | Help center & API docs | No |

## Route Configuration

### App.tsx Structure

```typescript
import { Route, Switch } from 'wouter';
import { lazy, Suspense } from 'react';

// Lazy-load all pages for code splitting
const Dashboard = lazy(() => import('./features/admin/pages/Dashboard'));
const Candidates = lazy(() => import('./features/candidates/pages/Candidates'));
// ... more imports

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <Suspense fallback={<div>Loading...</div>}>
        <Switch>
          {/* Authenticated Routes */}
          <Route path="/" component={Dashboard} />
          <Route path="/candidates" component={Candidates} />
          <Route path="/candidates/:id" component={CandidateDetail} />
          <Route path="/jobs" component={Jobs} />
          <Route path="/jobs/:id" component={JobDetail} />
          <Route path="/jobs/:id/pipeline" component={JobPipeline} />
          
          {/* Public Routes */}
          <Route path="/careers/:orgSlug" component={CareersPortal} />
          <Route path="/careers/:orgSlug/:jobSlug" component={JobApplicationForm} />
          <Route path="/login" component={Login} />
          <Route path="/signup" component={Signup} />
          
          {/* Fallback */}
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </QueryClientProvider>
  );
}
```

## Navigation Patterns

### Using the Link Component

```typescript
import { Link } from 'wouter';

function Navigation() {
  return (
    <nav>
      <Link href="/candidates">Candidates</Link>
      <Link href="/jobs">Jobs</Link>
      <Link href="/reports">Reports</Link>
    </nav>
  );
}
```

### Programmatic Navigation

```typescript
import { useLocation } from 'wouter';

function SomeComponent() {
  const [location, setLocation] = useLocation();
  
  const handleNavigate = () => {
    setLocation('/candidates');
  };
  
  return <button onClick={handleNavigate}>Go to Candidates</button>;
}
```

### URL Parameters

```typescript
import { Route, useRoute } from 'wouter';

function CandidateDetail() {
  const [match, params] = useRoute('/candidates/:id');
  
  if (!match) return null;
  
  const candidateId = params.id;
  
  // Fetch candidate data using candidateId
  const { data: candidate } = useQuery({
    queryKey: ['/api/candidates', candidateId],
  });
  
  return <div>{candidate?.name}</div>;
}
```

## Public vs Authenticated Routes

### Authentication Guard Pattern

TalentPatriot uses **Supabase Auth** to protect authenticated routes. The authentication check happens at the component level:

```typescript
// Protected component example
function Dashboard() {
  const { data: session, isLoading } = useQuery({
    queryKey: ['/api/auth/session'],
  });
  
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    if (!isLoading && !session) {
      setLocation('/login');
    }
  }, [session, isLoading, setLocation]);
  
  if (isLoading) return <LoadingSpinner />;
  if (!session) return null;
  
  return <div>Dashboard content</div>;
}
```

### Public Routes

Public routes are accessible without authentication:

1. **Careers Portal**: `/careers/:orgSlug` - Public job listings
2. **Job Application Form**: `/careers/:orgSlug/:jobSlug` - Public application submission
3. **Login/Signup**: `/login`, `/signup` - Authentication pages
4. **Marketing Pages**: `/about`, `/help`, `/docs` - Company information

### Organization Context in Public Routes

Public careers pages use organization slugs to determine which organization's jobs to display:

```typescript
// Example: /careers/hildebrand
function CareersPortal() {
  const [match, params] = useRoute('/careers/:orgSlug');
  const orgSlug = params?.orgSlug;
  
  const { data: jobs } = useQuery({
    queryKey: ['/api/public/jobs', orgSlug],
  });
  
  return (
    <div>
      <h1>Jobs at {orgSlug}</h1>
      {jobs?.map(job => <JobCard key={job.id} job={job} />)}
    </div>
  );
}
```

## Subdomain Routing

TalentPatriot supports **subdomain-based routing** for organization careers pages:

- **Production Domain**: `talentpatriot.com` (authenticated users)
- **Organization Subdomain**: `hildebrand.talentpatriot.com` (public careers page)

### How It Works

1. User accesses `hildebrand.talentpatriot.com`
2. Server detects subdomain and serves the React app
3. Frontend detects subdomain in `window.location.hostname`
4. App automatically routes to `/careers/hildebrand`

```typescript
// Subdomain detection example
const hostname = window.location.hostname;
const subdomain = hostname.split('.')[0];

if (subdomain !== 'talentpatriot' && subdomain !== 'www') {
  // Redirect to careers portal
  setLocation(`/careers/${subdomain}`);
}
```

## Navigation Components

### Sidebar Navigation

The main authenticated app uses a sidebar for navigation:

```typescript
// components/Sidebar.tsx
import { Link, useLocation } from 'wouter';

function Sidebar() {
  const [location] = useLocation();
  
  return (
    <nav>
      <Link href="/">
        <a className={location === '/' ? 'active' : ''}>Dashboard</a>
      </Link>
      <Link href="/candidates">
        <a className={location === '/candidates' ? 'active' : ''}>Candidates</a>
      </Link>
      {/* ... more links */}
    </nav>
  );
}
```

### Breadcrumbs

Complex pages use breadcrumbs for navigation hierarchy:

```typescript
// Example: /jobs/123/pipeline
function JobPipeline() {
  const [match, params] = useRoute('/jobs/:id/pipeline');
  const jobId = params?.id;
  
  return (
    <div>
      <Breadcrumbs>
        <Link href="/jobs">Jobs</Link>
        <Link href={`/jobs/${jobId}`}>Job Details</Link>
        <span>Pipeline</span>
      </Breadcrumbs>
      {/* ... */}
    </div>
  );
}
```

## Route-Specific Data Fetching

Each route component is responsible for fetching its own data using TanStack Query:

```typescript
function Candidates() {
  const orgId = useOrgId(); // Custom hook to get current org
  
  const { data: candidates, isLoading } = useQuery({
    queryKey: ['/api/candidates', { orgId }],
  });
  
  if (isLoading) return <LoadingSpinner />;
  
  return (
    <div>
      {candidates?.map(candidate => (
        <CandidateCard key={candidate.id} candidate={candidate} />
      ))}
    </div>
  );
}
```

## Best Practices

1. **Lazy Load Pages**: Use `React.lazy()` for all page components to reduce initial bundle size
2. **Use Link Component**: Always use `<Link>` from wouter instead of `<a>` tags
3. **Centralize Routes**: Keep all route definitions in `App.tsx` for easy maintenance
4. **URL Parameters**: Use descriptive parameter names (`:id`, `:jobSlug`, not `:x`)
5. **Loading States**: Always show loading spinners during route transitions
6. **404 Handling**: Include a catch-all route for unmatched paths

## Related Documentation

- [Authentication Documentation](./auth.md) - How auth guards work
- [Dashboard Documentation](./dashboard.md) - Dashboard-specific routing
- [Data Model Documentation](./data-model.md) - API endpoints used by routes
