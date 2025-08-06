-- Supabase Performance Analysis and Optimization Script
-- This script analyzes and fixes common performance issues

-- 1. Check for missing indexes on foreign keys and commonly queried columns
SELECT 
    schemaname,
    tablename,
    attname AS column_name,
    n_distinct,
    correlation
FROM pg_stats 
WHERE schemaname = 'public' 
AND tablename IN ('clients', 'jobs', 'candidates', 'job_candidate', 'candidate_notes', 'interviews', 'messages')
AND attname LIKE '%_id'
ORDER BY tablename, attname;

-- 2. Check for tables without primary keys
SELECT 
    n.nspname AS schema_name,
    c.relname AS table_name
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'r'
AND n.nspname = 'public'
AND NOT EXISTS (
    SELECT 1 
    FROM pg_constraint con 
    WHERE con.conrelid = c.oid 
    AND con.contype = 'p'
);

-- 3. Analyze RLS policy performance
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. Check for missing statistics
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    null_frac,
    avg_width
FROM pg_stats
WHERE schemaname = 'public'
AND (n_distinct = 0 OR null_frac = 1);

-- 5. Identify slow queries
SELECT 
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    stddev_exec_time,
    rows
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_%'
AND mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 20;