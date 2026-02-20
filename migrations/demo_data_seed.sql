-- ============================================================
-- TalentPatriot Demo Data Seed Script
-- Run in Supabase SQL Editor to populate demo account data
-- Safe to run multiple times (uses ON CONFLICT / checks)
-- ============================================================

-- Demo user and org IDs
-- Demo user: demo@talentpatriot.com = cd99579b-1b80-4802-9651-e881fb707583
-- Demo org: 550e8400-e29b-41d4-a716-446655440000

DO $$
DECLARE
  demo_user_id uuid := 'cd99579b-1b80-4802-9651-e881fb707583';
  demo_org_id uuid := '550e8400-e29b-41d4-a716-446655440000';

  -- Client IDs
  client_acme uuid := 'a0000001-0001-4000-8000-000000000001';
  client_nova uuid := 'a0000001-0001-4000-8000-000000000002';
  client_summit uuid := 'a0000001-0001-4000-8000-000000000003';
  client_greenleaf uuid := 'a0000001-0001-4000-8000-000000000004';
  client_bluewave uuid := 'a0000001-0001-4000-8000-000000000005';

  -- Job IDs
  job_swe uuid := 'b0000001-0001-4000-8000-000000000001';
  job_pm uuid := 'b0000001-0001-4000-8000-000000000002';
  job_designer uuid := 'b0000001-0001-4000-8000-000000000003';
  job_devops uuid := 'b0000001-0001-4000-8000-000000000004';
  job_datasci uuid := 'b0000001-0001-4000-8000-000000000005';
  job_frontend uuid := 'b0000001-0001-4000-8000-000000000006';
  job_marketing uuid := 'b0000001-0001-4000-8000-000000000007';
  job_sales uuid := 'b0000001-0001-4000-8000-000000000008';

  -- Candidate IDs
  cand_01 uuid := 'c0000001-0001-4000-8000-000000000001';
  cand_02 uuid := 'c0000001-0001-4000-8000-000000000002';
  cand_03 uuid := 'c0000001-0001-4000-8000-000000000003';
  cand_04 uuid := 'c0000001-0001-4000-8000-000000000004';
  cand_05 uuid := 'c0000001-0001-4000-8000-000000000005';
  cand_06 uuid := 'c0000001-0001-4000-8000-000000000006';
  cand_07 uuid := 'c0000001-0001-4000-8000-000000000007';
  cand_08 uuid := 'c0000001-0001-4000-8000-000000000008';
  cand_09 uuid := 'c0000001-0001-4000-8000-000000000009';
  cand_10 uuid := 'c0000001-0001-4000-8000-000000000010';
  cand_11 uuid := 'c0000001-0001-4000-8000-000000000011';
  cand_12 uuid := 'c0000001-0001-4000-8000-000000000012';
  cand_13 uuid := 'c0000001-0001-4000-8000-000000000013';
  cand_14 uuid := 'c0000001-0001-4000-8000-000000000014';
  cand_15 uuid := 'c0000001-0001-4000-8000-000000000015';
  cand_16 uuid := 'c0000001-0001-4000-8000-000000000016';
  cand_17 uuid := 'c0000001-0001-4000-8000-000000000017';
  cand_18 uuid := 'c0000001-0001-4000-8000-000000000018';
  cand_19 uuid := 'c0000001-0001-4000-8000-000000000019';
  cand_20 uuid := 'c0000001-0001-4000-8000-000000000020';
  cand_21 uuid := 'c0000001-0001-4000-8000-000000000021';
  cand_22 uuid := 'c0000001-0001-4000-8000-000000000022';
  cand_23 uuid := 'c0000001-0001-4000-8000-000000000023';
  cand_24 uuid := 'c0000001-0001-4000-8000-000000000024';
  cand_25 uuid := 'c0000001-0001-4000-8000-000000000025';

  -- Job-Candidate IDs
  jc_01 uuid := 'd0000001-0001-4000-8000-000000000001';
  jc_02 uuid := 'd0000001-0001-4000-8000-000000000002';
  jc_03 uuid := 'd0000001-0001-4000-8000-000000000003';
  jc_04 uuid := 'd0000001-0001-4000-8000-000000000004';
  jc_05 uuid := 'd0000001-0001-4000-8000-000000000005';
  jc_06 uuid := 'd0000001-0001-4000-8000-000000000006';
  jc_07 uuid := 'd0000001-0001-4000-8000-000000000007';
  jc_08 uuid := 'd0000001-0001-4000-8000-000000000008';
  jc_09 uuid := 'd0000001-0001-4000-8000-000000000009';
  jc_10 uuid := 'd0000001-0001-4000-8000-000000000010';
  jc_11 uuid := 'd0000001-0001-4000-8000-000000000011';
  jc_12 uuid := 'd0000001-0001-4000-8000-000000000012';
  jc_13 uuid := 'd0000001-0001-4000-8000-000000000013';
  jc_14 uuid := 'd0000001-0001-4000-8000-000000000014';
  jc_15 uuid := 'd0000001-0001-4000-8000-000000000015';
  jc_16 uuid := 'd0000001-0001-4000-8000-000000000016';
  jc_17 uuid := 'd0000001-0001-4000-8000-000000000017';
  jc_18 uuid := 'd0000001-0001-4000-8000-000000000018';
  jc_19 uuid := 'd0000001-0001-4000-8000-000000000019';
  jc_20 uuid := 'd0000001-0001-4000-8000-000000000020';
  jc_21 uuid := 'd0000001-0001-4000-8000-000000000021';
  jc_22 uuid := 'd0000001-0001-4000-8000-000000000022';
  jc_23 uuid := 'd0000001-0001-4000-8000-000000000023';
  jc_24 uuid := 'd0000001-0001-4000-8000-000000000024';
  jc_25 uuid := 'd0000001-0001-4000-8000-000000000025';
  jc_26 uuid := 'd0000001-0001-4000-8000-000000000026';
  jc_27 uuid := 'd0000001-0001-4000-8000-000000000027';
  jc_28 uuid := 'd0000001-0001-4000-8000-000000000028';
  jc_29 uuid := 'd0000001-0001-4000-8000-000000000029';
  jc_30 uuid := 'd0000001-0001-4000-8000-000000000030';
  jc_31 uuid := 'd0000001-0001-4000-8000-000000000031';
  jc_32 uuid := 'd0000001-0001-4000-8000-000000000032';
  jc_33 uuid := 'd0000001-0001-4000-8000-000000000033';
  jc_34 uuid := 'd0000001-0001-4000-8000-000000000034';
  jc_35 uuid := 'd0000001-0001-4000-8000-000000000035';

  -- Pipeline column IDs (per job)
  pc_swe_1 uuid := 'e0000001-0001-4000-8000-000000000001';
  pc_swe_2 uuid := 'e0000001-0001-4000-8000-000000000002';
  pc_swe_3 uuid := 'e0000001-0001-4000-8000-000000000003';
  pc_swe_4 uuid := 'e0000001-0001-4000-8000-000000000004';
  pc_swe_5 uuid := 'e0000001-0001-4000-8000-000000000005';
  pc_pm_1 uuid := 'e0000001-0001-4000-8000-000000000011';
  pc_pm_2 uuid := 'e0000001-0001-4000-8000-000000000012';
  pc_pm_3 uuid := 'e0000001-0001-4000-8000-000000000013';
  pc_pm_4 uuid := 'e0000001-0001-4000-8000-000000000014';
  pc_pm_5 uuid := 'e0000001-0001-4000-8000-000000000015';
  pc_des_1 uuid := 'e0000001-0001-4000-8000-000000000021';
  pc_des_2 uuid := 'e0000001-0001-4000-8000-000000000022';
  pc_des_3 uuid := 'e0000001-0001-4000-8000-000000000023';
  pc_des_4 uuid := 'e0000001-0001-4000-8000-000000000024';
  pc_des_5 uuid := 'e0000001-0001-4000-8000-000000000025';
  pc_devops_1 uuid := 'e0000001-0001-4000-8000-000000000031';
  pc_devops_2 uuid := 'e0000001-0001-4000-8000-000000000032';
  pc_devops_3 uuid := 'e0000001-0001-4000-8000-000000000033';
  pc_devops_4 uuid := 'e0000001-0001-4000-8000-000000000034';
  pc_devops_5 uuid := 'e0000001-0001-4000-8000-000000000035';
  pc_ds_1 uuid := 'e0000001-0001-4000-8000-000000000041';
  pc_ds_2 uuid := 'e0000001-0001-4000-8000-000000000042';
  pc_ds_3 uuid := 'e0000001-0001-4000-8000-000000000043';
  pc_ds_4 uuid := 'e0000001-0001-4000-8000-000000000044';
  pc_ds_5 uuid := 'e0000001-0001-4000-8000-000000000045';
  pc_fe_1 uuid := 'e0000001-0001-4000-8000-000000000051';
  pc_fe_2 uuid := 'e0000001-0001-4000-8000-000000000052';
  pc_fe_3 uuid := 'e0000001-0001-4000-8000-000000000053';
  pc_fe_4 uuid := 'e0000001-0001-4000-8000-000000000054';
  pc_fe_5 uuid := 'e0000001-0001-4000-8000-000000000055';
  pc_mkt_1 uuid := 'e0000001-0001-4000-8000-000000000061';
  pc_mkt_2 uuid := 'e0000001-0001-4000-8000-000000000062';
  pc_mkt_3 uuid := 'e0000001-0001-4000-8000-000000000063';
  pc_mkt_4 uuid := 'e0000001-0001-4000-8000-000000000064';
  pc_mkt_5 uuid := 'e0000001-0001-4000-8000-000000000065';
  pc_sales_1 uuid := 'e0000001-0001-4000-8000-000000000071';
  pc_sales_2 uuid := 'e0000001-0001-4000-8000-000000000072';
  pc_sales_3 uuid := 'e0000001-0001-4000-8000-000000000073';
  pc_sales_4 uuid := 'e0000001-0001-4000-8000-000000000074';
  pc_sales_5 uuid := 'e0000001-0001-4000-8000-000000000075';

  -- Message IDs
  msg_01 uuid := 'f0000001-0001-4000-8000-000000000001';
  msg_02 uuid := 'f0000001-0001-4000-8000-000000000002';
  msg_03 uuid := 'f0000001-0001-4000-8000-000000000003';
  msg_04 uuid := 'f0000001-0001-4000-8000-000000000004';
  msg_05 uuid := 'f0000001-0001-4000-8000-000000000005';
  msg_06 uuid := 'f0000001-0001-4000-8000-000000000006';

  -- Interview IDs
  int_01 uuid := 'f1000001-0001-4000-8000-000000000001';
  int_02 uuid := 'f1000001-0001-4000-8000-000000000002';
  int_03 uuid := 'f1000001-0001-4000-8000-000000000003';
  int_04 uuid := 'f1000001-0001-4000-8000-000000000004';
  int_05 uuid := 'f1000001-0001-4000-8000-000000000005';
  int_06 uuid := 'f1000001-0001-4000-8000-000000000006';

