-- ===============================================
-- v_candidate_skills_flattened View
-- ===============================================
-- This view unpacks the skills array from candidates and assigns
-- skill categories for analytics and reporting purposes.
--
-- USAGE:
-- 1. Run this SQL in your Supabase SQL Editor
-- 2. The view will be available for analytics queries
--
-- DEPENDENCIES:
-- - Requires v_candidate_skills_summary view to exist first
--
-- SKILL CATEGORIES:
-- - Programming Language: Python, Java, C++, JavaScript, TypeScript, Go, PHP, Ruby
-- - Cloud / DevOps: AWS, Azure, GCP, Kubernetes, Docker, Terraform
-- - Framework / Library: React, Angular, Vue, Node.js, Django, Spring
-- - Other: Any skill not matching the above categories

CREATE OR REPLACE VIEW public.v_candidate_skills_flattened AS
SELECT
    s.id AS candidate_id,
    s.org_id,
    s.name AS candidate_name,
    s.email,
    s.experience_level,
    s.total_years_experience,
    s.total_skills_count,
    skill AS skill_name,
    CASE
        WHEN skill ILIKE ANY (ARRAY['Python','Java','C++','JavaScript','TypeScript','Go','PHP','Ruby','C#','Kotlin','Swift','Rust','Scala']) THEN 'Programming Language'
        WHEN skill ILIKE ANY (ARRAY['AWS','Azure','GCP','Kubernetes','Docker','Terraform','CI/CD','Jenkins','GitHub Actions','CloudFormation']) THEN 'Cloud / DevOps'
        WHEN skill ILIKE ANY (ARRAY['React','Angular','Vue','Node.js','Django','Spring','Express','FastAPI','Flask','Next.js','Rails']) THEN 'Framework / Library'
        WHEN skill ILIKE ANY (ARRAY['PostgreSQL','MySQL','MongoDB','Redis','Elasticsearch','DynamoDB','SQLite','Oracle']) THEN 'Database'
        WHEN skill ILIKE ANY (ARRAY['Machine Learning','AI','TensorFlow','PyTorch','Data Science','NLP','Computer Vision']) THEN 'AI / ML'
        ELSE 'Other'
    END AS skill_category,
    s.created_at,
    s.updated_at
FROM public.v_candidate_skills_summary s
JOIN LATERAL unnest(s.skills) AS skill ON true;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_v_candidate_skills_flattened_org 
ON candidates(org_id) WHERE skills IS NOT NULL;

-- Grant permissions for authenticated users
GRANT SELECT ON public.v_candidate_skills_flattened TO authenticated;
GRANT SELECT ON public.v_candidate_skills_flattened TO anon;

-- Example queries:
-- 
-- Get top skills by category:
-- SELECT skill_category, skill_name, COUNT(*) as candidate_count
-- FROM v_candidate_skills_flattened
-- WHERE org_id = 'your-org-id'
-- GROUP BY skill_category, skill_name
-- ORDER BY candidate_count DESC;
--
-- Get skills grouped by category:
-- SELECT skill_category, COUNT(DISTINCT skill_name) as unique_skills, COUNT(*) as total_candidates
-- FROM v_candidate_skills_flattened
-- WHERE org_id = 'your-org-id'
-- GROUP BY skill_category
-- ORDER BY total_candidates DESC;
