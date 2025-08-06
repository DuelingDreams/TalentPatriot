-- Supabase Performance Optimization Part 1 - Non-concurrent operations
-- Run this first in a transaction

-- ========================================
-- CRITICAL FIX 1: Timezone Query Optimization (26.6% of query time!)
-- ========================================

-- Drop existing materialized view if it exists
DROP MATERIALIZED VIEW IF EXISTS mv_timezone_names;
-- Drop table if it exists
DROP TABLE IF EXISTS mv_timezone_names;

-- Create a cached timezone table to avoid expensive pg_timezone_names queries
CREATE TABLE mv_timezone_names (
    name text PRIMARY KEY,
    created_at timestamp DEFAULT now()
);

-- Populate the timezone cache with just the names
INSERT INTO mv_timezone_names (name)
SELECT DISTINCT name 
FROM pg_timezone_names;

-- Create index for faster lookups
CREATE INDEX idx_mv_timezone_names ON mv_timezone_names(name);

-- Grant access
GRANT SELECT ON mv_timezone_names TO authenticated;
GRANT SELECT ON mv_timezone_names TO anon;

-- ========================================
-- CRITICAL FIX 3: Optimize Dashboard Functions (18.7% of query time)
-- ========================================

-- Create optimized function for dashboard stats
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_org_id uuid)
RETURNS TABLE(
    total_jobs bigint,
    open_jobs bigint,
    total_candidates bigint,
    active_clients bigint,
    interviews_this_week bigint
) 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
PARALLEL SAFE
AS $$
    SELECT 
        COUNT(DISTINCT j.id) FILTER (WHERE j.record_status = 'active'),
        COUNT(DISTINCT j.id) FILTER (WHERE j.status = 'open' AND j.record_status = 'active'),
        COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'active'),
        COUNT(DISTINCT cl.id) FILTER (WHERE cl.status = 'active'),
        COUNT(DISTINCT i.id) FILTER (WHERE i.scheduled_at >= now() - interval '7 days')
    FROM organizations o
    LEFT JOIN jobs j ON j.org_id = o.id
    LEFT JOIN candidates c ON c.org_id = o.id
    LEFT JOIN clients cl ON cl.org_id = o.id
    LEFT JOIN interviews i ON i.org_id = o.id
    WHERE o.id = p_org_id
    GROUP BY o.id;
$$;

-- ========================================
-- CRITICAL FIX 4: Optimize RLS Policies with Function Caching
-- ========================================

-- Create a materialized security context for users
CREATE TABLE IF NOT EXISTS user_security_context (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    org_ids uuid[],
    user_role text,
    updated_at timestamp DEFAULT now()
);

-- Function to refresh user security context
CREATE OR REPLACE FUNCTION refresh_user_security_context(p_user_id uuid)
RETURNS void AS $$
BEGIN
    INSERT INTO user_security_context (user_id, org_ids, user_role)
    VALUES (
        p_user_id,
        (SELECT ARRAY_AGG(org_id) FROM user_organizations WHERE user_id = p_user_id),
        (SELECT get_user_role(p_user_id))
    )
    ON CONFLICT (user_id) DO UPDATE SET
        org_ids = EXCLUDED.org_ids,
        user_role = EXCLUDED.user_role,
        updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optimized function to get user orgs (with caching)
CREATE OR REPLACE FUNCTION get_user_org_ids_cached(user_uuid uuid)
RETURNS uuid[] 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
PARALLEL SAFE
AS $$
    SELECT COALESCE(
        (SELECT org_ids FROM user_security_context WHERE user_id = user_uuid AND updated_at > now() - interval '5 minutes'),
        (SELECT ARRAY_AGG(org_id) FROM user_organizations WHERE user_id = user_uuid)
    );
$$;

-- ========================================
-- CRITICAL FIX 5: Optimize Table/Column Queries (5.1% of query time)
-- ========================================

-- Create materialized view for table metadata
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_table_metadata AS
SELECT
    c.oid::int8 AS id,
    nc.nspname AS schema,
    c.relname AS name,
    c.relrowsecurity AS rls_enabled,
    c.relforcerowsecurity AS rls_forced,
    pg_total_relation_size(c.oid)::int8 AS bytes,
    obj_description(c.oid) AS comment
FROM pg_namespace nc
JOIN pg_class c ON nc.oid = c.relnamespace
WHERE c.relkind IN ('r', 'p')
  AND nc.nspname = 'public';

CREATE INDEX idx_mv_table_metadata_schema ON mv_table_metadata(schema);

-- ========================================
-- CRITICAL FIX 6: Optimize Function Metadata Queries (4.2% of query time)
-- ========================================

-- Create materialized view for function metadata
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_function_metadata AS
SELECT
    p.oid,
    pn.nspname AS proc_schema,
    p.proname AS proc_name,
    p.prokind,
    p.prorettype,
    p.proargtypes,
    p.proargnames,
    p.pronargs,
    p.provolatile
FROM pg_proc p
JOIN pg_namespace pn ON pn.oid = p.pronamespace
WHERE pn.nspname IN ('public', 'auth', 'storage');

CREATE INDEX idx_mv_function_metadata_schema ON mv_function_metadata(proc_schema);

-- ========================================
-- Create Refresh Functions
-- ========================================

CREATE OR REPLACE FUNCTION refresh_performance_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_table_metadata;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_function_metadata;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- Create Performance Dashboard
-- ========================================

CREATE OR REPLACE VIEW performance_insights AS
SELECT 
    'Missing Indexes' as issue_type,
    COUNT(*) as count,
    'Run index creation script' as recommendation
FROM pg_stat_user_tables t
LEFT JOIN pg_indexes i ON t.schemaname = i.schemaname AND t.tablename = i.tablename
WHERE t.schemaname = 'public' 
  AND i.indexname IS NULL
UNION ALL
SELECT 
    'Slow Queries' as issue_type,
    COUNT(*) as count,
    'Check pg_stat_statements' as recommendation
FROM pg_stat_statements
WHERE mean_exec_time > 100
UNION ALL
SELECT 
    'Table Bloat' as issue_type,
    COUNT(*) as count,
    'Run VACUUM ANALYZE' as recommendation
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000;

-- Grant necessary permissions
GRANT SELECT ON performance_insights TO authenticated;
GRANT SELECT ON mv_table_metadata TO authenticated;
GRANT SELECT ON mv_function_metadata TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_user_security_context(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_org_ids_cached(uuid) TO authenticated;

-- Update statistics
ANALYZE;