BEGIN

-- ============================================================
-- 1. ORGANIZATION
-- ============================================================
INSERT INTO organizations (id, name, owner_id, slug, seats_purchased, plan_tier, onboarding_status, careers_status)
VALUES (
  demo_org_id,
  'TalentPatriot Demo Agency',
  demo_user_id,
  'talentpatriot-demo',
  10,
  'professional',
  'live',
  'published'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  onboarding_status = EXCLUDED.onboarding_status,
  careers_status = EXCLUDED.careers_status;

-- ============================================================
-- 2. USER PROFILE
-- ============================================================
INSERT INTO user_profiles (id, role, first_name, last_name, phone, job_title, department, location, bio)
VALUES (
  demo_user_id,
  'demo_viewer',
  'Alex',
  'Demo',
  '(555) 123-4567',
  'Recruiting Manager',
  'Talent Acquisition',
  'Washington, DC',
  'Demo account for exploring TalentPatriot features. This account has full read access to sample recruitment data.'
)
ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  job_title = EXCLUDED.job_title,
  department = EXCLUDED.department,
  location = EXCLUDED.location,
  bio = EXCLUDED.bio;

-- ============================================================
-- 3. USER-ORGANIZATION LINK
-- ============================================================
INSERT INTO user_organizations (user_id, org_id, role, is_recruiter_seat, status, is_admin, invite_status)
VALUES (demo_user_id, demo_org_id, 'admin', true, 'active', true, 'accepted')
ON CONFLICT ON CONSTRAINT unique_user_org DO UPDATE SET
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  is_admin = EXCLUDED.is_admin;

-- ============================================================
-- 4. CLIENTS
-- ============================================================
INSERT INTO clients (id, org_id, name, industry, location, website, contact_name, contact_email, contact_phone, notes, status, client_type, region, priority, payment_terms, last_contact_at, created_by) VALUES
  (client_acme, demo_org_id, 'Acme Technologies', 'Technology', 'San Francisco, CA', 'https://acmetech.example.com', 'Sarah Chen', 'sarah.chen@acmetech.example.com', '(415) 555-0101', 'Enterprise software company. Strong relationship. 3 active requisitions.', 'active', 'commercial', 'West', 'high', 'Net 30', NOW() - INTERVAL '2 days', demo_user_id),
  (client_nova, demo_org_id, 'Nova Healthcare Systems', 'Healthcare', 'Boston, MA', 'https://novahealthcare.example.com', 'Dr. James Wilson', 'jwilson@novahealthcare.example.com', '(617) 555-0202', 'Growing healthtech startup. Series B funded. Looking for engineering talent.', 'active', 'startup', 'East', 'high', 'Net 15', NOW() - INTERVAL '5 days', demo_user_id),
  (client_summit, demo_org_id, 'Summit Financial Group', 'Financial Services', 'New York, NY', 'https://summitfinancial.example.com', 'Michael Torres', 'mtorres@summitfinancial.example.com', '(212) 555-0303', 'Mid-size financial advisory firm expanding their digital team.', 'active', 'commercial', 'East', 'medium', 'Net 30', NOW() - INTERVAL '1 week', demo_user_id),
  (client_greenleaf, demo_org_id, 'GreenLeaf Energy', 'Clean Energy', 'Austin, TX', 'https://greenleafenergy.example.com', 'Lisa Park', 'lpark@greenleafenergy.example.com', '(512) 555-0404', 'Renewable energy company. Government contracts. Need cleared candidates.', 'active', 'commercial', 'South', 'medium', 'Net 45', NOW() - INTERVAL '3 days', demo_user_id),
  (client_bluewave, demo_org_id, 'BlueWave Analytics', 'Data Analytics', 'Seattle, WA', 'https://bluewave.example.com', 'Ryan Patel', 'rpatel@bluewave.example.com', '(206) 555-0505', 'AI/ML focused analytics firm. Rapid growth phase.', 'active', 'startup', 'West', 'high', 'Net 30', NOW() - INTERVAL '1 day', demo_user_id)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  industry = EXCLUDED.industry,
  contact_name = EXCLUDED.contact_name,
  status = EXCLUDED.status;

-- ============================================================
-- 5. JOBS (8 jobs across clients, varied statuses)
-- ============================================================
INSERT INTO jobs (id, org_id, title, description, location, job_type, department, salary_range, experience_level, remote_option, client_id, status, record_status, public_slug, created_by, assigned_to, published_at) VALUES
  (job_swe, demo_org_id, 'Senior Software Engineer', 'We are looking for a Senior Software Engineer to join our platform team. You will design and build scalable microservices, mentor junior developers, and drive technical decisions. Experience with distributed systems and cloud infrastructure required.', 'San Francisco, CA', 'full-time', 'Engineering', '$150,000 - $190,000', 'senior', 'hybrid', client_acme, 'open', 'active', 'sr-software-engineer-acme', demo_user_id, demo_user_id, NOW() - INTERVAL '30 days'),
  (job_pm, demo_org_id, 'Product Manager', 'Seeking a Product Manager to own the patient engagement platform roadmap. You will work closely with engineering, design, and clinical teams to deliver features that improve patient outcomes. Healthcare or SaaS experience preferred.', 'Boston, MA', 'full-time', 'Product', '$130,000 - $160,000', 'mid', 'onsite', client_nova, 'open', 'active', 'product-manager-nova', demo_user_id, demo_user_id, NOW() - INTERVAL '21 days'),
  (job_designer, demo_org_id, 'UX/UI Designer', 'Looking for a creative UX/UI Designer to reimagine our client-facing financial dashboards. Strong portfolio in data visualization and fintech design systems required. Figma expertise a must.', 'New York, NY', 'full-time', 'Design', '$110,000 - $140,000', 'mid', 'hybrid', client_summit, 'open', 'active', 'ux-designer-summit', demo_user_id, demo_user_id, NOW() - INTERVAL '14 days'),
  (job_devops, demo_org_id, 'DevOps Engineer', 'Join our infrastructure team to build and maintain CI/CD pipelines, manage Kubernetes clusters, and ensure 99.9% uptime for our energy monitoring platform. AWS and Terraform experience required.', 'Austin, TX', 'full-time', 'Engineering', '$140,000 - $170,000', 'senior', 'remote', client_greenleaf, 'open', 'active', 'devops-engineer-greenleaf', demo_user_id, demo_user_id, NOW() - INTERVAL '10 days'),
  (job_datasci, demo_org_id, 'Data Scientist', 'We need a Data Scientist to build predictive models for customer behavior analytics. You will work with large datasets, develop ML pipelines, and present insights to stakeholders. Python, SQL, and ML framework experience required.', 'Seattle, WA', 'full-time', 'Data Science', '$145,000 - $180,000', 'senior', 'hybrid', client_bluewave, 'open', 'active', 'data-scientist-bluewave', demo_user_id, demo_user_id, NOW() - INTERVAL '7 days'),
  (job_frontend, demo_org_id, 'Frontend Developer', 'Build beautiful, responsive interfaces for our healthcare platform using React and TypeScript. Strong focus on accessibility and performance. Experience with design systems preferred.', 'Remote', 'full-time', 'Engineering', '$120,000 - $150,000', 'mid', 'remote', client_nova, 'open', 'active', 'frontend-dev-nova', demo_user_id, demo_user_id, NOW() - INTERVAL '5 days'),
  (job_marketing, demo_org_id, 'Marketing Manager', 'Lead our B2B marketing efforts including content strategy, demand generation, and event marketing. Experience with marketing automation tools and SaaS marketing required.', 'New York, NY', 'full-time', 'Marketing', '$100,000 - $130,000', 'mid', 'hybrid', client_summit, 'draft', 'active', NULL, demo_user_id, demo_user_id, NULL),
  (job_sales, demo_org_id, 'Account Executive', 'Drive new business development for our analytics platform. Manage the full sales cycle from prospecting to close. Experience selling SaaS to enterprise clients required. Base + commission.', 'Seattle, WA', 'full-time', 'Sales', '$90,000 - $120,000 + Commission', 'mid', 'hybrid', client_bluewave, 'closed', 'active', 'account-exec-bluewave', demo_user_id, demo_user_id, NOW() - INTERVAL '60 days')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  status = EXCLUDED.status,
  description = EXCLUDED.description;

-- ============================================================
-- 6. PIPELINE COLUMNS (5 stages per job)
-- ============================================================
-- Delete existing demo pipeline columns to avoid duplicates
DELETE FROM pipeline_columns WHERE org_id = demo_org_id AND id IN (
  pc_swe_1, pc_swe_2, pc_swe_3, pc_swe_4, pc_swe_5,
  pc_pm_1, pc_pm_2, pc_pm_3, pc_pm_4, pc_pm_5,
  pc_des_1, pc_des_2, pc_des_3, pc_des_4, pc_des_5,
  pc_devops_1, pc_devops_2, pc_devops_3, pc_devops_4, pc_devops_5,
  pc_ds_1, pc_ds_2, pc_ds_3, pc_ds_4, pc_ds_5,
  pc_fe_1, pc_fe_2, pc_fe_3, pc_fe_4, pc_fe_5,
  pc_mkt_1, pc_mkt_2, pc_mkt_3, pc_mkt_4, pc_mkt_5,
  pc_sales_1, pc_sales_2, pc_sales_3, pc_sales_4, pc_sales_5
);

INSERT INTO pipeline_columns (id, org_id, job_id, title, position) VALUES
  -- Sr Software Engineer pipeline
  (pc_swe_1, demo_org_id, job_swe, 'Applied', 0),
  (pc_swe_2, demo_org_id, job_swe, 'Phone Screen', 1),
  (pc_swe_3, demo_org_id, job_swe, 'Technical Interview', 2),
  (pc_swe_4, demo_org_id, job_swe, 'Final Round', 3),
  (pc_swe_5, demo_org_id, job_swe, 'Offer', 4),
  -- Product Manager pipeline
  (pc_pm_1, demo_org_id, job_pm, 'Applied', 0),
  (pc_pm_2, demo_org_id, job_pm, 'Phone Screen', 1),
  (pc_pm_3, demo_org_id, job_pm, 'Case Study', 2),
  (pc_pm_4, demo_org_id, job_pm, 'Panel Interview', 3),
  (pc_pm_5, demo_org_id, job_pm, 'Offer', 4),
  -- UX Designer pipeline
  (pc_des_1, demo_org_id, job_designer, 'Applied', 0),
  (pc_des_2, demo_org_id, job_designer, 'Portfolio Review', 1),
  (pc_des_3, demo_org_id, job_designer, 'Design Challenge', 2),
  (pc_des_4, demo_org_id, job_designer, 'Team Interview', 3),
  (pc_des_5, demo_org_id, job_designer, 'Offer', 4),
  -- DevOps pipeline
  (pc_devops_1, demo_org_id, job_devops, 'Applied', 0),
  (pc_devops_2, demo_org_id, job_devops, 'Recruiter Screen', 1),
  (pc_devops_3, demo_org_id, job_devops, 'Technical Assessment', 2),
  (pc_devops_4, demo_org_id, job_devops, 'Hiring Manager Interview', 3),
  (pc_devops_5, demo_org_id, job_devops, 'Offer', 4),
  -- Data Scientist pipeline
  (pc_ds_1, demo_org_id, job_datasci, 'Applied', 0),
  (pc_ds_2, demo_org_id, job_datasci, 'Phone Screen', 1),
  (pc_ds_3, demo_org_id, job_datasci, 'Take-Home Project', 2),
  (pc_ds_4, demo_org_id, job_datasci, 'On-site Presentation', 3),
  (pc_ds_5, demo_org_id, job_datasci, 'Offer', 4),
  -- Frontend Developer pipeline
  (pc_fe_1, demo_org_id, job_frontend, 'Applied', 0),
  (pc_fe_2, demo_org_id, job_frontend, 'Phone Screen', 1),
  (pc_fe_3, demo_org_id, job_frontend, 'Coding Challenge', 2),
  (pc_fe_4, demo_org_id, job_frontend, 'Team Fit Interview', 3),
  (pc_fe_5, demo_org_id, job_frontend, 'Offer', 4),
  -- Marketing Manager pipeline
  (pc_mkt_1, demo_org_id, job_marketing, 'Applied', 0),
  (pc_mkt_2, demo_org_id, job_marketing, 'Phone Screen', 1),
  (pc_mkt_3, demo_org_id, job_marketing, 'Campaign Review', 2),
  (pc_mkt_4, demo_org_id, job_marketing, 'Leadership Interview', 3),
  (pc_mkt_5, demo_org_id, job_marketing, 'Offer', 4),
  -- Account Executive pipeline
  (pc_sales_1, demo_org_id, job_sales, 'Applied', 0),
  (pc_sales_2, demo_org_id, job_sales, 'Phone Screen', 1),
  (pc_sales_3, demo_org_id, job_sales, 'Role Play', 2),
  (pc_sales_4, demo_org_id, job_sales, 'VP Interview', 3),
  (pc_sales_5, demo_org_id, job_sales, 'Offer', 4);

-- ============================================================
-- 7. CANDIDATES (25 realistic candidates)
-- ============================================================
INSERT INTO candidates (id, org_id, name, email, phone, status, created_by, resume_parsed, skills, experience_level, total_years_experience, education, summary, source, current_title, linkedin_url, rating, created_at) VALUES
  (cand_01, demo_org_id, 'Emily Zhang', 'emily.zhang@example.com', '(415) 555-1001', 'active', demo_user_id, true, ARRAY['Python','Java','AWS','Kubernetes','PostgreSQL','Microservices'], 'senior', 8, 'M.S. Computer Science, Stanford University', 'Full-stack engineer with 8 years of experience building distributed systems at scale. Led migration of monolithic services to microservices architecture serving 10M+ users.', 'LinkedIn', 'Senior Software Engineer', 'https://linkedin.com/in/emilyzhang', 5, NOW() - INTERVAL '28 days'),
  (cand_02, demo_org_id, 'Marcus Johnson', 'marcus.j@example.com', '(617) 555-1002', 'active', demo_user_id, true, ARRAY['Product Management','Agile','JIRA','SQL','User Research','Roadmapping'], 'mid', 5, 'MBA, Harvard Business School', 'Product manager with healthcare SaaS background. Shipped 3 products from 0-to-1 at Series B startups. Passionate about improving patient outcomes through technology.', 'Referral', 'Product Manager', 'https://linkedin.com/in/marcusjohnson', 4, NOW() - INTERVAL '20 days'),
  (cand_03, demo_org_id, 'Priya Sharma', 'priya.s@example.com', '(212) 555-1003', 'active', demo_user_id, true, ARRAY['Figma','Sketch','React','CSS','Design Systems','User Testing'], 'mid', 6, 'B.F.A. Interaction Design, SVA', 'UX designer specializing in data visualization and financial dashboards. Portfolio includes work for 3 Fortune 500 fintech companies. Accessibility advocate.', 'Portfolio', 'Senior UX Designer', 'https://linkedin.com/in/priyasharma', 5, NOW() - INTERVAL '12 days'),
  (cand_04, demo_org_id, 'David Kim', 'david.kim@example.com', '(512) 555-1004', 'active', demo_user_id, true, ARRAY['AWS','Terraform','Docker','Kubernetes','CI/CD','Linux','Ansible'], 'senior', 10, 'B.S. Computer Engineering, UT Austin', 'DevOps engineer with 10 years of experience. Built infrastructure for energy sector applications with 99.99% uptime. Security clearance eligible.', 'Indeed', 'Lead DevOps Engineer', 'https://linkedin.com/in/davidkim', 4, NOW() - INTERVAL '9 days'),
  (cand_05, demo_org_id, 'Sophia Rodriguez', 'sophia.r@example.com', '(206) 555-1005', 'active', demo_user_id, true, ARRAY['Python','R','TensorFlow','PyTorch','SQL','Spark','ML Ops'], 'senior', 7, 'Ph.D. Statistics, University of Washington', 'Data scientist with expertise in predictive modeling and NLP. Published 5 papers on customer behavior analytics. Previously at Amazon and Tableau.', 'LinkedIn', 'Senior Data Scientist', 'https://linkedin.com/in/sophiarodriguez', 5, NOW() - INTERVAL '6 days'),
  (cand_06, demo_org_id, 'James Chen', 'james.c@example.com', '(415) 555-1006', 'active', demo_user_id, true, ARRAY['TypeScript','React','Node.js','GraphQL','PostgreSQL','Redis'], 'mid', 5, 'B.S. Computer Science, UC Berkeley', 'Full-stack developer focused on React and Node.js. Built real-time collaboration tools at a Series C startup. Open source contributor.', 'GitHub', 'Software Engineer', 'https://linkedin.com/in/jameschen', 3, NOW() - INTERVAL '27 days'),
  (cand_07, demo_org_id, 'Aisha Williams', 'aisha.w@example.com', '(617) 555-1007', 'active', demo_user_id, true, ARRAY['Product Strategy','Data Analytics','A/B Testing','SQL','Tableau','Stakeholder Management'], 'senior', 9, 'M.S. Health Informatics, MIT', 'Senior PM with 9 years in healthtech. Led platform products handling 500K+ patient interactions monthly. Strong clinical stakeholder relationships.', 'LinkedIn', 'Director of Product', 'https://linkedin.com/in/aishawilliams', 4, NOW() - INTERVAL '18 days'),
  (cand_08, demo_org_id, 'Ryan O''Brien', 'ryan.o@example.com', '(312) 555-1008', 'active', demo_user_id, true, ARRAY['React','TypeScript','CSS','Tailwind','Jest','Cypress','Accessibility'], 'mid', 4, 'B.S. Computer Science, Northwestern University', 'Frontend developer passionate about accessibility and performance. Built component libraries used by 50+ engineers. WCAG 2.1 AA certified.', 'Job Board', 'Frontend Engineer', 'https://linkedin.com/in/ryanobrien', 4, NOW() - INTERVAL '4 days'),
  (cand_09, demo_org_id, 'Nina Patel', 'nina.p@example.com', '(206) 555-1009', 'active', demo_user_id, true, ARRAY['Python','SQL','Tableau','Machine Learning','Statistics','A/B Testing'], 'mid', 4, 'M.S. Data Science, Columbia University', 'Data analyst transitioning to data science. Strong foundation in statistical modeling and experiment design. Published research on recommendation systems.', 'University', 'Data Analyst', 'https://linkedin.com/in/ninapatel', 3, NOW() - INTERVAL '5 days'),
  (cand_10, demo_org_id, 'Carlos Mendez', 'carlos.m@example.com', '(512) 555-1010', 'active', demo_user_id, true, ARRAY['AWS','GCP','Docker','Jenkins','Prometheus','Grafana','Python'], 'mid', 6, 'B.S. Information Systems, Texas A&M', 'DevOps engineer experienced in multi-cloud environments. Reduced deployment time by 70% at previous role. Strong monitoring and observability skills.', 'Referral', 'DevOps Engineer', 'https://linkedin.com/in/carlosmendez', 3, NOW() - INTERVAL '8 days'),
  (cand_11, demo_org_id, 'Lauren Mitchell', 'lauren.m@example.com', '(415) 555-1011', 'active', demo_user_id, true, ARRAY['Java','Spring Boot','AWS','Microservices','Kafka','MongoDB'], 'senior', 12, 'M.S. Software Engineering, Carnegie Mellon', 'Principal engineer with 12 years building enterprise platforms. Architecture lead at 2 unicorn startups. Mentor and tech lead.', 'Headhunted', 'Principal Engineer', 'https://linkedin.com/in/laurenmitchell', 5, NOW() - INTERVAL '25 days'),
  (cand_12, demo_org_id, 'Tyler Brooks', 'tyler.b@example.com', '(212) 555-1012', 'active', demo_user_id, true, ARRAY['UI Design','Prototyping','Figma','Adobe XD','Motion Design','HTML/CSS'], 'entry', 2, 'B.A. Digital Design, Parsons School of Design', 'Junior designer with a strong eye for visual design and motion graphics. Won 2 student design awards. Eager to grow in fintech.', 'Portfolio', 'Junior Designer', 'https://linkedin.com/in/tylerbrooks', 3, NOW() - INTERVAL '11 days'),
  (cand_13, demo_org_id, 'Jessica Taylor', 'jessica.t@example.com', '(617) 555-1013', 'active', demo_user_id, true, ARRAY['React','Vue.js','TypeScript','Node.js','PostgreSQL','GraphQL'], 'mid', 5, 'B.S. Computer Science, Georgia Tech', 'Versatile engineer comfortable across the stack. Led frontend rewrite that improved page load times by 60%. Strong communicator.', 'LinkedIn', 'Software Engineer', 'https://linkedin.com/in/jessicataylor', 4, NOW() - INTERVAL '3 days'),
  (cand_14, demo_org_id, 'Robert Park', 'robert.p@example.com', '(206) 555-1014', 'active', demo_user_id, true, ARRAY['Python','Scikit-learn','Deep Learning','NLP','Computer Vision','AWS SageMaker'], 'senior', 8, 'Ph.D. Machine Learning, CMU', 'ML engineer specializing in NLP and recommendation systems. Deployed models serving 100M+ predictions daily. 10 patents in AI.', 'Conference', 'Staff ML Engineer', 'https://linkedin.com/in/robertpark', 5, NOW() - INTERVAL '4 days'),
  (cand_15, demo_org_id, 'Amanda Foster', 'amanda.f@example.com', '(512) 555-1015', 'active', demo_user_id, true, ARRAY['Linux','Networking','Security','Terraform','Ansible','Bash','Python'], 'mid', 5, 'B.S. Cybersecurity, University of Maryland', 'Infrastructure engineer with security focus. CISSP certified. Experience with FedRAMP and SOC2 compliance. Clean energy sector experience.', 'Indeed', 'Infrastructure Engineer', 'https://linkedin.com/in/amandafoster', 4, NOW() - INTERVAL '7 days'),
  (cand_16, demo_org_id, 'Daniel Rivera', 'daniel.r@example.com', '(415) 555-1016', 'active', demo_user_id, true, ARRAY['Go','Rust','C++','Distributed Systems','gRPC','Protocol Buffers'], 'senior', 9, 'M.S. Computer Science, MIT', 'Systems engineer specializing in high-performance computing. Built real-time trading systems processing 1M+ events/second.', 'Referral', 'Staff Software Engineer', 'https://linkedin.com/in/danielrivera', 4, NOW() - INTERVAL '26 days'),
  (cand_17, demo_org_id, 'Megan Liu', 'megan.l@example.com', '(617) 555-1017', 'active', demo_user_id, true, ARRAY['Product Analytics','SQL','Python','Amplitude','Mixpanel','User Research'], 'entry', 2, 'B.S. Business Analytics, NYU Stern', 'Early-career PM with analytics background. Completed APM program at Google. Passionate about healthcare technology and digital health.', 'Campus', 'Associate Product Manager', 'https://linkedin.com/in/meganliu', 3, NOW() - INTERVAL '19 days'),
  (cand_18, demo_org_id, 'Brandon Scott', 'brandon.s@example.com', '(212) 555-1018', 'active', demo_user_id, true, ARRAY['Content Strategy','SEO','HubSpot','Salesforce','Google Analytics','Marketing Automation'], 'mid', 6, 'B.A. Marketing, Boston University', 'B2B marketing manager who grew pipeline by 200% at a fintech startup. Strong in demand generation and content marketing. HubSpot certified.', 'LinkedIn', 'Marketing Manager', 'https://linkedin.com/in/brandonscott', 4, NOW() - INTERVAL '15 days'),
  (cand_19, demo_org_id, 'Katherine Hughes', 'katherine.h@example.com', '(206) 555-1019', 'active', demo_user_id, true, ARRAY['Enterprise Sales','Salesforce','Solution Selling','SaaS','Contract Negotiation'], 'mid', 7, 'B.A. Communications, University of Michigan', 'Account executive who consistently hits 120%+ of quota. Closed $3M+ in ARR last year selling analytics SaaS to Fortune 500.', 'Referral', 'Senior Account Executive', 'https://linkedin.com/in/katherinehughes', 4, NOW() - INTERVAL '55 days'),
  (cand_20, demo_org_id, 'Omar Hassan', 'omar.h@example.com', '(312) 555-1020', 'active', demo_user_id, true, ARRAY['React Native','Flutter','Swift','Kotlin','Firebase','REST APIs'], 'mid', 5, 'B.S. Computer Science, UIUC', 'Mobile developer with cross-platform expertise. Shipped 4 apps with 100K+ downloads. Strong UI/UX sensibility.', 'Job Board', 'Mobile Developer', 'https://linkedin.com/in/omarhassan', 3, NOW() - INTERVAL '2 days'),
  (cand_21, demo_org_id, 'Rachel Green', 'rachel.g@example.com', '(415) 555-1021', 'active', demo_user_id, true, ARRAY['Python','Django','FastAPI','PostgreSQL','Redis','Celery','Docker'], 'mid', 4, 'B.S. Computer Science, UCLA', 'Backend developer with strong Python skills. Built APIs handling 50K requests/minute. Contributed to Django REST Framework.', 'GitHub', 'Backend Developer', 'https://linkedin.com/in/rachelgreen', 3, NOW() - INTERVAL '24 days'),
  (cand_22, demo_org_id, 'Chris Anderson', 'chris.a@example.com', '(617) 555-1022', 'active', demo_user_id, true, ARRAY['Scrum','Kanban','JIRA','Confluence','Stakeholder Management','Risk Analysis'], 'mid', 6, 'MBA, Wharton School of Business', 'Technical PM with engineering background. Managed cross-functional teams of 15+. Experience in healthcare compliance and HIPAA.', 'LinkedIn', 'Technical Program Manager', 'https://linkedin.com/in/chrisanderson', 4, NOW() - INTERVAL '16 days'),
  (cand_23, demo_org_id, 'Samantha Lee', 'samantha.l@example.com', '(206) 555-1023', 'active', demo_user_id, true, ARRAY['Data Engineering','Spark','Airflow','dbt','Snowflake','Python','SQL'], 'senior', 7, 'M.S. Data Engineering, University of Michigan', 'Data engineer who built ETL pipelines processing 10TB+ daily. Experience with modern data stack. Previously at Spotify and Uber.', 'Conference', 'Senior Data Engineer', 'https://linkedin.com/in/samanthalee', 4, NOW() - INTERVAL '3 days'),
  (cand_24, demo_org_id, 'Kevin Wang', 'kevin.w@example.com', '(512) 555-1024', 'active', demo_user_id, true, ARRAY['SaaS Sales','Cold Outreach','Pipedrive','Demo Presentations','Negotiation'], 'entry', 2, 'B.B.A. Sales, University of Texas', 'Early-career sales rep with high energy and strong work ethic. Hit 150% of ramp quota in first year. Eager to grow into enterprise sales.', 'Campus', 'Sales Development Rep', 'https://linkedin.com/in/kevinwang', 3, NOW() - INTERVAL '50 days'),
  (cand_25, demo_org_id, 'Michelle Davis', 'michelle.d@example.com', '(212) 555-1025', 'active', demo_user_id, true, ARRAY['UX Research','Usability Testing','Figma','Miro','Survey Design','Analytics'], 'mid', 5, 'M.A. Human-Computer Interaction, Carnegie Mellon', 'UX researcher with quantitative and qualitative expertise. Led research that increased conversion rates by 35% at fintech startup.', 'LinkedIn', 'UX Researcher', 'https://linkedin.com/in/michelledavis', 4, NOW() - INTERVAL '10 days')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  skills = EXCLUDED.skills,
  summary = EXCLUDED.summary,
  status = EXCLUDED.status;

-- ============================================================
-- 8. JOB-CANDIDATE ASSIGNMENTS (35 placements across pipeline stages)
-- ============================================================
-- Clean up existing demo job-candidates first
DELETE FROM candidate_notes WHERE org_id = demo_org_id AND job_candidate_id IN (
  jc_01,jc_02,jc_03,jc_04,jc_05,jc_06,jc_07,jc_08,jc_09,jc_10,
  jc_11,jc_12,jc_13,jc_14,jc_15,jc_16,jc_17,jc_18,jc_19,jc_20,
  jc_21,jc_22,jc_23,jc_24,jc_25,jc_26,jc_27,jc_28,jc_29,jc_30,
  jc_31,jc_32,jc_33,jc_34,jc_35
);

DELETE FROM job_candidate WHERE org_id = demo_org_id AND id IN (
  jc_01,jc_02,jc_03,jc_04,jc_05,jc_06,jc_07,jc_08,jc_09,jc_10,
  jc_11,jc_12,jc_13,jc_14,jc_15,jc_16,jc_17,jc_18,jc_19,jc_20,
  jc_21,jc_22,jc_23,jc_24,jc_25,jc_26,jc_27,jc_28,jc_29,jc_30,
  jc_31,jc_32,jc_33,jc_34,jc_35
);

INSERT INTO job_candidate (id, org_id, job_id, candidate_id, pipeline_column_id, stage, notes, assigned_to, status, source, created_at) VALUES
  -- Sr Software Engineer (5 candidates spread across stages)
  (jc_01, demo_org_id, job_swe, cand_01, pc_swe_4, 'final', 'Excellent system design interview. Strong cultural fit.', demo_user_id, 'active', 'LinkedIn', NOW() - INTERVAL '25 days'),
  (jc_02, demo_org_id, job_swe, cand_06, pc_swe_3, 'technical', 'Solid coding skills. Scheduling final round.', demo_user_id, 'active', 'GitHub', NOW() - INTERVAL '22 days'),
  (jc_03, demo_org_id, job_swe, cand_11, pc_swe_5, 'offer', 'Offer extended at $185K. Awaiting response.', demo_user_id, 'active', 'Headhunted', NOW() - INTERVAL '20 days'),
  (jc_04, demo_org_id, job_swe, cand_16, pc_swe_2, 'phone_screen', 'Phone screen went well. Moving to technical.', demo_user_id, 'active', 'Referral', NOW() - INTERVAL '15 days'),
  (jc_05, demo_org_id, job_swe, cand_21, pc_swe_1, 'applied', 'New application. Strong Python background.', demo_user_id, 'active', 'Job Board', NOW() - INTERVAL '10 days'),

  -- Product Manager (5 candidates)
  (jc_06, demo_org_id, job_pm, cand_02, pc_pm_3, 'technical', 'Case study presentation was outstanding.', demo_user_id, 'active', 'Referral', NOW() - INTERVAL '18 days'),
  (jc_07, demo_org_id, job_pm, cand_07, pc_pm_4, 'final', 'Panel loved her healthtech expertise.', demo_user_id, 'active', 'LinkedIn', NOW() - INTERVAL '16 days'),
  (jc_08, demo_org_id, job_pm, cand_17, pc_pm_2, 'phone_screen', 'Good energy. Needs more senior-level examples.', demo_user_id, 'active', 'Campus', NOW() - INTERVAL '14 days'),
  (jc_09, demo_org_id, job_pm, cand_22, pc_pm_1, 'applied', 'Interesting background. Review resume.', demo_user_id, 'active', 'LinkedIn', NOW() - INTERVAL '12 days'),
  (jc_10, demo_org_id, job_pm, cand_13, pc_pm_2, 'phone_screen', 'Engineering background could be a plus.', demo_user_id, 'active', 'LinkedIn', NOW() - INTERVAL '10 days'),

  -- UX Designer (4 candidates)
  (jc_11, demo_org_id, job_designer, cand_03, pc_des_4, 'final', 'Portfolio is exceptional. Team interview next.', demo_user_id, 'active', 'Portfolio', NOW() - INTERVAL '10 days'),
  (jc_12, demo_org_id, job_designer, cand_12, pc_des_2, 'phone_screen', 'Junior but shows great potential. Design challenge assigned.', demo_user_id, 'active', 'Portfolio', NOW() - INTERVAL '8 days'),
  (jc_13, demo_org_id, job_designer, cand_25, pc_des_3, 'technical', 'UX research skills are strong for this role.', demo_user_id, 'active', 'LinkedIn', NOW() - INTERVAL '6 days'),
  (jc_14, demo_org_id, job_designer, cand_20, pc_des_1, 'applied', 'Mobile design focus could bring fresh perspective.', demo_user_id, 'active', 'Job Board', NOW() - INTERVAL '2 days'),

  -- DevOps Engineer (4 candidates)
  (jc_15, demo_org_id, job_devops, cand_04, pc_devops_4, 'final', 'Perfect fit. 10 yrs experience, security clearance eligible.', demo_user_id, 'active', 'Indeed', NOW() - INTERVAL '7 days'),
  (jc_16, demo_org_id, job_devops, cand_10, pc_devops_3, 'technical', 'Multi-cloud experience is valuable.', demo_user_id, 'active', 'Referral', NOW() - INTERVAL '6 days'),
  (jc_17, demo_org_id, job_devops, cand_15, pc_devops_2, 'phone_screen', 'Security focus aligns well with GreenLeaf needs.', demo_user_id, 'active', 'Indeed', NOW() - INTERVAL '5 days'),
  (jc_18, demo_org_id, job_devops, cand_21, pc_devops_1, 'applied', 'Backend skills could transfer well to DevOps.', demo_user_id, 'active', 'Job Board', NOW() - INTERVAL '3 days'),

  -- Data Scientist (5 candidates)
  (jc_19, demo_org_id, job_datasci, cand_05, pc_ds_4, 'final', 'Presentation was brilliant. PhD from UW is a plus.', demo_user_id, 'active', 'LinkedIn', NOW() - INTERVAL '5 days'),
  (jc_20, demo_org_id, job_datasci, cand_14, pc_ds_3, 'technical', 'Take-home project results were impressive.', demo_user_id, 'active', 'Conference', NOW() - INTERVAL '3 days'),
  (jc_21, demo_org_id, job_datasci, cand_09, pc_ds_2, 'phone_screen', 'Transitioning from analyst. Strong stats foundation.', demo_user_id, 'active', 'University', NOW() - INTERVAL '4 days'),
  (jc_22, demo_org_id, job_datasci, cand_23, pc_ds_1, 'applied', 'Data engineering background could be complementary.', demo_user_id, 'active', 'Conference', NOW() - INTERVAL '2 days'),
  (jc_23, demo_org_id, job_datasci, cand_08, pc_ds_1, 'applied', 'Frontend background unusual but has Python/data skills.', demo_user_id, 'active', 'Job Board', NOW() - INTERVAL '1 day'),

  -- Frontend Developer (4 candidates)
  (jc_24, demo_org_id, job_frontend, cand_08, pc_fe_3, 'technical', 'Accessibility expertise is exactly what we need.', demo_user_id, 'active', 'Job Board', NOW() - INTERVAL '3 days'),
  (jc_25, demo_org_id, job_frontend, cand_13, pc_fe_2, 'phone_screen', 'Strong React skills. Scheduling coding challenge.', demo_user_id, 'active', 'LinkedIn', NOW() - INTERVAL '2 days'),
  (jc_26, demo_org_id, job_frontend, cand_20, pc_fe_1, 'applied', 'Mobile-first approach. React Native experience.', demo_user_id, 'active', 'Job Board', NOW() - INTERVAL '1 day'),
  (jc_27, demo_org_id, job_frontend, cand_06, pc_fe_4, 'final', 'Great coding challenge results. Team loved him.', demo_user_id, 'active', 'GitHub', NOW() - INTERVAL '2 days'),

  -- Marketing Manager (3 candidates)
  (jc_28, demo_org_id, job_marketing, cand_18, pc_mkt_2, 'phone_screen', 'Strong B2B SaaS marketing background.', demo_user_id, 'active', 'LinkedIn', NOW() - INTERVAL '10 days'),
  (jc_29, demo_org_id, job_marketing, cand_02, pc_mkt_1, 'applied', 'PM with marketing strategy interest. Unconventional.', demo_user_id, 'active', 'Internal', NOW() - INTERVAL '8 days'),
  (jc_30, demo_org_id, job_marketing, cand_17, pc_mkt_1, 'applied', 'Analytics background good for growth marketing.', demo_user_id, 'active', 'Campus', NOW() - INTERVAL '5 days'),

  -- Account Executive - closed role (5 candidates, various outcomes)
  (jc_31, demo_org_id, job_sales, cand_19, pc_sales_5, 'hired', 'Offer accepted! Start date March 3.', demo_user_id, 'active', 'Referral', NOW() - INTERVAL '50 days'),
  (jc_32, demo_org_id, job_sales, cand_24, pc_sales_4, 'rejected', 'Good but too junior for enterprise accounts.', demo_user_id, 'active', 'Campus', NOW() - INTERVAL '45 days'),
  (jc_33, demo_org_id, job_sales, cand_18, pc_sales_3, 'rejected', 'Marketing background not aligned with sales role.', demo_user_id, 'active', 'LinkedIn', NOW() - INTERVAL '40 days'),
  (jc_34, demo_org_id, job_sales, cand_22, pc_sales_2, 'rejected', 'Withdrew - accepted another offer.', demo_user_id, 'active', 'LinkedIn', NOW() - INTERVAL '48 days'),
  (jc_35, demo_org_id, job_sales, cand_07, pc_sales_1, 'rejected', 'Overqualified for this role. Redirected to PM.', demo_user_id, 'active', 'Internal', NOW() - INTERVAL '52 days');

-- ============================================================
-- 9. CANDIDATE NOTES
-- ============================================================
INSERT INTO candidate_notes (org_id, job_candidate_id, author_id, content, is_private, created_at) VALUES
  (demo_org_id, jc_01, demo_user_id, 'Emily demonstrated exceptional knowledge of distributed systems during the system design round. Her experience at scale is exactly what Acme needs.', false, NOW() - INTERVAL '20 days'),
  (demo_org_id, jc_01, demo_user_id, 'Salary expectation is $185K. Within budget. Confirm with hiring manager.', true, NOW() - INTERVAL '18 days'),
  (demo_org_id, jc_03, demo_user_id, 'Lauren is a strong hire. She can mentor the junior team members. Extending offer at $185K base + equity.', false, NOW() - INTERVAL '15 days'),
  (demo_org_id, jc_06, demo_user_id, 'Marcus presented a compelling case study on improving patient engagement metrics by 40%. The team was impressed.', false, NOW() - INTERVAL '14 days'),
  (demo_org_id, jc_07, demo_user_id, 'Aisha has exactly the healthtech domain expertise Nova needs. Her experience with HIPAA compliance is a huge plus.', false, NOW() - INTERVAL '12 days'),
  (demo_org_id, jc_11, demo_user_id, 'Priya''s portfolio is outstanding. Her fintech dashboard redesign case study directly applies to Summit''s needs.', false, NOW() - INTERVAL '8 days'),
  (demo_org_id, jc_15, demo_user_id, 'David checked all the boxes - AWS expertise, Terraform, and security clearance eligibility. GreenLeaf will love him.', false, NOW() - INTERVAL '5 days'),
  (demo_org_id, jc_19, demo_user_id, 'Sophia''s on-site presentation on predictive customer churn modeling blew everyone away. Top candidate.', false, NOW() - INTERVAL '3 days'),
  (demo_org_id, jc_24, demo_user_id, 'Ryan''s accessibility-first approach to frontend development is exactly what the healthcare platform needs.', false, NOW() - INTERVAL '2 days'),
  (demo_org_id, jc_31, demo_user_id, 'Katherine accepted! She will be a great addition to the BlueWave sales team. Onboarding March 3.', false, NOW() - INTERVAL '45 days');

-- ============================================================
-- 10. MESSAGES (team communication samples)
-- ============================================================
DELETE FROM messages WHERE org_id = demo_org_id AND id IN (msg_01, msg_02, msg_03, msg_04, msg_05, msg_06);

INSERT INTO messages (id, org_id, type, priority, subject, content, sender_id, recipient_id, is_read, created_at) VALUES
  (msg_01, demo_org_id, 'team', 'high', 'Urgent: Acme Tech Sr SWE - Offer Decision', 'Lauren Mitchell has a competing offer expiring Friday. We need to finalize our package ASAP. Recommended: $185K base + 0.1% equity. She is our top pick and losing her would set us back 3-4 weeks.', demo_user_id, demo_user_id, true, NOW() - INTERVAL '3 days'),
  (msg_02, demo_org_id, 'team', 'normal', 'Weekly Pipeline Review Notes', 'Quick summary from this week: 6 new candidates sourced, 4 phone screens completed, 2 candidates advancing to final rounds. Our time-to-fill is trending down to 28 days avg. Great work team!', demo_user_id, demo_user_id, true, NOW() - INTERVAL '5 days'),
  (msg_03, demo_org_id, 'client', 'normal', 'BlueWave Analytics - Data Scientist Shortlist', 'Hi Ryan, Attached is our shortlist of 3 candidates for the Data Scientist role. Sophia Rodriguez (PhD, UW) is our top recommendation. She has exactly the predictive modeling and NLP experience you described. Can we schedule presentations for next week?', demo_user_id, demo_user_id, true, NOW() - INTERVAL '4 days'),
  (msg_04, demo_org_id, 'team', 'normal', 'Nova Healthcare - New Frontend Dev Req', 'Nova just opened a new Frontend Developer position. Remote-friendly, React/TypeScript focused. I have 3 candidates from our existing pool who could be a fit. Will review and submit by EOD tomorrow.', demo_user_id, demo_user_id, false, NOW() - INTERVAL '2 days'),
  (msg_05, demo_org_id, 'candidate', 'normal', 'Interview Prep - Emily Zhang', 'Emily, Great news! You have been selected for the final round interview with Acme Technologies. The interview will be a 90-minute session with the VP of Engineering and CTO. I will send calendar details shortly.', demo_user_id, demo_user_id, true, NOW() - INTERVAL '6 days'),
  (msg_06, demo_org_id, 'team', 'high', 'GreenLeaf DevOps - Client Feedback', 'Lisa from GreenLeaf just called. She is very impressed with David Kim''s background and wants to fast-track him to a final interview. They also want to see Amanda Foster for a secondary conversation. Both candidates have security clearance eligibility which is key.', demo_user_id, demo_user_id, false, NOW() - INTERVAL '1 day');

-- ============================================================
-- 11. INTERVIEWS
-- ============================================================
DELETE FROM interviews WHERE org_id = demo_org_id AND id IN (int_01, int_02, int_03, int_04, int_05, int_06);

INSERT INTO interviews (id, org_id, job_candidate_id, title, type, status, scheduled_at, duration, location, interviewer_id, notes) VALUES
  (int_01, demo_org_id, jc_01, 'Final Round - Emily Zhang / VP Engineering', 'in_person', 'scheduled', NOW() + INTERVAL '2 days', '90', 'Acme Technologies HQ, SF', demo_user_id, 'System design deep-dive + leadership discussion with VP Eng and CTO'),
  (int_02, demo_org_id, jc_07, 'Panel Interview - Aisha Williams', 'video', 'scheduled', NOW() + INTERVAL '3 days', '60', 'Google Meet', demo_user_id, 'Panel: VP Product, Engineering Lead, Clinical Director'),
  (int_03, demo_org_id, jc_11, 'Team Interview - Priya Sharma', 'video', 'scheduled', NOW() + INTERVAL '1 day', '45', 'Zoom', demo_user_id, 'Meet the design team. Culture fit and collaboration assessment.'),
  (int_04, demo_org_id, jc_15, 'Hiring Manager - David Kim / DevOps', 'video', 'scheduled', NOW() + INTERVAL '4 days', '60', 'Google Meet', demo_user_id, 'Final technical discussion with VP Infrastructure at GreenLeaf'),
  (int_05, demo_org_id, jc_19, 'On-site Presentation - Sophia Rodriguez', 'in_person', 'completed', NOW() - INTERVAL '2 days', '120', 'BlueWave Analytics, Seattle', demo_user_id, 'Presented predictive churn model. Team was very impressed. Moving to offer.'),
  (int_06, demo_org_id, jc_24, 'Coding Challenge Review - Ryan O''Brien', 'video', 'completed', NOW() - INTERVAL '1 day', '60', 'Google Meet', demo_user_id, 'Reviewed accessibility-focused component library. Strong TypeScript and testing skills demonstrated.');

-- ============================================================
-- 12. ORGANIZATION BRANDING
-- ============================================================
INSERT INTO organization_branding (org_id, channel, primary_color, secondary_color, accent_color, font_family, header_text, footer_text, is_published)
VALUES (
  demo_org_id,
  'careers',
  '#0EA5E9',
  '#1E3A5F',
  '#14B8A6',
  'Inter',
  'Join Our Growing Team',
  'TalentPatriot Demo Agency is an equal opportunity employer.',
  true
)
ON CONFLICT ON CONSTRAINT unique_org_channel DO UPDATE SET
  primary_color = EXCLUDED.primary_color,
  secondary_color = EXCLUDED.secondary_color,
  header_text = EXCLUDED.header_text,
  is_published = EXCLUDED.is_published;

-- ============================================================
-- 13. CLIENT SUBMISSIONS (sample submissions to clients)
-- ============================================================
INSERT INTO client_submissions (org_id, candidate_id, client_id, job_id, position_title, rate, status, feedback, submitted_at, submitted_by) VALUES
  (demo_org_id, cand_01, client_acme, job_swe, 'Senior Software Engineer', '$185,000/yr', 'interviewing', 'Client impressed with system design experience', NOW() - INTERVAL '20 days', demo_user_id),
  (demo_org_id, cand_11, client_acme, job_swe, 'Senior Software Engineer', '$185,000/yr', 'offer_extended', 'Top candidate. Offer extended.', NOW() - INTERVAL '15 days', demo_user_id),
  (demo_org_id, cand_05, client_bluewave, job_datasci, 'Data Scientist', '$175,000/yr', 'interviewing', 'Excellent PhD background and industry experience', NOW() - INTERVAL '5 days', demo_user_id),
  (demo_org_id, cand_04, client_greenleaf, job_devops, 'DevOps Engineer', '$165,000/yr', 'interviewing', 'Security clearance eligibility is a strong plus', NOW() - INTERVAL '6 days', demo_user_id),
  (demo_org_id, cand_19, client_bluewave, job_sales, 'Account Executive', '$110,000 + commission', 'hired', 'Accepted offer. Start date March 3.', NOW() - INTERVAL '45 days', demo_user_id),
  (demo_org_id, cand_03, client_summit, job_designer, 'UX/UI Designer', '$135,000/yr', 'interviewing', 'Portfolio directly relevant to fintech dashboards', NOW() - INTERVAL '8 days', demo_user_id);

RAISE NOTICE 'Demo data seed completed successfully!';
RAISE NOTICE 'Organization: TalentPatriot Demo Agency';
RAISE NOTICE 'Clients: 5 | Jobs: 8 | Candidates: 25 | Pipeline placements: 35';
RAISE NOTICE 'Messages: 6 | Interviews: 6 | Notes: 10 | Submissions: 6';

END $$;

-- Verify the data
SELECT 'Organizations' AS entity, COUNT(*) AS count FROM organizations WHERE id = '550e8400-e29b-41d4-a716-446655440000'
UNION ALL
SELECT 'Clients', COUNT(*) FROM clients WHERE org_id = '550e8400-e29b-41d4-a716-446655440000'
UNION ALL
SELECT 'Jobs', COUNT(*) FROM jobs WHERE org_id = '550e8400-e29b-41d4-a716-446655440000'
UNION ALL
SELECT 'Candidates', COUNT(*) FROM candidates WHERE org_id = '550e8400-e29b-41d4-a716-446655440000'
UNION ALL
SELECT 'Pipeline Columns', COUNT(*) FROM pipeline_columns WHERE org_id = '550e8400-e29b-41d4-a716-446655440000'
UNION ALL
SELECT 'Job-Candidates', COUNT(*) FROM job_candidate WHERE org_id = '550e8400-e29b-41d4-a716-446655440000'
UNION ALL
SELECT 'Messages', COUNT(*) FROM messages WHERE org_id = '550e8400-e29b-41d4-a716-446655440000'
UNION ALL
SELECT 'Interviews', COUNT(*) FROM interviews WHERE org_id = '550e8400-e29b-41d4-a716-446655440000'
UNION ALL
SELECT 'Submissions', COUNT(*) FROM client_submissions WHERE org_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY entity;
