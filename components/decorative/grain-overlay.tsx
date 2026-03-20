import { cn } from "@/lib/utils";

interface GrainOverlayProps {
  className?: string;
  /** Opacity 0–1, default 0.04 (spec range 3–5%) */
  opacity?: number;
}

/**
 * Full-viewport film grain texture overlay.
 * Uses an SVG feTurbulence filter for a lightweight, resolution-independent
 * noise pattern. Purely decorative — hidden from assistive technology.
 */
export function GrainOverlay({ className, opacity = 0.04 }: GrainOverlayProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none fixed inset-0 z-50", className)}
      style={{ opacity }}
    >
      <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <filter id="grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves="3"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </div>
  );
}
