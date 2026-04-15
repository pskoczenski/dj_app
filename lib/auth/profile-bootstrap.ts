import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { isProfileType } from "@/lib/constants/profile-types";
import { generateUniqueSlug } from "@/lib/utils/slug";
import type { ProfileType } from "@/types";
import { DEFAULT_SIGNUP_CITY_ID } from "@/lib/db/default-city";

/** Display name + profile type from auth user metadata (same defaults as login/signup). */
export function profileDefaultsFromAuthUser(user: User): {
  displayName: string;
  profileType: ProfileType;
} {
  const metadata = (user.user_metadata ?? {}) as {
    display_name?: string;
    profile_type?: string;
  };
  const displayName =
    metadata.display_name ||
    user.email?.split("@")[0] ||
    "New User";
  const pt = metadata.profile_type;
  const profileType: ProfileType = isProfileType(pt) ? pt : "dj";
  return { displayName, profileType };
}

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
    city_id: DEFAULT_SIGNUP_CITY_ID,
  });

  if (insertError) throw insertError;
}
