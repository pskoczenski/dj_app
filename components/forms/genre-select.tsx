"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useGenreSearch } from "@/hooks/use-genre-search";
import { cn } from "@/lib/utils";
import type { Genre } from "@/types";
import { X } from "lucide-react";

interface GenreSelectProps {
  value: Genre[];
  onChange: (genres: Genre[]) => void;
  maxSelections?: number;
  placeholder?: string;
  error?: string;
  label?: string;
  className?: string;
}

export function GenreSelect({
  value,
  onChange,
  maxSelections = 10,
  placeholder = "Search genres...",
  error,
  label = "Genres",
  className,
}: GenreSelectProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const excludeIds = useMemo(() => value.map((g) => g.id), [value]);
  const { query, setQuery, results, loading, clearResults } = useGenreSearch({
    excludeIds,
  });

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const atMax = value.length >= maxSelections;

  useEffect(() => {
     
    setActiveIndex(0);
  }, [results.length]);

  function remove(id: string) {
    onChange(value.filter((g) => g.id !== id));
  }

  function add(g: Genre) {
    if (atMax) return;
    onChange([...value, g]);
    clearResults();
    setOpen(false);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && query.trim() === "" && value.length > 0) {
      e.preventDefault();
      remove(value[value.length - 1].id);
      return;
    }

    if (!open) {
      if (e.key === "ArrowDown" && results.length > 0) {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Enter") {
      const picked = results[activeIndex];
      if (!picked) return;
      e.preventDefault();
      add(picked);
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      return;
    }
  }

  const showDropdown = open && results.length > 0 && !atMax;

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="text-sm font-medium text-bone">{label}</span>
      <div className="relative">
        <div
          className={cn(
            "flex min-h-11 w-full flex-wrap items-center gap-2 rounded-default border border-root-line bg-dark-moss px-3 py-2 text-sm text-bone outline-none focus-within:border-fern",
            error ? "border-dried-blood" : "",
          )}
          onMouseDown={(e) => {
            // Keep input focus when clicking inside the container.
            e.preventDefault();
            inputRef.current?.focus();
          }}
        >
          {value.map((g) => (
            <Badge key={g.id} variant="genre" className="gap-1">
              {g.name}
              <button
                type="button"
                aria-label={`Remove ${g.name}`}
                onClick={() => remove(g.id)}
                className="ml-0.5 rounded-full hover:text-bone"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}

          {!atMax && (
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onBlur={() => {
                // Allow clicks on options (handled via onMouseDown there).
                setOpen(false);
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              role="combobox"
              aria-expanded={showDropdown}
              aria-autocomplete="list"
              aria-label={label}
              className="h-7 w-auto min-w-[140px] flex-1 border-none bg-transparent px-1 py-0 text-sm shadow-none focus-visible:ring-0"
            />
          )}
        </div>

        {showDropdown && (
          <div
            role="listbox"
            className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-default border border-root-line bg-popover p-1 text-sm text-bone shadow-md"
          >
            {results.map((g, idx) => (
              <button
                key={g.id}
                type="button"
                role="option"
                aria-selected={idx === activeIndex}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => add(g)}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm text-bone hover:bg-forest-shadow",
                  idx === activeIndex ? "bg-forest-shadow" : "",
                )}
              >
                <span>{g.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {atMax && (
        <p className="text-xs text-stone">Maximum of {maxSelections} genres reached.</p>
      )}
      {loading && !atMax && query.trim().length >= 2 && (
        <p className="text-xs text-stone">Searching…</p>
      )}
      {error && <p className="text-xs text-dried-blood">{error}</p>}
    </div>
  );
}

