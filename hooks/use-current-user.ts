"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface CurrentUser {
  id: string;
  displayName: string;
  slug: string;
  avatarUrl: string | null;
  profileType: string;
}

/**
 * Client-side hook to fetch the authenticated user's profile.
 * Returns null while loading or if unauthenticated.
 *
 * TODO: Replace with a server-side fetch or React context provider
 * once profile service (Step 8) is available.
 */
export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser || cancelled) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, display_name, slug, profile_type")
        .eq("id", authUser.id)
        .maybeSingle();

      if (!cancelled && profile) {
        setUser({
          id: profile.id,
          displayName: profile.display_name,
          slug: profile.slug,
          avatarUrl: null, // TODO: add avatar_url column in Step 10
          profileType: profile.profile_type,
        });
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { user, loading };
}
