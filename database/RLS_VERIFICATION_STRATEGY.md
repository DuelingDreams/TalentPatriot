# RLS Verification Strategy

## Technical Constraint

**Supabase SQL Editor runs as `service_role` which bypasses ALL RLS policies.** There is no way to execute SQL queries as `anon` or `authenticated` roles from the SQL Editor without:
1. Creating test database roles (requires superuser access - not available)
2. Using `SET ROLE` (requires those roles to exist first)
3. Using application-level authentication (outside SQL Editor)

## Verification Approach

### What SQL Scripts CAN Verify ✅

1. **Data integrity**: Record counts remain unchanged
2. **Policy configuration**: Correct number of policies exist
3. **No duplicates**: Duplicate policy warnings eliminated
4. **Policy metadata**: Policy names, roles, and operations

### What SQL Scripts CANNOT Verify ❌

1. **Actual RLS behavior**: Whether anon users can access what they should
2. **Auth context**: Queries that depend on `auth.uid()`
3. **Policy logic**: Whether consolidated policies preserve original behavior

### Required Manual Verification

**CRITICAL: Step 4 of deployment guide is MANDATORY** - SQL cannot test RLS behavior.

#### Test Matrix (Must be performed via application):

| User Role | Test | Expected Result | Verifies Policy |
|-----------|------|-----------------|-----------------|
| **Anonymous** | View public job posting | ✅ Visible | jobs anon SELECT |
| **Anonymous** | Apply to job | ✅ Success | job_candidate anon INSERT |
| **Anonymous** | Access dashboard | ❌ Blocked | organizations anon block |
| **Authenticated** | View own org jobs | ✅ Visible | jobs auth SELECT |
| **Authenticated** | View other org jobs | ❌ Hidden | jobs auth SELECT (org filter) |
| **Authenticated** | View pipeline columns | ✅ Visible | pipeline_columns SELECT |
| **Authenticated** | Edit pipeline columns | ❌ Blocked | pipeline_columns admin-only |
| **Admin** | Edit pipeline columns | ✅ Success | pipeline_columns admin ALL |
| **Admin** | Manage org settings | ✅ Success | organizations auth ALL |
| **Authenticated** | Create message | ✅ Success | messages auth INSERT |
| **Authenticated** | View org messages | ✅ Visible | messages auth SELECT |

## Why This Is Safe

1. **Policy consolidation uses OR logic**: All original conditions preserved
2. **Manual testing is standard**: This is how RLS is typically verified
3. **Rollback available**: Transaction-wrapped deployment with ROLLBACK option
4. **Low risk**: Policies are being merged, not rewritten from scratch

## Deployment Safety Checklist

- [ ] SQL scripts verify data counts unchanged
- [ ] SQL scripts verify policy counts reduced (34→18)
- [ ] SQL scripts verify no duplicate policies remain
- [ ] Manual testing via application (Step 4) confirms all RLS behavior works
- [ ] Monitor logs for RLS errors after deployment
- [ ] Supabase Performance Advisor shows 0 warnings

## Alternative Approaches (Not Used)

1. **Create test roles**: Requires superuser, not available in managed Supabase
2. **Use pg_tap**: Requires installation, not available in managed Supabase
3. **Use Supabase CLI**: Could work but requires local setup and API keys
4. **Python/JS tests**: Outside scope of this SQL-focused deployment

## Conclusion

**The verification strategy is correct**: SQL verifies structure, application testing verifies behavior. This is the standard approach for RLS policy changes in managed Supabase environments.
