# TalentPatriot ATS - System Documentation

## Table Definitions & Relationships

### Core Tables

#### **clients**
```sql
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    location VARCHAR(255),
    website VARCHAR(255),
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    notes TEXT,
    status record_status DEFAULT 'active' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_by UUID
);
```

#### **jobs**
```sql
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    client_id UUID NOT NULL REFERENCES clients(id),
    status job_status DEFAULT 'open' NOT NULL,
    record_status record_status DEFAULT 'active' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_by UUID,
    assigned_to UUID
);
```

#### **candidates**
```sql
CREATE TABLE candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    resume_url TEXT,
    status record_status DEFAULT 'active' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_by UUID
);
```

#### **job_candidate** (Many-to-Many with Pipeline Status)
```sql
CREATE TABLE job_candidate (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id),
    candidate_id UUID NOT NULL REFERENCES candidates(id),
    stage candidate_stage DEFAULT 'applied' NOT NULL,
    notes TEXT,
    assigned_to UUID,
    status record_status DEFAULT 'active' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_job_candidate UNIQUE (job_id, candidate_id)
);
```

#### **candidate_notes**
```sql
CREATE TABLE candidate_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_candidate_id UUID NOT NULL REFERENCES job_candidate(id),
    author_id UUID NOT NULL,
    content TEXT NOT NULL,
    is_private VARCHAR(10) DEFAULT 'false' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
```

#### **interviews**
```sql
CREATE TABLE interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_candidate_id UUID NOT NULL REFERENCES job_candidate(id),
    title TEXT NOT NULL,
    type interview_type NOT NULL,
    status interview_status DEFAULT 'scheduled' NOT NULL,
    scheduled_at TIMESTAMP NOT NULL,
    duration TEXT DEFAULT '60',
    location TEXT,
    interviewer_id UUID,
    notes TEXT,
    feedback TEXT,
    rating TEXT,
    record_status record_status DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
```

#### **messages**
```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type message_type NOT NULL,
    priority message_priority DEFAULT 'normal' NOT NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    sender_id UUID NOT NULL,
    recipient_id UUID,
    
    -- Context references
    client_id UUID REFERENCES clients(id),
    job_id UUID REFERENCES jobs(id),
    candidate_id UUID REFERENCES candidates(id),
    job_candidate_id UUID REFERENCES job_candidate(id),
    
    is_read BOOLEAN DEFAULT false NOT NULL,
    read_at TIMESTAMP,
    is_archived BOOLEAN DEFAULT false NOT NULL,
    
    -- Thread support
    thread_id UUID,
    reply_to_id UUID,
    
    -- Metadata
    attachments TEXT[],
    tags TEXT[],
    
    record_status record_status DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
```

### ENUM Types

```sql
-- Job statuses
CREATE TYPE job_status AS ENUM ('open', 'closed', 'on_hold', 'filled');

-- Candidate pipeline stages
CREATE TYPE candidate_stage AS ENUM ('applied', 'screening', 'interview', 'technical', 'final', 'offer', 'hired', 'rejected');

-- Record status for demo data isolation
CREATE TYPE record_status AS ENUM ('active', 'demo', 'archived');

-- User roles
CREATE TYPE user_role AS ENUM ('recruiter', 'bd', 'pm', 'demo_viewer', 'admin');

-- Interview types
CREATE TYPE interview_type AS ENUM ('phone', 'video', 'onsite', 'technical', 'cultural');

-- Interview statuses
CREATE TYPE interview_status AS ENUM ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show');

-- Message types and priorities
CREATE TYPE message_type AS ENUM ('internal', 'client', 'candidate', 'system');
CREATE TYPE message_priority AS ENUM ('low', 'normal', 'high', 'urgent');
```

### Key Relationships

- `jobs.client_id` → `clients.id` (Many jobs per client)
- `job_candidate.job_id` → `jobs.id` (Many applications per job)
- `job_candidate.candidate_id` → `candidates.id` (Many applications per candidate)
- `candidate_notes.job_candidate_id` → `job_candidate.id` (Many notes per application)
- `interviews.job_candidate_id` → `job_candidate.id` (Many interviews per application)
- `messages.client_id|job_id|candidate_id|job_candidate_id` → Various context references

---

## Role Definitions & Permissions

### Authentication Method
- **Authentication Provider**: Supabase Auth
- **User ID Source**: `auth.users.id` (UUID)
- **Role Source**: `auth.users.user_metadata.role`
- **Organization Context**: Currently single-tenant (no org table yet)

### Role Hierarchy & Permissions

#### **RECRUITER** (Full Access)
```sql
-- Full CRUD access to all tables
-- Can write candidate_notes only with their own author_id
-- Can modify demo data
-- Primary role for ATS operations
```

#### **BD (Business Development)** (Read-Only)
```sql
-- Read-only access to: clients, jobs, candidates, job_candidate, candidate_notes
-- Cannot write to any table
-- Used for business development oversight
```

#### **PM (Project Manager)** (Limited Read)
```sql
-- Read-only access to jobs with status = 'contract'
-- Read-only access to job_candidate for contract jobs
-- Cannot write to any table
-- Focused on contract-based placements
```

#### **DEMO_VIEWER** (Demo Data Only)
```sql
-- Read-only access to records with status = 'demo'
-- Cannot write to any table
-- Used for product demonstrations
```

#### **UNAUTHENTICATED** (No Access)
```sql
-- No access to any data
-- All operations denied via RLS policies
```

### RLS Policy Implementation

