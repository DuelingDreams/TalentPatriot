import { useState } from 'react'
import { useParams, useLocation } from 'wouter'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { usePublicJobBySlug } from '@/hooks/usePublicJobBySlug'
import { PageErrorBoundary } from '@/components/ui/page-error-boundary'
import { useDemoFlag } from '@/lib/demoFlag'
import { demoAdapter } from '@/lib/dataAdapter'
import { MapPin, Clock, DollarSign, Briefcase, Building2, Send, Loader2, ArrowLeft, Plus, X, AlertCircle } from 'lucide-react'
import type { Job } from '@shared/schema'

interface EducationEntry {
  school: string
  degree: string
  fieldOfStudy: string
  graduationYear?: string
}

interface EmploymentEntry {
  company: string
  jobTitle: string
  startDate: string
  endDate: string
  current: boolean
  description?: string
}

interface ApplicationFormData {
  // Basic Information
  firstName: string
  lastName: string
  email: string
  phone: string
  
  // Files
  resume?: File | null
  coverLetter?: File | null
  
  // Education (repeatable)
  education: EducationEntry[]
  
  // Employment (repeatable)
  employment: EmploymentEntry[]
  
  // External Links
  linkedinUrl: string
  portfolioUrl?: string
  
  // Legal/Eligibility
  workAuthorization: string
  visaSponsorship: string
  ageConfirmation: string
  previousEmployee: string
  
  // Outreach
  referralSource: string
  
  // Acknowledgments
  dataPrivacyAck: boolean
  aiAcknowledgment: boolean
  
  // Diversity (Optional)
  gender?: string
  raceEthnicity?: string
  veteranStatus?: string
  disabilityStatus?: string
}

