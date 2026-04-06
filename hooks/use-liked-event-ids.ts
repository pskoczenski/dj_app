"use client";

import { useEffect, useMemo, useState } from "react";
import { eventLikesService } from "@/lib/services/event-likes";

/** Loads which events in `eventIds` the given user has liked (single batched query). */
export function useLikedEventIds(
  eventIds: string[],
  userId: string | null | undefined,
) {
  const key = useMemo(() => [...new Set(eventIds)].sort().join("\0"), [eventIds]);

  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!userId || eventIds.length === 0) {
      setLikedIds((prev) => (prev.size === 0 ? prev : new Set()));
      return;
    }

    let cancelled = false;
    const ids = [...new Set(eventIds)];

    eventLikesService
      .getLikedEventIdsForUser(userId, ids)
      .then((liked) => {
        if (!cancelled) setLikedIds(new Set(liked));
      })
      .catch(() => {
        if (!cancelled) setLikedIds(new Set());
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, key]);

  return likedIds;
}
