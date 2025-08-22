-- =====================================================
-- TALENTPATRIOT BETA USERS DATABASE SETUP
-- =====================================================
-- This script ensures all necessary tables and configurations
-- are in place for beta users to properly authenticate and
-- create organizations through the normal onboarding flow.
--
-- IMPORTANT: The existing schema already supports beta users.
-- This script adds additional tracking and ensures RLS policies
-- are properly configured.
-- =====================================================

-- Add beta program tracking fields to organizations table
-- This helps identify and track beta organizations
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS beta_program boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS beta_applied_at timestamp,
ADD COLUMN IF NOT EXISTS beta_approved_at timestamp,
ADD COLUMN IF NOT EXISTS beta_notes text;

-- Add beta program tracking to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS beta_user boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS beta_source text; -- 'beta_application' or 'quick_start'

-- Create beta applications table for tracking applications
CREATE TABLE IF NOT EXISTS beta_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  contact_name text NOT NULL,
  email text NOT NULL,
  phone text,
  website text,
  company_size text NOT NULL,
  current_ats text,
  pain_points text NOT NULL,
  expectations text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  user_id uuid, -- Will be filled when user signs up
  org_id uuid, -- Will be filled when organization is created
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL,
  processed_at timestamp,
  processed_by uuid,
  notes text
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_beta_applications_email ON beta_applications(email);
CREATE INDEX IF NOT EXISTS idx_beta_applications_status ON beta_applications(status);
CREATE INDEX IF NOT EXISTS idx_beta_applications_created ON beta_applications(created_at);
CREATE INDEX IF NOT EXISTS idx_organizations_beta ON organizations(beta_program);
CREATE INDEX IF NOT EXISTS idx_user_profiles_beta ON user_profiles(beta_user);

-- Enable RLS on beta_applications table
ALTER TABLE beta_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own beta applications
DROP POLICY IF EXISTS "Users can view own beta applications" ON beta_applications;
CREATE POLICY "Users can view own beta applications" ON beta_applications
  FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.uid() IN (
      SELECT uo.user_id FROM user_organizations uo 
      WHERE uo.org_id = beta_applications.org_id 
      AND uo.role IN ('owner', 'admin')
    )
  );

-- RLS Policy: Insert applications (public - no auth required for initial submission)
DROP POLICY IF EXISTS "Anyone can insert beta applications" ON beta_applications;
CREATE POLICY "Anyone can insert beta applications" ON beta_applications
  FOR INSERT WITH CHECK (true);

-- RLS Policy: Update applications (only by organization owners/admins)
DROP POLICY IF EXISTS "Organization owners can update beta applications" ON beta_applications;
CREATE POLICY "Organization owners can update beta applications" ON beta_applications
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT uo.user_id FROM user_organizations uo 
      WHERE uo.org_id = beta_applications.org_id 
      AND uo.role IN ('owner', 'admin')
    )
  );

-- Ensure existing RLS policies are in place for core tables
-- These policies should already exist, but we'll ensure they're present

-- Organizations RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view organizations they belong to
DROP POLICY IF EXISTS "Users can view own organizations" ON organizations;
CREATE POLICY "Users can view own organizations" ON organizations
  FOR SELECT USING (
    auth.uid() = owner_id OR 
    auth.uid() IN (
      SELECT user_id FROM user_organizations 
      WHERE org_id = organizations.id
    )
  );

-- Policy: Users can create organizations (for onboarding)
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;
CREATE POLICY "Authenticated users can create organizations" ON organizations
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Policy: Organization owners can update their organizations
DROP POLICY IF EXISTS "Organization owners can update" ON organizations;
CREATE POLICY "Organization owners can update" ON organizations
  FOR UPDATE USING (
    auth.uid() = owner_id OR 
    auth.uid() IN (
      SELECT user_id FROM user_organizations 
      WHERE org_id = organizations.id AND role IN ('owner', 'admin')
    )
  );

-- User Organizations RLS
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their organization memberships
DROP POLICY IF EXISTS "Users can view own memberships" ON user_organizations;
CREATE POLICY "Users can view own memberships" ON user_organizations
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Organization owners can manage memberships
DROP POLICY IF EXISTS "Organization owners can manage memberships" ON user_organizations;
CREATE POLICY "Organization owners can manage memberships" ON user_organizations
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM user_organizations uo2 
      WHERE uo2.org_id = user_organizations.org_id 
      AND uo2.role IN ('owner', 'admin')
    ) OR auth.uid() = user_id
  );

-- User Profiles RLS  
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view and manage their own profiles
DROP POLICY IF EXISTS "Users can manage own profiles" ON user_profiles;
CREATE POLICY "Users can manage own profiles" ON user_profiles
  FOR ALL USING (auth.uid() = id);

-- Create a function to automatically create user profiles
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, role, beta_user, beta_source)
  VALUES (
    NEW.id, 
    'hiring_manager',
    false, -- Will be updated based on signup source
    null
  );
  RETURN NEW;
