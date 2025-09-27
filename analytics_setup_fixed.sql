-- ===============================================
-- TalentPatriot ATS - Analytics Setup (FIXED)
-- ===============================================
-- This script creates materialized views, indexes, and helper tables
-- for comprehensive analytics and reporting functionality.
-- 
-- COMPATIBILITY FIX: Simplified syntax for better Supabase compatibility
--
-- INSTRUCTIONS:
-- 1. Copy this entire script
-- 2. Paste it into your Supabase SQL Editor
-- 3. Click "Run" to execute all commands

-- ===============================================
-- 1. REQUIRED EXTENSIONS
-- ===============================================
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ===============================================
-- 2. DROP EXISTING VIEWS (Clean slate)
-- ===============================================
DROP MATERIALIZED VIEW IF EXISTS mv_pipeline_metrics CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_candidate_sources CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_time_to_hire CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_skills_analytics CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_recruiter_performance CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_client_performance CASCADE;

-- ===============================================
-- 3. ANALYTICS HELPER TABLES
-- ===============================================
CREATE TABLE IF NOT EXISTS report_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    report_type VARCHAR(50) NOT NULL,
    frequency VARCHAR(20) NOT NULL,
    format VARCHAR(10) NOT NULL,
    recipients TEXT[] NOT NULL,
    filter_config JSONB DEFAULT '{}'::jsonb,
    enabled BOOLEAN DEFAULT true,
    last_sent TIMESTAMP WITH TIME ZONE,
    next_scheduled TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS report_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    report_type VARCHAR(50) NOT NULL,
    format VARCHAR(10) NOT NULL,
    period VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    file_url TEXT,
    error_message TEXT,
    requested_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS daily_analytics_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    snapshot_date DATE NOT NULL,
    total_jobs INTEGER DEFAULT 0,
    active_jobs INTEGER DEFAULT 0,
    total_candidates INTEGER DEFAULT 0,
    total_applications INTEGER DEFAULT 0,
    applications_today INTEGER DEFAULT 0,
    hires_today INTEGER DEFAULT 0,
    metrics JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(org_id, snapshot_date)
);

