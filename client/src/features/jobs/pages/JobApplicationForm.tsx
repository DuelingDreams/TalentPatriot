import { useState, useEffect } from 'react'
import { useParams, useLocation } from 'wouter'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/shared/hooks/use-toast'
import { usePublicJobBySlug } from '@/features/jobs/hooks/usePublicJobBySlug'
import { useDemoFlag } from '@/lib/demoFlag'
import { demoAdapter } from '@/lib/dataAdapter'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Send, Loader2, MapPin, Clock, DollarSign, Building2, Briefcase, Upload, CheckCircle2, AlertCircle, X, RefreshCw } from 'lucide-react'
import type { Job } from '@shared/schema'
import { useJobApplication } from '@/features/jobs/hooks/useJobMutation'

interface ApplicationFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  coverLetter: string
  resume: File | null
}

interface FileUploadState {
  isUploading: boolean
  progress: number
  uploadedUrl: string | null
  uploadError: string | null
  retryCount: number
}

// File validation constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx'];
const MAX_RETRIES = 3;
const RETRY_DELAYS = [500, 1500, 3000]; // exponential backoff in milliseconds

export default function JobApplicationForm() {
  const { slug, orgSlug } = useParams<{ slug: string; orgSlug?: string }>()
  const [, setLocation] = useLocation()
  // isSubmitting is now handled by jobApplication.isPending
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState<ApplicationFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    coverLetter: '',
    resume: null
  })
  
  const [uploadState, setUploadState] = useState<FileUploadState>({
    isUploading: false,
    progress: 0,
    uploadedUrl: null,
    uploadError: null,
    retryCount: 0
  })
  
  const { toast } = useToast()
  const jobApplication = useJobApplication()

  // Use shared hook for consistent data fetching
  const { job, isLoading: loading, error, notFound } = usePublicJobBySlug(slug, { orgSlug })

  // Validate file client-side
  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`;
    }
    
    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      if (!ALLOWED_EXTENSIONS.includes(extension)) {
        return 'File must be PDF, DOC, or DOCX format';
      }
    }
    
    return null;
  }

  // Generate unique filename for Supabase Storage
  const generateFileName = (originalName: string): string => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalName.substring(originalName.lastIndexOf('.'));
    return `resume_${timestamp}_${randomString}${extension}`;
  }

  // Upload file using backend API with retry logic
  const uploadFileWithRetry = async (file: File, retryCount = 0): Promise<string> => {
    try {
      setUploadState(prev => ({
        ...prev,
        isUploading: true,
        progress: 0,
        uploadError: null,
        retryCount
      }));

      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('candidateId', 'temp-job-application'); // Temporary ID for job applications

      // Start progress simulation
      const progressInterval = setInterval(() => {
        setUploadState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90) // Max 90% until completion
        }));
      }, 200);

      // Upload to backend API
      const response = await fetch('/api/upload/resume', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Upload failed with status ${response.status}`);
      }

      const result = await response.json();
      
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        progress: 100,
        uploadedUrl: result.fileUrl,
        uploadError: null
      }));

      return result.fileUrl;

    } catch (error) {
      console.error('Upload error:', error);
      
      if (retryCount < MAX_RETRIES - 1) {
        // Retry with exponential backoff
        const delay = RETRY_DELAYS[retryCount];
        
        toast({
          title: "Upload Failed",
          description: `Retrying upload in ${delay / 1000} seconds... (${retryCount + 1}/${MAX_RETRIES})`,
          variant: "destructive"
        });

        await new Promise(resolve => setTimeout(resolve, delay));
        return uploadFileWithRetry(file, retryCount + 1);
      } else {
        // Final failure
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        setUploadState(prev => ({
          ...prev,
          isUploading: false,
          uploadError: errorMessage,
          retryCount: MAX_RETRIES
        }));
        
        throw new Error(errorMessage);
      }
    }
  }

  const handleInputChange = (field: keyof ApplicationFormData, value: string | File | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Handle file selection with validation
  const handleFileSelect = (file: File | null) => {
    if (!file) {
      handleInputChange('resume', null);
      setUploadState({
        isUploading: false,
        progress: 0,
        uploadedUrl: null,
        uploadError: null,
        retryCount: 0
      });
      return;
    }

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      toast({
        title: "Invalid File",
        description: validationError,
        variant: "destructive"
      });
      return;
    }

    // Set file and start upload
    handleInputChange('resume', file);
    uploadFileWithRetry(file).catch(error => {
      console.error('Upload failed after all retries:', error);
    });
  }

  // Clear uploaded file
  const clearUploadedFile = () => {
    handleInputChange('resume', null);
    setUploadState({
      isUploading: false,
      progress: 0,
      uploadedUrl: null,
      uploadError: null,
      retryCount: 0
    });
  }

  // Retry failed upload
  const retryUpload = () => {
    if (formData.resume) {
      uploadFileWithRetry(formData.resume).catch(error => {
        console.error('Retry upload failed:', error);
      });
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!job) return

    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in your first name, last name, and email address.",
        variant: "destructive"
      })
      return
    }

    // Check if resume is still uploading or application is in progress
    if (uploadState.isUploading || jobApplication.isPending) {
      toast({
        title: uploadState.isUploading ? "Upload in Progress" : "Application in Progress",
        description: uploadState.isUploading ? "Please wait for the resume upload to complete before submitting." : "Your application is being submitted.",
        variant: "destructive"
      })
      return
    }

    // Check for upload errors
    if (formData.resume && uploadState.uploadError) {
      toast({
        title: "Upload Error",
        description: "Please fix the resume upload error before submitting or remove the file.",
        variant: "destructive"
      })
      return
    }

    try {
      // Prepare application data with resume URL (using firstName/lastName)
      const candidateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone || undefined,
        resumeUrl: uploadState.uploadedUrl || undefined,
      }

      await jobApplication.mutateAsync({
        jobId: job.id,
        candidateData
      })
      
      setSubmitted(true)
      // Success message is handled by the useJobApplication hook
    } catch (error) {
      console.error('Error submitting application:', error)
      // Error message is handled by the useJobApplication hook
    }
  }

  // Error state
  if (error && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {notFound ? 'Job Not Found' : 'Unable to Load Job'}
          </h1>
          <p className="text-gray-600 mb-4">
            {notFound 
              ? "This job posting may have been removed or expired."
              : "We're having trouble loading this job. Please try again later."
            }
          </p>
          <Button onClick={() => {
            const careersPath = orgSlug ? `/org/${orgSlug}/careers` : '/careers';
            setLocation(careersPath);
          }}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Careers
          </Button>
        </div>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading job details...
        </div>
      </div>
    )
  }

  // Should not render if job is null but not loading
  if (!job) {
    return null;
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Application Submitted!
            </h2>
            <p className="text-gray-600 mb-6">
              Thank you for your interest. We'll review your application and be in touch soon.
            </p>
            <Button 
              onClick={() => {
                const careersPath = orgSlug ? `/org/${orgSlug}/careers` : '/careers';
                setLocation(careersPath);
              }}
              variant="outline"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Careers
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Button 
                variant="ghost" 
                onClick={() => {
                  const careersPath = orgSlug ? `/org/${orgSlug}/careers` : '/careers';
                  setLocation(careersPath);
                }}
                className="mb-2"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Careers
              </Button>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    {job.department && (
                      <div className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        {job.department}
                      </div>
                    )}
                    {job.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {job.location}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Posted {new Date(job.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-gray-600">Submit your application below</p>
            </div>
          </div>
        </div>
      </header>

      {/* Application Form */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Apply for this Position</CardTitle>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              {job.jobType && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span className="capitalize">{job.jobType.replace('-', ' ')}</span>
                </div>
              )}
              {job.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{job.location}</span>
                </div>
              )}
              {job.department && (
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  <span>{job.department}</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    required
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    required
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="(555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="coverLetter">Cover Letter (Optional)</Label>
                <textarea
                  id="coverLetter"
                  name="coverLetter"
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-md resize-vertical"
                  placeholder="Tell us why you're interested in this position and what makes you a great fit..."
                  value={formData.coverLetter}
                  onChange={(e) => handleInputChange('coverLetter', e.target.value)}
                  maxLength={2000}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional. Maximum 2000 characters.
                </p>
              </div>

              <div>
                <Label htmlFor="resume">Resume Upload (Optional)</Label>
                
                {/* File upload interface */}
                {!uploadState.uploadedUrl && !uploadState.isUploading && !uploadState.uploadError && (
                  <div className="mt-2">
                    <Input
                      id="resume"
                      name="resume"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null
                        handleFileSelect(file)
                      }}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Optional. Accepted formats: PDF, DOC, DOCX (max 10MB)
                    </p>
                  </div>
                )}

                {/* Upload progress */}
                {uploadState.isUploading && (
                  <div className="mt-2 p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-2 mb-2">
                      <Upload className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium">Uploading...</span>
                      <span className="text-xs text-gray-500">
                        {uploadState.retryCount > 0 && `(Retry ${uploadState.retryCount}/${MAX_RETRIES})`}
                      </span>
                    </div>
                    <Progress value={uploadState.progress} className="mb-2" />
                    <p className="text-xs text-gray-600">
                      {formData.resume?.name} - {uploadState.progress}%
                    </p>
                  </div>
                )}

                {/* Upload success */}
                {uploadState.uploadedUrl && !uploadState.uploadError && (
                  <div className="mt-2 p-4 border border-green-200 rounded-lg bg-green-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">Upload Successful</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearUploadedFile}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-green-700 mt-1">
                      {formData.resume?.name}
                    </p>
                  </div>
                )}

                {/* Upload error */}
                {uploadState.uploadError && (
                  <div className="mt-2 p-4 border border-red-200 rounded-lg bg-red-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-medium text-red-800">Upload Failed</span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={retryUpload}
                          className="text-red-600 hover:text-red-700 hover:bg-red-100"
                          disabled={uploadState.isUploading}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearUploadedFile}
                          className="text-red-600 hover:text-red-700 hover:bg-red-100"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-red-700">
                      {uploadState.uploadError}
                    </p>
                    {uploadState.retryCount >= MAX_RETRIES && (
                      <p className="text-xs text-red-600 mt-1">
                        Maximum retry attempts reached. Please try selecting the file again.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={jobApplication.isPending || uploadState.isUploading || !!(formData.resume && uploadState.uploadError)}
              >
                {jobApplication.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting Application...
                  </>
                ) : uploadState.isUploading ? (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Uploading Resume...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Application
                  </>
                )}
              </Button>
              
              {(uploadState.isUploading || jobApplication.isPending) && (
                <p className="text-xs text-center text-gray-500 mt-2">
                  {uploadState.isUploading ? 'Please wait for the resume upload to complete before submitting' : 'Submitting your application...'}
                </p>
              )}
              
              {formData.resume && uploadState.uploadError && (
                <p className="text-xs text-center text-red-600 mt-2">
                  Please fix the resume upload error or remove the file before submitting
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}