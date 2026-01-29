# Careers Pages

TalentPatriot provides branded public careers pages where candidates can view and apply to your open positions.

## Overview

Each organization gets a unique careers portal at:
```
https://[your-slug].talentpatriot.com/careers
```

## Features

### Branded Experience
- Company logo and colors
- Custom header text
- Professional job listings
- Mobile-responsive design

### Job Listings
Public job listings display:
- Job title and location
- Employment type (Full-time, Part-time, Contract)
- Remote work options
- Salary range (if enabled)
- Job description
- Requirements

### Easy Application
Candidates can apply directly with:
- Contact information
- Resume upload (with AI parsing)
- Cover letter
- Custom application questions

## Setting Up Your Careers Page

### 1. Organization Branding
1. Go to **Settings > Organization**
2. Upload your company logo
3. Set your brand colors
4. Add company description

### 2. Publishing Jobs
1. Create a job in **Jobs**
2. Fill in job details
3. Click **Publish**
4. Job appears on your careers page

### 3. Custom URL
Your careers page URL uses your organization slug:
- Set during signup
- Can be changed in Settings

## Application Form

### Default Fields
- First Name / Last Name
- Email / Phone
- Resume Upload
- Cover Letter

### Optional Fields
Enable/disable fields like:
- LinkedIn URL
- Portfolio URL
- Work Authorization
- Referral Source

### Custom Questions
Add job-specific questions for screening.

## Candidate Experience

1. Candidate visits careers page
2. Browses open positions
3. Clicks "Apply" on a job
4. Fills out application form
5. Uploads resume
6. Receives confirmation email
7. Enters your pipeline automatically

## SEO Benefits

Careers pages are optimized for search:
- SEO-friendly URLs (`/careers/job-title-abc123`)
- Meta descriptions
- Structured data for job listings
- Mobile-first indexing

## API Endpoints

```
GET /api/public/jobs/:orgSlug
GET /api/public/jobs/slug/:slug
POST /api/jobs/:jobId/apply
```

## Best Practices

1. **Keep jobs updated** - Remove filled or closed positions
2. **Write compelling descriptions** - Attract quality candidates
3. **Enable salary ranges** - Improves application rates
4. **Test the experience** - Apply as a test candidate

## Related Features
- [Job Management](./job-management.md)
- [Application Forms](./application-forms.md)
