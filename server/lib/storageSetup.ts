import { supabase } from './supabase.js';

/**
 * Setup function to ensure the 'resumes' bucket exists in Supabase Storage
 * This should be called on server startup to ensure proper configuration
 */
export async function ensureResumesBucket(): Promise<void> {
  try {
    // Check if the 'resumes' bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Failed to list storage buckets:', listError);
      return;
    }
    
    const resumesBucket = buckets?.find((bucket: any) => bucket.name === 'resumes');
    
    if (!resumesBucket) {
      console.log('Creating "resumes" storage bucket...');
      
      // Create PRIVATE bucket - access controlled through RLS policies
      const { data, error } = await supabase.storage.createBucket('resumes', {
        public: false,  // SECURITY: Private bucket - authenticated access only
        allowedMimeTypes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ],
        fileSizeLimit: 10485760 // 10MB limit
      });
      
      if (error) {
        console.error('Failed to create resumes bucket:', error);
      } else {
        console.log('✅ Resumes bucket created successfully');
      }
    } else {
      console.log('✅ Resumes bucket already exists');
    }
  } catch (error) {
    console.error('Error setting up storage bucket:', error);
  }
}

/**
 * Test function to verify Supabase Storage connectivity
 */
export async function testStorageConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Storage connection test failed:', error);
      return false;
    }
    
    console.log(`✅ Storage connection successful. Found ${data?.length || 0} buckets.`);
    return true;
  } catch (error) {
    console.error('Storage connection test error:', error);
    return false;
  }
}