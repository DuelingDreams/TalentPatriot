# TalentPatriot Deployment Checklist

## 🚨 CRITICAL SECURITY REQUIREMENTS

### ⚠️ **MUST DO BEFORE DEPLOYMENT** ⚠️

#### 1. Supabase Storage Bucket Privacy Settings
**STATUS: ⚠️ ACTION REQUIRED**

The `resumes` bucket in Supabase Storage **MUST** be set to PRIVATE before deployment.

**Steps to Fix:**
1. Go to Supabase Dashboard: https://app.supabase.com
2. Navigate to: Storage → Buckets
3. Find the `resumes` bucket
4. Click Settings/Edit
5. **Set bucket to PRIVATE** (not Public)
6. Save changes

**Why This Matters:**
- Currently, if the bucket is PUBLIC, anyone with a storage path can access any resume
- Multi-tenant isolation requires PRIVATE bucket + Row Level Security (RLS)
- Production deployment with public bucket = **CRITICAL SECURITY VULNERABILITY**

#### 2. Supabase Storage RLS Policies
**STATUS: ⚠️ RECOMMENDED**

Add Row Level Security policies to the `resumes` bucket for defense-in-depth:

```sql
-- Users can only upload to their own org folder
CREATE POLICY "Upload to own org" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = auth.jwt()->>'org_id'
);

-- Users can only read from their own org folder
CREATE POLICY "Read own org resumes" ON storage.objects
FOR SELECT USING (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = auth.jwt()->>'org_id'
);

-- Users can only delete from their own org folder
CREATE POLICY "Delete own org resumes" ON storage.objects
FOR DELETE USING (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = auth.jwt()->>'org_id'
);
```

Apply these in: Supabase Dashboard → Storage → Policies

---

## ✅ Environment Variables Verification

### Required Secrets (All Present ✓)
- [x] `APP_JWT_SECRET` - OAuth state signing and cookie security
- [x] `OPENAI_API_KEY` - AI resume parsing and insights
- [x] `SENDGRID_API_KEY` - Email notifications
- [x] `SG_TPL_EVENT_REMINDER` - SendGrid template ID
- [x] `SG_TPL_MESSAGE_ALERT` - SendGrid template ID
- [x] `SG_TPL_STATUS_UPDATE` - SendGrid template ID
- [x] `GOOGLE_CLIENT_ID` - Google OAuth (Calendar/Meet/Gmail)
- [x] `GOOGLE_CLIENT_SECRET` - Google OAuth

### Automatic Environment Variables
These are automatically set by Replit:
- `DATABASE_URL` - PostgreSQL connection string
- `NODE_ENV` - Set to `production` on deployment
- `REPLIT_DOMAINS` - Production domain

### Optional Environment Variables
- `ENABLE_GOOGLE_INTEGRATION` - Feature flag for Google Workspace (default: enabled)

---

## 🔧 Google OAuth Configuration

### Google Cloud Console Setup
**STATUS: ⚠️ VERIFY BEFORE DEPLOYMENT**

1. **Navigate to:** https://console.cloud.google.com
2. **Project:** Ensure TalentPatriot project is selected
3. **APIs & Services → Credentials → OAuth 2.0 Client IDs**

#### Required Redirect URIs:
Add these **exact** redirect URIs to your OAuth 2.0 credentials:

```
https://talentpatriot.com/auth/google/callback
https://www.talentpatriot.com/auth/google/callback
```

**⚠️ IMPORTANT:**
- Google does **NOT** support wildcard redirect URIs (e.g., `*.talentpatriot.com`)
- Organization subdomains (e.g., `acme.talentpatriot.com`) are for PUBLIC careers pages only
- All authenticated users access via `talentpatriot.com` (root domain)
- OAuth callback always goes to centralized endpoint on root domain

#### Enabled Google APIs:
Verify these APIs are enabled:
- [x] Google Calendar API
- [x] Google Meet API
- [x] Gmail API (if using email features)
- [x] Google People API (for profile info)

---

## 📊 Database Status

### Database Connection
- [x] PostgreSQL database provisioned
- [x] DATABASE_URL environment variable set
- [x] Drizzle ORM configured

### Schema Migrations
**Action Required:** Run database migration before deployment

```bash
npm run db:push
```

If you encounter data-loss warnings:
```bash
npm run db:push --force
```

**What This Does:**
- Syncs Drizzle schema (`shared/schema.ts`) to production database
- Creates/updates tables for latest features
- Applies indexes and foreign key constraints

---

## 🧹 Code Cleanup Status

### Hardcoded URLs
**STATUS: ✅ FIXED**

- [x] Removed hardcoded `localhost:5000` from CandidateProfile.tsx
- [x] All resume viewing uses dynamic signed URLs
- [x] Environment detection uses `window.location.hostname`

### Development Code
**STATUS: ✅ CLEAN**

- [x] No production-breaking console.logs
- [x] Development auth properly gated by environment detection
- [x] Demo data only loads in development mode

### Known TODOs (Non-Blocking)
- Minor feature TODOs exist but don't block deployment
- See `grep -r "TODO" .` for full list

---

## 🔒 Security Verification

### Authentication & Authorization
- [x] Supabase Auth configured
- [x] JWT-based authentication
- [x] Organization-based multi-tenancy
- [x] Row Level Security (RLS) policies active

### Resume Security (CRITICAL)
- [x] Multi-tenant storage paths: `{orgId}/{jobId}/resume_*.ext`
- [x] Private storage bucket (⚠️ **USER MUST VERIFY**)
- [x] Signed URLs (24-hour expiry)
- [x] No cross-org data access possible

