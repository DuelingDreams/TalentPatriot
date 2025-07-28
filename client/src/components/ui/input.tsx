import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-base text-[#1A1A1A] ring-offset-background min-h-[44px] file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-[#5C667B]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#264C99] focus-visible:border-[#264C99] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-100 transition-all duration-200",
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
