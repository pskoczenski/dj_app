"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CONVERSATIONS_POLL_INTERVAL_MS,
  conversationsService,
} from "@/lib/services/conversations";
import { useCurrentUser } from "@/hooks/use-current-user";
import type { ConversationInboxItem } from "@/types";

export function useConversations() {
  const { user, loading: userLoading } = useCurrentUser();
  const [conversations, setConversations] = useState<ConversationInboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    if (!user?.id) {
      setConversations([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await conversationsService.getInbox(user.id);
      setConversations(data);
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

  return { conversations, loading, error, refetch: fetch };
}
