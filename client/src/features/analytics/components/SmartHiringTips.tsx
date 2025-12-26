import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Lightbulb, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'
import { Link } from 'wouter'

interface SmartHiringTipsProps {
  bottleneckStage?: string
  bottleneckDays?: number
  loading?: boolean
}

export function SmartHiringTips({ 
  bottleneckStage = 'Screening',
  bottleneckDays = 5,
  loading = false 
}: SmartHiringTipsProps) {
  const recommendations = [
    {
      id: 'automate-screening',
      title: 'Consider automating initial assessments',
      description: 'Add pre-screening questions or skills assessments to filter candidates before manual review.'
    },
    {
      id: 'additional-sourcing',
      title: 'Expand sourcing channels',
      description: 'Try LinkedIn recruiting, employee referrals, or specialized job boards for your industry.'
    },
    {
      id: 'pipeline-optimization',
      title: 'Optimize interview scheduling',
      description: 'Use calendar booking links to reduce back-and-forth scheduling delays.'
    }
  ]

  if (loading) {
    return (
      <Card className="h-[300px]" data-testid="smart-hiring-tips">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5 text-orange-500" />
            <CardTitle className="text-lg">Smart Hiring Tips</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 animate-pulse rounded w-3/4" />
            <div className="h-4 bg-gray-200 animate-pulse rounded w-1/2" />
            <div className="flex gap-2 mt-4">
              <div className="h-8 bg-gray-200 animate-pulse rounded w-32" />
              <div className="h-8 bg-gray-200 animate-pulse rounded w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card data-testid="smart-hiring-tips">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          <Lightbulb className="h-5 w-5 text-orange-500" />
          <CardTitle className="text-lg">Smart Hiring Tips</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Insight */}
        <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-orange-900 font-medium mb-1">
                Pipeline Bottleneck Detected
              </p>
              <p className="text-sm text-orange-800" data-testid="bottleneck-description">
                {bottleneckStage} stage has the longest bottleneck (avg. {bottleneckDays} days). 
                Consider automating initial assessments or adding sourcing channels.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="default" 
            size="sm" 
            className="bg-gray-900 hover:bg-gray-800 text-white"
            data-testid="view-recommendations-btn"
            onClick={() => {
              // TODO: Implement recommendations modal or page
              console.log('View Recommendations clicked')
            }}
          >
            View Recommendations
          </Button>
          <Link href="/pipeline">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full sm:w-auto"
              data-testid="see-pipeline-btn"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              See Pipeline
            </Button>
          </Link>
        </div>

        {/* Additional Tips */}
        <div className="pt-2 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Quick Tips</h4>
          <div className="space-y-2">
            {recommendations.slice(0, 2).map((tip) => (
              <div key={tip.id} className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{tip.title}</p>
                  <p className="text-sm text-gray-600">{tip.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}