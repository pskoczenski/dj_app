"use client";

import { useMessagingInbox } from "@/hooks/messaging-inbox-provider";
import type { ConversationInboxItem } from "@/types";

export function useConversations(): {
  conversations: ConversationInboxItem[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const { conversations, loading, error, refetch } = useMessagingInbox();
  return { conversations, loading, error, refetch };
}
