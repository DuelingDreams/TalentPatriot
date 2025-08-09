-- Job Slug Generation and Validation Migration
-- This migration adds database constraints, indexes, and triggers for the job slug system

-- 1. Ensure slug column has proper constraints and indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_jobs_slug ON jobs(public_slug);
CREATE INDEX IF NOT EXISTS idx_jobs_open_published ON jobs(status, published_at DESC) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_jobs_org_status ON jobs(org_id, status);

-- 2. Add trigger to keep updated_at current on UPDATE
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to jobs table
DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;
CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3. Add CHECK constraint for published_at consistency
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS chk_published_at_status;
ALTER TABLE jobs ADD CONSTRAINT chk_published_at_status 
    CHECK ((status = 'open' AND published_at IS NOT NULL) OR (status != 'open'));

-- 4. Populate slugs for existing jobs without them
DO $$
DECLARE
    job_record RECORD;
    slug_base TEXT;
    slug_candidate TEXT;
    counter INTEGER;
BEGIN
    FOR job_record IN 
        SELECT id, title FROM jobs WHERE public_slug IS NULL
    LOOP
        -- Generate base slug from title
        slug_base := lower(regexp_replace(job_record.title, '[^a-zA-Z0-9\s-]', '', 'g'));
        slug_base := regexp_replace(slug_base, '\s+', '-', 'g');
        slug_base := trim(both '-' from slug_base);
        slug_base := left(slug_base, 50);
        
        -- Find unique slug
        counter := 0;
        slug_candidate := slug_base || '-' || substring(job_record.id::text from 1 for 8);
        
        WHILE EXISTS (SELECT 1 FROM jobs WHERE public_slug = slug_candidate) LOOP
            counter := counter + 1;
            slug_candidate := slug_base || '-' || substring(job_record.id::text from 1 for 8) || '-' || counter;
        END LOOP;
        
        -- Update job with unique slug
        UPDATE jobs SET public_slug = slug_candidate WHERE id = job_record.id;
    END LOOP;
END $$;

-- 5. Make public_slug NOT NULL after populating existing records
ALTER TABLE jobs ALTER COLUMN public_slug SET NOT NULL;

-- 6. Add performance indexes for careers page queries
CREATE INDEX IF NOT EXISTS idx_jobs_careers_public ON jobs(status, published_at DESC, org_id) 
    WHERE status = 'open' AND published_at IS NOT NULL;

COMMENT ON INDEX idx_jobs_slug IS 'Unique constraint for job slugs used in public URLs';
COMMENT ON INDEX idx_jobs_open_published IS 'Performance index for public job listings';
COMMENT ON INDEX idx_jobs_careers_public IS 'Optimized index for careers page queries';