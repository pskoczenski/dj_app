import { createClient } from "@/lib/supabase/client";
import { TABLES } from "@/lib/db/schema-constants";
import { genresService } from "@/lib/services/genres";
import { EVENT_LIST_WITH_LINEUP } from "@/lib/services/events";
import type { EventWithLineupPreview } from "@/types";

function supabase() {
  return createClient();
}

export async function getSavedEventIdsForUser(
  profileId: string,
  eventIds: string[],
): Promise<string[]> {
  if (eventIds.length === 0) return [];
  const unique = [...new Set(eventIds)];
  const { data, error } = await supabase()
    .from(TABLES.eventSaves)
    .select("event_id")
    .eq("profile_id", profileId)
    .in("event_id", unique);

  if (error) throw error;
  return (data ?? []).map((row) => row.event_id);
}

export async function toggleSave(
  eventId: string,
  profileId: string,
): Promise<{ saved: boolean; savesCount: number }> {
  const sb = supabase();
  const { data: existing, error: selErr } = await sb
    .from(TABLES.eventSaves)
    .select("id")
    .eq("event_id", eventId)
    .eq("profile_id", profileId)
    .maybeSingle();

  if (selErr) throw selErr;

  if (existing) {
    const { error: delErr } = await sb
      .from(TABLES.eventSaves)
      .delete()
      .eq("id", existing.id);
    if (delErr) throw delErr;
  } else {
    const { error: insErr } = await sb.from(TABLES.eventSaves).insert({
      event_id: eventId,
      profile_id: profileId,
    });
    if (insErr) throw insErr;
  }

  const { data: eventRow, error: evErr } = await sb
    .from(TABLES.events)
    .select("saves_count")
    .eq("id", eventId)
    .single();

  if (evErr) throw evErr;

  return {
    saved: !existing,
    savesCount: eventRow?.saves_count ?? 0,
  };
}

export async function getSavedEvents(
  profileId: string,
): Promise<EventWithLineupPreview[]> {
  const { data: saves, error: savesError } = await supabase()
    .from(TABLES.eventSaves)
    .select("event_id, created_at")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });

  if (savesError) throw savesError;
  if (!saves || saves.length === 0) return [];

  const eventIds = saves.map((s) => s.event_id);

  const { data, error } = await supabase()
    .from(TABLES.events)
    .select(EVENT_LIST_WITH_LINEUP)
    .in("id", eventIds)
    .is("deleted_at", null)
    .eq("status", "published");

  if (error) throw error;

  // Preserve save-date ordering
  const byId = new Map(
    (data ?? []).map((e) => {
      const event = e as unknown as EventWithLineupPreview;
      return [event.id, event];
    }),
  );
  const ordered = eventIds.map((id) => byId.get(id)).filter(Boolean) as EventWithLineupPreview[];

  return genresService.hydrateGenreLabels(ordered);
}

export const eventSavesService = {
  getSavedEventIdsForUser,
  toggleSave,
  getSavedEvents,
};
