"use client";

import { useCallback, useEffect, useState } from "react";
import { eventsService, type EventFilters } from "@/lib/services/events";
import type { Event } from "@/types";

export function useEvents(filters: EventFilters = {}) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const serialized = JSON.stringify(filters);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await eventsService.getAll(JSON.parse(serialized));
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [serialized]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { events, loading, error, refetch: fetch };
}
