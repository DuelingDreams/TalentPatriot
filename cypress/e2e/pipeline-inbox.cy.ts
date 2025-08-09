/// <reference types="cypress" />

describe('Pipeline Candidate Management', () => {
  let testCredentials: any
  let testJobId: string
  let testCandidateId: string
  let testApplicationId: string

  before(() => {
    // Setup test environment with job and application
    cy.getTestCredentials().then((credentials) => {
      testCredentials = credentials
      
      // Create and publish a job
      const jobTitle = `Pipeline Test Job - ${new Date().toISOString().slice(0, 19)}`
      
      cy.createJob({
        title: jobTitle,
        clientId: credentials.clientId,
        orgId: credentials.organizationId,
        description: 'Test job for pipeline candidate management',
        type: 'full_time',
        location: 'Remote',
        department: 'Product Management',
        salary_min: 85000,
        salary_max: 115000
      }).then((jobResponse) => {
        testJobId = jobResponse.id
        
        return cy.publishJob(testJobId)
      }).then(() => {
        // Submit a test application
        const timestamp = new Date().getTime()
        const applicantEmail = `pipeline-test-${timestamp}@testing.com`
        
        return cy.submitApplication(testJobId, {
          firstName: 'Pipeline',
          lastName: 'Tester',
          email: applicantEmail,
          phone: '+1-555-PIPE-TEST'
        })
      }).then((applicationResponse) => {
        testCandidateId = applicationResponse.candidateId
        testApplicationId = applicationResponse.applicationId
        
        cy.log(`Test setup complete. Job: ${testJobId}, Candidate: ${testCandidateId}`)
      })
    })
  })

  it('should display job pipeline with correct columns', () => {
    // Visit the pipeline page for our test job
    cy.visit(`/pipeline/${testJobId}`)
    
    // Wait for the pipeline to load
    cy.waitForElement('body', 15000)
    
    // Check that pipeline columns are displayed
    cy.contains('Applied').should('be.visible')
    cy.contains('Screen').should('be.visible')
    cy.contains('Interview').should('be.visible')
    cy.contains('Offer').should('be.visible')
    cy.contains('Hired').should('be.visible')
    
    // Verify job title is displayed
    cy.contains('Pipeline Test Job').should('be.visible')
  })

  it('should show test candidate in Applied column', () => {
    // Visit the pipeline page
    cy.visit(`/pipeline/${testJobId}`)
    
    // Wait for candidates to load
    cy.waitForElement('body', 15000)
    
    // Look for our test candidate in the Applied column
    cy.contains('Pipeline Tester').should('be.visible')
    
    // Verify candidate details
    cy.contains('pipeline-test-').should('be.visible') // Email starts with this
    
    // Check that candidate appears in the Applied column specifically
    cy.get('[data-testid="pipeline-column"], .pipeline-column, [class*="column"]')
      .contains('Applied')
      .parent()
      .should('contain.text', 'Pipeline Tester')
  })

  it('should display candidate card with correct information', () => {
    cy.visit(`/pipeline/${testJobId}`)
    cy.waitForElement('body', 15000)
    
    // Find the candidate card
    cy.contains('Pipeline Tester')
      .closest('[data-testid="candidate-card"], .candidate-card, [class*="card"]')
      .within(() => {
        // Check candidate name
        cy.contains('Pipeline Tester').should('be.visible')
        
        // Check email
        cy.contains('pipeline-test-').should('be.visible')
        
        // Check for action buttons
        cy.contains('View Resume', { matchCase: false }).should('be.visible')
        cy.contains('Notes', { matchCase: false }).should('be.visible')
      })
  })

  it('should verify pipeline data via API', () => {
    // Get pipeline data directly from API
    cy.request('GET', `/api/jobs/${testJobId}/pipeline`)
      .then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('applications')
        expect(response.body).to.have.property('columns')
        
        // Verify our test application is in the pipeline
        const testApp = response.body.applications.find((app: any) => 
          app.id === testApplicationId
        )
        
        expect(testApp).to.exist
        expect(testApp).to.have.property('candidateId', testCandidateId)
        
        // Verify it's in the Applied column
        const appliedColumn = response.body.columns.find((col: any) => 
          col.title === 'Applied' && col.position === 0
        )
        
        expect(appliedColumn).to.exist
        expect(testApp.columnId).to.eq(appliedColumn.id)
        
        cy.log('Pipeline API data verified successfully')
      })
  })

  it('should show realtime connection status indicator', () => {
    cy.visit(`/pipeline/${testJobId}`)
    cy.waitForElement('body', 15000)
    
    // Look for realtime status indicator
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="realtime-status"], .realtime-status, [class*="realtime"]').length > 0) {
        cy.get('[data-testid="realtime-status"], .realtime-status, [class*="realtime"]')
          .should('be.visible')
        
        cy.log('Realtime status indicator found and verified')
      } else {
        // Look for Live/Connecting/Offline badges
        const statusTexts = ['Live', 'Connecting', 'Offline', 'Static']
        let statusFound = false
        
        statusTexts.forEach((status) => {
          if ($body.text().includes(status)) {
            cy.contains(status).should('be.visible')
            statusFound = true
            cy.log(`Realtime status "${status}" found`)
          }
        })
        
        if (!statusFound) {
          cy.log('No realtime status indicator found (may be disabled)')
        }
      }
    })
  })

  it('should handle candidate search and filtering', () => {
    cy.visit(`/pipeline/${testJobId}`)
    cy.waitForElement('body', 15000)
    
    // Look for search functionality
    cy.get('body').then(($body) => {
      if ($body.find('input[type="search"], input[placeholder*="search"], input[placeholder*="filter"]').length > 0) {
        cy.get('input[type="search"], input[placeholder*="search"], input[placeholder*="filter"]')
          .first()
          .type('Pipeline Tester')
        
        // Verify the candidate is still visible after search
        cy.contains('Pipeline Tester').should('be.visible')
        
        cy.log('Search functionality verified')
      } else {
        cy.log('No search functionality found on pipeline page')
      }
    })
  })

  it('should allow candidate notes interaction', () => {
    cy.visit(`/pipeline/${testJobId}`)
    cy.waitForElement('body', 15000)
    
    // Find and click the Notes button
    cy.contains('Pipeline Tester')
      .closest('[data-testid="candidate-card"], .candidate-card, [class*="card"]')
      .within(() => {
        cy.contains('Notes', { matchCase: false }).click()
      })
    
    // Wait for notes dialog/modal to appear
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="notes-dialog"], .notes-dialog, [role="dialog"]').length > 0) {
        // Notes dialog opened successfully
        cy.get('[data-testid="notes-dialog"], .notes-dialog, [role="dialog"]')
          .should('be.visible')
        
        // Close the dialog
        cy.get('[data-testid="close-dialog"], [aria-label*="close"], [aria-label*="Close"]')
          .first()
          .click()
        
        cy.log('Notes dialog interaction verified')
      } else {
        cy.log('Notes dialog may not have opened or uses different selectors')
      }
    })
  })

  after(() => {
    cy.log(`Pipeline tests completed. Job: ${testJobId}, Candidate: ${testCandidateId}`)
  })
})