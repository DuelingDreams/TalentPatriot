import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Upload, 
  FileText, 
  X, 
  Download, 
  Eye, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface ResumeUploadProps {
  candidateId: string
  currentResumeUrl?: string
  onUploadComplete?: (fileUrl: string) => void
  className?: string
}

export function ResumeUpload({ 
  candidateId, 
  currentResumeUrl, 
  onUploadComplete, 
  className 
}: ResumeUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<string | null>(currentResumeUrl || null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const allowedFileTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  const maxFileSize = 10 * 1024 * 1024 // 10MB

  const validateFile = (file: File): string | null => {
    if (!allowedFileTypes.includes(file.type)) {
      return 'Only PDF, DOC, and DOCX files are allowed'
    }
    if (file.size > maxFileSize) {
      return 'File size must be less than 10MB'
    }
    return null
  }

  const uploadFile = async (file: File) => {
    setUploading(true)
    setError(null)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('resume', file)
      formData.append('candidateId', candidateId)

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const response = await fetch('/api/upload/resume', {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Upload failed')
      }

      const result = await response.json()
      
      setUploadedFile(result.fileUrl)
      onUploadComplete?.(result.fileUrl)
      
      toast({
        title: "Resume uploaded successfully",
        description: `${result.originalName} has been uploaded.`
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
      setUploadProgress(0)
    }
  }

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
      const filename = uploadedFile.split('/').pop()
      const response = await fetch(`/api/upload/resume/${filename}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setUploadedFile(null)
        onUploadComplete?.('')
        toast({
          title: "Resume removed",
          description: "The resume has been removed successfully."
        })
      }
    } catch (err) {
      toast({
        title: "Remove failed",
        description: "Failed to remove the resume file.",
        variant: "destructive"
      })
    }
  }

  const handleViewResume = () => {
    if (uploadedFile) {
      window.open(uploadedFile, '_blank')
    }
  }

  const handleDownloadResume = () => {
    if (uploadedFile) {
      const link = document.createElement('a')
      link.href = uploadedFile
      link.download = uploadedFile.split('/').pop() || 'resume'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <Card className={cn("", className)}>
      <CardContent className="pt-6">
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
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadResume}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFile}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Upload Area */}
        {!uploadedFile && (
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              dragActive ? "border-blue-400 bg-blue-50" : "border-gray-300",
              uploading && "opacity-50 pointer-events-none"
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="p-3 bg-gray-100 rounded-full">
                <Upload className="h-8 w-8 text-gray-600" />
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Upload Resume</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Drag and drop your resume here, or click to browse
                </p>
                
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  Choose File
                </Button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => handleFileSelect(e.target.files)}
                />
              </div>
              
              <div className="text-xs text-gray-500">
                Supported formats: PDF, DOC, DOCX (max 10MB)
              </div>
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Uploading resume...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Replace Resume Option */}
        {uploadedFile && !uploading && (
          <div className="mt-4 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              Replace Resume
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}