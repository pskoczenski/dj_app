import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-default border border-root-line bg-dark-moss px-4 py-3 text-base text-bone transition-colors outline-none placeholder:text-fog hover:border-sage-edge focus-visible:border-fern focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-deep-loam disabled:opacity-50 aria-invalid:border-dried-blood aria-invalid:ring-3 aria-invalid:ring-dried-blood/20 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
