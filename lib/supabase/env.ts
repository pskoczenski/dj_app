/**
 * Runtime validation for Supabase environment variables.
 * Throws immediately if required keys are missing so errors surface
 * at startup rather than on the first Supabase call.
 */
export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL — add it to .env.local (see .env.local.example)"
    );
  }

  if (!anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY — add it to .env.local (see .env.local.example)"
    );
  }

  return { url, anonKey };
}
