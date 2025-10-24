# TalentPatriot - Authentication Documentation

## Table of Contents
- [Authentication Overview](#authentication-overview)
- [Supabase Auth Integration](#supabase-auth-integration)
- [Google OAuth Integration](#google-oauth-integration)
- [Session Management](#session-management)
- [Authorization & Access Control](#authorization--access-control)
- [Security Features](#security-features)

## Authentication Overview

TalentPatriot implements a multi-layered authentication system with:

1. **Primary Auth**: Supabase Auth for user authentication
2. **OAuth Providers**: Google OAuth 2.0 for workspace integration
3. **Organization Context**: Multi-tenant user-organization assignments
4. **Role-Based Access Control**: Organization-level permissions

### Authentication Flow

```
User → Login → Supabase Auth → JWT Token → Organization Selection → Dashboard
```

## Supabase Auth Integration

### Setup

**Environment Variables**:
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Server-side service role key

**Client Configuration**:

```typescript
// client/src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### User Registration

**Location**: `client/src/features/auth/pages/Signup.tsx`

```typescript
async function handleSignup(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/onboarding`,
    },
  });
  
  if (error) throw error;
  
  // Supabase automatically:
  // 1. Creates user in auth.users table
  // 2. Sends verification email
  // 3. Triggers database function to create user_profile
  
  return data;
}
```

**Database Trigger**:

```sql
-- Automatically creates user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, role)
  VALUES (new.id, 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### User Login

**Location**: `client/src/features/auth/pages/Login.tsx`

```typescript
async function handleLogin(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  
  // Session is automatically stored in localStorage
  // JWT token is available in data.session.access_token
  
  return data;
}
```

### Session Persistence

Supabase Auth automatically handles session persistence using:

- **localStorage**: Stores session tokens
- **Automatic Refresh**: Refreshes tokens before expiry
- **Session Recovery**: Recovers session on page reload

```typescript
// Check current session
const { data: session } = await supabase.auth.getSession();

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    console.log('User signed in');
  } else if (event === 'SIGNED_OUT') {
    console.log('User signed out');
  }
});
```

### User Logout

```typescript
async function handleLogout() {
  const { error } = await supabase.auth.signOut();
  
  if (error) throw error;
  
  // Redirect to login page
  window.location.href = '/login';
}
```

## Google OAuth Integration

TalentPatriot implements **manual OAuth 2.0** (not using Replit connectors per user preference) for Google Workspace integration.

### OAuth Scopes

```typescript
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];
```

### OAuth Flow

#### Step 1: Initialize OAuth

**Frontend** (`/settings/integrations`):

```typescript
async function initiateGoogleOAuth() {
  // POST to init endpoint with Bearer token
  const response = await apiRequest('/api/auth/google/init', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'X-Org-Id': currentOrgId,
    },
  });
  
  // Response includes signed cookie (oauth_session)
  // Redirect to OAuth login URL
  window.location.href = '/api/auth/google/login';
}
```

**Backend** (`server/routes/auth.ts`):

```typescript
app.post('/api/auth/google/init', requireAuth, async (req, res) => {
  const { userId, orgId } = req.authContext;
  
  // Generate HMAC-signed state parameter
  const state = generateOAuthState({ userId, orgId });
  
  // Set signed HTTP-only cookie (10-minute expiry)
  res.cookie('oauth_session', JSON.stringify({ userId, orgId }), {
    signed: true,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000, // 10 minutes
    path: '/auth/google',
  });
  
  res.json({ success: true });
});
```

#### Step 2: Redirect to Google

**Backend** (`GET /api/auth/google/login`):

```typescript
app.get('/api/auth/google/login', async (req, res) => {
  // Verify signed cookie
  const sessionData = req.signedCookies.oauth_session;
  
  if (!sessionData) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { userId, orgId } = JSON.parse(sessionData);
  
  // Generate HMAC-signed state
  const state = signOAuthState({ userId, orgId });
  
  // Redirect to Google OAuth consent screen
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: 'https://talentpatriot.com/auth/google/callback',
    response_type: 'code',
    scope: GOOGLE_SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state,
  })}`;
  
  res.redirect(authUrl);
});
```

