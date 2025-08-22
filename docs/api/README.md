# API Reference

TalentPatriot provides a comprehensive RESTful API for managing all aspects of the recruitment process. This reference covers all available endpoints, request/response formats, authentication, and usage examples.

## 🌐 Base URL & Versioning

```
Production: https://api.talentpatriot.com/v1
Staging: https://staging-api.talentpatriot.com/v1
Development: http://localhost:5000/api
```

## 🔐 Authentication

### Authentication Methods
TalentPatriot supports multiple authentication methods:

#### JWT Bearer Token
```http
Authorization: Bearer <jwt_token>
```

#### API Key (Enterprise)
```http
X-API-Key: <api_key>
```

### Getting Authentication Token
```typescript
// Login request
POST /api/auth/login
{
  "email": "user@company.com",
  "password": "secure_password"
}

// Response
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "jwt_token_here",
    "expires_at": "2024-12-31T23:59:59Z"
  }
}
```

### OAuth Integration
```typescript
// OAuth login (Google/Microsoft)
GET /api/auth/oauth/google
GET /api/auth/oauth/microsoft

// OAuth callback
GET /api/auth/oauth/callback?provider=google&code=...
```

## 📊 Standard Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error

## 👥 Organizations API

### List Organizations
```http
GET /api/organizations
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "org_123",
      "name": "Acme Corporation",
      "slug": "acme-corp",
      "industry": "Technology",
      "size": "51-200",
      "website": "https://acme.com",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### Create Organization
```http
POST /api/organizations
{
  "name": "New Company",
  "slug": "new-company",
  "industry": "Healthcare",
  "size": "11-50",
  "website": "https://newcompany.com"
}
```

### Get Organization Details
```http
GET /api/organizations/{org_id}
```

### Update Organization
```http
PUT /api/organizations/{org_id}
{
  "name": "Updated Company Name",
  "industry": "FinTech"
}
```

## 💼 Jobs API

### List Jobs
```http
GET /api/jobs?org_id={org_id}&status=open&limit=20&page=1
```

**Query Parameters:**
- `org_id` (required) - Organization ID
- `status` - Filter by status (open, closed, draft, on_hold)
- `client_id` - Filter by client
- `remote` - Filter by remote work (true/false)
- `experience_level` - Filter by experience level
- `limit` - Results per page (default: 20, max: 100)
- `page` - Page number (default: 1)
- `search` - Search in title and description

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "job_456",
      "title": "Senior React Developer",
      "description": "We're looking for an experienced React developer...",
      "status": "open",
      "employment_type": "full_time",
      "experience_level": "senior",
      "location": "Remote",
      "salary_min": 80000,
      "salary_max": 120000,
      "remote": true,
      "client": {
        "id": "client_789",
        "name": "Engineering Team"
      },
      "created_at": "2024-01-20T14:30:00Z",
      "updated_at": "2024-01-22T09:15:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 25,
    "pages": 2
  }
}
```

### Create Job
```http
POST /api/jobs
{
  "org_id": "org_123",
  "client_id": "client_789",
  "title": "Frontend Developer",
  "description": "Join our team as a Frontend Developer...",
  "requirements": [
    "3+ years React experience",
    "TypeScript proficiency",
    "CSS/Tailwind knowledge"
  ],
  "employment_type": "full_time",
  "experience_level": "mid",
  "location": "New York, NY",
  "remote": false,
  "salary_min": 70000,
  "salary_max": 90000,
  "status": "draft"
}
```

### Get Job Details
```http
GET /api/jobs/{job_id}
```

### Update Job
```http
PUT /api/jobs/{job_id}
{
  "title": "Senior Frontend Developer",
  "status": "open"
}
```

### Publish Job
```http
POST /api/jobs/{job_id}/publish
```

### Get Job Applications
```http
GET /api/jobs/{job_id}/applications?stage=applied&limit=50
```

## 👤 Candidates API

### List Candidates
```http
GET /api/candidates?org_id={org_id}&search=john&skills=react,typescript
```

