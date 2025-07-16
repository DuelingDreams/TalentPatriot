/**
 * Database Optimization Testing Script
 * 
 * This script validates that the database optimizations are working correctly
 * by testing API endpoints, data integrity, and performance improvements.
 */

import { createOptimizedStorage } from './server/optimized-storage';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  duration?: number;
}

class OptimizationTester {
  private optimizedStorage: any;
  private results: TestResult[] = [];

  constructor() {
    this.optimizedStorage = createOptimizedStorage();
  }

  async apiRequest(endpoint: string, options?: RequestInit): Promise<any> {
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:5000';
    const response = await fetch(`${baseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      },
      ...options
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  addResult(name: string, status: 'PASS' | 'FAIL' | 'SKIP', message: string, duration?: number) {
    this.results.push({ name, status, message, duration });
  }

  async testApiConnectivity(): Promise<void> {
    console.log('\n🔍 Testing API Connectivity...');
    
    const start = Date.now();
    try {
      const response = await this.apiRequest('/api/health');
      const duration = Date.now() - start;
      
      if (response.status === 'healthy') {
        this.addResult('API Health Check', 'PASS', 'API is responding correctly', duration);
      } else {
        this.addResult('API Health Check', 'FAIL', `Unhealthy status: ${response.status}`, duration);
      }
    } catch (error) {
      this.addResult('API Health Check', 'FAIL', `API not responding: ${error.message}`);
    }
  }

  async testDataIntegrity(): Promise<void> {
    console.log('\n🔍 Testing Data Integrity...');

    try {
      // Test clients endpoint
      const start1 = Date.now();
      const clients = await this.apiRequest('/api/clients');
      const duration1 = Date.now() - start1;
      
      if (Array.isArray(clients) && clients.length > 0) {
        this.addResult('Clients Data', 'PASS', `Found ${clients.length} clients`, duration1);
      } else {
        this.addResult('Clients Data', 'FAIL', 'No clients found or invalid response', duration1);
      }

      // Test jobs endpoint
      const start2 = Date.now();
      const jobs = await this.apiRequest('/api/jobs');
      const duration2 = Date.now() - start2;
      
      if (Array.isArray(jobs) && jobs.length > 0) {
        this.addResult('Jobs Data', 'PASS', `Found ${jobs.length} jobs`, duration2);
      } else {
        this.addResult('Jobs Data', 'FAIL', 'No jobs found or invalid response', duration2);
      }

      // Test candidates endpoint
      const start3 = Date.now();
      const candidates = await this.apiRequest('/api/candidates');
      const duration3 = Date.now() - start3;
      
      if (Array.isArray(candidates) && candidates.length > 0) {
        this.addResult('Candidates Data', 'PASS', `Found ${candidates.length} candidates`, duration3);
      } else {
        this.addResult('Candidates Data', 'FAIL', 'No candidates found or invalid response', duration3);
      }

    } catch (error) {
      this.addResult('Data Integrity', 'FAIL', `Data validation failed: ${error.message}`);
    }
  }

  async testDatabaseSchema(): Promise<void> {
    console.log('\n🔍 Testing Database Schema...');

    try {
      // Test if optimized storage can connect
      const stats = await this.optimizedStorage.getDashboardStats();
      
      if (stats && typeof stats.activeClients === 'number') {
        this.addResult('Schema Validation', 'PASS', 'Database schema is accessible and valid');
      } else {
        this.addResult('Schema Validation', 'FAIL', 'Invalid dashboard stats structure');
      }

    } catch (error) {
      this.addResult('Schema Validation', 'FAIL', `Schema validation failed: ${error.message}`);
    }
  }

  async testPerformance(): Promise<void> {
    console.log('\n🔍 Testing Performance Optimizations...');

    try {
      // Test dashboard stats performance
      const start1 = Date.now();
      await this.optimizedStorage.getDashboardStats();
      const dashboardDuration = Date.now() - start1;
      
      if (dashboardDuration < 1000) { // Under 1 second
        this.addResult('Dashboard Performance', 'PASS', `Dashboard loaded in ${dashboardDuration}ms`, dashboardDuration);
      } else {
        this.addResult('Dashboard Performance', 'FAIL', `Dashboard too slow: ${dashboardDuration}ms`, dashboardDuration);
      }

      // Test jobs with candidate counts
      const start2 = Date.now();
      await this.optimizedStorage.getJobsWithCandidateCounts();
      const jobsDuration = Date.now() - start2;
      
      if (jobsDuration < 2000) { // Under 2 seconds
        this.addResult('Jobs Performance', 'PASS', `Jobs with counts loaded in ${jobsDuration}ms`, jobsDuration);
      } else {
        this.addResult('Jobs Performance', 'FAIL', `Jobs too slow: ${jobsDuration}ms`, jobsDuration);
      }

      // Test search performance
      const start3 = Date.now();
      await this.optimizedStorage.searchAll('test');
      const searchDuration = Date.now() - start3;
      
      if (searchDuration < 1500) { // Under 1.5 seconds
        this.addResult('Search Performance', 'PASS', `Search completed in ${searchDuration}ms`, searchDuration);
      } else {
        this.addResult('Search Performance', 'FAIL', `Search too slow: ${searchDuration}ms`, searchDuration);
      }

    } catch (error) {
      this.addResult('Performance Test', 'FAIL', `Performance test failed: ${error.message}`);
    }
  }

  async testSecurity(): Promise<void> {
    console.log('\n🔍 Testing Security Features...');

    try {
      // Test rate limiting (should return 429 after many requests)
      let rateLimitTriggered = false;
      
      for (let i = 0; i < 10; i++) {
        try {
          await this.apiRequest('/api/clients');
        } catch (error) {
          if (error.message.includes('429')) {
            rateLimitTriggered = true;
            break;
          }
        }
      }

      if (rateLimitTriggered) {
        this.addResult('Rate Limiting', 'PASS', 'Rate limiting is working correctly');
      } else {
        this.addResult('Rate Limiting', 'SKIP', 'Rate limiting not triggered in test');
      }

    } catch (error) {
      this.addResult('Security Test', 'FAIL', `Security test failed: ${error.message}`);
    }
  }

  async testCRUDOperations(): Promise<void> {
    console.log('\n🔍 Testing CRUD Operations...');

    try {
      // Test client creation
      const testClient = {
        name: 'Test Optimization Client',
        industry: 'Testing',
        contactName: 'Test Contact',
        contactEmail: 'test@optimization.com',
        status: 'active' as const
      };

      const start1 = Date.now();
      const createdClient = await this.apiRequest('/api/clients', {
        method: 'POST',
        body: JSON.stringify(testClient)
      });
      const createDuration = Date.now() - start1;

      if (createdClient.id) {
        this.addResult('Client Creation', 'PASS', `Client created in ${createDuration}ms`, createDuration);

        // Test client retrieval
        const start2 = Date.now();
        const retrievedClient = await this.apiRequest(`/api/clients/${createdClient.id}`);
        const retrieveDuration = Date.now() - start2;

        if (retrievedClient.name === testClient.name) {
          this.addResult('Client Retrieval', 'PASS', `Client retrieved in ${retrieveDuration}ms`, retrieveDuration);
        } else {
          this.addResult('Client Retrieval', 'FAIL', 'Retrieved client data mismatch');
        }

        // Clean up - delete test client
        try {
          await this.apiRequest(`/api/clients/${createdClient.id}`, {
            method: 'DELETE'
          });
          this.addResult('Client Cleanup', 'PASS', 'Test client deleted successfully');
        } catch (error) {
          this.addResult('Client Cleanup', 'FAIL', `Failed to delete test client: ${error.message}`);
        }
      } else {
        this.addResult('Client Creation', 'FAIL', 'Client creation returned invalid response');
      }

    } catch (error) {
      this.addResult('CRUD Operations', 'FAIL', `CRUD test failed: ${error.message}`);
    }
  }

  generateReport(): void {
    console.log('\n' + '='.repeat(80));
    console.log('🎯 OPTIMIZATION TEST RESULTS SUMMARY');
    console.log('='.repeat(80));

    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const skipped = this.results.filter(r => r.status === 'SKIP').length;
    const total = this.results.length;

    console.log(`\n📊 Results: ${passed} PASSED, ${failed} FAILED, ${skipped} SKIPPED (${total} total)`);
    console.log(`✅ Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`);

    // Group results by category
    const categories = ['API', 'Data', 'Schema', 'Performance', 'Security', 'CRUD'];
    
    categories.forEach(category => {
      const categoryResults = this.results.filter(r => r.name.includes(category) || r.name.includes(category.toLowerCase()));
      
      if (categoryResults.length > 0) {
        console.log(`\n🔹 ${category.toUpperCase()} TESTS:`);
        categoryResults.forEach(result => {
          const status = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
          const duration = result.duration ? ` (${result.duration}ms)` : '';
          console.log(`  ${status} ${result.name}${duration}: ${result.message}`);
        });
      }
    });

    // Performance summary
    const performanceResults = this.results.filter(r => r.duration !== undefined);
    if (performanceResults.length > 0) {
      console.log('\n⚡ PERFORMANCE SUMMARY:');
      const totalDuration = performanceResults.reduce((sum, r) => sum + (r.duration || 0), 0);
      const avgDuration = totalDuration / performanceResults.length;
      console.log(`  Average response time: ${avgDuration.toFixed(0)}ms`);
      console.log(`  Fastest operation: ${Math.min(...performanceResults.map(r => r.duration || Infinity))}ms`);
      console.log(`  Slowest operation: ${Math.max(...performanceResults.map(r => r.duration || 0))}ms`);
    }

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    if (failed > 0) {
      console.log('  - Review failed tests and address underlying issues');
      console.log('  - Check database connectivity and schema integrity');
    }
    
    const slowTests = this.results.filter(r => r.duration && r.duration > 1000);
    if (slowTests.length > 0) {
      console.log('  - Consider additional performance optimizations for slow operations');
      console.log('  - Review query patterns and indexing strategy');
    }
    
    if (passed === total) {
      console.log('  🎉 All tests passed! Optimizations are working correctly.');
    }

    console.log('\n' + '='.repeat(80));
  }

  async runAllTests(): Promise<boolean> {
    console.log('🚀 Starting Database Optimization Tests...');
    console.log('='.repeat(80));

    await this.testApiConnectivity();
    await this.testDataIntegrity();
    await this.testDatabaseSchema();
    await this.testPerformance();
    await this.testSecurity();
    await this.testCRUDOperations();

    this.generateReport();

    const failedTests = this.results.filter(r => r.status === 'FAIL').length;
    return failedTests === 0;
  }
}

async function main() {
  const tester = new OptimizationTester();
  
  try {
    const success = await tester.runAllTests();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  }
}

// Export for use in other scripts
export { OptimizationTester };

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}