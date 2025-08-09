# Demo Access Guide

## Overview
TalentPatriot offers a comprehensive demo mode that provides full feature parity with the live application while maintaining complete data isolation. Demo mode uses simulated data and never makes real API calls or modifies live data.

## Accessing Demo Mode

### Method 1: URL Parameter (Recommended)
Add `?demo=true` to any TalentPatriot URL:
```
https://your-app.replit.app/login?demo=true
https://your-app.replit.app/dashboard?demo=true
https://your-app.replit.app/careers?demo=true
```

### Method 2: Demo User Account
Use the designated demo user email:
- **Email:** `demo@yourapp.com`
- **Password:** (standard demo password)

### Method 3: Development Toggle (Dev Mode Only)
In development builds, a demo toggle appears in the bottom-right corner allowing you to enable/disable demo mode.

## Demo Mode Features

### Complete Feature Parity
- **Dashboard:** Real-time analytics with simulated company data
- **Job Management:** Create, edit, and publish job postings
- **Candidate Pipeline:** Manage applications through hiring stages
- **Public Careers Page:** Fully functional job listings and application forms
- **Client Management:** Add and manage client relationships
- **Team Collaboration:** Internal messaging and notifications

### Data Isolation
- **No Live API Calls:** All operations use in-memory demo storage
- **Simulated Writes:** Job creation, candidate applications, and pipeline moves are processed locally
- **Persistent Demo State:** Demo data persists during the session
- **Realistic Delays:** Network simulation provides authentic user experience

### Security
- **Protected Routes:** Demo users cannot access live data modification endpoints
- **Isolated Storage:** Demo operations never touch production databases
- **Safe Testing:** Experiment freely without affecting real data

## Demo Data Structure

### Organizations
- Demo Organization ID: `550e8400-e29b-41d4-a716-446655440000`
- Company: "TalentPatriot Demo Corp"

### Sample Clients
- **TechCorp Solutions** - Technology sector client
- **Green Energy Inc** - Sustainable energy provider

### Sample Jobs
- **Senior Software Engineer** - Full-time, San Francisco (Hybrid)
- **Product Manager** - Full-time, Austin (Remote)

### Sample Candidates
- **Emily Rodriguez** - Software Engineer applicant
- **James Wilson** - Product Manager applicant

## Key Implementation Files

### Core Architecture
- `client/src/contexts/AuthContext.tsx` - Centralized demo mode detection
- `client/src/lib/dataAdapter.ts` - Demo/live data adapter layer
- `client/src/lib/demo-data-consolidated.ts` - Centralized demo data
- `client/src/lib/demoToggle.ts` - Demo mode utilities

### Modified Hooks
- `client/src/hooks/useJobs.ts` - Job management with demo support
- `client/src/hooks/useClients.ts` - Client data with demo mode
- `client/src/hooks/useJobCandidates.ts` - Pipeline management
- `client/src/components/dashboard/QuickActions.tsx` - Dynamic data display

## Usage Notes

1. **Visual Consistency:** Demo mode looks identical to the live application
2. **Data Labels:** Subtle "Demo data" indicators appear only where appropriate
3. **Full Workflow:** Complete job posting → application → pipeline workflow available
4. **No Persistence:** Demo data resets when switching back to live mode
5. **Development Features:** Additional debugging tools available in dev builds

## Troubleshooting

### Demo Mode Not Activating
1. Ensure URL contains `?demo=true`
2. Check browser console for demo mode confirmation logs
3. Clear localStorage and try again: `localStorage.removeItem('tp_demo')`

### Data Not Updating in Demo
1. Demo operations are local-only and won't persist across page refreshes
2. Use browser dev tools → Network tab to verify no live API calls are made
3. Check that `isDemoUser` state is true in React DevTools

### Switching Between Modes
1. To exit demo mode: remove `?demo=true` from URL and refresh page
2. To enter demo mode: add `?demo=true` to current URL
3. Development toggle requires page refresh to apply changes

## Security Guarantees

- ✅ No real data is read or written in demo mode
- ✅ Demo users cannot access production APIs
- ✅ Complete data isolation between demo and live modes
- ✅ Safe for public demonstrations and user testing