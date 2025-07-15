// Test file to verify Supabase connection
import { supabase } from './supabase'

export async function testSupabaseConnection() {
  try {
    // Test basic connectivity with a simple select
    const { data, error } = await supabase
      .from('clients')
      .select('id')
      .limit(1)

    if (error) {
      console.error('Supabase connection error:', error)
      
      // Check if it's a table not found error
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        return { 
          success: false, 
          error: 'Database tables not found. Please run the SQL schema first.',
          needsSchema: true
        }
      }
      
      return { success: false, error: error.message }
    }

    console.log('✅ Supabase connection successful')
    return { success: true, data, tablesExist: true }
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