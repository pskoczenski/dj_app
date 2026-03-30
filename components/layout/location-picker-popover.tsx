"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCitySearch } from "@/hooks/use-city-search";
import { useLocation } from "@/hooks/use-location";
import { addRecentCity, readRecentCities } from "@/lib/location/recent-cities";
import type { City } from "@/types";
import { cn } from "@/lib/utils";

type LocationPickerPopoverProps = {
  trigger: React.ReactNode;
  /** Extra classes on the trigger button */
  triggerClassName?: string;
};

export function LocationPickerPopover({
  trigger,
  triggerClassName,
}: LocationPickerPopoverProps) {
  const {
    activeCity,
    homeCity,
    isExploring,
    setActiveCity,
    resetToHome,
  } = useLocation();
  const [open, setOpen] = useState(false);
  const searchInputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const {
    query,
    setQuery,
    results,
    loading,
    noResults,
    stale,
    clearResults,
  } = useCitySearch();
  const [recent, setRecent] = useState<City[]>([]);

  const displayResults = stale ? [] : results;
  const showLoading = stale || loading;
  const trimmed = query.trim();
  const showSearchEmpty =
    !showLoading && noResults && trimmed.length >= 2;

  useEffect(() => {
    if (!open) {
      clearResults();
      return;
    }
    setRecent(readRecentCities());
    const t = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(t);
  }, [open, clearResults]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      clearResults();
    }
  }

  function pickCity(city: City) {
    addRecentCity(city);
    setActiveCity(city);
    setOpen(false);
    clearResults();
  }

  function handleBackToHome() {
    resetToHome();
    setOpen(false);
    clearResults();
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        type="button"
        aria-label={`Current location: ${activeCity.name}, ${activeCity.state_code}. Click to change.`}
        aria-haspopup="dialog"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border border-transparent px-2 py-1.5 text-left text-sm font-medium text-bone outline-none transition-colors hover:bg-forest-shadow hover:text-bone focus-visible:border-fern focus-visible:ring-3 focus-visible:ring-ring/50",
          triggerClassName,
        )}
      >
        {trigger}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className={cn(
          "flex w-[min(20rem,calc(100vw-2rem))] max-h-[min(28rem,85vh)] flex-col gap-3 overflow-y-auto p-3 md:w-80",
        )}
      >
        <div className="border-b border-root-line pb-3">
          <p className="text-xs font-medium uppercase tracking-wide text-fog">
            Current location
          </p>
          <p className="mt-1 text-sm font-medium text-bone">
            {activeCity.name}, {activeCity.state_name}
          </p>
          {isExploring ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-2 h-auto justify-start px-0 py-0 text-sm text-lichen-gold hover:bg-transparent hover:text-dried-gold"
              onClick={handleBackToHome}
              aria-label={`Switch back to your home city, ${homeCity.name}`}
            >
              Back to {homeCity.name}
            </Button>
          ) : (
            <p className="mt-2 text-xs text-fog">Your home city</p>
          )}
        </div>

        {recent.length > 0 ? (
          <div>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-fog">
              Recent
            </p>
            <ul className="flex max-h-28 flex-col gap-0.5 overflow-y-auto" role="list">
              {recent.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className="w-full rounded-md px-2 py-1.5 text-left text-sm text-bone hover:bg-deep-loam"
                    onClick={() => pickCity(c)}
                  >
                    {c.name}, {c.state_name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <label htmlFor={searchInputId} className="sr-only">
            Explore another city
          </label>
          <Input
            ref={inputRef}
            id={searchInputId}
            type="search"
            autoComplete="off"
            placeholder="Explore another city..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-autocomplete="list"
            aria-controls={
              trimmed.length >= 2 ? `${searchInputId}-listbox` : undefined
            }
          />
          {trimmed.length >= 2 ? (
            <ul
              id={`${searchInputId}-listbox`}
              role="listbox"
              aria-label="City search results"
              className="max-h-48 overflow-y-auto rounded-md border border-root-line bg-deep-loam/40 p-1"
            >
              {showLoading ? (
                <li className="px-2 py-2 text-xs text-fog" role="presentation">
                  Searching…
                </li>
              ) : null}
              {!showLoading &&
                displayResults.map((city) => (
                  <li key={city.id} role="presentation">
                    <button
                      type="button"
                      role="option"
                      className="w-full rounded-md px-2 py-2 text-left text-sm text-bone hover:bg-deep-loam"
                      onClick={() => pickCity(city)}
                    >
                      {city.name}, {city.state_name}
                    </button>
                  </li>
                ))}
              {showSearchEmpty ? (
                <li className="px-2 py-2 text-xs text-fog" role="presentation">
                  No cities found
                </li>
              ) : null}
            </ul>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
