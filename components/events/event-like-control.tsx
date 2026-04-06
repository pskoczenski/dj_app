"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { eventLikesService } from "@/lib/services/event-likes";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export type EventLikeControlProps = {
  eventId: string;
  likesCount: number;
  likedByMe?: boolean;
  currentUserId?: string | null;
  onLikeChange?: (next: { liked: boolean; likesCount: number }) => void;
  className?: string;
  /** Card footer vs detail header */
  variant?: "footer" | "inline";
};

export function EventLikeControl({
  eventId,
  likesCount: initialCount,
  likedByMe = false,
  currentUserId = null,
  onLikeChange,
  className,
  variant = "inline",
}: EventLikeControlProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [liked, setLiked] = useState(likedByMe);
  const [likesCount, setLikesCount] = useState(initialCount);
  const [likePending, setLikePending] = useState(false);

  useEffect(() => {
    setLiked(likedByMe);
  }, [likedByMe, eventId]);

  useEffect(() => {
    setLikesCount(initialCount);
  }, [initialCount, eventId]);

  async function handleLikeClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUserId) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    const wasLiked = liked;
    const prevCount = likesCount;
    setLikePending(true);
    setLiked(!wasLiked);
    setLikesCount((c) => (wasLiked ? Math.max(0, c - 1) : c + 1));
    try {
      const next = await eventLikesService.toggleLike(eventId, currentUserId);
      setLiked(next.liked);
      setLikesCount(next.likesCount);
      onLikeChange?.(next);
    } catch {
      setLiked(wasLiked);
      setLikesCount(prevCount);
      toast.error("Couldn’t update like. Try again.");
    } finally {
      setLikePending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={(e) => void handleLikeClick(e)}
      disabled={likePending}
      aria-pressed={liked}
      aria-label={liked ? "Unlike this event" : "Like this event"}
      className={cn(
        "flex items-center gap-0.5 rounded-default px-1.5 py-1 text-fog transition-colors hover:bg-forest-shadow/80 hover:text-bone disabled:opacity-50",
        variant === "footer" && "text-bone/90",
        className,
      )}
    >
      <Heart
        className={cn(
          "size-4 shrink-0 transition-colors",
          liked
            ? "fill-mb-turquoise-pale text-mb-turquoise-pale"
            : "fill-transparent text-fog",
        )}
        strokeWidth={liked ? 0 : 2}
        aria-hidden
      />
      <span className="text-xs tabular-nums text-bone">{likesCount}</span>
    </button>
  );
}
