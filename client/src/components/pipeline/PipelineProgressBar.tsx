interface PipelineProgressBarProps {
  columns: Array<{ id: string; title: string; position: string }>
  applicationsByColumn: Map<string, any[]>
}

export function PipelineProgressBar({ columns, applicationsByColumn }: PipelineProgressBarProps) {
  // Standard stage order and colors (matching the pipeline column colors)
  const stageConfig = [
    { id: 'applied', title: 'Applied', color: 'bg-gray-500' },
    { id: 'phone_screen', title: 'Phone Screen', color: 'bg-blue-500' },
    { id: 'interview', title: 'Interview', color: 'bg-yellow-500' },
    { id: 'technical', title: 'Technical', color: 'bg-orange-500' },
    { id: 'final', title: 'Final', color: 'bg-indigo-500' },
    { id: 'offer', title: 'Offer', color: 'bg-purple-500' },
    { id: 'hired', title: 'Hired', color: 'bg-green-500' }
  ]

  // Calculate candidate counts for each stage
  const stageCounts = stageConfig.map(stage => {
    // Find matching column by checking if stage ID or title matches
    const matchingColumn = columns.find(col => 
      col.id.toLowerCase().includes(stage.id) || 
      col.title.toLowerCase().includes(stage.title.toLowerCase())
    )
    
    const count = matchingColumn 
      ? applicationsByColumn.get(matchingColumn.id)?.length || 0
      : 0
    
    return {
      ...stage,
      count,
      columnId: matchingColumn?.id
    }
  })

  // Calculate total candidates for proportional widths
  const totalCandidates = stageCounts.reduce((sum, stage) => sum + stage.count, 0)
  
  // If no candidates, show equal widths
  const getWidth = (count: number) => {
    if (totalCandidates === 0) return 20 // Equal 20% for each of 5 stages
    return Math.max(5, (count / totalCandidates) * 100) // Minimum 5% width
  }

  return (
    <div className="mb-6">
      {/* Progress Bar */}
      <div className="relative h-12 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
        <div className="flex h-full">
          {stageCounts.map((stage, index) => {
            const width = getWidth(stage.count)
            return (
              <div
                key={stage.id}
                className={`
                  ${stage.color} transition-all duration-300 ease-in-out
                  flex items-center justify-center text-white font-medium text-sm
                  ${index === 0 ? 'rounded-l-lg' : ''}
                  ${index === stageCounts.length - 1 ? 'rounded-r-lg' : ''}
                  ${stage.count > 0 ? 'opacity-100' : 'opacity-40'}
                `}
                style={{ width: `${width}%` }}
                title={`${stage.title}: ${stage.count} candidate${stage.count !== 1 ? 's' : ''}`}
              >
                {stage.count > 0 && (
                  <span className="font-semibold">
                    {stage.count}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Stage Labels */}
      <div className="flex mt-3">
        {stageCounts.map((stage, index) => {
          const width = getWidth(stage.count)
          return (
            <div
              key={`${stage.id}-label`}
              className="flex items-center justify-center"
              style={{ width: `${width}%` }}
            >
              <div className="text-center">
                <div className={`text-xs font-medium ${
                  stage.count > 0 ? 'text-slate-700' : 'text-slate-400'
                }`}>
                  {stage.title}
                </div>
                {stage.count > 0 && (
                  <div className="text-xs text-slate-500 mt-1">
                    {stage.count} candidate{stage.count !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}