"use client";

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  conversationsService,
  type MessageInsertInboxPayload,
} from "@/lib/services/conversations";
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

const SEEN_MESSAGE_IDS_MAX = 500;

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

  const conversationsRef = useRef<ConversationInboxItem[]>([]);
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  const inboxPatchChainRef = useRef(Promise.resolve());
  const seenMessageIdsRef = useRef<Set<string>>(new Set());

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
        conversationsRef.current = data;
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
    startTransition(() => {
      void fetchInbox({ background: false });
    });
  }, [fetchInbox, userLoading]);

  useEffect(() => {
    if (!userId) return;
    const client = createClient();
    const channel = client
      .channel(`inbox:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const row = payload.new as Partial<MessageInsertInboxPayload> | null;
          if (
            !row?.id ||
            !row.conversation_id ||
            !row.body ||
            !row.sender_id
          ) {
            void fetchInbox({ background: true });
            return;
          }
          if (seenMessageIdsRef.current.has(row.id)) return;
          seenMessageIdsRef.current.add(row.id);
          if (seenMessageIdsRef.current.size > SEEN_MESSAGE_IDS_MAX) {
            seenMessageIdsRef.current.clear();
          }

          const message: MessageInsertInboxPayload = {
            id: row.id,
            conversation_id: row.conversation_id,
            body: row.body,
            sender_id: row.sender_id,
            created_at: row.created_at ?? null,
          };

          inboxPatchChainRef.current = inboxPatchChainRef.current
            .then(async () => {
              try {
                const prev = conversationsRef.current;
                const out =
                  await conversationsService.patchInboxAfterMessageInsert(
                    prev,
                    message,
                    userId,
                  );
                if (out === "refetch") {
                  await fetchInbox({ background: true });
                  return;
                }
                conversationsRef.current = out;
                setConversations(out);
              } catch {
                await fetchInbox({ background: true });
              }
            })
            .catch(() => {
              void fetchInbox({ background: true });
            });
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
