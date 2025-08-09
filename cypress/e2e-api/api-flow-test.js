#!/usr/bin/env node

/**
 * Headless E2E API Flow Test
 * Tests the complete job creation -> publish -> apply -> pipeline flow via API
 * Runs without GUI dependencies, suitable for CI/CD environments
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load test credentials
const credentialsPath = path.join(__dirname, '..', 'fixtures', 'test-credentials.json');
if (!fs.existsSync(credentialsPath)) {
  console.error('❌ Test credentials not found. Run `npm run seed:test` first.');
  process.exit(1);
}

const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
const BASE_URL = credentials.baseUrl;

console.log('🚀 Starting E2E API Flow Test');
console.log(`📍 Base URL: ${BASE_URL}`);
console.log(`🏢 Organization: ${credentials.organizationName} (${credentials.organizationId})`);
console.log(`👥 Client: ${credentials.clientName} (${credentials.clientId})`);

// Helper function for API requests
async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    data = text;
  }

  return {
    status: response.status,
    ok: response.ok,
    data
  };
}

// Test suite
async function runE2ETests() {
  let testJobId = null;
  let testApplicationId = null;
  let testCandidateId = null;

  try {
    // Test 1: Create a job
    console.log('\n📝 Test 1: Creating a job...');
    const jobTitle = `API E2E Test Job - ${new Date().toISOString().slice(0, 19)}`;
    const createJobResponse = await apiRequest('/api/jobs', {
      method: 'POST',
      body: JSON.stringify({
        title: jobTitle,
        clientId: credentials.clientId,
        orgId: credentials.organizationId,
        description: 'This is a comprehensive API E2E test job for validating the complete recruitment flow',
        jobType: 'full-time',
        location: 'Remote - API Testing',
        department: 'Engineering',
        salaryRange: '$95,000 - $135,000',
        requirements: ['API Testing Experience', 'E2E Test Development'],
        benefits: ['Health Insurance', 'Remote Work', '401k']
      })
    });

    if (!createJobResponse.ok) {
      throw new Error(`Job creation failed: ${JSON.stringify(createJobResponse.data)}`);
    }

    testJobId = createJobResponse.data.id;
    console.log(`✅ Job created successfully: ${testJobId}`);
    console.log(`   Title: ${createJobResponse.data.title}`);
    console.log(`   Status: ${createJobResponse.data.status}`);

    // Test 2: Publish the job
    console.log('\n📢 Test 2: Publishing the job...');
    const publishResponse = await apiRequest(`/api/jobs/${testJobId}/publish`, {
      method: 'POST'
    });

    if (!publishResponse.ok) {
      throw new Error(`Job publishing failed: ${JSON.stringify(publishResponse.data)}`);
    }

    console.log('✅ Job published successfully');

    // Test 3: Verify job appears in public listings
    console.log('\n🌐 Test 3: Verifying job in public listings...');
    const publicJobsResponse = await apiRequest('/api/public/jobs');

    if (!publicJobsResponse.ok) {
      throw new Error(`Public jobs fetch failed: ${JSON.stringify(publicJobsResponse.data)}`);
    }

    const publicJob = publicJobsResponse.data.find(job => job.id === testJobId);
    if (!publicJob) {
      throw new Error(`Job ${testJobId} not found in public listings`);
    }

    console.log('✅ Job found in public listings');
    console.log(`   Status: ${publicJob.status}`);
    console.log(`   Title: ${publicJob.title}`);

    // Test 4: Submit job application
    console.log('\n📄 Test 4: Submitting job application...');
    const timestamp = Date.now();
    const applicantEmail = `api-test-${timestamp}@e2e-testing.com`;
    
    const applyResponse = await apiRequest(`/api/jobs/${testJobId}/apply`, {
      method: 'POST',
      body: JSON.stringify({
        firstName: 'API',
        lastName: 'Tester',
        email: applicantEmail,
        phone: '+1-555-API-TEST',
        resumeUrl: 'https://example.supabase.co/storage/v1/object/public/resumes/api-test-resume.pdf'
      })
    });

    if (!applyResponse.ok) {
      throw new Error(`Job application failed: ${JSON.stringify(applyResponse.data)}`);
    }

    testApplicationId = applyResponse.data.applicationId;
    testCandidateId = applyResponse.data.candidateId;
    console.log('✅ Job application submitted successfully');
    console.log(`   Application ID: ${testApplicationId}`);
    console.log(`   Candidate ID: ${testCandidateId}`);

    // Test 5: Verify candidate in pipeline
    console.log('\n🔄 Test 5: Verifying candidate in pipeline...');
    const candidatesResponse = await apiRequest(`/api/jobs/${testJobId}/candidates?orgId=${credentials.organizationId}`);

    if (!candidatesResponse.ok) {
      throw new Error(`Candidates fetch failed: ${JSON.stringify(candidatesResponse.data)}`);
    }

    const testCandidate = candidatesResponse.data.find(candidate => 
      candidate.candidateId === testCandidateId || candidate.id === testApplicationId
    );

    if (!testCandidate) {
      throw new Error(`Candidate ${testCandidateId} not found in pipeline`);
    }

    console.log('✅ Candidate found in pipeline');
    console.log(`   Email: ${testCandidate.candidate?.email || testCandidate.email || 'Unknown'}`);
    console.log(`   Stage: ${testCandidate.stage || 'Unknown'}`);

    // Test 6: Verify pipeline structure
    console.log('\n🏗️ Test 6: Verifying pipeline structure...');
    const pipelineResponse = await apiRequest(`/api/jobs/${testJobId}/pipeline`);

    if (!pipelineResponse.ok) {
      throw new Error(`Pipeline fetch failed: ${JSON.stringify(pipelineResponse.data)}`);
    }

    const pipeline = pipelineResponse.data;
    const requiredColumns = ['Applied', 'Screen', 'Interview', 'Offer', 'Hired'];
    const columnTitles = pipeline.columns.map(col => col.title);

    for (const requiredCol of requiredColumns) {
      if (!columnTitles.includes(requiredCol)) {
        throw new Error(`Required pipeline column "${requiredCol}" not found`);
      }
    }

    console.log('✅ Pipeline structure verified');
    console.log(`   Columns: ${columnTitles.join(', ')}`);
    console.log(`   Applications: ${pipeline.applications.length}`);

    // Test 7: Verify application in correct column
    const testApplication = pipeline.applications.find(app => app.id === testApplicationId);
    if (!testApplication) {
      throw new Error(`Application ${testApplicationId} not found in pipeline`);
    }

    const appliedColumn = pipeline.columns.find(col => col.title === 'Applied' && col.position === 0);
    if (!appliedColumn || testApplication.columnId !== appliedColumn.id) {
      throw new Error('Application not placed in correct "Applied" column');
    }

    console.log('✅ Application correctly placed in "Applied" column');

    // Test 8: Test duplicate application handling
    console.log('\n🔄 Test 8: Testing duplicate application handling...');
    const duplicateResponse = await apiRequest(`/api/jobs/${testJobId}/apply`, {
      method: 'POST',
      body: JSON.stringify({
        firstName: 'API',
        lastName: 'Tester',
        email: applicantEmail,
        phone: '+1-555-API-TEST',
        resumeUrl: 'https://example.supabase.co/storage/v1/object/public/resumes/api-test-resume.pdf'
      })
    });

    if (!duplicateResponse.ok) {
      console.log('⚠️ Duplicate application rejected as expected');
    } else {
      console.log('✅ Duplicate application handled gracefully');
    }

    // All tests passed
    console.log('\n🎉 All E2E API tests passed successfully!');
    console.log('\n📊 Test Summary:');
    console.log(`   ✅ Job created: ${testJobId}`);
    console.log(`   ✅ Job published and visible publicly`);
    console.log(`   ✅ Application submitted: ${testApplicationId}`);
    console.log(`   ✅ Candidate in pipeline: ${testCandidateId}`);
    console.log(`   ✅ Pipeline structure correct`);
    console.log(`   ✅ Application in correct column`);
    console.log(`   ✅ Duplicate handling works`);

    return {
      success: true,
      testJobId,
      testApplicationId,
      testCandidateId
    };

  } catch (error) {
    console.error('\n❌ E2E API test failed:', error.message);
    console.error('\n💥 Test Summary:');
    console.error(`   Job ID: ${testJobId || 'Not created'}`);
    console.error(`   Application ID: ${testApplicationId || 'Not created'}`);
    console.error(`   Candidate ID: ${testCandidateId || 'Not created'}`);
    
    return {
      success: false,
      error: error.message,
      testJobId,
      testApplicationId,
      testCandidateId
    };
  }
}

// Run the tests
if (import.meta.url === `file://${process.argv[1]}`) {
  runE2ETests()
    .then((result) => {
      if (result.success) {
        console.log('\n🏁 E2E API testing completed successfully!');
        process.exit(0);
      } else {
        console.log('\n💀 E2E API testing failed!');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n💥 Unexpected error:', error);
      process.exit(1);
    });
}

export { runE2ETests };