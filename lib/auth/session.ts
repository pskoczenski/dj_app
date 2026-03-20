import { createClient } from "@/lib/supabase/server";

/**
 * Get the authenticated user in a Server Component or Route Handler.
 * Returns null when there is no valid session.
 */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
