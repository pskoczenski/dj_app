"use client";

import { ConversationListItem } from "@/components/messages/ConversationListItem";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useConversations } from "@/hooks/use-conversations";

export default function MessagesInboxPage() {
  const { conversations, loading } = useConversations();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <h1 className="font-display text-2xl font-bold text-bone">Messages</h1>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-default" />
          <Skeleton className="h-16 w-full rounded-default" />
          <Skeleton className="h-16 w-full rounded-default" />
          <Skeleton className="h-16 w-full rounded-default" />
        </div>
      ) : conversations.length === 0 ? (
        <EmptyState
          title="No messages yet"
          description="Find DJs and start your first conversation."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {conversations.map((conversation) => (
            <ConversationListItem
              key={conversation.id}
              conversation={conversation}
            />
          ))}
        </div>
      )}
    </div>
  );
}
