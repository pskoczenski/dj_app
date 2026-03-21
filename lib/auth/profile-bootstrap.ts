import { createClient } from "@/lib/supabase/client";
import { generateUniqueSlug } from "@/lib/utils/slug";
import type { ProfileType } from "@/types";

export async function ensureProfileForUser({
  userId,
  displayName,
  profileType,
}: {
  userId: string;
  displayName: string;
  profileType: ProfileType;
}) {
  const supabase = createClient();

  const { data: existing, error: existingError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) return;

  const safeName = displayName.trim() || "New User";
  const slug = await generateUniqueSlug(safeName);

  const { error: insertError } = await supabase.from("profiles").insert({
    id: userId,
    display_name: safeName,
    slug,
    profile_type: profileType,
  });

  if (insertError) throw insertError;
}
