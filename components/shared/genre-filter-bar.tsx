"use client";

import { useMemo } from "react";
import { useGenres } from "@/hooks/use-genres";
import { Button } from "@/components/ui/button";
import { GenreMultiSelectPopover } from "@/components/shared/genre-multi-select-popover";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const VISIBLE_CHIP_COUNT = 12;

export type GenreFilterBarProps = {
  selectedGenreIds: string[];
  onChange: (genreIds: string[]) => void;
  className?: string;
};

export function GenreFilterBar({
  selectedGenreIds,
  onChange,
  className,
}: GenreFilterBarProps) {
  const { genres, loading } = useGenres();

  const sorted = useMemo(
    () => [...genres].sort((a, b) => a.name.localeCompare(b.name)),
    [genres],
  );

  const visibleGenres = useMemo(
    () => sorted.slice(0, VISIBLE_CHIP_COUNT),
    [sorted],
  );

  function toggle(id: string) {
    const next = selectedGenreIds.includes(id)
      ? selectedGenreIds.filter((x) => x !== id)
      : [...selectedGenreIds, id];
    onChange(next);
  }

  function renderChip(g: { id: string; name: string }, key: string) {
    const selected = selectedGenreIds.includes(g.id);
    return (
      <Button
        key={key}
        type="button"
        size="sm"
        variant="outline"
        aria-pressed={selected}
        onClick={() => toggle(g.id)}
        className={cn(
          "h-auto min-h-9 shrink-0 rounded-full border px-[14px] py-[7px] text-xs font-normal motion-safe:transition-colors",
          selected
            ? "border-mb-turquoise-mid bg-mb-turquoise-deep text-mb-turquoise-ice hover:border-mb-turquoise-mid hover:bg-mb-turquoise-deep hover:text-mb-turquoise-ice"
            : "border-mb-border-soft bg-transparent text-mb-text-secondary hover:border-mb-turquoise-mid hover:bg-transparent hover:text-mb-text-primary",
        )}
      >
        {g.name}
      </Button>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div
        className="flex flex-wrap items-center gap-2 sm:flex-nowrap"
        role="group"
        aria-label="Filter by genre"
      >
        {selectedGenreIds.length > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 shrink-0 text-mb-turquoise-pale hover:text-mb-text-primary"
            onClick={() => onChange([])}
            aria-label="Clear all genre filters"
          >
            Clear
          </Button>
        ) : null}

        {loading ? (
          <div className="flex gap-2 overflow-x-auto pb-0.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-20 shrink-0 rounded-full" />
            ))}
          </div>
        ) : (
          <div className="-mx-1 flex min-h-9 min-w-0 flex-1 items-center gap-2 overflow-x-auto px-1 pb-0.5 [scrollbar-width:thin]">
            {visibleGenres.map((g) => renderChip(g, g.id))}
            <GenreMultiSelectPopover
              selectedGenreIds={selectedGenreIds}
              onChange={onChange}
              idleLabel="+ More"
              compact
            />
          </div>
        )}
      </div>
    </div>
  );
}
