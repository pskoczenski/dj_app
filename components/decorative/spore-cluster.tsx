import { cn } from "@/lib/utils";
import { BOTANICAL_OPACITY } from "@/lib/design/botanical-guidelines";

interface SporeClusterProps {
  className?: string;
  tone?: "fern" | "lichen";
  opacity?: number;
}

export function SporeCluster({
  className,
  tone = "lichen",
  opacity = BOTANICAL_OPACITY.sporeCluster.default,
}: SporeClusterProps) {
  const color = tone === "lichen" ? "text-lichen-gold" : "text-fern";

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 64 64"
      className={cn("pointer-events-none h-8 w-8", color, className)}
      style={{ opacity }}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
    >
      <circle cx="16" cy="34" r="4" fill="currentColor" />
      <circle cx="30" cy="22" r="5" fill="currentColor" />
      <circle cx="44" cy="36" r="3.5" fill="currentColor" />
      <circle cx="28" cy="44" r="3" fill="currentColor" />
    </svg>
  );
}
