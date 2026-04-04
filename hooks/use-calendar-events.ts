"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { buildEventsByDateMap } from "@/lib/calendar-events-map";
import { eventsService } from "@/lib/services/events";
import type { CalendarEvent } from "@/types";

export type UseCalendarEventsOptions = {
  cityId?: string;
  genreIds?: string[];
};

function buildCalendarFetchOptions(options: UseCalendarEventsOptions) {
  const out: { cityId?: string; genreIds?: string[] } = {};
  if (options.cityId) out.cityId = options.cityId;
  if (options.genreIds?.length) out.genreIds = options.genreIds;
  return out;
}

export function useCalendarEvents(
  startDate: string,
  endDate: string,
  options: UseCalendarEventsOptions = {},
) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [eventsByDate, setEventsByDate] = useState<
    Map<string, CalendarEvent[]>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const requestIdRef = useRef(0);

  const optionsKey = JSON.stringify({
    c: options.cityId ?? null,
    g: [...(options.genreIds ?? [])].sort(),
  });

  const runFetch = useCallback(async () => {
    const id = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const parsed = JSON.parse(optionsKey) as {
        c: string | null;
        g: string[];
      };
      const fetchOpts = buildCalendarFetchOptions({
        cityId: parsed.c ?? undefined,
        genreIds: parsed.g.length ? parsed.g : undefined,
      });
      const data = await eventsService.getEventsByDateRange(
        startDate,
        endDate,
        fetchOpts,
      );
      if (id !== requestIdRef.current) return;
      setEvents(data);
      setEventsByDate(buildEventsByDateMap(data));
    } catch (e) {
      if (id !== requestIdRef.current) return;
      if (process.env.NODE_ENV === "development") {
        console.error("Calendar events fetch failed:", e);
      }
      setError(e instanceof Error ? e : new Error(String(e)));
      setEvents([]);
      setEventsByDate(new Map());
    } finally {
      if (id === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [startDate, endDate, optionsKey]);

  useEffect(() => {
    void runFetch();
  }, [runFetch]);

  const refetch = useCallback(async () => {
    await runFetch();
  }, [runFetch]);

  return { events, eventsByDate, loading, error, refetch };
}
