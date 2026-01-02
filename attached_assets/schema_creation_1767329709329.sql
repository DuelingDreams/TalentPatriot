-- ============================================================================
-- TALENTPATRIOT WORKFLOW INFRASTRUCTURE - SCHEMA CREATION
-- Creates tables needed for stage-based workflow automation
-- Run this first before triggers and functions
-- ============================================================================

-- ============================================================================
-- 1. WORKFLOW TRIGGERS TABLE
-- Stores configuration for automated actions when stage changes occur
-- ============================================================================
CREATE TABLE IF NOT EXISTS workflow_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage TEXT NOT NULL,
  action_type TEXT NOT NULL, -- 'create_task', 'send_email', 'create_approval_workflow', 'trigger_onboarding'
  action_config JSONB NOT NULL, -- Flexible config for each action
  is_active BOOLEAN DEFAULT true,
  execution_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_stage CHECK (stage IN ('applied', 'phone_screen', 'interview', 'offer', 'hired', 'rejected')),
  CONSTRAINT valid_action_type CHECK (action_type IN (
    'create_task', 
    'send_email', 
    'create_approval_workflow', 
    'trigger_onboarding',
    'send_notification'
  ))
);

CREATE INDEX idx_workflow_triggers_stage ON workflow_triggers(stage) WHERE is_active = true;
CREATE INDEX idx_workflow_triggers_active ON workflow_triggers(is_active);

COMMENT ON TABLE workflow_triggers IS 'Stores workflow automation rules triggered by stage changes';
COMMENT ON COLUMN workflow_triggers.action_config IS 'JSON config: {title, description, assigned_to, due_days, notify, etc}';

-- ============================================================================
-- 2. JOB CANDIDATE STAGE HISTORY TABLE
-- Audit trail of all stage changes for compliance and analytics
-- ============================================================================
CREATE TABLE IF NOT EXISTS job_candidate_stage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_candidate_id UUID NOT NULL REFERENCES job_candidate(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES candidates(id) ON DELETE SET NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  from_stage TEXT,
  to_stage TEXT NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  
  CONSTRAINT different_stages CHECK (from_stage IS DISTINCT FROM to_stage)
);

CREATE INDEX idx_stage_history_job_candidate ON job_candidate_stage_history(job_candidate_id);
CREATE INDEX idx_stage_history_candidate ON job_candidate_stage_history(candidate_id);
CREATE INDEX idx_stage_history_job ON job_candidate_stage_history(job_id);
CREATE INDEX idx_stage_history_changed_at ON job_candidate_stage_history(changed_at DESC);

COMMENT ON TABLE job_candidate_stage_history IS 'Audit trail of all stage changes for job candidates';

-- ============================================================================
-- 3. TASKS TABLE
-- Stores workflow tasks created by automation or manually
-- ============================================================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  job_candidate_id UUID REFERENCES job_candidate(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES candidates(id) ON DELETE SET NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT, -- 'phone_screen_form', 'interview_feedback', 'offer_approval', 'generate_offer', 'onboarding'
  
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_status CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  CONSTRAINT completed_consistency CHECK (
    (status = 'completed' AND completed_at IS NOT NULL) OR
    (status != 'completed' AND completed_at IS NULL)
  )
);

CREATE INDEX idx_tasks_org ON tasks(org_id);
CREATE INDEX idx_tasks_job_candidate ON tasks(job_candidate_id);
CREATE INDEX idx_tasks_candidate ON tasks(candidate_id);
CREATE INDEX idx_tasks_job ON tasks(job_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to) WHERE status != 'completed';
CREATE INDEX idx_tasks_status ON tasks(status) WHERE status != 'completed';
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE status != 'completed';
CREATE INDEX idx_tasks_type ON tasks(task_type);

COMMENT ON TABLE tasks IS 'Workflow tasks for recruiters and hiring managers';
COMMENT ON COLUMN tasks.task_type IS 'Type of task: phone_screen_form, interview_feedback, offer_approval, etc.';

