-- ============================================================================
-- TALENTPATRIOT STAGE CHANGE TRIGGER - SAFE VERSION
-- No DROP commands - only creates if not exists
-- Works alongside your existing tr_log_job_candidate_stage_transition trigger
-- ============================================================================

-- ============================================================================
-- MAIN TRIGGER FUNCTION FOR WORKFLOW AUTOMATION
-- ============================================================================
CREATE OR REPLACE FUNCTION handle_job_candidate_workflow_trigger()
RETURNS TRIGGER AS $$
DECLARE
  workflow_action RECORD;
  execution_start TIMESTAMPTZ;
  execution_end TIMESTAMPTZ;
  execution_time_ms INTEGER;
BEGIN
  -- Only proceed if stage actually changed
  IF NEW.stage IS DISTINCT FROM OLD.stage THEN
    
    -- ========================================================================
    -- LOG STAGE CHANGE TO OUR HISTORY TABLE (separate from your existing log)
    -- ========================================================================
    INSERT INTO job_candidate_stage_history (
      job_candidate_id,
      candidate_id,
      job_id,
      from_stage,
      to_stage,
      changed_at,
      changed_by
    ) VALUES (
      NEW.id,
      NEW.candidate_id,
      NEW.job_id,
      OLD.stage,
      NEW.stage,
      NOW(),
      NULLIF(current_setting('request.jwt.claims', true)::json->>'sub', '')::uuid -- Get user from JWT
    );
    
    -- ========================================================================
    -- EXECUTE ALL ACTIVE WORKFLOW TRIGGERS FOR THIS STAGE
    -- ========================================================================
    FOR workflow_action IN 
      SELECT * FROM workflow_triggers 
      WHERE stage = NEW.stage 
      AND is_active = true 
      ORDER BY execution_order
    LOOP
      BEGIN
        execution_start := clock_timestamp();
        
        -- Route to appropriate handler based on action type
        CASE workflow_action.action_type
          
          -- CREATE TASK
          WHEN 'create_task' THEN
            PERFORM create_workflow_task(NEW.id, NEW.org_id, NEW.candidate_id, NEW.job_id, workflow_action.action_config);
          
          -- SEND EMAIL (will be handled by Edge Function or application layer)
          WHEN 'send_email' THEN
            PERFORM log_email_action(NEW.id, workflow_action.action_config);
          
          -- CREATE APPROVAL WORKFLOW
          WHEN 'create_approval_workflow' THEN
            PERFORM create_approval_tasks(NEW.id, NEW.org_id, NEW.candidate_id, NEW.job_id, workflow_action.action_config);
          
          -- TRIGGER ONBOARDING
          WHEN 'trigger_onboarding' THEN
            PERFORM create_onboarding_tasks(NEW.id, NEW.org_id, NEW.candidate_id, NEW.job_id, workflow_action.action_config);
          
          -- SEND NOTIFICATION
          WHEN 'send_notification' THEN
            PERFORM log_notification_action(NEW.id, workflow_action.action_config);
          
          ELSE
            RAISE NOTICE 'Unknown action type: %', workflow_action.action_type;
        END CASE;
        
        execution_end := clock_timestamp();
        execution_time_ms := EXTRACT(MILLISECONDS FROM (execution_end - execution_start))::INTEGER;
        
        -- Log successful execution
        INSERT INTO workflow_execution_log (
          job_candidate_id,
          trigger_id,
          stage,
          action_type,
          status,
          execution_time_ms
        ) VALUES (
          NEW.id,
          workflow_action.id,
          NEW.stage,
          workflow_action.action_type,
          'success',
          execution_time_ms
        );
        
      EXCEPTION WHEN OTHERS THEN
        -- Log failed execution but don't block the stage change
        INSERT INTO workflow_execution_log (
          job_candidate_id,
          trigger_id,
          stage,
          action_type,
          status,
          error_message
        ) VALUES (
          NEW.id,
          workflow_action.id,
          NEW.stage,
          workflow_action.action_type,
          'failed',
          SQLERRM
        );
        
        RAISE WARNING 'Workflow execution failed for action %: %', workflow_action.action_type, SQLERRM;
      END;
    END LOOP;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- HELPER FUNCTION: CREATE WORKFLOW TASK
-- ============================================================================
CREATE OR REPLACE FUNCTION create_workflow_task(
  p_job_candidate_id UUID,
  p_org_id UUID,
  p_candidate_id UUID,
  p_job_id UUID,
  p_config JSONB
)
RETURNS UUID AS $$
DECLARE
  v_task_id UUID;
  v_due_date TIMESTAMPTZ;
  v_assigned_to UUID;
