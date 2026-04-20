"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ComposeBar } from "@/components/messages/ComposeBar";
import { MessageBubble } from "@/components/messages/MessageBubble";
import { CancelledBanner } from "@/components/events/cancelled-banner";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useConversations } from "@/hooks/use-conversations";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useMessages } from "@/hooks/use-messages";
import { conversationsService } from "@/lib/services/conversations";
import type { Profile } from "@/types";

export default function ConversationPage({
}: {
  params?: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user, loading: userLoading } = useCurrentUser();
  const {
    conversations,
    loading: inboxLoading,
    refetch: refetchInbox,
  } = useConversations();
  const {
    messages,
    loading,
    hasMore,
    loadMore,
    sendMessage,
    sending,
    typingPeerIds,
    notifyTyping,
  } = useMessages(conversationId);
  const [groupParticipants, setGroupParticipants] = useState<
    Pick<Profile, "id" | "display_name">[]
  >([]);

  const listRef = useRef<HTMLDivElement>(null);
  const previousCount = useRef(0);

  const conversation = useMemo(
    () => conversations.find((c) => c.id === conversationId) ?? null,
    [conversations, conversationId],
  );

  /** Inbox may not include this thread yet (e.g. deep link from event). Refetch once per id after inbox settles. */
  const inboxCatchUpRef = useRef<string | null>(null);

  useEffect(() => {
    if (!conversationId || !user?.id || inboxLoading) return;
    if (conversations.some((c) => c.id === conversationId)) {
      inboxCatchUpRef.current = null;
      return;
    }
    if (inboxCatchUpRef.current === conversationId) return;
    inboxCatchUpRef.current = conversationId;
    void refetchInbox();
  }, [
    conversationId,
    user?.id,
    inboxLoading,
    conversations,
    refetchInbox,
  ]);

  useEffect(() => {
    if (!conversation || conversation.type !== "event_group") return;
    conversationsService
      .getParticipants(conversation.id)
      .then((ps) =>
        setGroupParticipants(ps.map((p) => ({ id: p.id, display_name: p.display_name }))),
      )
      .catch(() => setGroupParticipants([]));
  }, [conversation]);

  const typingLabel = useMemo(() => {
    if (!typingPeerIds?.length) return null;
    if (conversation?.type === "dm" && conversation.otherParticipant) {
      const other = conversation.otherParticipant;
      if (typingPeerIds.includes(other.id)) {
        return `${other.display_name} is typing…`;
      }
      return "Someone is typing…";
    }
    const names = typingPeerIds
      .map((id) => groupParticipants.find((p) => p.id === id)?.display_name)
      .filter((n): n is string => Boolean(n));
    if (names.length === 0) return "Someone is typing…";
    if (names.length === 1) return `${names[0]} is typing…`;
    if (names.length === 2) return `${names[0]} and ${names[1]} are typing…`;
    return `${names[0]} and ${names.length - 1} others are typing…`;
  }, [conversation, groupParticipants, typingPeerIds]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    const onInitial = previousCount.current === 0;
    if (onInitial || nearBottom || messages.length > previousCount.current) {
      el.scrollTop = el.scrollHeight;
    }
    previousCount.current = messages.length;
  }, [messages]);

  if (userLoading || inboxLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (loading && messages.length === 0) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <EmptyState
        title="Conversation not found"
        description="You may not have access to this conversation."
      />
    );
  }

  const isDm = conversation.type === "dm";
  const linkedEvent = !isDm ? conversation.event : null;
  const showRemovedBanner = Boolean(linkedEvent?.deleted_at);
  const showCancelledBanner =
    Boolean(linkedEvent) &&
    linkedEvent?.status === "cancelled" &&
    !linkedEvent?.deleted_at;

  const headerTitle = isDm
    ? conversation.otherParticipant?.display_name ?? "Direct Message"
    : conversation.event?.title ?? "Event Group Chat";
  const headerHref = isDm
    ? conversation.otherParticipant?.slug
      ? `/dj/${conversation.otherParticipant.slug}`
      : undefined
    : conversation.event?.id
      ? `/events/${conversation.event.id}`
      : undefined;
  const initials = headerTitle
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const headerAvatarSrc = isDm
    ? conversation.otherParticipant?.profile_image_url ?? null
    : conversation.event?.flyer_image_url ?? null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
      <div className="flex items-center gap-3">
        <Link href="/messages" className="text-stone hover:text-bone" aria-label="Back to messages">
          <ArrowLeft className="size-5" />
        </Link>
        <Avatar className="size-10">
          {headerAvatarSrc ? (
            <AvatarImage src={headerAvatarSrc} alt={headerTitle} />
          ) : null}
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          {headerHref ? (
            <Link href={headerHref} className="truncate text-sm font-semibold text-bone hover:underline">
              {headerTitle}
            </Link>
          ) : (
            <p className="truncate text-sm font-semibold text-bone">{headerTitle}</p>
          )}
          {!isDm && groupParticipants.length > 0 ? (
            <p className="truncate text-xs text-fog">
              {groupParticipants.map((p) => p.display_name).join(", ")}
            </p>
          ) : null}
        </div>
      </div>

      {showRemovedBanner ? (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-default border border-dried-blood/40 bg-dried-blood/10 px-4 py-3 text-sm font-medium text-dried-blood"
        >
          This event has been removed.
        </div>
      ) : null}
      {showCancelledBanner ? <CancelledBanner /> : null}

      <div
        ref={listRef}
        className="min-h-[18rem] max-h-[calc(100vh-16rem)] overflow-y-auto rounded-default border border-root-line p-3"
      >
        {hasMore ? (
          <div className="mb-3 flex justify-center">
            <Button variant="outline" size="sm" onClick={() => void loadMore()}>
              Load more
            </Button>
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          {[...messages].reverse().map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.sender_id === user?.id}
            />
          ))}
        </div>
      </div>

      {typingLabel ? (
        <p className="px-1 text-xs text-fog min-h-[1.25rem]" aria-live="polite">
          {typingLabel}
        </p>
      ) : (
        <div className="min-h-[1.25rem]" aria-hidden />
      )}

      <ComposeBar
        sending={sending}
        onDraftChange={(draft) => {
          if (draft.trim().length > 0) notifyTyping();
        }}
        onSend={async (body) => {
          await sendMessage(body);
        }}
      />
    </div>
  );
}
