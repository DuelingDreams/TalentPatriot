import { supabase } from '@/lib/supabase'

export interface UploadResult {
  url: string
  path: string
  fileName: string
}

export async function uploadResume(
  file: File, 
  orgId: string, 
  candidateId: string
): Promise<UploadResult> {
  // Validate file type
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Only PDF, DOC, and DOCX files are allowed')
  }

  // Validate file size (10MB max)
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    throw new Error('File size must be less than 10MB')
  }

  // Generate file path
  const timestamp = Date.now()
  const fileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const filePath = `${orgId}/candidates/${candidateId}/${timestamp}-${fileName}`

  try {
    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('resumes')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      if (error.message.includes('Bucket not found')) {
        console.error('Resume storage bucket not found. Please create a "resumes" bucket in Supabase Storage.')
        throw new Error('Resume storage is not configured. Please contact support.')
      }
      throw new Error(`Failed to upload resume: ${error.message}`)
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('resumes')
      .getPublicUrl(filePath)

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get resume URL')
    }

    return {
      url: urlData.publicUrl,
      path: filePath,
      fileName: file.name
    }
  } catch (error) {
    console.error('Resume upload error:', error)
    throw error
  }
}

export async function deleteResume(filePath: string): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from('resumes')
      .remove([filePath])

    if (error) {
      console.error('Failed to delete resume:', error)
      throw new Error(`Failed to delete resume: ${error.message}`)
    }
  } catch (error) {
    console.error('Resume deletion error:', error)
    throw error
  }
}

export function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || ''
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}