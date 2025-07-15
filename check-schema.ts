import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkSchema() {
  // Test inserting a single client with all possible column names
  const testClient = {
    name: 'Test Client',
    industry: 'Test',
    location: 'Test Location',
    website: 'https://test.com',
    status: 'demo'
  }
  
  console.log('Testing client insertion...')
  const { error } = await supabase.from('clients').insert([testClient])
  
  if (error) {
    console.error('Client insertion failed:', error.message)
  } else {
    console.log('✅ Client insertion successful')
  }
  
  // Now test different contact field names
  const contactFields = [
    { contactName: 'John Doe', contactEmail: 'john@test.com', contactPhone: '555-1234' },
    { contact_name: 'John Doe', contact_email: 'john@test.com', contact_phone: '555-1234' },
    { contact_name: 'John Doe', contact_email: 'john@test.com', contact_phone: '555-1234' }
  ]
  
  for (const fields of contactFields) {
    const testData = { ...testClient, ...fields }
    console.log('Testing fields:', Object.keys(fields))
    const { error } = await supabase.from('clients').insert([testData])
    
    if (error) {
      console.error('❌ Failed with:', error.message)
    } else {
      console.log('✅ Success with:', Object.keys(fields))
      break
    }
  }
}

checkSchema().catch(console.error)