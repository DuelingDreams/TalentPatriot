-- Comprehensive Supabase Schema Export Script
-- Copy and paste this entire script into the Supabase SQL Editor

-- ==========================================
-- 1. ENUM TYPES AND VALUES
-- ==========================================
SELECT 'ENUMS:' AS info_type;

SELECT 
    t.typname AS enum_name,
    array_agg(e.enumlabel ORDER BY e.enumsortorder) AS enum_values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname IN (
    'job_status', 'job_type', 'application_status', 'candidate_stage',
    'record_status', 'user_role', 'org_role', 'interview_type', 
    'interview_status', 'message_type', 'message_priority',
    'experience_level', 'remote_option'
)
GROUP BY t.typname
ORDER BY t.typname;

-- ==========================================
-- 2. TABLE SCHEMAS
-- ==========================================
SELECT 'TABLES:' AS info_type;

SELECT 
    t.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default,
    c.character_maximum_length,
    CASE 
        WHEN tc.constraint_type = 'PRIMARY KEY' THEN 'PRIMARY KEY'
        WHEN tc.constraint_type = 'FOREIGN KEY' THEN 'FOREIGN KEY'
        WHEN tc.constraint_type = 'UNIQUE' THEN 'UNIQUE'
        ELSE ''
    END AS constraint_type,
    CASE 
        WHEN tc.constraint_type = 'FOREIGN KEY' THEN 
            ccu.table_name || '(' || ccu.column_name || ')'
        ELSE ''
    END AS references
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
LEFT JOIN information_schema.key_column_usage kcu ON c.table_name = kcu.table_name AND c.column_name = kcu.column_name
LEFT JOIN information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
    AND t.table_name IN (
        'organizations', 'user_profiles', 'user_settings', 'user_organizations',
        'clients', 'jobs', 'candidates', 'job_candidate', 'candidate_notes',
        'pipeline_columns', 'interviews', 'messages', 'message_recipients'
    )
ORDER BY t.table_name, c.ordinal_position;

-- ==========================================
-- 3. FOREIGN KEY RELATIONSHIPS
-- ==========================================
SELECT 'FOREIGN KEYS:' AS info_type;

SELECT
    tc.table_name as table_name,
    kcu.column_name as column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name as constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
    AND tc.table_name IN (
        'organizations', 'user_profiles', 'user_settings', 'user_organizations',
        'clients', 'jobs', 'candidates', 'job_candidate', 'candidate_notes',
        'pipeline_columns', 'interviews', 'messages', 'message_recipients'
    )
ORDER BY tc.table_name, kcu.column_name;

-- ==========================================
-- 4. INDEXES
-- ==========================================
SELECT 'INDEXES:' AS info_type;

SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN (
        'organizations', 'user_profiles', 'user_settings', 'user_organizations',
        'clients', 'jobs', 'candidates', 'job_candidate', 'candidate_notes',
        'pipeline_columns', 'interviews', 'messages', 'message_recipients'
    )
ORDER BY tablename, indexname;

-- ==========================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================
SELECT 'RLS POLICIES:' AS info_type;

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
    AND tablename IN (
        'organizations', 'user_profiles', 'user_settings', 'user_organizations',
        'clients', 'jobs', 'candidates', 'job_candidate', 'candidate_notes',
        'pipeline_columns', 'interviews', 'messages', 'message_recipients'
    )
ORDER BY tablename, policyname;

-- ==========================================
-- 6. RLS ENABLED TABLES
-- ==========================================
SELECT 'RLS ENABLED:' AS info_type;

SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
    AND tablename IN (
        'organizations', 'user_profiles', 'user_settings', 'user_organizations',
        'clients', 'jobs', 'candidates', 'job_candidate', 'candidate_notes',
        'pipeline_columns', 'interviews', 'messages', 'message_recipients'
    )
ORDER BY tablename;

-- ==========================================
-- 7. DATABASE FUNCTIONS (TRIGGERS)
-- ==========================================
SELECT 'DATABASE FUNCTIONS:' AS info_type;

SELECT 
    routine_name,
    routine_type,
    data_type as return_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public'
    AND (routine_name LIKE '%user%' OR routine_name LIKE '%org%' OR routine_name LIKE '%auth%')
ORDER BY routine_name;

-- ==========================================
-- 8. TRIGGERS
-- ==========================================
SELECT 'TRIGGERS:' AS info_type;

SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
    AND event_object_table IN (
        'organizations', 'user_profiles', 'user_settings', 'user_organizations',
        'clients', 'jobs', 'candidates', 'job_candidate', 'candidate_notes',
        'pipeline_columns', 'interviews', 'messages', 'message_recipients'
    )
ORDER BY event_object_table, trigger_name;

-- ==========================================
-- 9. SAMPLE DATA COUNTS
-- ==========================================
SELECT 'DATA COUNTS:' AS info_type;

SELECT 'organizations' as table_name, COUNT(*) as row_count FROM organizations
UNION ALL
SELECT 'user_profiles' as table_name, COUNT(*) as row_count FROM user_profiles
UNION ALL
SELECT 'user_organizations' as table_name, COUNT(*) as row_count FROM user_organizations
UNION ALL
SELECT 'jobs' as table_name, COUNT(*) as row_count FROM jobs
UNION ALL
SELECT 'candidates' as table_name, COUNT(*) as row_count FROM candidates
UNION ALL
SELECT 'clients' as table_name, COUNT(*) as row_count FROM clients
ORDER BY table_name;

-- ==========================================
-- 10. AUTH SCHEMA INFO (if accessible)
-- ==========================================
SELECT 'AUTH SCHEMA:' AS info_type;

-- Check if auth schema is accessible
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'auth' 
    AND table_name IN ('users', 'identities')
ORDER BY table_name, ordinal_position;