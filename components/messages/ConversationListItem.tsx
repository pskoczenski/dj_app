"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { ConversationInboxItem } from "@/types";

function relativeTime(ts: string | null): string {
  if (!ts) return "";
  const d = new Date(ts);
  const now = Date.now();
  const diffMs = now - d.getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  if (hr < 48) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ConversationListItem({
  conversation,
}: {
  conversation: ConversationInboxItem;
}) {
  const isDm = conversation.type === "dm";
  const title = isDm
    ? conversation.otherParticipant?.display_name ?? "Direct Message"
    : conversation.event?.title ?? "Event Group Chat";
  const subtitle = conversation.lastMessage?.body ?? "No messages yet";
  const ts = conversation.lastMessage?.created_at ?? conversation.updated_at;
  const href = `/messages/${conversation.id}`;
  const initials = title
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const avatarSrc = isDm
    ? conversation.otherParticipant?.profile_image_url ?? null
    : conversation.event?.flyer_image_url ?? null;

  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-default border border-root-line p-3 transition-colors hover:border-sage-edge"
    >
      <Avatar className="size-10">
        {avatarSrc ? (
          <AvatarImage src={avatarSrc} alt={title} />
        ) : null}
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-bone">{title}</p>
        <p className="truncate text-xs text-stone">{subtitle}</p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className="text-[10px] text-fog">{relativeTime(ts ?? null)}</span>
        {conversation.unreadCount > 0 ? (
          <>
            <span className="size-2 rounded-full bg-fern" aria-label="Unread" />
            <Badge variant="outline" className="text-[10px]">
              {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
            </Badge>
          </>
        ) : null}
      </div>
    </Link>
  );
}
