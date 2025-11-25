import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#264C99] focus:ring-offset-2 font-[Inter,sans-serif]",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#1F3A5F] text-white hover:bg-[#264C99]",
        secondary:
          "border-transparent bg-[#E6F0FF] text-[#264C99] hover:bg-[#d6e5ff]",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-[#1A1A1A] border-[#E6F0FF]",
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