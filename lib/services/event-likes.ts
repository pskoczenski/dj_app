import { createClient } from "@/lib/supabase/client";
import { TABLES } from "@/lib/db/schema-constants";

function supabase() {
  return createClient();
}

export async function getLikedEventIdsForUser(
  profileId: string,
  eventIds: string[],
): Promise<string[]> {
  if (eventIds.length === 0) return [];
  const unique = [...new Set(eventIds)];
  const { data, error } = await supabase()
    .from(TABLES.eventLikes)
    .select("event_id")
    .eq("profile_id", profileId)
    .in("event_id", unique);

  if (error) throw error;
  return (data ?? []).map((row) => row.event_id);
}

export async function toggleLike(
  eventId: string,
  profileId: string,
): Promise<{ liked: boolean; likesCount: number }> {
  const sb = supabase();
  const { data: existing, error: selErr } = await sb
    .from(TABLES.eventLikes)
    .select("id")
    .eq("event_id", eventId)
    .eq("profile_id", profileId)
    .maybeSingle();

  if (selErr) throw selErr;

  if (existing) {
    const { error: delErr } = await sb
      .from(TABLES.eventLikes)
      .delete()
      .eq("id", existing.id);
    if (delErr) throw delErr;
  } else {
    const { error: insErr } = await sb.from(TABLES.eventLikes).insert({
      event_id: eventId,
      profile_id: profileId,
    });
    if (insErr) throw insErr;
  }

  const { data: eventRow, error: evErr } = await sb
    .from(TABLES.events)
    .select("likes_count")
    .eq("id", eventId)
    .single();

  if (evErr) throw evErr;

  return {
    liked: !existing,
    likesCount: eventRow?.likes_count ?? 0,
  };
}

export const eventLikesService = {
  getLikedEventIdsForUser,
  toggleLike,
};
