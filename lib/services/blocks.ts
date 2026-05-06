import { createClient } from "@/lib/supabase/client";
import { TABLES } from "@/lib/db/schema-constants";

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

export type BlockStatus = {
  blockedByMe: boolean;
  blockedMe: boolean;
};

export async function getMyBlocks(): Promise<string[]> {
  const userId = await requireUserId();
  const { data, error } = await supabase()
    .from(TABLES.blocks)
    .select("blocked_id")
    .eq("blocker_id", userId);
  if (error) throw error;
  return (data ?? []).map((r) => r.blocked_id as string);
}

export async function getBlockStatus(otherUserId: string): Promise<BlockStatus> {
  const userId = await requireUserId();
  if (otherUserId === userId) return { blockedByMe: false, blockedMe: false };

  const [blockedByMe, blockedMe] = await Promise.all([
    supabase()
      .from(TABLES.blocks)
      .select("id")
      .eq("blocker_id", userId)
      .eq("blocked_id", otherUserId)
      .maybeSingle(),
    supabase()
      .from(TABLES.blocks)
      .select("id")
      .eq("blocker_id", otherUserId)
      .eq("blocked_id", userId)
      .maybeSingle(),
  ]);

  // `blockedMe` may be blocked by RLS (no row returned). Treat that as false,
  // and rely on DB enforcement for DM creation / message send.
  if (blockedByMe.error) throw blockedByMe.error;
  if (blockedMe.error) return { blockedByMe: Boolean(blockedByMe.data), blockedMe: false };

  return { blockedByMe: Boolean(blockedByMe.data), blockedMe: Boolean(blockedMe.data) };
}

export async function blockUser(blockedId: string): Promise<void> {
  const userId = await requireUserId();
  if (blockedId === userId) throw new Error("You can't block yourself.");

  const { error } = await supabase().from(TABLES.blocks).insert({
    blocker_id: userId,
    blocked_id: blockedId,
  });
  if (error) throw error;
}

export async function unblockUser(blockedId: string): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase()
    .from(TABLES.blocks)
    .delete()
    .eq("blocker_id", userId)
    .eq("blocked_id", blockedId);
  if (error) throw error;
}

export const blocksService = {
  getMyBlocks,
  getBlockStatus,
  blockUser,
  unblockUser,
};

