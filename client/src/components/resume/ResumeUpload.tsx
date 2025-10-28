import { useState, useCallback, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, X, FileText, CheckCircle, AlertCircle, Eye, Download, Loader2 } from 'lucide-react'
import { useToast } from '@/shared/hooks/use-toast'
import { useDemoFlag } from '@/lib/demoFlag'
import { useAuth } from '@/contexts/AuthContext'
import { apiRequest } from '@/lib/queryClient'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface ResumeUploadProps {
  candidateId: string
  orgId: string  // Required for secure file storage
  onUploadSuccess: (resumeUrl: string) => void
  currentResumeUrl?: string
  // Additional props for enhanced functionality
  candidateName?: string
  onResumeUploaded?: (url: string) => void
  className?: string
  // Support different upload modes
  uploadMode?: 'api' | 'supabase'
  // Allow customization of accepted file types
  acceptedFileTypes?: string[]
  maxFileSize?: number
  // UI mode: 'full' (card with drag/drop), 'compact' (button only)
  variant?: 'full' | 'compact'
}

export function ResumeUpload({
  candidateId,
  orgId,
  onUploadSuccess,
  currentResumeUrl,
  candidateName = 'Candidate',
  onResumeUploaded,
  className,
  uploadMode = 'api',
  acceptedFileTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  maxFileSize = 10 * 1024 * 1024, // 10MB
  variant = 'full'
}: ResumeUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<string | null>(currentResumeUrl || null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { isDemoUser } = useDemoFlag()
  const { session } = useAuth()

  const validateFile = (file: File): string | null => {
    if (!acceptedFileTypes.includes(file.type)) {
      const typeNames = acceptedFileTypes.map(type => {
        switch(type) {
          case 'application/pdf': return 'PDF'
          case 'application/msword': return 'DOC'
          case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': return 'DOCX'
          default: return type.split('/')[1]?.toUpperCase()
        }
      }).join(', ')
      return `Only ${typeNames} files are allowed`
    }
    if (file.size > maxFileSize) {
      const sizeMB = Math.round(maxFileSize / (1024 * 1024))
      return `File size must be less than ${sizeMB}MB`
    }
    return null
  }

  const uploadToSupabase = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop() || 'pdf'
    const fileName = `${candidateId}-${Date.now()}.${fileExt}`
    const filePath = fileName

    const { data, error } = await supabase.storage
      .from('resumes')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      if (error.message.includes('Bucket not found')) {
        throw new Error('Storage setup required. Please ask your administrator to set up the resume storage bucket.')
      }
      throw error
    }

    const { data: urlData } = supabase.storage
      .from('resumes')
      .getPublicUrl(filePath)

    if (!urlData.publicUrl) {
      throw new Error('Failed to get public URL')
    }

    // Update candidate record with resume URL
    const { error: updateError } = await supabase
      .from('candidates')
      .update({ resume_url: urlData.publicUrl })
      .eq('id', candidateId)

    if (updateError) {
      throw updateError
    }

    return urlData.publicUrl
  }

  const uploadToAPI = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('resume', file)
    formData.append('candidateId', candidateId)
    formData.append('orgId', orgId)  // Required for secure storage

    // Get authentication token from session
    const authToken = session?.access_token

    if (!authToken) {
      throw new Error('Authentication required. Please sign in again.')
    }

    const response = await fetch('/api/upload/resume', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      body: formData
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Upload failed')
    }

    const result = await response.json()
    
    // Store the STORAGE PATH (filename), not the signed URL
    // Signed URLs expire after 24 hours, but storage paths never expire
    // We'll generate fresh signed URLs on-demand when viewing/downloading
    const storagePath = result.filename
    
    await apiRequest(`/api/candidates/${candidateId}`, {
      method: 'PUT',
      body: JSON.stringify({ resumeUrl: storagePath }),
    })
    
    return storagePath
  }

  const uploadFile = async (file: File) => {
    setUploading(true)
    setError(null)
    setUploadProgress(0)

    // Demo protection: prevent server writes in demo mode
    if (isDemoUser) {
      toast({
        title: "Demo Mode",
        description: "Resume upload is disabled in demo mode. In the real app, candidates can upload PDF, DOC, and DOCX files.",
      })
      setUploading(false)
      setUploadProgress(0)
      return
    }

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      let fileUrl: string
      if (uploadMode === 'supabase') {
        fileUrl = await uploadToSupabase(file)
      } else {
        fileUrl = await uploadToAPI(file)
      }

      clearInterval(progressInterval)
      setUploadProgress(100)
      
      setUploadedFile(fileUrl)
      onUploadSuccess?.(fileUrl)
      onResumeUploaded?.(fileUrl)
      
      toast({
        title: "Resume uploaded successfully",
        description: `${file.name} has been uploaded for ${candidateName}.`
      })

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed'
      setError(errorMessage)
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setUploading(false)
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    await uploadFile(file)
  }, [candidateId, onUploadSuccess, toast, isDemoUser, uploadMode, acceptedFileTypes, maxFileSize])

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    const validationError = validateFile(file)
    
    if (validationError) {
      setError(validationError)
      return
    }

    uploadFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const handleRemoveFile = async () => {
    if (!uploadedFile) return

    try {
      if (uploadMode === 'supabase') {
        // For Supabase, we don't need to delete from storage, just update the record
        const { error } = await supabase
          .from('candidates')
          .update({ resume_url: null })
          .eq('id', candidateId)
          
        if (error) throw error
      } else {
        await apiRequest(`/api/candidates/${candidateId}`, {
          method: 'PUT',
          body: JSON.stringify({ resumeUrl: null }),
        })
      }

      setUploadedFile(null)
      onUploadSuccess?.('')
      onResumeUploaded?.('')
      toast({
        title: "Resume removed",
        description: "The resume has been removed successfully."
      })
    } catch (err) {
      toast({
        title: "Remove failed",
        description: "Failed to remove the resume file.",
        variant: "destructive"
      })
    }
  }

  const handleViewResume = async () => {
    if (!uploadedFile) return

    try {
      // Extract storage path from URL if needed
      let storagePath = uploadedFile
      
      // If it's a Supabase signed URL (contains /object/sign/), extract the path
      if (uploadedFile.includes('/object/sign/')) {
        const pathMatch = uploadedFile.match(/\/object\/sign\/resumes\/(.+?)\?/)
        if (pathMatch && pathMatch[1]) {
          storagePath = decodeURIComponent(pathMatch[1])
        }
      } else if (uploadedFile.startsWith('http')) {
        // Other HTTP URLs might be old signed URLs - try to extract path from end
        const urlParts = uploadedFile.split('/resumes/')
        if (urlParts[1]) {
          storagePath = urlParts[1].split('?')[0]
        }
      }

      // Always generate a fresh signed URL (they expire after 24 hours)
      const response = await fetch('/api/upload/resume/signed-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ storagePath })
      })

      if (!response.ok) {
        throw new Error('Failed to generate viewing URL')
      }

      const result = await response.json()
      window.open(result.signedUrl, '_blank')
    } catch (err) {
      toast({
        title: "View failed",
        description: err instanceof Error ? err.message : "Failed to open resume",
        variant: "destructive"
      })
    }
  }

  const handleDownloadResume = async () => {
    if (!uploadedFile) return

    try {
      // Extract storage path from URL if needed
      let storagePath = uploadedFile
      
      // If it's a Supabase signed URL (contains /object/sign/), extract the path
      if (uploadedFile.includes('/object/sign/')) {
        const pathMatch = uploadedFile.match(/\/object\/sign\/resumes\/(.+?)\?/)
        if (pathMatch && pathMatch[1]) {
          storagePath = decodeURIComponent(pathMatch[1])
        }
      } else if (uploadedFile.startsWith('http')) {
        // Other HTTP URLs might be old signed URLs - try to extract path from end
        const urlParts = uploadedFile.split('/resumes/')
        if (urlParts[1]) {
          storagePath = urlParts[1].split('?')[0]
        }
      }

      // Always generate a fresh signed URL (they expire after 24 hours)
      const response = await fetch('/api/upload/resume/signed-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ storagePath })
      })

      if (!response.ok) {
        throw new Error('Failed to generate download URL')
      }

      const result = await response.json()
      
      const link = document.createElement('a')
      link.href = result.signedUrl
      link.download = storagePath.split('/').pop() || `${candidateName}_Resume`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      toast({
        title: "Download failed",
        description: err instanceof Error ? err.message : "Failed to download resume",
        variant: "destructive"
      })
    }
  }

  const { getRootProps, getInputProps, isDragActive: dropzoneActive } = useDropzone({ 
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize: maxFileSize,
    multiple: false,
    disabled: uploading
  })

  // Compact variant for inline use
  if (variant === 'compact') {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center gap-2">
          {uploadedFile ? (
            <Button size="sm" variant="outline" onClick={handleViewResume} className="text-xs">
              <Eye className="w-3 h-3 mr-1" />
              View Resume
            </Button>
          ) : (
            <span className="text-xs text-slate-500">No resume uploaded</span>
          )}
        </div>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFileTypes.join(',')}
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="text-xs"
            data-testid="button-upload-resume"
          >
            {uploading ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-3 h-3 mr-1" />
                {uploadedFile ? 'Replace Resume' : 'Upload Resume'}
              </>
            )}
          </Button>
        </div>

        {uploading && (
          <div className="space-y-2">
            <Progress value={uploadProgress} className="h-2" />
            <p className="text-xs text-slate-600">Uploading resume...</p>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}
      </div>
    )
  }

  // Full variant with card and drag/drop
  return (
    <Card className={cn("", className)}>
      <CardContent className="pt-6">
        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Current Resume Display */}
        {uploadedFile && !uploading && (
          <div className="mb-4 p-4 border rounded-lg bg-green-50 border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-green-800">Resume uploaded</p>
                  <p className="text-sm text-green-600">
                    {uploadedFile.split('/').pop() || 'resume.pdf'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewResume}
                  data-testid="button-view-resume"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadResume}
                  data-testid="button-download-resume"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFile}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  data-testid="button-remove-resume"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
            (dropzoneActive || dragActive) ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400",
            uploading && "opacity-50 pointer-events-none cursor-not-allowed"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          data-testid="dropzone-resume-upload"
        >
          <input {...getInputProps()} />
          
          {uploading ? (
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Upload className="w-6 w-6 text-blue-600 animate-pulse" />
              </div>
              <div>
                <p className="font-medium">Uploading resume...</p>
                <Progress value={uploadProgress} className="mt-2 max-w-xs mx-auto" />
                <p className="text-sm text-gray-500 mt-1">{uploadProgress}% complete</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <Upload className="w-6 h-6 text-gray-600" />
              </div>
              
              <div>
                <p className="font-medium">
                  {dropzoneActive || dragActive ? 'Drop the resume here' : uploadedFile ? 'Replace Resume' : 'Upload candidate resume'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Drag and drop your resume here, or click to browse
                </p>
                
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  variant="outline"
                  className="mt-4"
                  data-testid="button-choose-file"
                >
                  Choose File
                </Button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept={acceptedFileTypes.join(',')}
                  onChange={(e) => handleFileSelect(e.target.files)}
                />
              </div>
              
              <div className="text-xs text-gray-500">
                Supported formats: {acceptedFileTypes.map(type => {
                  switch(type) {
                    case 'application/pdf': return 'PDF'
                    case 'application/msword': return 'DOC'
                    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': return 'DOCX'
                    default: return type.split('/')[1]?.toUpperCase()
                  }
                }).join(', ')} (max {Math.round(maxFileSize / (1024 * 1024))}MB)
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Backward compatibility exports
export default ResumeUpload