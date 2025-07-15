// Demo Auth Users Seed Script
// This script creates demo user accounts for testing authentication and role-based access

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  console.log('Make sure you have VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

interface DemoUser {
  email: string
  password: string
  role: string
  name: string
}

const demoUsers: DemoUser[] = [
  {
    email: 'recruiter@demo.com',
    password: 'password123',
    role: 'recruiter',
    name: 'Alex Recruiter'
  },
  {
    email: 'bd@demo.com',
    password: 'password123',
    role: 'bd',
    name: 'Sarah Business Dev'
  },
  {
    email: 'pm@demo.com',
    password: 'password123',
    role: 'pm',
    name: 'Mike Project Manager'
  },
  {
    email: 'demo@demo.com',
    password: 'password123',
    role: 'demo_viewer',
    name: 'Demo Viewer'
  }
]

async function createDemoUsers() {
  console.log('🔐 Creating demo user accounts...\n')

  for (const user of demoUsers) {
    try {
      console.log(`Creating user: ${user.email} (${user.role})`)
      
      const { data, error } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          data: {
            role: user.role,
            name: user.name
          }
        }
      })

      if (error) {
        if (error.message.includes('already registered')) {
          console.log(`  ⚠️  User already exists: ${user.email}`)
        } else {
          console.error(`  ❌ Error creating ${user.email}:`, error.message)
        }
      } else {
        console.log(`  ✅ Successfully created: ${user.email}`)
      }
    } catch (err) {
      console.error(`  ❌ Unexpected error for ${user.email}:`, err)
    }
  }

  console.log('\n🎉 Demo user creation completed!')
  console.log('\nAvailable demo accounts:')
  console.log('================================')
  demoUsers.forEach(user => {
    console.log(`${user.role.toUpperCase().padEnd(12)} | ${user.email.padEnd(20)} | password123`)
  })
  console.log('================================')
  console.log('\nYou can now test different role-based access by logging in with these accounts.')
}

// Helper function to test login with demo accounts
async function testDemoLogin() {
  console.log('\n🧪 Testing demo account login...')
  
  const testUser = demoUsers[0] // Test with recruiter account
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password
    })

    if (error) {
      console.error('❌ Login test failed:', error.message)
    } else {
      console.log('✅ Login test successful!')
      console.log(`   User: ${data.user?.email}`)
      console.log(`   Role: ${data.user?.user_metadata?.role}`)
      
      // Sign out after test
      await supabase.auth.signOut()
      console.log('   Signed out successfully')
    }
  } catch (err) {
    console.error('❌ Login test error:', err)
  }
}

async function main() {
  await createDemoUsers()
  await testDemoLogin()
}

// Run the script
main().catch(console.error)

export { demoUsers }