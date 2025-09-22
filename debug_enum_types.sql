-- Enum Types Investigation Script
-- Run this in Supabase SQL editor to check enum type definitions and usage

-- 1. Check all enum types in the database
SELECT 
  t.typname as enum_name,
  array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values,
  t.typowner,
  n.nspname as schema_name
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON t.typnamespace = n.oid
GROUP BY t.typname, t.typowner, n.nspname
ORDER BY t.typname;

-- 2. Specifically check candidate_stage enum
SELECT 
  t.typname as enum_name,
  e.enumlabel as enum_value,
  e.enumsortorder as sort_order
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'candidate_stage'
ORDER BY e.enumsortorder;

-- 3. Check which tables and columns use candidate_stage enum
SELECT 
  c.table_schema,
  c.table_name,
  c.column_name,
  c.data_type,
  c.udt_name,
  c.is_nullable,
  c.column_default
FROM information_schema.columns c
WHERE c.udt_name = 'candidate_stage'
ORDER BY c.table_name, c.column_name;

-- 4. Test enum casting and comparison operations
-- This will help identify if there are casting issues
SELECT 
  'applied'::candidate_stage as test_applied,
  'hired'::candidate_stage as test_hired,
  ('applied'::candidate_stage = 'applied'::candidate_stage) as enum_equality_test,
  ('applied'::text = 'applied'::candidate_stage) as text_enum_comparison;

-- 5. Check for any custom operators defined for candidate_stage
SELECT 
  o.oprname as operator_name,
  tl.typname as left_type,
  tr.typname as right_type,
  tres.typname as result_type,
  o.oprcode as operator_function
FROM pg_operator o
LEFT JOIN pg_type tl ON o.oprleft = tl.oid
LEFT JOIN pg_type tr ON o.oprright = tr.oid  
LEFT JOIN pg_type tres ON o.oprresult = tres.oid
WHERE tl.typname = 'candidate_stage' 
   OR tr.typname = 'candidate_stage'
   OR o.oprname = '='
ORDER BY o.oprname;