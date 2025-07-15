import { useState } from 'react'
import { useLocation } from 'wouter'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useDashboardMetrics, useRecentActivity, useJobs, useClients, useCreateJob, useCreateCandidate } from '@/hooks/useJobs'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  Plus, 
  Briefcase, 
  Users, 
  Clock, 
  TrendingUp,
  UserPlus,
  Building2,
  Calendar as CalendarIcon,
  ArrowRight,
  Activity,
  Loader2
} from 'lucide-react'

// Form schemas
const jobSchema = z.object({
  title: z.string().min(1, 'Job title is required'),
  description: z.string().optional(),
  clientId: z.string().min(1, 'Please select a client'),
})

const candidateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  resumeUrl: z.string().optional(),
})

type JobFormData = z.infer<typeof jobSchema>
type CandidateFormData = z.infer<typeof candidateSchema>

export default function Dashboard() {
  const [, setLocation] = useLocation()
  const [isJobModalOpen, setIsJobModalOpen] = useState(false)
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false)
  const { toast } = useToast()

  // Fetch dashboard data
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics()
  const { data: recentActivity, isLoading: activityLoading } = useRecentActivity()
  const { data: clients } = useClients()
  const createJobMutation = useCreateJob()
  const createCandidateMutation = useCreateCandidate()

  // Forms
  const jobForm = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: '',
      description: '',
      clientId: '',
    }
  })

  const candidateForm = useForm<CandidateFormData>({
    resolver: zodResolver(candidateSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      resumeUrl: '',
    }
  })

  // Handle job creation
  const onJobSubmit = async (data: JobFormData) => {
    try {
      await createJobMutation.mutateAsync(data)
      toast({
        title: "Job Created",
        description: "New job posting has been created successfully.",
      })
      setIsJobModalOpen(false)
      jobForm.reset()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create job. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle candidate creation
  const onCandidateSubmit = async (data: CandidateFormData) => {
    try {
      await createCandidateMutation.mutateAsync(data)
      toast({
        title: "Candidate Added",
        description: "New candidate has been added successfully.",
      })
      setIsCandidateModalOpen(false)
      candidateForm.reset()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add candidate. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Get time of day greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <DashboardLayout pageTitle="Dashboard">
      <div className="space-y-6">
        {/* Header with Greeting and Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{getGreeting()}!</h1>
            <p className="text-slate-600 mt-1">Here's your recruitment overview</p>
          </div>
          
          <div className="flex gap-3">
            <Dialog open={isJobModalOpen} onOpenChange={setIsJobModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Job
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create New Job</DialogTitle>
                </DialogHeader>
                <Form {...jobForm}>
                  <form onSubmit={jobForm.handleSubmit(onJobSubmit)} className="space-y-4">
                    <FormField
                      control={jobForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Title</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Senior Software Engineer" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={jobForm.control}
                      name="clientId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client</FormLabel>
                          <Select onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a client" />
                            </SelectTrigger>
                            <SelectContent>
                              {clients?.map((client) => (
                                <SelectItem key={client.id} value={client.id}>
                                  {client.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={jobForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Job description and requirements..."
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsJobModalOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createJobMutation.isPending}
                      >
                        {createJobMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          'Create Job'
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            <Dialog open={isCandidateModalOpen} onOpenChange={setIsCandidateModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <UserPlus className="w-4 h-4 mr-2" />
                  New Candidate
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add New Candidate</DialogTitle>
                </DialogHeader>
                <Form {...candidateForm}>
                  <form onSubmit={candidateForm.handleSubmit(onCandidateSubmit)} className="space-y-4">
                    <FormField
                      control={candidateForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. John Smith" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={candidateForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="john@example.com" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={candidateForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="+1 (555) 123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={candidateForm.control}
                      name="resumeUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Resume URL (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://example.com/resume.pdf" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsCandidateModalOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createCandidateMutation.isPending}
                      >
                        {createCandidateMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          'Add Candidate'
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Open Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-slate-500">Loading...</span>
                </div>
              ) : (
                <div className="text-2xl font-bold">{metrics?.openJobs || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total Candidates
              </CardTitle>
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-slate-500">Loading...</span>
                </div>
              ) : (
                <div className="text-2xl font-bold">{metrics?.totalCandidates || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Avg. Days to Hire
              </CardTitle>
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-slate-500">Loading...</span>
                </div>
              ) : (
                <div className="text-2xl font-bold">
                  {metrics?.averageDaysToHire ? `${metrics.averageDaysToHire}d` : 'N/A'}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Total Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-slate-500">Loading...</span>
                </div>
              ) : (
                <div className="text-2xl font-bold">{metrics?.totalJobs || 0}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recent Candidate Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activityLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Loading activity...
                    </div>
                  </div>
                ) : recentActivity && recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivity.slice(0, 8).map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                          <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900">{activity.candidateName}</span>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                            <Badge variant="outline" className="text-xs">
                              {activity.stage}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 mt-1">
                            {activity.jobTitle} at {activity.clientName}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {formatRelativeTime(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">No recent activity</p>
                    <p className="text-sm text-slate-400 mt-1">
                      Candidate activity will appear here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
                  onClick={() => setLocation('/jobs')}
                >
                  <Briefcase className="w-4 h-4 mr-3" />
                  View All Jobs
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </Button>
                
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
                  onClick={() => setLocation('/candidates')}
                >
                  <Users className="w-4 h-4 mr-3" />
                  Manage Candidates
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </Button>
                
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
                  onClick={() => setLocation('/clients')}
                >
                  <Building2 className="w-4 h-4 mr-3" />
                  Client Directory
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </Button>
                
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
                  onClick={() => setLocation('/calendar')}
                >
                  <CalendarIcon className="w-4 h-4 mr-3" />
                  Interview Calendar
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
