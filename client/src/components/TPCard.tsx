import * as React from 'react'
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const tpCardVariants = cva(
  'rounded-2xl p-6 transition-all duration-300 border-2 border-transparent',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white hover:border-accent hover:shadow-lg',
        accent: 'bg-accent text-primary hover:border-primary hover:shadow-lg',
        light: 'bg-white text-primary hover:border-accent hover:shadow-md',
      },
    },
    defaultVariants: {
      variant: 'light',
    },
  }
)

export interface TPCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof tpCardVariants> {}

const TPCard = React.forwardRef<HTMLDivElement, TPCardProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(tpCardVariants({ variant, className }))}
        {...props}
      />
    )
  }
)

TPCard.displayName = 'TPCard'

export { TPCard, tpCardVariants }