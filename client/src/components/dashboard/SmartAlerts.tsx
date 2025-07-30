import { useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  AlertTriangle, 
  Clock, 
  UserCheck, 
  Calendar,
  X,
  ChevronRight,
  Bell
} from 'lucide-react'
import { Link } from 'wouter'

interface AlertItem {
  id: string
  type: 'urgent' | 'warning' | 'info'
  title: string
  description: string
  action?: {
    label: string
    href: string
  }
  dismissible?: boolean
}

interface SmartAlertsProps {
  alerts?: AlertItem[]
  onDismiss?: (alertId: string) => void
}

export function SmartAlerts({ alerts, onDismiss }: SmartAlertsProps) {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())

  // Use provided alerts or empty array for real users
  const displayAlerts: AlertItem[] = alerts || []

  const handleDismiss = (alertId: string) => {
    setDismissedAlerts(prev => new Set(Array.from(prev).concat(alertId)))
    onDismiss?.(alertId)
  }

  const visibleAlerts = displayAlerts.filter((alert: AlertItem) => !dismissedAlerts.has(alert.id))

  if (visibleAlerts.length === 0) {
    return null
  }

  const getAlertStyle = (type: string) => {
    switch (type) {
      case 'urgent':
        return 'border-red-200 bg-red-50/50'
      case 'warning':
        return 'border-orange-200 bg-orange-50/50'
      case 'info':
        return 'border-blue-200 bg-blue-50/50'
      default:
        return 'border-gray-200 bg-gray-50/50'
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'urgent':
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      case 'warning':
        return <Clock className="w-4 h-4 text-orange-600" />
      case 'info':
        return <Bell className="w-4 h-4 text-blue-600" />
      default:
        return <Bell className="w-4 h-4 text-gray-600" />
    }
  }

  const getAlertBadge = (type: string) => {
    switch (type) {
      case 'urgent':
        return <Badge variant="destructive" className="text-xs">Urgent</Badge>
      case 'warning':
        return <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">Warning</Badge>
      case 'info':
        return <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">Info</Badge>
      default:
        return null
    }
  }

  return (
    <div className="space-y-3">
      {visibleAlerts.map((alert: AlertItem) => (
        <Alert key={alert.id} className={`${getAlertStyle(alert.type)} border`}>
          <div className="flex items-start gap-3">
            {getAlertIcon(alert.type)}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-[#1A1A1A] text-sm">{alert.title}</h4>
                {getAlertBadge(alert.type)}
              </div>
              <AlertDescription className="text-[#5C667B] text-sm">
                {alert.description}
              </AlertDescription>
              {alert.action && (
                <div className="mt-2">
                  <Button asChild variant="outline" size="sm" className="h-7 text-xs">
                    <Link href={alert.action.href}>
                      {alert.action.label}
                      <ChevronRight className="w-3 h-3 ml-1" />
                    </Link>
                  </Button>
                </div>
              )}
            </div>
            {alert.dismissible && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-black/5"
                onClick={() => handleDismiss(alert.id)}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </Alert>
      ))}
    </div>
  )
}