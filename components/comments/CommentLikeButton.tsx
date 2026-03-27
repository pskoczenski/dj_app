"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCommentLike } from "@/hooks/use-comment-like";

export function CommentLikeButton({
  commentId,
  initialLiked,
  initialCount,
  disabled: disabledProp = false,
}: {
  commentId: string;
  initialLiked: boolean;
  initialCount: number;
  disabled?: boolean;
}) {
  const { liked, likeCount, toggleLike } = useCommentLike(
    commentId,
    initialLiked,
    initialCount,
  );
  const [toggling, setToggling] = useState(false);

  async function onClick() {
    if (disabledProp || toggling) return;
    setToggling(true);
    try {
      await toggleLike();
    } finally {
      setToggling(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void onClick()}
      disabled={disabledProp || toggling}
      className={cn(
        "inline-flex items-center gap-1 rounded-default px-1 py-0.5 text-xs text-fog transition-transform motion-reduce:transform-none",
        toggling && "pointer-events-none opacity-70",
        liked && "scale-110 text-dried-blood motion-reduce:scale-100",
      )}
      aria-label={liked ? "Unlike comment" : "Like comment"}
      aria-pressed={liked}
    >
      <Heart
        className={cn(
          "size-3.5 shrink-0 transition-colors motion-reduce:transition-none",
          liked
            ? "fill-dried-blood text-dried-blood"
            : "fill-transparent text-fog",
        )}
        strokeWidth={liked ? 0 : 2}
        aria-hidden
      />
      {likeCount > 0 ? (
        <span className="tabular-nums">{likeCount}</span>
      ) : null}
    </button>
  );
}
