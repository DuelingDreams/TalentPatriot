// Test file to verify Supabase connection
import { supabase } from './supabase'

export async function testSupabaseConnection() {
  try {
    // Test basic connectivity
    const { data, error } = await supabase
      .from('clients')
      .select('count(*)')
      .limit(1)

    if (error) {
      console.error('Supabase connection error:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Supabase connection successful')
    return { success: true, data }
  } catch (error) {
    console.error('Supabase connection failed:', error)
    return { success: false, error: String(error) }
  }
}

// Test authentication status
export async function getAuthUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    console.error('Auth error:', error)
    return null
  }
  
  return user
}