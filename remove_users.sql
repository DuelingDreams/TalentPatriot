-- SQL Script to Remove Users and Related Data
-- WARNING: This will permanently delete user data. Use with caution.

-- Step 1: Remove user-organization relationships
DELETE FROM user_organizations 
WHERE user_id IN (
  SELECT id FROM users 
  WHERE email LIKE '%@example.com'  -- Modify this condition as needed
  OR created_at < '2025-01-01'      -- Or use date criteria
  OR id = 'specific-user-id'        -- Or target specific user IDs
);

-- Step 2: Remove users from auth.users (Supabase Auth table)
-- Note: This requires RLS to be disabled or proper permissions
DELETE FROM auth.users 
WHERE email LIKE '%@example.com'    -- Modify this condition as needed
OR created_at < '2025-01-01'        -- Or use date criteria
OR id = 'specific-user-id';         -- Or target specific user IDs

-- Step 3: Remove users from your users table
DELETE FROM users 
WHERE email LIKE '%@example.com'    -- Modify this condition as needed
OR created_at < '2025-01-01'        -- Or use date criteria
OR id = 'specific-user-id';         -- Or target specific user IDs

-- Alternative: Remove ALL users (use with extreme caution)
-- DELETE FROM user_organizations;
-- DELETE FROM auth.users;
-- DELETE FROM users;

-- Verification queries (run these to check what will be deleted)
-- SELECT * FROM users WHERE email LIKE '%@example.com';
-- SELECT * FROM auth.users WHERE email LIKE '%@example.com';
-- SELECT * FROM user_organizations WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@example.com');

-- Clean up orphaned data (optional)
-- Remove organizations with no users
DELETE FROM organizations 
WHERE id NOT IN (SELECT DISTINCT org_id FROM user_organizations);

-- Reset sequences if needed (optional)
-- ALTER SEQUENCE users_id_seq RESTART WITH 1;