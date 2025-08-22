# Developer Guide

Welcome to the TalentPatriot developer documentation. This guide covers technical implementation details, architecture decisions, and development best practices.

## 🏗️ Architecture Overview

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL via Supabase
- **ORM**: Drizzle ORM
- **UI Framework**: Tailwind CSS + Radix UI + Shadcn/ui
- **State Management**: TanStack React Query
- **Authentication**: Supabase Auth + OAuth (Google/Microsoft)
- **AI Integration**: OpenAI GPT-4o
- **Email Service**: SendGrid
- **File Storage**: Supabase Storage

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client   │────│  Express API    │────│   PostgreSQL    │
│                 │    │                 │    │    (Supabase)   │
│ • TypeScript    │    │ • RESTful APIs  │    │                 │
│ • Tailwind CSS  │    │ • Zod validation│    │ • Multi-tenant  │
│ • React Query   │    │ • Auth middleware│    │ • RLS policies  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │   External APIs │              │
         │              │                 │              │
         └──────────────│ • OpenAI GPT-4o │──────────────┘
                        │ • SendGrid      │
                        │ • OAuth Providers│
                        └─────────────────┘
```

## 🚀 Getting Started

### Development Setup
```bash
# Clone repository
git clone [repository-url]
cd talentpatriot

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Set up database
npm run db:push

# Start development server
npm run dev
```

### Environment Variables
```env
# Database
DATABASE_URL=your_supabase_database_url
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key

# AI Integration
OPENAI_API_KEY=your_openai_api_key

# Email Service
SENDGRID_API_KEY=your_sendgrid_api_key

# Authentication
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
```

## 📁 Project Structure

```
talentpatriot/
├── client/src/              # Frontend React application
│   ├── components/          # Reusable UI components
│   ├── pages/              # Page components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions
│   └── contexts/           # React contexts
├── server/                 # Backend Express application
│   ├── routes.ts           # API route definitions
│   ├── storage.ts          # Database operations
│   ├── lib/                # Server utilities
│   └── middleware/         # Express middleware
├── shared/                 # Shared code between client/server
│   └── schema.ts           # Database schema definitions
├── docs/                   # Documentation
└── migrations/             # Database migrations
```

### Frontend Architecture
```
client/src/
├── components/
│   ├── ui/                 # Base UI components (shadcn/ui)
│   ├── layout/             # Layout components
│   ├── forms/              # Form components
│   ├── dialogs/            # Modal dialogs
│   └── dashboard/          # Dashboard-specific components
├── pages/                  # Route components
├── hooks/                  # Custom hooks for data fetching
├── lib/
│   ├── queryClient.ts      # React Query configuration
│   ├── utils.ts            # Utility functions
│   └── validations.ts      # Form validation schemas
└── contexts/
    └── AuthContext.tsx     # Authentication context
```

### Backend Architecture
```
server/
├── routes.ts               # Main API routes
├── storage.ts              # Database abstraction layer
├── lib/
│   ├── auth.ts            # Authentication utilities
│   ├── email.ts           # Email service integration
│   ├── ai.ts              # OpenAI integration
│   └── validation.ts      # Request validation
└── middleware/
    ├── auth.ts            # Authentication middleware
    ├── validation.ts      # Request validation middleware
    └── rateLimiting.ts    # Rate limiting middleware
```

## 🗄️ Database Design

### Core Tables
- `organizations` - Multi-tenant organization data
- `users` - User accounts and profiles
- `user_organizations` - Many-to-many user-org relationships
- `clients` - Client/department management
- `jobs` - Job postings and requirements
- `candidates` - Candidate profiles and information
- `job_candidates` - Applications linking jobs and candidates
- `pipeline_columns` - Customizable pipeline stages
- `candidate_notes` - Collaboration notes on candidates

### Key Design Decisions

#### Multi-Tenancy
- All data tables include `org_id` for organization isolation
- Row-Level Security (RLS) policies enforce data access
- Subdomain routing for branded careers pages

#### Pipeline System
- Dynamic pipeline stages per organization/job
- Kanban-style drag-and-drop interface
- Real-time updates via Supabase Realtime

#### Security
- UUID primary keys prevent enumeration attacks
- Comprehensive input validation with Zod
- Role-based permissions system
- Secure file upload and storage

## 🔌 API Design

### RESTful Endpoints
```typescript
// Jobs
GET    /api/jobs                    # List jobs
POST   /api/jobs                    # Create job  
GET    /api/jobs/:id                # Get job details
PUT    /api/jobs/:id                # Update job
DELETE /api/jobs/:id                # Delete job

// Candidates
GET    /api/candidates              # List candidates
POST   /api/candidates              # Create candidate
GET    /api/candidates/:id          # Get candidate details
PUT    /api/candidates/:id          # Update candidate

