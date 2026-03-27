"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { buildEventsByDateMap } from "@/lib/calendar-events-map";
import { eventsService } from "@/lib/services/events";
import type { CalendarEvent } from "@/types";

export function useCalendarEvents(startDate: string, endDate: string) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [eventsByDate, setEventsByDate] = useState<
    Map<string, CalendarEvent[]>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const requestIdRef = useRef(0);

  const runFetch = useCallback(async () => {
    const id = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const data = await eventsService.getEventsByDateRange(startDate, endDate);
      if (id !== requestIdRef.current) return;
      setEvents(data);
      setEventsByDate(buildEventsByDateMap(data));
    } catch (e) {
      if (id !== requestIdRef.current) return;
      setError(e instanceof Error ? e : new Error(String(e)));
      setEvents([]);
      setEventsByDate(new Map());
    } finally {
      if (id === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [startDate, endDate]);

  useEffect(() => {
    void runFetch();
  }, [runFetch]);

  const refetch = useCallback(async () => {
    await runFetch();
  }, [runFetch]);

  return { events, eventsByDate, loading, error, refetch };
}
