import { createClient } from "@/lib/supabase/client";
import { TABLES } from "@/lib/db/schema-constants";
import type { Event, EventInsert, EventUpdate, EventStatus } from "@/types";

export interface EventFilters {
  dateFrom?: string;
  dateTo?: string;
  state?: string;
  genre?: string;
  sort?: "soonest" | "latest" | "added";
  range?: [number, number];
}

function supabase() {
  return createClient();
}

export async function getAll(
  filters: EventFilters = {},
): Promise<Event[]> {
  let query = supabase()
    .from(TABLES.events)
    .select("*")
    .is("deleted_at", null)
    .eq("status", "published" as EventStatus);

  if (filters.dateFrom) {
    query = query.gte("start_date", filters.dateFrom);
  }
  if (filters.dateTo) {
    query = query.lte("start_date", filters.dateTo);
  }
  if (filters.state) {
    query = query.eq("state", filters.state);
  }
  if (filters.genre) {
    query = query.contains("genres", [filters.genre]);
  }

  switch (filters.sort) {
    case "latest":
      query = query.order("start_date", { ascending: false });
      break;
    case "added":
      query = query.order("created_at", { ascending: false });
      break;
    case "soonest":
    default:
      query = query.order("start_date", { ascending: true });
      break;
  }

  if (filters.range) {
    query = query.range(filters.range[0], filters.range[1]);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getById(id: string): Promise<Event | null> {
  const { data, error } = await supabase()
    .from(TABLES.events)
    .select("*, profiles!events_created_by_fkey(id, display_name, slug, profile_image_url)")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getUpcoming(state?: string): Promise<Event[]> {
  const today = new Date().toISOString().split("T")[0];

  let query = supabase()
    .from(TABLES.events)
    .select("*")
    .is("deleted_at", null)
    .eq("status", "published" as EventStatus)
    .gte("start_date", today)
    .order("start_date", { ascending: true });

  if (state) {
    query = query.eq("state", state);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getByProfile(profileId: string): Promise<Event[]> {
  const { data: lineupRows, error: lineupError } = await supabase()
    .from(TABLES.eventLineup)
    .select("event_id")
    .eq("profile_id", profileId);

  if (lineupError) throw lineupError;

  const lineupEventIds = (lineupRows ?? []).map((r) => r.event_id);

  const { data: createdEvents, error: createdError } = await supabase()
    .from(TABLES.events)
    .select("*")
    .eq("created_by", profileId)
    .is("deleted_at", null)
    .order("start_date", { ascending: true });

  if (createdError) throw createdError;

  let lineupEvents: Event[] = [];
  if (lineupEventIds.length > 0) {
    const { data, error } = await supabase()
      .from(TABLES.events)
      .select("*")
      .in("id", lineupEventIds)
      .is("deleted_at", null)
      .order("start_date", { ascending: true });

    if (error) throw error;
    lineupEvents = data ?? [];
  }

  const seen = new Set<string>();
  const merged: Event[] = [];
  for (const event of [...(createdEvents ?? []), ...lineupEvents]) {
    if (!seen.has(event.id)) {
      seen.add(event.id);
      merged.push(event);
    }
  }

  return merged.sort(
    (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime(),
  );
}

export async function create(data: EventInsert): Promise<Event> {
  const { data: created, error } = await supabase()
    .from(TABLES.events)
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return created;
}

export async function update(
  id: string,
  data: EventUpdate,
): Promise<Event> {
  const { data: updated, error } = await supabase()
    .from(TABLES.events)
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return updated;
}

export async function softDelete(id: string): Promise<void> {
  const { error } = await supabase()
    .from(TABLES.events)
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

export async function cancel(id: string): Promise<Event> {
  return update(id, { status: "cancelled" as EventStatus });
}

export const eventsService = {
  getAll,
  getById,
  getUpcoming,
  getByProfile,
  create,
  update,
  softDelete,
  cancel,
};
