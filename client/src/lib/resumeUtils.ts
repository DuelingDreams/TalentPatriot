/**
 * Resume utilities for handling storage paths and signed URLs
 */

/**
 * Generate a signed URL from a storage path
 * @param storagePath - The resume storage path (e.g., "orgId/jobId/resume_123.pdf")
 * @returns Signed URL valid for 24 hours
 */
export async function getResumeSignedUrl(storagePath: string): Promise<string> {
  if (!storagePath) {
    throw new Error('Storage path is required')
  }

  // If it's already a full URL (legacy data), return it
  if (storagePath.startsWith('http://') || storagePath.startsWith('https://')) {
    return storagePath
  }

  try {
    const response = await fetch('/api/upload/resume/signed-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ storagePath }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to generate signed URL')
    }

    const data = await response.json()
    return data.signedUrl
  } catch (error) {
    console.error('Error generating signed URL:', error)
    throw error
  }
}

/**
 * Check if a resume path is a storage path (vs a full URL)
 */
export function isStoragePath(path: string | null | undefined): boolean {
  if (!path) return false
  return !path.startsWith('http://') && !path.startsWith('https://')
}

/**
 * Open resume in new tab - handles both storage paths and legacy URLs
 */
export async function openResumeInNewTab(resumePathOrUrl: string): Promise<void> {
  if (!resumePathOrUrl) {
    throw new Error('No resume path or URL provided')
  }

  try {
    let url: string

    if (isStoragePath(resumePathOrUrl)) {
      // Generate signed URL from storage path
      url = await getResumeSignedUrl(resumePathOrUrl)
    } else {
      // Use URL directly (legacy data)
      url = resumePathOrUrl
    }

    window.open(url, '_blank')
  } catch (error) {
    console.error('Error opening resume:', error)
    throw error
  }
}