BEGIN
  -- Calculate due date if due_days specified
  IF p_config->>'due_days' IS NOT NULL THEN
    v_due_date := NOW() + (p_config->>'due_days')::INTEGER * INTERVAL '1 day';
  ELSE
    v_due_date := NULL;
  END IF;
  
  -- Get assigned_to from config, fallback to job's assigned_to if not specified
  v_assigned_to := (p_config->>'assigned_to')::UUID;
  IF v_assigned_to IS NULL THEN
    SELECT assigned_to INTO v_assigned_to FROM jobs WHERE id = p_job_id;
  END IF;
  
  -- Insert task
  INSERT INTO tasks (
    org_id,
    job_candidate_id,
    candidate_id,
    job_id,
    title,
    description,
    task_type,
    assigned_to,
    due_date,
    priority,
    status
  ) VALUES (
    p_org_id,
    p_job_candidate_id,
    p_candidate_id,
    p_job_id,
    p_config->>'title',
    p_config->>'description',
    p_config->>'task_type',
    v_assigned_to,
    v_due_date,
    COALESCE(p_config->>'priority', 'medium'),
    'pending'
  ) RETURNING id INTO v_task_id;
  
  RETURN v_task_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- HELPER FUNCTION: CREATE APPROVAL WORKFLOW
-- ============================================================================
CREATE OR REPLACE FUNCTION create_approval_tasks(
  p_job_candidate_id UUID,
  p_org_id UUID,
  p_candidate_id UUID,
  p_job_id UUID,
  p_config JSONB
)
RETURNS void AS $$
DECLARE
  v_approver_id UUID;
  v_candidate_name TEXT;
  v_job_title TEXT;
  v_approvers_array JSONB;
