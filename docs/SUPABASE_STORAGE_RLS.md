# Supabase Storage Configuration for Resumes

## ⚠️ CRITICAL: Fix Bucket Privacy Settings IMMEDIATELY

**ACTION REQUIRED**: Your Supabase Storage buckets are currently set to PUBLIC. This must be fixed before deployment.

### Step 1: Make ALL Buckets Private

Navigate to: **Supabase Dashboard → Storage**

For EACH bucket (resumes, email-brand-assets, email-templates, email-attachments):
1. Click on the bucket name
2. Click **Settings** (gear icon)
3. **UNCHECK** "Public bucket"
4. Click **Save**

**Visual Confirmation**: The badge next to each bucket name should change from "Public" to "Private"

### Step 2: Verify Privacy Settings

After changing settings, verify:
- All buckets show "Private" badge (not "Public")
- Direct URL access to files returns 404/403 errors
- Only authenticated requests with valid service role keys can access files

### 2. Configure RLS Policies

Navigate to: **Supabase Dashboard → Storage → Policies**

#### Policy 1: Authenticated Upload
```sql
-- Allow authenticated users to upload resumes to their organization's folder
CREATE POLICY "Authenticated upload to org folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = auth.jwt()->>'org_id'
);
```

#### Policy 2: Authenticated Read (Same Organization)
```sql
-- Allow users to read resumes from their own organization
CREATE POLICY "Read own organization resumes"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = auth.jwt()->>'org_id'
);
```

#### Policy 3: Authenticated Delete (Same Organization)
```sql
-- Allow users to delete resumes from their own organization
CREATE POLICY "Delete own organization resumes"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = auth.jwt()->>'org_id'
);
```

### 3. Service Role Bypass

The backend uses the service role key which bypasses RLS, allowing it to:
- Upload resumes for any organization during candidate creation
- Download resumes for any organization for authorized API requests
- Delete resumes during candidate removal

## File Structure

Resumes are stored with the following path structure:
```
resumes/
  └── {org_id}/
      └── {job_id}/
          ├── resume_{unique_id}.pdf
          ├── resume_{unique_id}.docx
          └── ...
```

## API Endpoints

### Public Resume Upload (For Job Applications)
```
POST /api/upload/public/resume
Content-Type: multipart/form-data

Body:
- resume: File (PDF, DOC, DOCX, max 10MB)
- jobId: string (required - validates job exists and gets org_id)

Response:
{
  "success": true,
  "storagePath": "{org_id}/{job_id}/resume_{unique_id}.pdf",
  "originalName": "resume.pdf",
  "size": 123456,
  "mimetype": "application/pdf",
  "jobId": "...",
  "orgId": "...",
  "message": "Resume uploaded successfully"
}

Features:
- NO AUTHENTICATION REQUIRED (public job applicants)
- Rate limited: 10 uploads per IP per 15 minutes
- Validates job exists and is published
- Automatically derives org_id from job
- Returns STORAGE PATH (not expiring URL)
- Prevents cross-org data injection
```

### Authenticated Resume Upload (For Internal Use)
```
POST /api/upload/resume
Content-Type: multipart/form-data
Authorization: Bearer {supabase_jwt_token}
x-org-id: {organization_id}

Body:
- resume: File (PDF, DOC, DOCX)
- candidateId: string (optional)

Response:
{
  "success": true,
  "fileUrl": "https://...signed-url...",  // 24-hour expiry
  "filename": "{org_id}/resume_{unique_id}.pdf"
}
```

### Download Resume (Authenticated)
```
GET /api/upload/resume/{org_id}/{job_id}/resume_{unique_id}.pdf
Authorization: Bearer {token}
x-org-id: {organization_id}
```

### Delete Resume (Authenticated)
```
DELETE /api/upload/resume/{org_id}/{job_id}/resume_{unique_id}.pdf
Authorization: Bearer {token}
x-org-id: {organization_id}
```

## Why Resumes Bucket Was Empty

**Root Cause**: The authenticated upload endpoint (`/api/upload/resume`) requires a valid Supabase JWT token. Public job applicants don't have authentication tokens, so ALL public resume uploads were failing with 401 Unauthorized errors.

**Fix**: Created separate `/api/upload/public/resume` endpoint that:
- Doesn't require authentication
- Validates job ID and organization
- Stores permanent paths (not 24-hour expiring URLs)
- Has rate limiting to prevent abuse

## Important: Storage Paths vs. URLs

**Old (Broken) Pattern:**
- Stored 24-hour expiring signed URLs in database
- URLs became invalid after 24 hours
- Required re-generating URLs constantly

**New (Fixed) Pattern:**
- Store permanent STORAGE PATH in database: `{org_id}/{job_id}/resume_{unique_id}.pdf`
- Generate signed URLs ON-DEMAND when viewing
- URLs never expire in database (only temporary viewing URLs expire)

## Testing Checklist

Before going live:

- [ ] Bucket is set to private (not public)
- [ ] RLS policies are configured and enabled
- [ ] Upload endpoint requires orgId
- [ ] Uploaded files go to correct org folder
- [ ] Unauthenticated users cannot access resume URLs
- [ ] Authenticated users can only access their org's resumes
- [ ] Resume deletion works correctly
- [ ] No resumes remain in local `uploads/` directory

## Security Notes

⚠️ **CRITICAL**: The `resumes` bucket was previously configured as public, creating a PII leak. This has been fixed in the code, but you must:

1. Update the bucket to private in Supabase Dashboard
2. Configure the RLS policies above
3. Verify no unauthorized access is possible

Without these changes, **DO NOT DEPLOY** to production.
