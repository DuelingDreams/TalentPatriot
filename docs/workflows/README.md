# TalentPatriot Workflow Infrastructure

This directory contains the SQL files for the workflow automation system that triggers actions when candidates move between pipeline stages.

## Files

| File | Description |
|------|-------------|
| `01_schema_creation.sql` | Creates the database tables for workflows |
| `02_trigger_functions.sql` | Creates trigger functions for stage change automation |
| `03_seed_data.sql` | Seeds default workflow triggers for each stage |

## Database Tables

### workflow_triggers
Stores configuration for automated actions when stage changes occur.
- `stage`: The pipeline stage that triggers this workflow
- `action_type`: Type of action (create_task, send_email, create_approval_workflow, trigger_onboarding, send_notification)
- `action_config`: JSON configuration for the action
- `execution_order`: Order to execute multiple triggers for same stage

### job_candidate_stage_history
Audit trail of all stage changes for compliance and analytics.

### tasks
Workflow tasks created by automation or manually.
- Supports task types: application_review, phone_screen_form, interview_feedback, offer_approval, generate_offer, onboarding, etc.
- Tracks assignment, due dates, completion status

### workflow_execution_log
Logs all workflow executions for debugging and monitoring.

## Workflow Actions by Stage

| Stage | Actions |
|-------|---------|
| Applied | Create review task, send confirmation email |
| Phone Screen | Create phone screen form task, send scheduling email |
| Interview | Create feedback task, send interview email, notify hiring manager |
| Offer | Create approval workflow, generate offer tasks, follow-up tasks |
| Hired | Trigger onboarding tasks, send welcome email, notify team, close job |
| Rejected | Send rejection email, document rejection reason |

## Security Note

The RLS policies in `01_schema_creation.sql` need enhancement before production use:
- Add `WITH CHECK` clauses to ensure insert/update operations respect org isolation
- Verify `tasks_org_isolation` and `stage_history_org_isolation` policies block cross-org writes
- Test that `workflow_triggers_admin_write` properly restricts non-admin modifications

## Future Implementation

When building out the UI and server features:

1. **Tasks UI**: Display tasks assigned to users, allow completion
2. **Workflow Settings**: Admin UI to configure workflow triggers
3. **Email Integration**: Connect send_email actions to SendGrid
4. **Notifications**: Real-time notifications for workflow events
5. **Approval Workflows**: Multi-step approval for offers

## Usage

These SQL files have already been run in Supabase. The triggers are active and will:
1. Log stage changes to `job_candidate_stage_history`
2. Execute workflow triggers when candidates change stages
3. Create tasks automatically based on configuration
