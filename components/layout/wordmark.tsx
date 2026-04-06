import { cn } from "@/lib/utils";

/**
 * Text-only wordmark per design spec 10 — displays as MIRRORBALL via uppercase styling.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "font-display font-semibold uppercase tracking-[0.14em] text-mb-text-primary select-none",
        className,
      )}
    >
      Mirrorball
    </span>
  );
}
