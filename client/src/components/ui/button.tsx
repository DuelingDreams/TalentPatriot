import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium ring-offset-background transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:-translate-y-px hover:shadow-[0_4px_8px_rgba(0,0,0,0.12)] active:translate-y-0 active:shadow-[0_2px_4px_rgba(0,0,0,0.08)]",
  {
    variants: {
      variant: {
        default: "bg-tp-primary text-white hover:bg-tp-accent",
        destructive:
          "bg-error text-white hover:bg-red-600",
        outline:
          "border border-tp-primary text-tp-primary bg-white hover:bg-tp-primary-light",
        secondary:
          "bg-tp-accent text-white hover:bg-tp-primary",
        ghost: "hover:bg-tp-card-surface text-tp-primary hover:shadow-none",
        link: "text-tp-accent underline-offset-4 hover:underline hover:text-tp-primary hover:shadow-none hover:translate-y-0",
      },
      size: {
        default: "h-11 px-6 py-3 text-sm min-h-[44px]",
        sm: "h-11 rounded-md px-4 text-sm min-h-[44px]",
        lg: "h-12 rounded-md px-8 text-base min-h-[48px]",
        icon: "h-10 w-10 min-h-[44px] min-w-[44px]",
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
