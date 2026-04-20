"use client";

import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_MESSAGES_PAGE_SIZE, messagesService } from "@/lib/services/messages";
import { conversationsService } from "@/lib/services/conversations";
import { useCurrentUser } from "@/hooks/use-current-user";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { MessageWithSender } from "@/types";

const TYPING_SEND_MIN_MS = 1500;
const TYPING_PEER_IDLE_MS = 3000;

function uniqueById(items: MessageWithSender[]): MessageWithSender[] {
  const seen = new Set<string>();
  const out: MessageWithSender[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

export function useMessages(conversationId: string) {
  const { user, loading: userLoading } = useCurrentUser();
  const userId = user?.id;
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingPeerIds, setTypingPeerIds] = useState<string[]>([]);
  const lastSeenNewestRef = useRef<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const realtimeSubscribedRef = useRef(false);
  const lastTypingSentAtRef = useRef(0);
  const typingPeerTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const markAsReadIfNew = useCallback(
    async (incoming: MessageWithSender[]) => {
      if (!conversationId || !userId || incoming.length === 0) return;
      const newest = incoming[0]?.created_at ?? null;
      if (!newest || newest === lastSeenNewestRef.current) return;
      lastSeenNewestRef.current = newest;
      await conversationsService.markAsRead(conversationId, userId);
    },
    [conversationId, userId],
  );

  const fetchLatest = useCallback(async () => {
    if (!conversationId || !userId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await messagesService.getMessages(conversationId, {
        limit: DEFAULT_MESSAGES_PAGE_SIZE,
      });
      setMessages(data);
      setHasMore(data.length === DEFAULT_MESSAGES_PAGE_SIZE);
      await markAsReadIfNew(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [conversationId, markAsReadIfNew, userId]);

  const loadMore = useCallback(async () => {
    if (!conversationId || !hasMore || messages.length === 0) return;
    const oldest = messages[messages.length - 1]?.created_at ?? undefined;
    const older = await messagesService.getMessages(conversationId, {
      limit: DEFAULT_MESSAGES_PAGE_SIZE,
      before: oldest ?? undefined,
    });
    setMessages((prev) => uniqueById([...prev, ...older]));
    setHasMore(older.length === DEFAULT_MESSAGES_PAGE_SIZE);
  }, [conversationId, hasMore, messages]);

  const sendMessage = useCallback(
    async (body: string) => {
      if (!conversationId || !user?.id) throw new Error("Authentication required.");
      const trimmed = body.trim();
      if (!trimmed) return;

      const optimistic: MessageWithSender = {
        id: `tmp-${Date.now()}`,
        conversation_id: conversationId,
        sender_id: user.id,
        body: trimmed,
        created_at: new Date().toISOString(),
        deleted_at: null,
        sender: {
          id: user.id,
          display_name: user.displayName,
          slug: user.slug,
          profile_image_url: user.avatarUrl,
        },
      };

      setSending(true);
      setMessages((prev) => [optimistic, ...prev]);
      try {
        const sent = await messagesService.send(conversationId, trimmed, user.id);
        const sentWithSender: MessageWithSender = {
          ...sent,
          // `messagesService.send` may skip embedded sender profile data to avoid
          // insert+RETURNING embed failures. Preserve the optimistic sender instead.
          sender: sent.sender ?? optimistic.sender,
        };
        setMessages((prev) => [
          sentWithSender,
          ...prev.filter((m) => m.id !== optimistic.id),
        ]);
        await markAsReadIfNew([sentWithSender]);
      } catch (err) {
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        throw err;
      } finally {
        setSending(false);
      }
    },
    [conversationId, markAsReadIfNew, user],
  );

  /** `isActive` false = user cleared the compose box; send immediately so peers hide the indicator. */
  const notifyTyping = useCallback((isActive = true) => {
    if (!userId || !realtimeSubscribedRef.current || !channelRef.current) return;
    if (isActive) {
      const now = Date.now();
      if (now - lastTypingSentAtRef.current < TYPING_SEND_MIN_MS) return;
      lastTypingSentAtRef.current = now;
    }
    void channelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: { userId, active: isActive },
    });
  }, [userId]);

  useEffect(() => {
    lastSeenNewestRef.current = null;
  }, [conversationId]);

  useEffect(() => {
    if (userLoading) return;
    startTransition(() => {
      void fetchLatest();
    });
  }, [fetchLatest, userLoading]);

  useEffect(() => {
    startTransition(() => {
      setTypingPeerIds([]);
    });
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId || !userId) return;

    const typingTimeoutsForCleanup = typingPeerTimeoutsRef.current;

    const client = createClient();
    const channel = client.channel(`messages:${conversationId}`, {
      config: { broadcast: { self: false } },
    });

    const clearPeerTyping = (userId: string) => {
      const t = typingPeerTimeoutsRef.current.get(userId);
      if (t) clearTimeout(t);
      typingPeerTimeoutsRef.current.delete(userId);
      setTypingPeerIds((prev) => prev.filter((id) => id !== userId));
    };

    const refreshPeerTyping = (typingUserId: string) => {
      if (!typingUserId || typingUserId === userId) return;
      const existing = typingPeerTimeoutsRef.current.get(typingUserId);
      if (existing) clearTimeout(existing);
      setTypingPeerIds((prev) =>
        prev.includes(typingUserId) ? prev : [...prev, typingUserId],
      );
      const t = setTimeout(() => clearPeerTyping(typingUserId), TYPING_PEER_IDLE_MS);
      typingPeerTimeoutsRef.current.set(typingUserId, t);
    };

    channelRef.current = channel;
    realtimeSubscribedRef.current = false;

    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as { id?: string; sender_id?: string };
          if (row.sender_id === userId) return;
          const id = row.id;
          if (!id) {
            void fetchLatest();
            return;
          }
          void (async () => {
            try {
              const msg = await messagesService.getMessageWithSender(id);
              if (!msg) {
                void fetchLatest();
                return;
              }
              setMessages((prev) => {
                if (prev.some((m) => m.id === msg.id)) return prev;
                return [msg, ...prev];
              });
              await markAsReadIfNew([msg]);
            } catch {
              void fetchLatest();
            }
          })();
        },
      )
      .on("broadcast", { event: "typing" }, (broadcastPayload) => {
        const inner = broadcastPayload.payload as
          | { userId?: string; active?: boolean }
          | undefined;
        const uid = inner?.userId;
        if (!uid || uid === userId) return;
        const active = inner?.active !== false;
        if (!active) {
          clearPeerTyping(uid);
          return;
        }
        refreshPeerTyping(uid);
      })
      .subscribe((status) => {
        realtimeSubscribedRef.current = status === "SUBSCRIBED";
      });

    return () => {
      realtimeSubscribedRef.current = false;
      channelRef.current = null;
      for (const t of typingTimeoutsForCleanup.values()) {
        clearTimeout(t);
      }
      typingTimeoutsForCleanup.clear();
      void client.removeChannel(channel);
    };
  }, [conversationId, fetchLatest, markAsReadIfNew, userId]);

  return {
    messages,
    loading,
    error,
    hasMore,
    sending,
    loadMore,
    sendMessage,
    refetch: fetchLatest,
    typingPeerIds,
    notifyTyping,
  };
}
