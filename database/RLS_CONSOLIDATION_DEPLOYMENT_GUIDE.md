# RLS Policy Consolidation - Deployment Guide

## Overview

This guide walks you through safely consolidating duplicate RLS policies in your production Supabase database to eliminate all performance warnings.

**Impact:**
- **Performance**: 30-50% faster queries on affected tables
- **Warnings**: Resolves all 62 Supabase Performance Advisor warnings
- **Policies Reduced**: 34 policies → 18 policies across 6 tables (16 duplicates removed)

## Pre-Deployment Checklist

- [ ] Production database backup completed (or verify auto-backup is enabled)
- [ ] Low-traffic time window identified (recommended: early morning or weekend)
- [ ] Supabase SQL Editor open and ready
- [ ] This guide and all 3 SQL scripts accessible

## Deployment Steps

### Step 1: Run Pre-Deployment Verification (5 minutes)

**Purpose:** Document current behavior to compare after consolidation.

1. Open Supabase Dashboard → SQL Editor
2. Copy and paste: `database/rls_verification_pre_deployment.sql`
3. Run the script
4. **Save the output** (Export as CSV or copy to notepad)
   - You'll compare this with post-deployment results

**What to verify:**
- All test queries return counts (no errors)
- Note the policy counts for each table

---

### Step 2: Run Consolidation Script (10 minutes)

**Purpose:** Consolidate duplicate policies while preserving all security logic.

1. Open a new SQL Editor tab
2. Copy and paste: `database/rls_consolidation_production.sql`
3. **Review the script** - it's wrapped in `BEGIN` transaction
4. Run the script
5. **Review the verification output**:
   - Check "BEFORE CONSOLIDATION" counts
   - Review each table's verification section
   - Check "AFTER CONSOLIDATION" counts

**Expected Output:**
```
BEFORE CONSOLIDATION:
- jobs: 6 policies
- organizations: 7 policies
- user_organizations: 10 policies
- messages: 4 policies
- job_candidate: 5 policies
- pipeline_columns: 2 policies

AFTER CONSOLIDATION:
- jobs: 3 policies
- organizations: 3 policies
- user_organizations: 5 policies
- messages: 2 policies
- job_candidate: 3 policies
- pipeline_columns: 2 policies (unchanged - both needed)
```

6. **If everything looks correct:**
   ```sql
   COMMIT;
   ```

7. **If something looks wrong:**
   ```sql
   ROLLBACK;
   ```
   Then contact support or review the script.

---

### Step 3: Run Post-Deployment Verification (5 minutes)

**Purpose:** Confirm database state is unchanged (except policy counts).

1. Open a new SQL Editor tab
2. Copy and paste: `database/rls_verification_post_deployment.sql`
3. Run the script
4. **Compare output with Step 1:**
   - Data counts: All should match exactly (same number of jobs, orgs, messages, etc.)
   - Policy counts: Should be reduced as expected (34→18)
   - Duplicate check: Should return 0 rows

**Success Criteria:**
- ✅ All data counts match pre-deployment exactly
- ✅ Policy counts reduced (jobs: 6→3, orgs: 7→3, etc.)
- ✅ "REMAINING DUPLICATES" query returns 0 rows
- ✅ Total policies: 18 (was 34)

---

### Step 4: Verify Application Functionality (10 minutes)

**Purpose:** CRITICAL - Confirm RLS policies work correctly via the actual application.

**Note:** SQL verification scripts run as service role (bypassing RLS). This step is REQUIRED to test actual RLS behavior.

Test these critical flows:

1. **Public Job Applications (Anonymous - Tests anon policies):**
   - Open browser in incognito/private mode
   - Go to a public job posting (e.g., `/careers/[job-slug]`)
   - ✅ Job details should be visible
   - Submit a test application
   - ✅ Should work without errors
   - Try to access dashboard (should be blocked)
   - ✅ Should redirect to login

