import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[96px] w-full rounded-md border border-neutral-300 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 dark:placeholder:text-neutral-400 ring-offset-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tp-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition font-[Inter,sans-serif] aria-invalid:border-error aria-invalid:ring-error",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }