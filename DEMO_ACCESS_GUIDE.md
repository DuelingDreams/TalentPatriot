# TalentPatriot Demo Access Guide

## How to Access Demo Mode

### Option 1: Direct Demo URL
Visit the login page with the demo parameter:
```
https://your-app-url/login?demo=true
```

### Option 2: Demo Login Credentials
Use these credentials on the regular login page:
- **Email**: `demo@yourapp.com`
- **Password**: `Demo1234!`

### Option 3: Demo Button
1. Visit: `https://your-app-url/login?demo=true`
2. Click the "Try Demo Account" button
3. You'll be automatically logged in

## Demo Features

The demo mode provides a complete TalentPatriot experience with:

- **Full ATS Functionality**: Dashboard, clients, jobs, candidates, pipeline, calendar, messages
- **Sample Data**: 3 demo clients, 5 demo jobs, 6 demo candidates with realistic profiles
- **Interactive Kanban Pipeline**: Drag & drop candidates through hiring stages
- **Resume Upload System**: Upload and preview candidate resumes
- **Team Messaging**: Internal communication system with demo conversations
- **Calendar Integration**: Interview scheduling with demo appointments
- **Professional UI**: Complete TalentPatriot branded experience

## Data Isolation & Security

### Demo User Isolation
Demo users are completely isolated with:
- **Role**: `demo_viewer` (read-only access)
- **Organization**: Fixed demo organization (`demo-org-fixed`)
- **Data Access**: Only demo data with `status: 'demo'`

### Real User Protection
Real users are protected with:
- **Separate Organizations**: Each user gets their own organization
- **API Filtering**: All API calls filtered by organization ID
- **No Cross-Access**: Real users cannot see demo data, demo users cannot see real data

### Security Measures
1. **Frontend Isolation**: Demo users get hardcoded demo data, never API calls for lists
2. **Backend Filtering**: All API endpoints filter by organization ID
3. **Role-based Access**: Demo viewers have read-only permissions
4. **Session Isolation**: Demo users get fixed organization ID in session

## Demo Data Details

### Demo Organization
- **ID**: `550e8400-e29b-41d4-a716-446655440000`
- **Name**: "TalentPatriot Demo"
- **Type**: Demo organization with sample data

### Demo Clients (3)
- TechCorp Solutions (Technology)
- InnovateCo (Software Development)  
- DataDyne Corp (Data Analytics)

### Demo Jobs (5)
- Senior Software Engineer
- Product Manager
- Data Scientist
- Frontend Developer
- DevOps Engineer

### Demo Candidates (6)
- Alex Rodriguez (Applied stage)
- Sarah Chen (Phone Screen stage)
- Michael Park (Interview stage)
- Jessica Wu (Technical stage)
- David Kim (Offer stage)
- Emma Wilson (Hired stage)

## Technical Implementation

### Authentication Flow
```typescript
// Demo user authentication
if (session.user.email === 'demo@yourapp.com') {
  setUserRole('demo_viewer')
  setCurrentOrgId('550e8400-e29b-41d4-a716-446655440000')
}
```

### Data Fetching
```typescript
// Demo data isolation
if (userRole === 'demo_viewer' && options.getDemoData) {
  return options.getDemoData(userRole) // Hardcoded demo data
}
// Real users get API data filtered by orgId
return apiRequest(`${endpoint}?orgId=${currentOrgId}`)
```

### No Data Leakage
- Demo users never make API calls for list data
- Real users never get demo organization ID
- All API endpoints require valid organization ID
- Demo data clearly marked with `status: 'demo'`

## Troubleshooting

### Demo Login Issues
1. Ensure you're using the correct URL: `/login?demo=true`
2. Use exact credentials: `demo@yourapp.com` / `Demo1234!`
3. Clear browser cache if login fails

### Data Not Loading
1. Check network tab for failed API calls
2. Verify you're logged in as demo user (check role in browser console)
3. Refresh the page to reinitialize demo data

### Permission Errors
Demo users have read-only access. If you need full functionality:
1. Sign up for a real account
2. Create your own organization
3. Import your own data

## Development Notes

### Adding Demo Data
Demo data is stored in `/client/src/lib/demo-data-consolidated.ts`

### Modifying Demo Access
Demo authentication logic is in `/client/src/contexts/AuthContext.tsx`

### Testing Data Isolation
1. Log in as demo user - should only see demo data
2. Create real account - should not see any demo data
3. Check browser network tab - demo users shouldn't make API calls for lists