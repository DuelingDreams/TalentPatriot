# Candidate Profiles

TalentPatriot provides comprehensive candidate profiles to manage all candidate information in one place.

## Overview

Each candidate has a detailed profile containing contact information, work history, skills, documents, and interaction history.

## Profile Sections

### Contact Information
- Full name
- Email address
- Phone number
- Location
- LinkedIn URL
- Portfolio URL

### Professional Summary
AI-generated or manually entered summary of the candidate's background and qualifications.

### Skills
- List of technical and soft skills
- Proficiency levels (1-5)
- Skill categories

### Work Experience
- Job titles and companies
- Employment dates
- Descriptions of responsibilities
- Achievements

### Education
- Degrees and certifications
- Schools and institutions
- Graduation dates

### Documents
- Resume (current and historical)
- Cover letters
- Portfolio samples
- Certificates

## Viewing Profiles

### From Candidates List
1. Go to **Candidates** in sidebar
2. Click on any candidate name
3. Full profile opens

### From Pipeline
1. Open any job pipeline
2. Click on a candidate card
3. Profile opens in side panel or full view

## Editing Profiles

### Manual Editing
1. Click **Edit** on any profile section
2. Make changes
3. Click **Save**

### Bulk Updates
Some fields can be updated in bulk from the candidates list.

## Candidate Notes

### Adding Notes
1. Go to Notes section
2. Click **Add Note**
3. Enter note content
4. Choose visibility (Private or Team)

### Note Types
- **Private** - Only you can see
- **Team** - All team members can see

### Note History
All notes are timestamped with author information.

## Application History

View all jobs a candidate has applied to:
- Job title
- Application date
- Current stage
- Status

## Activity Timeline

Chronological view of all candidate interactions:
- Profile created
- Resume uploaded
- Stage changes
- Notes added
- Interviews scheduled
- Emails sent

## Skills Management

### Viewing Skills
Skills display with proficiency levels and categories.

### Editing Skills
1. Click **Edit Skills**
2. Add or remove skills
3. Adjust proficiency levels
4. Save changes

### AI-Parsed Skills
Skills extracted from resumes are automatically added with suggested proficiency levels.

## Documents

### Uploading Documents
1. Go to Documents section
2. Click **Upload**
3. Select file(s)
4. Documents are stored securely

### Document Types
- Resume (PDF, DOCX)
- Cover Letter
- Portfolio
- Certificates
- Other

### Viewing Documents
Click any document to view or download.

## API Endpoints

```
GET /api/candidates/:id
PUT /api/candidates/:id
GET /api/candidates/:id/documents
POST /api/candidates/:id/documents
GET /api/candidates/:id/skills
PUT /api/candidates/:id/skills
```

## Best Practices

1. **Keep profiles current** - Update after each interaction
2. **Use notes liberally** - Document impressions and conversations
3. **Verify parsed data** - Review AI-extracted information
4. **Organize documents** - Use clear naming conventions

## Related Features
- [AI Resume Parsing](./ai-resume-parsing.md)
- [Search & Filtering](./search-filtering.md)
