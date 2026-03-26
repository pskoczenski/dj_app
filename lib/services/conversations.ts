import { createClient } from "@/lib/supabase/client";
import { TABLES } from "@/lib/db/schema-constants";
import type {
  ConversationInboxItem,
  ConversationParticipant,
  Profile,
} from "@/types";

export const CONVERSATIONS_POLL_INTERVAL_MS = 30_000;

function supabase() {
  return createClient();
}

async function resolveCurrentUserId(currentUserId?: string): Promise<string> {
  if (currentUserId) return currentUserId;
  const {
    data: { user },
    error,
  } = await supabase().auth.getUser();
  if (error) throw error;
  if (!user) throw new Error("Authentication required.");
  return user.id;
}

export async function getInbox(
  currentUserId?: string,
): Promise<ConversationInboxItem[]> {
  const userId = await resolveCurrentUserId(currentUserId);

  const { data: cpRows, error: cpError } = await supabase()
    .from(TABLES.conversationParticipants)
    .select(
      "conversation_id,last_read_at,conversation:conversations(id,type,event_id,updated_at,created_by,event:events(id,title,flyer_image_url))",
    )
    .eq("profile_id", userId);
  if (cpError) throw cpError;

  const rows = cpRows ?? [];
  const conversationIds = rows.map((r) => r.conversation_id);
  if (conversationIds.length === 0) return [];

  const { data: messageRows, error: msgError } = await supabase()
    .from(TABLES.messages)
    .select("conversation_id,body,sender_id,created_at")
    .in("conversation_id", conversationIds)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (msgError) throw msgError;

  const lastMessageByConversation = new Map<
    string,
    { body: string; sender_id: string; created_at: string | null }
  >();
  for (const m of messageRows ?? []) {
    if (!lastMessageByConversation.has(m.conversation_id)) {
      lastMessageByConversation.set(m.conversation_id, {
        body: m.body,
        sender_id: m.sender_id,
        created_at: m.created_at,
      });
    }
  }

  const lastReadByConversation = new Map<string, string | null>();
  for (const row of rows) {
    lastReadByConversation.set(row.conversation_id, row.last_read_at ?? null);
  }

  const unreadCountByConversation = new Map<string, number>();
  for (const m of messageRows ?? []) {
    if (m.sender_id === userId) continue;
    const lastReadAt = lastReadByConversation.get(m.conversation_id);
    const isUnread =
      !lastReadAt ||
      new Date(m.created_at ?? 0).getTime() > new Date(lastReadAt).getTime();
    if (!isUnread) continue;
    unreadCountByConversation.set(
      m.conversation_id,
      (unreadCountByConversation.get(m.conversation_id) ?? 0) + 1,
    );
  }

  const { data: participantRows, error: participantsError } = await supabase()
    .from(TABLES.conversationParticipants)
    .select(
      "conversation_id,profile:profiles(id,display_name,slug,profile_image_url)",
    )
    .in("conversation_id", conversationIds);
  if (participantsError) throw participantsError;

  const participantsByConversation = new Map<
    string,
    Pick<Profile, "id" | "display_name" | "slug" | "profile_image_url">[]
  >();
  for (const row of (participantRows ?? []) as Array<{
    conversation_id: string;
    profile: Pick<Profile, "id" | "display_name" | "slug" | "profile_image_url"> | null;
  }>) {
    if (!row.profile) continue;
    const arr = participantsByConversation.get(row.conversation_id) ?? [];
    arr.push(row.profile);
    participantsByConversation.set(row.conversation_id, arr);
  }

  const result: ConversationInboxItem[] = rows.map((row) => {
    const conv = row.conversation as {
      id: string;
      type: "dm" | "event_group";
      event_id: string | null;
      updated_at: string | null;
      event?: { id: string; title: string; flyer_image_url: string | null } | null;
    } | null;
    if (!conv) {
      throw new Error(`Conversation ${row.conversation_id} not found.`);
    }
    const participants = participantsByConversation.get(conv.id) ?? [];
    const otherParticipant =
      conv.type === "dm"
        ? participants.find((p) => p.id !== userId) ?? null
        : null;

    return {
      id: conv.id,
      type: conv.type,
      event_id: conv.event_id,
      updated_at: conv.updated_at,
      lastMessage: lastMessageByConversation.get(conv.id) ?? null,
      unreadCount: unreadCountByConversation.get(conv.id) ?? 0,
      otherParticipant,
      event: conv.event ?? null,
    };
  });

  return result.sort(
    (a, b) =>
      new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime(),
  );
}

export async function getOrCreateDM(otherUserId: string): Promise<string> {
  const { data, error } = await supabase().rpc("get_or_create_dm", {
    other_user_id: otherUserId,
  });
  if (error) throw error;
  return data;
}

export async function createEventGroupThread(
  eventId: string,
  currentUserId?: string,
): Promise<string> {
  const userId = await resolveCurrentUserId(currentUserId);
  const sb = supabase();

  const { data: existing, error: existingErr } = await sb
    .from(TABLES.conversations)
    .select("id")
    .eq("type", "event_group")
    .eq("event_id", eventId)
    .maybeSingle();
  if (existingErr) throw existingErr;
  if (existing?.id) return existing.id;

  const { data: created, error: createErr } = await sb
    .from(TABLES.conversations)
    .insert({
      type: "event_group",
      event_id: eventId,
      created_by: userId,
    })
    .select("id")
    .single();

  if (createErr) {
    if ((createErr as { code?: string }).code === "23505") {
      const { data: raceRow, error: raceErr } = await sb
        .from(TABLES.conversations)
        .select("id")
        .eq("type", "event_group")
        .eq("event_id", eventId)
        .single();
      if (raceErr) throw raceErr;
      return raceRow.id;
    }
    throw createErr;
  }

  const { data: lineupRows, error: lineupErr } = await sb
    .from(TABLES.eventLineup)
    .select("profile_id")
    .eq("event_id", eventId);
  if (lineupErr) throw lineupErr;

  const participantIds = new Set<string>([userId]);
  for (const row of lineupRows ?? []) participantIds.add(row.profile_id);

  const inserts = [...participantIds].map((profileId) => ({
    conversation_id: created.id,
    profile_id: profileId,
  }));
  const { error: participantsErr } = await sb
    .from(TABLES.conversationParticipants)
    .upsert(inserts, {
      onConflict: "conversation_id,profile_id",
      ignoreDuplicates: true,
    });
  if (participantsErr) throw participantsErr;

  return created.id;
}

export async function getParticipants(
  conversationId: string,
): Promise<
  Pick<Profile, "id" | "display_name" | "slug" | "profile_image_url">[]
> {
  const { data, error } = await supabase()
    .from(TABLES.conversationParticipants)
    .select("profile:profiles(id,display_name,slug,profile_image_url)")
    .eq("conversation_id", conversationId);
  if (error) throw error;

  return (data ?? [])
    .map(
      (row) =>
        (row as unknown as {
          profile: Pick<Profile, "id" | "display_name" | "slug" | "profile_image_url"> | null;
        }).profile,
    )
    .filter((p): p is Pick<Profile, "id" | "display_name" | "slug" | "profile_image_url"> => Boolean(p));
}

export async function markAsRead(
  conversationId: string,
  currentUserId?: string,
): Promise<void> {
  const userId = await resolveCurrentUserId(currentUserId);
  const { error } = await supabase()
    .from(TABLES.conversationParticipants)
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("profile_id", userId);
  if (error) throw error;
}

export const conversationsService = {
  getInbox,
  getOrCreateDM,
  createEventGroupThread,
  getParticipants,
  markAsRead,
};
