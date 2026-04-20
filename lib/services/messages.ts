import { createClient } from "@/lib/supabase/client";
import { TABLES } from "@/lib/db/schema-constants";
import { conversationsService } from "@/lib/services/conversations";
import type { MessageWithSender } from "@/types";

export const DEFAULT_MESSAGES_PAGE_SIZE = 30;

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

export async function getMessages(
  conversationId: string,
  options: { limit?: number; before?: string } = {},
): Promise<MessageWithSender[]> {
  const limit = options.limit ?? DEFAULT_MESSAGES_PAGE_SIZE;
  let query = supabase()
    .from(TABLES.messages)
    .select(
      "*, sender:profiles!messages_sender_id_fkey(id,display_name,slug,profile_image_url)",
    )
    .eq("conversation_id", conversationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (options.before) {
    query = query.lt("created_at", options.before);
  }

  query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as MessageWithSender[];
}

/** Single message with sender embed — used for incremental Realtime merge without refetching the full page. */
export async function getMessageWithSender(
  messageId: string,
): Promise<MessageWithSender | null> {
  const { data, error } = await supabase()
    .from(TABLES.messages)
    .select(
      "*, sender:profiles!messages_sender_id_fkey(id,display_name,slug,profile_image_url)",
    )
    .eq("id", messageId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as MessageWithSender | null;
}

export async function send(
  conversationId: string,
  body: string,
  currentUserId?: string,
): Promise<MessageWithSender> {
  const senderId = await resolveCurrentUserId(currentUserId);
  const trimmed = body.trim();
  if (!trimmed) throw new Error("Message cannot be empty.");

  const { data, error } = await supabase()
    .from(TABLES.messages)
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      body: trimmed,
    })
    // Avoid requesting embedded sender profile data as part of the insert+RETURNING request.
    // Embedded selects can fail (RLS/policy edge-cases) and surface as 500s, even though the
    // underlying message insert may be fine.
    .select("id,conversation_id,sender_id,body,created_at,deleted_at")
    .single();
  if (error) throw error;

  await conversationsService.markAsRead(conversationId, senderId);

  return {
    ...(data as MessageWithSender),
    sender: null,
  };
}

export async function deleteMessage(messageId: string): Promise<void> {
  const { error } = await supabase()
    .from(TABLES.messages)
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", messageId);
  if (error) throw error;
}

export const messagesService = {
  getMessages,
  getMessageWithSender,
  send,
  deleteMessage,
};
