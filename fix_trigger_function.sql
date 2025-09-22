-- Fix for the job candidate stage transition trigger function
-- This fixes the "operator does not exist: text = candidate_stage" error

-- Drop and recreate the trigger function with proper enum type handling
CREATE OR REPLACE FUNCTION public._log_job_candidate_stage_transition()
RETURNS TRIGGER AS $$
DECLARE
    prev_stage candidate_stage; -- Changed from TEXT to candidate_stage enum
BEGIN
    -- Get previous stage from shadow table
    IF tg_op = 'INSERT' THEN
        prev_stage := null;
    ELSE
        prev_stage := (
            SELECT last_stage::candidate_stage -- Explicit cast to enum
            FROM public._job_candidate_stage_shadow 
            WHERE job_candidate_id = new.id
        );
    END IF;

    -- Log transition if stage actually changed
    IF prev_stage IS DISTINCT FROM new.stage THEN
        INSERT INTO public.job_pipeline_stage_events(
            org_id, 
            job_id, 
            candidate_id, 
            job_candidate_id,
            from_stage, 
            to_stage, 
            changed_at, 
            changed_by
        )
        VALUES (
            new.org_id,
            new.job_id,
            new.candidate_id,
            new.id,
            prev_stage,
            new.stage,
            new.updated_at,
            auth.uid()
        );

        -- Update shadow table
        INSERT INTO public._job_candidate_stage_shadow(job_candidate_id, last_stage, updated_at)
        VALUES (new.id, new.stage, new.updated_at)
        ON CONFLICT (job_candidate_id) DO UPDATE
        SET last_stage = excluded.last_stage, updated_at = excluded.updated_at;
    END IF;

    RETURN new;
END
$$ LANGUAGE plpgsql;