import { cn } from "@/lib/utils";
import { LoadingSprout } from "@/components/shared/loading-sprout";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  showIllustration?: boolean;
  showSprout?: boolean;
}

export function EmptyState({
  title,
  description,
  action,
  className,
  showIllustration = true,
  showSprout = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center gap-2 py-16 text-center",
        className,
      )}
    >
      {showIllustration ? <div className="mb-2 h-16 w-16 shrink-0" aria-hidden /> : null}
      <h3 className="heading-subtle text-xl font-medium text-bone">{title}</h3>
      {description && <p className="mt-1 text-sm leading-relaxed text-stone">{description}</p>}
      {showSprout && <LoadingSprout className="mt-1" label="Loading suggestions" />}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