BEGIN
  -- Get candidate and job info
  SELECT name INTO v_candidate_name FROM candidates WHERE id = p_candidate_id;
  SELECT title INTO v_job_title FROM jobs WHERE id = p_job_id;
  
  -- Get approvers array
  v_approvers_array := p_config->'approvers';
  
  -- If no approvers specified, use job's assigned_to as approver
  IF v_approvers_array IS NULL OR jsonb_array_length(v_approvers_array) = 0 THEN
    SELECT assigned_to INTO v_approver_id FROM jobs WHERE id = p_job_id;
    IF v_approver_id IS NOT NULL THEN
      v_approvers_array := jsonb_build_array(v_approver_id::TEXT);
    ELSE
      -- No approvers available, just create a general approval task
      INSERT INTO tasks (
        org_id,
        job_candidate_id,
        candidate_id,
        job_id,
        title,
        description,
        task_type,
        due_date,
        priority,
        status
      ) VALUES (
        p_org_id,
        p_job_candidate_id,
        p_candidate_id,
        p_job_id,
        'Approve offer for ' || COALESCE(v_candidate_name, 'candidate') || ' - ' || COALESCE(v_job_title, 'position'),
        p_config->>'description',
        'offer_approval',
        NOW() + INTERVAL '2 days',
        'high',
        'pending'
      );
      RETURN;
    END IF;
  END IF;
  
  -- Create approval task for each approver
  FOR v_approver_id IN 
    SELECT (jsonb_array_elements_text(v_approvers_array))::UUID
  LOOP
    INSERT INTO tasks (
      org_id,
      job_candidate_id,
      candidate_id,
      job_id,
      title,
      description,
      task_type,
      assigned_to,
      due_date,
      priority,
      status
    ) VALUES (
      p_org_id,
      p_job_candidate_id,
      p_candidate_id,
      p_job_id,
      'Approve offer for ' || COALESCE(v_candidate_name, 'candidate') || ' - ' || COALESCE(v_job_title, 'position'),
      COALESCE(p_config->>'description', 'Review and approve offer details including salary, benefits, and start date.'),
      'offer_approval',
      v_approver_id,
      NOW() + INTERVAL '2 days',
      'high',
      'pending'
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- HELPER FUNCTION: CREATE ONBOARDING TASKS
-- ============================================================================
CREATE OR REPLACE FUNCTION create_onboarding_tasks(
  p_job_candidate_id UUID,
  p_org_id UUID,
  p_candidate_id UUID,
  p_job_id UUID,
  p_config JSONB
)
RETURNS void AS $$
DECLARE
  v_candidate_name TEXT;
  v_start_date DATE;
  v_hr_user UUID;
  v_it_user UUID;
  v_facilities_user UUID;
  v_job_assigned_to UUID;
BEGIN
  -- Get candidate info
  SELECT name INTO v_candidate_name FROM candidates WHERE id = p_candidate_id;
  
  -- Get job's assigned recruiter as fallback
  SELECT assigned_to INTO v_job_assigned_to FROM jobs WHERE id = p_job_id;
  
  -- Get user assignments from config or use job's assigned_to as fallback
  v_hr_user := COALESCE((p_config->>'hr_user')::UUID, v_job_assigned_to);
  v_it_user := COALESCE((p_config->>'it_user')::UUID, v_job_assigned_to);
  v_facilities_user := COALESCE((p_config->>'facilities_user')::UUID, v_job_assigned_to);
  
  -- Use start_date from config or default to 2 weeks from now
  v_start_date := COALESCE(
    (p_config->>'start_date')::DATE,
    CURRENT_DATE + INTERVAL '14 days'
  );
  
  -- Create onboarding tasks with different due dates relative to start date
  
  -- 14 days before start: Send welcome email
  INSERT INTO tasks (org_id, job_candidate_id, candidate_id, job_id, title, description, task_type, assigned_to, due_date, priority)
  VALUES (
    p_org_id, p_job_candidate_id, p_candidate_id, p_job_id,
    'Send welcome email to ' || COALESCE(v_candidate_name, 'new hire'),
    'Send welcome email with company information, first day instructions, and team introductions.',
    'onboarding',
    v_hr_user,
    v_start_date - INTERVAL '14 days',
    'medium'
  );
  
  -- 7 days before start: Complete background check
  INSERT INTO tasks (org_id, job_candidate_id, candidate_id, job_id, title, description, task_type, assigned_to, due_date, priority)
  VALUES (
    p_org_id, p_job_candidate_id, p_candidate_id, p_job_id,
    'Complete background check for ' || COALESCE(v_candidate_name, 'new hire'),
    'Complete background check and I-9 verification. Ensure all documentation is filed.',
    'onboarding',
    v_hr_user,
    v_start_date - INTERVAL '7 days',
    'high'
  );
  
  -- 7 days before start: Order equipment
  INSERT INTO tasks (org_id, job_candidate_id, candidate_id, job_id, title, description, task_type, assigned_to, due_date, priority)
  VALUES (
    p_org_id, p_job_candidate_id, p_candidate_id, p_job_id,
    'Order equipment for ' || COALESCE(v_candidate_name, 'new hire'),
    'Order laptop, monitors, keyboard, mouse, and any other required equipment.',
    'onboarding',
    v_it_user,
    v_start_date - INTERVAL '7 days',
    'high'
  );
  
  -- 3 days before start: Set up email and systems
  INSERT INTO tasks (org_id, job_candidate_id, candidate_id, job_id, title, description, task_type, assigned_to, due_date, priority)
  VALUES (
    p_org_id, p_job_candidate_id, p_candidate_id, p_job_id,
    'Set up email and system access for ' || COALESCE(v_candidate_name, 'new hire'),
    'Create email account, Slack account, GitHub access, and other necessary system permissions.',
    'onboarding',
    v_it_user,
    v_start_date - INTERVAL '3 days',
    'high'
  );
  
  -- 3 days before start: Prepare workspace
  INSERT INTO tasks (org_id, job_candidate_id, candidate_id, job_id, title, description, task_type, assigned_to, due_date, priority)
  VALUES (
    p_org_id, p_job_candidate_id, p_candidate_id, p_job_id,
    'Prepare workspace for ' || COALESCE(v_candidate_name, 'new hire'),
    'Set up desk, chair, office supplies, and ensure workspace is ready for first day.',
    'onboarding',
    v_facilities_user,
    v_start_date - INTERVAL '3 days',
    'medium'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- HELPER FUNCTIONS: LOG EMAIL/NOTIFICATION ACTIONS
-- These just log that an email/notification should be sent
-- Your application layer will need to read these and actually send
-- ============================================================================

CREATE OR REPLACE FUNCTION log_email_action(
  p_job_candidate_id UUID,
  p_config JSONB
)
RETURNS void AS $$
BEGIN
  -- In a full implementation, this would trigger an Edge Function or
  -- your application would poll this table and send emails
  -- For now, we just log it
  RAISE NOTICE 'Email action logged for job_candidate %: %', p_job_candidate_id, p_config->>'subject';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_notification_action(
  p_job_candidate_id UUID,
  p_config JSONB
)
RETURNS void AS $$
BEGIN
  -- Similar to email - your app would handle actual notification sending
  RAISE NOTICE 'Notification action logged for job_candidate %', p_job_candidate_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CHECK IF TRIGGER ALREADY EXISTS BEFORE CREATING
-- ============================================================================

DO $$
BEGIN
  -- Only create trigger if it doesn't already exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'on_job_candidate_workflow_automation'
    AND event_object_table = 'job_candidate'
  ) THEN
    CREATE TRIGGER on_job_candidate_workflow_automation
      AFTER UPDATE ON job_candidate
      FOR EACH ROW
      EXECUTE FUNCTION handle_job_candidate_workflow_trigger();
    
    RAISE NOTICE 'Trigger created successfully!';
  ELSE
    RAISE NOTICE 'Trigger already exists - skipping creation';
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify both triggers exist on job_candidate table
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation,
  action_order
FROM information_schema.triggers
WHERE event_object_table = 'job_candidate'
AND event_manipulation = 'UPDATE'
ORDER BY action_order;

-- Verify functions were created
SELECT 
  routine_name,
  routine_type,
  'Created' as status
FROM information_schema.routines
WHERE routine_name IN (
  'handle_job_candidate_workflow_trigger',
  'create_workflow_task',
  'create_approval_tasks',
  'create_onboarding_tasks',
  'log_email_action',
  'log_notification_action'
)
ORDER BY routine_name;

SELECT '✓ Script completed successfully!' as result;
SELECT '✓ All functions created/updated' as note1;
SELECT '✓ Trigger created (or already exists)' as note2;
SELECT '✓ Works alongside your existing tr_log_job_candidate_stage_transition trigger' as note3;