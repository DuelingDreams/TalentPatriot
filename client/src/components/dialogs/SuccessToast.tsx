
import React from 'react'
import { useToast } from '@/shared/hooks/use-toast'
import { CheckCircle, ArrowRight, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SuccessToastProps {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  showViewAction?: boolean
  onView?: () => void
}

export function showEnhancedSuccess({
  title,
  description,
  actionLabel,
  onAction,
  showViewAction,
  onView
}: SuccessToastProps) {
  const { toast } = useToast()
  
  toast({
    title: title,
    description: (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p>{description}</p>
        </div>
        <div className="flex gap-2">
          {showViewAction && (
            <Button size="sm" variant="outline" onClick={onView}>
              <Eye className="w-4 h-4 mr-1" />
              View
            </Button>
          )}
          {actionLabel && (
            <Button size="sm" onClick={onAction}>
              {actionLabel}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    ),
    duration: 5000,
  })
}
