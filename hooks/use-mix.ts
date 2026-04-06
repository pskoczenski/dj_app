"use client";

import { useCallback, useEffect, useState } from "react";
import { mixesService } from "@/lib/services/mixes";
import type { MixWithCreator } from "@/types";

export function useMix(id: string) {
  const [mix, setMix] = useState<MixWithCreator | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMix = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await mixesService.getByIdWithCreator(id);
      setMix(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchMix();
  }, [fetchMix]);

  return { mix, loading, error, refetch: fetchMix };
}
