-- Job-Specific Pipeline Migration
-- Updates pipeline_columns to be job-specific instead of organization-wide

-- Step 1: Add job_id column if it doesn't exist
ALTER TABLE pipeline_columns 
ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES jobs(id);

-- Step 2: Create indexes for job-specific pipelines
CREATE INDEX IF NOT EXISTS idx_pipeline_cols_job_pos ON pipeline_columns(job_id, position);
CREATE INDEX IF NOT EXISTS idx_pipeline_cols_job_id ON pipeline_columns(job_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_cols_org_job ON pipeline_columns(org_id, job_id);

-- Step 3: Create unique constraint for position per job
-- First drop existing constraints that might conflict
ALTER TABLE pipeline_columns DROP CONSTRAINT IF EXISTS unique_job_position;

-- Add the new unique constraint
ALTER TABLE pipeline_columns 
ADD CONSTRAINT unique_job_position UNIQUE (job_id, position);

-- Step 4: Update job_candidate table to ensure proper foreign keys
-- Ensure pipeline_column_id references are maintained
-- (This should already exist from Drizzle schema)

-- Step 5: Clean up any orphaned pipeline columns without job_id
-- (Optional - for safety, we'll keep them for now)
-- DELETE FROM pipeline_columns WHERE job_id IS NULL;

-- Step 6: Add constraints and comments
COMMENT ON COLUMN pipeline_columns.job_id IS 'Job-specific pipeline columns (NULL for legacy org-wide pipelines)';
COMMENT ON INDEX idx_pipeline_cols_job_pos IS 'Performance index for job-specific pipeline column ordering';

-- Migration completed
SELECT 'Job-specific pipeline migration completed successfully' as result;