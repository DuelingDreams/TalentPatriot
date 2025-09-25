-- ===============================================
-- TalentPatriot ATS - Analytics & Reports Setup
-- ===============================================
-- This script creates materialized views, indexes, and helper tables
-- for comprehensive analytics and reporting functionality.
-- 
-- INSTRUCTIONS:
-- 1. Copy this entire script
-- 2. Paste it into your Supabase SQL Editor
-- 3. Click "Run" to execute all commands
-- 4. The script will create all necessary analytics infrastructure
--
-- COMPATIBILITY: Supabase PostgreSQL 15+

-- ===============================================
-- 1. REQUIRED EXTENSIONS
-- ===============================================

-- Enable pg_trgm extension for full-text search capabilities
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ===============================================
-- 2. ANALYTICS HELPER TABLES
-- ===============================================

-- Report scheduling table for automated reports
CREATE TABLE IF NOT EXISTS report_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    report_type VARCHAR(50) NOT NULL, -- 'pipeline', 'candidate', 'activity', 'business'
    frequency VARCHAR(20) NOT NULL, -- 'weekly', 'monthly', 'quarterly'
    format VARCHAR(10) NOT NULL, -- 'pdf', 'excel'
    recipients TEXT[] NOT NULL, -- email addresses
    filter_config JSONB DEFAULT '{}'::jsonb,
    enabled BOOLEAN DEFAULT true,
    last_sent TIMESTAMP WITH TIME ZONE,
    next_scheduled TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Report generation queue for async processing
CREATE TABLE IF NOT EXISTS report_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    report_type VARCHAR(50) NOT NULL,
    format VARCHAR(10) NOT NULL,
    period VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    file_url TEXT,
    error_message TEXT,
    requested_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Daily snapshots for time-based analytics
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
-- 2. PERFORMANCE INDEXES
-- ===============================================

