# Server-Side Org_ID Derivation Triggers - Deployment Guide

## Overview

This document provides a comprehensive guide for deploying server-side org_id derivation triggers to prevent client tampering with org_id values and ensure data integrity in the TalentPatriot ATS system.

## Purpose

The BEFORE INSERT triggers automatically derive org_id values server-side, preventing clients from supplying or tampering with org_id values. This enhances security and ensures proper multi-tenant data isolation.

## Implementation Summary

### Tables Protected by Triggers

1. **candidate_notes** - Derives org_id from job_candidate relationship, sets author_id
2. **interviews** - Derives org_id from job_candidate relationship  
3. **ai_insights_cache** - Derives org_id from user's default organization
4. **ai_insights_metrics** - Derives org_id from user's default organization
5. **ai_recommendations_history** - Derives org_id from user's default organization
6. **messages** - Derives org_id from user's default organization, sets sender_id
7. **message_recipients** - Derives org_id from related message
8. **clients** - Derives org_id from user's default organization, sets created_by
9. **jobs** - Derives org_id from user's default organization, sets created_by
10. **candidates** - Derives org_id from user's default organization, sets created_by
11. **job_candidate** - Derives org_id from job relationship
12. **pipeline_columns** - Derives org_id from job (if job_id provided) or user context

### Key Security Features

- **Authentication Required**: All triggers validate `auth.uid()` is present
- **Organization Membership Verified**: Users must be members of the organization
- **Role-Based Prioritization**: Owner/admin roles are preferred when selecting default org
- **Related Record Validation**: Parent records must exist and be accessible
- **Client Override Prevention**: Any client-provided org_id is overwritten

## Deployment Instructions

### Step 1: Pre-Deployment Checklist

- [ ] Backup current database state
- [ ] Verify all required tables exist (including AI insights tables)
- [ ] Ensure auth.uid() function is available (Supabase/RLS context)
- [ ] Test in development environment first

### Step 2: Deploy SQL Script

The main deployment script is `server_side_org_derivation_triggers.sql`.

**Method 1: Via Supabase Dashboard (Recommended)**
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `server_side_org_derivation_triggers.sql`
3. Execute the script
4. Verify triggers are installed using the verification queries

**Method 2: Via psql Command Line**
```bash
psql $DATABASE_URL -f server_side_org_derivation_triggers.sql
```

**Method 3: Via Database Migration Tool**
```bash
# If using migration system, add as new migration
npm run db:migrate
```

### Step 3: Verification

Execute these queries to verify triggers are installed:

```sql
-- Verify trigger functions exist
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%org_id%'
ORDER BY routine_name;

-- Verify triggers are created
SELECT 
    trigger_name,
    event_object_table,
    action_timing
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND trigger_name LIKE '%org_id%'
ORDER BY event_object_table, trigger_name;
```

Expected output should show 12+ triggers across all protected tables.

## Client-Side Changes Required

### 1. Remove org_id from Insert Operations

**Before (Client provides org_id):**
```typescript
const newCandidate = await apiRequest('/api/candidates', {
  method: 'POST',
  body: {
    org_id: userOrgId, // ❌ Remove this
    name: 'John Doe',
    email: 'john@example.com'
  }
});
```

**After (Server derives org_id):**
```typescript
const newCandidate = await apiRequest('/api/candidates', {
  method: 'POST',
  body: {
    // org_id removed - server will derive it
    name: 'John Doe',
    email: 'john@example.com'
  }
});
```

### 2. Update Zod Insert Schemas

Remove org_id from insert schemas where triggers handle it:

**Before:**
```typescript
export const insertCandidateNotesSchema = createInsertSchema(candidateNotes).omit({
  id: true,
  createdAt: true,
});
```

**After:**
```typescript
export const insertCandidateNotesSchema = createInsertSchema(candidateNotes).omit({
  id: true,
  org_id: true,    // ✅ Add this - server will derive
  author_id: true, // ✅ Add this - server will derive
  createdAt: true,
});
```

### 3. Update API Route Validations

Modify server routes to not expect org_id in request bodies:

**Before:**
```typescript
app.post('/api/candidates', async (req, res) => {
  const validated = insertCandidateSchema.parse(req.body);
  // validated contains org_id from client
});
```

**After:**
```typescript
app.post('/api/candidates', async (req, res) => {
  const validated = insertCandidateSchema.parse(req.body);
  // org_id not expected - trigger will add it
});
```

## Trigger Logic Details

### Organization Derivation Strategy

1. **User Context Tables**: Use `derive_user_default_org_id()`
   - Gets user's organizations ordered by role priority (owner → admin → hiring_manager → recruiter)
   - Falls back to first joined organization if multiple with same role

2. **Relationship Tables**: Follow parent record relationships
   - `candidate_notes` → `job_candidate.org_id`
   - `interviews` → `job_candidate.org_id`  
   - `job_candidate` → `jobs.org_id`
   - `message_recipients` → `messages.org_id`

3. **Pipeline Columns**: Hybrid approach
   - If `job_id` provided → use `jobs.org_id`
   - Otherwise → use user's default organization

### Edge Cases Handled

1. **No Authenticated User**
   ```sql
   RAISE EXCEPTION 'No authenticated user found. User must be logged in to perform this operation.';
   ```

