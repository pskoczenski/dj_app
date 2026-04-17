"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { conversationsService } from "@/lib/services/conversations";
import { createClient } from "@/lib/supabase/client";
import type { ConversationInboxItem } from "@/types";

type MessagingInboxContextValue = {
  conversations: ConversationInboxItem[];
  unreadTotal: number;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

const MessagingInboxContext = createContext<MessagingInboxContextValue | null>(
  null,
);

export function MessagingInboxProvider({
  userId,
  userLoading,
  children,
}: {
  userId: string | undefined;
  userLoading: boolean;
  children: ReactNode;
}) {
  const [conversations, setConversations] = useState<ConversationInboxItem[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchInbox = useCallback(
    async (opts?: { background?: boolean }) => {
      if (!userId) {
        setConversations([]);
        setError(null);
        setLoading(false);
        return;
      }
      const background = opts?.background === true;
      if (!background) {
        setLoading(true);
        setError(null);
      }
      try {
        const data = await conversationsService.getInbox(userId);
        setConversations(data);
        if (!background) setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        if (!background) setLoading(false);
      }
    },
    [userId],
  );

  useEffect(() => {
    if (userLoading) return;
    void fetchInbox({ background: false });
  }, [fetchInbox, userLoading]);

  useEffect(() => {
    if (!userId) return;
    const client = createClient();
    const channel = client
      .channel(`inbox:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => {
          void fetchInbox({ background: true });
        },
      )
      .subscribe();
    return () => {
      void client.removeChannel(channel);
    };
  }, [userId, fetchInbox]);

  const refetch = useCallback(
    () => fetchInbox({ background: false }),
    [fetchInbox],
  );

  const unreadTotal = useMemo(
    () => conversations.reduce((sum, c) => sum + c.unreadCount, 0),
    [conversations],
  );

  const value = useMemo(
    () => ({
      conversations,
      unreadTotal,
      loading,
      error,
      refetch,
    }),
    [conversations, unreadTotal, loading, error, refetch],
  );

  return (
    <MessagingInboxContext.Provider value={value}>
      {children}
    </MessagingInboxContext.Provider>
  );
}

export function useMessagingInbox(): MessagingInboxContextValue {
  const ctx = useContext(MessagingInboxContext);
  if (!ctx) {
    throw new Error(
      "useMessagingInbox must be used within MessagingInboxProvider",
    );
  }
  return ctx;
}
