import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { Upload, FileText, Loader2, Eye, Download, X } from 'lucide-react'

interface ResumeUploadProps {
  candidateId: string
  candidateName: string
  currentResumeUrl?: string | null
  onResumeUploaded: (url: string) => void
}

export function ResumeUpload({ candidateId, candidateName, currentResumeUrl, onResumeUploaded }: ResumeUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF file only.",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive",
      })
      return
    }

    await uploadResume(file)
  }

  const uploadResume = async (file: File) => {
    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Create unique filename
      const fileExt = 'pdf'
      const fileName = `${candidateId}-${Date.now()}.${fileExt}`
      const filePath = fileName

      // Upload file to Supabase storage
      const { data, error } = await supabase.storage
        .from('resumes')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        // If bucket doesn't exist, try to create it
        if (error.message.includes('Bucket not found')) {
          toast({
            title: "Storage Setup Required",
            description: "Please ask your administrator to set up the resume storage bucket.",
            variant: "destructive",
          })
          return
        }
        throw error
      }

      // Get public URL
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

      onResumeUploaded(urlData.publicUrl)
      
      toast({
        title: "Resume Uploaded",
        description: "Resume has been uploaded successfully.",
      })

      setUploadProgress(100)
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload resume. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const viewResume = () => {
    if (currentResumeUrl) {
      window.open(currentResumeUrl, '_blank')
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {currentResumeUrl ? (
          <Button size="sm" variant="outline" onClick={viewResume} className="text-xs">
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
          accept=".pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="text-xs"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-3 h-3 mr-1" />
              {currentResumeUrl ? 'Replace Resume' : 'Upload Resume'}
            </>
          )}
        </Button>
      </div>

      {isUploading && (
        <div className="space-y-2">
          <Progress value={uploadProgress} className="h-2" />
          <p className="text-xs text-slate-600">Uploading resume...</p>
        </div>
      )}
    </div>
  )
}