import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-semantic-primary-500 focus:ring-offset-2 font-[Inter,sans-serif]",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-semantic-primary-700 text-white hover:bg-semantic-primary-600",
        secondary:
          "border-transparent bg-semantic-primary-50 text-semantic-primary-600 hover:bg-semantic-primary-100",
        destructive:
          "border-transparent bg-status-danger-500 text-white hover:bg-status-danger-600",
        outline: "text-neutral-900 border-neutral-300",
        success:
          "border-transparent bg-status-success-100 text-status-success-700",
        warning:
          "border-transparent bg-status-warning-100 text-status-warning-700",
        danger:
          "border-transparent bg-status-danger-100 text-status-danger-700",
        info:
          "border-transparent bg-status-info-100 text-status-info-700",
        neutral:
          "border-transparent bg-neutral-100 text-neutral-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }