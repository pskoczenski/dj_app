import { createClient } from "@/lib/supabase/client";
import { TABLES } from "@/lib/db/schema-constants";
import type { CommentLikeState } from "@/types";

function supabase() {
  return createClient();
}

async function resolveCurrentUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase().auth.getUser();
  if (error) throw error;
  if (!user) throw new Error("Authentication required.");
  return user.id;
}

async function getLikeCount(commentId: string): Promise<number> {
  const { count, error } = await supabase()
    .from(TABLES.commentLikes)
    .select("id", { count: "exact", head: true })
    .eq("comment_id", commentId);
  if (error) throw error;
  return count ?? 0;
}

export async function toggleLike(commentId: string): Promise<CommentLikeState> {
  const profileId = await resolveCurrentUserId();
  const sb = supabase();

  const { data: existing, error: selErr } = await sb
    .from(TABLES.commentLikes)
    .select("id")
    .eq("comment_id", commentId)
    .eq("profile_id", profileId)
    .maybeSingle();
  if (selErr) throw selErr;

  let liked: boolean;
  if (existing) {
    const { error: delErr } = await sb
      .from(TABLES.commentLikes)
      .delete()
      .eq("id", existing.id);
    if (delErr) throw delErr;
    liked = false;
  } else {
    const { error: insErr } = await sb.from(TABLES.commentLikes).insert({
      comment_id: commentId,
      profile_id: profileId,
    });
    if (insErr && (insErr as { code?: string }).code !== "23505") throw insErr;
    liked = true;
  }

  const likeCount = await getLikeCount(commentId);
  return { liked, likeCount };
}

export async function getLikedCommentIds(commentIds: string[]): Promise<string[]> {
  if (commentIds.length === 0) return [];
  const profileId = await resolveCurrentUserId();
  const uniqueIds = [...new Set(commentIds)];
  const { data, error } = await supabase()
    .from(TABLES.commentLikes)
    .select("comment_id")
    .eq("profile_id", profileId)
    .in("comment_id", uniqueIds);
  if (error) throw error;
  return (data ?? []).map((r) => r.comment_id);
}

export const commentLikesService = {
  toggleLike,
  getLikedCommentIds,
};
