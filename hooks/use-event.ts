"use client";

import { useCallback, useEffect, useState } from "react";
import { eventsService } from "@/lib/services/events";
import { eventLineupService } from "@/lib/services/event-lineup";
import type { Event, EventLineup } from "@/types";

export function useEvent(id: string) {
  const [event, setEvent] = useState<Event | null>(null);
  const [lineup, setLineup] = useState<EventLineup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [ev, lu] = await Promise.all([
        eventsService.getById(id),
        eventLineupService.listForEvent(id),
      ]);
      setEvent(ev);
      setLineup(lu);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { event, lineup, loading, error, refetch: fetch };
}
