import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";

interface SessionResult {
  response: NextResponse;
  user: User | null;
}

/**
 * Refreshes the Supabase session on every request and forwards
 * updated cookies to the response. Returns both the response
 * and the authenticated user (or null) so the caller can
 * make routing decisions without a second auth call.
 */
export async function updateSession(
  request: NextRequest
): Promise<SessionResult> {
  const { url, anonKey } = getSupabaseEnv();

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response: supabaseResponse, user };
}
