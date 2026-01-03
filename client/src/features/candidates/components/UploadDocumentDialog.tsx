import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/shared/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { Upload, FileText, X } from 'lucide-react'

interface UploadDocumentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  candidateId: string
  candidateName?: string
  onSuccess?: () => void
}

export function UploadDocumentDialog({
  open,
  onOpenChange,
  candidateId,
  candidateName,
  onSuccess,
}: UploadDocumentDialogProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { currentOrgId, user } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [documentName, setDocumentName] = useState('')

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0]
      setFile(selectedFile)
      if (!documentName) {
        setDocumentName(selectedFile.name.replace(/\.[^/.]+$/, ''))
      }
    }
  }, [documentName])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  })

  const uploadDocument = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('No file selected')
      
      const formData = new FormData()
      formData.append('file', file)
      formData.append('name', documentName || file.name)
      
      const response = await fetch(`/api/candidates/${candidateId}/documents`, {
        method: 'POST',
        headers: {
          'x-org-id': currentOrgId || '',
        },
        body: formData,
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }
      
      return response.json()
    },
    onSuccess: () => {
      toast({
        title: 'Document Uploaded',
        description: 'The document has been added to the candidate profile.',
      })
      queryClient.invalidateQueries({ queryKey: ['/api/candidates', candidateId, 'documents'] })
      setFile(null)
      setDocumentName('')
      onOpenChange(false)
      onSuccess?.()
    },
    onError: (error: any) => {
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload document',
        variant: 'destructive',
      })
    },
  })

  const handleUpload = () => {
    if (!file) {
      toast({
        title: 'No File Selected',
        description: 'Please select a document to upload.',
        variant: 'destructive',
      })
      return
    }
    uploadDocument.mutate()
  }

  const removeFile = () => {
    setFile(null)
    setDocumentName('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" aria-describedby="upload-document-description">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <p id="upload-document-description" className="text-sm text-gray-500">
            Add a document to {candidateName || 'this candidate'}'s profile.
          </p>
        </DialogHeader>
        
        <div className="space-y-4">
          {!file ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'
              }`}
              data-testid="dropzone"
            >
              <input {...getInputProps()} data-testid="file-input" />
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-sm text-gray-600 mb-1">
                {isDragActive ? 'Drop the file here...' : 'Drag & drop a document here'}
              </p>
              <p className="text-xs text-gray-500">or click to select a file</p>
              <p className="text-xs text-gray-400 mt-2">PDF, DOC, DOCX, or TXT (max 10MB)</p>
            </div>
          ) : (
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="font-medium text-sm">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={removeFile}
                  className="h-8 w-8"
                  data-testid="remove-file"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="documentName">Document Name</Label>
            <Input
              id="documentName"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              placeholder="Enter a name for this document"
              data-testid="input-document-name"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={!file || uploadDocument.isPending}
            data-testid="submit-upload"
          >
            {uploadDocument.isPending ? 'Uploading...' : 'Upload Document'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
