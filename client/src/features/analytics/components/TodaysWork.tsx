import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from 'wouter'

interface TodaysWorkProps {
  candidatesNeedingReview?: number
  interviewsToday?: number
  loading?: boolean
}

export function TodaysWork({ 
  candidatesNeedingReview = 0, 
  interviewsToday = 0, 
  loading = false 
}: TodaysWorkProps) {
  const workItems = [
    {
      id: 'review-candidates',
      title: 'Review Candidates',
      count: candidatesNeedingReview,
      href: '/candidates?filter=pending_review',
    },
    {
      id: 'interviews-today',
      title: 'Interviews Today',
      count: interviewsToday,
      href: '/calendar',
    },
  ]

  return (
    <Card data-testid="todays-work-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-gray-900">
          Today's Work
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex divide-x divide-gray-200">
          {workItems.map((item) => (
            <Link 
              key={item.id} 
              href={item.href}
              className="flex-1 px-4 first:pl-0 last:pr-0"
            >
              <div 
                className="flex items-center justify-between py-2 cursor-pointer hover:opacity-80 transition-opacity"
                data-testid={`work-item-${item.id}`}
              >
                <span className="text-sm text-gray-700">{item.title}</span>
                {loading ? (
                  <div className="h-5 w-6 bg-gray-200 animate-pulse rounded" />
                ) : (
                  <span 
                    className="text-sm font-semibold text-gray-900"
                    data-testid={`work-count-${item.id}`}
                  >
                    {item.count}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
