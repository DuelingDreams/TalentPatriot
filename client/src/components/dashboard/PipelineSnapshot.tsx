import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Link } from 'wouter'
import { ArrowRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

interface JobPipelineData {
  id: string
  title: string
  totalCandidates: number
  stages: {
    applied: number
    phone_screen: number
    interview: number
    technical: number
    final: number
    offer: number
    hired: number
    rejected: number
  }
}

interface PipelineSnapshotProps {
  orgId: string
  limit?: number
}

export function PipelineSnapshot({ orgId, limit = 3 }: PipelineSnapshotProps) {
  // Fetch pipeline snapshot data from analytics endpoint
  const { data: pipelineData, isLoading, error } = useQuery({
    queryKey: ['/api/analytics/pipeline-snapshot', orgId, limit],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/pipeline-snapshot?orgId=${orgId}&limit=${limit}`)
      if (!response.ok) {
        throw new Error('Failed to fetch pipeline snapshot')
      }
      return response.json()
    },
    staleTime: 30 * 1000, // Cache for 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  })

  // Transform analytics data to component format
  const displayJobs: JobPipelineData[] = (pipelineData || []).map((item: any) => ({
    id: item.job_id,
    title: item.job_title,
    totalCandidates: item.total_candidates,
    stages: {
      applied: item.applied,
      phone_screen: item.phone_screen,
      interview: item.interview,
      technical: item.technical,
      final: item.final,
      offer: item.offer,
      hired: item.hired,
      rejected: item.rejected
    }
  }))

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'applied': return 'bg-gray-500'
      case 'phone_screen': return 'bg-blue-500'
      case 'interview': return 'bg-yellow-500'
      case 'technical': return 'bg-orange-500'
      case 'final': return 'bg-indigo-500'
      case 'offer': return 'bg-purple-500'
      case 'hired': return 'bg-green-500'
      case 'rejected': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const calculateStageWidth = (count: number, total: number) => {
    if (total === 0) return 0
    return Math.max((count / total) * 100, count > 0 ? 8 : 0) // Minimum 8% if there are candidates
  }

  if (isLoading) {
    return (
      <Card data-testid="pipeline-snapshot">
        <CardHeader>
          <CardTitle className="text-lg">Pipeline Snapshot</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="h-4 bg-gray-200 animate-pulse rounded w-32" />
                <div className="h-4 bg-gray-200 animate-pulse rounded w-16" />
              </div>
              <div className="h-6 bg-gray-200 animate-pulse rounded" />
              <div className="flex justify-between text-xs">
                {['Applied', 'Screen', 'Interview', 'Technical', 'Final', 'Offer', 'Hired', 'Rejected'].map((stage) => (
                  <div key={stage} className="h-3 bg-gray-200 animate-pulse rounded w-12" />
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card data-testid="pipeline-snapshot">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Pipeline Snapshot</CardTitle>
          <Link href="/pipeline">
            <Button variant="outline" size="sm" className="text-xs" data-testid="see-all-pipelines-btn">
              See All Pipelines
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {displayJobs.map((job) => (
          <div key={job.id} className="space-y-3" data-testid={`pipeline-job-${job.id}`}>
            {/* Job Header */}
            <div className="flex justify-between items-center">
              <Link href={`/pipeline/${job.id}`}>
                <h3 className="font-medium text-sm text-gray-900 hover:text-blue-600 cursor-pointer" data-testid={`job-title-${job.id}`}>
                  {job.title}
                </h3>
              </Link>
              <Badge variant="secondary" className="text-xs" data-testid={`job-candidates-${job.id}`}>
                {job.totalCandidates} candidates
              </Badge>
            </div>
            
            {/* Progress Bar */}
            <div className="relative h-6 bg-gray-100 rounded-full overflow-hidden">
              <div className="absolute inset-0 flex">
                {Object.entries(job.stages).map(([stage, count], index) => {
                  const width = calculateStageWidth(count, job.totalCandidates)
                  return (
                    <div
                      key={stage}
                      className={`${getStageColor(stage)} flex items-center justify-center text-white text-xs font-medium transition-all duration-300`}
                      style={{ width: `${width}%` }}
                      data-testid={`stage-${stage}-${job.id}`}
                    >
                      {count > 0 && count}
                    </div>
                  )
                })}
              </div>
            </div>
            
            {/* Stage Labels */}
            <div className="flex justify-between text-xs text-gray-500">
              <span>Applied</span>
              <span>Screen</span>
              <span>Interview</span>
              <span>Technical</span>
              <span>Final</span>
              <span>Offer</span>
              <span>Hired</span>
              <span>Rejected</span>
            </div>
          </div>
        ))}
        
        {error && (
          <div className="text-center py-8">
            <p className="text-sm text-red-500">Failed to load pipeline data</p>
            <p className="text-xs text-gray-400 mt-1">Please refresh the page or try again later</p>
          </div>
        )}
        
        {!error && displayJobs.length === 0 && !isLoading && (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">No open jobs with candidates</p>
            <p className="text-xs text-gray-400 mt-1">Create a job and start recruiting to see pipeline data</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}