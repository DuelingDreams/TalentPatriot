import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { useCandidates, useJobs, useCreateCandidate } from '@/hooks/useJobs'
import { ResumeUpload } from '@/components/ResumeUpload'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { insertCandidateSchema } from '@/../../shared/schema'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'
import { Plus, Users, Mail, Phone, FileText, Loader2, UserPlus } from 'lucide-react'

// Form schema for new candidate creation
const newCandidateSchema = insertCandidateSchema.extend({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required')
})

type NewCandidateFormData = z.infer<typeof newCandidateSchema>

export default function Candidates() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [assigningJobs, setAssigningJobs] = useState<Record<string, boolean>>({})
  const { toast } = useToast()

  // Fetch data using our hooks
  const { data: candidates, isLoading: candidatesLoading, error: candidatesError, refetch: refetchCandidates } = useCandidates()
  const { data: jobs } = useJobs()
  const createCandidateMutation = useCreateCandidate()

  // Form setup
  const form = useForm<NewCandidateFormData>({
    resolver: zodResolver(newCandidateSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      resume_url: ''
    }
  })

  // Handle form submission
  const onSubmit = async (data: NewCandidateFormData) => {
    try {
      await createCandidateMutation.mutateAsync(data)
      toast({
        title: "Candidate Added",
        description: "New candidate has been added successfully.",
      })
      setIsModalOpen(false)
      form.reset()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add candidate. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle job assignment
  const handleJobAssignment = async (candidateId: string, jobId: string) => {
    setAssigningJobs(prev => ({ ...prev, [candidateId]: true }))
    
    try {
      const { error } = await supabase
        .from('job_candidate')
        .insert({
          job_id: jobId,
          candidate_id: candidateId,
          stage: 'applied'
        })

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Already Applied",
            description: "This candidate has already been assigned to this job.",
            variant: "destructive",
          })
        } else {
          throw error
        }
      } else {
        const job = jobs?.find(j => j.id === jobId)
        toast({
          title: "Candidate Assigned",
          description: `Successfully assigned candidate to ${job?.title}.`,
        })
      }
    } catch (error) {
      toast({
        title: "Assignment Failed",
        description: "Failed to assign candidate to job. Please try again.",
        variant: "destructive",
      })
    } finally {
      setAssigningJobs(prev => ({ ...prev, [candidateId]: false }))
    }
  }

  // Handle resume upload
  const handleResumeUploaded = async (candidateId: string, resumeUrl: string) => {
    // Refetch candidates to update the UI with new resume URL
    await refetchCandidates()
  }

  return (
    <DashboardLayout pageTitle="Candidates">
      <div className="p-6">
        {/* Page Header */}
        <div className="mb-8">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Candidates</h2>
              <p className="mt-1 text-sm text-slate-600">Manage candidate profiles and job assignments.</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Candidate
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Add New Candidate</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
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
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="john.smith@example.com"
                                type="email"
                                {...field} 
                              />
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
                            <FormLabel>Phone Number (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="+1-555-0123"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="resume_url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Resume URL (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="https://example.com/resume.pdf"
                                type="url"
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
                          onClick={() => setIsModalOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createCandidateMutation.isPending}
                          className="bg-blue-600 hover:bg-blue-700"
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
        </div>

        {/* Loading State */}
        {candidatesLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-slate-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading candidates...
            </div>
          </div>
        )}

        {/* Error State */}
        {candidatesError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">Failed to load candidates: {candidatesError.message}</p>
          </div>
        )}

        {/* Candidates Table */}
        {candidates && candidates.length > 0 ? (
          <Card className="bg-white shadow-sm border border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                All Candidates ({candidates.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Resume</TableHead>
                    <TableHead>Assign to Job</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {candidates.map((candidate) => (
                    <TableRow key={candidate.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="w-4 h-4 text-blue-600" />
                          </div>
                          {candidate.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Mail className="w-4 h-4" />
                          {candidate.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        {candidate.phone ? (
                          <div className="flex items-center gap-2 text-slate-600">
                            <Phone className="w-4 h-4" />
                            {candidate.phone}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <ResumeUpload
                          candidateId={candidate.id}
                          candidateName={candidate.name}
                          currentResumeUrl={candidate.resume_url}
                          onResumeUploaded={(url) => handleResumeUploaded(candidate.id, url)}
                        />
                      </TableCell>
                      <TableCell>
                        <Select 
                          onValueChange={(jobId) => handleJobAssignment(candidate.id, jobId)}
                          disabled={assigningJobs[candidate.id]}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue 
                              placeholder={
                                assigningJobs[candidate.id] ? (
                                  <div className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Assigning...
                                  </div>
                                ) : (
                                  "Select a job"
                                )
                              } 
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {jobs?.filter(job => job.status === 'open').map((job) => (
                              <SelectItem key={job.id} value={job.id}>
                                {job.title} - {job.clients?.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          !candidatesLoading && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto bg-slate-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No candidates yet</h3>
              <p className="text-slate-600 mb-6">Add your first candidate to start managing applications.</p>
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Your First Candidate
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          )
        )}
      </div>
    </DashboardLayout>
  )
}
