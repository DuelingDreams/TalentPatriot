# 🚨 CRITICAL: Fix for Infinite Recursion in user_organizations Table

## Issue
Users cannot save candidate notes due to infinite recursion error in Supabase RLS policy:
```
"infinite recursion detected in policy for relation \"user_organizations\""
```

## Root Cause
The RLS policies create a circular dependency:
1. Functions like `get_user_org_ids()` query the `user_organizations` table
2. When `user_organizations` is queried, its RLS policy is evaluated
3. The policy evaluation triggers the same functions, creating infinite recursion

## IMMEDIATE FIX REQUIRED

### Step 1: Apply this SQL fix in Supabase SQL Editor

```sql
-- ========================================
-- CRITICAL FIX: Stop Infinite Recursion
-- ========================================

BEGIN;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "user_organizations_policy" ON user_organizations;
DROP POLICY IF EXISTS "user_organizations_access_policy" ON user_organizations;
DROP POLICY IF EXISTS "user_organizations_secure_access" ON user_organizations;

-- Fix the get_user_org_ids function to use SECURITY DEFINER
-- This bypasses RLS when the function queries user_organizations
CREATE OR REPLACE FUNCTION get_user_org_ids(user_id UUID)
RETURNS UUID[]
LANGUAGE sql
SECURITY DEFINER  -- KEY FIX: Bypasses RLS
STABLE
AS $$
  SELECT ARRAY_AGG(org_id) 
  FROM user_organizations 
  WHERE user_id = $1;
$$;

-- Create simple, non-recursive policy
CREATE POLICY "user_organizations_simple" ON user_organizations
    FOR ALL 
    TO authenticated
    USING (user_id = auth.uid());

-- Block anonymous access
CREATE POLICY "user_organizations_block_anon" ON user_organizations
    FOR ALL 
    TO anon 
    USING (false);

-- Ensure get_user_role function is also safe
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT role::text FROM user_profiles WHERE id = user_id),
    'hiring_manager'
  );
$$;

COMMIT;
```

### Step 2: Verify the fix

After applying the SQL, run this test query:
```sql
SELECT get_user_org_ids(auth.uid());
```

This should return your organization IDs without the infinite recursion error.

### Step 3: Test note creation

Try saving a candidate note in the application. The error should be resolved.

## How to Apply the Fix

1. **Go to your Supabase Dashboard**
2. **Navigate to SQL Editor**
3. **Copy and paste the SQL fix above**
4. **Click "Run" to execute**
5. **Refresh the application**
6. **Test saving a candidate note**

## Files Created for Reference

1. `fix_user_organizations_infinite_recursion.sql` - Complete fix with documentation
2. `migrations/20250919_fix_user_organizations_infinite_recursion.sql` - Migration file
3. This README with step-by-step instructions

## Technical Details

**The Fix:**
- Uses `SECURITY DEFINER` on `get_user_org_ids()` function to bypass RLS when querying `user_organizations`
- Simplifies the `user_organizations` policy to just `user_id = auth.uid()`
- Eliminates circular dependencies while maintaining security

**Why This Works:**
- `SECURITY DEFINER` functions run with the privileges of the function owner
- This allows the function to query `user_organizations` without triggering RLS policies
- Other policies can safely call this function without causing recursion

## Priority: IMMEDIATE
This fix is required for users to save candidate notes. Apply immediately to restore functionality.