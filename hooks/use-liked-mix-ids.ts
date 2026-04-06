"use client";

import { useEffect, useMemo, useState } from "react";
import { mixLikesService } from "@/lib/services/mix-likes";

/** Loads which mixes in `mixIds` the given user has liked (single batched query). */
export function useLikedMixIds(
  mixIds: string[],
  userId: string | null | undefined,
) {
  const key = useMemo(() => [...new Set(mixIds)].sort().join("\0"), [mixIds]);

  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!userId || mixIds.length === 0) {
      setLikedIds(new Set());
      return;
    }

    let cancelled = false;
    const ids = [...new Set(mixIds)];

    mixLikesService
      .getLikedMixIdsForUser(userId, ids)
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
