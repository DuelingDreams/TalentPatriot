import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[96px] w-full rounded-md border border-[#D1E7FF] bg-white dark:bg-slate-900 text-[#0F1419] dark:text-slate-100 placeholder:text-[#3D4852] dark:placeholder:text-slate-400 ring-offset-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#264C99] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition font-[Inter,sans-serif] aria-invalid:border-red-500 aria-invalid:ring-red-500",
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