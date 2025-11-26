import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from 'wouter'
import { useQuery } from '@tanstack/react-query'

interface JobPipelineData {
  id: string
  title: string
  totalCandidates: number
}

interface PipelineSnapshotProps {
  orgId: string
  limit?: number
}

const progressColors = [
  'bg-green-500',
  'bg-blue-500', 
  'bg-yellow-500',
  'bg-purple-500',
  'bg-orange-500',
]

export function PipelineSnapshot({ orgId, limit = 3 }: PipelineSnapshotProps) {
  const { data: pipelineData, isLoading, isError } = useQuery({
    queryKey: ['/api/analytics/pipeline-snapshot', orgId, limit],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/pipeline-snapshot?orgId=${orgId}&limit=${limit}`)
      if (!response.ok) {
        throw new Error('Failed to fetch pipeline snapshot')
      }
      return response.json()
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  })

  const displayJobs: JobPipelineData[] = (pipelineData || []).map((item: any) => ({
    id: item.job_id,
    title: item.job_title,
    totalCandidates: item.total_candidates,
  }))

  const maxCandidates = Math.max(...displayJobs.map(j => j.totalCandidates), 1)

  if (isLoading) {
    return (
      <Card data-testid="pipeline-snapshot">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-900">Pipeline Snapshot</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="h-4 bg-gray-200 animate-pulse rounded w-40" />
                <div className="h-4 bg-gray-200 animate-pulse rounded w-6" />
              </div>
              <div className="h-2 bg-gray-200 animate-pulse rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card data-testid="pipeline-snapshot">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-gray-900">Pipeline Snapshot</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isError ? (
          <div className="text-center py-4">
            <p className="text-sm text-red-500">Failed to load pipeline data</p>
            <p className="text-xs text-gray-400 mt-1">Please refresh the page to try again</p>
          </div>
        ) : displayJobs.length > 0 ? (
          displayJobs.map((job, index) => {
            const progressWidth = (job.totalCandidates / maxCandidates) * 100
            const colorClass = progressColors[index % progressColors.length]
            
            return (
              <Link key={job.id} href={`/pipeline/${job.id}`}>
                <div 
                  className="space-y-2 cursor-pointer hover:opacity-80 transition-opacity"
                  data-testid={`pipeline-job-${job.id}`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900 truncate pr-2">
                      {job.title}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {job.totalCandidates}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${colorClass} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.max(progressWidth, 5)}%` }}
                    />
                  </div>
                </div>
              </Link>
            )
          })
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">No active pipelines</p>
            <p className="text-xs text-gray-400 mt-1">Create a job to see pipeline data</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
