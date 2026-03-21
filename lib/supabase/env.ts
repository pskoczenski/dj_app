/**
 * Runtime validation for Supabase environment variables.
 * Throws immediately if required keys are missing so errors surface
 * at startup rather than on the first Supabase call.
 *
 * Supports both Supabase naming conventions:
 * - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (recommended in Supabase docs)
 * - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY (Connect dialog)
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY (legacy anon key)
 */
export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL — add it to .env.local (see .env.local.example)"
    );
  }

  if (!publishableKey) {
    throw new Error(
      "Missing Supabase publishable key — add one of NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY, or NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local"
    );
  }

  return { url, anonKey: publishableKey };
}
