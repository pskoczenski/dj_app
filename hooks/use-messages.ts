"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_MESSAGES_PAGE_SIZE,
  MESSAGES_POLL_INTERVAL_MS,
  messagesService,
} from "@/lib/services/messages";
import { conversationsService } from "@/lib/services/conversations";
import { useCurrentUser } from "@/hooks/use-current-user";
import type { MessageWithSender } from "@/types";

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
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [sending, setSending] = useState(false);
  const lastSeenNewestRef = useRef<string | null>(null);

  const markAsReadIfNew = useCallback(
    async (incoming: MessageWithSender[]) => {
      if (!conversationId || !user?.id || incoming.length === 0) return;
      const newest = incoming[0]?.created_at ?? null;
      if (!newest || newest === lastSeenNewestRef.current) return;
      lastSeenNewestRef.current = newest;
      await conversationsService.markAsRead(conversationId, user.id);
    },
    [conversationId, user?.id],
  );

  const fetchLatest = useCallback(async () => {
    if (!conversationId || !user?.id) {
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
  }, [conversationId, markAsReadIfNew, user?.id]);

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

  useEffect(() => {
    if (userLoading) return;
    void fetchLatest();
  }, [fetchLatest, userLoading]);

  useEffect(() => {
    if (!conversationId || !user?.id) return;
    const timer = setInterval(() => {
      void fetchLatest();
    }, MESSAGES_POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [conversationId, fetchLatest, user?.id]);

  return {
    messages,
    loading,
    error,
    hasMore,
    sending,
    loadMore,
    sendMessage,
    refetch: fetchLatest,
  };
}
