"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { MessageWithSender } from "@/types";

function timeLabel(ts: string | null): string {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function MessageBubble({
  message,
  isOwn,
}: {
  message: MessageWithSender;
  isOwn: boolean;
}) {
  const name = message.sender?.display_name ?? "Unknown";
  const initials = name
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const avatarSrc = message.sender?.profile_image_url ?? null;

  return (
    <div
      className={cn("flex gap-2", isOwn ? "justify-end" : "justify-start")}
      data-testid={isOwn ? "message-own" : "message-other"}
    >
      {!isOwn && (
        <Avatar className="mt-0.5 size-8">
          {avatarSrc ? (
            <AvatarImage src={avatarSrc} alt={name} />
          ) : null}
          <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          "max-w-[85%] rounded-default border px-3 py-2 text-sm",
          isOwn
            ? "border-sage-edge bg-forest-shadow text-bone"
            : "border-root-line bg-dark-moss text-stone",
        )}
      >
        <p className="mb-1 text-[10px] text-fog">
          {isOwn ? "You" : name} · {timeLabel(message.created_at)}
        </p>
        <p className="whitespace-pre-wrap">
          {message.deleted_at ? "This message was deleted" : message.body}
        </p>
      </div>
    </div>
  );
}