-- ============================================================================
-- 4. WORKFLOW EXECUTION LOG (Optional but recommended)
-- Logs all workflow executions for debugging and monitoring
-- ============================================================================
CREATE TABLE IF NOT EXISTS workflow_execution_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_candidate_id UUID REFERENCES job_candidate(id) ON DELETE CASCADE,
  trigger_id UUID REFERENCES workflow_triggers(id) ON DELETE SET NULL,
  stage TEXT NOT NULL,
  action_type TEXT NOT NULL,
  status TEXT NOT NULL, -- 'success', 'failed', 'skipped'
  error_message TEXT,
  execution_time_ms INTEGER,
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_execution_status CHECK (status IN ('success', 'failed', 'skipped'))
);

CREATE INDEX idx_workflow_log_job_candidate ON workflow_execution_log(job_candidate_id);
CREATE INDEX idx_workflow_log_executed_at ON workflow_execution_log(executed_at DESC);
CREATE INDEX idx_workflow_log_status ON workflow_execution_log(status) WHERE status = 'failed';

COMMENT ON TABLE workflow_execution_log IS 'Audit log of all workflow executions for debugging';

-- ============================================================================
-- 5. ADD MISSING COLUMNS TO JOBS TABLE (if needed)
-- ============================================================================

-- Check if jobs table needs status column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'jobs' AND column_name = 'status'
  ) THEN
    ALTER TABLE jobs ADD COLUMN status TEXT DEFAULT 'draft';
    ALTER TABLE jobs ADD CONSTRAINT valid_job_status 
      CHECK (status IN ('draft', 'open', 'on_hold', 'closed'));
  END IF;
END $$;

-- Add other useful job columns if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'jobs' AND column_name = 'close_reason'
  ) THEN
    ALTER TABLE jobs ADD COLUMN close_reason TEXT;
    ALTER TABLE jobs ADD COLUMN is_archived BOOLEAN DEFAULT false;
    ALTER TABLE jobs ADD COLUMN posted_date TIMESTAMPTZ;
    ALTER TABLE jobs ADD COLUMN closed_date TIMESTAMPTZ;
    ALTER TABLE jobs ADD COLUMN filled_by_candidate_id UUID REFERENCES candidates(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================================
-- 6. ENABLE ROW LEVEL SECURITY (RLS) - IMPORTANT FOR MULTI-TENANT
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE workflow_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_candidate_stage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_execution_log ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (customize based on your auth setup)
-- Tasks policy - users can only see tasks in their org
CREATE POLICY tasks_org_isolation ON tasks
  FOR ALL
  USING (org_id = (SELECT org_id FROM auth.users WHERE id = auth.uid()));

-- Stage history policy - users can only see history in their org
CREATE POLICY stage_history_org_isolation ON job_candidate_stage_history
  FOR ALL
  USING (
    job_candidate_id IN (
      SELECT id FROM job_candidate WHERE org_id = (SELECT org_id FROM auth.users WHERE id = auth.uid())
    )
  );

-- Workflow triggers - global config, admins only can modify
CREATE POLICY workflow_triggers_read ON workflow_triggers
  FOR SELECT
  USING (true);

CREATE POLICY workflow_triggers_admin_write ON workflow_triggers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- ============================================================================
-- 7. CREATE UPDATED_AT TRIGGER FOR WORKFLOW_TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workflow_triggers_updated_at
  BEFORE UPDATE ON workflow_triggers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify all tables were created
SELECT 
  table_name,
  'Created' as status
FROM information_schema.tables
WHERE table_name IN (
  'workflow_triggers',
  'job_candidate_stage_history', 
  'tasks',
  'workflow_execution_log'
)
ORDER BY table_name;

-- Show table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE tablename IN (
  'workflow_triggers',
  'job_candidate_stage_history',
  'tasks', 
  'workflow_execution_log'
)
ORDER BY tablename;

SELECT '✓ Schema creation completed successfully!' as result;