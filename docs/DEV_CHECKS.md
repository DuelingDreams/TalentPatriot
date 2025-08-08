# Development Integration Checks

This document provides step-by-step instructions to verify the complete integration between frontend components, React Query hooks, API routes, and the Supabase backend.

## Quick Health Check

### 1. Open Browser Console
1. Open your browser's developer tools (F12)
2. Navigate to the **Console** tab
3. Clear any existing logs

### 2. Visit Health Page
1. Navigate to `/health` in your browser
2. Wait for health checks to complete (should take 1-3 seconds)
3. Verify you see:
   - **API Health Check**: Green checkmark with response time
   - **Database Connection**: Green checkmark with query success

### 3. Verify Console Logs
Look for these log patterns in the console:

#### Supabase Connection Test
```
[SUPABASE] Connection test → {success: true, data: 1, error: "none"}
```

#### API Route Logs (from Network tab or server console)
```
[API] GET /api/health
[API] GET /api/health → {success: true}
```

#### React Query Debug Logs
When navigating to job/candidate pages, you should see:
```
[RQ] useJobs loading= false error= null
[RQ] useCandidates loading= false error= null
```

## Complete End-to-End Smoke Test

### Phase 1: Job Creation Flow

1. **Navigate to Dashboard**
   - URL: `/dashboard`
   - Verify console shows: `[RQ] useJobs loading= false error= null`

2. **Create Draft Job**
   - Click "Post New Job" button
   - Fill out job form with:
     - Title: "Test Software Engineer"
     - Description: "Test job description"
     - Location: "Remote"
     - Experience: "Mid Level"
   - Click "Save as Draft"
   - Verify console shows:
     ```
     [API] POST /api/jobs
     [API] POST /api/jobs → {success: true, jobId: "uuid-here"}
     ```
   - Verify toast: "Job created successfully!"

3. **Publish Job**
   - Find your draft job in the jobs list
   - Click "Publish" button  
   - Verify console shows:
     ```
     [API] POST /api/jobs/:jobId/publish
     [API] POST /api/jobs/:jobId/publish → {success: true, jobId: "uuid", status: "open"}
     ```
   - Verify toast: "Job published successfully!"

### Phase 2: Public Careers Flow

4. **View Public Careers**
   - Navigate to `/careers`
   - Verify console shows:
     ```
     [API] GET /api/public/jobs
     [API] GET /api/public/jobs → {success: true, count: 1}
     ```
   - Verify your "Test Software Engineer" job appears

5. **Apply to Job**
   - Click on your test job
   - Click "Apply Now" button
   - Fill out application form:
     - Name: "Test Candidate"
     - Email: "test@example.com" 
     - Phone: "555-1234"
   - Submit application
   - Verify console shows successful candidate creation and application

### Phase 3: Pipeline Verification

6. **Check Kanban Board**
   - Navigate to `/pipeline` or `/jobs/{job-id}`
   - Verify the applied candidate appears in the first pipeline column
   - Verify console shows successful data loading for pipeline

### Phase 4: Error Handling Test

7. **Test Network Errors**
   - Open Network tab in DevTools
   - Block network requests or go offline
   - Try to create a job
   - Verify error handling:
     - Error toast appears
     - Console shows error logs
     - UI shows loading states properly

### Phase 5: Loading States Verification

8. **Verify Loading Indicators**
   - On slow connections, verify:
     - Form buttons show spinners during submission
     - Loading states appear during data fetching
     - Skeletons/loading messages display correctly

## Expected Log Patterns

### Successful API Calls
```
[API] GET /api/jobs | orgId: uuid-here
[API] GET /api/jobs → {success: true, count: 5}

[API] POST /api/jobs
[API] POST /api/jobs → {success: true, jobId: "uuid-here"}

[API] POST /api/candidates
[API] POST /api/candidates → {success: true, candidateId: "uuid", email: "test@example.com"}
```

### React Query State Logs
```
[RQ] useJobs loading= true error= null          // Initial load
[RQ] useJobs loading= false error= null         // Success
[RQ] useCandidates loading= false error= null
[RQ] useJobsByClient loading= false error= null
```

### Supabase Connection
```
[SUPABASE] Connection test → {success: true, data: 1, error: "none"}
```

## Troubleshooting

### No Console Logs Appearing
- Check that environment variables are set correctly
- Verify browser console is cleared and on correct tab
- Ensure you're looking at the correct domain/port

### API Errors
- Check `/health` page for connection status
- Verify Supabase credentials in environment
- Check server-side console for additional error details

### React Query Not Loading
- Verify organization context is set up correctly
- Check authentication status
- Look for authentication-related error messages

### Database Connection Issues
- Visit `/health` to check database connectivity
- Verify SUPABASE_URL and SUPABASE_ANON_KEY environment variables
- Check Supabase dashboard for service status

## Expected Results Summary

✅ **API Health Check**: Response time < 500ms, status "healthy"  
✅ **Database Connection**: Query success, minimal response time  
✅ **Job Creation**: Draft → Published → Public listing  
✅ **Application Flow**: Candidate creation → Pipeline assignment  
✅ **Error Handling**: Proper error messages and recovery  
✅ **Loading States**: Spinners and feedback throughout UI  

If all checks pass, your integration is working correctly!