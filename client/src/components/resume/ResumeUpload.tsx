import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, X, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { apiRequest } from '@/lib/queryClient'

interface ResumeUploadProps {
  candidateId: string
  onUploadSuccess: (resumeUrl: string) => void
  currentResumeUrl?: string
}

export function ResumeUpload({ candidateId, onUploadSuccess, currentResumeUrl }: ResumeUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      setError('Only PDF, DOC, and DOCX files are allowed')
      return
    }

    setError(null)
    setUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('resume', file)
      formData.append('candidateId', candidateId)

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 100)

      const response = await fetch('/api/upload/resume', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Upload failed')
      }

      const result = await response.json()
      
      // Update candidate record with new resume URL
      await apiRequest(`/api/candidates/${candidateId}`, {
        method: 'PUT',
        body: JSON.stringify({ resumeUrl: result.fileUrl }),
      })

      onUploadSuccess(result.fileUrl)
      
      toast({
        title: "Resume uploaded successfully",
        description: `${file.name} has been uploaded and attached to the candidate profile.`,
      })
      
      setTimeout(() => {
        setUploadProgress(0)
        setUploading(false)
      }, 1000)

    } catch (error) {
      console.error('Upload failed:', error)
      setError(error instanceof Error ? error.message : 'Upload failed')
      setUploading(false)
      setUploadProgress(0)
      
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : 'Failed to upload resume',
        variant: "destructive",
      })
    }
  }, [candidateId, onUploadSuccess, toast])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
    disabled: uploading
  })

  const removeResume = async () => {
    try {
      await apiRequest(`/api/candidates/${candidateId}`, {
        method: 'PUT',
        body: JSON.stringify({ resumeUrl: null }),
      })
      
      onUploadSuccess('')
      
      toast({
        title: "Resume removed",
        description: "The resume has been removed from the candidate profile.",
      })
    } catch (error) {
      toast({
        title: "Failed to remove resume",
        description: "There was an error removing the resume.",
        variant: "destructive",
      })
    }
  }

  if (currentResumeUrl && !uploading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Resume uploaded</p>
                <p className="text-sm text-gray-500">PDF document available for viewing</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => window.open(currentResumeUrl, '_blank')}>
                View Resume
              </Button>
              <Button variant="outline" size="sm" onClick={removeResume}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        {error && (
          <Alert className="mb-4" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            ${uploading ? 'cursor-not-allowed opacity-50' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          {uploading ? (
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Upload className="w-6 h-6 text-blue-600 animate-pulse" />
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
                  {isDragActive ? 'Drop the resume here' : 'Upload candidate resume'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Drag and drop a PDF, DOC, or DOCX file, or click to select
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Maximum file size: 10MB
                </p>
              </div>
              <Button variant="outline" type="button">
                Choose File
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}