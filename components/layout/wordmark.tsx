import { cn } from "@/lib/utils";

/**
 * Wordmark per design spec 10 — disco-dot mark + MIRRORBALL (uppercase styling on label).
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-mb-text-primary",
        className,
      )}
    >
      <svg
        width={20}
        height={20}
        viewBox="0 0 20 20"
        fill="currentColor"
        className="shrink-0"
        aria-hidden="true"
      >
        <circle cx="7" cy="5" r="1.1" />
        <circle cx="13" cy="8" r="1.4" />
        <circle cx="6" cy="13" r="1.2" />
        <circle cx="14" cy="15" r="1" />
      </svg>
      <span className="font-display font-semibold uppercase tracking-[0.14em] select-none">
        Mirrorball
      </span>
    </span>
  );
}
