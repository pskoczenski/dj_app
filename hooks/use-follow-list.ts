"use client";

import { useCallback, useEffect, useState } from "react";
import { followsService } from "@/lib/services/follows";
import type { Profile } from "@/types";

export function useFollowList(
  profileId: string,
  type: "followers" | "following",
  enabled: boolean,
) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!profileId) return;
    setLoading(true);
    try {
      const fn =
        type === "followers"
          ? followsService.getFollowers
          : followsService.getFollowing;
      const data = await fn(profileId);
      setProfiles(data);
    } catch {
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, [profileId, type]);

  useEffect(() => {
    if (!enabled) return;
    void fetch();
  }, [enabled, fetch]);

  return { profiles, loading };
}
