import { createClient } from "@/lib/supabase/client";
import { TABLES } from "@/lib/db/schema-constants";

type ExportedPrivacyData = {
  exportedAt: string;
  profile: Record<string, unknown> | null;
  events: Record<string, unknown>[];
  mixes: Record<string, unknown>[];
  comments: Record<string, unknown>[];
  messages: Record<string, unknown>[];
};

function supabase() {
  return createClient();
}

async function requireUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase().auth.getUser();
  if (error) throw error;
  if (!user) throw new Error("Authentication required.");
  return user.id;
}

export async function exportMyData(): Promise<ExportedPrivacyData> {
  const userId = await requireUserId();
  const sb = supabase();

  const [{ data: profile, error: profileErr }, eventsRes, mixesRes, commentsRes, messagesRes] =
    await Promise.all([
      sb
        .from(TABLES.profiles)
        .select("*")
        .eq("id", userId)
        .maybeSingle(),
      sb
        .from(TABLES.events)
        .select("*")
        .eq("created_by", userId)
        .is("deleted_at", null),
      sb
        .from(TABLES.mixes)
        .select("*")
        .eq("profile_id", userId)
        .is("deleted_at", null),
      sb
        .from(TABLES.comments)
        .select("*")
        .eq("profile_id", userId)
        .is("deleted_at", null),
      sb
        .from(TABLES.messages)
        .select("*")
        .eq("sender_id", userId)
        .is("deleted_at", null),
    ]);

  if (profileErr) throw profileErr;
  if (eventsRes.error) throw eventsRes.error;
  if (mixesRes.error) throw mixesRes.error;
  if (commentsRes.error) throw commentsRes.error;
  if (messagesRes.error) throw messagesRes.error;

  return {
    exportedAt: new Date().toISOString(),
    profile: (profile as Record<string, unknown> | null) ?? null,
    events: (eventsRes.data ?? []) as Record<string, unknown>[],
    mixes: (mixesRes.data ?? []) as Record<string, unknown>[],
    comments: (commentsRes.data ?? []) as Record<string, unknown>[],
    messages: (messagesRes.data ?? []) as Record<string, unknown>[],
  };
}

export async function deleteMyAccount(): Promise<void> {
  const userId = await requireUserId();
  const sb = supabase();
  const now = new Date().toISOString();

  const softDelete = (table: string, column: string) =>
    sb.from(table).update({ deleted_at: now }).eq(column, userId);

  const hardDeleteByProfileId = (table: string) =>
    sb.from(table).delete().eq("profile_id", userId);

  const results = await Promise.all([
    // Soft deletes
    softDelete(TABLES.profiles, "id"),
    softDelete(TABLES.events, "created_by"),
    softDelete(TABLES.mixes, "profile_id"),
    softDelete(TABLES.messages, "sender_id"),
    softDelete(TABLES.comments, "profile_id"),

    // Hard deletes (per repo convention)
    sb.from(TABLES.follows).delete().or(`follower_id.eq.${userId},following_id.eq.${userId}`),
    hardDeleteByProfileId(TABLES.commentLikes),
    hardDeleteByProfileId(TABLES.mixLikes),
    hardDeleteByProfileId(TABLES.eventLikes),
    hardDeleteByProfileId(TABLES.eventSaves),
    hardDeleteByProfileId(TABLES.conversationParticipants),
    sb.from(TABLES.eventLineup).delete().eq("profile_id", userId),
  ]);

  for (const r of results) {
    if (r.error) throw r.error;
  }

  const { error: signOutErr } = await sb.auth.signOut();
  if (signOutErr) throw signOutErr;
}

export const privacyService = {
  exportMyData,
  deleteMyAccount,
};

