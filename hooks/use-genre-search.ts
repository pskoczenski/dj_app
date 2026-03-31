"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { genresService } from "@/lib/services/genres";
import type { Genre } from "@/types";

export function useGenreSearch(options: { excludeIds?: string[] } = {}) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(false);

  const requestIdRef = useRef(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const excludeIdsKey = (options.excludeIds ?? []).join("\0");

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
      setResults([]);
      setLoading(false);
      return;
    }

    const id = ++requestIdRef.current;
    setLoading(true);

    void genresService
      .search(debouncedQuery, { excludeIds: options.excludeIds })
      .then((data) => {
        if (requestIdRef.current !== id) return;
        setResults(data);
      })
      .catch(() => {
        if (requestIdRef.current !== id) return;
        setResults([]);
      })
      .finally(() => {
        if (requestIdRef.current !== id) return;
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, excludeIdsKey]);

  const clearResults = useCallback(() => {
    requestIdRef.current += 1;
    setQuery("");
    setDebouncedQuery("");
    setResults([]);
    setLoading(false);
  }, []);

  return {
    query,
    setQuery,
    results,
    loading,
    clearResults,
  };
}

