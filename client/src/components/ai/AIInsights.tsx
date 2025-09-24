import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Brain, TrendingUp, Users, Target, AlertCircle, CheckCircle, Lightbulb, RefreshCw, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from '@/shared/hooks/use-toast'

interface AIRecommendation {
  id: string
  type: 'optimization' | 'risk' | 'opportunity' | 'action'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  impact: string
  actionItems: string[]
  confidence: number
}

interface AIInsight {
  summary: string | null
  recommendations: AIRecommendation[]
  metrics: {
    trendsAnalyzed: number
    patternsDetected: number
    recommendationsGenerated: number
  }
  lastUpdated: string
  hasData?: boolean
}

export function AIInsights() {
  const { currentOrgId } = useAuth()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const { data: insights, isLoading, error, refetch } = useQuery<AIInsight>({
    queryKey: ['/api/ai/insights', currentOrgId],
    queryFn: () => fetch(`/api/ai/insights?orgId=${currentOrgId}`).then(res => res.json()),
    enabled: !!currentOrgId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  })

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refetch()
      toast({
        title: "AI Insights Updated",
        description: "Smart recommendations have been refreshed with the latest data.",
      })
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Unable to update AI insights. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'optimization': return <TrendingUp className="h-4 w-4" />
      case 'risk': return <AlertCircle className="h-4 w-4" />
      case 'opportunity': return <Target className="h-4 w-4" />
      case 'action': return <CheckCircle className="h-4 w-4" />
      default: return <Lightbulb className="h-4 w-4" />
    }
  }

  if (isLoading) {
    return (
      <Card className="h-[600px]" data-component="ai-insights">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-[#264C99]" />
              <CardTitle className="text-lg">AI Insights</CardTitle>
              <Badge variant="secondary" className="text-xs">New</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[500px]">
            <div className="text-center space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#264C99] mx-auto"></div>
              <p className="text-sm text-muted-foreground">Analyzing recruitment data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="h-[600px]" data-component="ai-insights">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-[#264C99]" />
              <CardTitle className="text-lg">AI Insights</CardTitle>
              <Badge variant="secondary" className="text-xs">New</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[500px]">
            <div className="text-center space-y-3">
              <AlertTriangle className="h-8 w-8 text-orange-500 mx-auto" />
              <p className="text-sm text-muted-foreground">Unable to generate AI insights</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => refetch()}
                className="mt-2"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-[600px]" data-component="ai-insights">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-[#264C99]" />
            <CardTitle className="text-lg">AI Insights</CardTitle>
            <Badge variant="secondary" className="text-xs">New</Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        {insights && (
          <div className="text-sm text-muted-foreground">
            Last updated: {new Date(insights.lastUpdated).toLocaleString()}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {insights && insights.hasData === false ? (
          // Empty state for new organizations with no data
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
              <Brain className="w-8 h-8 text-blue-400" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="font-medium text-gray-900 dark:text-white">
                AI Insights Coming Soon
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm">
                As you add jobs, candidates, and build your recruitment pipeline, our AI will analyze your data to provide personalized insights and recommendations.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={() => window.location.href = '/jobs'} size="sm" className="bg-blue-600 hover:bg-blue-700">
                Create Your First Job
              </Button>
              <Button onClick={() => window.location.href = '/candidates'} variant="outline" size="sm">
                Add Candidates
              </Button>
            </div>
          </div>
        ) : insights && insights.summary ? (
          <>
            {/* AI Summary */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900 leading-relaxed">
                {insights.summary}
              </p>
            </div>

            {/* Metrics Overview */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-2 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold text-gray-900">{insights.metrics.trendsAnalyzed}</div>
                <div className="text-xs text-gray-600">Trends Analyzed</div>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold text-gray-900">{insights.metrics.patternsDetected}</div>
                <div className="text-xs text-gray-600">Patterns Found</div>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold text-gray-900">{insights.metrics.recommendationsGenerated}</div>
                <div className="text-xs text-gray-600">Recommendations</div>
              </div>
            </div>

            <Separator />

            {/* Recommendations */}
            <div>
              <h4 className="font-medium text-sm text-gray-900 mb-3">Smart Recommendations</h4>
              <ScrollArea className="h-[350px] pr-4">
                <div className="space-y-3">
                  {insights.recommendations.map((rec) => (
                    <div key={rec.id} className="border rounded-lg p-3 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(rec.type)}
                          <h5 className="font-medium text-sm">{rec.title}</h5>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={`text-xs ${getPriorityColor(rec.priority)}`}>
                            {rec.priority}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {rec.confidence}% confidence
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {rec.description}
                      </p>
                      
                      <div className="text-xs">
                        <span className="font-medium text-green-700">Expected Impact: </span>
                        <span className="text-green-600">{rec.impact}</span>
                      </div>
                      
                      {rec.actionItems.length > 0 && (
                        <div>
                          <span className="font-medium text-xs text-gray-700">Action Items:</span>
                          <ul className="mt-1 space-y-1">
                            {rec.actionItems.map((item, index) => (
                              <li key={index} className="text-xs text-gray-600 ml-3">
                                • {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-[500px]">
            <div className="text-center space-y-3">
              <Brain className="h-12 w-12 text-gray-400 mx-auto" />
              <h3 className="font-medium text-gray-900">No insights available</h3>
              <p className="text-sm text-gray-600 max-w-sm">
                AI insights will appear here once there's enough recruitment data to analyze.
              </p>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Check for insights
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}