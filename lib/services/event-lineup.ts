import { createClient } from "@/lib/supabase/client";
import { TABLES } from "@/lib/db/schema-constants";
import type {
  EventLineup,
  EventLineupInsert,
  EventLineupWithProfile,
} from "@/types";

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
        genres
      )
    `,
    )
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []) as EventLineupWithProfile[];
}

export async function add(data: EventLineupInsert): Promise<EventLineup> {
  const { data: created, error } = await supabase()
    .from(TABLES.eventLineup)
    .insert(data)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("This DJ is already in the lineup.");
    }
    throw error;
  }

  return created;
}

export async function remove(id: string): Promise<void> {
  const { error } = await supabase()
    .from(TABLES.eventLineup)
    .delete()
    .eq("id", id);

  if (error) throw error;
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
  remove,
  reorder,
};
