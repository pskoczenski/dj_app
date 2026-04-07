"use client";

import { useEffect, useState } from "react";
import { commentsService } from "@/lib/services/comments";
import type { CommentableType } from "@/types";

export function useCommentCount(commentableType: CommentableType, commentableId: string) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!commentableId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    commentsService
      .getCommentCount(commentableType, commentableId)
      .then((next) => {
        if (!cancelled) setCount(next);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [commentableId, commentableType]);

  return { count, loading };
}
