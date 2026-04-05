"use client";

import { useMessagingInbox } from "@/hooks/messaging-inbox-provider";

export function useUnreadCount() {
  const { unreadTotal, loading, error, refetch } = useMessagingInbox();
  return { count: unreadTotal, loading, error, refetch };
}
