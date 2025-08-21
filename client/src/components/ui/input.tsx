import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-md border border-[#D1E7FF] bg-white dark:bg-slate-900 text-[#0F1419] dark:text-slate-100 placeholder:text-[#3D4852] dark:placeholder:text-slate-400 ring-offset-background px-4 py-2 text-base min-h-[44px] file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#264C99] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition font-[Inter,sans-serif] aria-invalid:border-red-500 aria-invalid:ring-red-500",
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
