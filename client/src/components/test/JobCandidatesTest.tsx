import { useState } from 'react'
import { useJobs } from '@/hooks/useJobs'
import { useCandidatesForJob } from '@/hooks/useJobCandidates'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'

export function JobCandidatesTest() {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  
  const { data: jobs, isLoading: jobsLoading } = useJobs()
  const { data: candidates, isLoading: candidatesLoading } = useCandidatesForJob(selectedJobId || undefined)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Test: useCandidatesForJob Hook</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Select a Job:
            </label>
            <Select value={selectedJobId || ''} onValueChange={setSelectedJobId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a job to view candidates" />
              </SelectTrigger>
              <SelectContent>
                {jobsLoading ? (
                  <SelectItem value="loading" disabled>
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading jobs...
                    </div>
                  </SelectItem>
                ) : (
                  jobs?.map((job: any) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.title} - {job.clients?.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedJobId && (
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-3">
                Candidates for this job:
              </h4>
              
              {candidatesLoading ? (
                <div className="flex items-center gap-2 text-slate-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading candidates...
                </div>
              ) : candidates && candidates.length > 0 ? (
                <div className="space-y-3">
                  {candidates.map((jobCandidate: any) => (
                    <div 
                      key={jobCandidate.id}
                      className="p-3 border border-slate-200 rounded-lg bg-slate-50"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium text-slate-900">
                            {jobCandidate.candidates.name}
                          </h5>
                          <p className="text-sm text-slate-600">
                            {jobCandidate.candidates.email}
                          </p>
                          {jobCandidate.candidates.phone && (
                            <p className="text-sm text-slate-600">
                              {jobCandidate.candidates.phone}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="mb-1">
                            {jobCandidate.stage}
                          </Badge>
                          {jobCandidate.assigned_to && (
                            <p className="text-xs text-slate-500">
                              Assigned to: {jobCandidate.assigned_to}
                            </p>
                          )}
                        </div>
                      </div>
                      {jobCandidate.notes && typeof jobCandidate.notes === 'string' && (
                        <p className="text-sm text-slate-600 mt-2 italic">
                          "{jobCandidate.notes}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm">
                  No candidates found for this job.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}