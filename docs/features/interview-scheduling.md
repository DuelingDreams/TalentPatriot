# Interview Scheduling

TalentPatriot integrates with Google Calendar to streamline interview scheduling.

## Overview

Schedule, manage, and track interviews directly within TalentPatriot with automatic calendar sync.

## Features

### Interview Types
- **Phone Screen** - Initial phone/video call
- **Video Interview** - Remote video meeting
- **In-Person** - On-site interview
- **Technical** - Technical assessment or coding interview

### Google Calendar Integration
- Automatic calendar event creation
- Google Meet link generation
- Attendee invitations
- Real-time availability checking

## Setting Up Calendar Integration

### 1. Connect Google Account
1. Go to **Settings > Integrations**
2. Click **Connect Google**
3. Authorize calendar access
4. Select default calendar

### 2. Configure Defaults
- Default interview duration
- Buffer time between interviews
- Working hours
- Meeting room preferences

## Scheduling an Interview

### From Pipeline
1. Click on a candidate card
2. Select **Schedule Interview**
3. Choose interview type
4. Select date/time
5. Add interviewers
6. Confirm scheduling

### From Candidate Profile
1. Go to candidate profile
2. Click **Interviews** tab
3. Click **Schedule New**
4. Fill in interview details

## Interview Details

Each interview includes:
- **Title** - Interview name
- **Type** - Phone, Video, In-Person, Technical
- **Date/Time** - Scheduled time
- **Duration** - Length in minutes
- **Location** - Room or video link
- **Interviewer** - Assigned team member
- **Notes** - Preparation notes
- **Status** - Scheduled, Completed, Cancelled, No Show

## Interview Workflow

1. **Schedule** - Create interview
2. **Notify** - Candidate and interviewers receive emails
3. **Remind** - Automatic reminders before interview
4. **Conduct** - Interview happens
5. **Feedback** - Interviewer adds notes and rating
6. **Progress** - Move candidate in pipeline

## Tracking Interviews

### Interview List
View all upcoming and past interviews:
- Filter by date range
- Filter by interviewer
- Filter by status

### Calendar View
See interviews in calendar format:
- Day, Week, Month views
- Color-coded by type
- Click to view details

## Interview Feedback

After an interview, add:
- **Notes** - Key observations
- **Rating** - Overall assessment
- **Recommendation** - Hire, Maybe, Pass
- **Next Steps** - Suggested actions

## API Endpoints

```
POST /api/interviews
GET /api/interviews/:id
PUT /api/interviews/:id
DELETE /api/interviews/:id
GET /api/interviews/candidate/:candidateId
```

## Best Practices

1. **Book promptly** - Don't let candidates wait
2. **Add context** - Include job and candidate details in invite
3. **Confirm attendance** - Follow up before interviews
4. **Capture feedback immediately** - Document while fresh

## Related Features
- [Pipeline](./pipeline.md)
- [Collaboration Tools](./collaboration.md)
