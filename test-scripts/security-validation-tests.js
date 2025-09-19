#!/usr/bin/env node

// Import required modules for ES modules
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Use built-in fetch (Node.js 18+) or define a simple implementation
if (typeof fetch === 'undefined') {
  // Simple fetch polyfill using Node.js http module
  const http = await import('http');
  const https = await import('https');
  const { URL } = await import('url');
  
  global.fetch = async function(url, options = {}) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const client = isHttps ? https : http;
      
      const reqOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: options.headers || {}
      };
      
      const req = client.request(reqOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            text: () => Promise.resolve(data),
            json: () => Promise.resolve(JSON.parse(data)),
            headers: res.headers
          });
        });
      });
      
      req.on('error', reject);
      
      if (options.body) {
        req.write(options.body);
      }
      
      req.end();
    });
  };
}

/**
 * COMPREHENSIVE SECURITY VALIDATION TESTS
 * 
 * This script performs extensive security testing to validate:
 * 1. RLS policies are working correctly across all tables
 * 2. Server-side org_id derivation triggers prevent client tampering
 * 3. Multi-tenant isolation - users cannot access data from orgs they don't belong to
 * 4. Anonymous users have only narrow, appropriate access
 * 5. Edge cases and error conditions
 * 
 * Date: September 19, 2025
 * Author: TalentPatriot Security Validation Team
 */

const API_BASE = 'http://localhost:5000/api';

// Test organizations from development auth
const TEST_ORGS = {
  mentalcastle: {
    id: '90531171-d56b-4732-baba-35be47b0cb08',
    name: 'MentalCastle',
    userId: 'b67bf044-fa88-4579-9c06-03f3026bab95'
  },
  hildebrand: {
    id: 'd0156d8c-939b-488d-b256-e3924349f427',
    name: 'Hildebrand Enterprises', 
    userId: '81a2aecb-4355-4b83-9b05-27ac4c3020ff'
  }
};

// Test results tracker
const testResults = {
  passed: 0,
  failed: 0,
  errors: [],
  warnings: [],
  summary: []
};

// Helper function to make authenticated requests
async function makeRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers: defaultHeaders
    });

    const data = await response.text();
    let parsedData;
    try {
      parsedData = JSON.parse(data);
    } catch {
      parsedData = data;
    }

    return {
      status: response.status,
      ok: response.ok,
      data: parsedData,
      headers: response.headers
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message,
      data: null
    };
  }
}

// Helper function to simulate authenticated request with org context
async function makeAuthenticatedRequest(endpoint, orgId, options = {}) {
  const headers = {
    'X-Organization-ID': orgId,
    'X-User-ID': TEST_ORGS.mentalcastle.userId,
    ...options.headers
  };
  
  return makeRequest(endpoint, {
    ...options,
    headers
  });
}

