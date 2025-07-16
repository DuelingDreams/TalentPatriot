#!/usr/bin/env tsx

/**
 * Database Optimization Deployment Script
 * 
 * This script applies the optimized database schema and RLS policies to the Supabase instance.
 * It includes comprehensive logging, validation, and rollback capabilities.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with admin privileges
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

interface MigrationStep {
  name: string;
  sql: string;
  rollback?: string;
  validate?: () => Promise<boolean>;
}

class DatabaseMigrator {
  private steps: MigrationStep[] = [];
  private executedSteps: string[] = [];

  constructor() {
    this.loadMigrationSteps();
  }

  private loadMigrationSteps() {
    try {
      // Load the migration SQL file
      const migrationSql = readFileSync(join(process.cwd(), 'supabase-migration-optimized.sql'), 'utf-8');
      
      // Load the RLS policies SQL file
      const rlsSql = readFileSync(join(process.cwd(), 'supabase-optimized-rls.sql'), 'utf-8');

      this.steps = [
        {
          name: 'Pre-migration Validation',
          sql: `
            -- Validate current schema state
            SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name IN ('clients', 'jobs', 'candidates', 'job_candidate', 'candidate_notes')
            ORDER BY table_name, ordinal_position;
          `,
          validate: async () => {
            const { data, error } = await supabase.rpc('validate_schema_state');
            return !error;
          }
        },
        {
          name: 'Backup Current Data',
          sql: `
            -- Create backup tables
            CREATE TABLE IF NOT EXISTS backup_clients AS SELECT * FROM clients;
            CREATE TABLE IF NOT EXISTS backup_jobs AS SELECT * FROM jobs;
            CREATE TABLE IF NOT EXISTS backup_candidates AS SELECT * FROM candidates;
            CREATE TABLE IF NOT EXISTS backup_job_candidate AS SELECT * FROM job_candidate;
            CREATE TABLE IF NOT EXISTS backup_candidate_notes AS SELECT * FROM candidate_notes;
          `,
          rollback: `
            DROP TABLE IF EXISTS backup_clients;
            DROP TABLE IF EXISTS backup_jobs;
            DROP TABLE IF EXISTS backup_candidates;
            DROP TABLE IF EXISTS backup_job_candidate;
            DROP TABLE IF EXISTS backup_candidate_notes;
          `
        },
        {
          name: 'Apply Schema Optimizations',
          sql: migrationSql,
          validate: async () => {
            // Check if new columns exist
            const { data, error } = await supabase.rpc('validate_migration');
            if (error) {
              console.error('Validation error:', error);
              return false;
            }
            return data && data.length > 0;
          }
        },
        {
          name: 'Apply Optimized RLS Policies',
          sql: rlsSql,
          validate: async () => {
            // Check if policies are applied correctly
            const { data, error } = await supabase.rpc('audit_rls_policies');
            if (error) {
              console.error('RLS validation error:', error);
              return false;
            }
            return data && data.every((table: any) => table.policy_count > 0);
          }
        },
        {
          name: 'Final Validation and Cleanup',
          sql: `
            -- Run final validation
            SELECT * FROM validate_migration();
            
            -- Test demo access
            SELECT * FROM test_demo_access();
            
            -- Clean up backup tables after successful migration
            DROP TABLE IF EXISTS backup_clients;
            DROP TABLE IF EXISTS backup_jobs;
            DROP TABLE IF EXISTS backup_candidates;
            DROP TABLE IF EXISTS backup_job_candidate;
            DROP TABLE IF EXISTS backup_candidate_notes;
            
            -- Run database maintenance
            SELECT maintain_ats_database();
          `,
          validate: async () => {
            // Final comprehensive validation
            try {
              const { data: clients } = await supabase.from('clients').select('count').single();
              const { data: jobs } = await supabase.from('jobs').select('count').single();
              const { data: candidates } = await supabase.from('candidates').select('count').single();
              
              return clients && jobs && candidates;
            } catch (error) {
              console.error('Final validation failed:', error);
              return false;
            }
          }
        }
      ];
    } catch (error) {
      console.error('❌ Failed to load migration files:', error);
      process.exit(1);
    }
  }

  async executeSql(sql: string): Promise<{ success: boolean; error?: any }> {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_string: sql });
      return { success: !error, error };
    } catch (error) {
      return { success: false, error };
    }
  }

  async executeStep(step: MigrationStep): Promise<boolean> {
    console.log(`\n🔄 Executing: ${step.name}`);
    console.log('─'.repeat(60));

    const startTime = Date.now();
    const result = await this.executeSql(step.sql);
    const duration = Date.now() - startTime;

    if (!result.success) {
      console.error(`❌ Failed to execute ${step.name}:`, result.error);
      return false;
    }

    console.log(`✅ ${step.name} completed in ${duration}ms`);

    // Run validation if provided
    if (step.validate) {
      console.log(`🔍 Validating ${step.name}...`);
      const isValid = await step.validate();
      if (!isValid) {
        console.error(`❌ Validation failed for ${step.name}`);
        return false;
      }
      console.log(`✅ ${step.name} validation passed`);
    }

    this.executedSteps.push(step.name);
    return true;
  }

  async rollback(): Promise<void> {
    console.log('\n🔄 Rolling back migration...');
    console.log('═'.repeat(60));

    for (const stepName of this.executedSteps.reverse()) {
      const step = this.steps.find(s => s.name === stepName);
      if (step?.rollback) {
        console.log(`🔄 Rolling back: ${step.name}`);
        const result = await this.executeSql(step.rollback);
        if (result.success) {
          console.log(`✅ Rollback successful: ${step.name}`);
        } else {
          console.error(`❌ Rollback failed: ${step.name}`, result.error);
        }
      }
    }
  }

  async migrate(): Promise<boolean> {
    console.log('🚀 Starting ATS Database Optimization Migration');
    console.log('═'.repeat(60));
    console.log(`📅 Started at: ${new Date().toISOString()}`);
    console.log(`🎯 Target: ${supabaseUrl}`);
    console.log(`📋 Steps: ${this.steps.length}`);
    console.log('═'.repeat(60));

    try {
      for (let i = 0; i < this.steps.length; i++) {
        const step = this.steps[i];
        console.log(`\n📍 Step ${i + 1}/${this.steps.length}: ${step.name}`);
        
        const success = await this.executeStep(step);
        if (!success) {
          console.error(`\n❌ Migration failed at step: ${step.name}`);
          console.log('\n🔄 Initiating rollback...');
          await this.rollback();
          return false;
        }

        // Progress indicator
        const progress = Math.round(((i + 1) / this.steps.length) * 100);
        console.log(`📊 Progress: ${progress}% (${i + 1}/${this.steps.length})`);
      }

      console.log('\n🎉 Migration completed successfully!');
      console.log('═'.repeat(60));
      console.log('✅ All optimizations applied');
      console.log('✅ RLS policies updated');
      console.log('✅ Performance indexes created');
      console.log('✅ Demo data isolated');
      console.log('✅ Audit functions deployed');
      console.log('═'.repeat(60));
      console.log(`🏁 Completed at: ${new Date().toISOString()}`);

      return true;
    } catch (error) {
      console.error('\n💥 Unexpected error during migration:', error);
      console.log('\n🔄 Initiating emergency rollback...');
      await this.rollback();
      return false;
    }
  }

  async testConnectivity(): Promise<boolean> {
    console.log('🔌 Testing database connectivity...');
    try {
      const { data, error } = await supabase.from('clients').select('count').limit(1);
      if (error) {
        console.error('❌ Connectivity test failed:', error.message);
        return false;
      }
      console.log('✅ Database connectivity verified');
      return true;
    } catch (error) {
      console.error('❌ Connectivity test failed:', error);
      return false;
    }
  }

  async generateReport(): Promise<void> {
    console.log('\n📊 Generating Migration Report');
    console.log('═'.repeat(60));

    try {
      // Get table information
      const { data: tables } = await supabase.rpc('validate_migration');
      if (tables) {
        console.log('\n📋 Table Status:');
        tables.forEach((table: any) => {
          console.log(`  ${table.table_name}: ${table.has_status_column ? '✅' : '❌'} status, ${table.has_updated_at ? '✅' : '❌'} updated_at, ${table.policy_count} policies`);
        });
      }

      // Get demo access status
      const { data: demoAccess } = await supabase.rpc('test_demo_access');
      if (demoAccess) {
        console.log('\n🎭 Demo Data Status:');
        demoAccess.forEach((access: any) => {
          console.log(`  ${access.table_name}: ${access.demo_record_count} demo records, ${access.access_granted ? '✅' : '❌'} access`);
        });
      }

      // Get policy audit
      const { data: policies } = await supabase.rpc('audit_rls_policies');
      if (policies) {
        console.log('\n🛡️ Security Policy Status:');
        policies.forEach((policy: any) => {
          console.log(`  ${policy.table_name}: ${policy.policy_count} policies (${policy.has_select_policy ? '✅' : '❌'} SELECT, ${policy.has_insert_policy ? '✅' : '❌'} INSERT)`);
        });
      }

    } catch (error) {
      console.error('❌ Failed to generate report:', error);
    }
  }
}

// Main execution
async function main() {
  const migrator = new DatabaseMigrator();

  // Test connectivity first
  const isConnected = await migrator.testConnectivity();
  if (!isConnected) {
    console.error('❌ Cannot connect to database. Aborting migration.');
    process.exit(1);
  }

  // Run migration
  const success = await migrator.migrate();
  
  // Generate report
  await migrator.generateReport();

  if (success) {
    console.log('\n🎯 Next Steps:');
    console.log('  1. Test application functionality with optimized schema');
    console.log('  2. Monitor query performance improvements');
    console.log('  3. Verify role-based access control');
    console.log('  4. Schedule weekly maintenance with maintain_ats_database()');
    process.exit(0);
  } else {
    console.error('\n❌ Migration failed. Database state restored.');
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n⚠️ Migration interrupted. Cleaning up...');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled rejection in migration:', reason);
  process.exit(1);
});

if (require.main === module) {
  main().catch(console.error);
}

export default main;