import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'
import { Plus, Loader2, Upload, Link, FileText } from 'lucide-react'

// Candidate form schema
const candidateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  location: z.string().optional(),
  linkedin_url: z.string().optional(),
  resume_url: z.string().optional(),
  skills: z.string().optional(),
  experience_years: z.string().optional(),
  notes: z.string().optional()
})

type CandidateFormData = z.infer<typeof candidateSchema>

interface AddCandidateDialogProps {
  triggerButton?: React.ReactNode
}

export function AddCandidateDialog({ triggerButton }: AddCandidateDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [resumeTab, setResumeTab] = useState<'url' | 'upload'>('upload')
  const { toast } = useToast()
  const { userRole, currentOrgId } = useAuth()
  const queryClient = useQueryClient()

  const form = useForm<CandidateFormData>({
    resolver: zodResolver(candidateSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      location: '',
      linkedin_url: '',
      resume_url: '',
      skills: '',
      experience_years: '',
      notes: ''
    }
  })

  const createCandidateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/candidates', {
        method: 'POST',
        body: JSON.stringify(data)
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/candidates'] })
      queryClient.invalidateQueries({ queryKey: ['/api/job-candidates'] })
    }
  })

  // File upload handler
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF or Word document (.pdf, .doc, .docx)",
          variant: "destructive",
        })
        return
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload a file smaller than 5MB",
          variant: "destructive",
        })
        return
      }

      setSelectedFile(file)
    }
  }

  // Upload file to server
  const uploadResumeFile = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('resume', file)
    formData.append('orgId', currentOrgId || '')

    const response = await fetch('/api/upload/resume', {
      method: 'POST',
      body: formData,
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error('File upload failed')
    }

    const result = await response.json()
    return result.url
  }

  const onSubmit = async (data: CandidateFormData) => {
    if (userRole === 'demo_viewer') {
      toast({
        title: "Demo Mode",
        description: "Adding candidates is disabled in demo mode.",
        variant: "destructive",
      })
      return
    }

    if (!currentOrgId) {
      toast({
        title: "Organization Required",
        description: "Please ensure you have an organization set up to add candidates.",
        variant: "destructive",
      })
      return
    }
    
    try {
      let resumeUrl = data.resume_url || null

      // Handle file upload if a file is selected
      if (selectedFile && resumeTab === 'upload') {
        setUploadingFile(true)
        try {
          resumeUrl = await uploadResumeFile(selectedFile)
        } catch (uploadError) {
          toast({
            title: "Upload Failed",
            description: "Failed to upload resume file. Please try again.",
            variant: "destructive",
          })
          setUploadingFile(false)
          return
        }
        setUploadingFile(false)
      }

      // Convert skills string to array
      const skillsArray = data.skills 
        ? data.skills.split(',').map(skill => skill.trim()).filter(Boolean)
        : []

      const candidateData = {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        location: data.location || null,
        linkedinUrl: data.linkedin_url || null,
        resumeUrl: resumeUrl,
        skills: skillsArray,
        experienceYears: data.experience_years ? parseInt(data.experience_years) : null,
        notes: data.notes || null,
        orgId: currentOrgId
      }
      
      await createCandidateMutation.mutateAsync(candidateData)
      toast({
        title: "Candidate Added",
        description: `${data.name} has been added to your candidate database.`,
      })
      setIsOpen(false)
      form.reset()
      setSelectedFile(null)
    } catch (error) {
      console.error('Candidate creation error:', error)
      toast({
        title: "Error",
        description: "Failed to add candidate. Please try again.",
        variant: "destructive",
      })
    }
  }

  const defaultTrigger = (
    <Button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
      <Plus className="w-4 h-4 mr-2" />
      Add Candidate
    </Button>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {triggerButton || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Add New Candidate</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. John Smith" {...field} />
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
                        <Input type="email" placeholder="john@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="(555) 123-4567" {...field} />
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
                        <Input placeholder="e.g. San Francisco, CA" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="linkedin_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://linkedin.com/in/..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Resume Upload/URL Section */}
              <div className="space-y-3">
                <FormLabel>Resume</FormLabel>
                <Tabs value={resumeTab} onValueChange={(value) => setResumeTab(value as 'url' | 'upload')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload" className="flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Upload File
                    </TabsTrigger>
                    <TabsTrigger value="url" className="flex items-center gap-2">
                      <Link className="w-4 h-4" />
                      Provide URL
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="upload" className="space-y-3">
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-slate-400 transition-colors">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="resume-upload"
                      />
                      <label htmlFor="resume-upload" className="cursor-pointer">
                        <div className="space-y-2">
                          <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                          {selectedFile ? (
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-slate-700">{selectedFile.name}</p>
                              <p className="text-xs text-slate-500">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedFile(null)}
                              >
                                Remove
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <p className="text-sm text-slate-600">Click to upload resume</p>
                              <p className="text-xs text-slate-500">PDF, DOC, DOCX (max 5MB)</p>
                            </div>
                          )}
                        </div>
                      </label>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="url">
                    <FormField
                      control={form.control}
                      name="resume_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="https://example.com/resume.pdf" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                </Tabs>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="skills"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Skills</FormLabel>
                      <FormControl>
                        <Input placeholder="React, TypeScript, Node.js" {...field} />
                      </FormControl>
                      <p className="text-xs text-slate-500">Separate multiple skills with commas</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="experience_years"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Years of Experience</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="5" {...field} />
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
                    <FormLabel>Additional Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any additional information about the candidate..."
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createCandidateMutation.isPending || uploadingFile}
                >
                  {uploadingFile ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading Resume...
                    </>
                  ) : createCandidateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding Candidate...
                    </>
                  ) : (
                    'Add Candidate'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}