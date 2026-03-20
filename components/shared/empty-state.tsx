import { cn } from "@/lib/utils";
import { FernEmptyState } from "@/components/decorative/fern-empty-state";
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
        "relative flex flex-col items-center justify-center gap-2 py-12 text-center",
        className,
      )}
    >
      {showIllustration && (
        <FernEmptyState className="mb-1 h-16 w-16" />
      )}
      <h3 className="text-lg font-medium text-bone">{title}</h3>
      {description && <p className="mt-1 text-sm text-stone">{description}</p>}
      {showSprout && <LoadingSprout className="mt-1" label="Loading suggestions" />}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
