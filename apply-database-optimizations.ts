/**
 * Database Optimization Deployment Script
 * 
 * This script applies the optimized database schema and RLS policies to the Supabase instance.
 * It includes comprehensive logging, validation, and rollback capabilities.
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

interface MigrationStep {
  name: string;
  sql: string;
  rollback?: string;
  validate?: () => Promise<boolean>;
}

class DatabaseMigrator {
  private db: any;
  private steps: MigrationStep[] = [];
  private executedSteps: string[] = [];

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    
    const sql = neon(process.env.DATABASE_URL);
    this.db = drizzle(sql);
    this.loadMigrationSteps();
  }

  private loadMigrationSteps() {
    this.steps = [
      {
        name: "fix_boolean_types",
        sql: `
          -- Fix boolean type for candidate_notes.is_private
          ALTER TABLE candidate_notes 
          ALTER COLUMN is_private TYPE BOOLEAN 
          USING CASE 
            WHEN is_private = 'true' THEN true 
            WHEN is_private = 'false' THEN false 
            ELSE false 
          END;
          
          -- Update default constraint
          ALTER TABLE candidate_notes 
          ALTER COLUMN is_private SET DEFAULT false;
        `,
        rollback: `
          ALTER TABLE candidate_notes 
          ALTER COLUMN is_private TYPE VARCHAR(10) 
          USING is_private::VARCHAR;
        `
      },
      
      {
        name: "create_composite_indexes",
        sql: `
          -- Composite indexes for common query patterns
          CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_client_status_created 
          ON jobs(client_id, status, created_at DESC);
          
          CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_candidate_compound 
          ON job_candidate(job_id, stage, status, updated_at DESC);
          
          CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_candidates_email_status 
          ON candidates(email, status) WHERE status = 'active';
        `,
        rollback: `
          DROP INDEX IF EXISTS idx_jobs_client_status_created;
          DROP INDEX IF EXISTS idx_job_candidate_compound;
          DROP INDEX IF EXISTS idx_candidates_email_status;
        `
      },
      
      {
        name: "create_partial_indexes",
        sql: `
          -- Partial indexes for filtered queries
          CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_active_jobs 
          ON jobs(created_at DESC) WHERE record_status = 'active';
          
          CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_demo_jobs 
          ON jobs(created_at DESC) WHERE record_status = 'demo';
          
          CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_active_candidates 
          ON candidates(created_at DESC) WHERE status = 'active';
          
          CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pipeline_stage_status 
          ON job_candidate(stage, status, updated_at DESC) WHERE status IN ('active', 'demo');
        `,
        rollback: `
          DROP INDEX IF EXISTS idx_active_jobs;
          DROP INDEX IF EXISTS idx_demo_jobs;
          DROP INDEX IF EXISTS idx_active_candidates;
          DROP INDEX IF EXISTS idx_pipeline_stage_status;
        `
      },
      
      {
        name: "create_search_vectors",
        sql: `
          -- Enhanced search vectors for candidates
          ALTER TABLE candidates ADD COLUMN IF NOT EXISTS search_vector tsvector 
          GENERATED ALWAYS AS (
            setweight(to_tsvector('english', name), 'A') ||
            setweight(to_tsvector('english', email), 'B') ||
            setweight(to_tsvector('english', COALESCE(phone, '')), 'C')
          ) STORED;
          
          CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_candidates_search 
          ON candidates USING gin(search_vector);
          
          -- Enhanced search vectors for clients
          ALTER TABLE clients ADD COLUMN IF NOT EXISTS search_vector tsvector 
          GENERATED ALWAYS AS (
            setweight(to_tsvector('english', name), 'A') ||
            setweight(to_tsvector('english', COALESCE(industry, '')), 'B') ||
            setweight(to_tsvector('english', COALESCE(contact_name, '')), 'C') ||
            setweight(to_tsvector('english', COALESCE(contact_email, '')), 'D')
          ) STORED;
          
          CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_search 
          ON clients USING gin(search_vector);
        `,
        rollback: `
          DROP INDEX IF EXISTS idx_candidates_search;
          DROP INDEX IF EXISTS idx_clients_search;
          ALTER TABLE candidates DROP COLUMN IF EXISTS search_vector;
          ALTER TABLE clients DROP COLUMN IF EXISTS search_vector;
        `
      },
      
      {
        name: "create_dashboard_materialized_view",
        sql: `
          -- Create materialized view for dashboard statistics
          CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_stats AS
          SELECT 
            -- Client statistics
            (SELECT COUNT(*) FROM clients WHERE status = 'active') as active_clients,
            (SELECT COUNT(*) FROM clients WHERE status = 'demo') as demo_clients,
            
            -- Job statistics
            (SELECT COUNT(*) FROM jobs WHERE record_status = 'active' AND status = 'open') as open_jobs,
            (SELECT COUNT(*) FROM jobs WHERE record_status = 'active' AND status = 'filled') as filled_jobs,
            (SELECT COUNT(*) FROM jobs WHERE record_status = 'demo') as demo_jobs,
            
            -- Candidate statistics
            (SELECT COUNT(*) FROM candidates WHERE status = 'active') as active_candidates,
            (SELECT COUNT(*) FROM candidates WHERE status = 'demo') as demo_candidates,
            
            -- Pipeline statistics by stage
            (SELECT COUNT(*) FROM job_candidate WHERE status = 'active' AND stage = 'applied') as applied_count,
            (SELECT COUNT(*) FROM job_candidate WHERE status = 'active' AND stage = 'screening') as screening_count,
            (SELECT COUNT(*) FROM job_candidate WHERE status = 'active' AND stage = 'interview') as interview_count,
            (SELECT COUNT(*) FROM job_candidate WHERE status = 'active' AND stage = 'technical') as technical_count,
            (SELECT COUNT(*) FROM job_candidate WHERE status = 'active' AND stage = 'final') as final_count,
            (SELECT COUNT(*) FROM job_candidate WHERE status = 'active' AND stage = 'offer') as offer_count,
            (SELECT COUNT(*) FROM job_candidate WHERE status = 'active' AND stage = 'hired') as hired_count,
            (SELECT COUNT(*) FROM job_candidate WHERE status = 'active' AND stage = 'rejected') as rejected_count,
            
            -- Demo pipeline statistics
            (SELECT COUNT(*) FROM job_candidate WHERE status = 'demo' AND stage = 'applied') as demo_applied_count,
            (SELECT COUNT(*) FROM job_candidate WHERE status = 'demo' AND stage = 'screening') as demo_screening_count,
            (SELECT COUNT(*) FROM job_candidate WHERE status = 'demo' AND stage = 'interview') as demo_interview_count,
            
            -- Recent activity
            (SELECT COUNT(*) FROM job_candidate WHERE status = 'active' AND updated_at > NOW() - INTERVAL '7 days') as recent_activity_count,
            
            -- Last updated
            NOW() as last_updated;
          
          -- Create unique index for materialized view
          CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_stats_unique ON dashboard_stats(last_updated);
        `,
        rollback: `
          DROP MATERIALIZED VIEW IF EXISTS dashboard_stats;
        `
      },
      
      {
        name: "create_optimization_functions",
        sql: `
          -- Function to refresh dashboard statistics
          CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
          RETURNS void AS $$
          BEGIN
            REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats;
          END;
          $$ LANGUAGE plpgsql;
          
          -- Function to update table statistics
          CREATE OR REPLACE FUNCTION update_table_stats()
          RETURNS void AS $$
          BEGIN
            ANALYZE clients;
            ANALYZE jobs;
            ANALYZE candidates;
            ANALYZE job_candidate;
            ANALYZE candidate_notes;
          END;
          $$ LANGUAGE plpgsql;
          
          -- Performance monitoring view
          CREATE OR REPLACE VIEW performance_metrics AS
          SELECT 
            schemaname,
            tablename,
            seq_scan,
            seq_tup_read,
            idx_scan,
            idx_tup_fetch,
            n_tup_ins,
            n_tup_upd,
            n_tup_del,
            n_live_tup,
            n_dead_tup
          FROM pg_stat_user_tables
          WHERE schemaname = 'public'
          ORDER BY seq_scan DESC;
        `,
        rollback: `
          DROP FUNCTION IF EXISTS refresh_dashboard_stats();
          DROP FUNCTION IF EXISTS update_table_stats();
          DROP VIEW IF EXISTS performance_metrics;
        `
      },
      
      {
        name: "optimize_rls_functions",
        sql: `
          -- Optimized role caching function
          CREATE OR REPLACE FUNCTION auth.get_user_role_cached()
          RETURNS TEXT
          LANGUAGE plpgsql
          SECURITY DEFINER
          STABLE
          AS $$
          DECLARE
            cached_role TEXT;
          BEGIN
            -- Try to get cached role from session
            BEGIN
              cached_role := current_setting('app.cached_user_role', true);
            EXCEPTION
              WHEN others THEN
                cached_role := null;
            END;
            
            -- If no cache or empty, compute and cache
            IF cached_role IS NULL OR cached_role = '' THEN
              SELECT COALESCE(
                (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role',
                CASE 
                  WHEN auth.uid() IS NOT NULL THEN 'authenticated'
                  ELSE 'anonymous'
                END
              ) INTO cached_role;
              
              -- Set session-level cache
              PERFORM set_config('app.cached_user_role', cached_role, false);
            END IF;
            
            RETURN cached_role;
          END;
          $$;
          
          -- RLS-optimized indexes
          CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rls_clients_status 
          ON clients(status) WHERE status IN ('active', 'demo');
          
          CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rls_jobs_status_assigned 
          ON jobs(record_status, assigned_to) WHERE record_status IN ('active', 'demo');
          
          CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rls_candidate_notes_private_author 
          ON candidate_notes(is_private, author_id);
        `,
        rollback: `
          DROP INDEX IF EXISTS idx_rls_clients_status;
          DROP INDEX IF EXISTS idx_rls_jobs_status_assigned;
          DROP INDEX IF EXISTS idx_rls_candidate_notes_private_author;
        `
      },
      
      {
        name: "initial_optimization",
        sql: `
          -- Initial table optimization
          SELECT refresh_dashboard_stats();
          SELECT update_table_stats();
        `,
        rollback: ``
      }
    ];
  }

  async executeSql(sql: string): Promise<{ success: boolean; error?: any }> {
    try {
      await this.db.execute(sql);
      return { success: true };
    } catch (error) {
      console.error('SQL execution failed:', error);
      return { success: false, error };
    }
  }

  async executeStep(step: MigrationStep): Promise<boolean> {
    console.log(`🔄 Executing step: ${step.name}`);
    
    const result = await this.executeSql(step.sql);
    
    if (result.success) {
      console.log(`✅ Step completed: ${step.name}`);
      this.executedSteps.push(step.name);
      return true;
    } else {
      console.error(`❌ Step failed: ${step.name}`, result.error);
      return false;
    }
  }

  async rollback(): Promise<void> {
    console.log('🔄 Starting rollback...');
    
    // Execute rollback in reverse order
    const stepsToRollback = this.steps
      .filter(step => this.executedSteps.includes(step.name) && step.rollback)
      .reverse();
    
    for (const step of stepsToRollback) {
      if (step.rollback) {
        console.log(`🔄 Rolling back: ${step.name}`);
        const result = await this.executeSql(step.rollback);
        
        if (result.success) {
          console.log(`✅ Rollback completed: ${step.name}`);
        } else {
          console.error(`❌ Rollback failed: ${step.name}`, result.error);
        }
      }
    }
  }

  async migrate(): Promise<boolean> {
    console.log('🚀 Starting database optimization migration...');
    
    for (const step of this.steps) {
      const success = await this.executeStep(step);
      
      if (!success) {
        console.error(`❌ Migration failed at step: ${step.name}`);
        console.log('🔄 Starting automatic rollback...');
        await this.rollback();
        return false;
      }
    }
    
    console.log('✅ All optimization steps completed successfully!');
    return true;
  }

  async testConnectivity(): Promise<boolean> {
    try {
      await this.db.execute('SELECT 1');
      console.log('✅ Database connectivity test passed');
      return true;
    } catch (error) {
      console.error('❌ Database connectivity test failed:', error);
      return false;
    }
  }

  async generateReport(): Promise<void> {
    console.log('\n📊 Optimization Report:');
    console.log('================================');
    
    try {
      // Check index usage
      const indexUsage = await this.db.execute(`
        SELECT 
          tablename,
          indexname,
          idx_tup_read,
          idx_tup_fetch
        FROM pg_stat_user_indexes 
        WHERE schemaname = 'public'
        ORDER BY idx_tup_read DESC
        LIMIT 10;
      `);
      
      console.log('\n🔍 Top 10 Most Used Indexes:');
      indexUsage.forEach((row: any) => {
        console.log(`  ${row.tablename}.${row.indexname}: ${row.idx_tup_read} reads`);
      });
      
      // Check table sizes
      const tableSizes = await this.db.execute(`
        SELECT 
          tablename,
          pg_size_pretty(pg_total_relation_size('public.'||tablename)) as size
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size('public.'||tablename) DESC;
      `);
      
      console.log('\n📦 Table Sizes:');
      tableSizes.forEach((row: any) => {
        console.log(`  ${row.tablename}: ${row.size}`);
      });
      
    } catch (error) {
      console.error('❌ Report generation failed:', error);
    }
  }
}

async function main() {
  const migrator = new DatabaseMigrator();
  
  // Test connectivity first
  const connected = await migrator.testConnectivity();
  if (!connected) {
    console.error('❌ Cannot connect to database. Please check DATABASE_URL');
    process.exit(1);
  }
  
  // Run migrations
  const success = await migrator.migrate();
  
  if (success) {
    console.log('\n🎉 Database optimization completed successfully!');
    await migrator.generateReport();
  } else {
    console.error('\n❌ Database optimization failed. Check logs above.');
    process.exit(1);
  }
}

// Export for use in other scripts
export { DatabaseMigrator };

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}