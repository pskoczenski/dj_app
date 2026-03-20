import { cn } from "@/lib/utils";
import { BOTANICAL_OPACITY } from "@/lib/design/botanical-guidelines";

interface CornerVineAccentProps {
  className?: string;
  corner?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  opacity?: number;
}

const cornerTransforms: Record<NonNullable<CornerVineAccentProps["corner"]>, string> = {
  "top-left": "",
  "top-right": "scale(-1,1) translate(-120,0)",
  "bottom-left": "scale(1,-1) translate(0,-120)",
  "bottom-right": "scale(-1,-1) translate(-120,-120)",
};

export function CornerVineAccent({
  className,
  corner = "top-left",
  opacity = BOTANICAL_OPACITY.cornerVineAccent.default,
}: CornerVineAccentProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 120 120"
      className={cn("pointer-events-none h-12 w-12 text-fern", className)}
      style={{ opacity }}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
    >
      <g transform={cornerTransforms[corner]}>
        <path d="M8 112 C10 70, 24 36, 58 12" stroke="currentColor" strokeWidth="2" />
        <path d="M26 88 C40 84, 54 74, 62 60" stroke="currentColor" strokeWidth="2" />
        <path d="M42 66 C54 62, 66 52, 72 40" stroke="currentColor" strokeWidth="2" />
      </g>
    </svg>
  );
}
