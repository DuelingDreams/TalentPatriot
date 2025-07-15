-- Create an admin user for role management
-- This script sets up an admin user who can manage other user roles

-- Note: This would typically be done through Supabase Admin UI or API
-- For demonstration purposes, this shows the metadata structure needed

-- Admin user with role management permissions
-- Email: admin@yourapp.com
-- Password: Admin1234!
-- Role: admin

-- Example of setting user metadata for admin role:
-- This would be done through Supabase Admin API:
-- supabase.auth.admin.updateUserById(userId, {
--   user_metadata: { role: 'admin' }
-- })

-- Demo data verification - ensure admin can see all data
-- Admin users should see all records regardless of status
SELECT 'Admin can see all clients:' as info, count(*) as total_clients FROM clients;
SELECT 'Admin can see all jobs:' as info, count(*) as total_jobs FROM jobs;
SELECT 'Admin can see all candidates:' as info, count(*) as total_candidates FROM candidates;

-- Role distribution
SELECT 
  'Current user roles:' as info,
  raw_user_meta_data->>'role' as role,
  count(*) as user_count
FROM auth.users 
GROUP BY raw_user_meta_data->>'role';