# Feature-Based Route Architecture

This directory contains modular route handlers organized by feature domain.

## Existing Modules
- `google-auth.ts` - OAuth authentication with Google
- `google-calendar.ts` - Google Calendar integration
- `upload.ts` - File upload handling

## Planned Migration

The main `routes.ts` file (5700+ lines) should be incrementally split into feature modules:

### Route Domains to Extract

| Module | Routes Pattern | Priority |
|--------|---------------|----------|
| `candidates.ts` | `/api/candidates/*` | High |
| `jobs.ts` | `/api/jobs/*` | High |
| `organizations.ts` | `/api/organizations/*` | Medium |
| `analytics.ts` | `/api/analytics/*`, `/api/reports/*` | Medium |
| `clients.ts` | `/api/clients/*` | Medium |
| `campaigns.ts` | `/api/drip-campaigns/*` | Medium |
| `ai.ts` | `/api/ai/*` | Low |
| `data.ts` | `/api/data/*` (import/export) | Low |

### Implementation Pattern

Each route module should export a function that registers routes:

```typescript
// server/routes/candidates.ts
import { Router } from 'express';
import { storage } from '../storage';
import { requireAuth, requireRecruiting } from '../middleware/auth';
import { writeLimiter } from '../middleware/rate-limit';

export function createCandidateRoutes() {
  const router = Router();

  router.get('/', requireAuth, async (req, res) => {
    // Implementation
  });

  router.get('/:id', requireAuth, async (req, res) => {
    // Implementation
  });

  // ... more routes

  return router;
}
```

### Registration in routes.ts

```typescript
// In registerRoutes function
app.use('/api/candidates', createCandidateRoutes());
app.use('/api/jobs', createJobRoutes());
// etc.
```

### Migration Steps

1. Create the feature route module
2. Extract routes from routes.ts to the module
3. Register the module in routes.ts
4. Test all affected endpoints
5. Remove old routes from routes.ts

### Notes

- Keep shared utilities (generateETag, setResponseCaching) in a shared file
- Maintain backward compatibility during migration
- Test thoroughly before removing old code
