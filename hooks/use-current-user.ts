"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [hasAuthSession, setHasAuthSession] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sb = createClient();
      const {
        data: { user: authUser },
        error: authError,
      } = await sb.auth.getUser();

      if (authError) {
        throw new Error(
          typeof authError.message === "string"
            ? authError.message
            : "Authentication error",
        );
      }

      if (!authUser) {
        setHasAuthSession(false);
        setProfile(null);
        setUser(null);
        return;
      }

      setHasAuthSession(true);

      try {
        const p = await profilesService.getById(authUser.id);
        setProfile(p);
        setUser(p ? toCurrentUser(p) : null);
      } catch (profileErr) {
        setError(
          profileErr instanceof Error
            ? profileErr
            : new Error(String(profileErr)),
        );
        setProfile(null);
        setUser(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setHasAuthSession(false);
      setProfile(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    user,
    profile,
    hasAuthSession,
    loading,
    error,
    refetch: fetch,
  };
}