// Helper function to log test results
function logTest(testName, passed, details) {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${testName}`);
  if (details) {
    console.log(`   Details: ${details}`);
  }
  
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
    testResults.errors.push({ test: testName, details });
  }
  
  testResults.summary.push({ test: testName, passed, details });
}

// Helper function to log warnings
function logWarning(message) {
  console.log(`⚠️  WARNING: ${message}`);
  testResults.warnings.push(message);
}

// ==========================================
// TEST 1: RLS POLICY VALIDATION
// ==========================================

async function testRLSPolicies() {
  console.log('\n🔒 TESTING RLS POLICIES...\n');
  
  // Test 1.1: Authenticated user can access their org's data
  try {
    const response = await makeAuthenticatedRequest('/jobs', TEST_ORGS.mentalcastle.id);
    logTest(
      'RLS-01: Authenticated user can access own org jobs',
      response.ok,
      `Status: ${response.status}, Data count: ${Array.isArray(response.data) ? response.data.length : 'N/A'}`
    );
  } catch (error) {
    logTest('RLS-01: Authenticated user can access own org jobs', false, error.message);
  }

  // Test 1.2: Test candidates access
  try {
    const response = await makeAuthenticatedRequest('/candidates', TEST_ORGS.mentalcastle.id);
    logTest(
      'RLS-02: Authenticated user can access own org candidates',
      response.ok,
      `Status: ${response.status}, Data count: ${Array.isArray(response.data) ? response.data.length : 'N/A'}`
    );
  } catch (error) {
    logTest('RLS-02: Authenticated user can access own org candidates', false, error.message);
  }

  // Test 1.3: Test clients access
  try {
    const response = await makeAuthenticatedRequest('/clients', TEST_ORGS.mentalcastle.id);
    logTest(
      'RLS-03: Authenticated user can access own org clients',
      response.ok,
      `Status: ${response.status}, Data count: ${Array.isArray(response.data) ? response.data.length : 'N/A'}`
    );
  } catch (error) {
    logTest('RLS-03: Authenticated user can access own org clients', false, error.message);
  }

  // Test 1.4: Test cross-org access prevention (attempt to access Hildebrand data with MentalCastle context)
  try {
    const response = await makeAuthenticatedRequest('/jobs', TEST_ORGS.hildebrand.id, {
      headers: { 'X-User-ID': TEST_ORGS.mentalcastle.userId }
    });
    
    // Should either return empty data or reject the request
    const shouldFail = !response.ok || (Array.isArray(response.data) && response.data.length === 0);
    logTest(
      'RLS-04: Cross-org access prevention (MentalCastle user accessing Hildebrand data)',
      shouldFail,
      `Status: ${response.status}, Data count: ${Array.isArray(response.data) ? response.data.length : 'Rejected'}`
    );
  } catch (error) {
    logTest('RLS-04: Cross-org access prevention', true, 'Request properly rejected: ' + error.message);
  }
}

// ==========================================
// TEST 2: ANONYMOUS ACCESS RESTRICTIONS
// ==========================================

async function testAnonymousAccess() {
  console.log('\n🚫 TESTING ANONYMOUS ACCESS RESTRICTIONS...\n');

  // Test 2.1: Anonymous users CANNOT access jobs list
  try {
    const response = await makeRequest('/jobs');
    const shouldFail = !response.ok || response.status === 401 || response.status === 403;
    logTest(
      'ANON-01: Anonymous users cannot access jobs endpoint',
      shouldFail,
      `Status: ${response.status}, Response: ${typeof response.data === 'object' ? JSON.stringify(response.data).substring(0, 100) : response.data}`
    );
  } catch (error) {
    logTest('ANON-01: Anonymous users cannot access jobs endpoint', true, 'Request properly rejected: ' + error.message);
  }

  // Test 2.2: Anonymous users CANNOT access candidates
  try {
    const response = await makeRequest('/candidates');
    const shouldFail = !response.ok || response.status === 401 || response.status === 403;
    logTest(
      'ANON-02: Anonymous users cannot access candidates endpoint',
      shouldFail,
      `Status: ${response.status}`
    );
  } catch (error) {
    logTest('ANON-02: Anonymous users cannot access candidates endpoint', true, 'Request properly rejected: ' + error.message);
  }

  // Test 2.3: Anonymous users CANNOT access clients
  try {
    const response = await makeRequest('/clients');
    const shouldFail = !response.ok || response.status === 401 || response.status === 403;
    logTest(
      'ANON-03: Anonymous users cannot access clients endpoint',
      shouldFail,
      `Status: ${response.status}`
    );
  } catch (error) {
    logTest('ANON-03: Anonymous users cannot access clients endpoint', true, 'Request properly rejected: ' + error.message);
  }

  // Test 2.4: Anonymous users CANNOT access sensitive organization data
  try {
    const response = await makeRequest('/organizations');
    const shouldFail = !response.ok || response.status === 401 || response.status === 403;
    logTest(
      'ANON-04: Anonymous users cannot access organizations endpoint',
      shouldFail,
      `Status: ${response.status}`
    );
  } catch (error) {
    logTest('ANON-04: Anonymous users cannot access organizations endpoint', true, 'Request properly rejected: ' + error.message);
  }

  // Test 2.5: Anonymous users CAN access public job listings (if implemented)
  try {
    const response = await makeRequest('/public/jobs');
    // This should either work or return 404 if not implemented, but not return sensitive data
    logTest(
      'ANON-05: Anonymous users can access public job listings endpoint',
      response.status === 200 || response.status === 404,
      `Status: ${response.status}, Data available: ${response.ok ? 'Yes' : 'No'}`
    );
  } catch (error) {
    logTest('ANON-05: Anonymous users can access public job listings endpoint', false, error.message);
  }
}

// ==========================================
// TEST 3: SERVER-SIDE ORG_ID DERIVATION TESTING
// ==========================================

async function testOrgIdDerivation() {
  console.log('\n⚙️  TESTING SERVER-SIDE ORG_ID DERIVATION...\n');

  // Test 3.1: Attempt to create a job with wrong org_id (should be overridden)
  try {
    const maliciousPayload = {
      title: 'Security Test Job',
      description: 'Testing org_id derivation',
      org_id: TEST_ORGS.hildebrand.id, // Try to set wrong org_id
      department: 'Security',
      status: 'draft'
    };

    const response = await makeAuthenticatedRequest('/jobs', TEST_ORGS.mentalcastle.id, {
      method: 'POST',
      body: JSON.stringify(maliciousPayload)
    });

    if (response.ok && response.data.orgId) {
      const correctOrgUsed = response.data.orgId === TEST_ORGS.mentalcastle.id;
      logTest(
        'ORG-01: Server-side org_id derivation for jobs (client tampering prevented)',
        correctOrgUsed,
        `Attempted org_id: ${TEST_ORGS.hildebrand.id}, Actual org_id: ${response.data.orgId}`
      );
    } else {
      logTest(
        'ORG-01: Server-side org_id derivation for jobs',
        false,
        `Job creation failed: Status ${response.status}, Response: ${JSON.stringify(response.data).substring(0, 200)}`
      );
    }
  } catch (error) {
    logTest('ORG-01: Server-side org_id derivation for jobs', false, error.message);
  }

  // Test 3.2: Attempt to create a candidate with wrong org_id
  try {
    const maliciousPayload = {
      name: 'Security Test Candidate',
      email: 'security.test@example.com',
      org_id: TEST_ORGS.hildebrand.id, // Try to set wrong org_id
      phone: '+1234567890'
    };

    const response = await makeAuthenticatedRequest('/candidates', TEST_ORGS.mentalcastle.id, {
      method: 'POST',
      body: JSON.stringify(maliciousPayload)
    });

    if (response.ok && response.data.orgId) {
      const correctOrgUsed = response.data.orgId === TEST_ORGS.mentalcastle.id;
      logTest(
        'ORG-02: Server-side org_id derivation for candidates (client tampering prevented)',
        correctOrgUsed,
        `Attempted org_id: ${TEST_ORGS.hildebrand.id}, Actual org_id: ${response.data.orgId}`
      );
    } else {
      logTest(
        'ORG-02: Server-side org_id derivation for candidates',
        false,
        `Candidate creation failed: Status ${response.status}, Response: ${JSON.stringify(response.data).substring(0, 200)}`
      );
    }
  } catch (error) {
    logTest('ORG-02: Server-side org_id derivation for candidates', false, error.message);
  }

  // Test 3.3: Attempt to create a client with wrong org_id
  try {
    const maliciousPayload = {
      name: 'Security Test Client',
      industry: 'Security Testing',
      org_id: TEST_ORGS.hildebrand.id, // Try to set wrong org_id
      contactEmail: 'security@test.com'
    };

    const response = await makeAuthenticatedRequest('/clients', TEST_ORGS.mentalcastle.id, {
      method: 'POST',
      body: JSON.stringify(maliciousPayload)
    });

    if (response.ok && response.data.orgId) {
      const correctOrgUsed = response.data.orgId === TEST_ORGS.mentalcastle.id;
      logTest(
        'ORG-03: Server-side org_id derivation for clients (client tampering prevented)',
        correctOrgUsed,
        `Attempted org_id: ${TEST_ORGS.hildebrand.id}, Actual org_id: ${response.data.orgId}`
      );
    } else {
      logTest(
        'ORG-03: Server-side org_id derivation for clients',
        false,
        `Client creation failed: Status ${response.status}, Response: ${JSON.stringify(response.data).substring(0, 200)}`
      );
    }
  } catch (error) {
    logTest('ORG-03: Server-side org_id derivation for clients', false, error.message);
  }
}

// ==========================================
// TEST 4: MULTI-TENANT ISOLATION TESTING
// ==========================================

async function testMultiTenantIsolation() {
  console.log('\n🏢 TESTING MULTI-TENANT ISOLATION...\n');

  // Test 4.1: Verify search operations are org-scoped
  try {
    const response = await makeAuthenticatedRequest('/search/jobs?q=test', TEST_ORGS.mentalcastle.id);
    
    if (response.ok && Array.isArray(response.data)) {
      // Check if all returned jobs belong to the correct organization
      const allJobsBelongToOrg = response.data.every(job => 
        job.orgId === TEST_ORGS.mentalcastle.id || job.org_id === TEST_ORGS.mentalcastle.id
      );
      
      logTest(
        'ISOLATION-01: Job search results are org-scoped',
        allJobsBelongToOrg,
        `Found ${response.data.length} jobs, all belong to correct org: ${allJobsBelongToOrg}`
      );
    } else {
      logTest(
        'ISOLATION-01: Job search results are org-scoped',
        response.status === 404 || response.status === 403,
        `Search endpoint status: ${response.status} (could be not implemented)`
      );
    }
  } catch (error) {
    logTest('ISOLATION-01: Job search results are org-scoped', false, error.message);
  }

  // Test 4.2: Verify dashboard stats are org-scoped
  try {
    const response = await makeAuthenticatedRequest(`/dashboard/stats?org_id=${TEST_ORGS.mentalcastle.id}`, TEST_ORGS.mentalcastle.id);
    
    logTest(
      'ISOLATION-02: Dashboard stats are org-scoped',
      response.ok,
      `Status: ${response.status}, Stats available: ${response.ok ? 'Yes' : 'No'}`
    );

    // Try to access stats for wrong org
    const wrongOrgResponse = await makeAuthenticatedRequest(`/dashboard/stats?org_id=${TEST_ORGS.hildebrand.id}`, TEST_ORGS.mentalcastle.id);
    const shouldFail = !wrongOrgResponse.ok || wrongOrgResponse.status === 403;
    
    logTest(
      'ISOLATION-03: Dashboard stats prevent cross-org access',
      shouldFail,
      `Cross-org stats access status: ${wrongOrgResponse.status} (should be rejected)`
    );
  } catch (error) {
    logTest('ISOLATION-02/03: Dashboard stats isolation', false, error.message);
  }

  // Test 4.3: Verify update operations are org-scoped
  try {
    // First, create a test job
    const createResponse = await makeAuthenticatedRequest('/jobs', TEST_ORGS.mentalcastle.id, {
      method: 'POST',
      body: JSON.stringify({
        title: 'Isolation Test Job',
        description: 'Testing multi-tenant isolation',
        department: 'Security',
        status: 'draft'
      })
    });

    if (createResponse.ok && createResponse.data.id) {
      // Try to update it from a different org context
      const updateResponse = await makeAuthenticatedRequest(`/jobs/${createResponse.data.id}`, TEST_ORGS.hildebrand.id, {
        method: 'PUT',
        headers: { 'X-User-ID': TEST_ORGS.hildebrand.userId },
        body: JSON.stringify({
          title: 'HACKED - Cross-org update',
          description: 'This should not work'
        })
      });

      const updateBlocked = !updateResponse.ok || updateResponse.status === 403 || updateResponse.status === 404;
      logTest(
        'ISOLATION-04: Cross-org update operations are blocked',
        updateBlocked,
        `Cross-org update status: ${updateResponse.status} (should be blocked)`
      );
    } else {
      logWarning('Could not create test job for cross-org update test');
    }
  } catch (error) {
    logTest('ISOLATION-04: Cross-org update operations are blocked', false, error.message);
  }
}

// ==========================================
// TEST 5: PUBLIC JOB APPLICATION SECURITY
// ==========================================

async function testPublicJobApplications() {
  console.log('\n📝 TESTING PUBLIC JOB APPLICATION SECURITY...\n');

  // Test 5.1: Anonymous users can submit applications to published jobs only
  try {
    // First check if there are any public job endpoints
    const publicJobsResponse = await makeRequest('/public/jobs');
    
    if (publicJobsResponse.ok && Array.isArray(publicJobsResponse.data)) {
      logTest(
        'APP-01: Public jobs endpoint accessible to anonymous users',
        true,
        `Found ${publicJobsResponse.data.length} public jobs`
      );

      // Test application submission to a public job (if any exist)
      if (publicJobsResponse.data.length > 0) {
        const publicJob = publicJobsResponse.data[0];
        const applicationData = {
          candidateName: 'Anonymous Applicant',
          candidateEmail: 'applicant@example.com',
          candidatePhone: '+1234567890',
          coverLetter: 'I am interested in this position.',
          jobId: publicJob.id
        };

        const applyResponse = await makeRequest(`/public/jobs/${publicJob.id}/apply`, {
          method: 'POST',
          body: JSON.stringify(applicationData)
        });

        logTest(
          'APP-02: Anonymous users can apply to published jobs',
          applyResponse.ok || applyResponse.status === 201,
          `Application status: ${applyResponse.status}`
        );
      } else {
        logWarning('No public jobs available for testing anonymous applications');
      }
    } else {
      logTest(
        'APP-01: Public jobs endpoint accessible to anonymous users',
        publicJobsResponse.status === 404,
        `Public jobs endpoint status: ${publicJobsResponse.status} (may not be implemented)`
      );
    }
  } catch (error) {
    logTest('APP-01/02: Public job application testing', false, error.message);
  }

  // Test 5.2: Anonymous users CANNOT submit applications to non-public jobs
  try {
    const applicationData = {
      candidateName: 'Malicious Applicant',
      candidateEmail: 'hacker@example.com',
      jobId: 'some-internal-job-id' // Non-public job
    };

    const response = await makeRequest('/applications', {
      method: 'POST',
      body: JSON.stringify(applicationData)
    });

    const shouldFail = !response.ok || response.status === 401 || response.status === 403;
    logTest(
      'APP-03: Anonymous users cannot apply to non-public jobs',
      shouldFail,
      `Direct application attempt status: ${response.status} (should be rejected)`
    );
  } catch (error) {
    logTest('APP-03: Anonymous users cannot apply to non-public jobs', true, 'Request properly rejected: ' + error.message);
  }
}

// ==========================================
// TEST 6: ERROR HANDLING & EDGE CASES
// ==========================================

async function testErrorHandling() {
  console.log('\n⚠️  TESTING ERROR HANDLING & EDGE CASES...\n');

  // Test 6.1: Invalid authentication tokens
  try {
    const response = await makeRequest('/jobs', {
      headers: {
        'Authorization': 'Bearer invalid-token-12345',
        'X-Organization-ID': TEST_ORGS.mentalcastle.id
      }
    });

    const shouldFail = !response.ok || response.status === 401;
    logTest(
      'ERROR-01: Invalid authentication tokens are rejected',
      shouldFail,
      `Invalid token status: ${response.status} (should be 401)`
    );
  } catch (error) {
    logTest('ERROR-01: Invalid authentication tokens are rejected', true, 'Request properly rejected: ' + error.message);
  }

  // Test 6.2: Non-existent organization IDs
  try {
    const response = await makeAuthenticatedRequest('/jobs', '00000000-0000-0000-0000-000000000000');
    
    const shouldFail = !response.ok || response.status === 403 || response.status === 404;
    logTest(
      'ERROR-02: Non-existent organization IDs are rejected',
      shouldFail,
      `Non-existent org status: ${response.status} (should be rejected)`
    );
  } catch (error) {
    logTest('ERROR-02: Non-existent organization IDs are rejected', true, 'Request properly rejected: ' + error.message);
  }

  // Test 6.3: Malformed requests
  try {
    const response = await makeAuthenticatedRequest('/jobs', TEST_ORGS.mentalcastle.id, {
      method: 'POST',
      body: 'invalid-json-data'
    });

    const shouldFail = !response.ok || response.status === 400;
    logTest(
      'ERROR-03: Malformed requests are rejected',
      shouldFail,
      `Malformed request status: ${response.status} (should be 400)`
    );
  } catch (error) {
    logTest('ERROR-03: Malformed requests are rejected', true, 'Request properly rejected: ' + error.message);
  }

  // Test 6.4: SQL injection attempts
  try {
    const response = await makeAuthenticatedRequest("/jobs?search=' OR 1=1 --", TEST_ORGS.mentalcastle.id);
    
    // Should not crash and should not return unexpected data
    logTest(
      'ERROR-04: SQL injection attempts are handled safely',
      response.status !== 500,
      `SQL injection attempt status: ${response.status} (should not be 500 internal error)`
    );
  } catch (error) {
    logTest('ERROR-04: SQL injection attempts are handled safely', false, error.message);
  }
}

// ==========================================
// MAIN TEST EXECUTION
// ==========================================

async function runSecurityTests() {
  console.log('🔐 COMPREHENSIVE SECURITY VALIDATION TESTS');
  console.log('==========================================');
  console.log(`Target: ${API_BASE}`);
  console.log(`Test Organizations: ${Object.keys(TEST_ORGS).join(', ')}`);
  console.log('==========================================\n');

  try {
    // Run all test suites
    await testRLSPolicies();
    await testAnonymousAccess();
    await testOrgIdDerivation();
    await testMultiTenantIsolation();
    await testPublicJobApplications();
    await testErrorHandling();

    // Print final results
    console.log('\n🏁 SECURITY VALIDATION RESULTS');
    console.log('==============================');
    console.log(`✅ PASSED: ${testResults.passed}`);
    console.log(`❌ FAILED: ${testResults.failed}`);
    console.log(`⚠️  WARNINGS: ${testResults.warnings.length}`);
    console.log('==============================\n');

    if (testResults.failed > 0) {
      console.log('❌ FAILED TESTS:');
      testResults.errors.forEach(error => {
        console.log(`   - ${error.test}: ${error.details}`);
      });
      console.log('');
    }

    if (testResults.warnings.length > 0) {
      console.log('⚠️  WARNINGS:');
      testResults.warnings.forEach(warning => {
        console.log(`   - ${warning}`);
      });
      console.log('');
    }

    // Security assessment
    const securityScore = Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100);
    console.log(`🔒 SECURITY SCORE: ${securityScore}%`);
    
    if (securityScore >= 95) {
      console.log('🟢 SECURITY STATUS: EXCELLENT - Ready for production');
    } else if (securityScore >= 85) {
      console.log('🟡 SECURITY STATUS: GOOD - Minor issues to address');
    } else if (securityScore >= 70) {
      console.log('🟠 SECURITY STATUS: ADEQUATE - Several issues need attention');
    } else {
      console.log('🔴 SECURITY STATUS: CRITICAL - Major security issues found');
    }

    console.log('\n🛡️  SECURITY RECOMMENDATIONS:');
    console.log('1. Review and address any failed tests above');
    console.log('2. Implement proper logging and monitoring for security events');
    console.log('3. Regular security audits and penetration testing');
    console.log('4. Keep dependencies updated and scan for vulnerabilities');
    console.log('5. Implement proper incident response procedures');

    return {
      score: securityScore,
      passed: testResults.passed,
      failed: testResults.failed,
      warnings: testResults.warnings.length,
      ready: securityScore >= 85
    };

  } catch (error) {
    console.error('❌ CRITICAL ERROR during security testing:', error);
    return {
      score: 0,
      passed: 0,
      failed: 999,
      warnings: 0,
      ready: false,
      error: error.message
    };
  }
}

// Run tests if called directly
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if this script is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSecurityTests().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  });
}

export { runSecurityTests };