-- Core performance indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_job_candidate_org_stage ON job_candidate(org_id, stage);
CREATE INDEX IF NOT EXISTS idx_job_candidate_created_at ON job_candidate(created_at);
CREATE INDEX IF NOT EXISTS idx_job_candidate_org_created ON job_candidate(org_id, created_at);
CREATE INDEX IF NOT EXISTS idx_jobs_org_status_created ON jobs(org_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_candidates_org_created ON candidates(org_id, created_at);
CREATE INDEX IF NOT EXISTS idx_application_metadata_org_source ON application_metadata(org_id, application_source);
CREATE INDEX IF NOT EXISTS idx_interviews_org_status ON interviews(org_id, status);
CREATE INDEX IF NOT EXISTS idx_email_events_org_created ON email_events(org_id, sent_at);

-- Specialized indexes for skills and metadata analytics
-- Skills column full-text search optimization (text column with pg_trgm)
CREATE INDEX IF NOT EXISTS idx_candidates_skills_gin ON candidates USING GIN(skills gin_trgm_ops) 
WHERE skills IS NOT NULL AND skills != '';

-- JSONB indexes for application metadata (only create if columns exist)
-- Education details JSONB index
CREATE INDEX IF NOT EXISTS idx_application_metadata_education_gin ON application_metadata USING GIN(education_details) 
WHERE education_details IS NOT NULL;

-- Employment details JSONB index  
CREATE INDEX IF NOT EXISTS idx_application_metadata_employment_gin ON application_metadata USING GIN(employment_details) 
WHERE employment_details IS NOT NULL;

-- Time-based partitioning indexes
CREATE INDEX IF NOT EXISTS idx_daily_snapshots_org_date ON daily_analytics_snapshots(org_id, snapshot_date);

-- ===============================================
-- 3. MATERIALIZED VIEWS FOR CORE METRICS
-- ===============================================

-- Pipeline Metrics View
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_pipeline_metrics AS
SELECT 
    jc.org_id,
    DATE_TRUNC('month', jc.created_at) as period_month,
    COUNT(*) as total_applications,
    COUNT(*) FILTER (WHERE jc.stage = 'applied') as applied_count,
    COUNT(*) FILTER (WHERE jc.stage = 'screening') as screening_count,
    COUNT(*) FILTER (WHERE jc.stage = 'interview') as interview_count,
    COUNT(*) FILTER (WHERE jc.stage = 'offer') as offer_count,
    COUNT(*) FILTER (WHERE jc.stage = 'hired') as hired_count,
    COUNT(*) FILTER (WHERE jc.stage = 'rejected') as rejected_count,
    
    -- Conversion rates
    CASE 
        WHEN COUNT(*) FILTER (WHERE jc.stage = 'applied') > 0 
        THEN (COUNT(*) FILTER (WHERE jc.stage = 'screening')::float / COUNT(*) FILTER (WHERE jc.stage = 'applied')) * 100
        ELSE 0 
    END as applied_to_screening_rate,
    
    CASE 
        WHEN COUNT(*) FILTER (WHERE jc.stage = 'screening') > 0 
        THEN (COUNT(*) FILTER (WHERE jc.stage = 'interview')::float / COUNT(*) FILTER (WHERE jc.stage = 'screening')) * 100
        ELSE 0 
    END as screening_to_interview_rate,
    
    CASE 
        WHEN COUNT(*) FILTER (WHERE jc.stage = 'interview') > 0 
        THEN (COUNT(*) FILTER (WHERE jc.stage = 'offer')::float / COUNT(*) FILTER (WHERE jc.stage = 'interview')) * 100
        ELSE 0 
    END as interview_to_offer_rate,
    
    CASE 
        WHEN COUNT(*) FILTER (WHERE jc.stage = 'offer') > 0 
        THEN (COUNT(*) FILTER (WHERE jc.stage = 'hired')::float / COUNT(*) FILTER (WHERE jc.stage = 'offer')) * 100
        ELSE 0 
    END as offer_acceptance_rate,
    
    -- Overall conversion rate
    CASE 
        WHEN COUNT(*) > 0 
        THEN (COUNT(*) FILTER (WHERE jc.stage = 'hired')::float / COUNT(*)) * 100
        ELSE 0 
    END as overall_conversion_rate

FROM job_candidate jc
WHERE jc.status = 'active'
GROUP BY jc.org_id, DATE_TRUNC('month', jc.created_at);

-- Candidate Source Analytics View
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_candidate_sources AS
SELECT 
    am.org_id,
    COALESCE(am.application_source, 'direct') as source,
    COUNT(*) as total_applications,
    COUNT(*) FILTER (WHERE jc.stage IN ('hired')) as hired_count,
    COUNT(*) FILTER (WHERE jc.stage IN ('interview', 'offer', 'hired')) as quality_candidates,
    
    -- Source effectiveness metrics
    CASE 
        WHEN COUNT(*) > 0 
        THEN (COUNT(*) FILTER (WHERE jc.stage = 'hired')::float / COUNT(*)) * 100
        ELSE 0 
    END as hire_rate,
    
    CASE 
        WHEN COUNT(*) > 0 
        THEN (COUNT(*) FILTER (WHERE jc.stage IN ('interview', 'offer', 'hired'))::float / COUNT(*)) * 100
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
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_time_to_hire AS
SELECT 
    jc.org_id,
    j.title as job_title,
    j.client_id,
    c.name as client_name,
    DATE_TRUNC('month', jc.created_at) as hire_month,
    
    -- Time metrics in days
    EXTRACT(DAYS FROM jc.updated_at - jc.created_at) as days_to_hire,
    EXTRACT(DAYS FROM j.created_at - jc.created_at) as days_from_job_creation,
    
    -- Stage progression timing
    jc.created_at as application_date,
    jc.updated_at as final_stage_date,
    jc.stage as final_stage

FROM job_candidate jc
JOIN jobs j ON jc.job_id = j.id
LEFT JOIN clients c ON j.client_id = c.id
WHERE jc.stage = 'hired' AND jc.status = 'active';

-- Skills Analytics View
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_skills_analytics AS
SELECT 
    c.org_id,
    TRIM(skill_item) as skill_name,
    COUNT(*) as candidate_count,
    COUNT(*) FILTER (WHERE jc.stage = 'hired') as hired_with_skill,
    COUNT(*) FILTER (WHERE jc.stage IN ('interview', 'offer', 'hired')) as quality_candidates_with_skill,
    
    -- Skills demand metrics
    CASE 
        WHEN COUNT(*) > 0 
        THEN (COUNT(*) FILTER (WHERE jc.stage = 'hired')::float / COUNT(*)) * 100
        ELSE 0 
    END as skill_hire_rate,
    
    AVG(CASE 
        WHEN jc.stage = 'hired' 
        THEN EXTRACT(DAYS FROM jc.updated_at - jc.created_at)
        ELSE NULL 
    END) as avg_time_to_hire_with_skill

FROM candidates c
CROSS JOIN LATERAL regexp_split_to_table(c.skills, '\s*,\s*|\s*;\s*|\s+') as skill_item
LEFT JOIN job_candidate jc ON c.id = jc.candidate_id
WHERE c.skills IS NOT NULL AND c.skills != '' AND LENGTH(TRIM(skill_item)) > 1
GROUP BY c.org_id, TRIM(skill_item)
HAVING COUNT(*) >= 2; -- Only show skills with at least 2 candidates

-- Recruiter Performance View
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_recruiter_performance AS
SELECT 
    j.org_id,
    j.assigned_to as recruiter_id,
    u.name as recruiter_name,
    
    -- Job metrics
    COUNT(DISTINCT j.id) as jobs_managed,
    COUNT(DISTINCT CASE WHEN j.status = 'active' THEN j.id END) as active_jobs,
    COUNT(DISTINCT CASE WHEN j.status = 'closed' THEN j.id END) as closed_jobs,
    
    -- Candidate metrics
    COUNT(jc.id) as total_candidates,
    COUNT(*) FILTER (WHERE jc.stage = 'hired') as candidates_hired,
    COUNT(*) FILTER (WHERE jc.stage IN ('interview', 'offer')) as candidates_in_final_stages,
    
    -- Performance metrics
    CASE 
        WHEN COUNT(jc.id) > 0 
        THEN (COUNT(*) FILTER (WHERE jc.stage = 'hired')::float / COUNT(jc.id)) * 100
        ELSE 0 
    END as conversion_rate,
    
    AVG(CASE 
        WHEN jc.stage = 'hired' 
        THEN EXTRACT(DAYS FROM jc.updated_at - jc.created_at)
        ELSE NULL 
    END) as avg_time_to_hire,
    
    -- Activity metrics
    COUNT(DISTINCT jc.id) FILTER (WHERE jc.created_at >= CURRENT_DATE - INTERVAL '30 days') as candidates_last_30_days,
    COUNT(DISTINCT j.id) FILTER (WHERE j.created_at >= CURRENT_DATE - INTERVAL '30 days') as jobs_created_last_30_days

FROM jobs j
LEFT JOIN job_candidate jc ON j.id = jc.job_id AND jc.status = 'active'
LEFT JOIN users u ON j.assigned_to = u.id
WHERE j.assigned_to IS NOT NULL
GROUP BY j.org_id, j.assigned_to, u.name;

-- Client Performance View
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_client_performance AS
SELECT 
    j.org_id,
    j.client_id,
    c.name as client_name,
    c.industry,
    
    -- Job metrics
    COUNT(DISTINCT j.id) as total_jobs,
    COUNT(DISTINCT CASE WHEN j.status = 'active' THEN j.id END) as active_jobs,
    COUNT(DISTINCT CASE WHEN j.status = 'closed' THEN j.id END) as filled_jobs,
    
    -- Candidate metrics
    COUNT(jc.id) as total_applications,
    COUNT(*) FILTER (WHERE jc.stage = 'hired') as total_hires,
    
    -- Client fill rate
    CASE 
        WHEN COUNT(DISTINCT j.id) > 0 
        THEN (COUNT(DISTINCT CASE WHEN j.status = 'closed' THEN j.id END)::float / COUNT(DISTINCT j.id)) * 100
        ELSE 0 
    END as fill_rate,
    
    -- Average time to fill
    AVG(CASE 
        WHEN j.status = 'closed' 
        THEN EXTRACT(DAYS FROM j.updated_at - j.created_at)
        ELSE NULL 
    END) as avg_time_to_fill,
    
    -- Aging jobs (open > 30 days)
    COUNT(DISTINCT j.id) FILTER (WHERE j.status = 'active' AND j.created_at < CURRENT_DATE - INTERVAL '30 days') as aging_jobs_30_days,
    COUNT(DISTINCT j.id) FILTER (WHERE j.status = 'active' AND j.created_at < CURRENT_DATE - INTERVAL '60 days') as aging_jobs_60_days

FROM jobs j
LEFT JOIN clients c ON j.client_id = c.id
LEFT JOIN job_candidate jc ON j.id = jc.job_id AND jc.status = 'active'
WHERE j.client_id IS NOT NULL
GROUP BY j.org_id, j.client_id, c.name, c.industry;

-- ===============================================
-- 4. ANALYTICS FUNCTIONS
-- ===============================================

-- Function to refresh all analytics materialized views
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_pipeline_metrics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_candidate_sources;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_time_to_hire;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_skills_analytics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_recruiter_performance;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_client_performance;
END;
$$;

-- Function to get comprehensive org analytics
CREATE OR REPLACE FUNCTION get_org_analytics(org_uuid UUID, period_months INTEGER DEFAULT 3)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    result JSONB := '{}'::jsonb;
    start_date DATE := CURRENT_DATE - (period_months || ' months')::INTERVAL;
BEGIN
    -- Pipeline metrics
    SELECT jsonb_build_object(
        'pipeline', jsonb_agg(
            jsonb_build_object(
                'month', period_month,
                'applications', total_applications,
                'hired', hired_count,
                'conversion_rate', overall_conversion_rate
            )
        )
    ) INTO result
    FROM mv_pipeline_metrics 
    WHERE org_id = org_uuid AND period_month >= start_date;
    
    -- Add source analytics
    result := result || jsonb_build_object(
        'sources', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'source', source,
                    'applications', total_applications,
                    'hire_rate', hire_rate,
                    'quality_rate', quality_rate
                )
            )
            FROM mv_candidate_sources 
            WHERE org_id = org_uuid
        )
    );
    
    -- Add top skills
    result := result || jsonb_build_object(
        'top_skills', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'skill', skill_name,
                    'count', candidate_count,
                    'hire_rate', skill_hire_rate
                )
            )
            FROM mv_skills_analytics 
            WHERE org_id = org_uuid
            ORDER BY candidate_count DESC
            LIMIT 15
        )
    );
    
    RETURN result;
