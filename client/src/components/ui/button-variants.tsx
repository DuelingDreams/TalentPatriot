import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-not-allowed",
  {
    variants: {
      variant: {
        default: "bg-primary text-white shadow-sm hover:shadow-lg",
        secondary: "border border-primary text-primary bg-white hover:bg-primary/5",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "py-2 px-4 text-sm",
        sm: "py-1.5 px-3 text-xs",
        lg: "py-3 px-6 text-base",
        icon: "h-10 w-10",
      },
      radius: {
        default: "rounded-2xl",
        sm: "rounded-lg",
        full: "rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default", 
      radius: "default",
    },
  }
)

export interface ButtonVariantProps extends VariantProps<typeof buttonVariants> {}

export { buttonVariants }