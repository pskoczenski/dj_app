import { createClient } from "@/lib/supabase/client";
import { TABLES, VIEWS } from "@/lib/db/schema-constants";
import type { Profile, ProfileUpdate, ProfileFollowCounts } from "@/types";

export interface FollowCounts {
  followersCount: number;
  followingCount: number;
}

function supabase() {
  return createClient();
}

export async function getBySlug(slug: string): Promise<Profile | null> {
  const { data, error } = await supabase()
    .from(TABLES.profiles)
    .select("*")
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getById(id: string): Promise<Profile | null> {
  const { data, error } = await supabase()
    .from(TABLES.profiles)
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw error;
  return data;
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
  const { genres, ...rest } = data;

  const { data: updated, error } = await supabase()
    .from(TABLES.profiles)
    .update(rest)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  if (genres && genres.length > 0) {
    await upsertGenreTags(genres);

    const { error: genreError } = await supabase()
      .from(TABLES.profiles)
      .update({ genres })
      .eq("id", id);

    if (genreError) throw genreError;

    return { ...updated, genres };
  }

  return updated;
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

async function upsertGenreTags(genres: string[]): Promise<string[]> {
  const { data, error } = await supabase().rpc("upsert_genre_tags", {
    input_genres: genres,
  });

  if (error) throw error;
  return data ?? [];
}

export const profilesService = {
  getBySlug,
  getById,
  getCurrent,
  update,
  getFollowCounts,
};
