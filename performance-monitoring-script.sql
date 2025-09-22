-- =========================================================
-- TalentPatriot ATS Performance Monitoring Script
-- Updated to align with exact Supabase schema
-- =========================================================

-- First check if pg_stat_statements is available
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements') THEN
        RAISE NOTICE 'pg_stat_statements extension is available';
    ELSE
        RAISE NOTICE 'pg_stat_statements extension is not available - using alternative monitoring';
    END IF;
END $$;

-- =========================================================
-- Real-time Query Monitoring (Active Queries)
-- =========================================================
CREATE OR REPLACE VIEW v_ats_query_performance AS
SELECT 
    'Current Active Queries' as monitoring_type,
    datname as database_name,
    usename as user_name,
    application_name,
    CASE 
        WHEN query LIKE '%job_candidate%' THEN 'Pipeline Management'
        WHEN query LIKE '%jobs%' THEN 'Job Management'
        WHEN query LIKE '%candidates%' THEN 'Candidate Management'
        WHEN query LIKE '%interviews%' THEN 'Interview Management'
        WHEN query LIKE '%messages%' THEN 'Communication'
        WHEN query LIKE '%clients%' THEN 'Client Management'
        WHEN query LIKE '%notes%' THEN 'Notes Management'
        WHEN query LIKE '%organizations%' THEN 'Organization Management'
        WHEN query LIKE '%pipeline_columns%' THEN 'Pipeline Configuration'
        ELSE 'Other'
    END as feature_area,
    state,
    query_start,
    EXTRACT(EPOCH FROM (NOW() - query_start)) as duration_seconds,
    LEFT(query, 150) as query_preview
FROM pg_stat_activity
WHERE query IS NOT NULL 
    AND query NOT LIKE '%pg_stat_activity%'
    AND query NOT LIKE '%v_ats_%'  -- Exclude our monitoring queries
    AND state = 'active'
    AND (
        query LIKE '%job_candidate%' OR
        query LIKE '%jobs%' OR 
        query LIKE '%candidates%' OR
        query LIKE '%interviews%' OR
        query LIKE '%messages%' OR
        query LIKE '%clients%' OR
        query LIKE '%notes%' OR
        query LIKE '%organizations%' OR
        query LIKE '%pipeline_columns%'
    );

-- =========================================================
-- Table-Level Performance Statistics
-- Includes ALL ATS tables from your schema
-- =========================================================
CREATE OR REPLACE VIEW v_ats_table_performance AS
SELECT 
    schemaname,
    relname as tablename,
    seq_scan as sequential_scans,
    seq_tup_read as rows_read_sequentially,
    idx_scan as index_scans,
    idx_tup_fetch as rows_fetched_via_index,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows,
    -- Index efficiency ratio
    CASE 
        WHEN idx_scan > 0 THEN 
            ROUND((idx_tup_fetch::numeric / idx_scan), 2)
        ELSE 0 
    END as avg_rows_per_index_scan,
    -- Cache hit ratio for this table
    CASE 
        WHEN (heap_blks_read + heap_blks_hit) > 0 THEN
            ROUND((heap_blks_hit::numeric / (heap_blks_read + heap_blks_hit)) * 100, 2)
        ELSE 0
    END as table_cache_hit_ratio_percent,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
    AND relname IN (
        'jobs', 
        'candidates', 
        'job_candidate', 
        'interviews', 
        'messages', 
        'pipeline_columns',
        'clients',
        'notes',
        'organizations',
        '_job_candidate_stage_shadow'
    )
ORDER BY (seq_tup_read + idx_tup_fetch) DESC;

