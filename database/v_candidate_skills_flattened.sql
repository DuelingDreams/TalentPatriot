-- ===============================================
-- v_candidate_skills_flattened View
-- ===============================================
-- This view unpacks the skills array directly from the candidates table
-- and assigns skill categories for analytics and reporting purposes.
--
-- NOTE: This view pulls from the candidates table directly, not from
-- demo/test data. All candidates with skills will appear in reports.
--
-- SECURITY: Do NOT grant public access to this view. The backend
-- uses supabaseAdmin (service role) with explicit org_id filtering
-- to ensure multi-tenant data isolation.
--
-- SKILL CATEGORIES:
-- - Programming Language: Python, Java, C++, JavaScript, TypeScript, Go, PHP, Ruby
-- - Cloud / DevOps: AWS, Azure, GCP, Kubernetes, Docker, Terraform
-- - Framework / Library: React, Angular, Vue, Node.js, Django, Spring
-- - Other: Any skill not matching the above categories

DROP VIEW IF EXISTS public.v_candidate_skills_flattened;

CREATE VIEW public.v_candidate_skills_flattened AS
SELECT
    c.id AS candidate_id,
    c.org_id,  -- Required for multi-tenant filtering
    c.name AS candidate_name,
    c.email,
    c.experience_level,
    c.total_years_experience,
    array_length(c.skills, 1) AS total_skills_count,
    skill AS skill_name,
    CASE
        WHEN skill ILIKE ANY (ARRAY['Python','Java','C++','JavaScript','TypeScript','Go','PHP','Ruby']) THEN 'Programming Language'
        WHEN skill ILIKE ANY (ARRAY['AWS','Azure','GCP','Kubernetes','Docker','Terraform']) THEN 'Cloud / DevOps'
        WHEN skill ILIKE ANY (ARRAY['React','Angular','Vue','Node.js','Django','Spring']) THEN 'Framework / Library'
        ELSE 'Other'
    END AS skill_category,
    c.created_at,
    c.updated_at
FROM candidates c
JOIN LATERAL unnest(c.skills) AS skill ON true
WHERE c.skills IS NOT NULL;

-- IMPORTANT: Do NOT add public grants. Access should be via service role only.
-- If you previously ran GRANT statements, revoke them:
-- REVOKE SELECT ON public.v_candidate_skills_flattened FROM anon, authenticated;

-- Example queries (run via service role / backend only):
-- 
-- Get top skills by category for an organization:
-- SELECT skill_category, skill_name, COUNT(DISTINCT candidate_id) as candidate_count
-- FROM v_candidate_skills_flattened
-- WHERE org_id = 'your-org-id'
-- GROUP BY skill_category, skill_name
-- ORDER BY candidate_count DESC;
--
-- Get skills summary by category:
-- SELECT skill_category, COUNT(DISTINCT skill_name) as unique_skills, COUNT(DISTINCT candidate_id) as total_candidates
-- FROM v_candidate_skills_flattened
-- WHERE org_id = 'your-org-id'
-- GROUP BY skill_category
-- ORDER BY total_candidates DESC;
