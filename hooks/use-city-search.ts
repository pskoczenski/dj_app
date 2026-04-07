"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { citiesService } from "@/lib/services/cities";
import type { City } from "@/types";

export function useCitySearch() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const requestIdRef = useRef(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 250);
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [query]);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      setNoResults(false);
      setLoading(false);
      return;
    }

    const id = ++requestIdRef.current;
    setLoading(true);
    setNoResults(false);

    void citiesService
      .search(debouncedQuery)
      .then((data) => {
        if (requestIdRef.current !== id) return;
        setResults(data);
        setNoResults(data.length === 0);
      })
      .catch(() => {
        if (requestIdRef.current !== id) return;
        setResults([]);
        setNoResults(true);
      })
      .finally(() => {
        if (requestIdRef.current !== id) return;
        setLoading(false);
      });
  }, [debouncedQuery]);

  const clearResults = useCallback(() => {
    requestIdRef.current += 1;
    setQuery("");
    setDebouncedQuery("");
    setResults([]);
    setNoResults(false);
    setLoading(false);
  }, []);

  const trimmed = query.trim();
  const stale =
    trimmed.length >= 2 && trimmed !== debouncedQuery.trim();

  return {
    query,
    setQuery,
    results,
    loading,
    noResults,
    stale,
    clearResults,
  };
}
