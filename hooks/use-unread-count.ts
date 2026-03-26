"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CONVERSATIONS_POLL_INTERVAL_MS,
  conversationsService,
} from "@/lib/services/conversations";
import { useCurrentUser } from "@/hooks/use-current-user";

export function useUnreadCount() {
  const { user, loading: userLoading } = useCurrentUser();
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    if (!user?.id) {
      setCount(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const inbox = await conversationsService.getInbox(user.id);
      setCount(inbox.reduce((sum, c) => sum + c.unreadCount, 0));
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (userLoading) return;
    void fetch();
  }, [fetch, userLoading]);

  useEffect(() => {
    if (!user?.id) return;
    const timer = setInterval(() => {
      void fetch();
    }, CONVERSATIONS_POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetch, user?.id]);

  return { count, loading, error, refetch: fetch };
}