```sql
-- Helper function to get user role
CREATE OR REPLACE FUNCTION auth.get_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role',
    'unauthenticated'
  );
$$;

-- Example policy (Recruiters full access to clients)
CREATE POLICY "recruiters_full_access_clients"
ON clients
FOR ALL
TO authenticated
USING (auth.get_user_role() = 'recruiter')
WITH CHECK (auth.get_user_role() = 'recruiter');

-- Example policy (Demo viewers limited to demo data)
CREATE POLICY "demo_viewer_read_clients"
ON clients
FOR SELECT
TO authenticated
USING (
  auth.get_user_role() = 'demo_viewer' 
  AND status = 'demo'
);
```

---

## Data Fetching Examples

### Frontend JavaScript (React Query)

#### Hook-based Data Fetching
```typescript
// client/src/hooks/useClients.ts
export function useClients() {
  return useQuery({
    queryKey: ['/api/clients'],
    queryFn: () => apiRequest('/api/clients'),
  })
}

// Usage in component
const { data: clients, isLoading, error } = useClients()
```

#### Mutation with Cache Invalidation
```typescript
export function useCreateClient() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (client: InsertClient) =>
      apiRequest('/api/clients', {
        method: 'POST',
        body: JSON.stringify(client),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] })
    },
  })
}
```

### Backend API Layer (Express + Drizzle)

#### Direct SQL Query Example
```typescript
// server/storage.ts - DatabaseStorage class
async getClients(): Promise<Client[]> {
  try {
    const result = await this.db
      .select()
      .from(clients)
      .where(eq(clients.status, 'active'))
      .orderBy(desc(clients.createdAt))
    
    return this.mapArrayKeys(result, this.snakeToCamel)
  } catch (error) {
    throw new Error(`Failed to fetch clients: ${error.message}`)
  }
}
```

#### Complex Join Query Example
```typescript
async getJobsWithCandidateCounts(): Promise<(Job & { candidateCount: number })[]> {
  const result = await this.db
    .select({
      id: jobs.id,
      title: jobs.title,
      clientId: jobs.clientId,
      status: jobs.status,
      candidateCount: sql<number>`count(${jobCandidate.id})::int`
    })
    .from(jobs)
    .leftJoin(jobCandidate, eq(jobs.id, jobCandidate.jobId))
    .where(eq(jobs.recordStatus, 'active'))
    .groupBy(jobs.id)
    .orderBy(desc(jobs.createdAt))
  
  return this.mapArrayKeys(result, this.snakeToCamel)
}
```

### Raw SQL Examples

#### Pipeline Data Query
```sql
-- Get candidate pipeline data for a specific job
SELECT 
  c.name as candidate_name,
  c.email,
  jc.stage,
  jc.notes,
  jc.updated_at,
  COUNT(cn.id) as note_count
FROM job_candidate jc
JOIN candidates c ON jc.candidate_id = c.id
LEFT JOIN candidate_notes cn ON jc.id = cn.job_candidate_id
WHERE jc.job_id = $1
  AND jc.status = 'active'
GROUP BY c.id, jc.id
ORDER BY jc.updated_at DESC;
```

#### Dashboard Statistics Query
```sql
-- Get dashboard stats with RLS applied
SELECT 
  (SELECT COUNT(*) FROM clients WHERE status = 'active') as active_clients,
  (SELECT COUNT(*) FROM jobs WHERE status = 'open') as open_jobs,
  (SELECT COUNT(*) FROM candidates WHERE status = 'active') as active_candidates,
  (SELECT COUNT(*) FROM job_candidate WHERE stage = 'hired') as hired_count;
```

---

## Organizational Context

### Current Architecture (Single-Tenant)

**No Organizations Table Yet** - The current system operates as single-tenant:

- All users share the same data pool
- Role-based access control via RLS policies
- Demo data isolated via `status = 'demo'` field
- User scoping handled through role permissions

### User Scoping Method

#### Authentication Context
```typescript
// client/src/contexts/AuthContext.tsx
interface AuthContextType {
  user: User | null           // Supabase user object
  session: Session | null     // Active session
  userRole: string | null     // From user_metadata.role
  loading: boolean
}

// Role extraction from JWT
const role = session.user.user_metadata?.role || null
```

#### Backend User Identification
```typescript
// server/routes.ts - Middleware example
const getUserFromSession = async (req: Request) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return null
  
  const token = authHeader.substring(7)
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  return user
}
```

### Future Multi-Tenant Considerations

For multi-tenant architecture, you would add:

```sql
-- Organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add org_id to all existing tables
ALTER TABLE clients ADD COLUMN org_id UUID REFERENCES organizations(id);
ALTER TABLE jobs ADD COLUMN org_id UUID REFERENCES organizations(id);
-- ... etc for all tables

-- Update RLS policies to include org_id filtering
CREATE POLICY "org_scoped_clients"
ON clients
FOR ALL
TO authenticated
USING (
  org_id = (auth.jwt() ->> 'user_metadata')::jsonb ->> 'org_id'::uuid
);
```

### Data Access Patterns

#### Role-Based Data Access
```typescript
// Current implementation scopes by role, not organization
const getClientsForUser = async (userRole: string) => {
  switch (userRole) {
    case 'recruiter':
      return getAllClients()      // Full access
    case 'bd':
      return getAllClients()      // Read-only via RLS
    case 'demo_viewer':
      return getDemoClients()     // Demo data only
    default:
      return []                   // No access
  }
}
```

#### Security Implementation
- **Authentication**: Supabase JWT tokens
- **Authorization**: Row-Level Security policies
- **Data Isolation**: Status-based filtering (`status = 'demo'`)
- **API Security**: Role validation in middleware
- **Field Mapping**: Automatic camelCase ↔ snake_case conversion

This system provides comprehensive security while maintaining flexibility for future organizational features.