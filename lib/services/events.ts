import { createClient } from "@/lib/supabase/client";
import { TABLES } from "@/lib/db/schema-constants";
import type {
  CalendarEvent,
  Event,
  EventInsert,
  EventUpdate,
  EventStatus,
  EventWithLineupPreview,
} from "@/types";

/** Supabase select for browse/card rows: event fields plus lineup DJs (ordered client-side by sort_order). */
export const EVENT_LIST_WITH_LINEUP = `
  *,
  event_lineup (
    sort_order,
    profile:profiles!event_lineup_profile_id_fkey (
      display_name,
      slug
    )
  )
`;

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

const CALENDAR_EVENT_COLUMNS =
  "id,title,start_date,end_date,start_time,end_time,venue,city,state,flyer_image_url,genres,status,created_by";

/**
 * Events that overlap `[startDate, endDate]` (inclusive ISO date strings).
 * Mirrors list RLS: published for everyone, or any status for the creator when signed in.
 */
export async function getEventsByDateRange(
  startDate: string,
  endDate: string,
): Promise<CalendarEvent[]> {
  const sb = supabase();
  const {
    data: { user },
  } = await sb.auth.getUser();

  let query = sb
    .from(TABLES.events)
    .select(CALENDAR_EVENT_COLUMNS)
    .is("deleted_at", null)
    .lte("start_date", endDate)
    .or(
      `end_date.gte.${startDate},and(end_date.is.null,start_date.gte.${startDate})`,
    );

  if (user?.id) {
    query = query.or(`status.eq.published,created_by.eq.${user.id}`);
  } else {
    query = query.eq("status", "published" as EventStatus);
  }

  query = query
    .order("start_date", { ascending: true })
    .order("start_time", { ascending: true, nullsFirst: false });

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as CalendarEvent[];
}

export async function getAll(
  filters: EventFilters = {},
): Promise<EventWithLineupPreview[]> {
  let query = supabase()
    .from(TABLES.events)
    .select(EVENT_LIST_WITH_LINEUP)
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

export async function getUpcoming(state?: string): Promise<EventWithLineupPreview[]> {
  const today = new Date().toISOString().split("T")[0];

  let query = supabase()
    .from(TABLES.events)
    .select(EVENT_LIST_WITH_LINEUP)
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

export async function getByProfile(profileId: string): Promise<EventWithLineupPreview[]> {
  const { data: lineupRows, error: lineupError } = await supabase()
    .from(TABLES.eventLineup)
    .select("event_id")
    .eq("profile_id", profileId);

  if (lineupError) throw lineupError;

  const lineupEventIds = (lineupRows ?? []).map((r) => r.event_id);

  const { data: createdEvents, error: createdError } = await supabase()
    .from(TABLES.events)
    .select(EVENT_LIST_WITH_LINEUP)
    .eq("created_by", profileId)
    .is("deleted_at", null)
    .order("start_date", { ascending: true });

  if (createdError) throw createdError;

  let lineupEvents: EventWithLineupPreview[] = [];
  if (lineupEventIds.length > 0) {
    const { data, error } = await supabase()
      .from(TABLES.events)
      .select(EVENT_LIST_WITH_LINEUP)
      .in("id", lineupEventIds)
      .is("deleted_at", null)
      .order("start_date", { ascending: true });

    if (error) throw error;
    lineupEvents = data ?? [];
  }

  const seen = new Set<string>();
  const merged: EventWithLineupPreview[] = [];
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
  getEventsByDateRange,
  create,
  update,
  softDelete,
  cancel,
};