// Pipeline
GET    /api/jobs/:id/pipeline       # Get job pipeline
PATCH  /api/applications/:id/move   # Move application stage

// AI Features
POST   /api/ai/parse-resume         # Parse resume with AI
POST   /api/ai/generate-insights    # Generate hiring insights
```

### Request/Response Format
```typescript
// Standard success response
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}

// Error response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### Authentication
- JWT tokens via Supabase Auth
- OAuth integration (Google, Microsoft)
- Role-based access control
- Multi-tenant organization context

## 🎨 Frontend Development

### Component Guidelines
```typescript
// Component structure
interface ComponentProps {
  // Props interface
}

export function ComponentName({ prop1, prop2 }: ComponentProps) {
  // Hooks at the top
  const { data, isLoading } = useQuery(...)
  const mutation = useMutation(...)
  
  // Event handlers
  const handleAction = () => {
    // Implementation
  }
  
  // Render with proper TypeScript
  return (
    <div className="tailwind-classes">
      {/* Component JSX */}
    </div>
  )
}
```

### State Management
- React Query for server state
- React Context for global client state
- Local component state for UI interactions
- Form state managed by React Hook Form

### Styling Approach
- Tailwind CSS for utility-first styling
- Radix UI for accessible components
- Shadcn/ui for design system consistency
- Custom CSS variables for theming

## ⚙️ Backend Development

### API Route Structure
```typescript
// Route handler pattern
app.get('/api/resource', async (req, res) => {
  try {
    // Validation
    const query = validateQuery(req.query)
    
    // Business logic
    const data = await storage.getResource(query)
    
    // Response
    res.json({ success: true, data })
  } catch (error) {
    // Error handling
    handleError(error, res)
  }
})
```

### Database Operations
```typescript
// Storage layer pattern
export class Storage {
  async getResource(filters: Filters): Promise<Resource[]> {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .match(filters)
    
    if (error) throw error
    return data
  }
}
```

### Error Handling
- Centralized error handling middleware
- Structured error responses
- Logging for debugging and monitoring
- Graceful degradation for external service failures

## 🧪 Testing Strategy

### Frontend Testing
```typescript
// Component testing with React Testing Library
import { render, screen, fireEvent } from '@testing-library/react'
import { ComponentName } from './ComponentName'

test('component behavior', () => {
  render(<ComponentName prop="value" />)
  expect(screen.getByText('Expected Text')).toBeInTheDocument()
})
```

### Backend Testing
```typescript
// API endpoint testing
import request from 'supertest'
import { app } from '../server'

describe('API Endpoints', () => {
  test('GET /api/jobs', async () => {
    const response = await request(app)
      .get('/api/jobs')
      .expect(200)
    
    expect(response.body.success).toBe(true)
  })
})
```

### Testing Types
- Unit tests for utilities and helpers
- Integration tests for API endpoints
- Component tests for UI behavior
- End-to-end tests for critical user flows

## 📦 Deployment

### Production Build
```bash
# Build frontend
npm run build

# Database migrations
npm run db:push

# Start production server
npm run start
```

### Environment Configuration
- Separate configs for development/staging/production
- Environment-specific database connections
- Feature flags for gradual rollouts
- Monitoring and logging setup

### CI/CD Pipeline
1. **Code Quality**: Linting, type checking, testing
2. **Security Scanning**: Dependency vulnerabilities, code security
3. **Build Process**: Frontend build, backend compilation
4. **Deployment**: Automated deployment to staging/production
5. **Monitoring**: Health checks, performance monitoring

## 🛡️ Security Considerations

### Data Protection
- Input sanitization and validation
- SQL injection prevention via parameterized queries
- XSS prevention through proper escaping
- CSRF protection for state-changing operations

### Access Control
- Role-based permissions system
- Multi-tenant data isolation
- API rate limiting
- Secure session management

### File Upload Security
- File type validation
- Virus scanning integration
- Secure storage with access controls
- Content-type verification

## 📊 Performance Optimization

### Frontend Performance
- Code splitting and lazy loading
- Image optimization and caching
- Bundle size optimization
- Efficient re-rendering strategies

### Backend Performance
- Database query optimization
- Caching strategies (Redis)
- Connection pooling
- Background job processing

### Database Performance
- Proper indexing strategies
- Query optimization
- Connection pooling
- Read replicas for scaling

---

## 🚀 Next Steps

1. **[API Reference](../api/README.md)** - Detailed API documentation
2. **[Database Schema](./database.md)** - Complete schema reference
3. **[Deployment Guide](./deployment.md)** - Production deployment
4. **[Contributing](../contributing.md)** - How to contribute code

Need help? Check our [troubleshooting guide](../troubleshooting.md) or reach out to the development team.