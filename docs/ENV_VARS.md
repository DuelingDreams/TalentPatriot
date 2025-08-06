# Environment Variables

## Required Variables

| Variable | Description | Example Value | Required |
|----------|-------------|---------------|----------|
| `SUPABASE_URL` | Supabase project URL | `https://your-project.supabase.co` | Yes |
| `SUPABASE_ANON_KEY` | Supabase anonymous/public key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Yes |
| `VITE_SUPABASE_URL` | Frontend Supabase URL | `https://your-project.supabase.co` | Yes |
| `VITE_SUPABASE_ANON_KEY` | Frontend Supabase anon key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Yes |

## Optional Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `development` | No |
| `PORT` | Server port | `5000` | No |
| `ENABLE_DEMO_MODE` | Enable demo mode with sample data | `false` | No |

## Setup Instructions

1. Copy `.env.example` to `.env`
2. Get your Supabase credentials from your project dashboard
3. Update the values in `.env`
4. Restart the development server

## Security Notes

- Never commit `.env` files to version control
- Keep service role keys secure - they have admin access
- Use environment-specific Supabase projects for dev/staging/prod