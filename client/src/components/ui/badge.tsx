import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-tp-primary focus:ring-offset-2 font-[Inter,sans-serif]",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-tp-primary text-white hover:bg-tp-accent",
        secondary:
          "border-transparent bg-tp-primary-light text-tp-accent hover:opacity-80",
        destructive:
          "border-transparent bg-error text-white hover:opacity-80",
        outline: "text-neutral-800 border-tp-primary-light",
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