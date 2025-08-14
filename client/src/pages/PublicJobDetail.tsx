import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Calendar, Building2, Clock, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { usePublicJobBySlug } from '@/hooks/usePublicJobBySlug';
import { useDemoFlag } from '@/lib/demoFlag';
import { demoAdapter } from '@/lib/dataAdapter';
import type { Job } from '@shared/schema';

interface ApplicationForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  resumeUrl: string;
  coverLetter: string;
}

export default function PublicJobDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  const [formData, setFormData] = useState<ApplicationForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    resumeUrl: '',
    coverLetter: ''
  });

  // Use shared hook for consistent data fetching
  const { job, isLoading, error, notFound } = usePublicJobBySlug(id);

  const applicationMutation = useMutation({
    mutationFn: async (data: ApplicationForm) => {
      return await fetch(`/api/jobs/${id}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          resumeUrl: data.resumeUrl,
          coverLetter: data.coverLetter,
        }),
      }).then(async (response) => {
        if (!response.ok) {
          const error = await response.json();
          // Handle validation errors from new Zod validation
          if (error.details && Array.isArray(error.details)) {
            throw new Error(`${error.error}: ${error.details.join(', ')}`);
          }
          throw new Error(error.error || 'Failed to submit application');
        }
        return response.json();
      });
    },
    onSuccess: () => {
      setApplicationSubmitted(true);
      setShowApplicationForm(false);
      toast({
        title: "Application Submitted!",
        description: "Thank you for your interest. We'll be in touch soon.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Application Failed",
        description: error.message || "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: keyof ApplicationForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmitApplication = () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in your first name, last name, and email address.",
        variant: "destructive",
      });
      return;
    }

    applicationMutation.mutate({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      resumeUrl: formData.resumeUrl,
      coverLetter: formData.coverLetter,
    });
  };

  // Error state
  if (error && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {notFound ? 'Job Not Found' : 'Unable to Load Job'}
          </h1>
          <p className="text-gray-600 mb-6">
            {notFound 
              ? "The job you're looking for doesn't exist or is no longer available."
              : "We're having trouble loading this job. Please try again later."
            }
          </p>
          <Button onClick={() => setLocation('/jobs')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Jobs
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-12 bg-gray-200 rounded w-2/3 mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Should not render if job is null but not loading
  if (!job) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => setLocation('/jobs')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to All Jobs
        </Button>

        {/* Job Header */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl text-gray-900 mb-4">
                  {job.title}
                </CardTitle>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                  {job.department && (
                    <div className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      {job.department}
                    </div>
                  )}
                  {job.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {job.location}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Posted {new Date(job.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Open Application
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge 
                    variant={job.jobType === 'full-time' ? 'default' : 'secondary'}
                    className="capitalize"
                  >
                    {job.jobType?.replace('-', ' ')}
                  </Badge>
                  <Badge 
                    variant="default"
                    className="bg-green-100 text-green-800"
                  >
                    {job.status}
                  </Badge>
                </div>
              </div>
              
              {!applicationSubmitted && (
                <Button 
                  size="lg"
                  onClick={() => setShowApplicationForm(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Apply Now
                </Button>
              )}
              
              {applicationSubmitted && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Application Submitted</span>
                </div>
              )}
            </div>
          </CardHeader>
        </Card>

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

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Apply */}
            {!applicationSubmitted && !showApplicationForm && (
              <Card>
                <CardHeader>
                  <CardTitle>Quick Apply</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Ready to take the next step? Submit your application now.
                  </p>
                  <Button 
                    className="w-full"
                    onClick={() => setShowApplicationForm(true)}
                  >
                    Start Application
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Application Confirmation */}
            {applicationSubmitted && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-green-800 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Application Submitted
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-green-700">
                    Thank you for your interest! We've received your application and will review it shortly. 
                    You should receive a confirmation email within the next few minutes.
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
                <div>
                  <Label className="text-sm font-medium text-gray-500">Job Type</Label>
                  <p className="capitalize">{job.jobType?.replace('-', ' ')}</p>
                </div>
                {job.department && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Department</Label>
                    <p>{job.department}</p>
                  </div>
                )}
                {job.location && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Location</Label>
                    <p>{job.location}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <p className="capitalize">{job.status}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Application Form Modal */}
        {showApplicationForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Apply for {job.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      placeholder="Your first name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      placeholder="Your last name"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="your.email@example.com"
                  />
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div>
                    <Label htmlFor="resume">Resume URL</Label>
                    <Input
                      id="resume"
                      value={formData.resumeUrl}
                      onChange={(e) => handleInputChange('resumeUrl', e.target.value)}
                      placeholder="https://example.com/resume.pdf"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="cover-letter">Cover Letter (Optional)</Label>
                  <Textarea
                    id="cover-letter"
                    value={formData.coverLetter}
                    onChange={(e) => handleInputChange('coverLetter', e.target.value)}
                    placeholder="Tell us why you're interested in this position..."
                    rows={4}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowApplicationForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmitApplication}
                    disabled={applicationMutation.isPending}
                  >
                    {applicationMutation.isPending ? 'Submitting...' : 'Submit Application'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}