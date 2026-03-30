import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(function Input({ className, type, ...props }, ref) {
  return (
    <InputPrimitive
      ref={ref}
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-default border border-root-line bg-dark-moss px-4 py-3 text-base text-bone transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-bone placeholder:text-fog hover:border-sage-edge focus-visible:border-fern focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-deep-loam disabled:opacity-50 aria-invalid:border-dried-blood aria-invalid:ring-3 aria-invalid:ring-dried-blood/20 md:text-sm",
        className
      )}
      {...props}
    />
  )
})

export { Input }