export default function CareersBySlug() {
  const { slug, orgSlug } = useParams<{ slug: string; orgSlug?: string }>()
  const [, setLocation] = useLocation()
  const [isApplying, setIsApplying] = useState(false)
  const [applicationSubmitted, setApplicationSubmitted] = useState(false)
  const [applicationData, setApplicationData] = useState<ApplicationFormData>({
    // Basic Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    
    // Files
    resume: null,
    coverLetter: null,
    
    // Education (start with one entry)
    education: [{ school: '', degree: '', fieldOfStudy: '', graduationYear: '' }],
    
    // Employment (start with one entry)
    employment: [{ company: '', jobTitle: '', startDate: '', endDate: '', current: false, description: '' }],
    
    // External Links
    linkedinUrl: '',
    portfolioUrl: '',
    
    // Legal/Eligibility
    workAuthorization: '',
    visaSponsorship: '',
    ageConfirmation: '',
    previousEmployee: '',
    
    // Outreach
    referralSource: '',
    
    // Acknowledgments
    dataPrivacyAck: false,
    aiAcknowledgment: false,
    
    // Diversity (Optional)
    gender: '',
    raceEthnicity: '',
    veteranStatus: '',
    disabilityStatus: ''
  })
  const { toast } = useToast()

  // Use shared hook for consistent data fetching
  const { job, isLoading: loading, error, notFound } = usePublicJobBySlug(slug, { orgSlug })

  const handleInputChange = (field: keyof ApplicationFormData, value: any) => {
    setApplicationData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleEducationChange = (index: number, field: keyof EducationEntry, value: string) => {
    setApplicationData(prev => ({
      ...prev,
      education: prev.education.map((edu, i) => 
        i === index ? { ...edu, [field]: value } : edu
      )
    }))
  }

  const handleEmploymentChange = (index: number, field: keyof EmploymentEntry, value: any) => {
    setApplicationData(prev => ({
      ...prev,
      employment: prev.employment.map((emp, i) => 
        i === index ? { ...emp, [field]: value } : emp
      )
    }))
  }

  const addEducationEntry = () => {
    setApplicationData(prev => ({
      ...prev,
      education: [...prev.education, { school: '', degree: '', fieldOfStudy: '', graduationYear: '' }]
    }))
  }

  const removeEducationEntry = (index: number) => {
    if (applicationData.education.length > 1) {
      setApplicationData(prev => ({
        ...prev,
        education: prev.education.filter((_, i) => i !== index)
      }))
    }
  }

  const addEmploymentEntry = () => {
    setApplicationData(prev => ({
      ...prev,
      employment: [...prev.employment, { company: '', jobTitle: '', startDate: '', endDate: '', current: false, description: '' }]
    }))
  }

  const removeEmploymentEntry = (index: number) => {
    if (applicationData.employment.length > 1) {
      setApplicationData(prev => ({
        ...prev,
        employment: prev.employment.filter((_, i) => i !== index)
      }))
    }
  }

  const handleApply = async () => {
    if (!job) return

    // Basic validation
    if (!applicationData.firstName || !applicationData.lastName || !applicationData.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in your first name, last name, and email address.",
        variant: "destructive"
      })
      return
    }

    if (!applicationData.workAuthorization || !applicationData.visaSponsorship || !applicationData.ageConfirmation || !applicationData.previousEmployee) {
      toast({
        title: "Missing Required Information",
        description: "Please complete all required eligibility questions.",
        variant: "destructive"
      })
      return
    }

    if (!applicationData.referralSource) {
      toast({
        title: "Missing Information",
        description: "Please let us know how you heard about this position.",
        variant: "destructive"
      })
      return
    }

    if (!applicationData.dataPrivacyAck) {
      toast({
        title: "Privacy Notice Required",
        description: "Please confirm receipt of the Privacy Notice.",
        variant: "destructive"
      })
      return
    }

    if (!applicationData.resume) {
      toast({
        title: "Resume Required",
        description: "Please upload your resume.",
        variant: "destructive"
      })
      return
    }

    setIsApplying(true)
    try {
      // Handle file uploads first if present
      let resumeUrl = ''
      let coverLetterText = ''

      if (applicationData.resume) {
        const resumeFormData = new FormData()
        resumeFormData.append('resume', applicationData.resume)
        
        const uploadResponse = await fetch('/api/upload/resume', {
          method: 'POST',
          body: resumeFormData
        })
        
        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json()
          resumeUrl = uploadResult.url || uploadResult.path || ''
        }
      }

      // Prepare JSON payload (no "name" field)
      const jsonData = {
        firstName: applicationData.firstName,
        lastName: applicationData.lastName,
        email: applicationData.email,
        phone: applicationData.phone,
        resumeUrl,
        coverLetter: coverLetterText,
        education: JSON.stringify(applicationData.education),
        employment: JSON.stringify(applicationData.employment),
        linkedinUrl: applicationData.linkedinUrl,
        portfolioUrl: applicationData.portfolioUrl,
        workAuthorization: applicationData.workAuthorization,
        visaSponsorship: applicationData.visaSponsorship,
        ageConfirmation: applicationData.ageConfirmation,
        previousEmployee: applicationData.previousEmployee,
        referralSource: applicationData.referralSource,
        dataPrivacyAck: applicationData.dataPrivacyAck.toString(),
        aiAcknowledgment: applicationData.aiAcknowledgment.toString(),
        ...(applicationData.gender && { gender: applicationData.gender }),
        ...(applicationData.raceEthnicity && { raceEthnicity: applicationData.raceEthnicity }),
        ...(applicationData.veteranStatus && { veteranStatus: applicationData.veteranStatus }),
        ...(applicationData.disabilityStatus && { disabilityStatus: applicationData.disabilityStatus })
      }

      const response = await fetch(`/api/jobs/${job.id}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(jsonData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        
        // Handle specific error cases
        if (response.status === 400) {
          if (errorData.details && Array.isArray(errorData.details)) {
            throw new Error(errorData.details.join(', '))
          }
          throw new Error(errorData.error || 'Invalid application data')
        } else if (response.status === 409) {
          throw new Error('You have already applied to this position')
        } else if (response.status === 404) {
          throw new Error('This job posting is no longer available')
        } else {
          throw new Error(errorData.error || 'Application submission failed')
        }
      }

      setApplicationSubmitted(true)
      toast({
        title: "Application Submitted!",
        description: "Thank you for your interest. We'll be in touch soon.",
      })
    } catch (error) {
      console.error('Error submitting application:', error)
      toast({
        title: "Application Failed",
        description: error instanceof Error ? error.message : "Failed to submit application. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsApplying(false)
    }
  }

  // Error state
  if (error && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="mt-4 text-center">
              <h3 className="text-lg font-medium text-gray-900">
                {notFound ? 'Job Not Found' : 'Unable to Load Job'}
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                {notFound 
                  ? "This job posting may have been removed or expired."
                  : (String(error) || "We're having trouble loading this job. Please try again later.")
                }
              </p>
              <div className="mt-4 space-y-2">
                <Button onClick={() => window.location.reload()} size="sm">
                  Try Again
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    const careersPath = orgSlug ? `/org/${orgSlug}/careers` : '/careers';
                    setLocation(careersPath);
                  }}
                  size="sm"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Jobs
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
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

  return (
    <PageErrorBoundary 
      fallbackTitle="Unable to Load Job Details"
      fallbackDescription="There was an error loading the job details page. Please try again."
    >
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Button
            variant="ghost"
            onClick={() => {
              const careersPath = orgSlug ? `/org/${orgSlug}/careers` : '/careers';
              setLocation(careersPath);
            }}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
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
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Job Description */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Job Description</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                {job.description ? (
                  <div className="whitespace-pre-wrap text-gray-700">
                    {job.description}
                  </div>
                ) : (
                  <p className="text-gray-500">No description available.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Professional Application Form */}
          <div className="space-y-6">
            {/* Quick Apply */}
            {!applicationSubmitted && (
              <Card>
                <CardHeader>
                  <CardTitle>Apply to Our Organization</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 max-h-[80vh] overflow-y-auto">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input
                          id="firstName"
                          value={applicationData.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          placeholder="First name"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input
                          id="lastName"
                          value={applicationData.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          placeholder="Last name"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={applicationData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="your.email@example.com"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={applicationData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="(555) 123-4567"
                        required
                      />
                    </div>
                  </div>

                  {/* Files */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Documents</h3>
                    <div>
                      <Label htmlFor="resume">Resume/CV *</Label>
                      <Input
                        id="resume"
                        type="file"
                        accept=".pdf,.doc,.docx,.txt,.rtf"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null
                          handleInputChange('resume', file)
                        }}
                        className="cursor-pointer"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Accepted formats: PDF, DOC, DOCX, TXT, RTF (max 10MB)
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="coverLetter">Cover Letter (Optional)</Label>
                      <Input
                        id="coverLetter"
                        type="file"
                        accept=".pdf,.doc,.docx,.txt,.rtf"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null
                          handleInputChange('coverLetter', file)
                        }}
                        className="cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Education */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Education</h3>
                    {applicationData.education.map((edu, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-medium">Education Entry {index + 1}</h4>
                          {applicationData.education.length > 1 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeEducationEntry(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        <div className="space-y-3">
                          <div>
                            <Label>School/Institution *</Label>
                            <Input
                              value={edu.school}
                              onChange={(e) => handleEducationChange(index, 'school', e.target.value)}
                              placeholder="University or school name"
                              required
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label>Degree *</Label>
                              <Select
                                value={edu.degree}
                                onValueChange={(value) => handleEducationChange(index, 'degree', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select degree" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="high-school">High School Diploma</SelectItem>
                                  <SelectItem value="associates">Associate's Degree</SelectItem>
                                  <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
                                  <SelectItem value="masters">Master's Degree</SelectItem>
                                  <SelectItem value="phd">Ph.D.</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Graduation Year</Label>
                              <Input
                                type="number"
                                value={edu.graduationYear || ''}
                                onChange={(e) => handleEducationChange(index, 'graduationYear', e.target.value)}
                                placeholder="2024"
                                min="1950"
                                max="2030"
                              />
                            </div>
                          </div>
                          <div>
                            <Label>Field of Study *</Label>
                            <Input
                              value={edu.fieldOfStudy}
                              onChange={(e) => handleEducationChange(index, 'fieldOfStudy', e.target.value)}
                              placeholder="e.g., Computer Science, Marketing"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addEducationEntry}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Another Education
                    </Button>
                  </div>

                  {/* Employment */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Employment History</h3>
                    {applicationData.employment.map((emp, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-medium">Employment Entry {index + 1}</h4>
                          {applicationData.employment.length > 1 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeEmploymentEntry(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label>Company Name *</Label>
                              <Input
                                value={emp.company}
                                onChange={(e) => handleEmploymentChange(index, 'company', e.target.value)}
                                placeholder="Company name"
                                required
                              />
                            </div>
                            <div>
                              <Label>Job Title *</Label>
                              <Input
                                value={emp.jobTitle}
                                onChange={(e) => handleEmploymentChange(index, 'jobTitle', e.target.value)}
                                placeholder="Your role"
                                required
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label>Start Date *</Label>
                              <Input
                                type="date"
                                value={emp.startDate}
                                onChange={(e) => handleEmploymentChange(index, 'startDate', e.target.value)}
                                required
                              />
                            </div>
                            <div>
                              <Label>End Date</Label>
                              <Input
                                type="date"
                                value={emp.endDate}
                                onChange={(e) => handleEmploymentChange(index, 'endDate', e.target.value)}
                                disabled={emp.current}
                              />
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`current-${index}`}
                              checked={emp.current}
                              onCheckedChange={(checked) => handleEmploymentChange(index, 'current', checked)}
                            />
                            <Label htmlFor={`current-${index}`} className="text-sm">
                              Current Position
                            </Label>
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addEmploymentEntry}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Another Employment
                    </Button>
                  </div>

                  {/* External Links */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Professional Links</h3>
                    <div>
                      <Label htmlFor="linkedinUrl">LinkedIn Profile URL *</Label>
                      <Input
                        id="linkedinUrl"
                        type="url"
                        value={applicationData.linkedinUrl}
                        onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
                        placeholder="https://linkedin.com/in/yourprofile"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="portfolioUrl">Portfolio / GitHub / Personal Website</Label>
                      <Input
                        id="portfolioUrl"
                        type="url"
                        value={applicationData.portfolioUrl || ''}
                        onChange={(e) => handleInputChange('portfolioUrl', e.target.value)}
                        placeholder="https://your-portfolio.com"
                      />
                    </div>
                  </div>

                  {/* Legal/Eligibility */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Legal & Eligibility</h3>
                    <div>
                      <Label>Are you authorized to work where this position is located? *</Label>
                      <Select
                        value={applicationData.workAuthorization}
                        onValueChange={(value) => handleInputChange('workAuthorization', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select One" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Will you now or in the future require visa sponsorship? *</Label>
                      <Select
                        value={applicationData.visaSponsorship}
                        onValueChange={(value) => handleInputChange('visaSponsorship', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select One" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Age Confirmation *</Label>
                      <Select
                        value={applicationData.ageConfirmation}
                        onValueChange={(value) => handleInputChange('ageConfirmation', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select One" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="18-or-older">I am 18 or older</SelectItem>
                          <SelectItem value="under-18">I am under 18</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Have you previously been employed by this organization? *</Label>
                      <Select
                        value={applicationData.previousEmployee}
                        onValueChange={(value) => handleInputChange('previousEmployee', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select One" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Outreach */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">How Did You Hear About Us?</h3>
                    <div>
                      <Label>How did you hear about this opportunity? *</Label>
                      <Select
                        value={applicationData.referralSource}
                        onValueChange={(value) => handleInputChange('referralSource', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select One" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="career-page">Career Page</SelectItem>
                          <SelectItem value="linkedin">LinkedIn</SelectItem>
                          <SelectItem value="indeed">Indeed</SelectItem>
                          <SelectItem value="referral">Employee Referral</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Acknowledgments */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Acknowledgments</h3>
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="dataPrivacyAck"
                        checked={applicationData.dataPrivacyAck}
                        onCheckedChange={(checked) => handleInputChange('dataPrivacyAck', checked)}
                        required
                      />
                      <Label htmlFor="dataPrivacyAck" className="text-sm leading-relaxed">
                        I confirm receipt of the Privacy Notice and consent to the processing of my personal data for recruitment purposes. *
                      </Label>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="aiAcknowledgment"
                        checked={applicationData.aiAcknowledgment}
                        onCheckedChange={(checked) => handleInputChange('aiAcknowledgment', checked)}
                      />
                      <Label htmlFor="aiAcknowledgment" className="text-sm leading-relaxed">
                        I understand that this organization may use AI tools in the evaluation process.
                      </Label>
                    </div>
                  </div>

                  {/* Diversity (Optional) */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Voluntary Self-Identification</h3>
                    <p className="text-sm text-gray-600">
                      The following information is requested for diversity and inclusion purposes and is completely optional. 
                      This information will not be used in hiring decisions.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Gender</Label>
                        <Select
                          value={applicationData.gender || ''}
                          onValueChange={(value) => handleInputChange('gender', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Prefer not to say" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Prefer not to say</SelectItem>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="non-binary">Non-binary</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Race/Ethnicity</Label>
                        <Select
                          value={applicationData.raceEthnicity || ''}
                          onValueChange={(value) => handleInputChange('raceEthnicity', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Prefer not to say" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Prefer not to say</SelectItem>
                            <SelectItem value="asian">Asian</SelectItem>
                            <SelectItem value="black">Black/African American</SelectItem>
                            <SelectItem value="hispanic">Hispanic/Latino</SelectItem>
                            <SelectItem value="white">White</SelectItem>
                            <SelectItem value="two-or-more">Two or more races</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Veteran Status</Label>
                        <Select
                          value={applicationData.veteranStatus || ''}
                          onValueChange={(value) => handleInputChange('veteranStatus', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Prefer not to say" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Prefer not to say</SelectItem>
                            <SelectItem value="veteran">Veteran</SelectItem>
                            <SelectItem value="disabled-veteran">Disabled Veteran</SelectItem>
                            <SelectItem value="recently-separated">Recently Separated Veteran</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Disability Status</Label>
                        <Select
                          value={applicationData.disabilityStatus || ''}
                          onValueChange={(value) => handleInputChange('disabilityStatus', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Prefer not to say" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Prefer not to say</SelectItem>
                            <SelectItem value="yes">Yes, I have a disability</SelectItem>
                            <SelectItem value="no">No, I do not have a disability</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4 border-t">
                    <Button 
                      className="w-full"
                      onClick={handleApply}
                      disabled={isApplying}
                      size="lg"
                    >
                      {isApplying ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Submitting Application...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Submit Application
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Application Submitted */}
            {applicationSubmitted && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-green-800 mb-2">
                    Application Submitted!
                  </h3>
                  <p className="text-green-700">
                    Thank you for your interest in the {job.title} position at our organization. 
                    We'll review your application and be in touch soon.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Job Details */}
            <Card>
              <CardHeader>
                <CardTitle>Job Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm capitalize">{job.jobType?.replace('-', ' ') || 'Full-time'}</span>
                </div>
                {job.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{job.location}</span>
                  </div>
                )}
                {job.department && (
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{job.department}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
    </PageErrorBoundary>
  )
}