#### Step 3: Handle Callback

**Backend** (`GET /api/auth/google/callback`):

```typescript
app.get('/api/auth/google/callback', async (req, res) => {
  const { code, state } = req.query;
  
  // Verify HMAC signature
  const { userId, orgId } = verifyOAuthState(state);
  
  // Exchange code for tokens
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: 'https://talentpatriot.com/auth/google/callback',
      grant_type: 'authorization_code',
    }),
  });
  
  const tokens = await tokenResponse.json();
  
  // Encrypt refresh token using AES-256-GCM
  const encryptedRefreshToken = encryptToken(tokens.refresh_token);
  
  // Store in database
  await supabase.from('connected_accounts').insert({
    user_id: userId,
    org_id: orgId,
    provider: 'google',
    access_token: tokens.access_token,
    refresh_token: encryptedRefreshToken,
    expires_at: new Date(Date.now() + tokens.expires_in * 1000),
  });
  
  // Clear cookie and redirect
  res.clearCookie('oauth_session');
  res.redirect('https://talentpatriot.com/settings/integrations?success=true');
});
```

### Token Encryption

OAuth refresh tokens are encrypted using **AES-256-GCM** before storage:

```typescript
import crypto from 'crypto';

const ENCRYPTION_KEY = deriveKeyFromSecret(process.env.APP_JWT_SECRET);

function encryptToken(token: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Format: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decryptToken(encryptedToken: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedToken.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

### OAuth State Security

State parameters are signed using **HMAC-SHA256** to prevent tampering:

```typescript
function signOAuthState(data: { userId: string; orgId: string }): string {
  const payload = {
    ...data,
    exp: Date.now() + 5 * 60 * 1000, // 5 minutes
  };
  
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64');
  const signature = crypto
    .createHmac('sha256', process.env.APP_JWT_SECRET)
    .update(payloadBase64)
    .digest('hex');
  
  return `${payloadBase64}.${signature}`;
}

function verifyOAuthState(state: string): { userId: string; orgId: string } {
  const [payloadBase64, signature] = state.split('.');
  
  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', process.env.APP_JWT_SECRET)
    .update(payloadBase64)
    .digest('hex');
  
  if (signature !== expectedSignature) {
    throw new Error('Invalid state signature');
  }
  
  const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString());
  
  // Check expiry
  if (Date.now() > payload.exp) {
    throw new Error('State expired');
  }
  
  return { userId: payload.userId, orgId: payload.orgId };
}
```

## Session Management

### Frontend Session Handling

**Custom Hook**: `useAuth()`

```typescript
// client/src/hooks/useAuth.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useAuth() {
  const { data: session, isLoading } = useQuery({
    queryKey: ['/api/auth/session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  return {
    user: session?.user,
    isAuthenticated: !!session,
    isLoading,
  };
}
```

### Backend Session Validation

**Middleware**: `requireAuth`

```typescript
// server/middleware/auth.ts
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const token = authHeader.substring(7);
  
  // Verify JWT with Supabase
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  // Attach user to request
  req.authContext = { userId: user.id };
  
  next();
}
```

## Authorization & Access Control

### Organization Context

Every API request includes organization context via headers:

```typescript
// Frontend
const response = await apiRequest('/api/candidates', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'X-Org-Id': currentOrgId,
    'X-User-Id': userId,
  },
});

