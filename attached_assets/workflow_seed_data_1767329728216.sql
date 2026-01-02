-- ============================================================================
-- TALENTPATRIOT WORKFLOW SEED DATA
-- Populates workflow_triggers with automation rules for each stage
-- Customize the UUIDs and configurations to match your org
-- ============================================================================

-- Clear existing workflow triggers (optional - comment out if you want to keep existing)
-- TRUNCATE workflow_triggers CASCADE;

-- ============================================================================
-- STAGE: APPLIED
-- When a candidate applies, create initial screening task
-- ============================================================================

INSERT INTO workflow_triggers (stage, action_type, action_config, execution_order) VALUES
(
  'applied',
  'create_task',
  '{
    "title": "Review application",
    "description": "Review candidate application and resume. Move to phone_screen if qualified.",
    "task_type": "application_review",
    "assigned_to": null,
    "due_days": 2,
    "priority": "medium",
    "notify": true
  }'::jsonb,
  1
),
(
  'applied',
  'send_email',
  '{
    "to_candidate": true,
    "subject": "Application Received - {job_title}",
    "template": "application_received",
    "body": "Thank you for applying to {job_title}. We have received your application and will review it shortly."
  }'::jsonb,
  2
);

-- ============================================================================
-- STAGE: PHONE_SCREEN
-- Create phone screen evaluation task
-- ============================================================================

INSERT INTO workflow_triggers (stage, action_type, action_config, execution_order) VALUES
(
  'phone_screen',
  'create_task',
  '{
    "title": "Complete phone screen form",
    "description": "Conduct phone screen and complete evaluation form. Assess: technical skills, communication, culture fit, salary expectations.",
    "task_type": "phone_screen_form",
    "assigned_to": null,
    "due_days": 1,
    "priority": "high",
    "notify": true
  }'::jsonb,
  1
),
(
  'phone_screen',
  'send_email',
  '{
    "to_candidate": true,
    "subject": "Phone Screen Scheduled - {job_title}",
    "template": "phone_screen_scheduled",
    "body": "We would like to schedule a phone screen to discuss the {job_title} position. Please use the following link to book a time: {scheduling_link}"
  }'::jsonb,
  2
);

-- ============================================================================
-- STAGE: INTERVIEW
-- Create interview feedback task for each interviewer
-- ============================================================================

INSERT INTO workflow_triggers (stage, action_type, action_config, execution_order) VALUES
(
  'interview',
  'create_task',
  '{
    "title": "Upload interview feedback form",
    "description": "Complete detailed interview feedback. Evaluate: technical competency, problem solving, teamwork, cultural alignment. Provide hire/no-hire recommendation.",
    "task_type": "interview_feedback",
    "assigned_to": null,
    "due_days": 1,
    "priority": "high",
    "notify": true
  }'::jsonb,
  1
),
(
  'interview',
  'send_email',
  '{
    "to_candidate": true,
    "subject": "Interview Scheduled - {job_title}",
    "template": "interview_scheduled",
    "body": "Congratulations! We would like to invite you to interview for the {job_title} position. Interview details: {interview_details}"
  }'::jsonb,
  2
),
(
  'interview',
  'send_notification',
  '{
    "notify_hiring_manager": true,
    "message": "Candidate {candidate_name} has been moved to interview stage for {job_title}"
  }'::jsonb,
  3
);

-- ============================================================================
-- STAGE: OFFER
-- Create approval workflow and offer generation tasks
-- ============================================================================

INSERT INTO workflow_triggers (stage, action_type, action_config, execution_order) VALUES
(
  'offer',
  'create_approval_workflow',
  '{
    "approvers": [],
    "description": "Review and approve offer details: salary, benefits, start date, equity. Verify budget approval.",
    "approval_type": "offer"
  }'::jsonb,
  1
),
(
  'offer',
  'create_task',
  '{
    "title": "Generate offer letter",
    "description": "Create formal offer letter with approved compensation and terms. Include: salary, benefits, start date, reporting structure.",
    "task_type": "generate_offer",
    "assigned_to": null,
    "due_days": 1,
    "priority": "high",
    "notify": true
  }'::jsonb,
  2
),
(
  'offer',
  'create_task',
  '{
    "title": "Send offer to candidate",
    "description": "Send offer letter via email and e-signature platform. Schedule follow-up call to discuss offer.",
    "task_type": "send_offer",
    "assigned_to": null,
    "due_days": 2,
    "priority": "high",
    "notify": true
  }'::jsonb,
  3
),
(
  'offer',
  'create_task',
  '{
    "title": "Follow up on offer status",
    "description": "Check in with candidate about offer. Answer questions and address concerns.",
    "task_type": "offer_followup",
    "assigned_to": null,
    "due_days": 5,
    "priority": "medium",
    "notify": true
  }'::jsonb,
  4
);

-- ============================================================================
-- STAGE: HIRED
-- Trigger comprehensive onboarding workflow
-- ============================================================================

