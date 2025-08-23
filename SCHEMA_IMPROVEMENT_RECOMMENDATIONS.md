# TalentPatriot Database Schema Improvement Recommendations
**Date**: August 22, 2025  
**Analysis**: Based on Supabase Schema Visualizer Review

## 🎯 Current Schema Strengths

✅ **Multi-Tenancy Design**: Excellent org_id isolation across all tables  
✅ **Comprehensive ATS Coverage**: All recruitment entities properly modeled  
✅ **Flexible Pipeline System**: Job-specific Kanban columns  
✅ **Rich Messaging**: Thread support and context references  
✅ **AI Integration Ready**: Resume parsing and searchable content fields  
✅ **Proper Relations**: Well-defined foreign key relationships

## 🚀 Priority 1: Performance Optimization

### Critical Missing Indexes
```sql
-- Core query performance indexes
CREATE INDEX idx_candidates_org_email ON candidates(org_id, email);
CREATE INDEX idx_job_candidate_status ON job_candidate(status, org_id);
CREATE INDEX idx_jobs_status_published ON jobs(status, published_at, org_id);
CREATE INDEX idx_messages_thread ON messages(thread_id, created_at);
CREATE INDEX idx_interviews_scheduled ON interviews(scheduled_at, status);

-- Full-text search indexes (GIN)
CREATE INDEX idx_candidates_skills_gin ON candidates USING gin(skills);
CREATE INDEX idx_candidates_search_gin ON candidates USING gin(searchable_content);
CREATE INDEX idx_jobs_description_gin ON jobs USING gin(to_tsvector('english', description));
```

### Composite Indexes for Common Queries
```sql
-- Dashboard and reporting queries
CREATE INDEX idx_job_candidates_pipeline ON job_candidate(job_id, pipeline_column_id, status);
CREATE INDEX idx_candidates_experience ON candidates(org_id, experience_level, total_years_experience);
CREATE INDEX idx_jobs_filters ON jobs(org_id, status, job_type, remote_option);
```

## 🔧 Priority 2: Data Integrity Enhancements

### Add Validation Constraints
```sql
-- Email format validation
ALTER TABLE candidates ADD CONSTRAINT chk_email_format 
  CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$');

ALTER TABLE clients ADD CONSTRAINT chk_contact_email_format 
  CHECK (contact_email IS NULL OR contact_email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$');

-- Salary range validation
ALTER TABLE jobs ADD CONSTRAINT chk_salary_range_format 
  CHECK (salary_range IS NULL OR salary_range ~ '^\$[\d,]+-?\$?[\d,]*$');

-- Rating validation
ALTER TABLE interviews ADD CONSTRAINT chk_rating_range 
  CHECK (rating IS NULL OR (rating::integer >= 1 AND rating::integer <= 10));

-- Phone number validation
ALTER TABLE candidates ADD CONSTRAINT chk_phone_format 
  CHECK (phone IS NULL OR phone ~ '^[\+]?[1-9][\d\-\s\(\)\.]{7,15}$');
```

### Referential Integrity
```sql
-- Ensure proper cascade behavior
ALTER TABLE job_candidate ADD CONSTRAINT fk_job_candidate_pipeline_col 
  FOREIGN KEY (pipeline_column_id) REFERENCES pipeline_columns(id) ON DELETE SET NULL;

ALTER TABLE candidate_notes ADD CONSTRAINT fk_candidate_notes_author 
  FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE CASCADE;
```

## 📊 Priority 3: Schema Normalization Improvements

### 1. Create Department Reference Table
```sql
-- Normalize departments across organizations
CREATE TABLE departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations(id) NOT NULL,
  name varchar(100) NOT NULL,
  description text,
  created_at timestamp DEFAULT now() NOT NULL,
  UNIQUE(org_id, name)
);

-- Update existing tables to reference departments
ALTER TABLE jobs ADD COLUMN department_id uuid REFERENCES departments(id);
ALTER TABLE user_profiles ADD COLUMN department_id uuid REFERENCES departments(id);
```

### 2. Separate Address/Location Data
```sql
-- Normalize location data
CREATE TABLE locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations(id) NOT NULL,
  name varchar(100) NOT NULL, -- "New York Office", "Remote", etc.
  address_line1 varchar(255),
  address_line2 varchar(255),
  city varchar(100),
  state_province varchar(100),
  postal_code varchar(20),
  country varchar(100) DEFAULT 'United States',
  timezone varchar(50),
  is_remote boolean DEFAULT false,
  created_at timestamp DEFAULT now() NOT NULL
);

-- Update jobs and other tables
ALTER TABLE jobs ADD COLUMN location_id uuid REFERENCES locations(id);
```

### 3. Skills Taxonomy Table
```sql
-- Create structured skills taxonomy
CREATE TABLE skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(100) UNIQUE NOT NULL,
  category varchar(50), -- "Programming", "Design", "Management"
  description text,
  aliases text[], -- Alternative names for the skill
  created_at timestamp DEFAULT now() NOT NULL
);

-- Junction table for candidate skills with proficiency
CREATE TABLE candidate_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE,
  skill_id uuid REFERENCES skills(id) ON DELETE CASCADE,
  proficiency_level integer CHECK (proficiency_level BETWEEN 1 AND 5),
  years_experience integer DEFAULT 0,
  verified boolean DEFAULT false,
  created_at timestamp DEFAULT now() NOT NULL,
  UNIQUE(candidate_id, skill_id)
);
```

## ⚡ Priority 4: Data Type Optimizations

