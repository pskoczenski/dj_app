import { cn } from "@/lib/utils";
import { BOTANICAL_OPACITY } from "@/lib/design/botanical-guidelines";

interface RootLineDividerProps {
  className?: string;
  opacity?: number;
}

export function RootLineDivider({
  className,
  opacity = BOTANICAL_OPACITY.rootLineDivider.default,
}: RootLineDividerProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1200 48"
      className={cn("pointer-events-none h-6 w-full text-fern", className)}
      style={{ opacity }}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
    >
      <path
        d="M0 24 C120 6, 240 42, 360 24 C480 6, 600 42, 720 24 C840 6, 960 42, 1080 24 C1120 18, 1160 22, 1200 24"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="240" cy="24" r="3" fill="currentColor" />
      <circle cx="600" cy="24" r="3" fill="currentColor" />
      <circle cx="960" cy="24" r="3" fill="currentColor" />
    </svg>
  );
}
