# Supabase Storage RLS Configuration for Resumes

## Critical Security Fix

**BEFORE DEPLOYMENT**: The `resumes` storage bucket must have proper Row Level Security (RLS) policies configured to prevent unauthorized access to candidate PII.

## Required Configuration

### 1. Make Bucket Private

In your Supabase Dashboard → Storage → resumes bucket:
- Ensure `Public bucket` is set to **OFF** (unchecked)

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
      ├── resume_{unique_id}.pdf
      ├── resume_{unique_id}.docx
      └── ...
```

## API Endpoints

### Upload Resume
```
POST /api/upload/resume
Content-Type: multipart/form-data

Body:
- resume: File (PDF, DOC, DOCX)
- orgId: string (required)
- candidateId: string (optional)
```

### Download Resume (Authenticated)
```
GET /api/upload/resume/{org_id}/resume_{unique_id}.pdf
Authorization: Bearer {token}
```

### Delete Resume
```
DELETE /api/upload/resume/{org_id}/resume_{unique_id}.pdf
```

## Migration from Local Storage

If you have existing resumes in local `uploads/` directory:

1. **DO NOT** deploy until migration is complete
2. Use the Supabase Storage UI to manually upload existing files
3. Update candidate records with new Supabase Storage URLs
4. Verify all resumes are accessible through new endpoint
5. Only then deploy with the updated code

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
