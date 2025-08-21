-- Fix organization_role enum to match application schema
-- This adds the missing 'hiring_manager' and 'interviewer' values

-- Add the missing enum values to organization_role
ALTER TYPE organization_role ADD VALUE IF NOT EXISTS 'hiring_manager';
ALTER TYPE organization_role ADD VALUE IF NOT EXISTS 'interviewer';

-- Verify the enum now includes all required values
-- Expected values: ['owner', 'admin', 'recruiter', 'viewer', 'hiring_manager', 'interviewer']