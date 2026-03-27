import type { CalendarEvent } from "@/types";

function parseISODateOnly(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatISODateOnly(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

/** Places each event on every calendar day it spans (inclusive). */
export function buildEventsByDateMap(
  events: CalendarEvent[],
): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const start = parseISODateOnly(event.start_date);
    const end = event.end_date ? parseISODateOnly(event.end_date) : new Date(start);
    const cursor = new Date(start.getTime());
    while (cursor.getTime() <= end.getTime()) {
      const key = formatISODateOnly(cursor);
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
      cursor.setDate(cursor.getDate() + 1);
    }
  }
  return map;
}
