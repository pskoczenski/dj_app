import { createClient } from "@/lib/supabase/client";
import { TABLES } from "@/lib/db/schema-constants";
import type { Follow, FollowInsert, Profile } from "@/types";

function supabase() {
  return createClient();
}

export async function follow(
  followerId: string,
  followingId: string,
): Promise<Follow> {
  if (followerId === followingId) {
    throw new Error("You cannot follow yourself.");
  }

  const { data, error } = await supabase()
    .from(TABLES.follows)
    .insert({ follower_id: followerId, following_id: followingId } satisfies FollowInsert)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("Already following this user.");
    }
    throw error;
  }
  return data;
}

export async function unfollow(
  followerId: string,
  followingId: string,
): Promise<void> {
  const { error } = await supabase()
    .from(TABLES.follows)
    .delete()
    .eq("follower_id", followerId)
    .eq("following_id", followingId);

  if (error) throw error;
}

export async function isFollowing(
  followerId: string,
  followingId: string,
): Promise<boolean> {
  const { data, error } = await supabase()
    .from(TABLES.follows)
    .select("id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .maybeSingle();

  if (error) throw error;
  return data !== null;
}

export async function getFollowers(
  profileId: string,
  range?: [number, number],
): Promise<Profile[]> {
  let query = supabase()
    .from(TABLES.follows)
    .select("follower:profiles!follows_follower_id_fkey(id, display_name, slug, profile_image_url)")
    .eq("following_id", profileId)
    .order("created_at", { ascending: false });

  if (range) query = query.range(range[0], range[1]);

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? [])
    .map((row) => (row as unknown as { follower: Profile }).follower)
    .filter(Boolean);
}

export async function getFollowing(
  profileId: string,
  range?: [number, number],
): Promise<Profile[]> {
  let query = supabase()
    .from(TABLES.follows)
    .select("following:profiles!follows_following_id_fkey(id, display_name, slug, profile_image_url)")
    .eq("follower_id", profileId)
    .order("created_at", { ascending: false });

  if (range) query = query.range(range[0], range[1]);

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? [])
    .map((row) => (row as unknown as { following: Profile }).following)
    .filter(Boolean);
}

export const followsService = {
  follow,
  unfollow,
  isFollowing,
  getFollowers,
  getFollowing,
};
