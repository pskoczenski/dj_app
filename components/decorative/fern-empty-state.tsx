import { cn } from "@/lib/utils";
import { BOTANICAL_OPACITY } from "@/lib/design/botanical-guidelines";

interface FernEmptyStateProps {
  className?: string;
  opacity?: number;
}

export function FernEmptyState({
  className,
  opacity = BOTANICAL_OPACITY.fernEmptyState.default,
}: FernEmptyStateProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 220 220"
      className={cn("pointer-events-none h-40 w-40 text-fern", className)}
      style={{ opacity }}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
    >
      <path d="M110 20 C110 80, 110 150, 110 200" stroke="currentColor" strokeWidth="2" />
      <path d="M110 60 C90 52, 78 40, 70 24" stroke="currentColor" strokeWidth="2" />
      <path d="M110 80 C88 72, 72 58, 60 42" stroke="currentColor" strokeWidth="2" />
      <path d="M110 100 C88 95, 70 84, 54 70" stroke="currentColor" strokeWidth="2" />
      <path d="M110 120 C132 112, 148 98, 160 82" stroke="currentColor" strokeWidth="2" />
      <path d="M110 140 C132 132, 150 118, 166 102" stroke="currentColor" strokeWidth="2" />
      <path d="M110 160 C130 152, 146 142, 160 130" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
