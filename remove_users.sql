-- SQL Script to Remove Specific Users and Related Data
-- WARNING: This will permanently delete user data. Use with caution.

-- Step 1: Handle organizations owned by users being deleted
-- Option A: Delete organizations owned by these users (WARNING: This deletes all org data)
DELETE FROM organizations 
WHERE owner_id IN (
  '9c2d0262-2d41-4771-a8e7-d7ee4b69e836',
  'cfc07d6f-0fa6-4d03-a732-bc93d311fb94', 
  '401c7ee1-426b-480e-abb5-48601018ab58',
  '4fff0ae1-5311-4eb9-b4b3-3c83a2d1658d',
  '2cf6d422-69c8-442f-b970-a19f7eab5d95'
);

-- Option B: Set owner_id to NULL (uncomment if you prefer this approach)
-- UPDATE organizations 
-- SET owner_id = NULL 
-- WHERE owner_id IN (
--   '9c2d0262-2d41-4771-a8e7-d7ee4b69e836',
--   'cfc07d6f-0fa6-4d03-a732-bc93d311fb94', 
--   '401c7ee1-426b-480e-abb5-48601018ab58',
--   '4fff0ae1-5311-4eb9-b4b3-3c83a2d1658d',
--   '2cf6d422-69c8-442f-b970-a19f7eab5d95'
-- );

-- Step 2: Remove user-organization relationships
DELETE FROM user_organizations 
WHERE user_id IN (
  '9c2d0262-2d41-4771-a8e7-d7ee4b69e836',
  'cfc07d6f-0fa6-4d03-a732-bc93d311fb94', 
  '401c7ee1-426b-480e-abb5-48601018ab58',
  '4fff0ae1-5311-4eb9-b4b3-3c83a2d1658d',
  '2cf6d422-69c8-442f-b970-a19f7eab5d95'
);

-- Step 2: Remove users from auth.users (Supabase Auth table)
-- Note: This requires RLS to be disabled or proper permissions
DELETE FROM auth.users 
WHERE id IN (
  '9c2d0262-2d41-4771-a8e7-d7ee4b69e836',
  'cfc07d6f-0fa6-4d03-a732-bc93d311fb94', 
  '401c7ee1-426b-480e-abb5-48601018ab58',
  '4fff0ae1-5311-4eb9-b4b3-3c83a2d1658d',
  '2cf6d422-69c8-442f-b970-a19f7eab5d95'
);

-- Step 3: Remove users from your users table
DELETE FROM users 
WHERE id IN (
  '9c2d0262-2d41-4771-a8e7-d7ee4b69e836',
  'cfc07d6f-0fa6-4d03-a732-bc93d311fb94', 
  '401c7ee1-426b-480e-abb5-48601018ab58',
  '4fff0ae1-5311-4eb9-b4b3-3c83a2d1658d',
  '2cf6d422-69c8-442f-b970-a19f7eab5d95'
);

-- Verification queries (run these BEFORE the deletions to check what will be deleted)
-- SELECT * FROM users WHERE id IN ('9c2d0262-2d41-4771-a8e7-d7ee4b69e836','cfc07d6f-0fa6-4d03-a732-bc93d311fb94','401c7ee1-426b-480e-abb5-48601018ab58','4fff0ae1-5311-4eb9-b4b3-3c83a2d1658d','2cf6d422-69c8-442f-b970-a19f7eab5d95');
-- SELECT * FROM auth.users WHERE id IN ('9c2d0262-2d41-4771-a8e7-d7ee4b69e836','cfc07d6f-0fa6-4d03-a732-bc93d311fb94','401c7ee1-426b-480e-abb5-48601018ab58','4fff0ae1-5311-4eb9-b4b3-3c83a2d1658d','2cf6d422-69c8-442f-b970-a19f7eab5d95');
-- SELECT * FROM user_organizations WHERE user_id IN ('9c2d0262-2d41-4771-a8e7-d7ee4b69e836','cfc07d6f-0fa6-4d03-a732-bc93d311fb94','401c7ee1-426b-480e-abb5-48601018ab58','4fff0ae1-5311-4eb9-b4b3-3c83a2d1658d','2cf6d422-69c8-442f-b970-a19f7eab5d95');