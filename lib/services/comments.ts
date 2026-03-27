import { createClient } from "@/lib/supabase/client";
import { TABLES } from "@/lib/db/schema-constants";
import type { CommentWithAuthor, CommentableType } from "@/types";

const DEFAULT_COMMENTS_PAGE_SIZE = 20;

function supabase() {
  return createClient();
}

async function resolveCurrentUserId(): Promise<string | null> {
  const {
    data: { user },
    error,
  } = await supabase().auth.getUser();
  if (error) throw error;
  return user?.id ?? null;
}

export async function getComments(
  commentableType: CommentableType,
  commentableId: string,
  options: { limit?: number; offset?: number } = {},
): Promise<{ comments: CommentWithAuthor[]; totalCount: number }> {
  const limit = options.limit ?? DEFAULT_COMMENTS_PAGE_SIZE;
  const offset = options.offset ?? 0;
  const currentUserId = await resolveCurrentUserId();

  const { data, error, count } = await supabase()
    .from(TABLES.comments)
    .select(
      "id,body,created_at,updated_at,profile_id,author:profiles!comments_profile_id_fkey(id,display_name,slug,profile_image_url)",
      { count: "exact" },
    )
    .eq("commentable_type", commentableType)
    .eq("commentable_id", commentableId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  const rows = (data ?? []) as Array<{
    id: string;
    body: string;
    created_at: string | null;
    updated_at: string | null;
    profile_id: string;
    author: {
      id: string;
      display_name: string;
      slug: string;
      profile_image_url: string | null;
    } | null;
  }>;
  const ids = rows.map((r) => r.id);
  if (ids.length === 0) {
    return { comments: [], totalCount: count ?? 0 };
  }

  const { data: likesData, error: likesErr } = await supabase()
    .from(TABLES.commentLikes)
    .select("comment_id")
    .in("comment_id", ids);
  if (likesErr) throw likesErr;

  const likeCountByComment = new Map<string, number>();
  for (const row of likesData ?? []) {
    likeCountByComment.set(
      row.comment_id,
      (likeCountByComment.get(row.comment_id) ?? 0) + 1,
    );
  }

  let likedByMe = new Set<string>();
  if (currentUserId) {
    const { data: likedRows, error: likedErr } = await supabase()
      .from(TABLES.commentLikes)
      .select("comment_id")
      .eq("profile_id", currentUserId)
      .in("comment_id", ids);
    if (likedErr) throw likedErr;
    likedByMe = new Set((likedRows ?? []).map((r) => r.comment_id));
  }

  return {
    comments: rows.map((r) => ({
      id: r.id,
      body: r.body,
      created_at: r.created_at,
      updated_at: r.updated_at,
      profile_id: r.profile_id,
      author: r.author
        ? {
            display_name: r.author.display_name,
            slug: r.author.slug,
            profile_image_url: r.author.profile_image_url,
          }
        : null,
      likeCount: likeCountByComment.get(r.id) ?? 0,
      likedByMe: likedByMe.has(r.id),
    })),
    totalCount: count ?? 0,
  };
}

export async function getCommentCount(
  commentableType: CommentableType,
  commentableId: string,
): Promise<number> {
  const { count, error } = await supabase()
    .from(TABLES.comments)
    .select("id", { count: "exact", head: true })
    .eq("commentable_type", commentableType)
    .eq("commentable_id", commentableId)
    .is("deleted_at", null);
  if (error) throw error;
  return count ?? 0;
}

export async function create(
  commentableType: CommentableType,
  commentableId: string,
  body: string,
): Promise<CommentWithAuthor> {
  const profileId = await resolveCurrentUserId();
  if (!profileId) throw new Error("Authentication required.");

  const trimmed = body.trim();
  if (!trimmed) throw new Error("Comment body cannot be empty.");

  const { data, error } = await supabase()
    .from(TABLES.comments)
    .insert({
      commentable_type: commentableType,
      commentable_id: commentableId,
      profile_id: profileId,
      body: trimmed,
    })
    .select("id,body,created_at,updated_at,profile_id")
    .single();
  if (error) throw error;

  const { data: authorRow, error: authorErr } = await supabase()
    .from(TABLES.profiles)
    .select("display_name,slug,profile_image_url")
    .eq("id", profileId)
    .single();
  if (authorErr) throw authorErr;

  return {
    id: data.id,
    body: data.body,
    created_at: data.created_at,
    updated_at: data.updated_at,
    profile_id: data.profile_id,
    author: {
      display_name: authorRow.display_name,
      slug: authorRow.slug,
      profile_image_url: authorRow.profile_image_url,
    },
    likeCount: 0,
    likedByMe: false,
  };
}

export async function softDelete(commentId: string): Promise<boolean> {
  const { error } = await supabase()
    .from(TABLES.comments)
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", commentId);
  if (error) throw error;
  return true;
}

export const commentsService = {
  getComments,
  getCommentCount,
  create,
  softDelete,
};

export { DEFAULT_COMMENTS_PAGE_SIZE };
