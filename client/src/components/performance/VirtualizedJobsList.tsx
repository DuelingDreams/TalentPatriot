import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Building2, Calendar, Globe, ExternalLink, Loader2 } from 'lucide-react'
import { Link } from 'wouter'
import { EditJobDialog } from '@/features/jobs/components/EditJobDialog'
import { VirtualizedList } from './VirtualizedList'

interface VirtualizedJobsListProps {
  jobs: any[]
  onPublish: (jobId: string) => void
  isPublishing: boolean
  isDemoMode: boolean
  containerHeight?: number
}

export function VirtualizedJobsList({
  jobs,
  onPublish,
  isPublishing,
  isDemoMode,
  containerHeight = 600
}: VirtualizedJobsListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-600'
      case 'open': return 'bg-green-100 text-green-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      case 'on_hold': return 'bg-yellow-100 text-yellow-800'
      case 'filled': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const estimateSize = React.useCallback(() => {
    // Estimate based on typical job card height
    // Base height: 180px for content + 24px for padding + margins
    return 200
  }, [])

  const renderJobCard = React.useCallback((job: any, index: number) => {
    return (
      <div className="px-6 pb-6" data-testid={`job-card-${job.id}`}>
        <Card className="rounded-2xl shadow-sm hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold leading-tight text-gray-900" data-testid={`job-title-${job.id}`}>
                    {job.title}
                  </h3>
                  <Badge className={getStatusColor(job.status)} data-testid={`job-status-${job.id}`}>
                    {job.status}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                  <div className="flex items-center gap-1">
                    <Building2 className="w-4 h-4" />
                    <span data-testid={`job-client-${job.id}`}>
                      {job.client?.name || 'No client assigned'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span data-testid={`job-created-${job.id}`}>
                      Created {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {job.publicSlug && (
                    <div className="flex items-center gap-1">
                      <Globe className="w-4 h-4" />
                      <a 
                        href={`/careers/${job.publicSlug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        data-testid={`job-public-url-${job.id}`}
                      >
                        Public URL
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
                
                {job.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2" data-testid={`job-description-${job.id}`}>
                    {job.description}
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-2 ml-6">
                {job.status === 'draft' && !isDemoMode && (
                  <>
                    <EditJobDialog 
                      job={job}
                      onJobUpdated={() => {
                        // The parent component will handle refresh
                      }}
                    />
                    <Button
                      onClick={() => onPublish(job.id)}
                      disabled={isPublishing}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                      data-testid={`job-publish-${job.id}`}
                    >
                      {isPublishing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Globe className="w-4 h-4" />
                      )}
                      {isPublishing ? 'Publishing...' : 'Publish'}
                    </Button>
                  </>
                )}
                <Link href={`/pipeline/${job.id}`}>
                  <Button 
                    variant="outline" 
                    size="sm"
                    data-testid={`job-pipeline-${job.id}`}
                  >
                    View Pipeline
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }, [onPublish, isPublishing, isDemoMode, getStatusColor])

  const getJobKey = React.useCallback((job: any, index: number) => {
    // Always use stable entity ID - jobs must have valid IDs
    if (!job.id) {
      console.warn('VirtualizedJobsList: Job missing ID, this will cause rendering issues', job)
      return `job-fallback-${index}` // Temporary fallback with warning
    }
    return job.id
  }, [])

  if (jobs.length === 0) {
    return null // Empty state handled by parent component
  }

  return (
    <VirtualizedList
      items={jobs}
      estimateSize={estimateSize}
      renderItem={renderJobCard}
      containerHeight={containerHeight}
      containerClassName="w-full"
      overscan={3}
      getItemKey={getJobKey}
      measurementEnabled={true}
      itemSpacing={6}
    />
  )
}