-- ===============================================
-- 4. PERFORMANCE INDEXES
-- ===============================================
CREATE INDEX IF NOT EXISTS idx_job_candidate_org_stage ON job_candidate(org_id, stage);
CREATE INDEX IF NOT EXISTS idx_job_candidate_created_at ON job_candidate(created_at);
CREATE INDEX IF NOT EXISTS idx_job_candidate_org_created ON job_candidate(org_id, created_at);
CREATE INDEX IF NOT EXISTS idx_jobs_org_status_created ON jobs(org_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_candidates_org_created ON candidates(org_id, created_at);
CREATE INDEX IF NOT EXISTS idx_application_metadata_org_source ON application_metadata(org_id, application_source);
CREATE INDEX IF NOT EXISTS idx_interviews_org_status ON interviews(org_id, status);
CREATE INDEX IF NOT EXISTS idx_email_events_org_created ON email_events(org_id, sent_at);

-- Skills column optimization
CREATE INDEX IF NOT EXISTS idx_candidates_skills_gin ON candidates USING GIN(skills) 
WHERE skills IS NOT NULL AND array_length(skills, 1) > 0;

-- Index for skill_levels JSON column
CREATE INDEX IF NOT EXISTS idx_candidates_skill_levels_gin ON candidates USING GIN(skill_levels) 
WHERE skill_levels IS NOT NULL;

-- ===============================================
-- 5. MATERIALIZED VIEWS (Simplified FILTER syntax)
-- ===============================================

-- Pipeline Metrics View
CREATE MATERIALIZED VIEW mv_pipeline_metrics AS
SELECT 
    jc.org_id,
    DATE_TRUNC('month', jc.created_at) as period_month,
    COUNT(*) as total_applications,
    COUNT(CASE WHEN jc.stage = 'applied' THEN 1 END) as applied_count,
    COUNT(CASE WHEN jc.stage = 'phone_screen' THEN 1 END) as screening_count,
    COUNT(CASE WHEN jc.stage = 'interview' THEN 1 END) as interview_count,
    COUNT(CASE WHEN jc.stage = 'offer' THEN 1 END) as offer_count,
    COUNT(CASE WHEN jc.stage = 'hired' THEN 1 END) as hired_count,
    COUNT(CASE WHEN jc.stage = 'rejected' THEN 1 END) as rejected_count,
    
    -- Conversion rates
    CASE 
        WHEN COUNT(CASE WHEN jc.stage = 'applied' THEN 1 END) > 0 
        THEN (COUNT(CASE WHEN jc.stage = 'phone_screen' THEN 1 END)::float / COUNT(CASE WHEN jc.stage = 'applied' THEN 1 END)) * 100
        ELSE 0 
    END as applied_to_screening_rate,
    
    CASE 
        WHEN COUNT(CASE WHEN jc.stage = 'phone_screen' THEN 1 END) > 0 
        THEN (COUNT(CASE WHEN jc.stage = 'interview' THEN 1 END)::float / COUNT(CASE WHEN jc.stage = 'phone_screen' THEN 1 END)) * 100
        ELSE 0 
    END as screening_to_interview_rate,
    
    CASE 
        WHEN COUNT(CASE WHEN jc.stage = 'interview' THEN 1 END) > 0 
        THEN (COUNT(CASE WHEN jc.stage = 'offer' THEN 1 END)::float / COUNT(CASE WHEN jc.stage = 'interview' THEN 1 END)) * 100
        ELSE 0 
    END as interview_to_offer_rate,
    
    CASE 
        WHEN COUNT(CASE WHEN jc.stage = 'offer' THEN 1 END) > 0 
        THEN (COUNT(CASE WHEN jc.stage = 'hired' THEN 1 END)::float / COUNT(CASE WHEN jc.stage = 'offer' THEN 1 END)) * 100
        ELSE 0 
    END as offer_acceptance_rate,
    
    -- Overall conversion rate
    CASE 
        WHEN COUNT(*) > 0 
        THEN (COUNT(CASE WHEN jc.stage = 'hired' THEN 1 END)::float / COUNT(*)) * 100
        ELSE 0 
    END as overall_conversion_rate

FROM job_candidate jc
WHERE jc.status = 'active'
GROUP BY jc.org_id, DATE_TRUNC('month', jc.created_at);

-- Candidate Source Analytics View
CREATE MATERIALIZED VIEW mv_candidate_sources AS
SELECT 
    am.org_id,
    COALESCE(am.application_source, 'direct') as source,
    COUNT(*) as total_applications,
    COUNT(CASE WHEN jc.stage = 'hired' THEN 1 END) as hired_count,
    COUNT(CASE WHEN jc.stage IN ('interview', 'offer', 'hired') THEN 1 END) as quality_candidates,
    
    -- Source effectiveness metrics
    CASE 
        WHEN COUNT(*) > 0 
        THEN (COUNT(CASE WHEN jc.stage = 'hired' THEN 1 END)::float / COUNT(*)) * 100
        ELSE 0 
    END as hire_rate,
    
    CASE 
        WHEN COUNT(*) > 0 
        THEN (COUNT(CASE WHEN jc.stage IN ('interview', 'offer', 'hired') THEN 1 END)::float / COUNT(*)) * 100
        ELSE 0 
    END as quality_rate,
    
    AVG(CASE 
        WHEN jc.stage = 'hired' 
        THEN EXTRACT(DAYS FROM jc.updated_at - jc.created_at)
        ELSE NULL 
    END) as avg_time_to_hire

FROM application_metadata am
JOIN job_candidate jc ON am.candidate_id = jc.candidate_id AND am.job_id = jc.job_id
WHERE jc.status = 'active'
GROUP BY am.org_id, am.application_source;

-- Time to Hire Analytics View
CREATE MATERIALIZED VIEW mv_time_to_hire AS
SELECT 
    jc.org_id,
    j.title as job_title,
    j.client_id,
    c.name as client_name,
    DATE_TRUNC('month', jc.created_at) as hire_month,
    
    -- Time metrics in days
    EXTRACT(DAYS FROM jc.updated_at - jc.created_at) as days_to_hire,
    EXTRACT(DAYS FROM jc.created_at - j.created_at) as days_from_job_creation,
    
    -- Stage progression timing
    jc.created_at as application_date,
    jc.updated_at as final_stage_date,
    jc.stage as final_stage

FROM job_candidate jc
JOIN jobs j ON jc.job_id = j.id
LEFT JOIN clients c ON j.client_id = c.id
WHERE jc.stage = 'hired' AND jc.status = 'active';

-- Skills Analytics View
CREATE MATERIALIZED VIEW mv_skills_analytics AS
SELECT 
    c.org_id,
    skill_item as skill_name,
    COUNT(*) as candidate_count,
    COUNT(CASE WHEN jc.stage = 'hired' THEN 1 END) as hired_with_skill,
    COUNT(CASE WHEN jc.stage IN ('interview', 'offer', 'hired') THEN 1 END) as quality_candidates_with_skill,
    
    -- Skills demand metrics
    CASE 
        WHEN COUNT(*) > 0 
        THEN (COUNT(CASE WHEN jc.stage = 'hired' THEN 1 END)::float / COUNT(*)) * 100
        ELSE 0 
    END as skill_hire_rate,
    
    AVG(CASE 
        WHEN jc.stage = 'hired' 
        THEN EXTRACT(DAYS FROM jc.updated_at - jc.created_at)
        ELSE NULL 
    END) as avg_time_to_hire_with_skill,
    
    -- Average proficiency level for this skill
    AVG(CASE 
        WHEN c.skill_levels IS NOT NULL AND c.skill_levels ? skill_item 
        THEN (c.skill_levels ->> skill_item)::int
        ELSE NULL 
    END) as avg_proficiency_level

FROM candidates c
CROSS JOIN LATERAL unnest(c.skills) as skill_item
LEFT JOIN job_candidate jc ON c.id = jc.candidate_id
WHERE c.skills IS NOT NULL AND array_length(c.skills, 1) > 0
GROUP BY c.org_id, skill_item
HAVING COUNT(*) >= 2;

-- Recruiter Performance View
CREATE MATERIALIZED VIEW mv_recruiter_performance AS
SELECT 
    j.org_id,
    j.assigned_to as recruiter_id,
    COALESCE(up.first_name || ' ' || up.last_name, 'Unknown') as recruiter_name,
    
    -- Job metrics
    COUNT(DISTINCT j.id) as jobs_managed,
    COUNT(DISTINCT CASE WHEN j.status = 'open' THEN j.id END) as active_jobs,
    COUNT(DISTINCT CASE WHEN j.status = 'filled' THEN j.id END) as closed_jobs,
    
    -- Candidate metrics
    COUNT(jc.id) as total_candidates,
    COUNT(CASE WHEN jc.stage = 'hired' THEN 1 END) as candidates_hired,
    COUNT(CASE WHEN jc.stage IN ('interview', 'offer') THEN 1 END) as candidates_in_final_stages,
    
    -- Performance metrics
    CASE 
        WHEN COUNT(jc.id) > 0 
        THEN (COUNT(CASE WHEN jc.stage = 'hired' THEN 1 END)::float / COUNT(jc.id)) * 100
        ELSE 0 
    END as conversion_rate,
    
    AVG(CASE 
        WHEN jc.stage = 'hired' 
        THEN EXTRACT(DAYS FROM jc.updated_at - jc.created_at)
        ELSE NULL 
    END) as avg_time_to_hire,
    
    -- Activity metrics
    COUNT(DISTINCT CASE WHEN jc.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN jc.id END) as candidates_last_30_days,
    COUNT(DISTINCT CASE WHEN j.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN j.id END) as jobs_created_last_30_days

FROM jobs j
LEFT JOIN job_candidate jc ON j.id = jc.job_id AND jc.status = 'active'
LEFT JOIN user_profiles up ON j.assigned_to = up.id
WHERE j.assigned_to IS NOT NULL
GROUP BY j.org_id, j.assigned_to, up.first_name, up.last_name;

-- Client Performance View
CREATE MATERIALIZED VIEW mv_client_performance AS
SELECT 
    j.org_id,
    j.client_id,
    c.name as client_name,
    c.industry,
    
    -- Job metrics
    COUNT(DISTINCT j.id) as total_jobs,
    COUNT(DISTINCT CASE WHEN j.status = 'open' THEN j.id END) as active_jobs,
    COUNT(DISTINCT CASE WHEN j.status = 'filled' THEN j.id END) as filled_jobs,
    
    -- Candidate metrics
    COUNT(jc.id) as total_applications,
    COUNT(CASE WHEN jc.stage = 'hired' THEN 1 END) as total_hires,
    
    -- Client fill rate
    CASE 
        WHEN COUNT(DISTINCT j.id) > 0 
        THEN (COUNT(DISTINCT CASE WHEN j.status = 'filled' THEN j.id END)::float / COUNT(DISTINCT j.id)) * 100
        ELSE 0 
    END as fill_rate,
    
    -- Average time to fill
    AVG(CASE 
        WHEN j.status = 'filled' 
        THEN EXTRACT(DAYS FROM j.updated_at - j.created_at)
        ELSE NULL 
    END) as avg_time_to_fill,
    
    -- Aging jobs (open > 30 days)
    COUNT(DISTINCT CASE WHEN j.status = 'open' AND j.created_at < CURRENT_DATE - INTERVAL '30 days' THEN j.id END) as aging_jobs_30_days,
    COUNT(DISTINCT CASE WHEN j.status = 'open' AND j.created_at < CURRENT_DATE - INTERVAL '60 days' THEN j.id END) as aging_jobs_60_days

FROM jobs j
LEFT JOIN clients c ON j.client_id = c.id
LEFT JOIN job_candidate jc ON j.id = jc.job_id AND jc.status = 'active'
WHERE j.client_id IS NOT NULL
GROUP BY j.org_id, j.client_id, c.name, c.industry;

-- ===============================================
-- 6. ANALYTICS FUNCTIONS
-- ===============================================

-- Function to refresh all analytics materialized views
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW mv_pipeline_metrics;
    REFRESH MATERIALIZED VIEW mv_candidate_sources;
    REFRESH MATERIALIZED VIEW mv_time_to_hire;
    REFRESH MATERIALIZED VIEW mv_skills_analytics;
    REFRESH MATERIALIZED VIEW mv_recruiter_performance;
    REFRESH MATERIALIZED VIEW mv_client_performance;
END;
$$;

-- ===============================================
-- 7. MATERIALIZED VIEW INDEXES
-- ===============================================

-- Create unique indexes on materialized views for better performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_pipeline_metrics_org_month ON mv_pipeline_metrics(org_id, period_month);
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_candidate_sources_org_source ON mv_candidate_sources(org_id, source);
CREATE INDEX IF NOT EXISTS idx_mv_time_to_hire_org_month ON mv_time_to_hire(org_id, hire_month);
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_skills_analytics_org_skill ON mv_skills_analytics(org_id, skill_name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_recruiter_performance_org_recruiter ON mv_recruiter_performance(org_id, recruiter_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_client_performance_org_client ON mv_client_performance(org_id, client_id);

-- ===============================================
-- 8. INITIAL DATA POPULATION
-- ===============================================

-- Refresh all materialized views with existing data
SELECT refresh_analytics_views();

-- Create daily snapshots for active organizations
INSERT INTO daily_analytics_snapshots (org_id, snapshot_date, total_jobs, active_jobs, total_candidates, total_applications)
SELECT 
    o.id as org_id,
    CURRENT_DATE as snapshot_date,
    COALESCE(job_counts.total_jobs, 0) as total_jobs,
    COALESCE(job_counts.active_jobs, 0) as active_jobs,
    COALESCE(candidate_counts.total_candidates, 0) as total_candidates,
    COALESCE(application_counts.total_applications, 0) as total_applications
FROM organizations o
LEFT JOIN (
    SELECT org_id, COUNT(*) as total_jobs, COUNT(CASE WHEN status = 'open' THEN 1 END) as active_jobs
    FROM jobs GROUP BY org_id
) job_counts ON o.id = job_counts.org_id
LEFT JOIN (
    SELECT org_id, COUNT(*) as total_candidates FROM candidates GROUP BY org_id
) candidate_counts ON o.id = candidate_counts.org_id
LEFT JOIN (
    SELECT org_id, COUNT(*) as total_applications FROM job_candidate WHERE status = 'active' GROUP BY org_id
) application_counts ON o.id = application_counts.org_id
ON CONFLICT (org_id, snapshot_date) DO NOTHING;

-- ===============================================
-- 9. ANALYTICS SUMMARY
-- ===============================================

-- Analytics setup verification and completion message
SELECT 
    'TalentPatriot Analytics Setup Complete (Fixed)' as status,
    (SELECT COUNT(*) FROM information_schema.views WHERE table_name LIKE 'mv_%') as views_created,
    (SELECT COUNT(*) FROM pg_indexes WHERE indexname LIKE '%mv_%') as indexes_created;

-- Script completion confirmation
SELECT 'Fixed analytics infrastructure ready' as result;