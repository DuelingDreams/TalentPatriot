import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceRoleKey ? '✓' : '✗')
  process.exit(1)
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupDemoUser() {
  console.log('🔧 Setting up demo user in Supabase Auth...')
  
  const demoUser = {
    email: 'demo@yourapp.com',
    password: 'Demo1234!',
    user_metadata: {
      role: 'demo_viewer',
      name: 'Demo User'
    },
    email_confirm: true // Skip email confirmation
  }

  try {
    // Check if demo user already exists
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      console.error('❌ Error checking existing users:', listError.message)
      return
    }

    const existingDemoUser = existingUsers.users.find(user => user.email === demoUser.email)
    
    if (existingDemoUser) {
      console.log('👤 Demo user already exists:', existingDemoUser.email)
      console.log('   UUID:', existingDemoUser.id)
      console.log('   Role:', existingDemoUser.user_metadata?.role)
      console.log('   Email confirmed:', existingDemoUser.email_confirmed_at ? 'Yes' : 'No')
      
      // Update the user metadata if needed
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingDemoUser.id,
        {
          user_metadata: demoUser.user_metadata,
          email_confirm: true
        }
      )
      
      if (updateError) {
        console.error('❌ Error updating demo user:', updateError.message)
        return
      }
      
      console.log('✅ Demo user metadata updated successfully')
    } else {
      // Create new demo user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: demoUser.email,
        password: demoUser.password,
        user_metadata: demoUser.user_metadata,
        email_confirm: true
      })

      if (createError) {
        console.error('❌ Error creating demo user:', createError.message)
        return
      }

      console.log('✅ Demo user created successfully:')
      console.log('   Email:', newUser.user.email)
      console.log('   UUID:', newUser.user.id)
      console.log('   Role:', newUser.user.user_metadata?.role)
      console.log('   Email confirmed:', newUser.user.email_confirmed_at ? 'Yes' : 'No')
    }

    // Test login to verify the user works
    console.log('\n🧪 Testing demo user login...')
    
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: demoUser.email,
      password: demoUser.password
    })

    if (loginError) {
      console.error('❌ Demo user login test failed:', loginError.message)
      return
    }

    console.log('✅ Demo user login test successful')
    console.log('   Session created for:', loginData.user.email)
    console.log('   Role metadata:', loginData.user.user_metadata?.role)

    // Sign out after test
    await supabase.auth.signOut()

    console.log('\n🎉 Demo user setup complete!')
    console.log('\nDemo user credentials:')
    console.log('📧 Email: demo@yourapp.com')
    console.log('🔐 Password: Demo1234!')
    console.log('👤 Role: demo_viewer')
    console.log('\n⚠️  Security Notes:')
    console.log('   - This user has read-only access via RLS policies')
    console.log('   - Password is intentionally simple for demo purposes')
    console.log('   - Consider implementing rate limiting for the demo login')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the setup
setupDemoUser()