// Cypress E2E Support File
// This file is processed and loaded automatically before your test files

import './commands'

// Global configuration
Cypress.on('uncaught:exception', (err, runnable) => {
  // Prevent Cypress from failing on uncaught exceptions from the app
  // Return false here to prevent the error from failing the test
  console.log('Uncaught exception:', err.message)
  return false
})

// Custom commands for TalentPatriot ATS testing
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Login as test user (simulated auth)
       */
      loginAsTestUser(userEmail: string): Chainable<void>
      
      /**
       * Create a job via API
       */
      createJob(jobData: {
        title: string
        clientId: string
        orgId: string
        description?: string
        type?: string
        location?: string
        department?: string
        salary_min?: number
        salary_max?: number
      }): Chainable<any>
      
      /**
       * Publish a job via API
       */
      publishJob(jobId: string): Chainable<void>
      
      /**
       * Submit job application via API
       */
      submitApplication(jobId: string, applicationData: {
        firstName: string
        lastName: string
        email: string
        phone?: string
        resumeUrl?: string
      }): Chainable<any>
      
      /**
       * Wait for element with better error handling
       */
      waitForElement(selector: string, timeout?: number): Chainable<JQuery<HTMLElement>>
      
      /**
       * Get test credentials from fixtures
       */
      getTestCredentials(): Chainable<any>
      
      /**
       * Clean up test data
       */
      cleanupTestData(): Chainable<void>
    }
  }
}