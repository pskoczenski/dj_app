import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-busy="true"
      className={cn(
        "rounded-md bg-mb-surface-2 bg-[linear-gradient(90deg,var(--mb-surface-2),var(--mb-surface-1),var(--mb-surface-2))] bg-[length:200%_100%] [animation:skeletonShimmer_1.5s_linear_infinite]",
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