### Fix Inappropriate Data Types
```sql
-- Convert text fields to proper numeric types
ALTER TABLE interviews 
  ALTER COLUMN duration TYPE integer USING duration::integer,
  ALTER COLUMN rating TYPE integer USING rating::integer;

-- Convert boolean-like text to actual boolean
ALTER TABLE candidate_notes 
  ALTER COLUMN is_private TYPE boolean USING is_private::boolean;

-- Add proper JSONB for structured data
ALTER TABLE candidates 
  ALTER COLUMN education TYPE jsonb USING education::jsonb,
  ADD COLUMN employment_history jsonb,
  ADD COLUMN certifications jsonb;
```

### Optimize VARCHAR Lengths
```sql
-- Right-size varchar fields
ALTER TABLE jobs ALTER COLUMN public_slug TYPE varchar(100);
ALTER TABLE organizations ALTER COLUMN slug TYPE varchar(50);
ALTER TABLE candidates ALTER COLUMN phone TYPE varchar(20);
```

## 🔍 Priority 5: Add Missing Business Tables

### 1. Job Templates for Efficiency
```sql
CREATE TABLE job_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations(id) NOT NULL,
  name varchar(255) NOT NULL,
  title varchar(255) NOT NULL,
  description text,
  requirements text,
  benefits text,
  job_type job_type DEFAULT 'full-time',
  experience_level experience_level DEFAULT 'mid',
  remote_option remote_option DEFAULT 'onsite',
  created_by uuid NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);
```

### 2. Audit Trail for Compliance
```sql
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations(id) NOT NULL,
  table_name varchar(50) NOT NULL,
  record_id uuid NOT NULL,
  action varchar(20) NOT NULL, -- INSERT, UPDATE, DELETE
  changed_fields jsonb,
  old_values jsonb,
  new_values jsonb,
  user_id uuid NOT NULL,
  ip_address inet,
  user_agent text,
  created_at timestamp DEFAULT now() NOT NULL
);

-- Index for audit queries
CREATE INDEX idx_audit_logs_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at);
```

### 3. Organization Settings
```sql
CREATE TABLE organization_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations(id) NOT NULL UNIQUE,
  branding_colors jsonb, -- {primary: "#1e40af", secondary: "#..."}
  email_templates jsonb,
  workflow_settings jsonb,
  compliance_settings jsonb,
  integration_settings jsonb,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);
```

## 🛡️ Priority 6: Security Enhancements

### Row-Level Security Policies
```sql
-- Enable RLS on all tables (if not already enabled)
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_candidate ENABLE ROW LEVEL SECURITY;

-- Sample RLS policies
CREATE POLICY candidates_org_isolation ON candidates
  FOR ALL TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations 
    WHERE user_id = auth.uid()
  ));
```

### Sensitive Data Protection
```sql
-- Create function for phone number masking
CREATE OR REPLACE FUNCTION mask_phone(phone text)
RETURNS text AS $$
BEGIN
  IF phone IS NULL OR length(phone) < 4 THEN
    RETURN phone;
  END IF;
  RETURN left(phone, 3) || 'XXX-XXXX';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 📈 Priority 7: Analytics & Reporting Tables

### 1. Pre-computed Metrics
```sql
CREATE MATERIALIZED VIEW recruitment_metrics AS
SELECT 
  j.org_id,
  j.id as job_id,
  j.title as job_title,
  COUNT(jc.id) as total_applications,
  COUNT(CASE WHEN jc.stage = 'hired' THEN 1 END) as hires,
  AVG(EXTRACT(days FROM jc.updated_at - jc.created_at)) as avg_time_to_hire,
  DATE_TRUNC('month', jc.created_at) as period
FROM jobs j
LEFT JOIN job_candidate jc ON j.id = jc.job_id
WHERE j.status = 'open'
GROUP BY j.org_id, j.id, j.title, DATE_TRUNC('month', jc.created_at);

CREATE UNIQUE INDEX idx_recruitment_metrics ON recruitment_metrics(job_id, period);
```

### 2. Performance Tracking
```sql
CREATE TABLE recruiter_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations(id) NOT NULL,
  user_id uuid NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  jobs_posted integer DEFAULT 0,
  applications_received integer DEFAULT 0,
  interviews_conducted integer DEFAULT 0,
  offers_made integer DEFAULT 0,
  hires_completed integer DEFAULT 0,
  avg_time_to_hire interval,
  calculated_at timestamp DEFAULT now() NOT NULL
);
```

## 🔄 Implementation Priority Order

### Phase 1 (Immediate - Performance Critical)
1. ✅ Add critical indexes for query performance
2. ✅ Fix data type issues (duration, rating, is_private)
3. ✅ Add email and phone validation constraints

### Phase 2 (Short-term - Business Logic)
1. ✅ Create departments and locations tables
2. ✅ Implement skills taxonomy
3. ✅ Add job templates for efficiency

### Phase 3 (Medium-term - Analytics)
1. ✅ Create materialized views for metrics
2. ✅ Implement audit logging
3. ✅ Add organization settings

### Phase 4 (Long-term - Advanced Features)
1. ✅ Enhanced RLS policies
2. ✅ Data masking functions
3. ✅ Performance tracking tables

## 📋 Maintenance Recommendations

### Regular Tasks
- **Weekly**: Refresh materialized views for analytics
- **Monthly**: Analyze slow query logs and add indexes as needed
- **Quarterly**: Review audit logs and archive old data
- **Yearly**: Full schema review and optimization analysis

### Monitoring
- Set up alerts for slow queries (>1s execution time)
- Monitor index usage and remove unused indexes
- Track table size growth and plan partitioning if needed
- Monitor RLS policy performance impact

---

**Next Steps**: Implement Phase 1 improvements first, as they provide immediate performance benefits with minimal risk to existing functionality.