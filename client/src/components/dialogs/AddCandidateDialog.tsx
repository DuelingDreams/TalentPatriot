import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AppModal } from '@/components/ui/AppModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useToast } from '@/shared/hooks/use-toast'
import { useCreateCandidate } from '@/features/candidates/hooks/useCandidateMutation'
import { useAuth } from '@/contexts/AuthContext'
import { uploadResume, formatFileSize } from '@/lib/storageUploads'
import { Plus, Loader2, Upload, X, FileText } from 'lucide-react'
import { nanoid } from 'nanoid'

const candidateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  location: z.string().optional(),
  linkedinUrl: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
  currentTitle: z.string().optional(),
  currentCompany: z.string().optional(),
  experience: z.string().optional(),
  salaryExpectation: z.string().optional(),
  source: z.string().optional(),
  tags: z.string().optional(),
  notes: z.string().optional(),
})

type CandidateFormData = z.infer<typeof candidateSchema>

interface AddCandidateDialogProps {
  children?: React.ReactNode
  onSuccess?: () => void
}

export function AddCandidateDialog({ children, onSuccess }: AddCandidateDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()
  const { currentOrgId } = useAuth()
  const createCandidate = useCreateCandidate()

  const form = useForm<CandidateFormData>({
    resolver: zodResolver(candidateSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      location: '',
      linkedinUrl: '',
      currentTitle: '',
      currentCompany: '',
      experience: '',
      salaryExpectation: '',
      source: '',
      tags: '',
      notes: '',
    },
  })

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: 'Only PDF, DOC, and DOCX files are allowed',
          variant: 'destructive',
        })
        return
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'File size must be less than 10MB',
          variant: 'destructive',
        })
        return
      }

      setSelectedFile(file)
    }
  }, [toast])

  const removeFile = useCallback(() => {
    setSelectedFile(null)
  }, [])

  const onSubmit = async (data: CandidateFormData) => {
    if (!currentOrgId) {
      toast({
        title: 'Error',
        description: 'Organization not found',
        variant: 'destructive',
      })
      return
    }

    setIsUploading(true)
    try {
      let resumeUrl: string | null = null
      
      // Generate candidate ID first to use for file upload
      const candidateId = nanoid()
      
      // Upload resume if selected
      if (selectedFile) {
        try {
          const uploadResult = await uploadResume(selectedFile, currentOrgId, candidateId)
          resumeUrl = uploadResult.url
        } catch (uploadError: any) {
          toast({
            title: 'Resume upload failed',
            description: uploadError.message,
            variant: 'destructive',
          })
          setIsUploading(false)
          return
        }
      }

      // Create candidate with basic fields
      const candidateData = {
        id: candidateId,
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        resumeUrl,
        status: 'active' as const,
      }

      await createCandidate.mutateAsync(candidateData)

      // TODO: Create candidate_notes entries for additional fields that don't fit in the candidates table
      // This would require implementing a candidate notes API endpoint
      
      toast({
        title: 'Success',
        description: 'Candidate added successfully',
      })

      form.reset()
      setSelectedFile(null)
      setOpen(false)
      onSuccess?.()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add candidate',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
    }
  }

  const isLoading = createCandidate.isPending || isUploading

  return (
    <>
      {/* Trigger Button */}
      {children ? (
        <div onClick={() => setOpen(true)}>{children}</div>
      ) : (
        <Button className="btn-primary" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Candidate
        </Button>
      )}

      {/* Modal */}
      <AppModal
        open={open}
        onClose={() => setOpen(false)}
        title="Add New Candidate"
        className="lg:max-w-4xl"
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="John Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john.smith@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 (555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="San Francisco, CA" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Professional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Professional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="currentTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Software Engineer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="currentCompany"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Company</FormLabel>
                      <FormControl>
                        <Input placeholder="TechCorp Inc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="experience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Years of Experience</FormLabel>
                      <FormControl>
                        <Input placeholder="5+ years" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="salaryExpectation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salary Expectation</FormLabel>
                      <FormControl>
                        <Input placeholder="$120,000 - $150,000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="linkedinUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn Profile</FormLabel>
                    <FormControl>
                      <Input placeholder="https://linkedin.com/in/johnsmith" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Resume Upload */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Resume</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                {selectedFile ? (
                  <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-8 h-8 text-blue-500" />
                      <div>
                        <p className="font-medium text-gray-900">{selectedFile.name}</p>
                        <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeFile}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">Upload candidate's resume</p>
                    <p className="text-sm text-gray-500 mb-4">PDF, DOC, or DOCX up to 10MB</p>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={handleFileChange}
                      className="hidden"
                      id="resume-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('resume-upload')?.click()}
                    >
                      Choose File
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Additional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source</FormLabel>
                      <FormControl>
                        <Input placeholder="LinkedIn, Referral, Website" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <Input placeholder="React, TypeScript, Senior" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Additional notes about the candidate..."
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isUploading ? 'Uploading...' : 'Add Candidate'}
              </Button>
            </div>
          </form>
        </Form>
      </AppModal>
    </>
  )
}