// Backend
app.get('/api/candidates', requireAuth, async (req, res) => {
  const orgId = req.headers['x-org-id'];
  const userId = req.headers['x-user-id'];
  
  // Verify user belongs to organization
  const membership = await storage.auth.getUserOrganizations(userId, orgId);
  
  if (!membership) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  // Fetch candidates filtered by org_id
  const candidates = await storage.candidates.getCandidatesByOrg(orgId);
  
  res.json(candidates);
});
```

### Role-Based Access Control (RBAC)

**Organization Roles**:
- `owner`: Full access, billing management
- `admin`: Full access except billing
- `hiring_manager`: Manage jobs and candidates
- `recruiter`: Manage candidates
- `interviewer`: View candidates, add interview feedback
- `viewer`: Read-only access

**Database Schema**:

```typescript
// shared/schema.ts
export const orgRoleEnum = pgEnum('org_role', [
  'owner',
  'admin',
  'hiring_manager',
  'recruiter',
  'interviewer',
  'viewer'
]);

export const userOrganizations = pgTable('user_organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  orgId: uuid('org_id').references(() => organizations.id).notNull(),
  role: orgRoleEnum('role').notNull(),
  isRecruiterSeat: boolean('is_recruiter_seat').default(false),
});
```

**Permission Check Example**:

```typescript
async function requireRole(req: Request, res: Response, next: NextFunction, allowedRoles: string[]) {
  const { userId } = req.authContext;
  const orgId = req.headers['x-org-id'];
  
  const membership = await storage.auth.getUserOrganizations(userId, orgId);
  
  if (!membership || !allowedRoles.includes(membership.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  
  next();
}

// Usage
app.delete('/api/jobs/:id', requireAuth, (req, res, next) => {
  requireRole(req, res, next, ['owner', 'admin', 'hiring_manager']);
}, async (req, res) => {
  // Delete job logic
});
```

## Security Features

### 1. JWT Token Security

- **HTTP-Only Cookies**: Session tokens stored in HTTP-only cookies (Google OAuth)
- **Bearer Tokens**: API requests use Authorization header
- **Token Expiry**: Automatic token refresh before expiration
- **Secure Transport**: HTTPS-only in production

### 2. Row-Level Security (RLS)

Supabase RLS policies enforce org_id-based data isolation:

```sql
-- Candidates table policy
CREATE POLICY "Users can only access their organization's candidates"
ON candidates FOR SELECT
USING (
  org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid()
  )
);

-- Jobs table policy
CREATE POLICY "Users can only access their organization's jobs"
ON jobs FOR SELECT
USING (
  org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid()
  )
);
```

### 3. CSRF Protection

- **Signed Cookies**: OAuth cookies signed with APP_JWT_SECRET
- **HMAC State Parameters**: OAuth state signed to prevent tampering
- **Same-Site Cookies**: `sameSite: 'lax'` prevents cross-site attacks

### 4. Rate Limiting

**Global Rate Limit**:

```typescript
import rateLimit from 'express-rate-limit';

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per 15 minutes
  message: 'Too many requests, please try again later.',
});

app.use('/api/', globalLimiter);
```

**Write Operations Rate Limit**:

```typescript
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // 100 write requests per 15 minutes
});

app.post('/api/candidates', writeLimiter, async (req, res) => {
  // Create candidate
});
```

### 5. File Upload Security

**Resume Upload** (`server/routes/upload.ts`):

```typescript
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});
```

**Private Storage Bucket**:

```typescript
// Uploaded files stored in private Supabase Storage bucket
const { data, error } = await supabase.storage
  .from('resumes')
  .upload(`${orgId}/${candidateId}/${filename}`, fileBuffer, {
    contentType: file.mimetype,
    upsert: false,
  });

// Generate signed URL (24-hour expiry)
const { data: signedUrl } = await supabase.storage
  .from('resumes')
  .createSignedUrl(filePath, 24 * 60 * 60);
```

## Related Documentation

- [Routes Documentation](./routes.md) - Protected routes
- [Dashboard Documentation](./dashboard.md) - Organization context usage
- [Data Model Documentation](./data-model.md) - User and organization schema
