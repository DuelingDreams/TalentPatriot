import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-semantic-primary-700 text-white hover:bg-semantic-primary-600 active:bg-semantic-primary-900",
        destructive:
          "bg-status-danger-600 text-white hover:bg-status-danger-700 active:bg-status-danger-700",
        outline:
          "border border-neutral-300 text-neutral-700 bg-white hover:bg-neutral-50 hover:border-neutral-400 active:bg-neutral-100",
        secondary:
          "border border-neutral-300 text-neutral-700 bg-white hover:bg-neutral-50 hover:border-neutral-400 active:bg-neutral-100",
        success:
          "bg-status-success-600 text-white hover:bg-status-success-700 active:bg-status-success-700",
        ghost: "hover:bg-neutral-100 hover:text-neutral-900",
        link: "text-semantic-primary-600 underline-offset-4 hover:underline hover:text-semantic-primary-700",
      },
      size: {
        default: "h-10 px-5 py-2.5 text-sm min-h-[40px]",
        sm: "h-9 rounded-md px-4 text-sm",
        lg: "h-12 rounded-md px-8 text-base min-h-[48px]",
        icon: "h-10 w-10 min-h-[40px] min-w-[40px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
