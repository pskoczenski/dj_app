import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-busy="true"
      className={cn(
        "rounded-md bg-dark-moss bg-[linear-gradient(90deg,var(--color-dark-moss),var(--color-forest-shadow),var(--color-dark-moss))] bg-[length:200%_100%] [animation:skeletonShimmer_1.5s_linear_infinite]",
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
