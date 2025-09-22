# SendGrid Dynamic Email Templates for TalentPatriot ATS

## Overview
This folder contains 8 professional HTML email templates designed for SendGrid's dynamic template system. Each template supports multi-tenant branding and includes comprehensive variable support for your recruitment workflow.

## Template List

### 1. New Candidate Alert (`01-new-candidate-alert.html`)
**Secret Key:** `SG_TPL_NEW_CANDIDATE_ALERT`
**Purpose:** Internal notification when a new candidate applies

**Key Variables:**
- `organization_name`, `organization_logo`, `organization_address`
- `candidate_name`, `candidate_email`, `candidate_phone`, `candidate_location`
- `job_title`, `application_date`, `candidate_experience`
- `resume_url`, `candidate_profile_url`

### 2. Interview Invitation (`02-interview-invite.html`)
**Secret Key:** `SG_TPL_INTERVIEW_INVITE`
**Purpose:** Candidate interview scheduling and details

**Key Variables:**
- `candidate_name`, `job_title`, `interview_type`, `interview_duration`
- `interview_date`, `interview_time`, `timezone`
- `interview_location`, `meeting_link`, `interviewer_names`
- `interview_agenda`, `preparation_notes`, `confirm_url`, `calendar_link`
- `recruiter_email`, `recruiter_phone`

### 3. Status Update (`03-status-update.html`)
**Secret Key:** `SG_TPL_STATUS_UPDATE`
**Purpose:** Application status changes (rejection/on-hold/next-stage)

**Key Variables:**
- `status` (values: "next_stage", "on_hold", "rejected")
- `candidate_name`, `job_title`, `feedback`
- `next_stage_details`, `action_required`, `action_url`, `action_text`
- `recruiter_name`, `recruiter_email`, `recruiter_phone`
- `other_positions`, `careers_url`

**Conditional Logic:**
```handlebars
{{#if_equals status "next_stage"}}...{{/if_equals}}
{{#if_equals status "on_hold"}}...{{/if_equals}}
{{#if_equals status "rejected"}}...{{/if_equals}}
```

### 4. Job Offer (`04-offer.html`)
**Secret Key:** `SG_TPL_OFFER`
**Purpose:** Formal job offer delivery

**Key Variables:**
- `candidate_name`, `job_title`, `department`, `start_date`
- `employment_type`, `work_location`, `reporting_manager`
- `salary_amount`, `salary_period`, `bonus_eligible`, `bonus_details`
- `benefits[]` (array), `offer_details`, `offer_portal_url`
- `response_deadline`, `hiring_manager_name`, `hiring_manager_email`

### 5. Welcome Email (`05-welcome.html`)
**Secret Key:** `SG_TPL_WELCOME`
**Purpose:** New user/organization onboarding

**Key Variables:**
- `user_name`, `user_email`, `user_role`
- `organization_name`, `plan_tier`, `beta_program`
- `dashboard_url`, `setup_guide_url`, `profile_url`
- `documentation_url`, `support_url`, `onboarding_call_url`

**Conditional Logic:**
```handlebars
{{#if_equals user_role "owner"}}...{{else}}...{{/if_equals}}
```

### 6. Password Reset (`06-password-reset.html`)
**Secret Key:** `SG_TPL_PASSWORD_RESET`
**Purpose:** Secure password reset with security messaging

**Key Variables:**
- `user_name`, `user_email`, `reset_url`
- `expiry_date`, `expiry_time`, `request_timestamp`
- `request_ip`, `user_agent`, `support_email`, `support_phone`

### 7. Message Alert (`07-message-alert.html`)
**Secret Key:** `SG_TPL_MESSAGE_ALERT`
**Purpose:** New message notifications with deep linking

**Key Variables:**
- `recipient_name`, `sender_name`, `sender_initials`, `sender_role`
- `message_subject`, `message_preview`, `message_timestamp`
- `message_url`, `reply_url`, `message_type`, `has_attachments`
- `candidate_name`, `job_title`, `client_name`, `thread_title`
- `quick_actions[]` (array), `urgent`, `notification_settings_url`

