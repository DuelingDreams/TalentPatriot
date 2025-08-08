import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action, 
  className = '' 
}: EmptyStateProps) {
  return (
    <Card className={`rounded-2xl shadow-sm ${className}`}>
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="w-16 h-16 bg-contrast rounded-2xl flex items-center justify-center mb-6">
          <Icon className="w-8 h-8 text-primary/60" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {title}
        </h3>
        <p className="text-base text-gray-700 mb-6 max-w-md">
          {description}
        </p>
        {action && (
          <Button 
            onClick={action.onClick}
            className="bg-primary text-white py-2 px-4 rounded-2xl shadow-sm hover:shadow-lg transition-shadow"
          >
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}