-- Step 1: Add missing enum values to organization_role
-- Run this script first, then run step 2

-- Add the missing enum values
ALTER TYPE organization_role ADD VALUE IF NOT EXISTS 'hiring_manager';
ALTER TYPE organization_role ADD VALUE IF NOT EXISTS 'interviewer';

-- Verify the enum now includes all required values
-- You should see: ['owner', 'admin', 'recruiter', 'viewer', 'hiring_manager', 'interviewer']
SELECT unnest(enum_range(NULL::organization_role)) AS enum_values;