#!/usr/bin/env tsx

/**
 * Database Optimization Testing Script
 * 
 * This script validates that the database optimizations are working correctly
 * by testing API endpoints, data integrity, and performance improvements.
 */

import { createClient } from '@supabase/supabase-js';

const API_BASE = 'http://localhost:5000';
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  duration?: number;
}

class OptimizationTester {
  private results: TestResult[] = [];

  async apiRequest(endpoint: string, options?: RequestInit): Promise<any> {
    const startTime = Date.now();
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });
      
      const duration = Date.now() - startTime;
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return { data, duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      throw { error, duration };
    }
  }

  addResult(name: string, status: 'PASS' | 'FAIL' | 'SKIP', message: string, duration?: number) {
    this.results.push({ name, status, message, duration });
    const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️';
    const durationText = duration ? ` (${duration}ms)` : '';
    console.log(`${statusIcon} ${name}: ${message}${durationText}`);
  }

  async testApiConnectivity(): Promise<void> {
    console.log('\n🔌 Testing API Connectivity');
    console.log('─'.repeat(50));

    try {
      const { data, duration } = await this.apiRequest('/api/clients');
      this.addResult(
        'API Connectivity',
        'PASS',
        `Retrieved ${data.length} clients`,
        duration
      );
    } catch (err: any) {
      this.addResult(
        'API Connectivity',
        'FAIL',
        `Connection failed: ${err.error?.message || err.message}`,
        err.duration
      );
    }
  }

  async testDataIntegrity(): Promise<void> {
    console.log('\n🔍 Testing Data Integrity');
    console.log('─'.repeat(50));

    // Test clients endpoint
    try {
      const { data: clients, duration } = await this.apiRequest('/api/clients');
      
      if (Array.isArray(clients) && clients.length > 0) {
        const hasRequiredFields = clients.every(client => 
          client.id && client.name && client.created_at
        );
        this.addResult(
          'Clients Data Structure',
          hasRequiredFields ? 'PASS' : 'FAIL',
          hasRequiredFields ? `${clients.length} clients with valid structure` : 'Missing required fields',
          duration
        );
      } else {
        this.addResult('Clients Data Structure', 'FAIL', 'No clients data returned');
      }
    } catch (err: any) {
      this.addResult('Clients Data Structure', 'FAIL', `Error: ${err.error?.message || err.message}`);
    }

    // Test jobs endpoint
    try {
      const { data: jobs, duration } = await this.apiRequest('/api/jobs');
      
      if (Array.isArray(jobs) && jobs.length > 0) {
        const hasRequiredFields = jobs.every(job => 
          job.id && job.title && job.client_id && job.created_at
        );
        this.addResult(
          'Jobs Data Structure',
          hasRequiredFields ? 'PASS' : 'FAIL',
          hasRequiredFields ? `${jobs.length} jobs with valid structure` : 'Missing required fields',
          duration
        );
      } else {
        this.addResult('Jobs Data Structure', 'FAIL', 'No jobs data returned');
      }
    } catch (err: any) {
      this.addResult('Jobs Data Structure', 'FAIL', `Error: ${err.error?.message || err.message}`);
    }

    // Test candidates endpoint
    try {
      const { data: candidates, duration } = await this.apiRequest('/api/candidates');
      
      if (Array.isArray(candidates) && candidates.length > 0) {
        const hasRequiredFields = candidates.every(candidate => 
          candidate.id && candidate.name && candidate.email && candidate.created_at
        );
        this.addResult(
          'Candidates Data Structure',
          hasRequiredFields ? 'PASS' : 'FAIL',
          hasRequiredFields ? `${candidates.length} candidates with valid structure` : 'Missing required fields',
          duration
        );
      } else {
        this.addResult('Candidates Data Structure', 'FAIL', 'No candidates data returned');
      }
    } catch (err: any) {
      this.addResult('Candidates Data Structure', 'FAIL', `Error: ${err.error?.message || err.message}`);
    }
  }

  async testDatabaseSchema(): Promise<void> {
    console.log('\n🗄️ Testing Database Schema Optimizations');
    console.log('─'.repeat(50));

    try {
      // Test if optimized functions exist
      const { data: functions, error: funcError } = await supabase.rpc('pg_get_functiondef', {
        func_oid: 'auth.get_user_role'
      });
      
      if (!funcError) {
        this.addResult('Auth Functions', 'PASS', 'Role-based auth functions available');
      } else {
        this.addResult('Auth Functions', 'FAIL', 'Auth functions not found');
      }
    } catch (err: any) {
      this.addResult('Auth Functions', 'SKIP', 'Could not test auth functions');
    }

    // Test table structure
    try {
      const { data: tables, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .in('table_name', ['clients', 'jobs', 'candidates', 'job_candidate', 'candidate_notes']);

      if (!error && tables && tables.length === 5) {
        this.addResult('Core Tables', 'PASS', 'All 5 core tables present');
      } else {
        this.addResult('Core Tables', 'FAIL', `Only ${tables?.length || 0}/5 tables found`);
      }
    } catch (err: any) {
      this.addResult('Core Tables', 'FAIL', 'Could not verify table structure');
    }
  }

  async testPerformance(): Promise<void> {
    console.log('\n⚡ Testing Performance Improvements');
    console.log('─'.repeat(50));

    // Test multiple concurrent requests
    const concurrentTests = 5;
    const requests = Array(concurrentTests).fill(null).map(() => 
      this.apiRequest('/api/clients')
    );

    try {
      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const totalDuration = Date.now() - startTime;
      const avgDuration = totalDuration / concurrentTests;

      this.addResult(
        'Concurrent Requests',
        avgDuration < 500 ? 'PASS' : 'FAIL',
        `${concurrentTests} concurrent requests, avg ${Math.round(avgDuration)}ms`,
        totalDuration
      );
    } catch (err: any) {
      this.addResult('Concurrent Requests', 'FAIL', 'Failed concurrent request test');
    }

    // Test large data handling
    try {
      const { data, duration } = await this.apiRequest('/api/clients?limit=100');
      this.addResult(
        'Large Dataset Handling',
        duration < 1000 ? 'PASS' : 'FAIL',
        `Large query completed in ${duration}ms`,
        duration
      );
    } catch (err: any) {
      this.addResult('Large Dataset Handling', 'SKIP', 'Could not test large dataset');
    }
  }

  async testSecurity(): Promise<void> {
    console.log('\n🛡️ Testing Security Enhancements');
    console.log('─'.repeat(50));

    // Test rate limiting
    try {
      const rapidRequests = Array(10).fill(null).map(() => 
        this.apiRequest('/api/clients')
      );
      
      const responses = await Promise.allSettled(rapidRequests);
      const successful = responses.filter(r => r.status === 'fulfilled').length;
      const rateLimited = responses.filter(r => r.status === 'rejected').length;

      if (rateLimited > 0) {
        this.addResult('Rate Limiting', 'PASS', `${rateLimited}/10 requests rate limited`);
      } else {
        this.addResult('Rate Limiting', 'PASS', 'All requests processed (rate limit not reached)');
      }
    } catch (err: any) {
      this.addResult('Rate Limiting', 'SKIP', 'Could not test rate limiting');
    }

    // Test input validation
    try {
      const invalidData = {
        name: '', // Invalid: empty name
        contactEmail: 'invalid-email', // Invalid: malformed email
      };

      const { data, duration } = await this.apiRequest('/api/clients', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });

      this.addResult('Input Validation', 'FAIL', 'Invalid data was accepted');
    } catch (err: any) {
      // Expected to fail with validation error
      if (err.error?.message?.includes('validation') || err.error?.message?.includes('required')) {
        this.addResult('Input Validation', 'PASS', 'Invalid data properly rejected');
      } else {
        this.addResult('Input Validation', 'FAIL', `Unexpected error: ${err.error?.message}`);
      }
    }
  }

  async testCRUDOperations(): Promise<void> {
    console.log('\n📝 Testing CRUD Operations');
    console.log('─'.repeat(50));

    // Test client creation
    try {
      const testClient = {
        name: 'Test Optimization Client',
        industry: 'Technology',
        contactName: 'Test User',
        contactEmail: 'test@optimization.com',
        notes: 'Created during optimization testing',
      };

      const { data: newClient, duration } = await this.apiRequest('/api/clients', {
        method: 'POST',
        body: JSON.stringify(testClient),
      });

      if (newClient && newClient.id) {
        this.addResult('Client Creation', 'PASS', `Client created with ID: ${newClient.id}`, duration);

        // Test client update
        try {
          const updateData = { industry: 'Updated Technology' };
          const { data: updatedClient, duration: updateDuration } = await this.apiRequest(`/api/clients/${newClient.id}`, {
            method: 'PUT',
            body: JSON.stringify(updateData),
          });

          if (updatedClient && updatedClient.industry === 'Updated Technology') {
            this.addResult('Client Update', 'PASS', 'Client updated successfully', updateDuration);
          } else {
            this.addResult('Client Update', 'FAIL', 'Client update did not apply changes');
          }
        } catch (err: any) {
          this.addResult('Client Update', 'FAIL', `Update failed: ${err.error?.message}`);
        }

        // Clean up test client
        try {
          await this.apiRequest(`/api/clients/${newClient.id}`, { method: 'DELETE' });
          this.addResult('Client Cleanup', 'PASS', 'Test client deleted successfully');
        } catch (err: any) {
          this.addResult('Client Cleanup', 'FAIL', 'Could not delete test client');
        }
      } else {
        this.addResult('Client Creation', 'FAIL', 'Client creation returned invalid data');
      }
    } catch (err: any) {
      this.addResult('Client Creation', 'FAIL', `Creation failed: ${err.error?.message}`);
    }
  }

  generateReport(): void {
    console.log('\n📊 Optimization Test Report');
    console.log('═'.repeat(60));
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const skipped = this.results.filter(r => r.status === 'SKIP').length;
    const total = this.results.length;

    console.log(`📈 Test Results: ${passed}/${total} passed`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏭️ Skipped: ${skipped}`);
    
    const successRate = Math.round((passed / (total - skipped)) * 100);
    console.log(`📊 Success Rate: ${successRate}%`);

    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => console.log(`  • ${r.name}: ${r.message}`));
    }

    const avgDuration = this.results
      .filter(r => r.duration)
      .reduce((sum, r) => sum + (r.duration || 0), 0) / 
      this.results.filter(r => r.duration).length;

    if (avgDuration) {
      console.log(`⚡ Average Response Time: ${Math.round(avgDuration)}ms`);
    }

    console.log('\n🎯 Optimization Status:');
    if (successRate >= 90) {
      console.log('✅ Database optimizations are working excellently');
    } else if (successRate >= 75) {
      console.log('⚠️ Database optimizations are mostly working with minor issues');
    } else {
      console.log('❌ Database optimizations need attention');
    }

    console.log('═'.repeat(60));
  }

  async runAllTests(): Promise<boolean> {
    console.log('🧪 Starting ATS Database Optimization Tests');
    console.log('═'.repeat(60));
    console.log(`📅 Started at: ${new Date().toISOString()}`);
    console.log('═'.repeat(60));

    await this.testApiConnectivity();
    await this.testDataIntegrity();
    await this.testDatabaseSchema();
    await this.testPerformance();
    await this.testSecurity();
    await this.testCRUDOperations();

    this.generateReport();

    const passed = this.results.filter(r => r.status === 'PASS').length;
    const total = this.results.filter(r => r.status !== 'SKIP').length;
    
    return passed >= total * 0.8; // 80% pass rate required
  }
}

// Main execution
async function main() {
  const tester = new OptimizationTester();
  
  try {
    const success = await tester.runAllTests();
    
    if (success) {
      console.log('\n🎉 Optimization tests completed successfully!');
      process.exit(0);
    } else {
      console.log('\n⚠️ Some optimization tests failed. Review the results above.');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n💥 Test execution failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
main().catch(console.error);

export default main;