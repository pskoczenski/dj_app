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

const CITY_EMBED_LEFT = `cities:city_id (
    id,
    name,
    state_name,
    state_code,
    created_at
  )`;

const CITY_EMBED_INNER = `cities!inner (
    id,
    name,
    state_name,
    state_code,
    created_at
  )`;

const EVENT_LINEUP_BLOCK = `
  event_lineup (
    sort_order,
    profile:profiles!event_lineup_profile_id_fkey (
      display_name,
      slug
    )
  )
`;

const EVENT_ROW_WITH_CITY = `*, ${CITY_EMBED_LEFT}`;

/** Inner join cities when filtering by `cities.state_code` (PostgREST requirement). */
export function eventListWithLineupSelect(innerCity: boolean): string {
  const city = innerCity ? CITY_EMBED_INNER : CITY_EMBED_LEFT;
  return `
  *,
  ${city},
  ${EVENT_LINEUP_BLOCK}
`;
}

/** Default browse select (left join on city). */
export const EVENT_LIST_WITH_LINEUP = eventListWithLineupSelect(false);

export interface EventFilters {
  dateFrom?: string;
  dateTo?: string;
  state?: string;
  /** When set, restricts results to this `city_id` (optional browse filter). */
  cityId?: string;
  genre?: string;
  sort?: "soonest" | "latest" | "added";
  range?: [number, number];
}

function supabase() {
  return createClient();
}

const CALENDAR_SELECT =
  "id,title,start_date,end_date,start_time,end_time,venue,flyer_image_url,genres,status,created_by,city_id,cities:city_id(id,name,state_code,state_name,created_at)";

function toCalendarEvent(
  row: Record<string, unknown> & {
    cities?: { name?: string; state_code?: string } | null;
  },
): CalendarEvent {
  const c = row.cities;
  return {
    id: row.id as string,
    title: row.title as string,
    start_date: row.start_date as string,
    end_date: (row.end_date as string | null) ?? null,
    start_time: (row.start_time as string | null) ?? null,
    end_time: (row.end_time as string | null) ?? null,
    venue: (row.venue as string | null) ?? null,
    flyer_image_url: (row.flyer_image_url as string | null) ?? null,
    genres: (row.genres as string[] | null) ?? null,
    status: row.status as CalendarEvent["status"],
    created_by: row.created_by as string,
    city_id: row.city_id as string,
    city: c?.name ?? null,
    state: c?.state_code ?? null,
  };
}

/**
 * Events that overlap `[startDate, endDate]` (inclusive ISO date strings).
 * Mirrors list RLS: published for everyone, or any status for the creator when signed in.
 */
export async function getEventsByDateRange(
  startDate: string,
  endDate: string,
  options: { cityId?: string } = {},
): Promise<CalendarEvent[]> {
  const sb = supabase();
  const {
    data: { user },
  } = await sb.auth.getUser();

  let query = sb
    .from(TABLES.events)
    .select(CALENDAR_SELECT)
    .is("deleted_at", null)
    .lte("start_date", endDate)
    .or(
      `end_date.gte.${startDate},and(end_date.is.null,start_date.gte.${startDate})`,
    );

  if (options.cityId) {
    query = query.eq("city_id", options.cityId);
  }

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
  return (data ?? []).map((r) =>
    toCalendarEvent(r as Parameters<typeof toCalendarEvent>[0]),
  );
}

export async function getAll(
  filters: EventFilters = {},
): Promise<EventWithLineupPreview[]> {
  const innerCity = Boolean(filters.state);
  let query = supabase()
    .from(TABLES.events)
    .select(eventListWithLineupSelect(innerCity))
    .is("deleted_at", null)
    .eq("status", "published" as EventStatus);

  if (filters.dateFrom) {
    query = query.gte("start_date", filters.dateFrom);
  }
  if (filters.dateTo) {
    query = query.lte("start_date", filters.dateTo);
  }
  if (filters.state) {
    query = query.eq("cities.state_code", filters.state);
  }
  if (filters.genre) {
    query = query.contains("genres", [filters.genre]);
  }
  if (filters.cityId) {
    query = query.eq("city_id", filters.cityId);
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
  return (data ?? []) as unknown as EventWithLineupPreview[];
}

export async function getById(id: string): Promise<Event | null> {
  const { data, error } = await supabase()
    .from(TABLES.events)
    .select(
      "*, cities:city_id(id, name, state_name, state_code, created_at), profiles!events_created_by_fkey(id, display_name, slug, profile_image_url)",
    )
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw error;
  return data as Event | null;
}

export async function getUpcoming(state?: string): Promise<EventWithLineupPreview[]> {
  const today = new Date().toISOString().split("T")[0];

  const innerCity = Boolean(state);
  let query = supabase()
    .from(TABLES.events)
    .select(eventListWithLineupSelect(innerCity))
    .is("deleted_at", null)
    .eq("status", "published" as EventStatus)
    .gte("start_date", today)
    .order("start_date", { ascending: true });

  if (state) {
    query = query.eq("cities.state_code", state);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as EventWithLineupPreview[];
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

  const createdList = (createdEvents ?? []) as unknown as EventWithLineupPreview[];

  let lineupEvents: EventWithLineupPreview[] = [];
  if (lineupEventIds.length > 0) {
    const { data, error } = await supabase()
      .from(TABLES.events)
      .select(EVENT_LIST_WITH_LINEUP)
      .in("id", lineupEventIds)
      .is("deleted_at", null)
      .order("start_date", { ascending: true });

    if (error) throw error;
    lineupEvents = (data ?? []) as unknown as EventWithLineupPreview[];
  }

  const seen = new Set<string>();
  const merged: EventWithLineupPreview[] = [];
  for (const event of [...createdList, ...lineupEvents]) {
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
    .select(EVENT_ROW_WITH_CITY)
    .single();

  if (error) throw error;
  return created as Event;
}

export async function update(
  id: string,
  data: EventUpdate,
): Promise<Event> {
  const { data: updated, error } = await supabase()
    .from(TABLES.events)
    .update(data)
    .eq("id", id)
    .select(EVENT_ROW_WITH_CITY)
    .single();

  if (error) throw error;
  return updated as Event;
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
