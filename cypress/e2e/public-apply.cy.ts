/// <reference types="cypress" />

describe('Public Job Application Flow', () => {
  let testCredentials: any
  let testJobId: string
  let applicantEmail: string

  before(() => {
    // Load test credentials and create a job for application testing
    cy.getTestCredentials().then((credentials) => {
      testCredentials = credentials
      
      // Create and publish a job for testing applications
      const jobTitle = `Application Test Job - ${new Date().toISOString().slice(0, 19)}`
      
      cy.createJob({
        title: jobTitle,
        clientId: credentials.clientId,
        orgId: credentials.organizationId,
        description: 'Test job for validating the public application process',
        type: 'full_time',
        location: 'Remote',
        department: 'QA Engineering',
        salary_min: 70000,
        salary_max: 100000
      }).then((jobResponse) => {
        testJobId = jobResponse.id
        
        // Publish the job to make it available for applications
        cy.publishJob(testJobId)
      })
    })
  })

  beforeEach(() => {
    // Generate unique applicant email for each test
    const timestamp = new Date().getTime()
    applicantEmail = `e2e-applicant-${timestamp}@testing.com`
  })

  it('should display job details on public careers page', () => {
    // Visit the careers page
    cy.visit('/careers')
    
    // Wait for jobs to load and check if our test job is visible
    cy.waitForElement('[data-testid="job-card"], .job-card, [class*="job"]', 15000)
    
    // The page should contain job listings
    cy.get('body').should('contain.text', 'Application Test Job')
    
    // Check that essential job information is displayed
    cy.contains('Application Test Job').should('be.visible')
    cy.contains('QA Engineering').should('be.visible')
    cy.contains('Remote').should('be.visible')
  })

  it('should navigate to individual job application page', () => {
    // Visit the careers page first
    cy.visit('/careers')
    
    // Wait for jobs to load
    cy.waitForElement('body', 10000)
    
    // Click on our test job
    cy.contains('Application Test Job').click()
    
    // Should navigate to job details page
    cy.url().should('include', '/careers/')
    
    // Page should contain job details
    cy.contains('Application Test Job').should('be.visible')
    cy.contains('Test job for validating').should('be.visible')
    cy.contains('Apply').should('be.visible')
  })

  it('should submit job application via API successfully', () => {
    // Submit application directly via API (faster and more reliable than UI)
    cy.submitApplication(testJobId, {
      firstName: 'Jane',
      lastName: 'Doe',
      email: applicantEmail,
      phone: '+1-555-E2E-TEST'
    }).then((applicationResponse) => {
      expect(applicationResponse).to.have.property('success', true)
      expect(applicationResponse).to.have.property('candidateId')
      expect(applicationResponse).to.have.property('applicationId')
      
      cy.log(`Application submitted successfully: ${applicationResponse.applicationId}`)
      
      // Store the application ID for pipeline verification
      cy.wrap(applicationResponse.applicationId).as('applicationId')
      cy.wrap(applicationResponse.candidateId).as('candidateId')
    })
  })

  it('should verify candidate appears in job candidates list', () => {
    cy.get('@candidateId').then((candidateId) => {
      cy.get('@applicationId').then((applicationId) => {
        cy.getTestCredentials().then((credentials) => {
          // Check that the candidate appears in the job's candidate list
          cy.request('GET', `/api/jobs/${testJobId}/candidates?orgId=${credentials.organizationId}`)
            .then((response) => {
              expect(response.status).to.eq(200)
              expect(response.body).to.be.an('array')
              
              // Find our test candidate
              const testCandidate = response.body.find((candidate: any) => 
                candidate.candidateId === candidateId || candidate.id === applicationId
              )
              
              expect(testCandidate).to.exist
              expect(testCandidate.candidate?.email || testCandidate.email).to.eq(applicantEmail)
              
              cy.log(`Candidate verified in pipeline: ${JSON.stringify(testCandidate, null, 2)}`)
            })
        })
      })
    })
  })

  it('should place new application in first pipeline column', () => {
    cy.get('@applicationId').then((applicationId) => {
      cy.getTestCredentials().then((credentials) => {
        // Get pipeline data for the job
        cy.request('GET', `/api/jobs/${testJobId}/pipeline`)
          .then((response) => {
            expect(response.status).to.eq(200)
            expect(response.body).to.have.property('applications')
            expect(response.body).to.have.property('columns')
            
            // Find our application in the pipeline
            const testApplication = response.body.applications.find((app: any) => 
              app.id === applicationId
            )
            
            expect(testApplication).to.exist
            
            // Verify it's in the first column (Applied)
            const firstColumn = response.body.columns.find((col: any) => col.position === 0)
            expect(firstColumn).to.exist
            expect(firstColumn.title).to.eq('Applied')
            expect(testApplication.columnId).to.eq(firstColumn.id)
            
            cy.log(`Application correctly placed in "${firstColumn.title}" column`)
          })
      })
    })
  })

  it('should handle duplicate application attempts gracefully', () => {
    // Attempt to submit the same application again
    cy.submitApplication(testJobId, {
      firstName: 'Jane',
      lastName: 'Doe',
      email: applicantEmail,
      phone: '+1-555-E2E-TEST'
    }).then((applicationResponse) => {
      // Should still succeed but may return existing candidate
      expect(applicationResponse).to.have.property('success', true)
      expect(applicationResponse).to.have.property('candidateId')
      
      cy.log('Duplicate application handled successfully')
    })
  })

  after(() => {
    cy.log(`Public application tests completed. Job ID: ${testJobId}`)
    cy.log(`Test applicant email: ${applicantEmail}`)
  })
})