-- =========================================================
-- Index Usage Analysis
-- Shows which indexes are being used effectively
-- =========================================================
CREATE OR REPLACE VIEW v_ats_index_performance AS
SELECT 
    st.schemaname,
    st.relname as tablename,
    si.indexrelname as indexname,
    si.idx_scan as times_used,
    si.idx_tup_read as rows_read,
    si.idx_tup_fetch as rows_fetched,
    CASE 
        WHEN si.idx_scan > 0 THEN
            ROUND((si.idx_tup_fetch::numeric / si.idx_scan), 2)
        ELSE 0
    END as avg_rows_per_scan,
    -- Index efficiency indicator
    CASE 
        WHEN si.idx_scan = 0 THEN 'Unused'
        WHEN si.idx_scan < 10 THEN 'Low Usage'
        WHEN si.idx_scan < 100 THEN 'Moderate Usage'
        ELSE 'High Usage'
    END as usage_level
FROM pg_stat_user_indexes si 
JOIN pg_stat_user_tables st ON si.relid = st.relid
WHERE st.schemaname = 'public'
    AND st.relname IN (
        'jobs', 
        'candidates', 
        'job_candidate', 
        'interviews', 
        'messages', 
        'pipeline_columns',
        'clients',
        'notes',
        'organizations',
        '_job_candidate_stage_shadow'
    )
ORDER BY si.idx_scan DESC;

-- =========================================================
-- ATS-Specific Performance Metrics
-- Focused on recruitment workflow patterns
-- =========================================================
CREATE OR REPLACE VIEW v_ats_workflow_performance AS
SELECT 
    'Pipeline Operations' as workflow_category,
    SUM(CASE WHEN relname = 'job_candidate' THEN seq_scan + COALESCE(idx_scan, 0) ELSE 0 END) as pipeline_queries,
    SUM(CASE WHEN relname = 'job_candidate' THEN n_tup_upd ELSE 0 END) as pipeline_updates,
    SUM(CASE WHEN relname = 'jobs' THEN seq_scan + COALESCE(idx_scan, 0) ELSE 0 END) as job_queries,
    SUM(CASE WHEN relname = 'candidates' THEN seq_scan + COALESCE(idx_scan, 0) ELSE 0 END) as candidate_queries,
    SUM(CASE WHEN relname = 'interviews' THEN n_tup_ins + n_tup_upd ELSE 0 END) as interview_activities,
    SUM(CASE WHEN relname = 'messages' THEN n_tup_ins ELSE 0 END) as messages_sent
FROM pg_stat_user_tables
WHERE schemaname = 'public'
    AND relname IN ('job_candidate', 'jobs', 'candidates', 'interviews', 'messages')
UNION ALL
SELECT 
    'Database Health' as workflow_category,
    SUM(n_live_tup) as total_live_rows,
    SUM(n_dead_tup) as total_dead_rows,
    COUNT(*) as total_tables,
    SUM(CASE WHEN last_autovacuum IS NULL THEN 1 ELSE 0 END) as tables_needing_vacuum,
    SUM(CASE WHEN last_autoanalyze IS NULL THEN 1 ELSE 0 END) as tables_needing_analyze,
    0 as unused_metric
FROM pg_stat_user_tables
WHERE schemaname = 'public'
    AND relname IN (
        'jobs', 'candidates', 'job_candidate', 'interviews', 'messages', 
        'pipeline_columns', 'clients', 'notes', 'organizations'
    );

-- =========================================================
-- Database Connection and Activity Summary
-- =========================================================
CREATE OR REPLACE VIEW v_ats_database_health AS
SELECT 
    datname as database_name,
    numbackends as active_connections,
    xact_commit as transactions_committed,
    xact_rollback as transactions_rolled_back,
    blks_read as blocks_read_from_disk,
    blks_hit as blocks_read_from_cache,
    -- Cache hit ratio (higher is better)
    CASE 
        WHEN (blks_read + blks_hit) > 0 THEN
            ROUND((blks_hit::numeric / (blks_read + blks_hit)) * 100, 2)
        ELSE 0 
    END as cache_hit_ratio_percent,
    tup_returned as rows_returned,
    tup_fetched as rows_fetched,
    tup_inserted as rows_inserted,
    tup_updated as rows_updated,
    tup_deleted as rows_deleted,
    conflicts as query_conflicts,
    temp_files as temporary_files_created,
    temp_bytes as temporary_bytes_used,
    deadlocks as deadlock_count
