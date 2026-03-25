import { createClient } from "@/lib/supabase/client";
import { TABLES } from "@/lib/db/schema-constants";
import { EVENT_LIST_WITH_LINEUP } from "@/lib/services/events";
import type { Profile, EventWithLineupPreview, Mix } from "@/types";

function supabase() {
  return createClient();
}

export async function searchDjs(
  query: string,
  limit = 20,
): Promise<Profile[]> {
  const term = `%${query}%`;
  const { data, error } = await supabase()
    .from(TABLES.profiles)
    .select("*")
    .is("deleted_at", null)
    .or(
      `display_name.ilike.${term},bio.ilike.${term},city.ilike.${term}`,
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function searchEvents(
  query: string,
  limit = 20,
): Promise<EventWithLineupPreview[]> {
  const term = `%${query}%`;
  const { data, error } = await supabase()
    .from(TABLES.events)
    .select(EVENT_LIST_WITH_LINEUP)
    .is("deleted_at", null)
    .eq("status", "published")
    .or(
      `title.ilike.${term},description.ilike.${term},venue.ilike.${term},city.ilike.${term}`,
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function searchMixes(
  query: string,
  limit = 20,
): Promise<Mix[]> {
  const term = `%${query}%`;
  const { data, error } = await supabase()
    .from(TABLES.mixes)
    .select("*")
    .is("deleted_at", null)
    .or(`title.ilike.${term},description.ilike.${term}`)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export const searchService = {
  searchDjs,
  searchEvents,
  searchMixes,
};
