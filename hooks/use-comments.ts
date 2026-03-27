"use client";

import { useCallback, useEffect, useState } from "react";
import { commentsService, DEFAULT_COMMENTS_PAGE_SIZE } from "@/lib/services/comments";
import { toast } from "sonner";
import type { CommentWithAuthor, CommentableType } from "@/types";

export function useComments(commentableType: CommentableType, commentableId: string) {
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!commentableId) {
      setComments([]);
      setTotalCount(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await commentsService.getComments(commentableType, commentableId, {
        limit: DEFAULT_COMMENTS_PAGE_SIZE,
        offset: 0,
      });
      setComments(result.comments);
      setTotalCount(result.totalCount);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [commentableId, commentableType]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const loadMore = useCallback(async () => {
    if (!commentableId || comments.length >= totalCount) return;
    const result = await commentsService.getComments(commentableType, commentableId, {
      limit: DEFAULT_COMMENTS_PAGE_SIZE,
      offset: comments.length,
    });
    setComments((prev) => [...prev, ...result.comments]);
    setTotalCount(result.totalCount);
  }, [commentableId, commentableType, comments.length, totalCount]);

  const addComment = useCallback(
    async (body: string) => {
      const tempId = `tmp-${Date.now()}`;
      const optimistic: CommentWithAuthor = {
        id: tempId,
        body: body.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        profile_id: "",
        author: null,
        likeCount: 0,
        likedByMe: false,
      };
      setComments((prev) => [optimistic, ...prev]);
      setTotalCount((prev) => prev + 1);

      try {
        const created = await commentsService.create(commentableType, commentableId, body);
        setComments((prev) => [created, ...prev.filter((c) => c.id !== tempId)]);
      } catch (err) {
        setComments((prev) => prev.filter((c) => c.id !== tempId));
        setTotalCount((prev) => Math.max(0, prev - 1));
        toast.error("Could not add comment.");
        throw err;
      }
    },
    [commentableId, commentableType],
  );

  const deleteComment = useCallback(async (commentId: string) => {
    const existing = comments.find((c) => c.id === commentId);
    if (!existing) return;
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setTotalCount((prev) => Math.max(0, prev - 1));
    try {
      await commentsService.softDelete(commentId);
    } catch (err) {
      setComments((prev) => [existing, ...prev]);
      setTotalCount((prev) => prev + 1);
      toast.error("Could not delete comment.");
      throw err;
    }
  }, [comments]);

  return {
    comments,
    totalCount,
    loading,
    error,
    loadMore,
    addComment,
    deleteComment,
    refetch,
  };
}
