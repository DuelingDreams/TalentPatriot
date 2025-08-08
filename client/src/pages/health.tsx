import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Clock } from 'lucide-react'

interface HealthCheck {
  name: string
  status: 'success' | 'error' | 'loading'
  data?: any
  error?: string
  duration?: number
}

export default function HealthPage() {
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([
    { name: 'API Health Check', status: 'loading' },
    { name: 'Database Connection', status: 'loading' }
  ])

  useEffect(() => {
    const runHealthChecks = async () => {
      // 1. API Health Check
      const apiStart = performance.now()
      try {
        const apiResponse = await fetch('/api/health')
        const apiData = await apiResponse.json()
        const apiDuration = Math.round(performance.now() - apiStart)
        
        setHealthChecks(prev => prev.map(check => 
          check.name === 'API Health Check' 
            ? { ...check, status: 'success', data: apiData, duration: apiDuration }
            : check
        ))
      } catch (error) {
        const apiDuration = Math.round(performance.now() - apiStart)
        setHealthChecks(prev => prev.map(check => 
          check.name === 'API Health Check' 
            ? { ...check, status: 'error', error: String(error), duration: apiDuration }
            : check
        ))
      }

      // 2. Database Connection Check
      const dbStart = performance.now()
      try {
        const { data, error } = await supabase.from('jobs').select('id').limit(1)
        const dbDuration = Math.round(performance.now() - dbStart)
        
        if (error) {
          setHealthChecks(prev => prev.map(check => 
            check.name === 'Database Connection' 
              ? { ...check, status: 'error', error: error.message, duration: dbDuration }
              : check
          ))
        } else {
          setHealthChecks(prev => prev.map(check => 
            check.name === 'Database Connection' 
              ? { 
                  ...check, 
                  status: 'success', 
                  data: { querySuccess: true, resultCount: data?.length || 0 },
                  duration: dbDuration 
                }
              : check
          ))
        }
      } catch (error) {
        const dbDuration = Math.round(performance.now() - dbStart)
        setHealthChecks(prev => prev.map(check => 
          check.name === 'Database Connection' 
            ? { ...check, status: 'error', error: String(error), duration: dbDuration }
            : check
        ))
      }
    }

    runHealthChecks()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'loading':
        return <Clock className="h-5 w-5 text-yellow-500 animate-pulse" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      success: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800',
      loading: 'bg-yellow-100 text-yellow-800'
    }
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">System Health Check</h1>
          <p className="text-gray-600">Monitor the health status of API endpoints and database connections</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {healthChecks.map((check) => (
            <Card key={check.name} className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-3">
                    {getStatusIcon(check.status)}
                    {check.name}
                  </span>
                  <Badge className={getStatusBadge(check.status)}>
                    {check.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {check.duration && (
                  <p className="text-sm text-gray-500 mb-3">
                    Response time: {check.duration}ms
                  </p>
                )}

                {check.status === 'success' && check.data && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-800 mb-2">Success Response:</h4>
                    <pre className="text-sm text-green-700 overflow-auto">
                      {JSON.stringify(check.data, null, 2)}
                    </pre>
                  </div>
                )}

                {check.status === 'error' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-medium text-red-800 mb-2">Error:</h4>
                    <p className="text-sm text-red-700">{check.error}</p>
                  </div>
                )}

                {check.status === 'loading' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-700">Running health check...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <strong>Timestamp:</strong><br />
                  {new Date().toISOString()}
                </div>
                <div>
                  <strong>User Agent:</strong><br />
                  {navigator.userAgent.split(' ')[0]}
                </div>
                <div>
                  <strong>Screen:</strong><br />
                  {window.screen.width}x{window.screen.height}
                </div>
                <div>
                  <strong>Viewport:</strong><br />
                  {window.innerWidth}x{window.innerHeight}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-4 text-sm text-gray-500 text-center">
          <p>This page tests both API connectivity and database access for system verification.</p>
        </div>
      </div>
    </div>
  )
}