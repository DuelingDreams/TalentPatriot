import { useState } from 'react'
import { useParams } from 'wouter'
import { format } from 'date-fns'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Calendar, 
  MessageSquare,
  User,
  Download,
  Edit,
  Star,
  MapPin,
  Briefcase,
  FileText,
  Send,
  Megaphone,
  Plus,
  Trash2,
  Building2
} from 'lucide-react'
import { Link } from 'wouter'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useCandidate } from '@/features/candidates/hooks/useCandidates'
import { useCandidateApplicationHistory } from '@/features/candidates/hooks/useCandidateApplicationHistory'
import { useCandidateSubmissions } from '@/features/candidates/hooks/useCandidateSubmissions'
import { useCandidateDocuments } from '@/features/candidates/hooks/useCandidateDocuments'
import { useCandidateCampaigns } from '@/features/candidates/hooks/useCandidateCampaigns'
import { useAuth } from '@/contexts/AuthContext'
import { CandidateNotes } from '@/features/candidates/components/CandidateNotes'
import { toCamelCase } from '@shared/utils/caseConversion'
import { useToast } from '@/shared/hooks/use-toast'
import { EditCandidateProfileDialog } from '@/features/candidates/components/EditCandidateProfileDialog'
import { AddSubmissionDialog } from '@/features/organization/components/AddSubmissionDialog'
import { UploadDocumentDialog } from '@/features/candidates/components/UploadDocumentDialog'
import { EnrollCampaignDialog } from '@/features/communications/components/EnrollCampaignDialog'
import { CampaignEnrollmentCard } from '@/features/communications/components/CampaignEnrollmentCard'
import { apiRequest } from '@/lib/queryClient'

