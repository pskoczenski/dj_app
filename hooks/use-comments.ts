"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  commentsService,
  DEFAULT_COMMENTS_PAGE_SIZE,
} from "@/lib/services/comments";
import { useCurrentUser } from "@/hooks/use-current-user";
import { toast } from "sonner";
import type { CommentWithAuthor, CommentableType } from "@/types";

export type UseCommentsOptions = {
  subscribeRealtime?: boolean;
};

type CommentRowRealtime = {
  id?: string;
  commentable_type?: string;
  commentable_id?: string;
  profile_id?: string;
  body?: string | null;
  updated_at?: string | null;
  deleted_at?: string | null;
};

function rowMatchesTarget(
  row: CommentRowRealtime | undefined,
  commentableType: CommentableType,
  commentableId: string,
): boolean {
  return (
    row?.commentable_type === commentableType &&
    row?.commentable_id === commentableId
  );
}

export function useComments(
  commentableType: CommentableType,
  commentableId: string,
  options: UseCommentsOptions = {},
) {
  const subscribeRealtime = options.subscribeRealtime ?? false;
  const { user } = useCurrentUser();
  const userId = user?.id ?? null;

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

  const syncFirstPageOnly = useCallback(async () => {
    if (!commentableId) return;
    try {
      const result = await commentsService.getComments(
        commentableType,
        commentableId,
        { limit: DEFAULT_COMMENTS_PAGE_SIZE, offset: 0 },
      );
      setComments(result.comments);
      setTotalCount(result.totalCount);
    } catch {
      /* Realtime fallback — avoid surfacing unrelated errors here */
    }
  }, [commentableId, commentableType]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  useEffect(() => {
    if (!subscribeRealtime || !commentableId) return;

    const client = createClient();
    const channelTopic = `comments:${commentableType}:${commentableId}`;
    const filter = `commentable_id=eq.${commentableId}`;

    const channel = client
      .channel(channelTopic)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
          filter,
        },
        async (payload) => {
          const row = payload.new as CommentRowRealtime;
          if (!rowMatchesTarget(row, commentableType, commentableId)) return;

          const authorId = row.profile_id ?? "";
          if (userId && authorId === userId) return;

          const id = row.id;
          if (!id) {
            void syncFirstPageOnly();
            return;
          }

          try {
            const hydrated = await commentsService.getCommentWithAuthor(id);
            if (!hydrated) {
              void syncFirstPageOnly();
              return;
            }
            setComments((prev) => {
              if (prev.some((c) => c.id === hydrated.id)) return prev;
              return [hydrated, ...prev];
            });
            const count = await commentsService.getCommentCount(
              commentableType,
              commentableId,
            );
            setTotalCount(count);
          } catch {
            void syncFirstPageOnly();
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "comments",
          filter,
        },
        (payload) => {
          const row = payload.new as CommentRowRealtime;
          if (!rowMatchesTarget(row, commentableType, commentableId)) return;

          const id = row.id;
          if (!id) {
            void syncFirstPageOnly();
            return;
          }

          if (row.deleted_at) {
            setComments((prev) => prev.filter((c) => c.id !== id));
            setTotalCount((t) => Math.max(0, t - 1));
            return;
          }

          const body = row.body;
          const updatedAt = row.updated_at;
          if (typeof body !== "string" || !updatedAt) return;

          setComments((prev) =>
            prev.map((c) =>
              c.id === id
                ? { ...c, body, updated_at: updatedAt }
                : c,
            ),
          );
        },
      );

    void channel.subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [
    commentableId,
    commentableType,
    subscribeRealtime,
    syncFirstPageOnly,
    userId,
  ]);

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

  const updateComment = useCallback(
    async (commentId: string, body: string) => {
      const existing = comments.find((c) => c.id === commentId);
      if (!existing || commentId.startsWith("tmp-")) return;
      const trimmed = body.trim();
      if (!trimmed) {
        toast.error("Comment cannot be empty.");
        return;
      }

      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, body: trimmed } : c,
        ),
      );
      try {
        const saved = await commentsService.update(commentId, body);
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId
              ? {
                  ...c,
                  body: saved.body,
                  created_at: saved.created_at,
                  updated_at: saved.updated_at,
                  profile_id: saved.profile_id,
                  author: saved.author ?? c.author,
                }
              : c,
          ),
        );
      } catch (err) {
        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? existing : c)),
        );
        toast.error("Could not save comment.");
        throw err;
      }
    },
    [comments],
  );

  const hasMore =
    Boolean(commentableId) && totalCount > 0 && comments.length < totalCount;

  return {
    comments,
    totalCount,
    loading,
    error,
    hasMore,
    loadMore,
    addComment,
    deleteComment,
    updateComment,
    refetch,
  };
}
