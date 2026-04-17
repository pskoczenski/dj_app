import { createClient } from "@/lib/supabase/client";
import { TABLES } from "@/lib/db/schema-constants";
import { EVENT_LIST_WITH_LINEUP } from "@/lib/services/events";
import { MIX_LIST_SELECT } from "@/lib/services/mixes";
import { genresService } from "@/lib/services/genres";
import type { Profile, EventWithLineupPreview, MixWithCreator, ProfileType } from "@/types";

function supabase() {
  return createClient();
}

export type SearchServiceOptions = {
  limit?: number;
  /** When set, restricts DJ and event search to this `city_id`. */
  cityId?: string;
  /** OR match: profile `genre_ids` overlaps any of these UUIDs (DJs only). */
  genreIds?: string[];
  /** When set, restricts profile search to these profile types. */
  profileTypes?: ProfileType[];
};

export async function searchDjs(
  query: string,
  options: SearchServiceOptions = {},
): Promise<Profile[]> {
  const qTrim = query.trim();
  if (qTrim.length < 2 && !options.genreIds?.length) {
    return [];
  }

  const limit = options.limit ?? 20;

  let q = supabase()
    .from(TABLES.profiles)
    .select(
      "*, cities:city_id(id, name, state_name, state_code, created_at)",
    )
    .is("deleted_at", null);

  if (qTrim.length >= 2) {
    q = q.textSearch("search_vector", qTrim, {
      type: "websearch",
      config: "english",
    });
  }

  if (options.cityId) {
    q = q.eq("city_id", options.cityId);
  }

  if (options.genreIds?.length) {
    q = q.overlaps("genre_ids", options.genreIds);
  }

  if (options.profileTypes?.length) {
    q = q.in("profile_type", options.profileTypes);
  }

  const { data, error } = await q
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return genresService.hydrateGenreLabels((data ?? []) as Profile[]);
}

export async function searchEvents(
  query: string,
  options: SearchServiceOptions = {},
): Promise<EventWithLineupPreview[]> {
  const qTrim = query.trim();
  if (!qTrim) return [];

  const limit = options.limit ?? 20;
  let q = supabase()
    .from(TABLES.events)
    .select(EVENT_LIST_WITH_LINEUP)
    .is("deleted_at", null)
    .eq("status", "published")
    .textSearch("search_vector", qTrim, {
      type: "websearch",
      config: "english",
    });

  if (options.cityId) {
    q = q.eq("city_id", options.cityId);
  }

  const { data, error } = await q
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return genresService.hydrateGenreLabels(
    (data ?? []) as unknown as EventWithLineupPreview[],
  );
}

export async function searchMixes(
  query: string,
  limit = 20,
): Promise<MixWithCreator[]> {
  const qTrim = query.trim();
  if (!qTrim) return [];

  const { data, error } = await supabase()
    .from(TABLES.mixes)
    .select(MIX_LIST_SELECT)
    .is("deleted_at", null)
    .textSearch("search_vector", qTrim, {
      type: "websearch",
      config: "english",
    })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return genresService.hydrateGenreLabels((data ?? []) as MixWithCreator[]);
}

export const searchService = {
  searchDjs,
  searchEvents,
  searchMixes,
};
