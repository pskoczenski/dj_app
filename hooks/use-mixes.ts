"use client";

import { useCallback, useEffect, useState } from "react";
import { mixesService, type MixFilters } from "@/lib/services/mixes";
import type { Mix } from "@/types";

export function useMixes(filters: MixFilters = {}) {
  const [mixes, setMixes] = useState<Mix[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const serialized = JSON.stringify(filters);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await mixesService.getAll(JSON.parse(serialized));
      setMixes(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [serialized]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { mixes, loading, error, refetch: fetch };
}