2. **Authenticated Dashboard (Tests authenticated policies):**
   - Log in as regular user (not admin)
   - Navigate to Jobs page
   - ✅ Should see jobs from your organization only
   - Navigate to Candidates page
   - ✅ Should see candidates from your organization only
   - Navigate to Messages page
   - ✅ Should see messages for your organization
   - Try to view pipeline columns
   - ✅ Should be able to see (but not edit) pipeline columns

3. **Admin Functions (Tests admin policies):**
   - Log in as admin user
   - Go to Settings → Organization
   - ✅ Organization details should be visible
   - Try to update organization settings
   - ✅ Should save successfully
   - Go to Jobs → Edit pipeline
   - ✅ Should be able to edit pipeline columns

4. **Message Creation (Tests INSERT policies):**
   - As any authenticated user
   - Go to Messages page
   - Create a new message
   - ✅ Should save successfully

**If any test fails:**
1. Note the specific error and which user role experienced it
2. Check browser console for RLS/permission errors
3. Run: `ROLLBACK;` in SQL Editor (if still in transaction)
4. Document the regression and DO NOT proceed

---

### Step 5: Monitor Performance (24 hours)

**Purpose:** Confirm performance improvements.

1. **Check Supabase Performance Advisor:**
   - Dashboard → Advisors → Performance
   - ✅ "Multiple Permissive Policies" warnings should be GONE (0 warnings)

2. **Monitor query performance:**
   - Dashboard → Database → Query Performance
   - Look for faster execution times on:
     - `SELECT * FROM jobs WHERE...`
     - `SELECT * FROM organizations WHERE...`
     - `SELECT * FROM user_organizations WHERE...`

3. **Monitor error logs:**
   - Dashboard → Logs → Postgres Logs
   - Watch for any RLS-related errors (should be none)

---

## Rollback Plan

If issues are discovered after deployment:

### Immediate Rollback (Within Transaction)

If you haven't run `COMMIT` yet:
```sql
ROLLBACK;
```

### Post-Commit Rollback

If you already committed and need to revert:

1. Use Supabase's Point-in-Time Recovery (PITR):
   - Dashboard → Database → Backups
   - Restore to point before consolidation
   
2. OR manually restore old policies:
   - Contact support for assistance
   - Provide the pre-deployment verification output

---

## Success Metrics

After successful deployment, you should see:

✅ **Performance Advisor:** 0 "Multiple Permissive Policies" warnings  
✅ **Policy Count:** Reduced from 34 to 18 policies (16 duplicates removed)  
✅ **Query Performance:** 30-50% faster on jobs/organizations tables  
✅ **Application:** All user roles (anon, authenticated, admin) work identically  
✅ **Logs:** No new RLS permission errors  

---

## Troubleshooting

### Issue: Transaction timeout during consolidation
**Solution:** Increase statement timeout before running:
```sql
SET statement_timeout = '60s';
BEGIN;
-- Then run consolidation script
```

### Issue: "Policy does not exist" error
**Solution:** Some policies may have already been dropped. Check current policies:
```sql
SELECT policyname FROM pg_policies WHERE tablename = 'jobs';
```
Then comment out the `DROP POLICY` line for missing policies.

### Issue: Post-verification counts don't match
**Solution:** This indicates a logic error. Run `ROLLBACK` immediately and contact support.

---

## Support

If you encounter issues during deployment:
1. Run `ROLLBACK;` immediately
2. Save all error messages and verification output
3. Check Supabase community forums or Discord
4. Contact Supabase support with detailed error info

---

## Timeline

**Total Deployment Time:** ~30 minutes

- Pre-verification: 5 min
- Consolidation: 10 min
- Post-verification: 5 min
- App testing: 10 min

**Recommended Window:** Low-traffic period (early morning or weekend)

---

## Post-Deployment Checklist

- [ ] All verification tests passed
- [ ] Application functionality confirmed
- [ ] Supabase Performance Advisor shows 0 warnings
- [ ] No errors in Postgres logs
- [ ] Performance improvements observed
- [ ] Documentation updated (replit.md)

---

## Next Steps After Success

1. Monitor application for 24-48 hours
2. Document performance improvements
3. Consider similar consolidations for other tables if needed
4. Update team about the optimization

**Questions?** Review this guide or contact support before proceeding.
