# Visual Pipeline

TalentPatriot's visual pipeline provides a Kanban-style interface for managing candidates through your hiring process.

## Overview

Each job has its own customizable pipeline with drag-and-drop candidate cards. Move candidates between stages by dragging their cards to different columns.

## Default Pipeline Stages

New jobs start with these default stages:
1. **Applied** - Initial applications
2. **Phone Screen** - First contact/screening
3. **Interview** - In-person or video interviews
4. **Technical** - Technical assessments
5. **Final** - Final round interviews
6. **Offer** - Offer extended
7. **Hired** - Accepted and onboarded

## Using the Pipeline

### Accessing the Pipeline
1. Go to **Jobs** in the sidebar
2. Click on any job
3. Select the **Pipeline** tab

### Moving Candidates
- **Drag and drop** a candidate card to move between stages
- Changes save automatically
- Stage history is tracked for analytics

### Candidate Cards
Each card shows:
- Candidate name and email
- Current stage duration
- Quick action buttons
- Application source

## Customizing Stages

### Adding Stages
1. Click **+ Add Stage** at the end of the pipeline
2. Enter the stage name
3. Stages appear in order from left to right

### Reordering Stages
Drag stage headers to reorder the pipeline flow.

### Renaming Stages
Click the stage name to edit it inline.

## Pipeline Features

### Real-time Updates
Pipeline changes sync in real-time across all team members.

### Stage History
Every stage change is logged with:
- Timestamp
- User who made the change
- Previous and new stage

### Filtering
Filter candidates within the pipeline by:
- Date added
- Source
- Assigned recruiter

## Best Practices

1. **Keep stages focused** - Each stage should represent a clear decision point
2. **Move candidates promptly** - Stale candidates hurt time-to-hire metrics
3. **Use notes** - Add context when moving candidates
4. **Review bottlenecks** - Analytics show where candidates get stuck

## API Endpoints

```
GET /api/pipeline/:orgId/:jobId
POST /api/pipeline/move
POST /api/pipeline/columns
```

## Related Features
- [Stage Automation](./stage-automation.md)
- [Analytics](./analytics.md)
