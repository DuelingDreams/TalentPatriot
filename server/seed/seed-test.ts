#!/usr/bin/env ts-node

import { supabase } from '../lib/supabase'
import { randomUUID } from 'crypto'

interface TestCredentials {
  organizationId: string
  organizationName: string
  organizationSlug: string
  clientId: string
  clientName: string
  userId: string
  userEmail: string
  baseUrl: string
  careersUrl: string
}

/**
 * Simplified test data seeding script that works with existing organizations
 * Gets existing data and creates test job/client data for E2E tests
 */
async function seedTestData(): Promise<TestCredentials> {
  console.log('🌱 Starting test data seeding...')
  
  const testPrefix = 'e2e-test'
  const timestamp = Date.now().toString().slice(-6) // Last 6 digits of timestamp for uniqueness
  
  const clientName = `${testPrefix}-client-${timestamp}`
  
  try {
    // Get existing organization for testing (use first available)
    console.log('🔍 Finding existing organization...')
    const { data: orgs, error: orgQueryError } = await supabase
      .from('organizations')
      .select('*')
      .limit(1)
    
    if (orgQueryError || !orgs || orgs.length === 0) {
      console.error('❌ No organizations found:', orgQueryError)
      throw new Error('No organizations available for testing. Please create an organization first.')
    }
    
    const existingOrg = orgs[0]
    console.log(`✅ Using organization: ${existingOrg.name} (${existingOrg.id})`)
    
    // Clean up any existing test data with this prefix
    console.log('🧹 Cleaning up existing test data...')
    
    await supabase
      .from('job_candidate')
      .delete()
      .ilike('created_at', `%${timestamp}%`)
    
    await supabase
      .from('candidates')
      .delete()
      .ilike('email', `%e2e-test%`)
      
    await supabase
      .from('jobs')
      .delete()
      .ilike('title', `%${testPrefix}%`)
    
    await supabase
      .from('clients')
      .delete()
      .ilike('name', `%${testPrefix}%`)
    
    // Create test client
    console.log('👥 Creating test client...')
    const clientId = randomUUID()
    const { error: clientError } = await supabase
      .from('clients')
      .insert({
        id: clientId,
        org_id: existingOrg.id,
        name: clientName,
        industry: 'Software Development',
        location: 'Remote',
        website: `https://${clientName.toLowerCase()}.example.com`,
        contact_email: `contact@${clientName.toLowerCase()}.example.com`,
        contact_name: 'E2E Test Contact',
        notes: 'E2E Test Client for job creation and pipeline testing',
        status: 'active'
      })
    
    if (clientError) {
      console.error('❌ Failed to create client:', clientError)
      throw clientError
    }
    
    console.log(`✅ Created test client: ${clientName} (${clientId})`)
    
    const baseUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
      : 'http://localhost:5000'
    
    const credentials: TestCredentials = {
      organizationId: existingOrg.id,
      organizationName: existingOrg.name,
      organizationSlug: existingOrg.slug || 'test-org',
      clientId: clientId,
      clientName: clientName,
      userId: existingOrg.owner_id,
      userEmail: `test-${timestamp}@e2e-testing.com`,
      baseUrl: baseUrl,
      careersUrl: `${baseUrl}/careers`
    }
    
    console.log('✅ Test data seeding completed successfully!')
    console.log('📋 Test Credentials:')
    console.log('   Organization ID:', credentials.organizationId)
    console.log('   Organization Name:', credentials.organizationName)
    console.log('   Organization Slug:', credentials.organizationSlug)
    console.log('   Client ID:', credentials.clientId)
    console.log('   Client Name:', credentials.clientName)
    console.log('   User ID:', credentials.userId)
    console.log('   User Email:', credentials.userEmail)
    console.log('   Base URL:', credentials.baseUrl)
    console.log('   Careers URL:', credentials.careersUrl)
    
    // Write credentials to file for Cypress to consume
    const fs = await import('fs')
    const path = await import('path')
    
    const credentialsPath = path.join(process.cwd(), 'cypress', 'fixtures', 'test-credentials.json')
    
    // Ensure cypress/fixtures directory exists
    fs.mkdirSync(path.dirname(credentialsPath), { recursive: true })
    
    fs.writeFileSync(credentialsPath, JSON.stringify(credentials, null, 2))
    console.log('💾 Credentials saved to:', credentialsPath)
    
    return credentials
    
  } catch (error) {
    console.error('❌ Test data seeding failed:', error)
    throw error
  }
}

// Run seeding if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedTestData()
    .then((credentials) => {
      console.log('\n🎉 Seeding completed! Ready for E2E tests.')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Seeding failed:', error)
      process.exit(1)
    })
}

export { seedTestData, TestCredentials }