### API Security
- [x] Rate limiting on public endpoints
- [x] Input validation with Zod schemas
- [x] CORS configured for production domains
- [x] OAuth state parameter protection (HMAC-signed)

### Encryption
- [x] Google OAuth tokens encrypted with AES-256-GCM
- [x] PBKDF2 key derivation (100,000 iterations)
- [x] Signed cookies for OAuth state

---

## 🌐 Production Domain Configuration

### Primary Domain
- **Root Domain:** `talentpatriot.com`
- **Authenticated Users:** All recruiters/admins access via root domain
- **OAuth Callbacks:** Centralized on root domain

### Subdomain Strategy
- **Organization Subdomains:** `{org_slug}.talentpatriot.com`
- **Purpose:** Public careers pages ONLY (no authentication)
- **Examples:**
  - `acme.talentpatriot.com/careers` - Acme Corp public jobs
  - `techco.talentpatriot.com/careers` - TechCo public jobs

### Subdomain Resolution
The application automatically:
1. Detects subdomain from `req.hostname`
2. Resolves organization from `organizations.subdomain` column
3. Serves organization-specific public careers page
4. Redirects authenticated users to root domain

---

## 📦 Dependencies & Build

### Package Installation
**STATUS: ✅ COMPLETE**

All required packages installed:
- Frontend: React, Vite, TanStack Query, Radix UI, Tailwind
- Backend: Express, Drizzle ORM, Supabase, Multer
- Integrations: OpenAI, SendGrid, Google APIs
- Security: Crypto, JWT, OAuth

### Build Process
Replit will automatically:
1. Install dependencies (`npm install`)
2. Build frontend (`npm run build`)
3. Start production server (`npm run dev`)

---

## 🧪 Pre-Deployment Testing

### Manual Testing Checklist

#### 1. Resume Upload & Viewing
- [ ] Apply to public job posting with resume
- [ ] Verify resume appears in pipeline
- [ ] Open resume preview from pipeline
- [ ] Download resume from candidate profile
- [ ] Verify resume is NOT accessible from different organization

#### 2. Google OAuth Flow (if enabled)
- [ ] Navigate to Settings → Integrations
- [ ] Click "Connect Google Account"
- [ ] Complete OAuth flow
- [ ] Verify redirect back to Settings
- [ ] Test creating Google Calendar event
- [ ] Test checking availability (FreeBusy)

#### 3. Multi-Org Isolation
- [ ] Create test candidate in Org A
- [ ] Switch to Org B
- [ ] Verify Org A candidate NOT visible in Org B
- [ ] Verify Org A resumes NOT accessible from Org B

#### 4. Public Careers Page
- [ ] Visit `{org_slug}.talentpatriot.com/careers`
- [ ] Verify published jobs appear
- [ ] Submit test application
- [ ] Verify application appears in pipeline

### Automated Testing
```bash
# Run any existing test suites
npm test
```

---

## 🚀 Deployment Steps

### Step 1: Final Verification
- [ ] ✅ All environment secrets configured
- [ ] ⚠️ **Supabase Storage bucket set to PRIVATE**
- [ ] ✅ Google OAuth redirect URIs configured
- [ ] ✅ Database migrations run (`npm run db:push`)
- [ ] ✅ Manual testing completed

### Step 2: Deploy to Replit
The application is ready to deploy! When you click "Publish" in Replit:

1. **Replit will automatically:**
   - Set `NODE_ENV=production`
   - Build the application
   - Assign production domain
   - Enable HTTPS/TLS
   - Configure health checks

2. **You should:**
   - Monitor deployment logs
   - Test production domain immediately after deployment
   - Verify all integrations work in production

### Step 3: Post-Deployment Verification
- [ ] Production domain accessible
- [ ] HTTPS enabled and working
- [ ] Database connected
- [ ] Authentication working
- [ ] Resume uploads working
- [ ] Google OAuth working (if enabled)
- [ ] Email notifications sending

---

## 📝 Known Production Considerations

### Feature Flags
- `ENABLE_GOOGLE_INTEGRATION` - Controls Google Workspace features
  - Default: enabled
  - Set to `false` to disable Google Calendar/Meet/Gmail

### Performance
- Resume signed URLs cached for 24 hours
- Database queries optimized with indexes
- Rate limiting protects public endpoints

### Monitoring
After deployment, monitor:
- Server logs for errors
- Database connection pool
- Storage bucket usage
- API rate limit hits
- OAuth token refresh failures

---

## 🆘 Rollback Plan

If critical issues arise post-deployment:

1. **Use Replit Rollback Feature:**
   - Navigate to Replit → History
   - Select previous working checkpoint
   - Click "Restore"

2. **Database Rollback:**
   - Replit automatically backs up database
   - Contact Replit support for database restoration

---

## ✅ Deployment Sign-Off

**Pre-Deployment Checklist:**
- [ ] ⚠️ **CRITICAL:** Supabase Storage bucket set to PRIVATE
- [ ] Google OAuth redirect URIs configured
- [ ] Database migrations run
- [ ] All secrets configured
- [ ] Manual testing completed
- [ ] Production domain configured

**Deployment Readiness:** ⚠️ **PENDING USER ACTION**

**Action Required:**
1. Set Supabase Storage bucket to PRIVATE (see top of document)
2. Verify Google OAuth redirect URIs
3. Run `npm run db:push` to sync database schema
4. Complete manual testing checklist
5. Click "Publish" in Replit

---

## 📞 Support Resources

- **Replit Docs:** https://docs.replit.com
- **Supabase Docs:** https://supabase.com/docs
- **Google OAuth Docs:** https://developers.google.com/identity/protocols/oauth2

**Last Updated:** October 23, 2025
**Document Version:** 1.0