**Query Parameters:**
- `org_id` (required) - Organization ID
- `search` - Search in name, email, or skills
- `skills` - Filter by skills (comma-separated)
- `experience_level` - Filter by experience level
- `location` - Filter by location
- `source` - Filter by application source
- `created_after` - Filter by creation date
- `limit` - Results per page (default: 20)
- `page` - Page number (default: 1)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "candidate_101",
      "name": "John Smith",
      "email": "john.smith@email.com",
      "phone": "+1-555-0123",
      "location": "San Francisco, CA",
      "experience_level": "senior",
      "skills": ["React", "TypeScript", "Node.js"],
      "resume_url": "https://storage.com/resume.pdf",
      "summary": "Experienced full-stack developer with 8 years...",
      "education": [
        {
          "degree": "Bachelor of Computer Science",
          "school": "Stanford University",
          "graduation_year": 2015
        }
      ],
      "experience": [
        {
          "title": "Senior Software Engineer",
          "company": "Tech Corp",
          "start_date": "2020-01-01",
          "end_date": null,
          "current": true,
          "description": "Lead frontend development team..."
        }
      ],
      "created_at": "2024-01-18T11:20:00Z"
    }
  ]
}
```

### Create Candidate
```http
POST /api/candidates
{
  "org_id": "org_123",
  "name": "Jane Doe",
  "email": "jane.doe@email.com",
  "phone": "+1-555-0124",
  "location": "Boston, MA",
  "skills": ["Python", "Django", "PostgreSQL"],
  "experience_level": "mid",
  "summary": "Full-stack developer with strong backend focus..."
}
```

### Get Candidate Profile
```http
GET /api/candidates/{candidate_id}
```

### Update Candidate
```http
PUT /api/candidates/{candidate_id}
{
  "skills": ["Python", "Django", "FastAPI", "PostgreSQL"],
  "location": "Remote"
}
```

### Upload Resume
```http
POST /api/candidates/{candidate_id}/resume
Content-Type: multipart/form-data

{
  "resume": [file_data]
}
```

## 📋 Applications API

### List Applications
```http
GET /api/applications?org_id={org_id}&job_id={job_id}&stage=interview
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "app_202",
      "job_id": "job_456",
      "candidate_id": "candidate_101",
      "stage": "interview",
      "status": "active",
      "applied_at": "2024-01-25T16:45:00Z",
      "updated_at": "2024-01-26T10:30:00Z",
      "notes": "Strong technical background, good cultural fit",
      "candidate": {
        "id": "candidate_101",
        "name": "John Smith",
        "email": "john.smith@email.com"
      },
      "job": {
        "id": "job_456",
        "title": "Senior React Developer"
      }
    }
  ]
}
```

### Create Application
```http
POST /api/applications
{
  "job_id": "job_456",
  "candidate_id": "candidate_101",
  "stage": "applied",
  "cover_letter": "I'm very interested in this position...",
  "application_data": {
    "why_interested": "Company mission aligns with my values",
    "availability": "2 weeks notice"
  }
}
```

### Move Application Stage
```http
PATCH /api/applications/{application_id}/move
{
  "stage": "interview",
  "notes": "Phone screen completed successfully"
}
```

## 🔍 AI Features API

### Parse Resume
```http
POST /api/ai/parse-resume
Content-Type: multipart/form-data

