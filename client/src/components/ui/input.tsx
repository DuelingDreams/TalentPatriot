import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-md border border-neutral-300 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 dark:placeholder:text-neutral-400 ring-offset-background px-4 py-2 text-base min-h-[44px] file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground transition-colors duration-150 hover:border-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tp-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-[Inter,sans-serif] aria-invalid:border-error aria-invalid:ring-error",
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
