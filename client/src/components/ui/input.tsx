import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-md border-2 border-neutral-200 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 dark:placeholder:text-neutral-400 ring-offset-background px-4 py-2 text-base min-h-[44px] file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground transition-all duration-200 ease-out hover:border-neutral-400 focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] focus:outline-none focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 font-[Inter,sans-serif] aria-invalid:border-error aria-invalid:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