EXCEPTION WHEN unique_violation THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profiles
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;
CREATE TRIGGER create_user_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- Function to link beta applications to users when they sign up
CREATE OR REPLACE FUNCTION link_beta_application(user_email text, user_id_param uuid)
RETURNS void AS $$
BEGIN
  UPDATE beta_applications 
  SET user_id = user_id_param, 
      updated_at = now()
  WHERE email = user_email 
  AND user_id IS NULL 
  AND status = 'approved';
  
  -- Mark user as beta user if they have an approved application
  UPDATE user_profiles 
  SET beta_user = true, 
      beta_source = 'beta_application',
      updated_at = now()
  WHERE id = user_id_param
  AND EXISTS (
    SELECT 1 FROM beta_applications 
    WHERE email = user_email AND status = 'approved'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark organization as beta when created by beta user
CREATE OR REPLACE FUNCTION mark_beta_organization()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the owner is a beta user
  IF EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = NEW.owner_id AND beta_user = true
  ) THEN
    NEW.beta_program = true;
    NEW.beta_approved_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically mark organizations as beta
DROP TRIGGER IF EXISTS mark_beta_organization_trigger ON organizations;
CREATE TRIGGER mark_beta_organization_trigger
  BEFORE INSERT ON organizations
  FOR EACH ROW EXECUTE FUNCTION mark_beta_organization();

-- =====================================================
-- BETA PROGRAM MANAGEMENT VIEWS AND FUNCTIONS
-- =====================================================

-- View for beta program statistics
CREATE OR REPLACE VIEW beta_program_stats AS
SELECT 
  COUNT(*) FILTER (WHERE status = 'pending') as pending_applications,
  COUNT(*) FILTER (WHERE status = 'approved') as approved_applications,
  COUNT(*) FILTER (WHERE status = 'rejected') as rejected_applications,
  COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) as converted_users,
  COUNT(DISTINCT org_id) FILTER (WHERE org_id IS NOT NULL) as created_organizations
FROM beta_applications;

-- View for beta organizations with details
CREATE OR REPLACE VIEW beta_organizations AS
SELECT 
  o.id,
  o.name,
  o.slug,
  o.created_at,
  o.beta_applied_at,
  o.beta_approved_at,
  o.beta_notes,
  ba.company_name as original_company_name,
  ba.email as contact_email,
  ba.company_size,
  ba.pain_points,
  (SELECT COUNT(*) FROM user_organizations uo WHERE uo.org_id = o.id) as team_size,
  (SELECT COUNT(*) FROM jobs j WHERE j.org_id = o.id) as total_jobs,
  (SELECT COUNT(*) FROM candidates c WHERE c.org_id = o.id) as total_candidates
FROM organizations o
LEFT JOIN beta_applications ba ON ba.org_id = o.id
WHERE o.beta_program = true;

-- =====================================================
-- EMAIL CAPTURE TABLE
-- =====================================================

-- Table for email capture from landing page
CREATE TABLE IF NOT EXISTS email_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  source text DEFAULT 'landing_page', -- 'landing_page', 'beta_page', etc.
  ip_address inet,
  user_agent text,
  created_at timestamp DEFAULT now() NOT NULL,
  converted_to_user boolean DEFAULT false,
  converted_at timestamp,
  unsubscribed boolean DEFAULT false,
  unsubscribed_at timestamp
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_signups_email ON email_signups(email);
CREATE INDEX IF NOT EXISTS idx_email_signups_created ON email_signups(created_at);
CREATE INDEX IF NOT EXISTS idx_email_signups_source ON email_signups(source);

-- Enable RLS on email signups (public table for submissions)
ALTER TABLE email_signups ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert email signups (for landing page form)
DROP POLICY IF EXISTS "Anyone can sign up for emails" ON email_signups;
CREATE POLICY "Anyone can sign up for emails" ON email_signups
  FOR INSERT WITH CHECK (true);

-- Only authenticated admin users can view email signups
DROP POLICY IF EXISTS "Admins can view email signups" ON email_signups;
CREATE POLICY "Admins can view email signups" ON email_signups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- COMPLETE - READY FOR BETA USERS
-- =====================================================

-- Summary of what this script provides:
-- 1. Beta application tracking in beta_applications table
-- 2. Beta user and organization identification
-- 3. Email capture for landing page signups  
-- 4. Automatic linking of beta applications to users
-- 5. RLS policies for security
-- 6. Triggers for automated beta tracking
-- 7. Management views for beta program oversight
-- 8. All existing functionality remains intact

-- Beta users can now:
-- 1. Submit beta applications through /beta page
-- 2. Sign up normally through onboarding (gets auto-linked if approved)
-- 3. Create organizations (automatically marked as beta if applicable)
-- 4. Use all ATS features with full data isolation
-- 5. Provide feedback through normal channels

COMMENT ON TABLE beta_applications IS 'Tracks beta program applications from /beta page';
COMMENT ON TABLE email_signups IS 'Captures email addresses from landing page for updates';
COMMENT ON COLUMN organizations.beta_program IS 'True if organization is part of beta program';
COMMENT ON COLUMN user_profiles.beta_user IS 'True if user is part of beta program';