FROM pg_stat_database
WHERE datname = current_database();

-- =========================================================
-- Performance Alert View
-- Identifies potential performance issues
-- =========================================================
CREATE OR REPLACE VIEW v_ats_performance_alerts AS
SELECT 
    'High Sequential Scan Ratio' as alert_type,
    relname as affected_object,
    CONCAT(
        'Table ', relname, ' has ', seq_scan, ' sequential scans vs ', 
        COALESCE(idx_scan, 0), ' index scans'
    ) as alert_message,
    'HIGH' as severity
FROM pg_stat_user_tables
WHERE schemaname = 'public'
    AND relname IN (
        'jobs', 'candidates', 'job_candidate', 'interviews', 'messages', 
        'pipeline_columns', 'clients', 'notes', 'organizations'
    )
    AND seq_scan > COALESCE(idx_scan * 2, 10)  -- More than 2x sequential vs index scans
    AND seq_scan > 100  -- Only alert if significant activity

UNION ALL

SELECT 
    'Unused Index' as alert_type,
    si.indexrelname as affected_object,
    CONCAT('Index ', si.indexrelname, ' on table ', st.relname, ' has never been used') as alert_message,
    'MEDIUM' as severity
FROM pg_stat_user_indexes si
JOIN pg_stat_user_tables st ON si.relid = st.relid
WHERE st.schemaname = 'public'
    AND st.relname IN (
        'jobs', 'candidates', 'job_candidate', 'interviews', 'messages', 
        'pipeline_columns', 'clients', 'notes', 'organizations'
    )
    AND si.idx_scan = 0

UNION ALL

SELECT 
    'High Dead Tuple Ratio' as alert_type,
    relname as affected_object,
    CONCAT(
        'Table ', relname, ' has ', n_dead_tup, ' dead tuples vs ', 
        n_live_tup, ' live tuples (', 
        ROUND((n_dead_tup::numeric / GREATEST(n_live_tup, 1)) * 100, 1), '% dead)'
    ) as alert_message,
    'MEDIUM' as severity
FROM pg_stat_user_tables
WHERE schemaname = 'public'
    AND relname IN (
        'jobs', 'candidates', 'job_candidate', 'interviews', 'messages', 
        'pipeline_columns', 'clients', 'notes', 'organizations'
    )
    AND n_dead_tup > n_live_tup * 0.2  -- More than 20% dead tuples
    AND n_live_tup > 100;  -- Only alert for tables with meaningful data

-- Success confirmation
SELECT 'SUCCESS: Comprehensive ATS monitoring views created!' as status;

-- =========================================================
-- Quick Performance Check Queries
-- =========================================================

/*
-- Use these queries to monitor your ATS performance:

-- 1. Current active queries by feature area
SELECT feature_area, COUNT(*) as active_queries, AVG(duration_seconds) as avg_duration
FROM v_ats_query_performance 
GROUP BY feature_area;

-- 2. Table performance overview
SELECT tablename, live_rows, sequential_scans, index_scans, 
       table_cache_hit_ratio_percent, last_analyze
FROM v_ats_table_performance 
ORDER BY live_rows DESC;

-- 3. Index usage efficiency
SELECT tablename, indexname, times_used, usage_level
FROM v_ats_index_performance 
WHERE usage_level IN ('Unused', 'Low Usage')
ORDER BY times_used ASC;

-- 4. Performance alerts
SELECT alert_type, COUNT(*) as alert_count
FROM v_ats_performance_alerts 
GROUP BY alert_type, severity
ORDER BY severity DESC;

-- 5. ATS workflow activity
SELECT * FROM v_ats_workflow_performance;

-- 6. Overall database health
SELECT cache_hit_ratio_percent, active_connections, deadlock_count
FROM v_ats_database_health;
*/