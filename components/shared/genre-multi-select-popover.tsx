"use client";

import { useMemo, useState } from "react";
import { useGenres } from "@/hooks/use-genres";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown } from "lucide-react";

export type GenreMultiSelectPopoverProps = {
  selectedGenreIds: string[];
  onChange: (genreIds: string[]) => void;
  /** Visible label when nothing is selected (e.g. "Genres", "+ More"). */
  idleLabel?: string;
  /** Classes for the trigger button (size, shape). */
  triggerClassName?: string;
  /** Popover content width alignment */
  align?: "start" | "center" | "end";
  /** Chip-style trigger (e.g. "+ More" in a pill row) */
  compact?: boolean;
  /** Associates a visible `<label htmlFor={triggerId}>`. */
  triggerId?: string;
  className?: string;
};

function triggerSummary(
  sorted: { id: string; name: string }[],
  selectedGenreIds: string[],
  idleLabel: string,
): string {
  if (selectedGenreIds.length === 0) return idleLabel;
  const names = selectedGenreIds
    .map((id) => sorted.find((g) => g.id === id)?.name)
    .filter((n): n is string => Boolean(n));
  if (names.length === 0) return idleLabel;
  if (names.length === 1) return names[0]!;
  if (names.length === 2) return `${names[0]!}, ${names[1]!}`;
  return `${names.length} genres`;
}

export function GenreMultiSelectPopover({
  selectedGenreIds,
  onChange,
  idleLabel = "Genres",
  triggerClassName,
  align = "start",
  compact = false,
  triggerId,
  className,
}: GenreMultiSelectPopoverProps) {
  const { genres, loading } = useGenres();
  const [open, setOpen] = useState(false);
  const [popoverQuery, setPopoverQuery] = useState("");

  const sorted = useMemo(
    () => [...genres].sort((a, b) => a.name.localeCompare(b.name)),
    [genres],
  );

  const popoverFiltered = useMemo(() => {
    const q = popoverQuery.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((g) => g.name.toLowerCase().includes(q));
  }, [sorted, popoverQuery]);

  const summary = compact
    ? selectedGenreIds.length > 0
      ? `${idleLabel} (${selectedGenreIds.length})`
      : idleLabel
    : triggerSummary(sorted, selectedGenreIds, idleLabel);

  function toggle(id: string) {
    const next = selectedGenreIds.includes(id)
      ? selectedGenreIds.filter((x) => x !== id)
      : [...selectedGenreIds, id];
    onChange(next);
  }

  return (
    <div className={cn("inline-flex flex-col gap-1", className)}>
      <Popover
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setPopoverQuery("");
        }}
      >
        {loading ? (
          <Skeleton
            className={cn("h-9 w-40 rounded-default", triggerClassName)}
            aria-hidden
          />
        ) : (
          <PopoverTrigger
            id={triggerId}
            type="button"
            aria-label={`${summary}. Open genre picker.`}
            aria-haspopup="dialog"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "h-9 justify-between gap-2 px-3 font-normal",
              compact
                ? "min-w-0 shrink-0 rounded-full text-xs"
                : "min-w-[10rem]",
              triggerClassName,
            )}
          >
            <span className="truncate">{summary}</span>
            {!compact ? (
              <ChevronDown className="size-4 shrink-0 opacity-70" aria-hidden />
            ) : null}
          </PopoverTrigger>
        )}
        <PopoverContent
          align={align}
          className="flex w-[min(100vw-2rem,22rem)] flex-col gap-2 p-3"
        >
          <Input
            placeholder="Search genres…"
            value={popoverQuery}
            onChange={(e) => setPopoverQuery(e.target.value)}
            aria-label="Search genres in list"
            className="text-sm"
          />
          {selectedGenreIds.length > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 justify-start px-2 text-xs text-fern"
              onClick={() => onChange([])}
            >
              Clear all
            </Button>
          ) : null}
          <div
            className="max-h-72 space-y-1 overflow-y-auto pr-1"
            role="listbox"
            aria-label="All genres"
            aria-multiselectable
          >
            {popoverFiltered.length === 0 ? (
              <p className="py-2 text-center text-xs text-fog">
                No matching genres.
              </p>
            ) : (
              popoverFiltered.map((g) => {
                const selected = selectedGenreIds.includes(g.id);
                return (
                  <button
                    key={g.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => toggle(g.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-default px-2 py-2 text-left text-sm text-bone motion-safe:transition-colors hover:bg-forest-shadow/80",
                      selected &&
                        "bg-mb-turquoise-deep/15 ring-1 ring-mb-turquoise-mid/30",
                    )}
                  >
                    <span>{g.name}</span>
                    {selected ? (
                      <span className="text-xs text-mb-turquoise-pale" aria-hidden>
                        ✓
                      </span>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
