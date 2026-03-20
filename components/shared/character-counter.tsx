"use client";

import { cn } from "@/lib/utils";

interface CharacterCounterProps {
  value: string;
  max: number;
  className?: string;
}

export function CharacterCounter({
  value,
  max,
  className,
}: CharacterCounterProps) {
  const remaining = max - value.length;
  const atLimit = remaining <= 0;

  return (
    <span
      className={cn(
        "text-xs tabular-nums",
        atLimit ? "text-dried-blood" : "text-fog",
        className,
      )}
      aria-live="polite"
    >
      {remaining} / {max}
    </span>
  );
}
