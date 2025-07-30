import * as React from 'react'
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const tpButtonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white hover:bg-accent hover:text-primary',
        secondary: 'bg-accent text-primary hover:bg-primary hover:text-white',
        outline: 'border-2 border-primary text-primary bg-white hover:bg-primary hover:text-white',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
        lg: 'h-11 px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
)

export interface TPButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof tpButtonVariants> {
  asChild?: boolean
}

const TPButton = React.forwardRef<HTMLButtonElement, TPButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(tpButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)

TPButton.displayName = 'TPButton'

export { TPButton, tpButtonVariants }