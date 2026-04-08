import type { CalendarEvent, EventWithLineupPreview } from "@/types";

/** Maps calendar API rows to the shape `EventCard` expects (lineup optional). */
export function calendarEventToCardEvent(
  ce: CalendarEvent,
): EventWithLineupPreview {
  return {
    id: ce.id,
    title: ce.title,
    start_date: ce.start_date,
    end_date: ce.end_date,
    start_time: ce.start_time,
    end_time: ce.end_time,
    venue: ce.venue,
    street_address: ce.street_address,
    city_id: ce.city_id,
    cities: {
      id: ce.city_id,
      name: ce.city ?? "",
      state_name: "",
      state_code: ce.state ?? "",
      created_at: "",
    },
    country: null,
    flyer_image_url: ce.flyer_image_url,
    genre_ids: ce.genre_ids,
    genres: ce.genres,
    status: ce.status,
    created_by: ce.created_by,
    description: null,
    ticket_url: null,
    google_place_id: null,
    latitude: null,
    longitude: null,
    deleted_at: null,
    created_at: null,
    updated_at: null,
    likes_count: ce.likes_count ?? 0,
    saves_count: 0,
    admission: ce.admission ?? null,
    is_ticketed: ce.is_ticketed ?? false,
    event_lineup: undefined,
  };
}
