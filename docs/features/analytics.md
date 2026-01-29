# Dashboard Analytics

TalentPatriot provides real-time analytics to help you make data-driven hiring decisions.

## Dashboard Overview

The main dashboard displays key metrics at a glance:

### Summary Cards
- **Total Jobs** - Active job postings
- **Total Candidates** - All candidates in your database
- **Total Applications** - Applications across all jobs
- **Total Hires** - Successful placements

### This Month Metrics
- Jobs posted this month
- New candidates this month
- Applications received this month
- Hires this month

## Pipeline Analytics

### Stage Distribution
Visual breakdown of candidates across pipeline stages:
- Applied
- Phone Screen
- Interview
- Technical
- Final
- Offer
- Hired
- Rejected

### Conversion Rates
Track how candidates move through your pipeline:
- Application to Phone Screen rate
- Interview to Offer rate
- Offer acceptance rate

## Source Tracking

### Application Sources
See where your candidates come from:
- Company Website
- LinkedIn
- Indeed
- Referral
- Job Boards
- Direct Application

### Source Performance
Compare sources by:
- Total applications
- Hire rate
- Quality score

## Time-Based Analytics

### Time to Hire
Average days from application to hire, broken down by:
- Job type
- Department
- Experience level

### Stage Duration
How long candidates spend in each stage.

## Job Performance

### Per-Job Metrics
- Total applicants
- Pipeline velocity
- Conversion rates
- Days open

### Job Health Indicators
Visual indicators showing job posting health:
- 🟢 Healthy - Good application flow
- 🟡 Needs Attention - Low applications or stalled pipeline
- 🔴 Critical - No activity or filled position

## Charts & Visualizations

### Pipeline Funnel
Shows candidate drop-off at each stage.

### Trend Lines
Weekly/monthly trends for:
- Applications
- Hires
- Time to hire

### Source Distribution
Pie chart of application sources.

## Exporting Data

Export analytics data in CSV format:
1. Go to Analytics
2. Select date range
3. Click **Export**
4. Choose metrics to include

## API Endpoints

```
GET /api/analytics/dashboard-stats
GET /api/reports/metrics
GET /api/analytics/export
```

## Best Practices

1. **Review weekly** - Check dashboard at least weekly
2. **Compare periods** - Look at month-over-month trends
3. **Act on insights** - Use data to improve processes
4. **Share with stakeholders** - Export reports for leadership

## Related Features
- [Custom Reports](./reporting.md)
- [Hiring Metrics](./metrics.md)
