import { cn } from "@/lib/utils";

interface LoadingSproutProps {
  className?: string;
  label?: string;
}

export function LoadingSprout({
  className,
  label = "Loading",
}: LoadingSproutProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn("inline-flex items-end gap-1.5", className)}
    >
      <span
        className="h-2 w-2 rounded-full bg-fern opacity-40 [animation:sproutPulse_1.5s_var(--ease-spring)_infinite]"
        style={{ animationDelay: "0ms" }}
      />
      <span
        className="h-3 w-2 rounded-full bg-fern opacity-40 [animation:sproutPulse_1.5s_var(--ease-spring)_infinite]"
        style={{ animationDelay: "150ms" }}
      />
      <span
        className="h-2 w-2 rounded-full bg-fern opacity-40 [animation:sproutPulse_1.5s_var(--ease-spring)_infinite]"
        style={{ animationDelay: "300ms" }}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}
