"use client";

import { useState } from "react";
import { commentLikesService } from "@/lib/services/comment-likes";
import { toast } from "sonner";

export function useCommentLike(
  commentId: string,
  initialLiked: boolean,
  initialCount: number,
) {
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialCount);

  async function toggleLike() {
    const prevLiked = liked;
    const prevCount = likeCount;
    const nextLiked = !prevLiked;
    setLiked(nextLiked);
    setLikeCount((prev) => Math.max(0, prev + (nextLiked ? 1 : -1)));

    try {
      const next = await commentLikesService.toggleLike(commentId);
      setLiked(next.liked);
      setLikeCount(next.likeCount);
    } catch (err) {
      setLiked(prevLiked);
      setLikeCount(prevCount);
      toast.error("Could not update like.");
      throw err;
    }
  }

  return {
    liked,
    likeCount,
    toggleLike,
  };
}
