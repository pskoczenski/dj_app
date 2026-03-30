"use client";

import { useEffect, useState } from "react";
import { citiesService } from "@/lib/services/cities";
import type { City } from "@/types";
import { cn } from "@/lib/utils";

type CitySelectProps = {
  id: string;
  value: string;
  onChange: (cityId: string) => void;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
};

/** Step 30: full catalog &lt;select&gt;; Step 31 replaces with autocomplete. */
export function CitySelect({
  id,
  value,
  onChange,
  disabled,
  className,
  "aria-label": ariaLabel,
}: CitySelectProps) {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await citiesService.listAll();
        if (!cancelled) setCities(list);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-busy={loading}
      className={cn(
        "w-full rounded-default border border-root-line bg-deep-loam px-3 py-2 text-sm text-bone",
        className,
      )}
    >
      <option value="">{loading ? "Loading cities…" : "Select a city…"}</option>
      {cities.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}, {c.state_code}
        </option>
      ))}
    </select>
  );
}
