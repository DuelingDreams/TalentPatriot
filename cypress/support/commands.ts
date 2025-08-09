// Custom Cypress commands for TalentPatriot ATS E2E testing

/**
 * Simulate user authentication for testing
 */
Cypress.Commands.add('loginAsTestUser', (userEmail: string) => {
  // For now, we'll simulate authentication by setting localStorage
  // In a real app, you'd handle actual auth tokens
  cy.window().then((win) => {
    win.localStorage.setItem('test_user_email', userEmail)
    win.localStorage.setItem('test_authenticated', 'true')
  })
})

/**
 * Create a job via API
 */
Cypress.Commands.add('createJob', (jobData) => {
  return cy.request({
    method: 'POST',
    url: '/api/jobs',
    body: {
      title: jobData.title,
      client_id: jobData.clientId,
      org_id: jobData.orgId,
      description: jobData.description || 'Test job description for E2E testing',
      type: jobData.type || 'full_time',
      location: jobData.location || 'Remote',
      department: jobData.department || 'Engineering',
      salary_min: jobData.salary_min || 80000,
      salary_max: jobData.salary_max || 120000,
      requirements: ['Test requirement 1', 'Test requirement 2'],
      benefits: ['Test benefit 1', 'Test benefit 2']
    },
    headers: {
      'Content-Type': 'application/json'
    }
  }).then((response) => {
    expect(response.status).to.eq(201)
    return response.body
  })
})

/**
 * Publish a job via API
 */
Cypress.Commands.add('publishJob', (jobId: string) => {
  return cy.request({
    method: 'POST',
    url: `/api/jobs/${jobId}/publish`,
    headers: {
      'Content-Type': 'application/json'
    }
  }).then((response) => {
    expect(response.status).to.eq(200)
    return response.body
  })
})

/**
 * Submit job application via API
 */
Cypress.Commands.add('submitApplication', (jobId: string, applicationData) => {
  return cy.request({
    method: 'POST',
    url: `/api/jobs/${jobId}/apply`,
    body: {
      firstName: applicationData.firstName,
      lastName: applicationData.lastName,
      email: applicationData.email,
      phone: applicationData.phone || '+1-555-TEST-APP',
      resumeUrl: applicationData.resumeUrl || 'https://example.supabase.co/storage/v1/object/public/resumes/test-e2e-resume.pdf'
    },
    headers: {
      'Content-Type': 'application/json'
    }
  }).then((response) => {
    expect(response.status).to.eq(201)
    return response.body
  })
})

/**
 * Wait for element with better error handling and retry logic
 */
Cypress.Commands.add('waitForElement', (selector: string, timeout = 10000) => {
  return cy.get(selector, { timeout }).should('exist').and('be.visible')
})

/**
 * Get test credentials from fixtures
 */
Cypress.Commands.add('getTestCredentials', () => {
  return cy.fixture('test-credentials.json')
})

/**
 * Clean up test data (called after tests)
 */
Cypress.Commands.add('cleanupTestData', () => {
  // This would typically clean up test data
  // For now, we rely on the seeding script to clean up before creating new data
  cy.log('Cleanup completed (handled by seed script)')
})

// Prevent TypeScript errors
export {}