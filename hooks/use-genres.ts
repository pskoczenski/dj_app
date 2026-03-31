"use client";

import { useEffect, useState } from "react";
import { genresService } from "@/lib/services/genres";
import type { Genre } from "@/types";

let cachedGenres: Genre[] | null = null;
let inflight: Promise<Genre[]> | null = null;

async function fetchAllGenres(): Promise<Genre[]> {
  if (cachedGenres) return cachedGenres;
  if (!inflight) {
    inflight = genresService.getAll().then((g) => {
      cachedGenres = g;
      inflight = null;
      return g;
    });
  }
  return inflight;
}

export function useGenres() {
  const [genres, setGenres] = useState<Genre[]>(cachedGenres ?? []);
  const [loading, setLoading] = useState<boolean>(!cachedGenres);

  useEffect(() => {
    let alive = true;
    if (cachedGenres) {
      setLoading(false);
      return;
    }

    setLoading(true);
    void fetchAllGenres()
      .then((g) => {
        if (!alive) return;
        setGenres(g);
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  return { genres, loading };
}

export const __private__ = {
  resetCacheForTests() {
    cachedGenres = null;
    inflight = null;
  },
};