2. **User Not in Any Organization**  
   ```sql
   RAISE EXCEPTION 'User % is not a member of any organization. Cannot determine org_id.', current_user_id;
   ```

3. **Related Record Not Found**
   ```sql
   RAISE EXCEPTION 'Related job_candidate record not found for job_candidate_id: %', NEW.job_candidate_id;
   ```

4. **No Organization Access**
   ```sql
   RAISE EXCEPTION 'User % does not have access to organization %', current_user_id, parent_org_id;
   ```

## Testing Procedures

### 1. Functional Testing

Test each protected table:

```sql
-- Test candidate_notes creation (should derive from job_candidate)
INSERT INTO candidate_notes (job_candidate_id, content) 
VALUES ('existing-job-candidate-id', 'Test note');

-- Test AI insights creation (should derive from user context)
INSERT INTO ai_insights_cache (insights_data, recruitment_metrics) 
VALUES ('{}', '{}');

-- Verify org_id was set automatically
SELECT org_id, author_id FROM candidate_notes ORDER BY created_at DESC LIMIT 1;
```

### 2. Security Testing

```sql
-- Attempt to insert with wrong org_id (should be overridden)
INSERT INTO candidates (org_id, name, email) 
VALUES ('wrong-org-id', 'Test User', 'test@example.com');

-- Verify correct org_id was used
SELECT org_id, created_by FROM candidates ORDER BY created_at DESC LIMIT 1;
```

### 3. Error Case Testing

```sql
-- Test without authentication (should fail)
-- Run with anonymous context

-- Test with non-existent related records (should fail)
INSERT INTO candidate_notes (job_candidate_id, content) 
VALUES ('non-existent-id', 'Test note');
```

## Rollback Procedures

### Emergency Rollback (Disable Triggers)

```sql
-- Disable all org_id derivation triggers
DROP TRIGGER IF EXISTS set_org_id_candidate_notes ON candidate_notes;
DROP TRIGGER IF EXISTS set_org_id_interviews ON interviews;
DROP TRIGGER IF EXISTS set_org_id_ai_insights_cache ON ai_insights_cache;
DROP TRIGGER IF EXISTS set_org_id_ai_insights_metrics ON ai_insights_metrics;
DROP TRIGGER IF EXISTS set_org_id_ai_recommendations_history ON ai_recommendations_history;
DROP TRIGGER IF EXISTS set_org_id_messages ON messages;
DROP TRIGGER IF EXISTS set_org_id_message_recipients ON message_recipients;
DROP TRIGGER IF EXISTS set_org_id_clients ON clients;
DROP TRIGGER IF EXISTS set_org_id_jobs ON jobs;
DROP TRIGGER IF EXISTS set_org_id_candidates ON candidates;
DROP TRIGGER IF EXISTS set_org_id_job_candidate ON job_candidate;
DROP TRIGGER IF EXISTS set_org_id_pipeline_columns ON pipeline_columns;
```

### Full Rollback (Remove Functions)

```sql
-- Remove all trigger functions
DROP FUNCTION IF EXISTS derive_user_default_org_id();
DROP FUNCTION IF EXISTS set_org_id_from_job_candidate();
DROP FUNCTION IF EXISTS set_org_id_from_user_context();
DROP FUNCTION IF EXISTS set_org_id_from_job();
DROP FUNCTION IF EXISTS set_org_id_pipeline_columns();
```

## Monitoring and Maintenance

### 1. Monitor Trigger Performance

```sql
-- Check for trigger execution issues
SELECT schemaname, tablename, n_tup_ins, n_tup_upd 
FROM pg_stat_user_tables 
WHERE tablename IN (
  'candidate_notes', 'interviews', 'ai_insights_cache', 
  'messages', 'clients', 'jobs', 'candidates'
);
```

### 2. Monitor Error Logs

Watch application logs for trigger-related exceptions:
- "No authenticated user found"
- "User is not a member of any organization"  
- "Related record not found"
- "User does not have access to organization"

### 3. Periodic Validation

```sql
-- Verify data integrity (no orphaned org_id values)
SELECT 'candidate_notes' as table_name, COUNT(*) as invalid_count
FROM candidate_notes cn
LEFT JOIN organizations o ON cn.org_id = o.id  
WHERE o.id IS NULL
UNION ALL
SELECT 'jobs', COUNT(*) FROM jobs j
LEFT JOIN organizations o ON j.org_id = o.id WHERE o.id IS NULL;
```

## Support and Troubleshooting

### Common Issues

1. **"No authenticated user found"**
   - Ensure auth.uid() context is available
   - Check Supabase RLS is properly configured
   - Verify API calls include authentication headers

2. **"User is not a member of any organization"**
   - Check user_organizations table has entries for the user
   - Verify organization setup is complete
   - Consider adding default organization assignment

3. **"Related record not found"**
   - Ensure parent records exist before creating child records
   - Check foreign key relationships are correct
   - Verify record IDs are valid UUIDs

4. **Performance Issues**
   - Monitor trigger execution time
   - Check indexes on user_organizations table
   - Consider caching user's default org_id if needed

### Emergency Contacts

- Database Admin: [Contact Information]
- Application Team: [Contact Information]  
- Infrastructure Team: [Contact Information]

---

**Last Updated**: September 19, 2025
**Version**: 1.0
**Status**: Ready for Deployment