import { LoadingSprout } from "@/components/shared/loading-sprout";
import { cn } from "@/lib/utils";

interface LoadingBlockProps {
  className?: string;
  message?: string;
}

export function LoadingBlock({
  className,
  message = "Gathering events...",
}: LoadingBlockProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("flex flex-col items-center justify-center gap-3 py-10", className)}
    >
      <LoadingSprout />
      <p className="text-sm text-fog">{message}</p>
    </div>
  );
}
