# TalentPatriot - Dashboard Documentation

## Table of Contents
- [Dashboard Overview](#dashboard-overview)
- [Dashboard Components](#dashboard-components)
- [Data Fetching Strategy](#data-fetching-strategy)
- [Analytics Architecture](#analytics-architecture)
- [Performance Optimizations](#performance-optimizations)

## Dashboard Overview

The TalentPatriot dashboard (`/`) serves as the central hub for recruitment analytics and quick actions. It provides real-time insights into:

- Key recruitment metrics (jobs, candidates, applications, hires)
- Pipeline health across all jobs
- Recent activity feed
- Quick action shortcuts
- Application source tracking

### Dashboard Location

**Component**: `client/src/features/admin/pages/Dashboard.tsx`

## Dashboard Components

### 1. Stats Cards

The top row displays four key metrics with month-over-month growth:

```typescript
// Stats Cards Structure
interface DashboardStats {
  totalJobs: number;
  totalCandidates: number;
  totalApplications: number;
  totalHires: number;
  jobsThisMonth: number;
  candidatesThisMonth: number;
  applicationsThisMonth: number;
  hiresThisMonth: number;
}

// Example Stats Card
<Card>
  <CardHeader>
    <CardTitle>Total Jobs</CardTitle>
    <Briefcase className="h-4 w-4 text-muted-foreground" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">{stats.totalJobs}</div>
    <p className="text-xs text-muted-foreground">
      +{stats.jobsThisMonth} this month
    </p>
  </CardContent>
</Card>
```

**Data Source**: `/api/analytics/dashboard-stats`

### 2. Pipeline Snapshot

Displays pipeline health for all active jobs with stage-by-stage breakdown:

```typescript
interface PipelineSnapshotData {
  job_id: string;
  job_title: string;
  org_id: string;
  job_status: string;
  applied: number;
  phone_screen: number;
  interview: number;
  technical: number;
  final: number;
  offer: number;
  hired: number;
  rejected: number;
  total_candidates: number;
}
```

**Data Source**: Materialized view `v_dashboard_pipeline_snapshot`

**Features**:
- Click job title to navigate to job details
- Stage counts show candidate distribution
- Only displays open jobs by default

### 3. Recent Activity Feed

Shows the latest candidate stage transitions across all jobs:

```typescript
interface DashboardActivityData {
  changed_at: string;
  job_id: string;
  job_title: string;
  candidate_id: string;
  candidate_name: string;
  from_stage: string | null;
  to_stage: string;
  from_stage_display: string | null;
  to_stage_display: string;
}
```

**Data Source**: Materialized view `v_dashboard_recent_activity`

**Features**:
- Real-time updates when candidates move stages
- Displays last 10 activities by default
- Click candidate name to view profile

### 4. Quick Actions

Dynamic action cards that compute metrics in real-time:

```typescript
// Quick action types
interface QuickAction {
  title: string;
  description: string;
  count: number;
  icon: React.ComponentType;
  action: () => void;
  badgeVariant?: 'default' | 'secondary' | 'destructive';
}

// Example quick actions
const quickActions = [
  {
    title: 'New Applications',
    description: 'Review recent applications',
    count: newApplicationsCount,
    icon: Users,
    action: () => navigate('/candidates?filter=new'),
  },
  {
    title: 'Scheduled Interviews',
    description: 'Upcoming interviews this week',
    count: upcomingInterviewsCount,
    icon: Calendar,
    action: () => navigate('/calendar'),
  },
];
```

### 5. Application Source Tracking

Visual breakdown of where candidates are coming from:

```typescript
interface CandidateSource {
  source: string;
  applications: number;
  hires: number;
}

// Data comes from materialized view
const { data: sources } = useQuery({
  queryKey: ['/api/reports/metrics'],
});

// Renders as bar chart using Recharts
<BarChart data={sources}>
  <Bar dataKey="applications" fill="#3b82f6" />
  <Bar dataKey="hires" fill="#10b981" />
</BarChart>
```

**Data Source**: Materialized view `mv_candidate_sources`

**Sources Tracked**:
- Company Website
- LinkedIn
- Indeed
- Referral
- Job Board
- Other

## Data Fetching Strategy

### TanStack Query Integration

All dashboard data is fetched using **TanStack Query v5** for:
- Automatic caching
- Background refetching
- Loading states
- Error handling

```typescript
function Dashboard() {
  const orgId = useOrgId();
  
  // Parallel data fetching
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/analytics/dashboard-stats', orgId],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const { data: pipeline, isLoading: pipelineLoading } = useQuery({
    queryKey: ['/api/analytics/pipeline-snapshot', orgId],
    staleTime: 5 * 60 * 1000,
  });
  
  const { data: activity, isLoading: activityLoading } = useQuery({
    queryKey: ['/api/analytics/recent-activity', orgId],
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  if (statsLoading || pipelineLoading || activityLoading) {
    return <DashboardSkeleton />;
  }
  
  return <DashboardContent stats={stats} pipeline={pipeline} activity={activity} />;
}
```

### Organization Context

All dashboard queries include `orgId` in the query key for multi-tenant data isolation:

```typescript
// Custom hook for organization context
function useOrgId() {
  const { data: user } = useQuery({ queryKey: ['/api/auth/user'] });
  return user?.currentOrgId;
}

// Usage in queries
const { data } = useQuery({
  queryKey: ['/api/analytics/dashboard-stats', orgId],
  enabled: !!orgId, // Only fetch when orgId is available
});
```

## Analytics Architecture

### Backend Repository

All analytics queries are handled by `AnalyticsRepository`:

**Location**: `server/storage/analytics/repository.ts`

```typescript
export class AnalyticsRepository implements IAnalyticsRepository {
  async getDashboardStats(orgId: string): Promise<DashboardStats> {
    // Parallel database queries for performance
    const [jobsResult, candidatesResult, applicationsResult, hiresResult] = 
      await Promise.all([
        supabase.from('jobs').select('id', { count: 'exact' }).eq('org_id', orgId),
        supabase.from('candidates').select('id', { count: 'exact' }).eq('org_id', orgId),
        supabase.from('job_candidate').select('id', { count: 'exact' }).eq('org_id', orgId),
        supabase.from('job_candidate').select('id', { count: 'exact' })
          .eq('org_id', orgId).eq('stage', 'hired'),
      ]);
    
    return {
      totalJobs: jobsResult.count || 0,
      totalCandidates: candidatesResult.count || 0,
      totalApplications: applicationsResult.count || 0,
      totalHires: hiresResult.count || 0,
      // ... month stats
    };
  }
  
  async getPipelineSnapshot(orgId: string): Promise<PipelineSnapshotData[]> {
    // Uses materialized view for performance
    const { data } = await supabase
      .from('v_dashboard_pipeline_snapshot')
      .select('*')
      .eq('org_id', orgId)
      .eq('job_status', 'open');
    
    return data as PipelineSnapshotData[];
  }
}
```

### Materialized Views

TalentPatriot uses **materialized views** for fast analytics queries. These are pre-computed database views that cache complex aggregations.

#### v_dashboard_pipeline_snapshot

```sql
CREATE MATERIALIZED VIEW v_dashboard_pipeline_snapshot AS
SELECT
  j.id AS job_id,
  j.title AS job_title,
  j.org_id,
  j.status AS job_status,
  COUNT(CASE WHEN jc.stage = 'applied' THEN 1 END) AS applied,
  COUNT(CASE WHEN jc.stage = 'phone_screen' THEN 1 END) AS phone_screen,
  COUNT(CASE WHEN jc.stage = 'interview' THEN 1 END) AS interview,
  COUNT(CASE WHEN jc.stage = 'technical' THEN 1 END) AS technical,
  COUNT(CASE WHEN jc.stage = 'final' THEN 1 END) AS final,
  COUNT(CASE WHEN jc.stage = 'offer' THEN 1 END) AS offer,
  COUNT(CASE WHEN jc.stage = 'hired' THEN 1 END) AS hired,
  COUNT(CASE WHEN jc.stage = 'rejected' THEN 1 END) AS rejected,
  COUNT(jc.id) AS total_candidates
FROM jobs j
LEFT JOIN job_candidate jc ON j.id = jc.job_id
GROUP BY j.id, j.title, j.org_id, j.status;
```

**Refresh Strategy**: Views are refreshed on-demand when data changes

#### mv_candidate_sources

```sql
CREATE MATERIALIZED VIEW mv_candidate_sources AS
SELECT
  org_id,
  application_source AS source,
  COUNT(*) AS applications,
  COUNT(CASE WHEN hired = true THEN 1 END) AS hires
FROM application_metadata
GROUP BY org_id, application_source;
```

## Performance Optimizations

### 1. Query Caching

TanStack Query caches all dashboard data with configurable `staleTime`:

```typescript
// Stats cached for 5 minutes
const { data: stats } = useQuery({
  queryKey: ['/api/analytics/dashboard-stats', orgId],
  staleTime: 5 * 60 * 1000,
});

// Activity refreshes every 30 seconds
const { data: activity } = useQuery({
  queryKey: ['/api/analytics/recent-activity', orgId],
  staleTime: 30000,
  refetchInterval: 30000,
});
```

### 2. Parallel Data Fetching

All dashboard queries run in parallel for faster initial load:

```typescript
// All queries execute simultaneously
const queries = [
  useQuery({ queryKey: ['/api/analytics/dashboard-stats', orgId] }),
  useQuery({ queryKey: ['/api/analytics/pipeline-snapshot', orgId] }),
  useQuery({ queryKey: ['/api/analytics/recent-activity', orgId] }),
  useQuery({ queryKey: ['/api/reports/metrics', orgId] }),
];

// Dashboard only renders when ALL queries complete
if (queries.some(q => q.isLoading)) {
  return <DashboardSkeleton />;
}
```

### 3. Database Indexing

Critical columns are indexed for fast queries:

```sql
-- Job queries
CREATE INDEX idx_jobs_org_status ON jobs(org_id, status);

-- Candidate queries
CREATE INDEX idx_candidates_org ON candidates(org_id);

-- Application queries
CREATE INDEX idx_job_candidate_org_stage ON job_candidate(org_id, stage);

-- Source tracking
CREATE INDEX idx_app_metadata_org_source ON application_metadata(org_id, application_source);
```

### 4. Loading Skeletons

Dashboard uses skeleton loading states for better UX:

```typescript
function DashboardSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32 mt-2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

## Dashboard API Endpoints

### GET /api/analytics/dashboard-stats

Returns overall dashboard statistics.

**Headers**:
- `X-Org-Id`: Organization ID (required)

**Response**:
```json
{
  "totalJobs": 25,
  "totalCandidates": 150,
  "totalApplications": 200,
  "totalHires": 12,
  "jobsThisMonth": 5,
  "candidatesThisMonth": 30,
  "applicationsThisMonth": 45,
  "hiresThisMonth": 3
}
```

### GET /api/analytics/pipeline-snapshot

Returns pipeline health for all jobs.

**Headers**:
- `X-Org-Id`: Organization ID (required)

**Query Parameters**:
- `limit` (optional): Limit results (default: 10)

**Response**:
```json
[
  {
    "job_id": "uuid",
    "job_title": "Senior React Developer",
    "org_id": "uuid",
    "job_status": "open",
    "applied": 15,
    "phone_screen": 8,
    "interview": 5,
    "technical": 3,
    "final": 2,
    "offer": 1,
    "hired": 0,
    "rejected": 4,
    "total_candidates": 15
  }
]
```

### GET /api/analytics/recent-activity

Returns recent candidate stage transitions.

**Headers**:
- `X-Org-Id`: Organization ID (required)

**Query Parameters**:
- `limit` (optional): Limit results (default: 10)

**Response**:
```json
[
  {
    "changed_at": "2025-10-24T10:30:00Z",
    "job_id": "uuid",
    "job_title": "Senior React Developer",
    "candidate_id": "uuid",
    "candidate_name": "John Doe",
    "from_stage": "phone_screen",
    "to_stage": "interview",
    "from_stage_display": "Phone Screen",
    "to_stage_display": "Interview"
  }
]
```

### GET /api/reports/metrics

Returns application source breakdown.

**Headers**:
- `X-Org-Id`: Organization ID (required)

**Response**:
```json
{
  "sources": [
    {
      "source": "Company Website",
      "applications": 45,
      "hires": 12
    },
    {
      "source": "LinkedIn",
      "applications": 35,
      "hires": 8
    }
  ]
}
```

## Related Documentation

- [Routes Documentation](./routes.md) - Dashboard routing
- [Data Model Documentation](./data-model.md) - Analytics tables and views
- [Authentication Documentation](./auth.md) - Organization context setup
