import { createClient } from "@/lib/supabase/client";
import { TABLES } from "@/lib/db/schema-constants";
import { genresService } from "@/lib/services/genres";
import { conversationsService } from "@/lib/services/conversations";
import type {
  EventLineup,
  EventLineupInsert,
  EventLineupUpdate,
  EventLineupWithProfile,
} from "@/types";

export type EventLineupRowDisplayPatch = Pick<
  EventLineupUpdate,
  "sort_order" | "is_headliner" | "set_time"
>;

function supabase() {
  return createClient();
}

export async function listForEvent(
  eventId: string,
): Promise<EventLineupWithProfile[]> {
  const { data, error } = await supabase()
    .from(TABLES.eventLineup)
    .select(
      `
      *,
      profile:profiles!event_lineup_profile_id_fkey (
        id,
        display_name,
        slug,
        profile_image_url,
        genre_ids
      )
    `,
    )
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  const rows = (data ?? []) as EventLineupWithProfile[];
  const profiles = rows
    .map((r) => r.profile)
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
  const hydratedProfiles = await genresService.hydrateGenreLabels(profiles);
  const byId = new Map(hydratedProfiles.map((p) => [p.id, p]));
  return rows.map((r) => ({
    ...r,
    profile: r.profile?.id ? (byId.get(r.profile.id) ?? r.profile) : null,
  }));
}

/**
 * Add a lineup row, or refresh order/display fields if that DJ is already on the event.
 * Upsert avoids 23505 when the UI lacks `eventLineupId` but the row already exists in DB.
 */
export async function add(data: EventLineupInsert): Promise<EventLineup> {
  const { data: row, error } = await supabase()
    .from(TABLES.eventLineup)
    .upsert(data, { onConflict: "event_id,profile_id" })
    .select()
    .single();

  if (error) throw error;

  await conversationsService.syncEventGroupParticipants(row.event_id);

  return row as EventLineup;
}

/** Update display/order fields for an existing lineup row (edit flow). */
export async function updateRow(
  id: string,
  patch: EventLineupRowDisplayPatch,
): Promise<void> {
  const { error } = await supabase()
    .from(TABLES.eventLineup)
    .update(patch)
    .eq("id", id);

  if (error) throw error;
}

export async function remove(id: string): Promise<void> {
  const client = supabase();
  const { data: row, error: fetchErr } = await client
    .from(TABLES.eventLineup)
    .select("event_id")
    .eq("id", id)
    .maybeSingle();
  if (fetchErr) throw fetchErr;

  const { error } = await client.from(TABLES.eventLineup).delete().eq("id", id);
  if (error) throw error;

  if (row?.event_id) {
    await conversationsService.syncEventGroupParticipants(row.event_id);
  }
}

export async function reorder(
  items: { id: string; sort_order: number }[],
): Promise<void> {
  const client = supabase();

  for (const item of items) {
    const { error } = await client
      .from(TABLES.eventLineup)
      .update({ sort_order: item.sort_order })
      .eq("id", item.id);

    if (error) throw error;
  }
}

export const eventLineupService = {
  listForEvent,
  add,
  updateRow,
  remove,
  reorder,
};
