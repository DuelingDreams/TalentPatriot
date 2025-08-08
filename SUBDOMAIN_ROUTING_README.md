# Subdomain-Based Organization Routing

## Overview
TalentPatriot now supports subdomain-based organization isolation for careers pages. Each organization gets their own branded careers page accessible via their unique subdomain.

## How It Works

### Production URLs
- **Company A**: `https://techcorp-solutions.talentpatriot.app/careers`
- **Company B**: `https://startup-inc.talentpatriot.app/careers`
- **Company C**: `https://enterprise-corp.talentpatriot.app/careers`

### Development URLs
- **Company A**: `http://techcorp-solutions.localhost:5000/careers`
- **Company B**: `http://startup-inc.localhost:5000/careers`

## Features

✅ **Automatic Organization Detection**: Subdomain automatically determines which organization's jobs to display
✅ **Data Isolation**: Each organization only sees their own published jobs
✅ **Professional Branding**: Company name appears in careers page header
✅ **SEO Optimization**: Each organization gets their own indexed careers page
✅ **Security**: No cross-organization data leakage

## Implementation Details

### Backend Components
- **Subdomain Middleware** (`server/middleware/subdomainResolver.ts`): Extracts organization from hostname
- **Organization-Specific API**: `GET /api/public/jobs` now filters by organization
- **Database Schema**: Organizations table includes unique `slug` field for subdomains

### Database Setup
1. Run the SQL migration: `subdomain_organization_migration.sql`
2. This adds slug field and auto-generates slugs for existing organizations
3. Sets up triggers for automatic slug generation

### Frontend Updates
- Careers page header dynamically shows organization name from subdomain
- Jobs API automatically fetches organization-specific positions
- Fallback to "TalentPatriot" when no subdomain detected

## Setting Up Organization Subdomains

### For Development
1. Add entries to your `/etc/hosts` file:
```
127.0.0.1 company-name.localhost
127.0.0.1 another-company.localhost
```

2. Access careers pages:
- `http://company-name.localhost:5000/careers`
- `http://another-company.localhost:5000/careers`

### For Production
1. Configure DNS with wildcard subdomain: `*.talentpatriot.app`
2. Each organization automatically gets: `https://org-slug.talentpatriot.app/careers`

## Benefits

### For Organizations
- **Professional Appearance**: Branded careers page with company name
- **Data Privacy**: Complete isolation from other organizations
- **SEO Benefits**: Dedicated URL for search engine optimization
- **Easy Sharing**: Clean, memorable URLs for job postings

### For Job Seekers
- **Clear Company Context**: Always know which company they're applying to
- **Focused Experience**: See only relevant positions from that company
- **Professional Trust**: Legitimate-looking company careers page

## Technical Security
- **Row-Level Security**: Database policies ensure data isolation
- **Subdomain Validation**: Prevents access to non-existent organizations
- **Automatic Fallback**: Graceful handling when subdomain isn't recognized

## Next Steps
1. Run the SQL migration to enable subdomain routing
2. Test with your organization's subdomain
3. Share your unique careers URL: `https://your-company-slug.talentpatriot.app/careers`