export default function CandidateProfile() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState('overview')
  const { currentOrgId } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  const [showSubmissionDialog, setShowSubmissionDialog] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showCampaignDialog, setShowCampaignDialog] = useState(false)
  
  const { data: candidateData, isLoading: candidateLoading } = useCandidate(id)
  
  const candidate = candidateData && typeof candidateData === 'object' && 'name' in candidateData 
    ? toCamelCase(candidateData as any)
    : null
  const { data: applications } = useCandidateApplicationHistory(id)
  const { data: submissions, isLoading: submissionsLoading } = useCandidateSubmissions(id)
  const { data: documents, isLoading: documentsLoading } = useCandidateDocuments(id)
  const { data: enrollments, isLoading: campaignsLoading } = useCandidateCampaigns(id)

  const deleteDocumentMutation = useMutation({
    mutationFn: async (docId: string) => {
      return apiRequest(`/api/candidates/${id}/documents/${docId}`, {
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      toast({
        title: 'Document Deleted',
        description: 'The document has been removed.',
      })
      queryClient.invalidateQueries({ queryKey: ['/api/candidates', id, 'documents'] })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete document',
        variant: 'destructive',
      })
    },
  })

  const enrolledCampaignIds = enrollments?.map((e: any) => e.campaignId || e.campaign_id) || []

  if (candidateLoading) {
    return (
      <DashboardLayout pageTitle="Loading...">
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!candidate) {
    return (
      <DashboardLayout pageTitle="Candidate Not Found">
        <div className="p-6">
          <Card>
            <CardContent className="p-12 text-center">
              <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">Candidate Not Found</h3>
              <p className="text-muted-foreground mb-4">
                The candidate you're looking for doesn't exist or you don't have access to view them.
              </p>
              <Link href="/candidates">
                <Button>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Candidates
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  const currentTitle = candidate?.currentTitle || 
    (candidate?.workExperience && Array.isArray(candidate.workExperience) && candidate.workExperience[0]?.title) || 
    'Professional'

  const rating = candidate?.rating || 0

  const formatSalary = () => {
    if (candidate?.desiredSalaryMin && candidate?.desiredSalaryMax) {
      return `$${candidate.desiredSalaryMin.toLocaleString()} - $${candidate.desiredSalaryMax.toLocaleString()}`
    }
    return 'Not specified'
  }

  const formatExperience = () => {
    if (candidate?.totalYearsExperience) {
      return `${candidate.totalYearsExperience}+ Years`
    }
    return 'Not specified'
  }

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      applied: 'bg-blue-100 text-blue-800',
      screening: 'bg-yellow-100 text-yellow-800',
      interview: 'bg-purple-100 text-purple-800',
      interviewing: 'bg-blue-100 text-blue-800',
      technical: 'bg-indigo-100 text-indigo-800',
      final: 'bg-orange-100 text-orange-800',
      offer: 'bg-green-100 text-green-800',
      hired: 'bg-emerald-100 text-emerald-800',
      rejected: 'bg-red-100 text-red-800'
    }
    return colors[stage] || 'bg-gray-100 text-gray-800'
  }

  const getSubmissionStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      submitted: 'bg-blue-100 text-blue-800',
      reviewing: 'bg-yellow-100 text-yellow-800',
      interviewing: 'bg-purple-100 text-purple-800',
      offered: 'bg-green-100 text-green-800',
      placed: 'bg-emerald-100 text-emerald-800',
      rejected: 'bg-red-100 text-red-800',
      withdrawn: 'bg-gray-100 text-gray-800',
      active: 'bg-green-100 text-green-800'
    }
    return colors[status] || 'bg-blue-100 text-blue-800'
  }

  const formatStageLabel = (stage: string) => {
    return stage.charAt(0).toUpperCase() + stage.slice(1).replace('_', ' ')
  }

  const parseJsonField = (field: any) => {
    if (!field) return []
    if (Array.isArray(field)) return field
    if (typeof field === 'string') {
      try {
        const parsed = JSON.parse(field)
        return Array.isArray(parsed) ? parsed : []
      } catch {
        return []
      }
    }
    return []
  }

  const workExperience = parseJsonField(candidate?.workExperience)

  const skills = candidate?.skills && Array.isArray(candidate.skills) 
    ? candidate.skills 
    : []

  const currentStage = applications?.[0]?.stage || 'sourced'

  return (
    <DashboardLayout pageTitle={candidate?.name || 'Candidate Profile'}>
      <div className="p-6 max-w-6xl mx-auto">
        <Link href="/candidates">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Candidates
          </Button>
        </Link>

        <Card className="mb-6 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-1" data-testid="candidate-name">
                  {candidate?.name || 'Unknown Candidate'}
                </h1>
                <p className="text-lg text-gray-700 mb-3" data-testid="candidate-title">
                  {currentTitle}
                </p>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    <span data-testid="candidate-email">{candidate?.email || 'No email'}</span>
                  </div>
                  {candidate?.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      <span data-testid="candidate-phone">{candidate.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span data-testid="candidate-location">{candidate?.location || 'Not specified'}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-800" data-testid="status-badge-active">
                  Active
                </Badge>
                <Badge className={getStageColor(currentStage)} data-testid="status-badge-stage">
                  {formatStageLabel(currentStage)}
                </Badge>
                <div className="flex ml-2" data-testid="candidate-rating">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star 
                      key={i}
                      size={20}
                      className={i <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mt-4">
              <div className="bg-gray-50 rounded-lg p-3" data-testid="info-card-salary">
                <div className="text-sm text-gray-600">Desired Salary</div>
                <div className="font-semibold text-gray-900">{formatSalary()}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3" data-testid="info-card-availability">
                <div className="text-sm text-gray-600">Availability</div>
                <div className="font-semibold text-gray-900">{candidate?.availability || 'Not specified'}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3" data-testid="info-card-submissions">
                <div className="text-sm text-gray-600">Submissions</div>
                <div className="font-semibold text-gray-900">{applications?.length || 0} Active</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3" data-testid="info-card-experience">
                <div className="text-sm text-gray-600">Experience</div>
                <div className="font-semibold text-gray-900">{formatExperience()}</div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              {candidate?.resumeUrl && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    const { openResumeInNewTab } = await import('@/lib/resumeUtils')
                    await openResumeInNewTab(candidate.resumeUrl!)
                  }}
                  data-testid="download-resume-button"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Resume
                </Button>
              )}
              {candidate && (
                <EditCandidateProfileDialog 
                  candidate={candidate}
                  onSuccess={() => queryClient.invalidateQueries({ queryKey: ['/api/candidates', id] })}
                />
              )}
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="submissions" data-testid="tab-submissions">Submissions</TabsTrigger>
            <TabsTrigger value="campaigns" data-testid="tab-campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="notes" data-testid="tab-notes">Notes</TabsTrigger>
            <TabsTrigger value="documents" data-testid="tab-documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3">Professional Summary</h2>
                <p className="text-gray-700 leading-relaxed" data-testid="professional-summary">
                  {candidate?.summary || 'No professional summary available.'}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3">Skills</h2>
                {skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2" data-testid="skills-list">
                    {skills.map((skill: string, index: number) => (
                      <span 
                        key={index}
                        className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium"
                        data-testid={`skill-badge-${index}`}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No skills listed.</p>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Work Experience</h2>
                {workExperience.length > 0 ? (
                  <div className="space-y-6" data-testid="work-experience-list">
                    {workExperience.map((exp: any, idx: number) => (
                      <div key={idx} className={idx > 0 ? 'pt-6 border-t border-gray-200' : ''} data-testid={`work-experience-${idx}`}>
                        <h3 className="text-lg font-semibold text-gray-900">{exp.title}</h3>
                        <p className="text-gray-700 font-medium">{exp.company}</p>
                        <p className="text-sm text-gray-600 mb-2">
                          {exp.duration || exp.period} {exp.location && `• ${exp.location}`}
                        </p>
                        {exp.description && (
                          <p className="text-gray-700">{exp.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No work experience listed.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="submissions" className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  Client Submissions
                </CardTitle>
                <Button size="sm" data-testid="add-submission-button" onClick={() => setShowSubmissionDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </CardHeader>
              <CardContent>
                {submissionsLoading ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="animate-pulse h-24 bg-gray-100 rounded-lg"></div>
                    ))}
                  </div>
                ) : submissions && submissions.length > 0 ? (
                  <div className="space-y-4" data-testid="submissions-list">
                    {submissions.map((sub: any) => (
                      <div key={sub.id} className="border border-gray-200 rounded-lg p-4" data-testid={`submission-${sub.id}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-lg">{sub.positionTitle || sub.position_title || 'Position'}</h3>
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <Building2 className="w-4 h-4" />
                              {sub.client?.name || sub.clientName || 'Client'}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {sub.submittedAt || sub.submitted_at ? format(new Date(sub.submittedAt || sub.submitted_at), 'MMM d, yyyy') : ''} 
                              {sub.rate && ` • ${sub.rate}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getSubmissionStatusColor(sub.status)}>
                              {formatStageLabel(sub.status)}
                            </Badge>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => showComingSoon('Edit submission')}>
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        {sub.feedback && (
                          <p className="text-sm text-gray-600 italic mt-2">"{sub.feedback}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Briefcase className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No submissions yet</p>
                    <p className="text-sm">Submit this candidate to clients to track activity here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Megaphone className="w-5 h-5" />
                  Drip Campaigns
                </CardTitle>
                <Button size="sm" data-testid="enroll-campaign-button" onClick={() => setShowCampaignDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Enroll in Campaign
                </Button>
              </CardHeader>
              <CardContent>
                {campaignsLoading ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="animate-pulse h-32 bg-gray-100 rounded-lg"></div>
                    ))}
                  </div>
                ) : enrollments && enrollments.length > 0 ? (
                  <div className="space-y-4" data-testid="campaigns-list">
                    {enrollments.map((enrollment: any) => (
                      <CampaignEnrollmentCard
                        key={enrollment.id}
                        enrollment={enrollment}
                        candidateName={candidate?.name}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500" data-testid="campaigns-placeholder">
                    <Megaphone className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No active campaigns</p>
                    <p className="text-sm">Enroll this candidate in automated email campaigns</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="space-y-6">
            {applications && applications.length > 0 ? (
              <div className="space-y-6">
                {applications.map((app: any) => (
                  <div key={app.id}>
                    <div className="mb-4">
                      <h3 className="text-lg font-bold leading-tight">{app.jobTitle}</h3>
                      <p className="text-sm text-gray-600">{app.clientName}</p>
                    </div>
                    <CandidateNotes
                      candidateId={id!}
                      jobCandidateId={app.id}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <Card className="shadow-sm">
                <CardContent className="p-12 text-center">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="font-semibold text-lg mb-2">No Applications Found</h3>
                  <p className="text-muted-foreground">
                    Notes are tied to specific job applications. Once this candidate applies to a job, you'll be able to add notes.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Documents
                </CardTitle>
                <Button size="sm" data-testid="upload-document-button" onClick={() => setShowUploadDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Upload
                </Button>
              </CardHeader>
              <CardContent>
                {documentsLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="animate-pulse h-16 bg-gray-100 rounded-lg"></div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3" data-testid="documents-list">
                    {candidate?.resumeUrl && (
                      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-blue-500" />
                          <div>
                            <p className="font-medium">Resume</p>
                            <p className="text-sm text-gray-500">
                              Uploaded: {candidate?.createdAt ? format(new Date(candidate.createdAt), 'MMM d, yyyy') : 'Recently'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8"
                            onClick={async () => {
                              const { openResumeInNewTab } = await import('@/lib/resumeUtils')
                              await openResumeInNewTab(candidate.resumeUrl!)
                            }}
                            data-testid="download-resume-doc"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                    {documents && documents.length > 0 && documents.map((doc: any) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg" data-testid={`document-${doc.id}`}>
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-gray-500" />
                          <div>
                            <p className="font-medium">{doc.name}</p>
                            <p className="text-sm text-gray-500">
                              Uploaded: {doc.createdAt || doc.created_at 
                                ? format(new Date(doc.createdAt || doc.created_at), 'MMM d, yyyy') 
                                : 'Recently'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8"
                            onClick={async () => {
                              try {
                                const fileUrl = doc.fileUrl || doc.file_url
                                if (fileUrl?.startsWith('http')) {
                                  window.open(fileUrl, '_blank')
                                } else {
                                  const response = await apiRequest(`/api/candidates/${id}/documents/${doc.id}/url`)
                                  if (response?.url) {
                                    window.open(response.url, '_blank')
                                  }
                                }
                              } catch (error) {
                                toast({
                                  title: 'Error',
                                  description: 'Failed to open document',
                                  variant: 'destructive',
                                })
                              }
                            }}
                            data-testid={`download-document-${doc.id}`}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700"
                            onClick={() => deleteDocumentMutation.mutate(doc.id)}
                            disabled={deleteDocumentMutation.isPending}
                            data-testid={`delete-document-${doc.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {!candidate?.resumeUrl && (!documents || documents.length === 0) && (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>No documents uploaded</p>
                        <p className="text-sm">Upload resumes and other documents for this candidate</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <AddSubmissionDialog
        open={showSubmissionDialog}
        onOpenChange={setShowSubmissionDialog}
        candidateId={id!}
        candidateName={candidate?.name}
      />
      
      <UploadDocumentDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        candidateId={id!}
        candidateName={candidate?.name}
      />
      
      <EnrollCampaignDialog
        open={showCampaignDialog}
        onOpenChange={setShowCampaignDialog}
        candidateId={id!}
        candidateName={candidate?.name}
        enrolledCampaignIds={enrolledCampaignIds}
      />
    </DashboardLayout>
  )
}
