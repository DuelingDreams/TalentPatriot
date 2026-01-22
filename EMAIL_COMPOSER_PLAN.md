# Email Composer Enhancement Plan

## Overview
Build a template-driven email composer on the Candidate Profile page with merge field support, attachments, and email history tracking.

---

## Task 1: Email Composer Modal Component
**Location:** `client/src/features/communications/components/EmailComposer.tsx`

- Template selector dropdown (auto-fills subject and body)
- To field (pre-filled with candidate email)
- CC/BCC toggle fields
- Subject and body fields
- Merge field "Insert Field" button with dropdown
- Basic formatting toolbar (Bold, Italic, Lists, Links)
- File attachment support (PDF, DOC, DOCX up to 10MB)
- Save Draft, Cancel, and Send buttons

---

## Task 2: Candidate Profile - Emails Tab
**Location:** `client/src/features/candidates/pages/CandidateProfile.tsx`

- Add "Emails" tab between Campaigns and Notes
- Display threaded email history (grouped by gmail_thread_id)
- Each email shows: sent/received indicator, date, template used, job context
- Filters: job, date range, direction (sent/received)
- "Send Email" primary CTA button opens EmailComposer modal

---

## Task 3: Backend - Email Templates API
**Endpoints:**
- `GET /api/email-templates` - list all templates
- `POST /api/email-templates` - create template
- `GET /api/candidates/:id/emails` - email history for candidate

**Database:** Use existing `email_templates` and `email_events` tables

---

## Task 4: Backend - Send Email with Merge Fields
- Render merge fields before sending via Resend
- Store `gmail_message_id` and `gmail_thread_id` in email_events
- Log to email_events table for history

---

## Task 5: Seed Default Templates
Insert these templates:
- Application Received
- Phone Screen Request
- Interview Invitation
- Not Moving Forward

---

## Task 6: Messages Page Cleanup
- Remove email functionality from Messages page
- Messages page becomes internal team communication only

---

## Technical Context

### Existing Files to Reference
- `client/src/features/communications/` - existing components
- `server/services/email/resend.ts` - email sending
- `server/services/email/ats-emails.ts` - email templates
- `shared/schema/emails.ts` - database schema
- `shared/utils/mergeFields.ts` - merge field utility

### Merge Fields Format
```
{{candidate.first_name}}
{{candidate.last_name}}
{{candidate.email}}
{{job.title}}
{{job.location}}
{{company.name}}
{{recruiter.name}}
{{recruiter.email}}
```

### UI Components
- Use Shadcn/ui components (Dialog, Select, Tabs, Button, Input, Textarea)
- Follow existing candidate profile tabs pattern
- TalentPatriot brand colors: cyan (#0EA5E9), navy (#1E3A5F), teal (#14B8A6)

### File Upload Constraints
- Max 10MB per file
- Allowed types: PDF, DOC, DOCX
- Use existing Multer upload middleware in `server/middleware/upload.ts`

---

## Estimated Time
30-45 minutes
