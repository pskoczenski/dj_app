import { createClient } from "@/lib/supabase/client";
import { TABLES } from "@/lib/db/schema-constants";

function supabase() {
  return createClient();
}

export async function getLikedMixIdsForUser(
  profileId: string,
  mixIds: string[],
): Promise<string[]> {
  if (mixIds.length === 0) return [];
  const unique = [...new Set(mixIds)];
  const { data, error } = await supabase()
    .from(TABLES.mixLikes)
    .select("mix_id")
    .eq("profile_id", profileId)
    .in("mix_id", unique);

  if (error) throw error;
  return (data ?? []).map((row) => row.mix_id);
}

export async function toggleLike(
  mixId: string,
  profileId: string,
): Promise<{ liked: boolean; likesCount: number }> {
  const sb = supabase();
  const { data: existing, error: selErr } = await sb
    .from(TABLES.mixLikes)
    .select("id")
    .eq("mix_id", mixId)
    .eq("profile_id", profileId)
    .maybeSingle();

  if (selErr) throw selErr;

  if (existing) {
    const { error: delErr } = await sb
      .from(TABLES.mixLikes)
      .delete()
      .eq("id", existing.id);
    if (delErr) throw delErr;
  } else {
    const { error: insErr } = await sb.from(TABLES.mixLikes).insert({
      mix_id: mixId,
      profile_id: profileId,
    });
    if (insErr) throw insErr;
  }

  const { data: mixRow, error: mixErr } = await sb
    .from(TABLES.mixes)
    .select("likes_count")
    .eq("id", mixId)
    .single();

  if (mixErr) throw mixErr;

  return {
    liked: !existing,
    likesCount: mixRow?.likes_count ?? 0,
  };
}

export const mixLikesService = {
  getLikedMixIdsForUser,
  toggleLike,
};
