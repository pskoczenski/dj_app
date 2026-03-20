"use client";

import { useCallback, useEffect, useState } from "react";
import { profilesService } from "@/lib/services/profiles";
import type { Profile } from "@/types";
import type { FollowCounts } from "@/lib/services/profiles";

export function useProfile(slug: string) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [counts, setCounts] = useState<FollowCounts>({
    followersCount: 0,
    followingCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const p = await profilesService.getBySlug(slug);
      setProfile(p);
      if (p) {
        const fc = await profilesService.getFollowCounts(p.id);
        setCounts(fc);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { profile, counts, loading, error, refetch: fetch };
}
