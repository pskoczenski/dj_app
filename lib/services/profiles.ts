import { createClient } from "@/lib/supabase/client";
import { TABLES, VIEWS } from "@/lib/db/schema-constants";
import { genresService } from "@/lib/services/genres";
import type { Profile, ProfileUpdate } from "@/types";

export interface FollowCounts {
  followersCount: number;
  followingCount: number;
}

function supabase() {
  return createClient();
}

const PROFILE_WITH_CITY =
  "*, cities:city_id(id, name, state_name, state_code, created_at)";

async function enrichProfile(row: Profile | null): Promise<Profile | null> {
  if (!row) return null;
  const [withGenres] = await genresService.hydrateGenreLabels([row]);
  return withGenres as Profile;
}

export async function getBySlug(slug: string): Promise<Profile | null> {
  const { data, error } = await supabase()
    .from(TABLES.profiles)
    .select(PROFILE_WITH_CITY)
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw error;
  return enrichProfile(data as Profile | null);
}

export async function getById(id: string): Promise<Profile | null> {
  const { data, error } = await supabase()
    .from(TABLES.profiles)
    .select(PROFILE_WITH_CITY)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw error;
  return enrichProfile(data as Profile | null);
}

export async function getCurrent(): Promise<Profile | null> {
  const {
    data: { user },
  } = await supabase().auth.getUser();

  if (!user) return null;
  return getById(user.id);
}

export async function update(
  id: string,
  data: ProfileUpdate,
): Promise<Profile> {
  if (data.genre_ids?.length) {
    await genresService.ensureGenreIdsExist(data.genre_ids);
  }
  const { data: updated, error } = await supabase()
    .from(TABLES.profiles)
    .update(data)
    .eq("id", id)
    .select(PROFILE_WITH_CITY)
    .single();

  if (error) throw error;
  const [enriched] = await genresService.hydrateGenreLabels([updated as Profile]);
  return enriched as Profile;
}

export async function search(
  query: string,
  options: { limit?: number; cityId?: string; genreIds?: string[] } = {},
): Promise<Profile[]> {
  const qTrim = query.trim();
  if (qTrim.length < 2 && !options.genreIds?.length) {
    return [];
  }

  const limit = options.limit ?? 10;
  const term = `%${query}%`;
  let q = supabase()
    .from(TABLES.profiles)
    .select(PROFILE_WITH_CITY)
    .is("deleted_at", null);

  if (qTrim.length >= 2) {
    q = q.or(`display_name.ilike.${term},slug.ilike.${term}`);
  }

  if (options.cityId) {
    q = q.eq("city_id", options.cityId);
  }

  if (options.genreIds?.length) {
    q = q.overlaps("genre_ids", options.genreIds);
  }

  const { data, error } = await q.limit(limit);

  if (error) throw error;
  return genresService.hydrateGenreLabels((data ?? []) as Profile[]);
}

export async function getFollowCounts(profileId: string): Promise<FollowCounts> {
  const { data, error } = await supabase()
    .from(VIEWS.profileFollowCounts)
    .select("followers_count, following_count")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (error) throw error;

  return {
    followersCount: data?.followers_count ?? 0,
    followingCount: data?.following_count ?? 0,
  };
}

export const profilesService = {
  getBySlug,
  getById,
  getCurrent,
  update,
  search,
  getFollowCounts,
};
