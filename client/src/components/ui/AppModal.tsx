import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { Button } from './button'
import { Card, CardContent, CardHeader, CardTitle } from './card'

interface AppModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

export function AppModal({ open, onClose, title, children, footer, className = "" }: AppModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (open) {
      // Store the previously focused element
      previousActiveElement.current = document.activeElement as HTMLElement
      
      // Prevent body scrolling
      document.body.style.overflow = 'hidden'
      
      // Focus the modal
      setTimeout(() => {
        modalRef.current?.focus()
      }, 0)
    } else {
      // Restore body scrolling
      document.body.style.overflow = ''
      
      // Restore focus to previously focused element
      if (previousActiveElement.current) {
        previousActiveElement.current.focus()
      }
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }

    const handleFocusTrap = (e: KeyboardEvent) => {
      if (!open || e.key !== 'Tab') return

      const modal = modalRef.current
      if (!modal) return

      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus()
          e.preventDefault()
        }
      }
    }

    if (open) {
      document.addEventListener('keydown', handleEscape)
      document.addEventListener('keydown', handleFocusTrap)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('keydown', handleFocusTrap)
    }
  }, [open, onClose])

  if (!open) return null

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return createPortal(
    <>
      {/* Overlay with strong dimming */}
      <div 
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-[1px]"
        onClick={handleOverlayClick}
      />
      
      {/* Dialog Container */}
      <div className="fixed inset-0 z-[101] overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <Card 
            ref={modalRef}
            className={`relative transform bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl transition-all max-h-[90vh] overflow-y-auto w-full sm:max-w-lg md:max-w-2xl lg:max-w-4xl ${className}`}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 px-6 pt-6">
              <CardTitle id="modal-title" className="text-lg font-bold leading-tight text-slate-900 dark:text-slate-100">
                {title}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            
            <CardContent className="pt-0 px-6 pb-6">
              {children}
            </CardContent>
            
            {footer && (
              <div className="bg-slate-50 dark:bg-slate-800 px-6 py-4 sm:flex sm:flex-row-reverse">
                {footer}
              </div>
            )}
          </Card>
        </div>
      </div>
    </>,
    document.body
  )
}