{
  "resume": [file_data],
  "extract_skills": true,
  "extract_experience": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "contact": {
      "name": "John Smith",
      "email": "john.smith@email.com",
      "phone": "+1-555-0123",
      "location": "San Francisco, CA"
    },
    "skills": ["React", "TypeScript", "Node.js", "Python"],
    "experience": [
      {
        "title": "Senior Software Engineer",
        "company": "Tech Corp",
        "start_date": "2020-01",
        "end_date": null,
        "duration": "4 years",
        "description": "Led development of customer-facing applications..."
      }
    ],
    "education": [
      {
        "degree": "Bachelor of Computer Science",
        "school": "Stanford University",
        "graduation_year": "2015"
      }
    ],
    "summary": "Experienced full-stack developer with expertise in modern web technologies...",
    "confidence_score": 0.95
  }
}
```

### Generate Hiring Insights
```http
POST /api/ai/insights
{
  "org_id": "org_123",
  "job_id": "job_456",
  "time_period": "last_30_days",
  "include_recommendations": true
}
```

## 📊 Analytics API

### Get Dashboard Metrics
```http
GET /api/analytics/dashboard?org_id={org_id}&period=last_30_days
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobs": {
      "total": 15,
      "open": 8,
      "filled": 5,
      "on_hold": 2
    },
    "candidates": {
      "total": 245,
      "new_this_week": 12,
      "active": 89
    },
    "applications": {
      "total": 156,
      "by_stage": {
        "applied": 45,
        "interview": 23,
        "offer": 8,
        "hired": 12
      }
    },
    "metrics": {
      "avg_time_to_hire": 18.5,
      "application_to_interview_rate": 0.35,
      "offer_acceptance_rate": 0.85
    }
  }
}
```

### Get Pipeline Analytics
```http
GET /api/analytics/pipeline?org_id={org_id}&job_id={job_id}
```

### Export Report
```http
GET /api/analytics/export?org_id={org_id}&type=candidates&format=csv&date_from=2024-01-01&date_to=2024-01-31
```

## 🔗 Webhooks API

### List Webhooks
```http
GET /api/webhooks?org_id={org_id}
```

### Create Webhook
```http
POST /api/webhooks
{
  "org_id": "org_123",
  "url": "https://yourapp.com/webhook",
  "events": ["application.created", "application.moved"],
  "secret": "webhook_secret_key"
}
```

### Webhook Events
Available webhook events:
- `application.created` - New application submitted
- `application.moved` - Application stage changed
- `candidate.created` - New candidate added
- `job.published` - Job posted publicly
- `interview.scheduled` - Interview scheduled

**Webhook Payload:**
```json
{
  "event": "application.created",
  "timestamp": "2024-01-25T16:45:00Z",
  "data": {
    "application": { /* application object */ },
    "job": { /* job object */ },
    "candidate": { /* candidate object */ }
  }
}
```

## ⚡ Rate Limiting

### Default Limits
- **Public API**: 100 requests per minute
- **Authenticated API**: 1000 requests per minute
- **Enterprise API**: 5000 requests per minute

### Rate Limit Headers
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642694400
```

### Exceeding Limits
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retry_after": 60
  }
}
```

## 🔍 Search & Filtering

### Search Operators
- `search=john smith` - Basic text search
- `search="john smith"` - Exact phrase search
- `skills=react,typescript` - Multiple values (OR logic)
- `experience_level=senior` - Exact match
- `created_after=2024-01-01` - Date filtering
- `remote=true` - Boolean filtering

### Sorting
```http
GET /api/candidates?sort=created_at:desc,name:asc
```

Available sort fields:
- `created_at`, `updated_at`
- `name`, `email`
- `experience_level`

## 📝 Validation & Errors

### Common Validation Rules
- **Email**: Must be valid email format
- **Phone**: International format preferred
- **URLs**: Must be valid HTTP/HTTPS URLs
- **Dates**: ISO 8601 format (YYYY-MM-DD)
- **IDs**: UUID format

### Field Validation Errors
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format",
        "code": "invalid_format"
      },
      {
        "field": "salary_min",
        "message": "Must be greater than 0",
        "code": "min_value"
      }
    ]
  }
}
```

## 🚀 SDK & Examples

### JavaScript SDK
```typescript
import { TalentPatriotAPI } from '@talentpatriot/sdk'

const client = new TalentPatriotAPI({
  apiKey: 'your-api-key',
  baseURL: 'https://api.talentpatriot.com/v1'
})

// List jobs
const jobs = await client.jobs.list({
  orgId: 'org_123',
  status: 'open'
})

// Create candidate
const candidate = await client.candidates.create({
  orgId: 'org_123',
  name: 'Jane Doe',
  email: 'jane@example.com'
})
```

### Python Example
```python
import requests

headers = {
    'Authorization': 'Bearer your-jwt-token',
    'Content-Type': 'application/json'
}

response = requests.get(
    'https://api.talentpatriot.com/v1/jobs',
    headers=headers,
    params={'org_id': 'org_123', 'status': 'open'}
)

jobs = response.json()['data']
```

### cURL Examples
```bash
# List jobs
curl -X GET "https://api.talentpatriot.com/v1/jobs?org_id=org_123" \
  -H "Authorization: Bearer your-jwt-token"

# Create candidate
curl -X POST "https://api.talentpatriot.com/v1/candidates" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "org_id": "org_123",
    "name": "John Doe",
    "email": "john@example.com"
  }'
```

---

## 📚 Additional Resources

- **[OpenAPI Specification](./openapi.yaml)** - Machine-readable API spec
- **[Postman Collection](./postman-collection.json)** - Ready-to-use API collection
- **[SDK Documentation](./sdk.md)** - Official SDK guides
- **[Webhook Guide](./webhooks.md)** - Detailed webhook implementation

Need help? Check our [troubleshooting guide](../troubleshooting.md) or contact API support.