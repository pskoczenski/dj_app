"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useCitySearch } from "@/hooks/use-city-search";
import type { City } from "@/types";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

function formatCity(city: City): string {
  return `${city.name}, ${city.state_code}`;
}

export type CityAutocompleteProps = {
  id: string;
  value: City | null;
  onChange: (city: City | null) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
  "aria-label"?: string;
};

export function CityAutocomplete({
  id,
  value,
  onChange,
  placeholder = "Search for a city...",
  required,
  error,
  label,
  className,
  disabled,
  "aria-label": ariaLabel,
}: CityAutocompleteProps) {
  const listboxId = useId();
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const {
    setQuery: setSearchQuery,
    results,
    loading,
    noResults,
    stale,
    clearResults,
  } = useCitySearch();

  const [inputValue, setInputValue] = useState(() =>
    value ? formatCity(value) : "",
  );
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const activeIndexRef = useRef(-1);

  useEffect(() => {
    setInputValue(value ? formatCity(value) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.id]);

  const trimmedInput = inputValue.trim();
  const displayResults = stale ? [] : results;
  const showLoading = stale || loading;
  const showEmptyMsg =
    !showLoading && noResults && trimmedInput.length >= 2;

  const showPanel =
    open &&
    !disabled &&
    trimmedInput.length >= 2 &&
    (showLoading || displayResults.length > 0 || showEmptyMsg);

  const commitSelection = useCallback(
    (city: City) => {
      onChange(city);
      clearResults();
      setInputValue(formatCity(city));
      setOpen(false);
      activeIndexRef.current = -1;
      setActiveIndex(-1);
    },
    [onChange, clearResults],
  );

  const handleInputChange = (next: string) => {
    setInputValue(next);
    setSearchQuery(next);
    setOpen(true);
    activeIndexRef.current = -1;
    setActiveIndex(-1);
    if (value && next !== formatCity(value)) {
      onChange(null);
    }
    if (next.length === 0) {
      onChange(null);
      clearResults();
      setOpen(false);
    }
  };

  const cancelBlurClose = () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const canShowDropdown =
      trimmedInput.length >= 2 &&
      (showLoading || displayResults.length > 0 || showEmptyMsg);

    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      activeIndexRef.current = -1;
      setActiveIndex(-1);
      return;
    }

    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (!canShowDropdown) return;
      e.preventDefault();
      if (!open) setOpen(true);

      if (e.key === "ArrowDown") {
        if (!open) {
          const next = displayResults.length === 0 ? -1 : 0;
          activeIndexRef.current = next;
          setActiveIndex(next);
          return;
        }
        const i = activeIndexRef.current;
        const next =
          displayResults.length === 0
            ? -1
            : i < displayResults.length - 1
              ? i + 1
              : 0;
        activeIndexRef.current = next;
        setActiveIndex(next);
        return;
      }

      /* ArrowUp */
      if (!open) {
        const next =
          displayResults.length === 0 ? -1 : displayResults.length - 1;
        activeIndexRef.current = next;
        setActiveIndex(next);
        return;
      }
      const i = activeIndexRef.current;
      const next =
        displayResults.length === 0
          ? -1
          : i <= 0
            ? displayResults.length - 1
            : i - 1;
      activeIndexRef.current = next;
      setActiveIndex(next);
      return;
    }

    if (e.key === "Enter") {
      const i = activeIndexRef.current;
      if (i >= 0 && displayResults[i]) {
        e.preventDefault();
        commitSelection(displayResults[i]);
      }
    }
  };

  return (
    <div className={cn("relative", className)}>
      {label ? (
        <label
          htmlFor={id}
          className="mb-1 block text-sm font-medium text-bone"
        >
          {label}
        </label>
      ) : null}
      <Input
        id={id}
        role="combobox"
        aria-expanded={showPanel}
        aria-controls={listboxId}
        aria-activedescendant={
          activeIndex >= 0 ? `${id}-opt-${activeIndex}` : undefined
        }
        aria-autocomplete="list"
        aria-required={required}
        aria-invalid={error ? true : undefined}
        aria-label={ariaLabel}
        disabled={disabled}
        autoComplete="off"
        placeholder={placeholder}
        value={inputValue}
        required={required}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => {
          cancelBlurClose();
          if (inputValue.trim().length >= 2) setOpen(true);
        }}
        onBlur={() => {
          blurTimeoutRef.current = setTimeout(() => {
            setOpen(false);
            activeIndexRef.current = -1;
            setActiveIndex(-1);
          }, 150);
        }}
        onKeyDown={handleKeyDown}
      />
      {showPanel ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="City suggestions"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-popover p-1 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10"
        >
          {showLoading ? (
            <li className="px-3 py-2 text-fog" role="presentation">
              Searching…
            </li>
          ) : null}
          {!showLoading &&
            displayResults.map((city, index) => (
              <li
                key={city.id}
                id={`${id}-opt-${index}`}
                role="option"
                aria-selected={activeIndex === index}
                className={cn(
                  "cursor-pointer rounded-md px-3 py-2 text-bone outline-none",
                  activeIndex === index
                    ? "bg-deep-loam"
                    : "hover:bg-deep-loam/80",
                )}
                onMouseDown={(e) => {
                  e.preventDefault();
                  cancelBlurClose();
                  commitSelection(city);
                }}
              >
                {formatCity(city)}
              </li>
            ))}
          {showEmptyMsg ? (
            <li className="px-3 py-2 text-fog" role="presentation">
              No cities found.
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
