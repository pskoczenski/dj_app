import { cn } from "@/lib/utils";

interface LithographWavesProps {
  className?: string;
  /** Opacity 0–1, default 0.04 (spec range 3–5%) */
  opacity?: number;
}

/**
 * Subtle repeating organic wave pattern in Fern tones.
 * Uses an inline SVG pattern for zero-dependency rendering.
 * Purely decorative — hidden from assistive technology.
 */
export function LithographWaves({
  className,
  opacity = 0.04,
}: LithographWavesProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 z-0 overflow-hidden", className)}
      style={{ opacity }}
    >
      <svg
        className="h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <defs>
          <pattern
            id="litho-waves"
            x="0"
            y="0"
            width="200"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M0 20 Q50 0 100 20 T200 20"
              fill="none"
              stroke="#4A7C59"
              strokeWidth="1.5"
            />
            <path
              d="M0 30 Q50 10 100 30 T200 30"
              fill="none"
              stroke="#4A7C59"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#litho-waves)" />
      </svg>
    </div>
  );
}
