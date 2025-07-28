import { useState } from 'react'
import { useParams } from 'wouter'
import { format, formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  FileText, 
  Calendar, 
  MessageSquare,
  Clock,
  Building2,
  User,
  Download,
  ExternalLink,
  Edit,
  Star,
  MapPin,
  Briefcase,
  Eye
} from 'lucide-react'
import { Link } from 'wouter'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useCandidate } from '@/hooks/useCandidates'
import { useCandidateApplicationHistory } from '@/hooks/useCandidateApplicationHistory'
import { useCandidateNotes } from '@/hooks/useCandidateNotes'
import { useCandidateInterviews } from '@/hooks/useCandidateInterviews'
import { useAuth } from '@/contexts/AuthContext'
import { ResumeUpload } from '@/components/resume/ResumeUpload'
import { ResumePreview } from '@/components/resume/ResumePreview'

export default function CandidateProfile() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState('overview')
  const { userRole } = useAuth()
  
  const { data: candidate, isLoading: candidateLoading } = useCandidate(id)
  const { data: applications, isLoading: applicationsLoading } = useCandidateApplicationHistory(id)
  const { data: notes, isLoading: notesLoading } = useCandidateNotes(id)
  const { data: interviews, isLoading: interviewsLoading } = useCandidateInterviews(id)

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

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      applied: 'bg-blue-100 text-blue-800',
      screening: 'bg-yellow-100 text-yellow-800',
      interview: 'bg-purple-100 text-purple-800',
      technical: 'bg-indigo-100 text-indigo-800',
      final: 'bg-orange-100 text-orange-800',
      offer: 'bg-green-100 text-green-800',
      hired: 'bg-emerald-100 text-emerald-800',
      rejected: 'bg-red-100 text-red-800'
    }
    return colors[stage] || 'bg-gray-100 text-gray-800'
  }

  const formatStageLabel = (stage: string) => {
    return stage.charAt(0).toUpperCase() + stage.slice(1).replace('_', ' ')
  }

  return (
    <DashboardLayout pageTitle={candidate.name}>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/candidates">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Candidates
            </Button>
          </Link>
          
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-6">
              <Avatar className="w-20 h-20">
                <AvatarImage src={`https://i.pravatar.cc/150?u=${candidate.email}`} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                  {candidate.name.split(' ').map((n: string) => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{candidate.name}</h1>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    <span>{candidate.email}</span>
                  </div>
                  {candidate.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      <span>{candidate.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Added {format(new Date(candidate.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                </div>
                
                {/* Applications Summary */}
                <div className="flex flex-wrap gap-2">
                  {applications?.map((app: any) => (
                    <Badge key={app.id} className={getStageColor(app.stage)}>
                      {app.job?.title}: {formatStageLabel(app.stage)}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              {candidate.resumeUrl && (
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download Resume
                </Button>
              )}
              <Button variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="interviews">Interviews</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="communication">Communication</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Applications</span>
                    <span className="font-semibold">{applications?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Interviews</span>
                    <span className="font-semibold">{interviews?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Notes</span>
                    <span className="font-semibold">{notes?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Last Activity</span>
                    <span className="font-semibold text-sm">
                      {applications?.[0] ? formatDistanceToNow(new Date(applications[0].updatedAt), { addSuffix: true }) : 'None'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Resume Section */}
              <div className="lg:col-span-2 space-y-4">
                <ResumeUpload 
                  candidateId={id!}
                  currentResumeUrl={candidate.resumeUrl}
                  onUploadSuccess={(resumeUrl) => {
                    // Trigger a refetch of candidate data
                    window.location.reload()
                  }}
                />
                
                {candidate.resumeUrl && (
                  <ResumePreview 
                    resumeUrl={candidate.resumeUrl}
                    candidateName={candidate.name}
                  />
                )}
              </div>
            </div>
          </TabsContent>

          {/* Applications Tab */}
          <TabsContent value="applications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Application History</CardTitle>
              </CardHeader>
              <CardContent>
                {applicationsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-20 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : applications?.length ? (
                  <div className="space-y-4">
                    {applications.map((app: any) => (
                      <div key={app.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{app.job?.title}</h3>
                            <p className="text-sm text-gray-600">{app.job?.client?.name}</p>
                          </div>
                          <div className="text-right">
                            <Badge className={getStageColor(app.stage)}>
                              {formatStageLabel(app.stage)}
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">
                              Updated {formatDistanceToNow(new Date(app.updatedAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        
                        {app.notes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded">
                            <p className="text-sm">{app.notes}</p>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                          <span>Applied {format(new Date(app.createdAt), 'MMM d, yyyy')}</span>
                          {app.assignedTo && <span>Assigned to recruiter</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Briefcase className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No applications found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Interviews Tab */}
          <TabsContent value="interviews" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Interview History</CardTitle>
              </CardHeader>
              <CardContent>
                {interviewsLoading ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-16 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : interviews?.length ? (
                  <div className="space-y-4">
                    {interviews.map((interview: any) => (
                      <div key={interview.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{interview.title}</h3>
                            <p className="text-sm text-gray-600 capitalize">{interview.type} interview</p>
                          </div>
                          <Badge variant={interview.status === 'completed' ? 'default' : 'outline'}>
                            {interview.status}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{format(new Date(interview.scheduledAt), 'MMM d, yyyy h:mm a')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{interview.duration || '60'} minutes</span>
                          </div>
                        </div>
                        
                        {interview.notes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded">
                            <p className="text-sm">{interview.notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No interviews scheduled</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notes & Comments</CardTitle>
              </CardHeader>
              <CardContent>
                {notesLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-16 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : notes?.length ? (
                  <div className="space-y-4">
                    {notes.map((note: any) => (
                      <div key={note.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="text-sm font-medium">
                            {note.authorId === 'current-user' ? 'You' : note.authorEmail || 'Team member'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                          </div>
                        </div>
                        <p className="text-sm">{note.content}</p>
                        {note.isPrivate === 'true' && (
                          <Badge variant="outline" className="mt-2 text-xs">
                            Private
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No notes added yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Communication Tab */}
          <TabsContent value="communication" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Communication Log</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Mail className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Communication tracking coming soon</p>
                  <p className="text-xs">Email logs and messages will appear here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}