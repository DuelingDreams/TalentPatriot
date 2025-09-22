import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Link } from 'wouter'

interface JobPipelineData {
  id: string
  title: string
  totalCandidates: number
  stages: {
    applied: number
    screen: number
    interview: number
    offer: number
    hired: number
  }
}

interface PipelineSnapshotProps {
  jobs?: JobPipelineData[]
  loading?: boolean
}

export function PipelineSnapshot({ jobs = [], loading = false }: PipelineSnapshotProps) {
  // Mock data based on the mockup
  const mockJobs: JobPipelineData[] = [
    {
      id: '1',
      title: 'Cloud Engineer',
      totalCandidates: 5,
      stages: {
        applied: 1,
        screen: 1,
        interview: 2,
        offer: 1,
        hired: 0
      }
    },
    {
      id: '2', 
      title: 'DevOps Engineer',
      totalCandidates: 9,
      stages: {
        applied: 3,
        screen: 2,
        interview: 3,
        offer: 1,
        hired: 0
      }
    },
    {
      id: '3',
      title: 'Software Engineer', 
      totalCandidates: 14,
      stages: {
        applied: 5,
        screen: 4,
        interview: 3,
        offer: 1,
        hired: 1
      }
    }
  ]

  const displayJobs = jobs.length > 0 ? jobs : mockJobs

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'applied': return 'bg-gray-400'
      case 'screen': return 'bg-blue-500'
      case 'interview': return 'bg-yellow-500'
      case 'offer': return 'bg-purple-500'
      case 'hired': return 'bg-green-500'
      default: return 'bg-gray-400'
    }
  }

  const calculateStageWidth = (count: number, total: number) => {
    if (total === 0) return 0
    return Math.max((count / total) * 100, count > 0 ? 8 : 0) // Minimum 8% if there are candidates
  }

  if (loading) {
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
                {['Applied', 'Screen', 'Interview', 'Offer', 'Hired'].map((stage) => (
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
        <CardTitle className="text-lg">Pipeline Snapshot</CardTitle>
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
              <span>Offer</span>
              <span>Hired</span>
            </div>
          </div>
        ))}
        
        {displayJobs.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">No active jobs in pipeline</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}