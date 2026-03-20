"use client";

import { useCallback, useEffect, useState } from "react";
import { profilesService } from "@/lib/services/profiles";
import type { Profile } from "@/types";

export interface CurrentUser {
  id: string;
  displayName: string;
  slug: string;
  avatarUrl: string | null;
  profileType: string;
}

function toCurrentUser(p: Profile): CurrentUser {
  return {
    id: p.id,
    displayName: p.display_name,
    slug: p.slug,
    avatarUrl: p.profile_image_url,
    profileType: p.profile_type,
  };
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const profile = await profilesService.getCurrent();
      setUser(profile ? toCurrentUser(profile) : null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { user, loading, error, refetch: fetch };
}