### 8. Event Reminder (`08-event-reminder.html`)
**Secret Key:** `SG_TPL_EVENT_REMINDER`
**Purpose:** Interview and task reminders with calendar integration

**Key Variables:**
- `recipient_name`, `event_type`, `event_title`, `event_description`
- `event_date`, `event_time`, `timezone`, `duration`, `countdown_text`
- `event_location`, `meeting_link`, `meeting_platform`, `meeting_id`
- `candidate_name`, `candidate_email`, `job_title`
- `participants[]` (array), `agenda`, `preparation_items[]` (array)
- `ical_download_url`, `join_url`, `reschedule_url`

## Multi-Tenant Variables

All templates support these organization-specific variables:
- `organization_name` - Company name
- `organization_logo` - Logo URL (optional)
- `organization_address` - Full address for footer
- `organization_email` - Contact email
- `organization_phone` - Contact phone (optional)

## Implementation Steps

### 1. Copy Templates to SendGrid
1. Go to SendGrid Dashboard → Email API → Dynamic Templates
2. Create a new template for each file
3. Copy the HTML content from each file
4. Use the "Code Editor" in SendGrid
5. Save and note the Template ID

### 2. Add Template IDs to Replit Secrets
Add these environment variables in your Replit secrets:
```
SG_TPL_NEW_CANDIDATE_ALERT=d-your-template-id-here
SG_TPL_INTERVIEW_INVITE=d-your-template-id-here
SG_TPL_STATUS_UPDATE=d-your-template-id-here
SG_TPL_OFFER=d-your-template-id-here
SG_TPL_WELCOME=d-your-template-id-here
SG_TPL_PASSWORD_RESET=d-your-template-id-here
SG_TPL_MESSAGE_ALERT=d-your-template-id-here
SG_TPL_EVENT_REMINDER=d-your-template-id-here
```

### 3. Update Email Service
Your existing `emailService.ts` should automatically use these template IDs when sending emails through the `sendDynamicEmail` function.

## Testing Templates

### SendGrid Test Data
Use this sample JSON for testing templates in SendGrid:

```json
{
  "organization_name": "TalentPatriot Demo",
  "organization_logo": "https://example.com/logo.png",
  "organization_address": "123 Business St, Suite 100, San Francisco, CA 94105",
  "candidate_name": "John Smith",
  "candidate_email": "john.smith@email.com",
  "job_title": "Senior Software Engineer",
  "user_name": "Sarah Johnson",
  "user_role": "hiring_manager",
  "status": "next_stage"
}
```

## Features

### ✅ Multi-Tenant Support
- Organization branding (logo, colors, contact info)
- Role-based content variations
- Personalized messaging

### ✅ Professional Design
- TalentPatriot brand colors (Navy #1e3a8a, Blue #3b82f6)
- Responsive design for all devices
- Consistent typography and spacing

### ✅ Advanced Functionality
- Conditional content rendering
- Dynamic button generation
- Calendar integration (.ics files)
- Security messaging for sensitive emails

### ✅ Accessibility
- High contrast ratios
- Screen reader friendly
- Mobile-optimized layouts

## Customization

### Brand Colors
The templates use CSS variables that can be customized:
- Primary: `#1e3a8a` (Navy)
- Secondary: `#3b82f6` (Blue)
- Success: `#22c55e` (Green)
- Warning: `#f59e0b` (Amber)
- Error: `#ef4444` (Red)

### Organization Logos
- Recommended size: 200x40px (max height: 40px)
- Format: PNG with transparent background
- Upload to your object storage and use the URL

## Troubleshooting

### Common Issues
1. **Missing Variables**: Check that all required variables are passed in your API call
2. **Broken Images**: Ensure logo URLs are publicly accessible
3. **Formatting Issues**: Verify JSON structure in SendGrid test tool
4. **Conditional Logic**: Use exact string matches for `{{#if_equals}}` helpers

### Template Validation
Each template can be validated in SendGrid's preview tool using the test data provided above.

## Support
For issues with template implementation or customization, check your TalentPatriot documentation or contact support.