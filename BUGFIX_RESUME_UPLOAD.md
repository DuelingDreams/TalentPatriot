# Resume Upload & Application Bug Fixes - Nov 24, 2025

## 🐛 Issues

### Issue 1: Resume Upload Failing (403 Error)

**Symptom:** Resume uploads failing on job application form with error:
```
Upload Failed
This job posting is not currently accepting applications
Maximum retry attempts reached. Please try selecting the file again.
```

**Status Code:** 403 Forbidden

**Error in Logs:**
```
POST /api/upload/public/resume 403 :: {"error":"Job not available","message":"This job posting is not currently accepting applications"}
```

### Issue 2: Application Submission Failing (500 Error)

**Symptom:** After resume uploads successfully, application submission fails with:
```
Failed to submit application
```

**Status Code:** 500 Internal Server Error

**Error in Logs:**
```
Invalid resume URL format: 64eea1fa-1993-4966-bbd8-3d5109957c20/092ed457-fe3a-487b-800e-af5931cacc84/resume_IvGsTHcrPQvKipXv_PZTX.docx
Error: Invalid resume URL. Please upload your resume through the provided interface.
```

---

## 🔍 Root Causes

### Issue 1: Status Mismatch Between Publishing and Upload Validation

### Database Schema (shared/schema.ts):
```typescript
export const jobStatusEnum = pgEnum('job_status', [
  'draft',    // Not yet published
  'open',     // ✅ ACTIVELY ACCEPTING APPLICATIONS
  'closed',   // No longer accepting
  'on_hold',  // Temporarily paused
  'filled'    // Position filled
]);
```

### Publishing Endpoint (server/routes.ts):
When you click "Publish" on a job:
```typescript
POST /api/jobs/:jobId/publish
// Sets: status = 'open' ✅
```

### Upload Endpoint (server/routes/upload.ts) - BEFORE FIX:
```typescript
// ❌ BUG: Checking for non-existent status
if (job.status !== 'published') {
  return res.status(403).json({
    error: 'Job not available',
    message: 'This job posting is not currently accepting applications'
  })
}
```

**Problem:** The value `'published'` doesn't exist in the database schema! It was checking for a status that could never be true.

### Issue 2: Resume URL Format Mismatch

**The Change That Broke Validation:**

The upload endpoint was recently updated for better security:
- **OLD:** Returns signed Supabase Storage URLs (e.g., `https://...supabase.co/storage/v1/object/sign/...`)
- **NEW:** Returns storage paths only (e.g., `orgId/jobId/resume_xxx.pdf`)
- **Why:** Generate signed URLs on-demand for better security and avoid URL expiration issues

**The Validation Function:**

In `server/storage/jobs/repository.ts`, the `validateResumeUrl()` function:
```typescript
try {
  const url = new URL(resumeUrl);  // ❌ Expects full HTTPS URL
  // Check various URL patterns...
} catch (error) {
  // Only accepts /uploads/ paths
  if (resumeUrl.startsWith('/uploads/')) {
    return true;
  }
  return false;  // ❌ Rejects storage paths!
}
```

**Problem:** When `new URL('orgId/jobId/resume_xxx.pdf')` is called, it throws an error because it's not a valid URL format. The catch block only accepted legacy `/uploads/` paths, not the new storage path format.

---

## ✅ Solutions

### Fix 1: Upload Status Check

**File:** `server/routes/upload.ts` (Line 188)

**Change:**
```typescript
// BEFORE (incorrect):
if (job.status !== 'published') {

// AFTER (correct):
if (job.status !== 'open') {
```

Now the upload endpoint correctly accepts resumes when the job status is `'open'` (the actual published state).

### Fix 2: Resume URL Validation

**File:** `server/storage/jobs/repository.ts` (Lines 18-24)

**Change:**
```typescript
// ADDED: Check for storage path format FIRST (before trying URL parsing)
const storagePathPattern = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\/resume_[\w-]+\.\w+$/i;
if (storagePathPattern.test(resumeUrl)) {
  return true;
}
```

**Pattern Explanation:**
- `[0-9a-f-]{36}` - UUID format (orgId and jobId)
- `\/resume_[\w-]+\.` - Filename starting with "resume_"
- `\w+$` - File extension

Now accepts both:
- ✅ **New storage paths:** `orgId/jobId/resume_xxx.pdf`
- ✅ **Legacy full URLs:** `https://example.com/resume.pdf`

---

## 🧪 Testing

### Before Fixes:
1. Create job → Status: `'draft'`
2. Click "Publish" → Status: `'open'`
3. Fill application form
4. Try to upload resume → **❌ 403 Error** (rejected: status !== 'published')
5. User never gets to submit application

### After Fix 1 (Upload Status):
1. Create job → Status: `'draft'`
2. Click "Publish" → Status: `'open'`
3. Fill application form
4. Upload resume → **✅ Success!** Returns storage path
5. Try to submit application → **❌ 500 Error** (validation rejects storage path)

### After Both Fixes:
1. Create job → Status: `'draft'`
2. Click "Publish" → Status: `'open'`
3. Fill application form
4. Upload resume → **✅ Success!** Returns storage path
5. Submit application → **✅ Success!** Validation accepts storage path
6. Candidate created with resume
7. Auto-parsing triggered

---

## 📊 Impact

**Before Fixes:**
- ❌ No job applications could be submitted
- ❌ All resume uploads failed with 403 error
- ❌ Public careers page was completely non-functional

**After Both Fixes:**
- ✅ Resume uploads work for published (`'open'`) jobs
- ✅ Storage paths properly validated
- ✅ Job applications submit successfully end-to-end
- ✅ Auto-parsing triggers after successful upload
- ✅ Public careers page fully functional
- ✅ Backward compatible with legacy URL format

---

## 🚀 Deployment

**Status:** ✅ **DEPLOYED** (Nov 24, 2025)

**Files Modified:**
1. `server/routes/upload.ts` (line 188) - Status check fix
2. `server/storage/jobs/repository.ts` (lines 18-24) - URL validation fix

**Workflow:** Restarted after both fixes applied

---

## 📝 Related Files

- **Upload Endpoint:** `server/routes/upload.ts`
- **Schema Definition:** `shared/schema.ts`
- **Publishing Endpoint:** `server/routes.ts`
- **Resume Parsing:** `server/resumeParser.ts`

---

## 🎯 Next Steps

The resume upload is now working! To test:

1. **Go to your published job's application page**
2. **Fill out the form and upload a PDF/DOCX resume**
3. **Submit the application**
4. **Check the candidate record** - Resume should be:
   - ✅ Uploaded to Supabase Storage
   - ✅ Auto-parsing triggered
   - ✅ Status changes: pending → processing → completed

Watch the server logs for:
```
[AUTO-PARSE] Triggering resume parsing for candidate xxx
[PARSE FROM STORAGE] Starting parsing for candidate xxx
[RESUME PARSER] Extracted XXX words from resume
[PARSE FROM STORAGE] Successfully parsed and updated candidate xxx
```

---

Ready to accept job applications! 🎉
