"use client";

import { useEffect, useMemo, useState } from "react";
import { eventSavesService } from "@/lib/services/event-saves";

/** Loads which events in `eventIds` the given user has saved (single batched query). */
export function useSavedEventIds(
  eventIds: string[],
  userId: string | null | undefined,
) {
  const key = useMemo(() => [...new Set(eventIds)].sort().join("\0"), [eventIds]);

  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!userId || eventIds.length === 0) {
      setSavedIds((prev) => (prev.size === 0 ? prev : new Set()));
      return;
    }

    let cancelled = false;
    const ids = [...new Set(eventIds)];

    eventSavesService
      .getSavedEventIdsForUser(userId, ids)
      .then((saved) => {
        if (!cancelled) setSavedIds(new Set(saved));
      })
      .catch(() => {
        if (!cancelled) setSavedIds(new Set());
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, key]);

  return savedIds;
}