INSERT INTO workflow_triggers (stage, action_type, action_config, execution_order) VALUES
(
  'hired',
  'trigger_onboarding',
  '{
    "hr_user": null,
    "it_user": null,
    "facilities_user": null,
    "start_date": null
  }'::jsonb,
  1
),
(
  'hired',
  'send_email',
  '{
    "to_candidate": true,
    "subject": "Welcome to the team!",
    "template": "offer_accepted",
    "body": "Congratulations and welcome! We are excited to have you join our team. You will receive onboarding information shortly."
  }'::jsonb,
  2
),
(
  'hired',
  'send_notification',
  '{
    "notify_team": true,
    "message": "{candidate_name} has accepted the offer for {job_title}! Start date: {start_date}"
  }'::jsonb,
  3
),
(
  'hired',
  'create_task',
  '{
    "title": "Close job posting",
    "description": "Update job status to closed/filled. Send rejection emails to remaining candidates in pipeline.",
    "task_type": "close_job",
    "assigned_to": null,
    "due_days": 1,
    "priority": "high",
    "notify": true
  }'::jsonb,
  4
);

-- ============================================================================
-- STAGE: REJECTED
-- Send rejection email
-- ============================================================================

INSERT INTO workflow_triggers (stage, action_type, action_config, execution_order) VALUES
(
  'rejected',
  'send_email',
  '{
    "to_candidate": true,
    "subject": "Update on Your Application",
    "template": "rejection",
    "body": "Thank you for your interest in the {job_title} position. After careful consideration, we have decided to move forward with other candidates. We wish you the best in your job search."
  }'::jsonb,
  1
),
(
  'rejected',
  'create_task',
  '{
    "title": "Document rejection reason",
    "description": "Document reason for rejection for future reference and legal compliance.",
    "task_type": "document_rejection",
    "assigned_to": null,
    "due_days": 1,
    "priority": "low",
    "notify": false
  }'::jsonb,
  2
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Show all configured workflows by stage
SELECT 
  stage,
  action_type,
  execution_order,
  is_active,
  action_config->>'title' as task_title,
  action_config->>'due_days' as due_days
FROM workflow_triggers
ORDER BY 
  CASE stage
    WHEN 'applied' THEN 1
    WHEN 'phone_screen' THEN 2
    WHEN 'interview' THEN 3
    WHEN 'offer' THEN 4
    WHEN 'hired' THEN 5
    WHEN 'rejected' THEN 6
  END,
  execution_order;

-- Count workflows by stage
SELECT 
  stage,
  COUNT(*) as workflow_count,
  COUNT(*) FILTER (WHERE is_active = true) as active_count
FROM workflow_triggers
GROUP BY stage
ORDER BY 
  CASE stage
    WHEN 'applied' THEN 1
    WHEN 'phone_screen' THEN 2
    WHEN 'interview' THEN 3
    WHEN 'offer' THEN 4
    WHEN 'hired' THEN 5
    WHEN 'rejected' THEN 6
  END;

-- Count workflows by action type
SELECT 
  action_type,
  COUNT(*) as count
FROM workflow_triggers
GROUP BY action_type
ORDER BY count DESC;

SELECT '✓ Workflow triggers seeded successfully!' as result;
SELECT 'Total workflows created: ' || COUNT(*)::TEXT as summary FROM workflow_triggers;

-- ============================================================================
-- CUSTOMIZATION NOTES FOR YOUR SYSTEM
-- ============================================================================

/*
GOOD NEWS: Your system already has assigned_to on jobs table!
The workflow will automatically use job.assigned_to when creating tasks.

FROM YOUR JOBS DATA:
- assigned_to: "21b213a2-867a-4c3d-89ae-844a057c3b92" (appears on multiple jobs)
- This user will be the default assignee for most tasks

You can still override by setting "assigned_to" in the action_config below.

WHAT TO CUSTOMIZE:
1. For OFFER stage approvers, add multiple user UUIDs if needed
2. For HIRED stage onboarding, specify hr_user, it_user, facilities_user
3. Adjust due_days to match your hiring timeline
4. Customize email templates and task descriptions

*/

1. ASSIGNED_TO FIELDS:
   Replace "assigned_to": null with actual user UUIDs from your auth.users table
   Example: "assigned_to": "123e4567-e89b-12d3-a456-426614174000"

2. APPROVERS IN OFFER STAGE:
   Update the "approvers": [] array with hiring manager, finance, HR UUIDs
   Example: "approvers": ["uuid1", "uuid2", "uuid3"]

3. ONBOARDING USER ASSIGNMENTS:
   In 'hired' stage onboarding trigger, set:
   - "hr_user": "your_hr_user_uuid"
   - "it_user": "your_it_user_uuid"  
   - "facilities_user": "your_facilities_user_uuid"

4. EMAIL TEMPLATES:
   Update email bodies with your company branding and links
   Consider creating actual email templates in your system

5. PRIORITY LEVELS:
   Adjust priority levels (low/medium/high/urgent) based on your needs

6. DUE DATES:
   Modify due_days values to match your hiring timeline

To get user UUIDs, run:
SELECT id, email, role FROM auth.users WHERE role IN ('recruiter', 'hiring_manager', 'admin');

To update a workflow trigger:
UPDATE workflow_triggers 
SET action_config = jsonb_set(action_config, '{assigned_to}', '"YOUR_USER_UUID"')
WHERE stage = 'phone_screen' AND action_type = 'create_task';

To disable a workflow:
UPDATE workflow_triggers SET is_active = false WHERE stage = 'rejected' AND action_type = 'send_email';

To add a new workflow:
INSERT INTO workflow_triggers (stage, action_type, action_config, execution_order) VALUES (...);
*/