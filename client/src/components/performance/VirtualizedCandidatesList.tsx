import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Star, 
  Clock, 
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Building2
} from 'lucide-react'
import { Link } from 'wouter'
import { formatDistanceToNow } from 'date-fns'
import { VirtualizedList } from './VirtualizedList'

interface VirtualizedCandidatesListProps {
  candidates: any[]
  containerHeight?: number
}

// Hook to detect responsive breakpoints and calculate columns
function useResponsiveColumns() {
  const [columns, setColumns] = React.useState(1)
  
  React.useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth
      if (width >= 1024) { // lg breakpoint
        setColumns(3)
      } else if (width >= 768) { // md breakpoint  
        setColumns(2)
      } else {
        setColumns(1)
      }
    }
    
    updateColumns()
    window.addEventListener('resize', updateColumns)
    return () => window.removeEventListener('resize', updateColumns)
  }, [])
  
  return columns
}

export function VirtualizedCandidatesList({
  candidates,
  containerHeight = 600
}: VirtualizedCandidatesListProps) {
  const columns = useResponsiveColumns()
  
  // Group candidates into rows based on current column count
  const candidateRows = React.useMemo(() => {
    const rows = []
    for (let i = 0; i < candidates.length; i += columns) {
      rows.push(candidates.slice(i, i + columns))
    }
    return rows
  }, [candidates, columns])

  const estimateSize = React.useCallback(() => {
    // Estimate based on typical candidate card height + spacing
    // Base height: ~240px for content + 24px for spacing
    return 264
  }, [])

  // Render individual candidate card
  const renderCandidateCard = React.useCallback((candidate: any) => {
    return (
      <div className="p-3" data-testid={`candidate-card-${candidate.id}`}>
        <Link href={`/candidates/${candidate.id}`}>
          <Card className="card hover:shadow-lg transition-all duration-200 cursor-pointer h-full overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4 gap-2">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Avatar className="w-12 h-12 flex-shrink-0">
                    <AvatarImage src={""} alt={candidate.name} />
                    <AvatarFallback className="bg-[#264C99] text-white">
                      {candidate.name.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-[#1A1A1A] truncate" data-testid={`candidate-name-${candidate.id}`}>
                      {candidate.name}
                    </h3>
                    <p className="text-sm text-[#5C667B] truncate" data-testid={`candidate-email-${candidate.id}`}>
                      {candidate.email}
                    </p>
                  </div>
                </div>
                {candidate.status === 'favorite' && (
                  <Star className="w-4 h-4 text-yellow-500 fill-current" data-testid={`candidate-favorite-${candidate.id}`} />
                )}
              </div>

              <div className="space-y-2 text-sm">
                {candidate.phone && (
                  <div className="flex items-center gap-2 text-[#5C667B]">
                    <Phone className="w-4 h-4" />
                    <span data-testid={`candidate-phone-${candidate.id}`}>{candidate.phone}</span>
                  </div>
                )}
                
                {candidate.location && (
                  <div className="flex items-center gap-2 text-[#5C667B]">
                    <MapPin className="w-4 h-4" />
                    <span data-testid={`candidate-location-${candidate.id}`}>{candidate.location}</span>
                  </div>
                )}
                
                {candidate.currentJobTitle && (
                  <div className="flex items-center gap-2 text-[#5C667B]">
                    <Briefcase className="w-4 h-4" />
                    <span data-testid={`candidate-job-title-${candidate.id}`}>{candidate.currentJobTitle}</span>
                  </div>
                )}
                
                {candidate.currentEmployer && (
                  <div className="flex items-center gap-2 text-[#5C667B]">
                    <Building2 className="w-4 h-4" />
                    <span data-testid={`candidate-employer-${candidate.id}`}>{candidate.currentEmployer}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-[#5C667B]">
                  <Clock className="w-4 h-4" />
                  <span data-testid={`candidate-created-${candidate.id}`}>
                    Added {(() => {
                      try {
                        const date = new Date(candidate.createdAt)
                        return isNaN(date.getTime()) ? 'recently' : formatDistanceToNow(date, { addSuffix: true })
                      } catch {
                        return 'recently'
                      }
                    })()}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <Badge 
                  className={`text-xs ${
                    candidate.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : candidate.status === 'favorite'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-[#F0F4F8] text-[#5C667B]'
                  }`}
                  data-testid={`candidate-status-${candidate.id}`}
                >
                  {candidate.status || 'New'}
                </Badge>
                
                {candidate.skills && candidate.skills.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-[#5C667B]">
                    <span>{candidate.skills.length} skills</span>
                  </div>
                )}
              </div>

              {candidate.skills && candidate.skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {candidate.skills.slice(0, 3).map((skill: string, skillIndex: number) => (
                    <Badge 
                      key={skillIndex} 
                      variant="outline" 
                      className="text-xs"
                      data-testid={`candidate-skill-${candidate.id}-${skillIndex}`}
                    >
                      {skill}
                    </Badge>
                  ))}
                  {candidate.skills.length > 3 && (
                    <Badge variant="outline" className="text-xs" data-testid={`candidate-more-skills-${candidate.id}`}>
                      +{candidate.skills.length - 3} more
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </Link>
      </div>
    )
  }, [])

  // Render a row of candidates in responsive grid
  const renderCandidateRow = React.useCallback((candidateRow: any[], rowIndex: number) => {
    return (
      <div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-6 pb-6"
        data-testid={`candidate-row-${rowIndex}`}
      >
        {candidateRow.map((candidate) => renderCandidateCard(candidate))}
      </div>
    )
  }, [renderCandidateCard])

  const getRowKey = React.useCallback((candidateRow: any[], rowIndex: number) => {
    // Create stable key from all candidates in the row
    const candidateIds = candidateRow.map(candidate => {
      if (!candidate.id) {
        console.warn('VirtualizedCandidatesList: Candidate missing ID, this will cause rendering issues', candidate)
        return `candidate-fallback-${rowIndex}`
      }
      return candidate.id
    })
    return `row-${candidateIds.join('-')}`
  }, [])

  if (candidates.length === 0) {
    return null // Empty state handled by parent component
  }

  return (
    <div className="w-full">
      <VirtualizedList
        items={candidateRows}
        estimateSize={estimateSize}
        renderItem={renderCandidateRow}
        containerHeight={containerHeight}
        containerClassName="w-full"
        overscan={2}
        getItemKey={getRowKey}
        measurementEnabled={true}
        itemSpacing={0} // Spacing handled by grid gap
      />
    </div>
  )
}