/// <reference types="cypress" />

describe('Job Publishing Flow', () => {
  let testCredentials: any
  let createdJobId: string
  let jobSlug: string

  before(() => {
    // Load test credentials created by seed script
    cy.getTestCredentials().then((credentials) => {
      testCredentials = credentials
      cy.log('Loaded test credentials:', credentials.organizationName)
    })
  })

  beforeEach(() => {
    // Ensure we have fresh test credentials for each test
    cy.getTestCredentials().then((credentials) => {
      testCredentials = credentials
    })
  })

  it('should create a draft job via API', () => {
    cy.getTestCredentials().then((credentials) => {
      const jobTitle = `E2E Test Job - ${new Date().toISOString().slice(0, 19)}`
      
      cy.createJob({
        title: jobTitle,
        clientId: credentials.clientId,
        orgId: credentials.organizationId,
        description: 'This is a comprehensive E2E test job for validating the complete recruitment flow',
        type: 'full_time',
        location: 'Remote - Global',
        department: 'Engineering',
        salary_min: 90000,
        salary_max: 130000
      }).then((jobResponse) => {
        expect(jobResponse).to.have.property('id')
        expect(jobResponse).to.have.property('title', jobTitle)
        expect(jobResponse).to.have.property('status', 'draft')
        
        createdJobId = jobResponse.id
        jobSlug = jobResponse.slug || jobTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        
        cy.log(`Created job: ${createdJobId} with slug: ${jobSlug}`)
        
        // Verify the job is in draft status
        cy.request('GET', `/api/jobs/${createdJobId}`)
          .then((response) => {
            expect(response.status).to.eq(200)
            expect(response.body.status).to.eq('draft')
          })
      })
    })
  })

  it('should publish the job and make it public', () => {
    // Ensure we have a job ID from the previous test
    expect(createdJobId).to.exist
    
    cy.publishJob(createdJobId).then((publishResponse) => {
      expect(publishResponse).to.have.property('success', true)
      
      // Verify the job status changed to published
      cy.request('GET', `/api/jobs/${createdJobId}`)
        .then((response) => {
          expect(response.status).to.eq(200)
          expect(response.body.status).to.eq('published')
        })
    })
  })

  it('should make published job visible on public careers page', () => {
    // Ensure we have a published job
    expect(createdJobId).to.exist
    
    // Check public jobs API endpoint
    cy.request('GET', '/api/public/jobs')
      .then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.be.an('array')
        
        // Find our test job in the public list
        const publicJob = response.body.find((job: any) => job.id === createdJobId)
        expect(publicJob).to.exist
        expect(publicJob.status).to.eq('published')
        expect(publicJob.title).to.contain('E2E Test Job')
      })
  })

  it('should serve job details on public careers URL', () => {
    expect(createdJobId).to.exist
    
    // Test the individual job page endpoint
    cy.request('GET', `/api/public/jobs/${createdJobId}`)
      .then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('id', createdJobId)
        expect(response.body).to.have.property('title')
        expect(response.body).to.have.property('description')
        expect(response.body.status).to.eq('published')
      })
  })

  it('should create default pipeline columns for the job', () => {
    expect(createdJobId).to.exist
    
    cy.getTestCredentials().then((credentials) => {
      // Check that pipeline columns were created for this job
      cy.request('GET', `/api/jobs/${createdJobId}/pipeline-columns`)
        .then((response) => {
          expect(response.status).to.eq(200)
          expect(response.body).to.be.an('array')
          expect(response.body).to.have.length.greaterThan(0)
          
          // Verify default columns exist
          const columnTitles = response.body.map((col: any) => col.title)
          expect(columnTitles).to.include('Applied')
          expect(columnTitles).to.include('Screen')
          expect(columnTitles).to.include('Interview')
          expect(columnTitles).to.include('Offer')
          expect(columnTitles).to.include('Hired')
        })
    })
  })

  after(() => {
    // Log completion
    cy.log(`Job publishing tests completed. Job ID: ${createdJobId}`)
  })
})