END;
$$;

-- Function to create daily analytics snapshot
CREATE OR REPLACE FUNCTION create_daily_snapshot(org_uuid UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    snapshot_data RECORD;
BEGIN
    -- Calculate daily metrics
    SELECT 
        COUNT(DISTINCT j.id) as total_jobs,
        COUNT(DISTINCT j.id) FILTER (WHERE j.status = 'active') as active_jobs,
        COUNT(DISTINCT c.id) as total_candidates,
        COUNT(jc.id) as total_applications,
        COUNT(jc.id) FILTER (WHERE jc.created_at::date = CURRENT_DATE) as applications_today,
        COUNT(jc.id) FILTER (WHERE jc.stage = 'hired' AND jc.updated_at::date = CURRENT_DATE) as hires_today
    INTO snapshot_data
    FROM jobs j
    LEFT JOIN job_candidate jc ON j.id = jc.job_id AND jc.status = 'active'
    LEFT JOIN candidates c ON jc.candidate_id = c.id
    WHERE j.org_id = org_uuid;
    
    -- Insert or update daily snapshot
    INSERT INTO daily_analytics_snapshots (
        org_id, snapshot_date, total_jobs, active_jobs, total_candidates, 
        total_applications, applications_today, hires_today
    ) VALUES (
        org_uuid, CURRENT_DATE, snapshot_data.total_jobs, snapshot_data.active_jobs,
        snapshot_data.total_candidates, snapshot_data.total_applications,
        snapshot_data.applications_today, snapshot_data.hires_today
    )
    ON CONFLICT (org_id, snapshot_date) 
    DO UPDATE SET 
        total_jobs = EXCLUDED.total_jobs,
        active_jobs = EXCLUDED.active_jobs,
        total_candidates = EXCLUDED.total_candidates,
        total_applications = EXCLUDED.total_applications,
        applications_today = EXCLUDED.applications_today,
        hires_today = EXCLUDED.hires_today,
        created_at = NOW();
END;
$$;

-- ===============================================
-- 5. INITIAL DATA POPULATION
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
    SELECT org_id, COUNT(*) as total_jobs, COUNT(*) FILTER (WHERE status = 'active') as active_jobs
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
-- 6. MAINTENANCE & CLEANUP
-- ===============================================

-- Create indexes on materialized views for better performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_pipeline_metrics_org_month ON mv_pipeline_metrics(org_id, period_month);
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_candidate_sources_org_source ON mv_candidate_sources(org_id, source);
CREATE INDEX IF NOT EXISTS idx_mv_time_to_hire_org_month ON mv_time_to_hire(org_id, hire_month);
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_skills_analytics_org_skill ON mv_skills_analytics(org_id, skill_name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_recruiter_performance_org_recruiter ON mv_recruiter_performance(org_id, recruiter_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_client_performance_org_client ON mv_client_performance(org_id, client_id);

-- Automated refresh setup (optional - requires pg_cron extension)
-- Uncomment the line below if you have pg_cron enabled in your Supabase project:
-- SELECT cron.schedule('refresh-analytics', '0 */6 * * *', 'SELECT refresh_analytics_views();');

-- ===============================================
-- 7. ANALYTICS SUMMARY
-- ===============================================

-- Analytics setup verification and completion message
SELECT 
    'TalentPatriot Analytics Setup Complete!' as status,
    (SELECT COUNT(*) FROM information_schema.views WHERE table_name LIKE 'mv_%') as materialized_views_created,
    (SELECT COUNT(*) FROM pg_indexes WHERE indexname LIKE '%analytics%' OR indexname LIKE '%mv_%') as performance_indexes_created,
    (SELECT COUNT(*) FROM pg_proc WHERE proname IN ('refresh_analytics_views', 'get_org_analytics', 'create_daily_snapshot')) as analytics_functions_created;

-- Success message and next steps
SELECT 
    '🎉 SUCCESS: Analytics infrastructure is now ready!' as message,
    'Run this command periodically to refresh analytics data:' as next_step_1,
    'SELECT refresh_analytics_views();' as refresh_command,
    'Your Reports page will now show comprehensive analytics!' as next_step_2;