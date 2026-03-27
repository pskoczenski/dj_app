import { buildEventsByDateMap } from "@/lib/calendar-events-map";
import type { CalendarEvent } from "@/types";

function ev(overrides: Partial<CalendarEvent> & Pick<CalendarEvent, "id">): CalendarEvent {
  return {
    title: "T",
    start_date: "2026-04-10",
    end_date: null,
    start_time: null,
    end_time: null,
    venue: null,
    city: null,
    state: null,
    flyer_image_url: null,
    genres: null,
    status: "published",
    created_by: "u1",
    ...overrides,
  };
}

describe("buildEventsByDateMap", () => {
  it("puts a single-day event on one date key", () => {
    const map = buildEventsByDateMap([ev({ id: "a", start_date: "2026-04-15", end_date: null })]);
    expect(map.get("2026-04-15")).toHaveLength(1);
    expect(map.get("2026-04-14")).toBeUndefined();
  });

  it("duplicates multi-day events on each day they span", () => {
    const map = buildEventsByDateMap([
      ev({
        id: "multi",
        start_date: "2026-04-10",
        end_date: "2026-04-12",
      }),
    ]);
    expect(map.get("2026-04-10")).toEqual([expect.objectContaining({ id: "multi" })]);
    expect(map.get("2026-04-11")).toEqual([expect.objectContaining({ id: "multi" })]);
    expect(map.get("2026-04-12")).toEqual([expect.objectContaining({ id: "multi" })]);
    expect(map.get("2026-04-09")).toBeUndefined();
    expect(map.get("2026-04-13")).toBeUndefined();
  });
});
